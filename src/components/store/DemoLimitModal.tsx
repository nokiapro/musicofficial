import React from 'react';
import { X, Lock, ShoppingCart, Music, Sparkles } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const DemoLimitModal: React.FC = () => {
  const {
    currentSong,
    isDemoLimitModalOpen,
    setIsDemoLimitModalOpen,
    buySong,
    userBalance,
    setIsTopUpModalOpen,
  } = useMusic();

  if (!isDemoLimitModalOpen || !currentSong) return null;

  const handleBuy = () => {
    const result = buySong(currentSong);
    if (!result.success && userBalance < currentSong.price) {
      setIsDemoLimitModalOpen(false);
      setIsTopUpModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white text-center">
        {/* Lock / Store Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white">
          Hết Thời Gian Nghe Thử 60 Giây!
        </h2>

        <p className="mt-2 text-sm text-white/70 leading-relaxed">
          Bài hát <strong className="text-amber-300">"{currentSong.title}"</strong> của nghệ sĩ{' '}
          <span className="text-white font-semibold">{currentSong.artists}</span> chưa được mua bản quyền.
          Vui lòng mua bài hát để thưởng thức toàn bộ và tải về file chất lượng cao{' '}
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-xs">
            {currentSong.audioFormat}
          </span>
          .
        </p>

        {/* Pricing card */}
        <div className="my-5 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-left">
          <div>
            <p className="text-xs text-white/50 uppercase font-semibold">Giá bài hát bản quyền</p>
            <p className="text-xl font-black text-amber-400">
              {(currentSong.price ?? 20000).toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">Số dư ví của bạn</p>
            <p className="text-sm font-bold text-white">
              {(userBalance || 0).toLocaleString('vi-VN')} đ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDemoLimitModalOpen(false)}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={handleBuy}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-sm shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Mua Ngay ({(currentSong.price ?? 20000).toLocaleString('vi-VN')}đ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
