import React, { useState } from 'react';
import { X, Wallet, QrCode, CheckCircle, ArrowRight } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const TopUpModal: React.FC = () => {
  const { isTopUpModalOpen, setIsTopUpModalOpen, userBalance, topUpBalance } = useMusic();
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isTopUpModalOpen) return null;

  const amounts = [50000, 100000, 200000, 500000];

  const handleTopUp = () => {
    topUpBalance(selectedAmount);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsTopUpModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Nạp Tiền Vào Ví XuanKen</h2>
          </div>
          <button
            onClick={() => setIsTopUpModalOpen(false)}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Nạp Tiền Thành Công!</h3>
            <p className="text-sm text-white/70">
              +{selectedAmount.toLocaleString('vi-VN')} đ đã được cộng vào ví của bạn.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
              <span className="text-xs text-white/60">Số dư hiện tại</span>
              <span className="text-base font-bold text-amber-300">
                {userBalance.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <p className="mt-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
              Chọn mệnh giá nạp
            </p>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`py-3 px-3 rounded-xl border text-center transition-all ${
                    selectedAmount === amt
                      ? 'border-[#9b4de0] bg-[#9b4de0]/20 font-bold text-white ring-1 ring-[#9b4de0]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span className="text-sm">{amt.toLocaleString('vi-VN')} đ</span>
                </button>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center gap-3">
              <QrCode className="w-8 h-8 text-[#c273ed] shrink-0" />
              <div className="text-xs text-white/70 leading-tight">
                Hỗ trợ thanh toán nhanh qua VietQR, MoMo, ZaloPay & Thẻ ngân hàng nội địa.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleTopUp}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                Nạp Ngay ({selectedAmount.toLocaleString('vi-VN')} đ)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
