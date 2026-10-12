export interface Conversation {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerAvatarUrl?: string;
  adminId?: number;
  adminName?: string;
  status: 'Open' | 'Closed';
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessageContent?: string;
  lastMessageSenderRole?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl?: string;
  senderRole: 'Customer' | 'Admin';
  content: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  isMine: boolean;
}

export interface SendMessageRequest {
  content: string;
}

export interface UserTypingEvent {
  conversationId: number;
  userId: number;
  userName: string;
  isTyping: boolean;
}

export interface ConversationFilter {
  status?: string;
  search?: string;
  unreadOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
