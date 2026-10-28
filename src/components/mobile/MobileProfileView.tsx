import React, { useState, useRef } from 'react';
import {
  User,
  LogIn,
  LogOut,
  Upload,
  Link as LinkIcon,
  Check,
  Wallet,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Palette,
  Clock,
  Waves,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const MobileProfileView: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    userBalance,
    purchasedSongIds,
    theme,
    crossfadeDuration,
    setIsAudioSettingsModalOpen,
    setIsLoginModalOpen,
    setIsTopUpModalOpen,
    setIsThemeModalOpen,
    setIsSleepTimerModalOpen,
    setActiveMobileTab,
    logout,
    updateUserProfile,
  } = useMusic();

  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có kích thước dưới 3MB');
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

  // Save new avatar (from base64 preview or URL input)
  const handleSaveAvatar = async () => {
    const finalAvatar = avatarPreview || avatarUrlInput.trim();
    if (!finalAvatar) return;

    setIsSavingAvatar(true);
    try {
      await updateUserProfile(currentUser?.displayName || '', finalAvatar);
      setAvatarPreview(null);
      setAvatarUrlInput('');
      setSuccessMsg('Đã cập nhật ảnh đại diện thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Save new display name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;

    setIsSavingName(true);
    try {
      await updateUserProfile(displayNameInput.trim(), currentUser?.avatarUrl);
      setSuccessMsg('Đã cập nhật tên hiển thị thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="space-y-4 px-3.5 pb-32 pt-2 select-none">
      {/* Title */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-lg font-black text-white uppercase tracking-tight">
            Tài Khoản Cá Nhân
          </h1>
          <p className="text-[10px] text-white/50">
            {currentUser ? 'Quản lý thông tin & cài đặt ứng dụng của bạn' : 'Đăng nhập để trải nghiệm đầy đủ'}
          </p>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TOP USER CARD */}
      {!currentUser ? (
        /* Trạng thái chưa đăng nhập: Avatar mặc định + Chữ Đăng Nhập bên cạnh */
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-md shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white/60 shrink-0 shadow-inner">
              <User className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Khách vãng lai</p>
              <h2 className="text-base font-bold text-white tracking-tight">Tài Khoản XuanKen</h2>
              <p className="text-[10px] text-white/40 mt-0.5">Chưa đăng nhập</p>
            </div>
          </div>

          {/* Chữ / Nút Đăng Nhập bên cạnh */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập</span>
          </button>
        </div>
      ) : (
        /* Trạng thái đã đăng nhập: Avatar người dùng + Tên + Badge + Ví tiền giữ nguyên */
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-white/5 to-white/[0.02] border border-purple-500/30 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#9b4de0] bg-zinc-900 shrink-0 shadow-md">
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
                className={`w-full h-full bg-gradient-to-tr from-[#9b4de0] to-indigo-700 flex items-center justify-center text-white font-black text-xl ${
                  currentUser.avatarUrl ? 'absolute inset-0 -z-10' : ''
                }`}
              >
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-white truncate">
                  {currentUser.displayName || 'Thành viên'}
                </h2>
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-400 text-black shrink-0">
                    ADMIN
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-purple-500/20 text-[#c273ed] border border-purple-500/30 shrink-0">
                    MEMBER
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 truncate mt-0.5">{currentUser.email}</p>
              
              {/* Giữ nguyên ví tiền trong phần Cá nhân */}
              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-emerald-400">
                <Wallet className="w-3.5 h-3.5" />
                <span>Ví: {(userBalance || currentUser.balance || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Nút nạp tiền */}
            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shrink-0 transition-colors"
            >
              + Nạp tiền
            </button>
          </div>
        </div>
      )}

      {/* PHẦN CHỈNH SỬA THÔNG TIN: CHỈ HIỆN KHI ĐÃ ĐĂNG NHẬP */}
      {currentUser && (
        <div className="space-y-3">
          {/* Section: Upload Avatar & Chỉnh sửa tên */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#c273ed]" />
              <span>Chỉnh Sửa Hồ Sơ Cá Nhân</span>
            </h3>

            {/* 1. Upload Avatar */}
            <div className="space-y-2">
              <label className="block text-white/80 font-bold text-xs">
                Ảnh đại diện (Avatar)
              </label>

              {/* Avatar Preview */}
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
                    className="text-[11px] text-white/50 hover:text-white px-2 py-1"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Upload buttons & Online Link input */}
              <div className="grid grid-cols-1 gap-2">
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

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={avatarUrlInput}
                      onChange={(e) => {
                        setAvatarUrlInput(e.target.value);
                        if (e.target.value) setAvatarPreview(null);
                      }}
                      placeholder="Hoặc dán link ảnh online (https://...)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Chỉnh sửa tên hiển thị */}
            <form onSubmit={handleSaveName} className="space-y-2 pt-2 border-t border-white/5">
              <label className="block text-white/80 font-bold text-xs">
                Tên hiển thị
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Nhập tên hiển thị mới"
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
          </div>
        </div>
      )}

      {/* TIỆN ÍCH & CÀI ĐẶT: THÊM MỤC THAY THEME WEB NỔI BẬT */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider px-1">
          Giao Diện & Tiện Ích
        </h3>

        <div className="rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/5 overflow-hidden">
          {/* Đổi Theme Web (Yêu cầu 4) */}
          <div
            onClick={() => setIsThemeModalOpen(true)}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors bg-gradient-to-r from-purple-500/10 to-transparent"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Chủ Đề & Giao Diện Web</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold uppercase">
                    8 Themes
                  </span>
                </p>
                <p className="text-[10px] text-white/50">
                  Đang dùng: <span className="text-[#c273ed] font-bold capitalize">{theme}</span> (Bấm để đổi)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-purple-300">Đổi theme</span>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </div>
          </div>

          {/* Cửa hàng / Kho nhạc đã mua */}
          <div
            onClick={() => setActiveMobileTab('library')}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kho Nhạc Đã Mua</p>
                <p className="text-[10px] text-white/50">{purchasedSongIds.length} bài hát bản quyền Full</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>

          {/* Hẹn giờ tắt nhạc */}
          <div
            onClick={() => setIsSleepTimerModalOpen(true)}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Hẹn Giờ Ngủ</p>
                <p className="text-[10px] text-white/50">Tự động tắt nhạc khi ngủ say</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>

          {/* Nối nhạc mượt mà (Crossfade - Requirement 5) */}
          <div
            onClick={() => setIsAudioSettingsModalOpen(true)}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Nối Nhạc Mượt Mà (Crossfade)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {crossfadeDuration === 0 ? 'Tắt' : `${crossfadeDuration}s`}
                  </span>
                </p>
                <p className="text-[10px] text-white/50">Hòa trộn âm thanh êm ái khi chuyển bài</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </div>

      {/* ĐĂNG XUẤT (NẾU ĐÃ ĐĂNG NHẬP) */}
      {currentUser && (
        <div className="pt-2">
          <button
            onClick={() => logout()}
            className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-98 text-red-400 font-bold text-xs flex items-center justify-center gap-2 border border-red-500/20 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      )}

      {/* THÔNG TIN ỨNG DỤNG */}
      <div className="text-center pt-4 text-[10px] text-white/30 space-y-1">
        <p className="font-bold uppercase tracking-widest text-white/40">XuanKen Music Mobile v3.2</p>
        <p>Bản quyền thuộc về XuanKen Singer • Nền tảng âm nhạc trực tuyến</p>
      </div>
    </div>
  );
};
