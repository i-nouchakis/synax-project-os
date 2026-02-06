import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Users,
  Check,
  CheckCheck,
  X,
  Smile,
  Paperclip,
  FileText,
  Download,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  Badge,
  Modal,
  ModalSection,
  ModalActions,
  Input,
} from '@/components/ui';
import { messengerService, type Conversation, type Message, type MessageAttachment, type ReadParticipant } from '@/services/messenger.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/auth.store';
import { useSearchStore } from '@/stores/search.store';
import { useMessengerSocket } from '@/hooks/useMessengerSocket';

// ─── Helpers ────────────────────────────────────────────────
function getConversationName(conv: Conversation, currentUserId: string): string {
  if (conv.isGroup && conv.title) return conv.title;
  const other = conv.participants.find(p => p.userId !== currentUserId);
  return other?.user.name || 'Unknown';
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function formatFullTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return `${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── Emoji Data ─────────────────────────────────────────────
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😜', '🤔', '😎', '🤩', '😏', '😢', '😭', '😤', '😱', '🤯', '🥳', '😴', '🤗', '🫡', '🫠'],
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '👋', '🤝', '👏', '🙌', '💪', '🤞', '✌️', '🤟', '👌', '🫶', '☝️', '👈', '👉', '🙏'],
  },
  {
    label: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❤️‍🔥', '💕', '💖', '💗', '💘', '💝'],
  },
  {
    label: 'Objects',
    emojis: ['🔥', '⭐', '✨', '💡', '🎯', '🚀', '💻', '📱', '📧', '📎', '🔧', '🏗️', '🏠', '📋', '✅', '❌', '⚠️', '🔔', '🎉', '🎊'],
  },
];

// ─── File Helpers ────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'zip'];

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

interface PendingFile {
  file: File;
  preview?: string; // data URL for images
}

// ─── Main Component ─────────────────────────────────────────
export function MessengerPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const searchQuery = useSearchStore((s) => s.query);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // WebSocket connection for real-time updates
  const { emit } = useMessengerSocket();

  // Fetch conversations (no polling - WS invalidates on new messages)
  const { data: conversations = [] } = useQuery({
    queryKey: ['messenger-conversations'],
    queryFn: messengerService.getConversations,
  });

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => {
      const name = getConversationName(c, currentUser?.id || '');
      const lastMsg = c.messages[0]?.content || '';
      return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery, currentUser?.id]);

  // Active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Fetch messages for active conversation (no polling - WS pushes updates)
  const { data: messagesData } = useQuery({
    queryKey: ['messenger-messages', activeConversationId],
    queryFn: () => messengerService.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
  });
  const messages = messagesData?.messages || [];
  const readParticipants: ReadParticipant[] = messagesData?.participants || [];

  // Fetch users for new chat
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    enabled: isNewChatOpen,
  });

  // Mark as read when opening conversation
  useEffect(() => {
    if (activeConversationId && activeConversation?.unreadCount) {
      messengerService.markAsRead(activeConversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversationId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content, attachments }: {
      conversationId: string;
      content: string;
      attachments?: { filename: string; url: string; mimeType: string; size: number }[];
    }) => messengerService.sendMessage(conversationId, content, attachments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger-messages', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
      setMessageText('');
      setPendingFiles([]);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send message'),
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (data: { participantIds: string[]; isGroup?: boolean; title?: string }) =>
      messengerService.createConversation(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
      setActiveConversationId(result.conversation.id);
      setIsNewChatOpen(false);
      setSelectedUserIds([]);
      setIsGroupChat(false);
      setGroupTitle('');
      if (result.existing) {
        toast.info('Opened existing conversation');
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create conversation'),
  });

  const handleSend = async () => {
    if ((!messageText.trim() && pendingFiles.length === 0) || !activeConversationId) return;
    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emit('typing:stop', { conversationId: activeConversationId });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setShowEmojiPicker(false);

    // Upload pending files first
    let uploadedAttachments: { filename: string; url: string; mimeType: string; size: number }[] | undefined;
    if (pendingFiles.length > 0) {
      setIsUploading(true);
      try {
        uploadedAttachments = await Promise.all(
          pendingFiles.map(pf => messengerService.uploadFile(pf.file))
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'File upload failed');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      content: messageText.trim(),
      attachments: uploadedAttachments,
    });
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPending: PendingFile[] = [];

    for (const file of files) {
      // Validate extension
      const ext = getFileExtension(file.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`"${file.name}" is not an allowed file type`);
        continue;
      }
      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large (max 10MB)`);
        continue;
      }

      const pending: PendingFile = { file };
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        pending.preview = URL.createObjectURL(file);
      }
      newPending.push(pending);
    }

    if (newPending.length > 0) {
      setPendingFiles(prev => [...prev, ...newPending]);
    }

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Remove a pending file
  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateConversation = () => {
    if (selectedUserIds.length === 0) return;
    createConversationMutation.mutate({
      participantIds: selectedUserIds,
      isGroup: isGroupChat || selectedUserIds.length > 1,
      title: groupTitle || undefined,
    });
  };

  // Check if a message has been read by any other participant
  const isMessageRead = useCallback((msg: Message): boolean => {
    if (msg.senderId !== currentUser?.id) return false; // Only show for own messages
    return readParticipants.some(
      (p) => p.userId !== currentUser?.id && p.lastReadAt && new Date(p.lastReadAt) >= new Date(msg.createdAt)
    );
  }, [readParticipants, currentUser?.id]);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Close emoji picker on click outside
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Handle typing indicator - emit typing:start / typing:stop
  const handleTypingChange = useCallback((text: string) => {
    setMessageText(text);
    if (!activeConversationId) return;

    if (text.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      emit('typing:start', { conversationId: activeConversationId });
    }

    // Clear previous timer and set new one to stop typing after 2s of inactivity
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current && activeConversationId) {
        isTypingRef.current = false;
        emit('typing:stop', { conversationId: activeConversationId });
      }
    }, 2000);

    // If text is empty, stop immediately
    if (!text.trim() && isTypingRef.current) {
      isTypingRef.current = false;
      emit('typing:stop', { conversationId: activeConversationId });
    }
  }, [activeConversationId, emit]);

  // Listen for typing events from other users
  const { on } = useMessengerSocket();
  useEffect(() => {
    const unsub1 = on('typing:start', (data) => {
      const convId = data.conversationId as string;
      const userId = data.userId as string;
      if (userId === currentUser?.id) return;

      setTypingUsers((prev) => {
        const current = prev[convId] || [];
        if (current.includes(userId)) return prev;
        return { ...prev, [convId]: [...current, userId] };
      });
    });

    const unsub2 = on('typing:stop', (data) => {
      const convId = data.conversationId as string;
      const userId = data.userId as string;

      setTypingUsers((prev) => {
        const current = prev[convId] || [];
        if (!current.includes(userId)) return prev;
        const updated = current.filter((id) => id !== userId);
        if (updated.length === 0) {
          const next = { ...prev };
          delete next[convId];
          return next;
        }
        return { ...prev, [convId]: updated };
      });
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [on, currentUser?.id]);

  // Stop typing when changing conversations
  useEffect(() => {
    isTypingRef.current = false;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [activeConversationId]);

  // Get typing indicator names for active conversation
  const activeTypingUsers = activeConversationId ? (typingUsers[activeConversationId] || []) : [];
  const typingNames = activeTypingUsers
    .map((uid) => activeConversation?.participants.find((p) => p.userId === uid)?.user.name?.split(' ')[0])
    .filter(Boolean);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const invitableUsers = allUsers.filter(u => u.id !== currentUser?.id);
  const filteredUsers = userSearch
    ? invitableUsers.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : invitableUsers;

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 flex items-center gap-2">
            <MessageSquare size={28} />
            Messenger
          </h1>
          <p className="text-body text-text-secondary mt-1">Chat with your team</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsNewChatOpen(true)}>
          New Chat
        </Button>
      </div>

      {/* Chat Layout */}
      <Card className="overflow-hidden">
        <div className="flex" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          {/* Sidebar - Conversations */}
          <div className="w-80 border-r border-surface-border flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-surface-border">
              <p className="text-body-sm font-medium text-text-primary">
                Conversations ({filteredConversations.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare size={32} className="text-text-tertiary mx-auto mb-2" />
                  <p className="text-body-sm text-text-secondary">No conversations yet</p>
                  <p className="text-caption text-text-tertiary mt-1">Start a new chat to begin</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const name = getConversationName(conv, currentUser?.id || '');
                  const lastMessage = conv.messages[0];
                  const isActive = conv.id === activeConversationId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full p-3 flex items-start gap-3 text-left transition-colors border-b border-surface-border/50 ${
                        isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-surface-hover'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-body-sm font-medium ${
                        conv.isGroup ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-text-secondary'
                      }`}>
                        {conv.isGroup ? <Users size={18} /> : getInitials(name)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-body-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>
                            {name}
                          </p>
                          {lastMessage && (
                            <span className="text-caption text-text-tertiary flex-shrink-0">
                              {formatMessageTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-caption truncate ${conv.unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>
                            {lastMessage
                              ? `${lastMessage.senderId === currentUser?.id ? 'You: ' : ''}${
                                  lastMessage.content
                                    ? lastMessage.content
                                    : lastMessage.attachments?.length
                                      ? `Sent ${lastMessage.attachments.length} file${lastMessage.attachments.length > 1 ? 's' : ''}`
                                      : 'No messages yet'
                                }`
                              : 'No messages yet'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main - Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-surface-border flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-body-sm font-medium ${
                    activeConversation.isGroup ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-text-secondary'
                  }`}>
                    {activeConversation.isGroup
                      ? <Users size={16} />
                      : getInitials(getConversationName(activeConversation, currentUser?.id || ''))}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-text-primary">
                      {getConversationName(activeConversation, currentUser?.id || '')}
                    </p>
                    <p className="text-caption text-text-tertiary">
                      {activeConversation.participants.length} {activeConversation.participants.length === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {groupedMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare size={40} className="text-text-tertiary mx-auto mb-3" />
                        <p className="text-body-sm text-text-secondary">No messages yet</p>
                        <p className="text-caption text-text-tertiary">Send the first message!</p>
                      </div>
                    </div>
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.date}>
                        {/* Date separator */}
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-surface-border" />
                          <span className="text-caption text-text-tertiary px-2">{group.date}</span>
                          <div className="flex-1 h-px bg-surface-border" />
                        </div>

                        {/* Messages in this group */}
                        <div className="space-y-2">
                          {group.messages.map((msg) => {
                            const isMine = msg.senderId === currentUser?.id;
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`flex items-end gap-2 max-w-[70%] ${isMine ? 'flex-row-reverse' : ''}`}>
                                  {/* Avatar (only for others) */}
                                  {!isMine && (
                                    <div className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-[10px] font-medium text-text-secondary flex-shrink-0">
                                      {getInitials(msg.sender.name)}
                                    </div>
                                  )}
                                  <div>
                                    {/* Sender name for group chats */}
                                    {!isMine && activeConversation.isGroup && (
                                      <p className="text-caption text-text-tertiary mb-0.5 ml-1">
                                        {msg.sender.name}
                                      </p>
                                    )}
                                    <div
                                      className={`px-3 py-2 rounded-2xl text-body-sm break-words ${
                                        isMine
                                          ? 'bg-primary text-white rounded-br-md'
                                          : 'bg-surface-secondary text-text-primary rounded-bl-md'
                                      }`}
                                    >
                                      {/* Attachments */}
                                      {msg.attachments && msg.attachments.length > 0 && (
                                        <div className={`space-y-1.5 ${msg.content ? 'mb-1.5' : ''}`}>
                                          {msg.attachments.map((att: MessageAttachment) => (
                                            isImageMimeType(att.mimeType) ? (
                                              <div key={att.id} className="relative">
                                                <img
                                                  src={att.url}
                                                  alt={att.filename}
                                                  className="max-w-[280px] max-h-[200px] rounded-lg cursor-pointer object-cover"
                                                  onClick={() => setImagePreview(att.url)}
                                                />
                                              </div>
                                            ) : (
                                              <a
                                                key={att.id}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                                                  isMine
                                                    ? 'bg-white/10 hover:bg-white/20'
                                                    : 'bg-surface-hover hover:bg-surface-border'
                                                }`}
                                              >
                                                <FileText size={16} className="flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-caption font-medium truncate">{att.filename}</p>
                                                  <p className={`text-[10px] ${isMine ? 'text-white/60' : 'text-text-tertiary'}`}>
                                                    {formatFileSize(att.size)}
                                                  </p>
                                                </div>
                                                <Download size={14} className="flex-shrink-0 opacity-60" />
                                              </a>
                                            )
                                          ))}
                                        </div>
                                      )}
                                      {msg.content && msg.content}
                                    </div>
                                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                                      <span className="text-[10px] text-text-tertiary">
                                        {formatFullTime(msg.createdAt)}
                                      </span>
                                      {isMine && (
                                        isMessageRead(msg) ? (
                                          <CheckCheck size={12} className="text-primary" />
                                        ) : (
                                          <Check size={12} className="text-text-tertiary" />
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                {typingNames.length > 0 && (
                  <div className="px-4 py-1.5 text-caption text-text-tertiary animate-pulse">
                    {typingNames.length === 1
                      ? `${typingNames[0]} is typing...`
                      : `${typingNames.join(', ')} are typing...`}
                  </div>
                )}

                {/* Pending Files Preview */}
                {pendingFiles.length > 0 && (
                  <div className="px-4 py-2 border-t border-surface-border bg-surface-secondary/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      {pendingFiles.map((pf, idx) => (
                        <div
                          key={idx}
                          className="relative group flex items-center gap-2 bg-surface border border-surface-border rounded-lg px-2.5 py-1.5"
                        >
                          {pf.preview ? (
                            <img src={pf.preview} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <FileText size={16} className="text-text-tertiary" />
                          )}
                          <div className="min-w-0">
                            <p className="text-caption font-medium text-text-primary truncate max-w-[120px]">
                              {pf.file.name}
                            </p>
                            <p className="text-[10px] text-text-tertiary">
                              {formatFileSize(pf.file.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => removePendingFile(idx)}
                            className="p-0.5 rounded-full hover:bg-error/10 text-text-tertiary hover:text-error transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="px-4 py-3 border-t border-surface-border">
                  <div className="flex items-center gap-2 relative">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                      onChange={handleFileSelect}
                    />
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-0 mb-2 bg-surface border border-surface-border rounded-xl shadow-xl z-50 w-[320px]"
                      >
                        <div className="p-2 max-h-[280px] overflow-y-auto">
                          {EMOJI_CATEGORIES.map((cat) => (
                            <div key={cat.label} className="mb-2">
                              <p className="text-caption text-text-tertiary font-medium px-1 mb-1">{cat.label}</p>
                              <div className="flex flex-wrap gap-0.5">
                                {cat.emojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover text-lg transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2.5 rounded-full transition-colors ${
                        showEmojiPicker
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover'
                      }`}
                      title="Emoji"
                    >
                      <Smile size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-full text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
                      title="Attach file"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageText}
                      onChange={(e) => handleTypingChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-full bg-surface-secondary border border-surface-border text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      onClick={handleSend}
                      disabled={(!messageText.trim() && pendingFiles.length === 0) || sendMessageMutation.isPending || isUploading}
                      className="p-2.5 rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-h3 text-text-primary mb-1">Welcome to Messenger</h3>
                  <p className="text-body-sm text-text-secondary">
                    Select a conversation or start a new chat
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Image Lightbox */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setImagePreview(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setImagePreview(null)}
          >
            <X size={24} />
          </button>
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <Modal
          isOpen={isNewChatOpen}
          onClose={() => {
            setIsNewChatOpen(false);
            setSelectedUserIds([]);
            setIsGroupChat(false);
            setGroupTitle('');
            setUserSearch('');
          }}
          title="New Conversation"
          icon={<MessageSquare size={18} />}
          size="md"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => {
                setIsNewChatOpen(false);
                setSelectedUserIds([]);
                setIsGroupChat(false);
                setGroupTitle('');
                setUserSearch('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={selectedUserIds.length === 0}
                isLoading={createConversationMutation.isPending}
              >
                {selectedUserIds.length > 1 || isGroupChat ? 'Create Group' : 'Start Chat'}
              </Button>
            </ModalActions>
          }
        >
          <div className="space-y-5">
            {/* Group toggle */}
            <ModalSection title="Chat Type" icon={<Users size={14} />}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGroupChat}
                  onChange={(e) => setIsGroupChat(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-border text-primary focus:ring-primary/20"
                />
                <span className="text-body-sm text-text-primary">Group conversation</span>
              </label>
              {isGroupChat && (
                <Input
                  label="Group Name"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="E.g. Project Alpha Team"
                  className="mt-3"
                />
              )}
            </ModalSection>

            {/* User picker */}
            <ModalSection title="Select Participants" icon={<Users size={14} />}>
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-secondary border border-surface-border text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Selected badges */}
                {selectedUserIds.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedUserIds.map(uid => {
                      const u = allUsers.find(u => u.id === uid);
                      if (!u) return null;
                      return (
                        <Badge key={uid} variant="info" size="sm">
                          {u.name}
                          <button onClick={() => toggleUserSelection(uid)} className="ml-1 hover:text-error">
                            <X size={10} />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* User list */}
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUserSelection(u.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-surface-secondary hover:bg-surface-hover border border-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-medium ${
                          isSelected ? 'bg-primary text-white' : 'bg-surface-hover text-text-secondary'
                        }`}>
                          {isSelected ? <Check size={14} /> : getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm text-text-primary truncate">{u.name}</p>
                          <p className="text-caption text-text-tertiary truncate">{u.email} · {u.role}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ModalSection>
          </div>
        </Modal>
      )}
    </div>
  );
}
