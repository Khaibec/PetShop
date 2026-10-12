import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Conversation, Message, UserTypingEvent, ConversationFilter } from '../models/chat.model';
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/conversations`;
  private readonly hubUrl = `${environment.apiUrl.replace('/api', '')}/hubs/chat`;

  private hubConnection: signalR.HubConnection | null = null;
  private isConnecting: boolean = false;

  // Subjects
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private activeConversationSubject = new BehaviorSubject<Conversation | null>(null);
  public activeConversation$ = this.activeConversationSubject.asObservable();

  private activeMessagesSubject = new BehaviorSubject<Message[]>([]);
  public activeMessages$ = this.activeMessagesSubject.asObservable();

  private typingUsersSubject = new BehaviorSubject<Map<number, string>>(new Map());
  public typingUsers$ = this.typingUsersSubject.asObservable();

  private connectionStateSubject = new BehaviorSubject<string>('Disconnected');
  public connectionState$ = this.connectionStateSubject.asObservable();

  // Realtime notification event subjects
  public messageReceived$ = new Subject<Message>();
  public conversationUpdated$ = new Subject<Conversation>();
  public openChatRequested$ = new Subject<void>();

  public requestOpenChat(): void {
    if (this.authService.isAdmin) {
      return;
    }
    this.openChatRequested$.next();
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Tự động kết nối/ngắt kết nối theo trạng thái đăng nhập
    this.authService.currentUser$.subscribe(user => {
      if (user && user.token) {
        this.startSignalRConnection();
        this.refreshUnreadCount();
      } else {
        this.stopSignalRConnection();
        this.unreadCountSubject.next(0);
        this.activeConversationSubject.next(null);
        this.activeMessagesSubject.next([]);
      }
    });
  }

  // ==========================================
  // SIGNALR REALTIME
  // ==========================================

  public async startSignalRConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.isConnecting = true;

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => this.authService.getToken() || '',
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.registerSignalREvents();

      await this.hubConnection.start();
      this.connectionStateSubject.next('Connected');
      this.isConnecting = false;

      // Nếu đang mở một conversation, tự động join group lại
      const currentConv = this.activeConversationSubject.value;
      if (currentConv) {
        this.joinConversation(currentConv.id);
      }
    } catch (error) {
      console.warn('Lỗi kết nối SignalR ChatHub:', error);
      this.connectionStateSubject.next('Error');
      this.isConnecting = false;
    }
  }

  public async stopSignalRConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (err) {
        // ignore
      }
      this.hubConnection = null;
      this.connectionStateSubject.next('Disconnected');
    }
  }

  private registerSignalREvents(): CortinaEvents | void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting(() => {
      this.connectionStateSubject.next('Reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStateSubject.next('Connected');
      const currentConv = this.activeConversationSubject.value;
      if (currentConv) {
        this.joinConversation(currentConv.id);
      }
    });

    this.hubConnection.onclose(() => {
      this.connectionStateSubject.next('Disconnected');
    });

    // 1. Nhận tin nhắn mới
    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      const currentConv = this.activeConversationSubject.value;
      const currentUserId = this.authService.currentUserValue?.userId;

      message.isMine = message.senderId === currentUserId;

      if (currentConv && currentConv.id === message.conversationId) {
        const list = [...this.activeMessagesSubject.value];
        // Tránh trùng lặp nếu message đã có (do optimistically add)
        if (!list.some(m => m.id === message.id)) {
          list.push(message);
          this.activeMessagesSubject.next(list);
        }

        // Nếu người khác gửi tới trong khi đang xem hội thoại, tự động đánh dấu đã đọc
        if (!message.isMine) {
          this.markAsRead(currentConv.id).subscribe();
        }
      }

      if (!message.isMine) {
        this.refreshUnreadCount();
      }

      this.messageReceived$.next(message);
    });

    // 2. Nhận sự kiện đã đọc tin nhắn
    this.hubConnection.on('MessageRead', (data: { conversationId: number; readerId: number; readAt: string }) => {
      const currentConv = this.activeConversationSubject.value;
      if (currentConv && currentConv.id === data.conversationId) {
        const updatedList = this.activeMessagesSubject.value.map(m => {
          if (m.senderId !== data.readerId && !m.readAt) {
            return { ...m, isRead: true, readAt: data.readAt };
          }
          return m;
        });
        this.activeMessagesSubject.next(updatedList);
      }

      this.refreshUnreadCount();
    });

    // 3. Hội thoại được cập nhật
    this.hubConnection.on('ConversationUpdated', (conversation: Conversation) => {
      const currentConv = this.activeConversationSubject.value;
      if (currentConv && currentConv.id === conversation.id) {
        this.activeConversationSubject.next({
          ...currentConv,
          status: conversation.status,
          updatedAt: conversation.updatedAt,
          lastMessageAt: conversation.lastMessageAt,
          adminId: conversation.adminId,
          adminName: conversation.adminName
        });
      }

      this.refreshUnreadCount();
      this.conversationUpdated$.next(conversation);
    });

    // 4. Typing indicators
    this.hubConnection.on('UserTyping', (data: UserTypingEvent) => {
      const currentConv = this.activeConversationSubject.value;
      if (currentConv && currentConv.id === data.conversationId) {
        const map = new Map(this.typingUsersSubject.value);
        map.set(data.userId, data.userName);
        this.typingUsersSubject.next(map);
      }
    });

    this.hubConnection.on('UserStoppedTyping', (data: { conversationId: number; userId: number }) => {
      const currentConv = this.activeConversationSubject.value;
      if (currentConv && currentConv.id === data.conversationId) {
        const map = new Map(this.typingUsersSubject.value);
        map.delete(data.userId);
        this.typingUsersSubject.next(map);
      }
    });
  }

  public joinConversation(conversationId: number): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinConversation', conversationId).catch(err => {
        console.warn('Lỗi JoinConversation SignalR:', err);
      });
    }
  }

  public leaveConversation(conversationId: number): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LeaveConversation', conversationId).catch(err => {
        console.warn('Lỗi LeaveConversation SignalR:', err);
      });
    }
  }

  public sendTyping(conversationId: number, isTyping: boolean): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendTyping', conversationId, isTyping).catch(() => {});
    }
  }

  // ==========================================
  // REST APIS
  // ==========================================

  public getConversations(filter?: ConversationFilter): Observable<Conversation[]> {
    let params = new HttpParams();
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.unreadOnly !== undefined) params = params.set('unreadOnly', filter.unreadOnly.toString());
    if (filter?.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
    if (filter?.pageSize) params = params.set('pageSize', filter.pageSize.toString());

    return this.http.get<Conversation[]>(this.apiUrl, { params });
  }

  public getConversationById(id: number): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.apiUrl}/${id}`);
  }

  public createOrGetActiveConversation(initialMessage?: string): Observable<Conversation> {
    return this.http.post<Conversation>(this.apiUrl, { initialMessage }).pipe(
      tap(conv => {
        this.setActiveConversation(conv);
      })
    );
  }

  public getMessages(conversationId: number, page: number = 1, pageSize: number = 50): Observable<PagedResult<Message>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<Message>>(`${this.apiUrl}/${conversationId}/messages`, { params }).pipe(
      tap(res => {
        const currentUserId = this.authService.currentUserValue?.userId;
        const messages = (res.items || []).map(m => ({
          ...m,
          isMine: m.senderId === currentUserId
        }));
        this.activeMessagesSubject.next(messages);
      })
    );
  }

  public sendMessage(conversationId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${conversationId}/messages`, { content }).pipe(
      tap(newMsg => {
        const currentUserId = this.authService.currentUserValue?.userId;
        newMsg.isMine = newMsg.senderId === currentUserId;

        // Optimistically add to active messages if in current conversation
        const currentConv = this.activeConversationSubject.value;
        if (currentConv && currentConv.id === conversationId) {
          const list = [...this.activeMessagesSubject.value];
          if (!list.some(m => m.id === newMsg.id)) {
            list.push(newMsg);
            this.activeMessagesSubject.next(list);
          }
        }
      })
    );
  }

  public markAsRead(conversationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${conversationId}/read`, {}).pipe(
      tap(() => {
        // Cập nhật local unread
        this.refreshUnreadCount();
      })
    );
  }

  public closeConversation(conversationId: number): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.apiUrl}/${conversationId}/close`, {}).pipe(
      tap(updated => {
        const current = this.activeConversationSubject.value;
        if (current && current.id === conversationId) {
          this.activeConversationSubject.next({ ...current, status: 'Closed' });
        }
      })
    );
  }

  public reopenConversation(conversationId: number): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.apiUrl}/${conversationId}/reopen`, {}).pipe(
      tap(updated => {
        const current = this.activeConversationSubject.value;
        if (current && current.id === conversationId) {
          this.activeConversationSubject.next({ ...current, status: 'Open' });
        }
      })
    );
  }

  public refreshUnreadCount(): void {
    if (!this.authService.currentUserValue) {
      this.unreadCountSubject.next(0);
      return;
    }

    this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`).pipe(
      catchError(() => of({ unreadCount: 0 }))
    ).subscribe(res => {
      this.unreadCountSubject.next(res.unreadCount || 0);
    });
  }

  public setActiveConversation(conversation: Conversation | null): void {
    const previous = this.activeConversationSubject.value;
    if (previous && (!conversation || previous.id !== conversation.id)) {
      this.leaveConversation(previous.id);
    }

    this.activeConversationSubject.next(conversation);
    this.typingUsersSubject.next(new Map());

    if (conversation) {
      this.joinConversation(conversation.id);
      this.getMessages(conversation.id).subscribe();
      this.markAsRead(conversation.id).subscribe();
    } else {
      this.activeMessagesSubject.next([]);
    }
  }
}

type CortinaEvents = void;
