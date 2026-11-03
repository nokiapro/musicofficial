import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Pin,
  Trash2,
  Share2,
  Play,
  Pause,
  Music,
  Smile,
  ShieldAlert,
  Users,
  Sparkles,
  X,
  Radio,
  Check,
  Lock,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ChatMessage, Song } from '../../types/music';

export const ChatBoxView: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    deleteChatMessage,
    togglePinChatMessage,
    currentUser,
    isAdmin,
    currentSong,
    isPlaying,
    playSong,
    songs,
    exclusiveAlbums,
    playAlbumTrack,
    setIsLoginModalOpen,
  } = useMusic();

  const [inputContent, setInputContent] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isSongSelectorOpen, setIsSongSelectorOpen] = useState(false);
  const [attachedSong, setAttachedSong] = useState<ChatMessage['sharedSong'] | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const quickEmojis = ['🔥', '❤️', '🎵', '👏', '🎉', '🎧', '🚀', '😍', '💃', '🎶', '💯', '💥', '✨', '☕'];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsLoginModalOpen(true);
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
    // If it is an album track, find its album if possible
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

    // Check if in main songs
    const inMainSongs = songs.find((s) => s.id === shared.id);
    if (inMainSongs) {
      playSong(inMainSongs);
      return;
    }

    // Play as ad-hoc song object
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
    <div className="flex flex-col h-[calc(100vh-170px)] sm:h-[calc(100vh-150px)] max-w-6xl mx-auto rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl select-none font-['Roboto_Condensed']">
      {/* Top Header */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-white/5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate">
                Cộng Đồng Chat XuanKen Music
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-white/50 truncate">
              Giao lưu âm nhạc, bình luận bài hát và chia sẻ gu nghe nhạc cùng nhau
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
        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-transparent border-b border-amber-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-amber-300 truncate">
                Tin nhắn ghim: <span className="font-normal text-white/90">{pinnedMessages[pinnedMessages.length - 1].content}</span>
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

      {/* Messages Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                  isMe ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow flex items-center justify-center">
                  {msg.userAvatar ? (
                    <img
                      src={msg.userAvatar}
                      alt={msg.userName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center font-bold text-xs text-white ${
                      isMsgAdmin
                        ? 'bg-gradient-to-tr from-amber-500 to-rose-600'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    }`}
                  >
                    {msg.userName.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Message Body Content */}
                <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name + Badges + Timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white/80">
                      {msg.userName}
                    </span>

                    {/* Role Badges: Admin (red bg white text) or Thành Viên (blue bg white text) */}
                    {isMsgAdmin ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white shadow-xs tracking-wider">
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600 text-white shadow-xs tracking-wider">
                        THÀNH VIÊN
                      </span>
                    )}

                    {/* Pinned Indicator */}
                    {msg.isPinned && (
                      <Pin className="w-3 h-3 text-amber-400 fill-current" />
                    )}

                    <span className="text-[10px] text-white/40">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white shadow-md leading-relaxed break-words ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 rounded-tr-xs'
                        : 'bg-white/10 border border-white/10 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}

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

                  {/* Admin / Owner Actions on hover */}
                  {(isAdmin || isMe) && (
                    <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/40">
                      {isAdmin && (
                        <button
                          onClick={() => togglePinChatMessage(msg.id, !msg.isPinned)}
                          className="hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Pin className="w-3 h-3" />
                          <span>{msg.isPinned ? 'Bỏ ghim' : 'Ghim'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteChatMessage(msg.id)}
                        className="hover:text-red-400 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
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
          {/* Quick Emoji Bar */}
          <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] text-white/40 font-bold shrink-0 mr-1">Biểu cảm nhanh:</span>
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputContent((prev) => prev + emoji)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-sm transition-transform active:scale-125 shrink-0 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

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

          {/* Input Composer Form */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-white/10 bg-white/5 flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Attach Song Button */}
            <button
              type="button"
              onClick={() => setIsSongSelectorOpen(true)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
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
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={`Nhập tin nhắn (${currentUser.displayName})...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || (!inputContent.trim() && !attachedSong)}
              style={{ backgroundColor: 'var(--color-accent)' }}
              className="px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </form>
        </>
      ) : (
        <div className="p-4 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shrink-0">
          <div className="flex items-center gap-2.5 text-white/80 text-xs sm:text-sm">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
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

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {/* Songs from Main List */}
              <p className="text-[10px] font-bold uppercase text-white/40 px-1">Bài hát bài phổ biến</p>
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

              {/* Songs from Curated Albums */}
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
    </div>
  );
};
