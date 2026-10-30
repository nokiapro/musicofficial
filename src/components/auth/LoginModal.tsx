import React, { useState } from 'react';
import { X, Lock, Mail, Key, LogIn, AlertCircle } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginWithEmail } = useMusic();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const result = await loginWithEmail(email, password);
    setIsLoading(false);
    if (result.success) {
      setIsLoginModalOpen(false);
      setEmail('');
      setPassword('');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#c273ed]" />
            <h2 className="text-lg font-bold">Đăng Nhập Tài Khoản</h2>
          </div>
          <button
            onClick={() => {
              setIsLoginModalOpen(false);
              setErrorMsg('');
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-white/70 mb-1 font-semibold">Email tài khoản</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="xuankensinger123@gmail.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#9b4de0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 mb-1 font-semibold">Mật khẩu (tối thiểu 6 ký tự)</label>
            <div className="relative">
              <Key className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#9b4de0]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-sm shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
