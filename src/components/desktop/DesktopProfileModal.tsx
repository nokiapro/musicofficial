import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Upload,
  Link as LinkIcon,
  Check,
  Wallet,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

interface DesktopProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopProfileModal: React.FC<DesktopProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isAdmin,
    userBalance,
    updateUserProfile,
    setIsLoginModalOpen,
    setIsTopUpModalOpen,
    logout,
  } = useMusic();

  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh kích thước dưới 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        setAvatarUrlInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    const finalAvatar = avatarPreview || avatarUrlInput.trim();
    if (!finalAvatar) return;
    setIsSavingAvatar(true);
    try {
      await updateUserProfile(currentUser?.displayName || '', finalAvatar);
      setAvatarPreview(null);
      setAvatarUrlInput('');
      setSuccessMsg('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    setIsSavingName(true);
    try {
      await updateUserProfile(displayNameInput.trim(), currentUser?.avatarUrl);
      setSuccessMsg('Cập nhật tên hiển thị thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-[#231b2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-[#c273ed] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tài Khoản Cá Nhân</h2>
              <p className="text-[11px] text-white/50">Quản lý hồ sơ, ảnh đại diện và số dư</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in shadow">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* User Status Card */}
        {!currentUser ? (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mx-auto text-white/40">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Chưa Đăng Nhập</p>
              <p className="text-xs text-white/50 mt-1">Đăng nhập tài khoản để đồng bộ nhạc và quản lý số dư ví</p>
            </div>
            <button
              onClick={() => {
                onClose();
                setIsLoginModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs shadow-lg inline-flex items-center gap-2 transition-transform active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Ngay</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Overview */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#9b4de0] bg-zinc-900 shrink-0 shadow">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-gradient-to-tr from-[#9b4de0] to-indigo-700 flex items-center justify-center text-white font-black text-lg ${
                      currentUser.avatarUrl ? 'absolute inset-0 -z-10' : ''
                    }`}
                  >
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-base truncate max-w-xs">{currentUser.displayName || 'Thành viên'}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      isAdmin ? 'bg-amber-400 text-black' : 'bg-purple-500/20 text-[#c273ed]'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate mt-0.5">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-emerald-400">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Số dư ví: {userBalance.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setIsTopUpModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all active:scale-95 shrink-0"
              >
                + Nạp tiền
              </button>
            </div>

            {/* Edit Avatar */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <label className="block text-white/80 font-bold text-xs">
                Đổi ảnh đại diện (Tải file từ máy hoặc dùng Link ảnh)
              </label>

              {(avatarPreview || avatarUrlInput.trim()) && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-white/10">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-zinc-900 shrink-0">
                    <img
                      src={avatarPreview || avatarUrlInput.trim()}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-emerald-400">Ảnh mới đã chọn</p>
                    <p className="text-[10px] text-white/50 truncate">
                      {avatarPreview ? 'Ảnh từ thiết bị' : avatarUrlInput.trim()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarUrlInput('');
                    }}
                    className="text-xs text-white/50 hover:text-white px-2 py-1"
                  >
                    Hủy
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-[#c273ed]" />
                  <span>Chọn ảnh từ máy</span>
                </button>
                {(avatarPreview || avatarUrlInput.trim()) && (
                  <button
                    type="button"
                    disabled={isSavingAvatar}
                    onClick={handleSaveAvatar}
                    className="py-2 px-4 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50"
                  >
                    {isSavingAvatar ? 'Đang lưu...' : 'Lưu Avatar'}
                  </button>
                )}
              </div>

              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={avatarUrlInput}
                  onChange={(e) => {
                    setAvatarUrlInput(e.target.value);
                    if (e.target.value) setAvatarPreview(null);
                  }}
                  placeholder="Hoặc dán link ảnh online (https://...)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
                />
              </div>
            </div>

            {/* Edit Display Name */}
            <form onSubmit={handleSaveName} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="block text-white/80 font-bold text-xs">
                Sửa tên hiển thị
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Nhập tên hiển thị mới..."
                  className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
                />
                <button
                  type="submit"
                  disabled={isSavingName || !displayNameInput.trim() || displayNameInput === currentUser.displayName}
                  className="px-4 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] disabled:opacity-40 text-white font-bold text-xs transition-colors shrink-0 shadow-md"
                >
                  {isSavingName ? 'Đang lưu...' : 'Lưu Tên'}
                </button>
              </div>
            </form>

            {/* Logout button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 border border-red-500/20 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất Tài Khoản</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
