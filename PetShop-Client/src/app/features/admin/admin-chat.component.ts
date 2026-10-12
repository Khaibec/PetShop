import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Conversation, Message, ConversationFilter } from '../../core/models/chat.model';

@Component({
  selector: 'app-admin-chat',
  template: `
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      <div class="admin-chat-layout">
        
        <!-- =================== CỘT TRÁI: DANH SÁCH HỘI THOẠI =================== -->
        <div class="conv-sidebar border-end">
          
          <!-- Search & Filter -->
          <div class="p-3 border-bottom bg-light">
            <div class="input-group input-group-sm mb-2 rounded-pill overflow-hidden border bg-white">
              <span class="input-group-text bg-white border-0 text-muted ps-3">
                <i class="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                type="text"
                class="form-control border-0 shadow-none ps-2"
                placeholder="Tìm khách hàng, email..."
                [(ngModel)]="searchKeyword"
                (ngModelChange)="onFilterChanged()"
              />
              <button *ngIf="searchKeyword" class="btn btn-link text-muted pe-3 py-0" (click)="searchKeyword = ''; onFilterChanged()">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Filter Status Tabs -->
            <div class="d-flex gap-1 overflow-auto filter-pills">
              <button
                type="button"
                class="btn btn-sm rounded-pill filter-btn"
                [class.btn-dark]="selectedStatus === '' && !unreadOnly"
                [class.btn-outline-secondary]="selectedStatus !== '' || unreadOnly"
                (click)="setStatusFilter('')"
              >
                Tất cả
              </button>
              <button
                type="button"
                class="btn btn-sm rounded-pill filter-btn"
                [class.btn-danger]="unreadOnly"
                [class.btn-outline-secondary]="!unreadOnly"
                (click)="toggleUnreadFilter()"
              >
                <i class="fa-solid fa-envelope me-1"></i> Chưa đọc
              </button>
              <button
                type="button"
                class="btn btn-sm rounded-pill filter-btn"
                [class.btn-success]="selectedStatus === 'Open' && !unreadOnly"
                [class.btn-outline-secondary]="selectedStatus !== 'Open' || unreadOnly"
                (click)="setStatusFilter('Open')"
              >
                Đang mở
              </button>
              <button
                type="button"
                class="btn btn-sm rounded-pill filter-btn"
                [class.btn-secondary]="selectedStatus === 'Closed' && !unreadOnly"
                [class.btn-outline-secondary]="selectedStatus !== 'Closed' || unreadOnly"
                (click)="setStatusFilter('Closed')"
              >
                Đã đóng
              </button>
            </div>
          </div>

          <!-- Danh sách hội thoại -->
          <div class="conv-list">
            
            <div *ngIf="isLoadingList" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
              <div class="small text-muted mt-2">Đang tải hội thoại...</div>
            </div>

            <div *ngIf="!isLoadingList && conversations.length === 0" class="text-center py-5 px-3 text-muted">
              <i class="fa-solid fa-comments fa-2x mb-2 text-muted opacity-50"></i>
              <div class="small">Không tìm thấy hội thoại nào phù hợp.</div>
            </div>

            <div
              *ngFor="let conv of conversations"
              class="conv-item d-flex align-items-center gap-3 p-3 border-bottom"
              [class.active]="selectedConversation?.id === conv.id"
              [class.has-unread]="conv.unreadCount > 0"
              (click)="selectConversation(conv)"
            >
              <!-- Avatar -->
              <div class="position-relative flex-shrink-0">
                <div class="user-avatar" [ngClass]="getAvatarColor(conv.customerId)">
                  {{ conv.customerName.charAt(0).toUpperCase() }}
                </div>
                <span *ngIf="conv.status === 'Open'" class="online-indicator"></span>
              </div>

              <!-- Content snippet -->
              <div class="flex-grow-1 overflow-hidden">
                <div class="d-flex justify-content-between align-items-baseline mb-1">
                  <h6 class="mb-0 text-truncate fw-semibold" [class.fw-bold]="conv.unreadCount > 0">
                    {{ conv.customerName }}
                  </h6>
                  <small class="conv-time ms-2 text-nowrap">
                    {{ formatListTime(conv.lastMessageAt) }}
                  </small>
                </div>

                <div class="d-flex justify-content-between align-items-center">
                  <div class="small text-truncate text-muted conv-snippet" [class.fw-bold]="conv.unreadCount > 0" [class.text-dark]="conv.unreadCount > 0">
                    <span *ngIf="conv.lastMessageSenderRole === 'Admin'" class="text-primary me-1">Bạn:</span>
                    {{ conv.lastMessageContent || 'Bắt đầu cuộc trò chuyện...' }}
                  </div>
                  
                  <span *ngIf="conv.unreadCount > 0" class="badge bg-danger rounded-pill ms-2 flex-shrink-0">
                    {{ conv.unreadCount }}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- =================== CỘT PHẢI: KHUNG CHAT CHI TIẾT =================== -->
        <div class="chat-main d-flex flex-column">

          <!-- Chưa chọn hội thoại -->
          <div *ngIf="!selectedConversation" class="h-100 d-flex flex-column align-items-center justify-content-center text-muted p-5">
            <div class="empty-chat-icon mb-3">
              <i class="fa-solid fa-comment-dots fa-4x text-muted opacity-25"></i>
            </div>
            <h5 class="fw-semibold">Chọn một hội thoại để trả lời</h5>
            <p class="small text-muted" style="max-width: 320px; text-align: center;">
              Chọn cuộc trò chuyện bên cột trái để trao đổi, tư vấn và hỗ trợ khách hàng theo thời gian thực.
            </p>
          </div>

          <!-- Đang xem hội thoại -->
          <ng-container *ngIf="selectedConversation">
            
            <!-- Chat Header -->
            <div class="chat-main-header d-flex align-items-center justify-content-between p-3 border-bottom bg-white">
              <div class="d-flex align-items-center gap-3">
                <div class="user-avatar" [ngClass]="getAvatarColor(selectedConversation.customerId)">
                  {{ selectedConversation.customerName.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h6 class="mb-0 fw-bold">{{ selectedConversation.customerName }}</h6>
                  <div class="small text-muted d-flex align-items-center gap-2">
                    <span><i class="fa-solid fa-envelope me-1"></i>{{ selectedConversation.customerEmail }}</span>
                    <span>•</span>
                    <span class="badge" [ngClass]="selectedConversation.status === 'Open' ? 'bg-success' : 'bg-secondary'">
                      {{ selectedConversation.status === 'Open' ? 'Đang mở' : 'Đã đóng' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Header Controls -->
              <div class="d-flex align-items-center gap-2">
                <button
                  *ngIf="selectedConversation.status === 'Open'"
                  class="btn btn-outline-danger btn-sm rounded-pill px-3"
                  (click)="closeConversation()"
                  title="Đóng phiên hỗ trợ này"
                >
                  <i class="fa-solid fa-lock me-1"></i> Đóng hội thoại
                </button>

                <button
                  *ngIf="selectedConversation.status === 'Closed'"
                  class="btn btn-outline-success btn-sm rounded-pill px-3"
                  (click)="reopenConversation()"
                  title="Mở lại phiên hỗ trợ"
                >
                  <i class="fa-solid fa-lock-open me-1"></i> Mở lại
                </button>
              </div>
            </div>

            <!-- Chat Messages Container -->
            <div class="chat-messages-wrap flex-grow-1 p-3 overflow-auto" #messagesContainer>
              
              <div *ngIf="isLoadingMessages" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                <div class="small text-muted mt-2">Đang tải tin nhắn...</div>
              </div>

              <!-- Messages List -->
              <ng-container *ngIf="!isLoadingMessages">
                <div *ngFor="let msg of messages" class="admin-msg-row" [class.mine]="msg.isMine">
                  
                  <div *ngIf="!msg.isMine" class="user-avatar-mini" [ngClass]="getAvatarColor(selectedConversation.customerId)">
                    {{ selectedConversation.customerName.charAt(0).toUpperCase() }}
                  </div>

                  <div class="msg-box" [class.msg-box-admin]="msg.isMine" [class.msg-box-customer]="!msg.isMine">
                    <div class="msg-sender-name" *ngIf="!msg.isMine">
                      {{ selectedConversation.customerName }}
                    </div>
                    <div class="msg-text">{{ msg.content }}</div>
                    <div class="msg-info">
                      <span>{{ formatMessageTime(msg.createdAt) }}</span>
                      <span *ngIf="msg.isMine" class="ms-1">
                        <i class="fa-solid" [ngClass]="msg.isRead ? 'fa-check-double text-info' : 'fa-check text-white-50'"></i>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Customer is typing -->
                <div *ngIf="isCustomerTyping" class="typing-notice text-muted small py-1 ps-3 d-flex align-items-center gap-2">
                  <span class="dots"><span></span><span></span><span></span></span>
                  <span>{{ selectedConversation.customerName }} đang soạn tin nhắn...</span>
                </div>
              </ng-container>

            </div>

            <!-- Chat Input Footer -->
            <div class="chat-main-footer p-3 border-top bg-white">
              <form (ngSubmit)="onSendMessage()" class="d-flex align-items-center gap-2">
                <input
                  type="text"
                  class="form-control rounded-pill px-3 shadow-none border"
                  placeholder="Nhập câu trả lời tới khách hàng..."
                  [(ngModel)]="replyText"
                  name="replyText"
                  [disabled]="isSending"
                  (input)="onTypingInput()"
                  (blur)="onTypingBlur()"
                  autocomplete="off"
                  maxlength="2000"
                  #replyInputEl
                />
                <button
                  type="submit"
                  class="btn btn-primary rounded-pill px-4 fw-semibold send-btn d-flex align-items-center gap-1"
                  [disabled]="!replyText.trim() || isSending"
                >
                  <i *ngIf="!isSending" class="fa-solid fa-paper-plane"></i>
                  <div *ngIf="isSending" class="spinner-border spinner-border-sm" role="status"></div>
                  <span>Gửi</span>
                </button>
              </form>
            </div>

          </ng-container>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .admin-chat-layout {
      display: flex;
      height: 680px;
    }

    /* Left Sidebar */
    .conv-sidebar {
      width: 340px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    .filter-pills::-webkit-scrollbar {
      display: none;
    }

    .filter-btn {
      font-size: 11.5px;
      padding: 3px 10px;
      white-space: nowrap;
    }

    .conv-list {
      flex: 1;
      overflow-y: auto;
    }

    .conv-item {
      cursor: pointer;
      transition: background 0.15s ease;
      user-select: none;
    }

    .conv-item:hover {
      background: #f8f9fa;
    }

    .conv-item.active {
      background: #eef2ff;
      border-left: 4px solid #4f46e5;
    }

    .user-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 16px;
    }

    .user-avatar-mini {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 12px;
      flex-shrink: 0;
    }

    .online-indicator {
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 11px;
      height: 11px;
      background: #10b981;
      border: 2px solid white;
      border-radius: 50%;
    }

    .conv-time {
      font-size: 11px;
      color: #9ca3af;
    }

    .conv-snippet {
      max-width: 200px;
    }

    /* Right Main Chat */
    .chat-main {
      flex: 1;
      background: #f9fafb;
    }

    .chat-messages-wrap {
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .admin-msg-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 75%;
    }

    .admin-msg-row.mine {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .msg-box {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.45;
      word-break: break-word;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .msg-box-admin {
      background: #4f46e5;
      color: #ffffff;
      border-bottom-right-radius: 2px;
    }

    .msg-box-customer {
      background: #ffffff;
      color: #1f2937;
      border-bottom-left-radius: 2px;
      border: 1px solid #e5e7eb;
    }

    .msg-sender-name {
      font-size: 11px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 2px;
    }

    .msg-info {
      font-size: 10px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 4px;
      opacity: 0.85;
    }

    .msg-box-customer .msg-info {
      color: #6b7280;
    }

    .msg-box-admin .msg-info {
      color: rgba(255, 255, 255, 0.85);
    }

    /* Typing dots */
    .dots span {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #4f46e5;
      margin: 0 1px;
      animation: bounce 1.2s infinite ease-in-out;
    }
    .dots span:nth-child(2) { animation-delay: 0.2s; }
    .dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Color themes for avatars */
    .avatar-blue { background: #3b82f6; }
    .avatar-emerald { background: #10b981; }
    .avatar-amber { background: #f59e0b; }
    .avatar-purple { background: #8b5cf6; }
    .avatar-rose { background: #f43f5e; }

    @media (max-width: 991px) {
      .admin-chat-layout {
        flex-direction: column;
        height: 750px;
      }
      .conv-sidebar {
        width: 100%;
        height: 250px;
      }
      .chat-main {
        flex: 1;
      }
    }
  `]
})
export class AdminChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('replyInputEl') private replyInputEl!: ElementRef;

  public conversations: Conversation[] = [];
  public selectedConversation: Conversation | null = null;
  public messages: Message[] = [];

  public isLoadingList = false;
  public isLoadingMessages = false;
  public isSending = false;
  public isCustomerTyping = false;

  public searchKeyword = '';
  public selectedStatus = '';
  public unreadOnly = false;
  public replyText = '';

  private subs = new Subscription();
  private typingTimeout: any;
  private shouldScrollBottom = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadConversations();

    // Lắng nghe messages realtime
    this.subs.add(
      this.chatService.activeMessages$.subscribe(msgs => {
        this.messages = msgs;
      })
    );

    // Lắng nghe realtime messageReceived để cập nhật list snippet
    this.subs.add(
      this.chatService.messageReceived$.subscribe(msg => {
        const found = this.conversations.find(c => c.id === msg.conversationId);
        if (found) {
          found.lastMessageContent = msg.content;
          found.lastMessageSenderRole = msg.senderRole;
          found.lastMessageAt = msg.createdAt;
          if (this.selectedConversation?.id !== msg.conversationId && msg.senderRole === 'Customer') {
            found.unreadCount += 1;
          }
          // Đưa hội thoại vừa có tin nhắn lên đầu
          this.conversations = [
            found,
            ...this.conversations.filter(c => c.id !== found.id)
          ];
        } else {
          // Hội thoại mới
          this.loadConversations();
        }
      })
    );

    // Lắng nghe conversationUpdated
    this.subs.add(
      this.chatService.conversationUpdated$.subscribe(updated => {
        const idx = this.conversations.findIndex(c => c.id === updated.id);
        if (idx !== -1) {
          this.conversations[idx] = { ...this.conversations[idx], ...updated };
        }
      })
    );

    // Lắng nghe typing
    this.subs.add(
      this.chatService.typingUsers$.subscribe(map => {
        if (this.selectedConversation) {
          this.isCustomerTyping = map.has(this.selectedConversation.customerId);
        }
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  public loadConversations(): void {
    this.isLoadingList = true;
    const filter: ConversationFilter = {
      status: this.selectedStatus || undefined,
      search: this.searchKeyword.trim() || undefined,
      unreadOnly: this.unreadOnly ? true : undefined
    };

    this.chatService.getConversations(filter).subscribe({
      next: list => {
        this.conversations = list;
        this.isLoadingList = false;

        // Nếu đang chọn hội thoại, cập nhật lại dữ liệu
        if (this.selectedConversation) {
          const fresh = list.find(c => c.id === this.selectedConversation?.id);
          if (fresh) {
            this.selectedConversation = fresh;
          }
        }
      },
      error: () => {
        this.isLoadingList = false;
      }
    });
  }

  public selectConversation(conv: Conversation): void {
    if (this.selectedConversation?.id === conv.id) {
      return;
    }

    this.selectedConversation = conv;
    conv.unreadCount = 0; // Đã click vào -> xem như đã đọc
    this.isLoadingMessages = true;
    this.shouldScrollBottom = false;

    this.chatService.setActiveConversation(conv);

    setTimeout(() => {
      this.isLoadingMessages = false;
      // Không tự động focus hoặc scroll để giữ nguyên màn hình cho admin
    }, 150);
  }

  public onSendMessage(): void {
    const text = this.replyText.trim();
    if (!text || !this.selectedConversation || this.isSending) {
      return;
    }

    this.isSending = true;
    this.chatService.sendTyping(this.selectedConversation.id, false);

    this.chatService.sendMessage(this.selectedConversation.id, text).subscribe({
      next: () => {
        this.replyText = '';
        this.isSending = false;
        this.shouldScrollBottom = true;
        setTimeout(() => this.replyInputEl?.nativeElement?.focus({ preventScroll: true }), 50);
      },
      error: () => {
        this.isSending = false;
      }
    });
  }

  public onTypingInput(): void {
    if (!this.selectedConversation) return;

    this.chatService.sendTyping(this.selectedConversation.id, true);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      if (this.selectedConversation) {
        this.chatService.sendTyping(this.selectedConversation.id, false);
      }
    }, 2000);
  }

  public onTypingBlur(): void {
    if (this.selectedConversation) {
      this.chatService.sendTyping(this.selectedConversation.id, false);
    }
  }

  public closeConversation(): void {
    if (!this.selectedConversation) return;

    if (confirm(`Bạn có chắc muốn đóng hội thoại với khách hàng ${this.selectedConversation.customerName}?`)) {
      this.chatService.closeConversation(this.selectedConversation.id).subscribe({
        next: updated => {
          this.selectedConversation = updated;
          const idx = this.conversations.findIndex(c => c.id === updated.id);
          if (idx !== -1) this.conversations[idx] = updated;
        }
      });
    }
  }

  public reopenConversation(): void {
    if (!this.selectedConversation) return;

    this.chatService.reopenConversation(this.selectedConversation.id).subscribe({
      next: updated => {
        this.selectedConversation = updated;
        const idx = this.conversations.findIndex(c => c.id === updated.id);
        if (idx !== -1) this.conversations[idx] = updated;
      }
    });
  }

  public onFilterChanged(): void {
    this.loadConversations();
  }

  public setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.unreadOnly = false;
    this.loadConversations();
  }

  public toggleUnreadFilter(): void {
    this.unreadOnly = !this.unreadOnly;
    this.selectedStatus = '';
    this.loadConversations();
  }

  public getAvatarColor(id: number): string {
    const colors = ['avatar-blue', 'avatar-emerald', 'avatar-amber', 'avatar-purple', 'avatar-rose'];
    return colors[id % colors.length];
  }

  public formatListTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  public formatMessageTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
