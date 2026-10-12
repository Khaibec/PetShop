import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { Conversation, Message } from '../../core/models/chat.model';

@Component({
  selector: 'app-chat-widget',
  template: `
    <!-- 1. Floating Trigger Button (Góc dưới phải màn hình) -->
    <div class="chat-widget-trigger" *ngIf="!isOpen" (click)="openChat()">
      <div class="trigger-icon-wrap">
        <i class="fa-solid fa-comments"></i>
        <span class="unread-badge" *ngIf="(unreadCount$ | async) as count">
          {{ count > 99 ? '99+' : count }}
        </span>
      </div>
      <span class="trigger-label d-none d-sm-inline">Chat với PetShop</span>
    </div>

    <!-- 2. Chat Window Pop-up -->
    <div class="chat-window-backdrop" *ngIf="isOpen" (click)="closeChatBackdrop($event)">
      <div class="chat-window shadow-lg" [class.mobile-full]="isMobileView">
        
        <!-- Header -->
        <div class="chat-header">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-wrap">
              <i class="fa-solid fa-headset fs-5"></i>
              <span class="status-dot"></span>
            </div>
            <div>
              <div class="fw-bold fs-6 text-white text-truncate" style="max-width: 200px;">
                Tư vấn Khách hàng PetShop
              </div>
              <small class="text-white-50 d-flex align-items-center gap-1">
                <i class="fa-solid fa-circle text-success" style="font-size: 8px;"></i>
                Trực tuyến sẵn sàng hỗ trợ
              </small>
            </div>
          </div>

          <div class="header-actions">
            <button type="button" class="btn-icon" (click)="closeChat()" title="Thu nhỏ">
              <i class="fa-solid fa-minus"></i>
            </button>
            <button type="button" class="btn-icon" (click)="closeChat()" title="Đóng">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="chat-body" #messageContainer>
          
          <!-- Trường hợp chưa đăng nhập -->
          <div *ngIf="!(isLoggedIn$ | async)" class="guest-notice text-center p-4">
            <div class="notice-icon mb-3">
              <i class="fa-solid fa-user-lock fa-3x text-warning"></i>
            </div>
            <h6 class="fw-bold mb-2">Đăng nhập để Chat</h6>
            <p class="text-muted small mb-3">
              Vui lòng đăng nhập hoặc tạo tài khoản để nhắn tin trực tiếp với nhân viên tư vấn của PetShop!
            </p>
            <button class="btn btn-primary btn-sm rounded-pill px-4 fw-semibold" (click)="goToLogin()">
              <i class="fa-solid fa-arrow-right-to-bracket me-1"></i> Đăng nhập ngay
            </button>
          </div>

          <!-- Đang tải hội thoại -->
          <div *ngIf="(isLoggedIn$ | async) && isLoading" class="text-center py-5">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <div class="small text-muted">Đang kết nối hội thoại...</div>
          </div>

          <!-- Lịch sử tin nhắn khi đã đăng nhập -->
          <ng-container *ngIf="(isLoggedIn$ | async) && !isLoading">
            
            <!-- Thông báo mở đầu -->
            <div class="welcome-banner text-center my-2 p-2 rounded-3 bg-light text-muted small">
              <i class="fa-solid fa-shield-heart text-danger me-1"></i>
              Chào mừng bạn đến với kênh hỗ trợ PetShop! Đặt câu hỏi để được phản hồi nhanh nhất.
            </div>

            <!-- Danh sách tin nhắn -->
            <div *ngFor="let msg of messages; let i = index" class="message-wrapper" [class.mine]="msg.isMine">
              
              <!-- Avatar người gửi đối diện -->
              <div *ngIf="!msg.isMine" class="msg-avatar">
                <i class="fa-solid fa-shop"></i>
              </div>

              <!-- Bong bóng tin nhắn -->
              <div class="message-bubble" [class.bubble-mine]="msg.isMine" [class.bubble-other]="!msg.isMine">
                <div class="msg-content">{{ msg.content }}</div>
                <div class="msg-meta">
                  <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
                  <span *ngIf="msg.isMine" class="msg-status ms-1">
                    <i class="fa-solid" [ngClass]="msg.isRead ? 'fa-check-double text-info' : 'fa-check text-white-50'"></i>
                  </span>
                </div>
              </div>
            </div>

            <!-- Typing indicator -->
            <div *ngIf="isOtherTyping" class="typing-indicator d-flex align-items-center gap-2 text-muted small py-1 ps-2">
              <span class="dots-animation">
                <span></span><span></span><span></span>
              </span>
              <span>PetShop đang soạn tin nhắn...</span>
            </div>

            <!-- Trạng thái hội thoại bị đóng -->
            <div *ngIf="conversation?.status === 'Closed'" class="closed-banner text-center p-2 my-2 bg-light rounded text-muted small">
              <i class="fa-solid fa-lock text-secondary me-1"></i>
              Hội thoại đã đóng. Gửi tin nhắn mới để tự động mở lại!
            </div>
          </ng-container>
        </div>

        <!-- Footer: Input Bar -->
        <div class="chat-footer" *ngIf="(isLoggedIn$ | async)">
          <form (ngSubmit)="onSendMessage()" class="d-flex align-items-center gap-2">
            <input
              type="text"
              class="form-control form-control-sm chat-input"
              placeholder="Nhập tin nhắn..."
              [(ngModel)]="messageText"
              name="messageText"
              [disabled]="isSending"
              (input)="onInputChange()"
              (blur)="onInputBlur()"
              autocomplete="off"
              maxlength="2000"
              #msgInput
            />
            <button
              type="submit"
              class="btn btn-primary btn-sm send-btn"
              [disabled]="!messageText.trim() || isSending"
              title="Gửi tin nhắn"
            >
              <i *ngIf="!isSending" class="fa-solid fa-paper-plane"></i>
              <div *ngIf="isSending" class="spinner-border spinner-border-sm" role="status"></div>
            </button>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Floating Trigger Button */
    .chat-widget-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1040;

      display: flex;
      align-items: center;
      gap: 10px;

      padding: 10px 18px;
      border-radius: 50px;
      background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
      color: #fff;
      box-shadow: 0 4px 18px rgba(230, 74, 25, 0.38);
      cursor: pointer;
      user-select: none;

      transition: all 0.25s ease;
      font-weight: 600;
      font-size: 14px;
    }

    .chat-widget-trigger:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 6px 22px rgba(230, 74, 25, 0.48);
    }

    .trigger-icon-wrap {
      position: relative;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .unread-badge {
      position: absolute;
      top: -8px;
      right: -10px;
      background: #dc3545;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 12px;
      border: 2px solid #fff;
      min-width: 18px;
      text-align: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    /* Backdrop on Mobile */
    .chat-window-backdrop {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1050;
    }

    /* Chat Window */
    .chat-window {
      width: 380px;
      height: 520px;
      background: #ffffff;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.08);
      animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.85) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Header */
    .chat-header {
      background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .avatar-wrap {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background: #28a745;
      border: 2px solid #fff;
      border-radius: 50%;
    }

    .header-actions {
      display: flex;
      gap: 6px;
    }

    .btn-icon {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.85);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }

    /* Body */
    .chat-body {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      background: #f8f9fa;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .welcome-banner {
      font-size: 11px;
      border: 1px dashed #dee2e6;
    }

    .message-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 82%;
    }

    .message-wrapper.mine {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #ff5722;
      color: white;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .message-bubble {
      padding: 9px 13px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      position: relative;
      word-break: break-word;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .bubble-mine {
      background: #ff5722;
      color: #ffffff;
      border-bottom-right-radius: 2px;
    }

    .bubble-other {
      background: #ffffff;
      color: #212529;
      border-bottom-left-radius: 2px;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .msg-meta {
      font-size: 10px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 3px;
      opacity: 0.8;
    }

    .bubble-mine .msg-meta {
      color: rgba(255, 255, 255, 0.9);
    }

    .bubble-other .msg-meta {
      color: #6c757d;
    }

    /* Typing dots */
    .dots-animation span {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #ff5722;
      margin: 0 1px;
      animation: bounce 1.2s infinite ease-in-out;
    }

    .dots-animation span:nth-child(2) { animation-delay: 0.2s; }
    .dots-animation span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Footer */
    .chat-footer {
      background: #ffffff;
      padding: 10px 14px;
      border-top: 1px solid #e9ecef;
    }

    .chat-input {
      border-radius: 20px;
      padding-left: 14px;
      padding-right: 14px;
      border: 1px solid #ced4da;
    }

    .chat-input:focus {
      border-color: #ff5722;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 34, 0.15);
    }

    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ff5722;
      border: none;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      background: #e64a19;
      transform: scale(1.05);
    }

    /* Mobile responsive */
    @media (max-width: 576px) {
      .chat-window-backdrop {
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: flex-end;
      }

      .chat-window {
        width: 100%;
        height: 85vh;
        border-radius: 20px 20px 0 0;
      }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('msgInput') private msgInput!: ElementRef;

  public isOpen = false;
  public isLoading = false;
  public isSending = false;
  public messageText = '';
  public isMobileView = false;

  public conversation: Conversation | null = null;
  public messages: Message[] = [];
  public isOtherTyping = false;

  public unreadCount$ = this.chatService.unreadCount$;
  public isLoggedIn$ = this.authService.isLoggedIn$;

  private subs = new Subscription();
  private typingTimeout: any;
  private shouldScrollBottom = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Lắng nghe messages của hội thoại active
    this.subs.add(
      this.chatService.activeMessages$.subscribe(msgs => {
        this.messages = msgs;
        this.shouldScrollBottom = true;
      })
    );

    // Lắng nghe hội thoại active
    this.subs.add(
      this.chatService.activeConversation$.subscribe(conv => {
        this.conversation = conv;
      })
    );

    // Lắng nghe typing users
    this.subs.add(
      this.chatService.typingUsers$.subscribe(typingMap => {
        const currentUserId = this.authService.currentUserValue?.userId;
        let isTyping = false;
        typingMap.forEach((_, uid) => {
          if (uid !== currentUserId) {
            isTyping = true;
          }
        });
        this.isOtherTyping = isTyping;
        if (isTyping) {
          this.shouldScrollBottom = true;
        }
      })
    );

    // Lắng nghe yêu cầu mở chat từ Header hoặc các component khác
    this.subs.add(
      this.chatService.openChatRequested$.subscribe(() => {
        this.openChat();
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

  public openChat(): void {
    this.isOpen = true;
    this.shouldScrollBottom = true;

    if (this.authService.currentUserValue) {
      this.isLoading = true;
      this.chatService.createOrGetActiveConversation().subscribe({
        next: conv => {
          this.conversation = conv;
          this.isLoading = false;
          setTimeout(() => {
            this.msgInput?.nativeElement?.focus();
            this.scrollToBottom();
          }, 100);
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  public closeChat(): void {
    this.isOpen = false;
  }

  public closeChatBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('chat-window-backdrop')) {
      this.closeChat();
    }
  }

  public onSendMessage(): void {
    const text = this.messageText.trim();
    if (!text || this.isSending) {
      return;
    }

    if (!this.conversation) {
      // Tạo hội thoại kèm tin nhắn đầu tiên
      this.isSending = true;
      this.chatService.createOrGetActiveConversation(text).subscribe({
        next: conv => {
          this.conversation = conv;
          this.messageText = '';
          this.isSending = false;
          this.shouldScrollBottom = true;
        },
        error: () => {
          this.isSending = false;
        }
      });
      return;
    }

    this.isSending = true;
    this.chatService.sendTyping(this.conversation.id, false);

    this.chatService.sendMessage(this.conversation.id, text).subscribe({
      next: () => {
        this.messageText = '';
        this.isSending = false;
        this.shouldScrollBottom = true;
        setTimeout(() => this.msgInput?.nativeElement?.focus(), 50);
      },
      error: () => {
        this.isSending = false;
      }
    });
  }

  public onInputChange(): void {
    if (!this.conversation) return;

    this.chatService.sendTyping(this.conversation.id, true);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      if (this.conversation) {
        this.chatService.sendTyping(this.conversation.id, false);
      }
    }, 2000);
  }

  public onInputBlur(): void {
    if (this.conversation) {
      this.chatService.sendTyping(this.conversation.id, false);
    }
  }

  public goToLogin(): void {
    this.closeChat();
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
  }

  public formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
