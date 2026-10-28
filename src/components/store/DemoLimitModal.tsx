import React, { useState } from 'react';
import { X, Lock, ShoppingCart, Tag, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Voucher } from '../../types/music';

export const DemoLimitModal: React.FC = () => {
  const {
    currentSong,
    songToBuy,
    isDemoLimitModalOpen,
    setIsDemoLimitModalOpen,
    isBuyModalOpen,
    setIsBuyModalOpen,
    setSongToBuy,
    buySong,
    userBalance,
    setIsTopUpModalOpen,
    applyVoucher,
  } = useMusic();

  const [couponCode, setCouponCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [voucherMsg, setVoucherMsg] = useState<{ isError: boolean; text: string } | null>(null);

  const targetSong = songToBuy || currentSong;
  const isOpen = (isDemoLimitModalOpen || isBuyModalOpen) && !!targetSong;

  if (!isOpen || !targetSong) return null;

  const originalPrice = targetSong.price && targetSong.price > 0 ? targetSong.price : 20000;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setVoucherMsg({ isError: true, text: 'Vui lòng nhập mã giảm giá!' });
      return;
    }

    const result = applyVoucher(code, originalPrice);
    if (result.success && result.voucher) {
      setAppliedVoucher(result.voucher);
      setDiscountAmount(result.discountAmount);
      setVoucherMsg({ isError: false, text: result.message });
    } else {
      setAppliedVoucher(null);
      setDiscountAmount(0);
      setVoucherMsg({ isError: true, text: result.message });
    }
  };

  const handleClose = () => {
    setIsDemoLimitModalOpen(false);
    setIsBuyModalOpen(false);
    setSongToBuy(null);
    setCouponCode('');
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherMsg(null);
  };

  const handleBuy = () => {
    if (userBalance < finalPrice) {
      handleClose();
      setIsTopUpModalOpen(true);
      return;
    }

    const result = buySong(targetSong, finalPrice);
    if (result.success) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 text-white max-h-[92vh] flex flex-col">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isDemoLimitModalOpen ? 'Hết Thời Gian Nghe Thử 60s' : 'Mua Bản Quyền Bài Hát'}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 mt-4 flex-1 pr-1">
          {/* Song Info */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-purple-900/40 border border-white/10 shrink-0 flex items-center justify-center">
              {targetSong.coverImage ? (
                <img
                  src={targetSong.coverImage}
                  alt={targetSong.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="font-black text-sm text-white/70">{targetSong.audioFormat}</span>
              )}
            </div>
            <div className="truncate flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{targetSong.title}</h3>
              <p className="text-xs text-white/60 truncate mt-0.5">{targetSong.artists}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#9b4de0]/20 text-[#c273ed] border border-[#9b4de0]/40">
                Định dạng {targetSong.audioFormat} Full Lossless
              </span>
            </div>
          </div>

          {/* Coupon / Voucher Section (Transferred from BuySongModal as requested) */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Mã Giảm Giá (Voucher)</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher (Ví dụ: XUANKEN50)"
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#9b4de0]"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer"
              >
                Áp Dụng
              </button>
            </div>

            {voucherMsg && (
              <p className={`text-[11px] font-semibold ${voucherMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                {voucherMsg.text}
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-1.5 text-xs p-3.5 rounded-2xl bg-black/30 border border-white/5">
            <div className="flex justify-between py-1 border-b border-white/5 text-white/70">
              <span>Đơn giá gốc</span>
              <span className="font-bold text-white">{originalPrice.toLocaleString('vi-VN')} đ</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-white/5 text-emerald-400 font-bold">
                <span>
                  Giảm giá voucher ({appliedVoucher?.discountType === 'percent' ? `${appliedVoucher.discountValue}%` : `${appliedVoucher?.discountValue?.toLocaleString('vi-VN')} đ`})
                </span>
                <span>- {discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}

            <div className="flex justify-between py-1 text-white/70">
              <span>Số dư ví hiện có</span>
              <span className={`font-bold ${userBalance >= finalPrice ? 'text-amber-400' : 'text-red-400'}`}>
                {(userBalance || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-black text-white">
              <span>Tổng thanh toán</span>
              <span className="text-emerald-400 text-base">{finalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={handleBuy}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Thanh Toán ({finalPrice.toLocaleString('vi-VN')} đ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
