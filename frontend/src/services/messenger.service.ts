import { api } from '@/lib/api';

export interface MessageSender {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: MessageSender;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt: string | null;
  joinedAt: string;
  user: { id: string; name: string; email: string; avatar: string | null; role: string };
}

export interface Conversation {
  id: string;
  title: string | null;
  isGroup: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  participants: ConversationParticipant[];
  messages: Message[]; // last message only (from list endpoint)
  unreadCount: number;
}

interface ConversationsResponse {
  conversations: Conversation[];
}

interface ConversationResponse {
  conversation: Conversation;
  existing?: boolean;
}

interface MessagesResponse {
  messages: Message[];
}

interface MessageResponse {
  message: Message;
}

interface UnreadResponse {
  unread: number;
}

export const messengerService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<ConversationsResponse>('/messenger/conversations');
    return response.conversations;
  },

  async createConversation(data: {
    participantIds: string[];
    isGroup?: boolean;
    title?: string;
  }): Promise<{ conversation: Conversation; existing?: boolean }> {
    const response = await api.post<ConversationResponse>('/messenger/conversations', data);
    return response;
  },

  async getMessages(conversationId: string, before?: string): Promise<Message[]> {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    const query = params.toString();
    const response = await api.get<MessagesResponse>(
      `/messenger/conversations/${conversationId}/messages${query ? `?${query}` : ''}`
    );
    return response.messages;
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post<MessageResponse>(
      `/messenger/conversations/${conversationId}/messages`,
      { content }
    );
    return response.message;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/messenger/conversations/${conversationId}/read`, {});
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadResponse>('/messenger/unread');
    return response.unread;
  },
};
