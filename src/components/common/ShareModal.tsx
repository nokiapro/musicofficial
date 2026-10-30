import React, { useState } from 'react';
import { X, Copy, Check, Share2, Facebook, Send, Link as LinkIcon } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const ShareModal: React.FC = () => {
  const { isShareModalOpen, setIsShareModalOpen, songToShare } = useMusic();
  const [copied, setCopied] = useState(false);

  if (!isShareModalOpen || !songToShare) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xuanken.name.vn';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const shareUrl = `${origin}${pathname}?song=${songToShare.id}`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `XuanKen Music - ${songToShare.title}`,
          text: `Nghe ngay bài hát "${songToShare.title}" của ${songToShare.artists} trên XuanKen Music!`,
          url: shareUrl,
        });
      } catch (e) {}
    } else {
      handleCopy();
    }
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Nghe "${songToShare.title}" trên XuanKen Music`)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-5 text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#c273ed] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Chia Sẻ Bài Hát</h2>
              <p className="text-[11px] text-white/50">Liên kết trực tiếp (Deep Linking)</p>
            </div>
          </div>
          <button
            onClick={() => setIsShareModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song Mini Card */}
        <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-900/40 border border-white/10 shrink-0">
            {songToShare.coverImage ? (
              <img src={songToShare.coverImage} alt={songToShare.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white/60">XK</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate text-white">{songToShare.title}</h3>
            <p className="text-xs text-white/60 truncate">{songToShare.artists}</p>
            <span className="text-[10px] text-purple-400 font-semibold">{songToShare.audioFormat} • XuanKen Music</span>
          </div>
        </div>

        {/* Link Input & Copy */}
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-bold text-white/70">Đường dẫn liên kết trực tiếp</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 overflow-hidden">
              <LinkIcon className="w-4 h-4 text-white/40 shrink-0" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent focus:outline-none text-[11px] text-purple-300 font-mono truncate"
              />
            </div>
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-md ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#9b4de0] hover:bg-[#8539c9] text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-emerald-400 font-medium">
              Đã sao chép liên kết vào bộ nhớ tạm! Người nhận mở link sẽ phát bài hát này.
            </p>
          )}
        </div>

        {/* Social Share Buttons */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            onClick={handleShareFacebook}
            className="py-2.5 px-3 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 text-[#1877F2] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Facebook className="w-4 h-4" />
            <span>Facebook</span>
          </button>
          <button
            onClick={handleShareTelegram}
            className="py-2.5 px-3 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/40 text-[#229ED9] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Telegram</span>
          </button>
          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Khác</span>
          </button>
        </div>
      </div>
    </div>
  );
};
