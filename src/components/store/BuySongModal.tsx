import React from 'react';
import { X, ShoppingBag, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const BuySongModal: React.FC = () => {
  const {
    isBuyModalOpen,
    setIsBuyModalOpen,
    songToBuy,
    setSongToBuy,
    userBalance,
    buySong,
    setIsTopUpModalOpen,
  } = useMusic();

  if (!isBuyModalOpen || !songToBuy) return null;

  const handleConfirmBuy = () => {
    const res = buySong(songToBuy);
    if (!res.success && userBalance < songToBuy.price) {
      setIsBuyModalOpen(false);
      setIsTopUpModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#c273ed]" />
            <h2 className="text-lg font-bold">Xác Nhận Mua Nhạc</h2>
          </div>
          <button
            onClick={() => {
              setIsBuyModalOpen(false);
              setSongToBuy(null);
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div
            className={`w-14 h-14 rounded-lg bg-gradient-to-tr ${songToBuy.coverGradient} flex items-center justify-center shrink-0 text-white font-bold text-lg shadow`}
          >
            {songToBuy.audioFormat}
          </div>
          <div className="truncate flex-1">
            <h3 className="text-base font-bold text-white truncate">{songToBuy.title}</h3>
            <p className="text-xs text-white/60 truncate mt-0.5">{songToBuy.artists}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#9b4de0]/20 text-[#c273ed] border border-[#9b4de0]/40">
              Định dạng {songToBuy.audioFormat} Full Lossless
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-white/5 text-white/70">
            <span>Đơn giá</span>
            <span className="font-bold text-white">{songToBuy.price.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/5 text-white/70">
            <span>Số dư tài khoản hiện có</span>
            <span className="font-bold text-amber-300">{userBalance.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/5 text-white/70">
            <span>Số dư sau khi thanh toán</span>
            <span className="font-bold text-white">
              {Math.max(0, userBalance - songToBuy.price).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => {
              setIsBuyModalOpen(false);
              setSongToBuy(null);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmBuy}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-sm shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
          >
            Thanh Toán ({songToBuy.price.toLocaleString('vi-VN')} đ)
          </button>
        </div>
      </div>
    </div>
  );
};
