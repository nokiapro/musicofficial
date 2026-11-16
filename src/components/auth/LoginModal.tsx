import React, { useState } from 'react';
import { X, Lock, Mail, Key, LogIn, AlertCircle } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { useAnimatedPresence } from '../../hooks/useAnimatedPresence';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginWithEmail, theme } = useMusic();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { shouldRender, isClosing } = useAnimatedPresence(isLoginModalOpen, 220);

  if (!shouldRender) return null;

  const handleClose = () => {
    setIsLoginModalOpen(false);
    setErrorMsg('');
  };

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
    <div
      data-theme={theme}
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none ${
        isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        className={`w-full max-w-md border rounded-3xl shadow-2xl overflow-hidden p-6 ${
          isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Lock
              style={{ color: 'var(--color-accent)' }}
              className="w-5 h-5"
            />
            <h2 className="text-lg font-bold">Đăng Nhập Tài Khoản</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
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
                placeholder="Nhập email"
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
              style={{ backgroundColor: 'var(--color-accent)' }}
              className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 cursor-pointer"
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
