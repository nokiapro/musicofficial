import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Pin,
  Trash2,
  Share2,
  Play,
  Music,
  X,
  Radio,
  Lock,
  Smile,
  Edit3,
  UserX,
  UserCheck,
  AtSign,
  Copy,
  Clock,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ChatMessage, Song } from '../../types/music';

export const ChatBoxView: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    editChatMessage,
    deleteChatMessage,
    togglePinChatMessage,
    banChatMember,
    unbanChatMember,
    bannedMembers,
    currentUser,
    isAdmin,
    currentSong,
    playSong,
    songs,
    exclusiveAlbums,
    playAlbumTrack,
    setIsLoginModalOpen,
  } = useMusic();

  const [inputContent, setInputContent] = useState('');
  const [isSongSelectorOpen, setIsSongSelectorOpen] = useState(false);
  const [attachedSong, setAttachedSong] = useState<ChatMessage['sharedSong'] | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Edit Message State
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editContentInput, setEditContentInput] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Context Menu State (PC right-click)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'bubble' | 'avatar';
    targetMsg?: ChatMessage;
    targetUserId?: string;
    targetUserName?: string;
  } | null>(null);

  // Mobile Long-Press Action Sheet Modal
  const [mobileActionModal, setMobileActionModal] = useState<{
    isOpen: boolean;
    type: 'bubble' | 'avatar';
    targetMsg?: ChatMessage;
    targetUserId?: string;
    targetUserName?: string;
  }>({ isOpen: false, type: 'bubble' });

  // Toast notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 2500);
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  const quickEmojis = [
    '🔥', '❤️', '🎵', '👏', '🎉', '🎧', '🚀', '😍', '💃', '🎶',
    '💯', '💥', '✨', '☕', '👍', '🥰', '⭐', '🎤', '🙌', '😎'
  ];

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Close context menu and emoji picker on global clicks
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      setContextMenu(null);
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Check if current user is banned
  const myBanInfo = currentUser ? bannedMembers[currentUser.uid] : null;
  const isCurrentlyBanned = myBanInfo
    ? myBanInfo.bannedUntil === null || Date.now() < myBanInfo.bannedUntil
    : false;

  const getRemainingBanText = (banInfo: { bannedUntil: number | null }) => {
    if (banInfo.bannedUntil === null) return 'vĩnh viễn';
    const remainingMs = banInfo.bannedUntil - Date.now();
    if (remainingMs <= 0) return 'đã hết hạn';
    const remainingMins = Math.ceil(remainingMs / 60000);
    return `còn ${remainingMins} phút`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isCurrentlyBanned) {
      showToast('Bạn đang bị cấm chat và không thể gửi tin nhắn.');
      return;
    }
    if (!inputContent.trim() && !attachedSong) return;

    setIsSending(true);
    try {
      await sendChatMessage(inputContent.trim(), attachedSong || undefined);
      setInputContent('');
      setAttachedSong(null);
      setIsEmojiPickerOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachCurrentlyPlaying = () => {
    if (!currentSong) return;
    setAttachedSong({
      id: currentSong.id,
      title: currentSong.title,
      artists: currentSong.artists,
      coverImage: currentSong.coverImage,
      mp3Url: currentSong.mp3Url,
      wavUrl: currentSong.wavUrl,
      duration: currentSong.duration,
      isAlbumTrack: !!currentSong.album && currentSong.album !== 'XuanKen Official',
      albumTitle: currentSong.album,
    });
  };

  const handlePlaySharedSong = (shared: NonNullable<ChatMessage['sharedSong']>) => {
    if (shared.isAlbumTrack && shared.albumTitle) {
      const foundAlbum = exclusiveAlbums.find((a) => a.title === shared.albumTitle);
      if (foundAlbum) {
        const foundTrack = foundAlbum.songs.find((s) => s.id === shared.id);
        if (foundTrack) {
          playAlbumTrack(foundTrack, foundAlbum);
          return;
        }
      }
    }

    const inMainSongs = songs.find((s) => s.id === shared.id);
    if (inMainSongs) {
      playSong(inMainSongs);
      return;
    }

    const songObj: Song = {
      id: shared.id,
      title: shared.title,
      artists: shared.artists,
      duration: shared.duration || 210,
      audioFormat: 'MP3',
      coverImage: shared.coverImage,
      demoUrl: shared.mp3Url || shared.wavUrl,
      mp3Url: shared.mp3Url,
      wavUrl: shared.wavUrl,
      price: 0,
      lyrics: [],
      album: shared.albumTitle || 'XuanKen Community Share',
    };
    playSong(songObj);
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  // Tagging member handler: appends @username into input and focuses
  const handleTagUser = (userName: string) => {
    const tag = `@${userName} `;
    setInputContent((prev) => (prev ? `${prev} ${tag}` : tag));
    showToast(`Đã tag @${userName}`);
    setContextMenu(null);
    setMobileActionModal({ isOpen: false, type: 'avatar' });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Edit Message Submit
  const handleSaveEdit = async () => {
    if (!editingMessage || !editContentInput.trim()) return;
    setIsSavingEdit(true);
    try {
      await editChatMessage(editingMessage.id, editContentInput.trim());
      showToast('Đã cập nhật tin nhắn!');
      setEditingMessage(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // PC Right-Click Handlers
  const handleBubbleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 200),
      type: 'bubble',
      targetMsg: msg,
    });
  };

  const handleAvatarContextMenu = (e: React.MouseEvent, userId: string, userName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 260),
      type: 'avatar',
      targetUserId: userId,
      targetUserName: userName,
    });
  };

  // Mobile Long-Press Handlers
  const handleTouchStart = (type: 'bubble' | 'avatar', data: { msg?: ChatMessage; userId?: string; userName?: string }) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setMobileActionModal({
        isOpen: true,
        type,
        targetMsg: data.msg,
        targetUserId: data.userId,
        targetUserName: data.userName,
      });
      // Vibrate on mobile device if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Copy Message Text
  const handleCopyText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Đã sao chép nội dung tin nhắn!');
    }
    setContextMenu(null);
    setMobileActionModal({ isOpen: false, type: 'bubble' });
  };

  // Ban Member Handler
  const handleBanMember = async (userId: string, userName: string, durationMinutes: number | null) => {
    await banChatMember(userId, userName, durationMinutes);
    const timeLabel = durationMinutes ? `${durationMinutes} phút` : 'vĩnh viễn';
    showToast(`Đã cấm chat thành viên ${userName} trong ${timeLabel}!`);
    setContextMenu(null);
    setMobileActionModal({ isOpen: false, type: 'avatar' });
  };

  // Unban Member Handler
  const handleUnbanMember = async (userId: string, userName: string) => {
    await unbanChatMember(userId);
    showToast(`Đã gỡ cấm chat cho thành viên ${userName}!`);
    setContextMenu(null);
    setMobileActionModal({ isOpen: false, type: 'avatar' });
  };

  // Render message content with highlighted @tags
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_\u00C0-\u1EF9]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="font-bold text-[#38ef7d] bg-[#38ef7d]/15 px-1.5 py-0.5 rounded-md inline-block mr-0.5"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Deduplicate messages by ID to prevent displaying 2 messages on send (Requirement 9)
  const uniqueMessagesMap = new Map<string, ChatMessage>();
  chatMessages.forEach((m) => {
    if (m && m.id) {
      uniqueMessagesMap.set(m.id, m);
    }
  });
  const displayMessages = Array.from(uniqueMessagesMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  const pinnedMessages = displayMessages.filter((m) => m.isPinned);

  return (
    <div className="flex flex-col h-full sm:h-[calc(100vh-150px)] w-full max-w-6xl mx-auto rounded-none sm:rounded-3xl bg-zinc-900/90 sm:border sm:border-white/10 backdrop-blur-md overflow-hidden shadow-2xl select-none font-['Roboto_Condensed'] relative flex-1 min-h-0">
      {/* Top Header */}
      <div className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 border-b border-white/10 bg-white/5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
                Cộng Đồng Chat XuanKen Music
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-white/50 truncate">
              Chuột phải (PC) hoặc nhấn giữ (Mobile) tin nhắn / avatar để Sửa, Xóa, Tag, Ban
            </p>
          </div>
        </div>

        {/* Share currently playing quick button */}
        {currentSong && (
          <button
            onClick={handleAttachCurrentlyPlaying}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
            title="Đính kèm bài hát đang phát vào tin nhắn"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#c273ed]" />
            <span className="truncate max-w-[140px]">Đang nghe: {currentSong.title}</span>
          </button>
        )}
      </div>

      {/* Pinned Messages Notice Banner */}
      {pinnedMessages.length > 0 && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-transparent border-b border-amber-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-amber-300 truncate">
                Ghim: <span className="font-normal text-white/90">{pinnedMessages[pinnedMessages.length - 1].content}</span>
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => togglePinChatMessage(pinnedMessages[pinnedMessages.length - 1].id, false)}
              className="text-[10px] text-amber-300/70 hover:text-amber-200 font-bold underline shrink-0 cursor-pointer"
            >
              Bỏ ghim
            </button>
          )}
        </div>
      )}

      {/* Messages Stream Area - Yêu Cầu 2: Cố định toàn khung chat, CHỈ cuộn tin nhắn và hiển thị thanh cuộn rõ ràng */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-3.5 custom-chat-scrollbar">
        {displayMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2 py-12">
            <MessageSquare className="w-12 h-12 stroke-[1.2]" />
            <p className="text-sm font-bold text-white/60">Chưa có tin nhắn nào</p>
            <p className="text-xs">Hãy là người đầu tiên gửi tin nhắn chào mọi người nhé!</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isMe = currentUser?.uid && msg.userId === currentUser.uid;
            const isMsgAdmin = msg.userRole === 'admin';
            const userBan = bannedMembers[msg.userId];
            const isMemberBanned = userBan && (userBan.bannedUntil === null || Date.now() < userBan.bannedUntil);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                  isMe ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar (Yêu Cầu 7: sửa chuẩn không bị lệch; Yêu Cầu 11: chuột phải / nhấn giữ để Ban hoặc Tag) */}
                <div
                  onContextMenu={(e) => handleAvatarContextMenu(e, msg.userId, msg.userName)}
                  onTouchStart={() => handleTouchStart('avatar', { userId: msg.userId, userName: msg.userName })}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow flex items-center justify-center self-start mt-0.5 cursor-pointer active:scale-95 transition-transform"
                  title="Chuột phải hoặc giữ để Tag tên / Ban thành viên"
                >
                  {msg.userAvatar ? (
                    <img
                      src={msg.userAvatar}
                      alt={msg.userName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center font-bold text-xs text-white ${
                        isMsgAdmin
                          ? 'bg-gradient-to-tr from-amber-500 to-rose-600'
                          : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                      }`}
                    >
                      {msg.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isMemberBanned && (
                    <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center">
                      <UserX className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Message Body Content */}
                <div className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name + Badges + Timestamp */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span
                      onClick={() => handleTagUser(msg.userName)}
                      className="text-xs font-bold text-white/80 hover:text-white cursor-pointer"
                      title="Bấm để tag tên"
                    >
                      {msg.userName}
                    </span>

                    {/* Role Badges */}
                    {isMsgAdmin ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white shadow-xs tracking-wider">
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600 text-white shadow-xs tracking-wider">
                        THÀNH VIÊN
                      </span>
                    )}

                    {isMemberBanned && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-900/60 text-red-300 border border-red-500/40">
                        BỊ CẤM CHAT
                      </span>
                    )}

                    {/* Pinned Indicator */}
                    {msg.isPinned && (
                      <Pin className="w-3 h-3 text-amber-400 fill-current" />
                    )}

                    {msg.isEdited && (
                      <span className="text-[9px] text-white/40 italic">(đã sửa)</span>
                    )}

                    <span className="text-[10px] text-white/40 font-mono">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>

                  {/* Bubble - Yêu Cầu 11: Chuột phải (PC) hoặc Nhấn giữ (Mobile) để Sửa / Xóa */}
                  <div
                    onContextMenu={(e) => handleBubbleContextMenu(e, msg)}
                    onTouchStart={() => handleTouchStart('bubble', { msg })}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white shadow-md leading-relaxed break-words cursor-pointer select-text transition-all ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 rounded-tr-xs'
                        : 'bg-white/10 border border-white/10 rounded-tl-xs'
                    }`}
                  >
                    {renderFormattedContent(msg.content)}

                    {/* Shared Song Card Embed */}
                    {msg.sharedSong && (
                      <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between gap-3 min-w-[200px] sm:min-w-[260px]">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                            {msg.sharedSong.coverImage ? (
                              <img
                                src={msg.sharedSong.coverImage}
                                alt={msg.sharedSong.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50">
                                <Music className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">
                              {msg.sharedSong.title}
                            </p>
                            <p className="text-[10px] text-white/60 truncate">
                              {msg.sharedSong.artists}
                            </p>
                            {msg.sharedSong.albumTitle && (
                              <p className="text-[9px] text-[#c273ed] truncate">
                                💿 {msg.sharedSong.albumTitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handlePlaySharedSong(msg.sharedSong!)}
                          className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow shrink-0 active:scale-95 transition-all cursor-pointer"
                          title="Phát bài hát này"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Participation Area: Only for Logged-In Members */}
      {currentUser ? (
        <>
          {/* Banned Member Notice Bar */}
          {isCurrentlyBanned ? (
            <div className="p-3 bg-red-950/60 border-t border-red-500/30 flex items-center gap-2.5 text-red-200 text-xs shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Tài khoản của bạn đang bị cấm chat ({getRemainingBanText(myBanInfo!)}). Vui lòng liên hệ Admin để được mở lại.
              </span>
            </div>
          ) : (
            <>
              {/* Attached Song Preview Bar */}
              {attachedSong && (
                <div className="px-4 py-2 bg-purple-900/30 border-t border-purple-500/30 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Music className="w-4 h-4 text-[#c273ed] shrink-0" />
                    <span className="text-xs text-white truncate">
                      Đính kèm: <strong>{attachedSong.title}</strong> - {attachedSong.artists}
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedSong(null)}
                    className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="p-2 sm:p-3.5 border-t border-white/10 bg-zinc-900/95 flex items-center gap-1.5 sm:gap-2 shrink-0 relative"
              >
                {/* Attach Song Button */}
                <button
                  type="button"
                  onClick={() => setIsSongSelectorOpen(true)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    attachedSong
                      ? 'bg-purple-600/40 border-purple-500 text-[#c273ed]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title="Đính kèm bài hát vào tin nhắn"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Message Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={`Nhập tin nhắn (${currentUser.displayName})...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 min-w-0"
                />

                {/* Yêu Cầu 10: Icon Mặt Cười (Biểu Cảm Nhanh) Đặt Cạnh Nút Gửi */}
                <div className="relative shrink-0" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEmojiPickerOpen(!isEmojiPickerOpen);
                    }}
                    style={isEmojiPickerOpen ? { backgroundColor: 'var(--color-accent)' } : undefined}
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isEmojiPickerOpen
                        ? 'text-white border-transparent shadow'
                        : 'bg-white/5 border-white/10 text-amber-400 hover:text-amber-300 hover:bg-white/10'
                    }`}
                    title="Biểu cảm nhanh"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Quick Emoji Popover Menu */}
                  {isEmojiPickerOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 bottom-full mb-2 w-64 sm:w-72 rounded-2xl bg-zinc-900 border border-white/15 p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[10px] text-white/50 font-bold uppercase tracking-wider">
                        <span>Biểu Cảm Nhanh</span>
                        <button
                          type="button"
                          onClick={() => setIsEmojiPickerOpen(false)}
                          className="hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto no-scrollbar">
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputContent((prev) => prev + emoji);
                              inputRef.current?.focus();
                            }}
                            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg transition-transform active:scale-125 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isSending || (!inputContent.trim() && !attachedSong)}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </form>
            </>
          )}
        </>
      ) : (
        <div className="p-3 sm:p-4 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shrink-0">
          <div className="flex items-center gap-2.5 text-white/80 text-xs">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Khách vô danh không được tham gia chat box. Vui lòng đăng nhập để gửi tin nhắn và giao lưu.</span>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 transition-transform active:scale-95 cursor-pointer shadow-lg"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* PC Context Menu (Right Click Popup) */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[99999] w-56 rounded-2xl bg-zinc-900 border border-white/15 p-1.5 shadow-2xl text-xs select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {contextMenu.type === 'bubble' && contextMenu.targetMsg && (
            <>
              {/* If Admin or Author: Sửa tin nhắn */}
              {(isAdmin || (currentUser && contextMenu.targetMsg.userId === currentUser.uid)) && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessage(contextMenu.targetMsg!);
                    setEditContentInput(contextMenu.targetMsg!.content);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sửa tin nhắn</span>
                </button>
              )}

              {/* If Admin or Author: Xóa tin nhắn */}
              {(isAdmin || (currentUser && contextMenu.targetMsg.userId === currentUser.uid)) && (
                <button
                  type="button"
                  onClick={() => {
                    deleteChatMessage(contextMenu.targetMsg!.id);
                    showToast('Đã xóa tin nhắn!');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-red-500/20 text-red-400 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa tin nhắn</span>
                </button>
              )}

              {/* If Admin: Pin/Unpin */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    togglePinChatMessage(contextMenu.targetMsg!.id, !contextMenu.targetMsg!.isPinned);
                    showToast(contextMenu.targetMsg!.isPinned ? 'Đã bỏ ghim tin nhắn' : 'Đã ghim tin nhắn!');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-amber-300 font-semibold cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{contextMenu.targetMsg.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim lên đầu'}</span>
                </button>
              )}

              {/* Copy text */}
              <button
                type="button"
                onClick={() => handleCopyText(contextMenu.targetMsg!.content)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white/80 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-white/60" />
                <span>Sao chép nội dung</span>
              </button>
            </>
          )}

          {contextMenu.type === 'avatar' && contextMenu.targetUserId && contextMenu.targetUserName && (
            <>
              {/* Tag Name Option */}
              <button
                type="button"
                onClick={() => handleTagUser(contextMenu.targetUserName!)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white font-semibold cursor-pointer"
              >
                <AtSign className="w-3.5 h-3.5 text-[#38ef7d]" />
                <span>Tag tên (@{contextMenu.targetUserName})</span>
              </button>

              {/* Admin Ban Options */}
              {isAdmin && contextMenu.targetUserId !== currentUser?.uid && (
                <div className="pt-1 mt-1 border-t border-white/10">
                  <p className="px-3 py-1 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Quyền Admin: Cấm Chat
                  </p>

                  {bannedMembers[contextMenu.targetUserId] ? (
                    <button
                      type="button"
                      onClick={() => handleUnbanMember(contextMenu.targetUserId!, contextMenu.targetUserName!)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-emerald-500/20 text-emerald-400 font-semibold cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Gỡ cấm chat (Mở ban)</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleBanMember(contextMenu.targetUserId!, contextMenu.targetUserName!, 5)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-red-500/15 text-red-300 font-semibold cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ban 5 phút</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBanMember(contextMenu.targetUserId!, contextMenu.targetUserName!, 15)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-red-500/15 text-red-300 font-semibold cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ban 15 phút</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBanMember(contextMenu.targetUserId!, contextMenu.targetUserName!, 60)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-red-500/15 text-red-300 font-semibold cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ban 60 phút (1 giờ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBanMember(contextMenu.targetUserId!, contextMenu.targetUserName!, null)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-red-500/20 text-red-400 font-bold cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Ban vĩnh viễn</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mobile Long-Press Action Sheet Modal */}
      {mobileActionModal.isOpen && (
        <div
          onClick={() => setMobileActionModal({ isOpen: false, type: 'bubble' })}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm mx-auto rounded-3xl bg-zinc-900 border border-white/15 p-4 shadow-2xl space-y-2 animate-in slide-in-from-bottom duration-200 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white/80">
                {mobileActionModal.type === 'bubble' ? 'Tùy chọn tin nhắn' : `Tùy chọn: ${mobileActionModal.targetUserName}`}
              </span>
              <button
                type="button"
                onClick={() => setMobileActionModal({ isOpen: false, type: 'bubble' })}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mobileActionModal.type === 'bubble' && mobileActionModal.targetMsg && (
              <>
                {(isAdmin || (currentUser && mobileActionModal.targetMsg.userId === currentUser.uid)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessage(mobileActionModal.targetMsg!);
                      setEditContentInput(mobileActionModal.targetMsg!.content);
                      setMobileActionModal({ isOpen: false, type: 'bubble' });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>Sửa tin nhắn</span>
                  </button>
                )}

                {(isAdmin || (currentUser && mobileActionModal.targetMsg.userId === currentUser.uid)) && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteChatMessage(mobileActionModal.targetMsg!.id);
                      showToast('Đã xóa tin nhắn!');
                      setMobileActionModal({ isOpen: false, type: 'bubble' });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-red-500/15 text-red-400 font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa tin nhắn</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      togglePinChatMessage(mobileActionModal.targetMsg!.id, !mobileActionModal.targetMsg!.isPinned);
                      showToast(mobileActionModal.targetMsg!.isPinned ? 'Đã bỏ ghim' : 'Đã ghim tin nhắn!');
                      setMobileActionModal({ isOpen: false, type: 'bubble' });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 text-amber-300 font-bold"
                  >
                    <Pin className="w-4 h-4" />
                    <span>{mobileActionModal.targetMsg.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyText(mobileActionModal.targetMsg!.content)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 text-white/80 font-bold"
                >
                  <Copy className="w-4 h-4 text-white/60" />
                  <span>Sao chép nội dung</span>
                </button>
              </>
            )}

            {mobileActionModal.type === 'avatar' && mobileActionModal.targetUserId && mobileActionModal.targetUserName && (
              <>
                <button
                  type="button"
                  onClick={() => handleTagUser(mobileActionModal.targetUserName!)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 text-white font-bold"
                >
                  <AtSign className="w-4 h-4 text-[#38ef7d]" />
                  <span>Tag tên (@{mobileActionModal.targetUserName})</span>
                </button>

                {isAdmin && mobileActionModal.targetUserId !== currentUser?.uid && (
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <p className="text-[11px] font-bold text-red-400 uppercase">Quyền Admin: Cấm Chat</p>

                    {bannedMembers[mobileActionModal.targetUserId] ? (
                      <button
                        type="button"
                        onClick={() => handleUnbanMember(mobileActionModal.targetUserId!, mobileActionModal.targetUserName!)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Gỡ cấm chat (Mở ban)</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleBanMember(mobileActionModal.targetUserId!, mobileActionModal.targetUserName!, 5)}
                          className="p-2 rounded-xl bg-red-500/15 text-red-300 font-bold text-center"
                        >
                          Ban 5 phút
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBanMember(mobileActionModal.targetUserId!, mobileActionModal.targetUserName!, 15)}
                          className="p-2 rounded-xl bg-red-500/15 text-red-300 font-bold text-center"
                        >
                          Ban 15 phút
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBanMember(mobileActionModal.targetUserId!, mobileActionModal.targetUserName!, 60)}
                          className="p-2 rounded-xl bg-red-500/15 text-red-300 font-bold text-center"
                        >
                          Ban 60 phút
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBanMember(mobileActionModal.targetUserId!, mobileActionModal.targetUserName!, null)}
                          className="p-2 rounded-xl bg-red-600/30 text-red-400 font-black text-center"
                        >
                          Ban vĩnh viễn
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Message Modal */}
      {editingMessage && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/15 p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Edit3 className="w-4 h-4 text-sky-400" />
                <span>Chỉnh Sửa Tin Nhắn</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={4}
              value={editContentInput}
              onChange={(e) => setEditContentInput(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-2xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSavingEdit || !editContentInput.trim()}
                onClick={handleSaveEdit}
                style={{ backgroundColor: 'var(--color-accent)' }}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isSavingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song Selector Modal */}
      {isSongSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-white/15 p-5 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-[#c273ed]" />
                <h3 className="text-base font-bold text-white">Chọn Bài Hát Chia Sẻ Vào Chat</h3>
              </div>
              <button
                onClick={() => setIsSongSelectorOpen(false)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar">
              <p className="text-[10px] font-bold uppercase text-white/40 px-1">Bài hát phổ biến</p>
              {songs.slice(0, 15).map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setAttachedSong({
                      id: s.id,
                      title: s.title,
                      artists: s.artists,
                      coverImage: s.coverImage,
                      mp3Url: s.mp3Url,
                      wavUrl: s.wavUrl,
                      duration: s.duration,
                    });
                    setIsSongSelectorOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 border border-white/5 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{s.title}</p>
                    <p className="text-[10px] text-white/50 truncate">{s.artists}</p>
                  </div>
                  <span className="text-[10px] text-purple-400 font-bold">Chọn</span>
                </div>
              ))}

              {exclusiveAlbums.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase text-white/40 px-1 pt-3">Bài hát từ Album Nhạc Hay</p>
                  {exclusiveAlbums.flatMap((a) => a.songs.map((s) => ({ ...s, albumTitle: a.title, albumCover: a.coverImage }))).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setAttachedSong({
                          id: s.id,
                          title: s.title,
                          artists: s.artists,
                          coverImage: s.coverImage || s.albumCover,
                          mp3Url: s.mp3Url,
                          wavUrl: s.wavUrl,
                          duration: s.duration,
                          isAlbumTrack: true,
                          albumTitle: s.albumTitle,
                        });
                        setIsSongSelectorOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 border border-white/5 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{s.title}</p>
                        <p className="text-[10px] text-[#c273ed] truncate">💿 Album: {s.albumTitle}</p>
                      </div>
                      <span className="text-[10px] text-purple-400 font-bold">Chọn</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2 rounded-2xl bg-zinc-900 border border-white/20 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}
    </div>
  );
};
