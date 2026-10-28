import React, { useState } from 'react';
import { X, ShoppingBag, CheckCircle, AlertCircle, Tag, Check } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Voucher } from '../../types/music';

export const BuySongModal: React.FC = () => {
  const {
    isBuyModalOpen,
    setIsBuyModalOpen,
    songToBuy,
    setSongToBuy,
    userBalance,
    buySong,
    setIsTopUpModalOpen,
    vouchers,
    applyVoucher,
  } = useMusic();

  const [couponCode, setCouponCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isBuyModalOpen || !songToBuy) return null;

  const originalPrice = typeof songToBuy.price === 'number' ? songToBuy.price : (Number(songToBuy.price) || 20000);
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) return;

    const res = applyVoucher(code, originalPrice);
    if (res.success && res.voucher) {
      setAppliedVoucher(res.voucher);
      setDiscountAmount(res.discountAmount);
      setVoucherMsg({ text: res.message, isError: false });
    } else {
      setAppliedVoucher(null);
      setDiscountAmount(0);
      setVoucherMsg({ text: res.message, isError: true });
    }
  };

  const handleConfirmBuy = () => {
    // If discount was applied, adjust the price temporarily or buy with discounted price
    const modifiedSong = { ...songToBuy, price: finalPrice };
    const res = buySong(modifiedSong);
    if (!res.success && userBalance < finalPrice) {
      setIsBuyModalOpen(false);
      setIsTopUpModalOpen(true);
    } else if (res.success) {
      setAppliedVoucher(null);
      setDiscountAmount(0);
      setCouponCode('');
      setVoucherMsg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#c273ed]" />
            <h2 className="text-base font-bold">Xác Nhận Mua Nhạc</h2>
          </div>
          <button
            onClick={() => {
              setIsBuyModalOpen(false);
              setSongToBuy(null);
              setAppliedVoucher(null);
              setDiscountAmount(0);
              setVoucherMsg(null);
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 mt-4 flex-1 pr-1">
          {/* Song Info */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-purple-900/40 border border-white/10 shrink-0 flex items-center justify-center">
              {songToBuy.coverImage ? (
                <img src={songToBuy.coverImage} alt={songToBuy.title} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-sm text-white/70">{songToBuy.audioFormat}</span>
              )}
            </div>
            <div className="truncate flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{songToBuy.title}</h3>
              <p className="text-xs text-white/60 truncate mt-0.5">{songToBuy.artists}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#9b4de0]/20 text-[#c273ed] border border-[#9b4de0]/40">
                Định dạng {songToBuy.audioFormat} Full Lossless
              </span>
            </div>
          </div>

          {/* Coupon / Voucher Section */}
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
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold text-xs transition-all shadow-md shrink-0"
              >
                Áp Dụng
              </button>
            </div>

            {voucherMsg && (
              <p className={`text-[11px] font-semibold ${voucherMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                {voucherMsg.text}
              </p>
            )}

            {/* Quick Available Vouchers */}
            <div className="pt-1.5">
              <p className="text-[10px] text-white/50 mb-1">Mã giảm giá đang có sẵn:</p>
              <div className="flex flex-wrap gap-1.5">
                {vouchers.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setCouponCode(v.code);
                      handleApplyCoupon(v.code);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                      appliedVoucher?.id === v.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span>{v.code}</span>
                    {appliedVoucher?.id === v.id && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-1.5 text-xs p-3 rounded-2xl bg-black/30 border border-white/5">
            <div className="flex justify-between py-1 border-b border-white/5 text-white/70">
              <span>Đơn giá gốc</span>
              <span className="font-bold text-white">{originalPrice.toLocaleString('vi-VN')} đ</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-white/5 text-emerald-400 font-semibold">
                <span>Giảm giá ({appliedVoucher?.code})</span>
                <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-white/5 text-white/70">
              <span>Số dư ví hiện có</span>
              <span className="font-bold text-amber-300">{userBalance.toLocaleString('vi-VN')} đ</span>
            </div>

            <div className="flex justify-between py-1.5 font-bold text-sm">
              <span className="text-white">Tổng thanh toán</span>
              <span className="text-emerald-400 text-base">{finalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setIsBuyModalOpen(false);
              setSongToBuy(null);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmBuy}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
          >
            Thanh Toán ({finalPrice.toLocaleString('vi-VN')} đ)
          </button>
        </div>
      </div>
    </div>
  );
};
