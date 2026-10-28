import React, { useState } from 'react';
import { X, Wallet, QrCode, ShieldAlert, Copy, Check, Mail, PhoneCall } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const TopUpModal: React.FC = () => {
  const { isTopUpModalOpen, setIsTopUpModalOpen, userBalance, currentUser } = useMusic();
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [showContactNotice, setShowContactNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isTopUpModalOpen) return null;

  const amounts = [50000, 100000, 200000, 500000, 1000000];
  const userIdentifier = currentUser?.email || 'Khach_Hang';
  const transferSyntax = `NAPTIEN ${selectedAmount} ${userIdentifier}`;

  const handleProceedToNotice = () => {
    // Requirement 4: Do NOT directly top-up client balance to prevent money hacking.
    // Show contact admin instructions instead.
    setShowContactNotice(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transferSyntax);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShowContactNotice(false);
    setIsTopUpModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Nạp Tiền Vào Ví XuanKen</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showContactNotice ? (
          /* Requirement 4: Thông báo liên hệ Admin tránh tình trạng hack tiền */
          <div className="mt-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-300">
                  Vui lòng liên hệ ADMIN để nạp tiền
                </h3>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Để đảm bảo tính bảo mật và chống tình trạng can thiệp/hack số dư trái phép, mọi giao dịch nạp tiền sẽ được <strong>Admin XuanKen</strong> duyệt và cộng tiền thủ công vào ví của bạn.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-white/60">Số tiền nạp:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {selectedAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">Email Admin:</span>
                <span className="font-bold text-purple-300 font-mono">{currentUser?.role === 'admin' ? currentUser.email : 'admin@xuanken.com'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">Zalo / Hotline:</span>
                <span className="font-bold text-white">Quản Trị Viên XuanKen Music</span>
              </div>

              <div className="pt-2">
                <p className="text-white/60 mb-1.5 font-semibold">Cú pháp chuyển khoản hoặc nhắn tin:</p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-amber-300">
                  <span className="flex-1 truncate">{transferSyntax}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md bg-purple-600/30 hover:bg-purple-600 text-white shrink-0 transition-colors flex items-center gap-1 text-[10px] font-sans font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`mailto:${currentUser?.role === 'admin' ? currentUser.email : 'admin@xuanken.com'}?subject=Yêu cầu nạp ví XuanKen Music ${selectedAmount}đ&body=Xin chào Admin,%0D%0ATôi muốn nạp ${selectedAmount}đ vào ví XuanKen Music.%0D%0ACú pháp: ${encodeURIComponent(transferSyntax)}`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gửi Email Admin</span>
              </a>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs text-white transition-colors"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
              <span className="text-xs text-white/60">Số dư hiện tại</span>
              <span className="text-base font-bold text-amber-300">
                {(userBalance || 0).toLocaleString('vi-VN')} đ
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
                Chống hack số dư: Sau khi chọn số tiền, hệ thống sẽ cấp thông tin để bạn liên hệ Admin duyệt cộng ví ngay lập tức.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleProceedToNotice}
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
