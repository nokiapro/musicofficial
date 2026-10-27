import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Users,
  Music2,
  DollarSign,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  LogIn,
  LogOut,
  Wallet,
  Link,
  FileText,
  Clock,
  ShieldAlert,
  Code,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song, AppUser, AudioFormat } from '../../types/music';
import { audioEngine } from '../../services/audioEngine';

export const AdminPageView: React.FC = () => {
  const {
    songs,
    addNewSong,
    editSong,
    removeSong,
    currentUser,
    isAdmin,
    loginWithEmail,
    logout,
    members,
    updateMemberBalance,
    updateMember,
    removeMember,
    toggleMemberRole,
  } = useMusic();

  const [activeAdminTab, setActiveAdminTab] = useState<'songs' | 'members' | 'rules'>('songs');

  // Login form state for unauthenticated admin
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Song Add/Edit Modal State
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [artists, setArtists] = useState('');
  const [album, setAlbum] = useState('');
  const [audioFormat, setAudioFormat] = useState<AudioFormat>('MP3');
  const [price, setPrice] = useState('20000');
  const [demoUrl, setDemoUrl] = useState('');
  const [mp3Url, setMp3Url] = useState('');
  const [wavUrl, setWavUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('3');
  const [durationSeconds, setDurationSeconds] = useState('30');
  const [playCountInput, setPlayCountInput] = useState('0');
  const [lrcType, setLrcType] = useState<'text' | 'link'>('text');
  const [lrcRaw, setLrcRaw] = useState('');
  const [lrcUrl, setLrcUrl] = useState('');
  const [autoCalculatedDuration, setAutoCalculatedDuration] = useState<number>(210);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);

  // Member Edit Modal State (displayName, role, balance - Requirement 3)
  const [editingMember, setEditingMember] = useState<AppUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editBalance, setEditBalance] = useState<string>('0');
  const [copiedRuleFile, setCopiedRuleFile] = useState<string | null>(null);

  // If not logged in, show Admin Login Screen
  if (!currentUser) {
    const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setIsLoggingIn(true);
      const res = await loginWithEmail(loginEmail, loginPass);
      setIsLoggingIn(false);
      if (!res.success) {
        setLoginError(res.message);
      }
    };

    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-[#170f23] border border-white/10 shadow-2xl text-white">
        <div className="w-14 h-14 rounded-2xl bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-center tracking-tight">Đăng Nhập Trang Quản Trị</h2>
        <p className="text-xs text-white/60 text-center mt-2 leading-relaxed">
          Khu vực quản trị chỉ dành cho tài khoản Admin được cấu hình trên Firebase Authentication.
        </p>

        {loginError && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="block text-white/70 mb-1 font-bold">Email Admin</label>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="xuankensinger@gmail.com"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#9b4de0]"
            />
          </div>

          <div>
            <label className="block text-white/70 mb-1 font-bold">Mật khẩu</label>
            <input
              type="password"
              required
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#9b4de0]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-sm shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoggingIn ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị'}</span>
          </button>
        </form>
      </div>
    );
  }

  // If logged in but not admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[#170f23] border border-red-500/30 text-white text-center">
        <ShieldAlert className="w-14 h-14 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Không Có Quyền Truy Cập Admin</h2>
        <p className="text-xs text-white/60 mt-2">
          Tài khoản <strong className="text-white">{currentUser.email}</strong> không có vai trò Quản trị viên (Admin).
        </p>
        <button
          onClick={logout}
          className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
        >
          Đăng xuất tài khoản
        </button>
      </div>
    );
  }

  // Calculate duration automatically from audio URLs (full tracks only, never capped to 60s demo)
  const triggerAutoDuration = async (urlToCheck: string) => {
    if (!urlToCheck || !urlToCheck.trim()) return;
    setIsDetectingDuration(true);
    const dur = await audioEngine.calculateDurationFromUrl(urlToCheck);
    if (dur > 60) {
      setAutoCalculatedDuration(dur);
      setDurationMinutes(Math.floor(dur / 60).toString());
      setDurationSeconds((dur % 60).toString().padStart(2, '0'));
    }
    setIsDetectingDuration(false);
  };

  const handleOpenAddModal = () => {
    setEditingSongId(null);
    setTitle('');
    setArtists('');
    setAlbum('');
    setCoverImage('');
    setAudioFormat('MP3');
    setPrice('20000');
    setDurationMinutes('3');
    setDurationSeconds('30');
    setPlayCountInput('0');
    setDemoUrl('');
    setMp3Url('');
    setWavUrl('');
    setLrcType('text');
    setLrcRaw('');
    setLrcUrl('');
    setAutoCalculatedDuration(210);
    setIsSongModalOpen(true);
  };

  const handleOpenEditModal = (song: Song) => {
    setEditingSongId(song.id);
    setTitle(song.title);
    setArtists(song.artists);
    setAlbum(song.album || '');
    setCoverImage(song.coverImage || '');
    setAudioFormat(song.audioFormat);
    setPrice(song.price.toString());
    const totalSecs = song.duration && song.duration > 0 ? song.duration : 210;
    setDurationMinutes(Math.floor(totalSecs / 60).toString());
    setDurationSeconds((totalSecs % 60).toString().padStart(2, '0'));
    setPlayCountInput((song.playCount || 0).toString());
    setDemoUrl(song.demoUrl || '');
    setMp3Url(song.mp3Url || '');
    setWavUrl(song.wavUrl || '');
    setLrcType(song.lrcUrl ? 'link' : 'text');
    setLrcRaw(song.lrcRaw || '');
    setLrcUrl(song.lrcUrl || '');
    setAutoCalculatedDuration(totalSecs);
    setIsSongModalOpen(true);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate user-specified duration (Phút : Giây)
    const mins = parseInt(durationMinutes, 10) || 0;
    const secs = parseInt(durationSeconds, 10) || 0;
    let finalDuration = mins * 60 + secs;
    if (finalDuration <= 0) {
      finalDuration = autoCalculatedDuration > 60 ? autoCalculatedDuration : 210;
    }
    const numPlayCount = Math.max(0, parseInt(playCountInput, 10) || 0);

    // Parse LRC lines if text provided
    const parsedLyrics = lrcRaw
      ? lrcRaw
          .split('\n')
          .map((line, idx) => {
            const timeMatch = line.match(/\[(\d{2}):(\d{2})/);
            let time = idx * 10;
            if (timeMatch) {
              time = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
            }
            return { time, text: line };
          })
          .filter((l) => l.text.trim().length > 0)
      : [];

    const gradients = [
      'from-pink-500 via-rose-500 to-purple-600',
      'from-amber-600 via-red-600 to-purple-800',
      'from-indigo-600 via-sky-700 to-slate-800',
      'from-emerald-700 via-teal-800 to-slate-900',
      'from-violet-600 via-fuchsia-600 to-indigo-900',
    ];

    if (editingSongId) {
      const existing = songs.find((s) => s.id === editingSongId);
      if (existing) {
        const updated: Song = {
          ...existing,
          title,
          artists,
          album,
          coverImage: coverImage.trim() || existing.coverImage || undefined,
          audioFormat,
          price: parseInt(price, 10) || 0,
          playCount: numPlayCount,
          demoUrl: demoUrl.trim() || undefined,
          mp3Url: mp3Url.trim() || undefined,
          wavUrl: wavUrl.trim() || undefined,
          lrcUrl: lrcType === 'link' ? lrcUrl.trim() : undefined,
          lrcRaw: lrcType === 'text' ? lrcRaw : undefined,
          lyrics: parsedLyrics,
          duration: finalDuration,
        };
        await editSong(updated);
      }
    } else {
      const newSong: Song = {
        id: `song-${Date.now()}`,
        stt: songs.length + 1,
        title,
        artists,
        album,
        coverImage: coverImage.trim() || undefined,
        audioFormat,
        price: parseInt(price, 10) || 0,
        playCount: numPlayCount,
        demoUrl: demoUrl.trim() || undefined,
        mp3Url: mp3Url.trim() || undefined,
        wavUrl: wavUrl.trim() || undefined,
        lrcUrl: lrcType === 'link' ? lrcUrl.trim() : undefined,
        lrcRaw: lrcType === 'text' ? lrcRaw : undefined,
        lyrics: parsedLyrics,
        duration: finalDuration,
        coverGradient: gradients[Math.floor(Math.random() * gradients.length)],
        releaseDate: new Date().getFullYear().toString(),
      };
      await addNewSong(newSong);
    }

    setIsSongModalOpen(false);
  };

  const handleOpenEditMember = (m: AppUser) => {
    setEditingMember(m);
    setEditDisplayName(m.displayName || '');
    setEditRole(m.role || 'user');
    setEditBalance(m.balance?.toString() || '0');
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const numBalance = Math.max(0, parseInt(editBalance, 10) || 0);
    await updateMember(editingMember.uid, {
      displayName: editDisplayName.trim() || editingMember.email.split('@')[0],
      role: editRole,
      balance: numBalance,
    });
    setEditingMember(null);
  };

  const copyRuleToClipboard = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedRuleFile(filename);
    setTimeout(() => setCopiedRuleFile(null), 2500);
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-[#c273ed] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
              Quản Trị Hệ Thống XuanKen Music
            </h1>
            <p className="text-xs text-white/60">
              Đăng nhập bởi: <strong className="text-white">{currentUser.email}</strong> • Quản lý bài hát & thành viên
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs: Quản Lý Bài Hát vs Quản Lý Thành Viên vs Quy Tắc Firebase */}
      <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveAdminTab('songs')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'songs'
              ? 'bg-[#9b4de0] text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span>Quản Lý Bài Hát ({songs.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('members')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'members'
              ? 'bg-[#9b4de0] text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản Lý Thành Viên ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('rules')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'rules'
              ? 'bg-[#9b4de0] text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Quy Tắc Firebase (Rules)</span>
        </button>
      </div>

      {/* TAB 1: QUẢN LÝ BÀI HÁT */}
      {activeAdminTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Danh sách bài hát lưu trên Firebase RTDB • Thời lượng tính tự động từ link nhạc
            </p>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bài Hát Mới</span>
            </button>
          </div>

          {songs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/20 bg-white/5">
              <Music2 className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Chưa Có Bài Hát Nào</h3>
              <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                Dữ liệu demo đã được xóa hoàn toàn. Bấm nút "Thêm Bài Hát Mới" để thêm ca khúc của bạn!
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-4 py-2 rounded-xl bg-[#9b4de0] text-white text-xs font-bold shadow"
              >
                + Thêm Bài Ngay
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4 min-w-[200px]">TÊN BÀI HÁT</th>
                      <th className="py-3 px-4 min-w-[140px]">CA SỸ</th>
                      <th className="py-3 px-4 text-center w-20">ĐỊNH DẠNG</th>
                      <th className="py-3 px-4 text-center w-28">GIÁ BÁN</th>
                      <th className="py-3 px-4 text-center w-24">THỜI LƯỢNG</th>
                      <th className="py-3 px-4 text-center w-36">3 LINK NHẠC</th>
                      <th className="py-3 px-4 text-right w-28">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {songs.map((song, i) => (
                      <tr key={song.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-white/40 font-bold">
                          {song.stt || i + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-900 relative">
                              {song.coverImage ? (
                                <img
                                  src={song.coverImage}
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : null}
                              <div className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}>
                                <Music2 className="w-4 h-4 text-white/60" />
                              </div>
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-white truncate max-w-xs">{song.title}</p>
                              <p className="text-[10px] text-white/40 truncate">{song.album || 'Độc quyền'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/80 font-medium truncate">
                          {song.artists}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[10px] ${
                              song.audioFormat === 'WAV'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {song.audioFormat}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-amber-300 font-bold">
                          {song.price.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-white/60">
                          {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                song.demoUrl ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/30'
                              }`}
                              title={song.demoUrl || 'Chưa có link demo'}
                            >
                              Demo
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                song.mp3Url ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/30'
                              }`}
                              title={song.mp3Url || 'Chưa có link mp3'}
                            >
                              MP3
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                song.wavUrl ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/30'
                              }`}
                              title={song.wavUrl || 'Chưa có link wav'}
                            >
                              WAV
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(song)}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-[#9b4de0] text-white"
                              title="Sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Xóa bài hát "${song.title}"?`)) {
                                  removeSong(song.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUẢN LÝ THÀNH VIÊN (Requirement 4) */}
      {activeAdminTab === 'members' && (
        <div className="space-y-4">
          <p className="text-xs text-white/50">
            Quản lý thành viên, kiểm tra số dư ví, cộng/trừ/xóa tiền và phân quyền Admin/User
          </p>

          {members.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/20 bg-white/5">
              <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Chưa Có Thành Viên Nào</h3>
              <p className="text-xs text-white/50 mt-1">
                Các thành viên khi đăng nhập qua Firebase Auth sẽ tự động xuất hiện ở danh sách này.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4 min-w-[180px]">EMAIL</th>
                      <th className="py-3 px-4 min-w-[140px]">TÊN HIỂN THỊ</th>
                      <th className="py-3 px-4 text-center w-24">VAI TRÒ</th>
                      <th className="py-3 px-4 text-center w-32">SỐ DƯ VÍ</th>
                      <th className="py-3 px-4 text-center w-28">ĐÃ MUA</th>
                      <th className="py-3 px-4 text-right min-w-[180px]">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members.map((member, i) => (
                      <tr key={member.uid} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-white/40 font-bold">
                          {i + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-white truncate">{member.email}</td>
                        <td className="py-3 px-4 text-white/80 truncate">{member.displayName}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleMemberRole(member.uid)}
                            className={`px-2 py-0.5 rounded font-black text-[10px] uppercase transition-colors ${
                              member.role === 'admin'
                                ? 'bg-purple-500/30 text-[#c273ed] border border-purple-500/50'
                                : 'bg-white/10 text-white/70'
                            }`}
                            title="Bấm để đổi quyền Admin/User"
                          >
                            {member.role}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                          {member.balance.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-center text-white/60">
                          {member.purchasedSongIds?.length || 0} bài
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Requirement 3: Nút Chỉnh sửa thành viên (Tên, vai trò, số tiền) */}
                            <button
                              onClick={() => handleOpenEditMember(member)}
                              className="px-2.5 py-1 rounded-lg bg-[#9b4de0]/30 hover:bg-[#9b4de0] text-[#c273ed] hover:text-white font-bold flex items-center gap-1 transition-colors"
                              title="Chỉnh sửa tên hiển thị, vai trò, số tiền"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa Thành Viên</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Xóa thành viên "${member.email}"?`)) {
                                  removeMember(member.uid);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white/70 hover:text-white transition-colors"
                              title="Xóa thành viên"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUY TẮC FIREBASE (RULES - Requirement 1) */}
      {activeAdminTab === 'rules' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-[#c273ed]" />
              <span>Quy Tắc Bảo Mật Firebase Đã Được Tạo Tự Động</span>
            </h3>
            <p className="text-white/70 mt-1 leading-relaxed">
              Các tệp quy tắc bảo mật đã được tạo tại thư mục gốc của dự án (<code className="text-amber-300">firestore.rules</code>, <code className="text-amber-300">database.rules.json</code>, <code className="text-amber-300">storage.rules</code>). Bạn có thể bấm nút <strong>Sao chép</strong> dưới đây và dán trực tiếp vào Firebase Console (<a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-purple-300 underline font-bold">console.firebase.google.com</a>) để áp dụng ngay.
            </p>
          </div>

          {/* 1. Realtime Database Rules */}
          <div className="rounded-2xl border border-white/10 bg-[#170f23] overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">database.rules.json (Firebase Realtime Database)</span>
                <p className="text-[11px] text-white/50">Dành cho lưu trữ bài hát và danh sách thành viên hiện tại</p>
              </div>
              <button
                onClick={() =>
                  copyRuleToClipboard(
                    'database.rules.json',
                    JSON.stringify(
                      {
                        rules: {
                          songs: {
                            ".read": true,
                            ".write": "auth != null && (auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')",
                          },
                          members: {
                            ".read": "auth != null && (auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')",
                            "$uid": {
                              ".read": "auth != null && (auth.uid === $uid || auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')",
                              ".write": "auth != null && (auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')",
                            },
                          },
                          purchases: {
                            "$uid": {
                              ".read": "auth != null && (auth.uid === $uid || auth.token.email === 'xuankensinger@gmail.com')",
                              ".write": "auth != null && auth.uid === $uid",
                            },
                          },
                        },
                      },
                      null,
                      2
                    )
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedRuleFile === 'database.rules.json' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép File</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-emerald-400 bg-black/60 overflow-x-auto max-h-56 leading-relaxed">
{`{
  "rules": {
    "songs": {
      ".read": true,
      ".write": "auth != null && (auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')"
    },
    "members": {
      ".read": "auth != null && (auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')",
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null && (auth.token.email === 'xuankensinger@gmail.com' || root.child('members').child(auth.uid).child('role').val() === 'admin')"
      }
    },
    "purchases": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || auth.token.email === 'xuankensinger@gmail.com')",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}`}
            </pre>
          </div>

          {/* 2. Cloud Firestore Rules */}
          <div className="rounded-2xl border border-white/10 bg-[#170f23] overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">firestore.rules (Cloud Firestore)</span>
                <p className="text-[11px] text-white/50">Dành cho bộ sưu tập Firestore (songs, members, purchases)</p>
              </div>
              <button
                onClick={() =>
                  copyRuleToClipboard(
                    'firestore.rules',
                    `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isSuperAdmin() {
      return isAuthenticated() && (
        request.auth.token.email == 'xuankensinger@gmail.com' ||
        request.auth.token.admin == true
      );
    }
    function isUserAdmin() {
      return isSuperAdmin() || (
        isAuthenticated() &&
        exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin'
      );
    }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    match /songs/{songId} {
      allow read: if true;
      allow write: if isUserAdmin();
    }

    match /members/{userId} {
      allow read: if isOwner(userId) || isUserAdmin();
      allow write: if isUserAdmin();
      allow create: if isOwner(userId) && request.resource.data.role == 'user' && request.resource.data.balance == 0;
    }

    match /purchases/{purchaseId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isUserAdmin());
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isUserAdmin();
    }

    match /{document=**} {
      allow read, write: if isUserAdmin();
    }
  }
}`
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedRuleFile === 'firestore.rules' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép File</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-purple-300 bg-black/60 overflow-x-auto max-h-56 leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isSuperAdmin() {
      return isAuthenticated() && (
        request.auth.token.email == 'xuankensinger@gmail.com' ||
        request.auth.token.admin == true
      );
    }
    function isUserAdmin() {
      return isSuperAdmin() || (
        isAuthenticated() &&
        exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin'
      );
    }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    match /songs/{songId} {
      allow read: if true;
      allow write: if isUserAdmin();
    }

    match /members/{userId} {
      allow read: if isOwner(userId) || isUserAdmin();
      allow write: if isUserAdmin();
      allow create: if isOwner(userId) && request.resource.data.role == 'user' && request.resource.data.balance == 0;
    }

    match /purchases/{purchaseId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isUserAdmin());
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isUserAdmin();
    }

    match /{document=**} {
      allow read, write: if isUserAdmin();
    }
  }
}`}
            </pre>
          </div>

          {/* 3. Storage Rules */}
          <div className="rounded-2xl border border-white/10 bg-[#170f23] overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">storage.rules (Firebase Cloud Storage)</span>
                <p className="text-[11px] text-white/50">Dành cho bucket lưu trữ file âm thanh và ảnh bìa</p>
              </div>
              <button
                onClick={() =>
                  copyRuleToClipboard(
                    'storage.rules',
                    `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && (
        request.auth.token.email == 'xuankensinger@gmail.com' ||
        request.auth.token.admin == true
      );
    }
  }
}`
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedRuleFile === 'storage.rules' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép File</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-amber-300 bg-black/60 overflow-x-auto max-h-40 leading-relaxed">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && (
        request.auth.token.email == 'xuankensinger@gmail.com' ||
        request.auth.token.admin == true
      );
    }
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA THÀNH VIÊN (Tên hiển thị, vai trò, số tiền - Requirement 3) */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl p-6 text-white text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c273ed]" />
                <span>Chỉnh Sửa Thành Viên</span>
              </h2>
              <button onClick={() => setEditingMember(null)} className="p-1 text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-white/60">Tài khoản Email:</p>
                <p className="font-bold text-white text-sm font-mono mt-0.5">{editingMember.email}</p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">UID: {editingMember.uid}</p>
              </div>

              {/* 1. Tên hiển thị */}
              <div>
                <label className="block text-white/70 mb-1 font-bold">1. Tên hiển thị thành viên *</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Nhập tên hiển thị"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9b4de0]"
                />
              </div>

              {/* 2. Vai trò */}
              <div>
                <label className="block text-white/70 mb-1 font-bold">2. Vai trò tài khoản *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9b4de0]"
                >
                  <option value="user">User - Thành viên thông thường</option>
                  <option value="admin">Admin - Quản trị viên toàn quyền</option>
                </select>
              </div>

              {/* 3. Số tiền trong ví */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/70 font-bold">3. Số dư ví (VNĐ) *</label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {parseInt(editBalance || '0', 10).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#9b4de0]"
                />

                {/* Quick helper balance buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(editBalance || '0', 10);
                      setEditBalance((cur + 50000).toString());
                    }}
                    className="py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-mono font-bold text-[10px] border border-emerald-500/30 transition-colors"
                  >
                    +50.000đ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(editBalance || '0', 10);
                      setEditBalance((cur + 100000).toString());
                    }}
                    className="py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-mono font-bold text-[10px] border border-emerald-500/30 transition-colors"
                  >
                    +100.000đ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(editBalance || '0', 10);
                      setEditBalance((cur + 500000).toString());
                    }}
                    className="py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-mono font-bold text-[10px] border border-emerald-500/30 transition-colors"
                  >
                    +500.000đ
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditBalance('0')}
                    className="py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-mono font-bold text-[10px] border border-red-500/30 transition-colors"
                  >
                    Đặt 0đ
                  </button>
                </div>
              </div>

              <div className="mt-6 flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] font-bold text-white text-xs shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA BÀI HÁT (Requirements 2 & 3) */}
      {isSongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-lg font-bold">
                {editingSongId ? 'Chỉnh Sửa Bài Hát' : 'Thêm Bài Hát Mới'}
              </h2>
              <button onClick={() => setIsSongModalOpen(false)} className="p-1 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="mt-4 space-y-4 text-xs">
              {/* Row 1: Tên bài & Ca sỹ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1 font-bold">Tên bài hát *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Cơn Mưa Ngang Qua"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 font-bold">Tên ca sỹ *</label>
                  <input
                    type="text"
                    required
                    value={artists}
                    onChange={(e) => setArtists(e.target.value)}
                    placeholder="VD: Sơn Tùng M-TP"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>
              </div>

              {/* Requirement 5: Link ảnh bìa bài hát */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-white/80 font-bold text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#c273ed]" />
                    <span>Link ảnh bìa bài hát (Cover Image URL)</span>
                  </label>
                  <span className="text-[10px] text-white/40">Dán link ảnh (.jpg, .png, .webp)</span>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://example.com/anh-bia-bai-hat.jpg"
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-[11px] font-mono focus:outline-none focus:border-[#9b4de0]"
                  />
                  <div className="w-11 h-11 rounded-xl border border-white/10 bg-black/50 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {coverImage.trim() ? (
                      <img
                        src={coverImage.trim()}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-[9px] text-white/30 text-center leading-tight">Chưa có ảnh</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Album, Định dạng & Giá */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-white/70 mb-1 font-bold">Album</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="Tên album / Single"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 font-bold">Định dạng Audio *</label>
                  <select
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value as AudioFormat)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                  >
                    <option value="MP3">MP3 (320kbps)</option>
                    <option value="WAV">WAV (Lossless)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 mb-1 font-bold">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>
              </div>

              {/* Requirement 3: 3 LINK NHẠC (Demo 60s, MP3, WAV) */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  3 Link Tệp Nhạc (Demo 60s, MP3, WAV)
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold">1. Link nhạc Demo 60 giây</label>
                    <span className="text-[10px] text-amber-300">Dành cho khách nghe thử</span>
                  </div>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    
                    placeholder="https://example.com/demo60s.mp3"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold">2. Link nhạc MP3 (320kbps)</label>
                    <span className="text-[10px] text-blue-300">File chất lượng cao</span>
                  </div>
                  <input
                    type="url"
                    value={mp3Url}
                    onChange={(e) => setMp3Url(e.target.value)}
                    onBlur={() => triggerAutoDuration(mp3Url)}
                    placeholder="https://example.com/song.mp3"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold">3. Link nhạc WAV (Lossless)</label>
                    <span className="text-[10px] text-amber-400">File 24-bit Lossless</span>
                  </div>
                  <input
                    type="url"
                    value={wavUrl}
                    onChange={(e) => setWavUrl(e.target.value)}
                    onBlur={() => triggerAutoDuration(wavUrl)}
                    placeholder="https://example.com/song.wav"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>

                {/* Requirement 2: Thời lượng chuẩn (Phút : Giây) & Lượt nghe */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-white/80 mb-1 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#c273ed]" />
                      <span>Thời lượng bài hát *</span>
                    </label>
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5 focus-within:border-[#9b4de0]">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        placeholder="3"
                        className="w-10 bg-transparent text-white font-mono text-center font-bold text-xs focus:outline-none"
                      />
                      <span className="text-white/50 text-[10px]">phút</span>
                      <span className="text-white/30">:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={durationSeconds}
                        onChange={(e) => setDurationSeconds(e.target.value)}
                        placeholder="30"
                        className="w-10 bg-transparent text-white font-mono text-center font-bold text-xs focus:outline-none"
                      />
                      <span className="text-white/50 text-[10px]">giây</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-1 font-bold">
                      Lượt nghe (#xuankenchart)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={playCountInput}
                      onChange={(e) => setPlayCountInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                </div>

                {/* Auto duration helper */}
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-[#c273ed]" />
                    <span className="text-white/70">Tổng thời lượng lưu:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {durationMinutes}:{durationSeconds.padStart(2, '0')} (
                      {parseInt(durationMinutes || '0', 10) * 60 + parseInt(durationSeconds || '0', 10)}s)
                    </span>
                  </div>
                  {(mp3Url.trim() || wavUrl.trim()) && (
                    <button
                      type="button"
                      onClick={() => triggerAutoDuration(mp3Url.trim() || wavUrl.trim())}
                      className="px-2.5 py-1 rounded-lg bg-[#9b4de0]/20 hover:bg-[#9b4de0] text-[#c273ed] hover:text-white text-[10px] font-bold transition-colors"
                    >
                      {isDetectingDuration ? 'Đang dò...' : 'Dò từ file MP3/WAV'}
                    </button>
                  )}
                </div>
              </div>

              {/* Requirement 2: LRC có thể thêm chữ hoặc link đều được */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#c273ed]" />
                    Lời bài hát (LRC)
                  </p>
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLrcType('text')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        lrcType === 'text' ? 'bg-[#9b4de0] text-white' : 'text-white/50'
                      }`}
                    >
                      Nhập chữ LRC
                    </button>
                    <button
                      type="button"
                      onClick={() => setLrcType('link')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        lrcType === 'link' ? 'bg-[#9b4de0] text-white' : 'text-white/50'
                      }`}
                    >
                      Dán Link .lrc
                    </button>
                  </div>
                </div>

                {lrcType === 'link' ? (
                  <div>
                    <label className="block text-white/60 mb-1">Đường dẫn tệp .lrc trực tuyến</label>
                    <input
                      type="url"
                      value={lrcUrl}
                      onChange={(e) => setLrcUrl(e.target.value)}
                      placeholder="https://example.com/lyrics/song.lrc"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-white/60 mb-1">Nội dung LRC có timestamps [mm:ss.xx]</label>
                    <textarea
                      rows={4}
                      value={lrcRaw}
                      onChange={(e) => setLrcRaw(e.target.value)}
                      placeholder="[00:00.00] Tiêu đề bài hát&#10;[00:15.00] Dòng lời bài hát 1..."
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 font-mono text-[11px] text-white focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSongModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSongId ? 'Cập Nhật Bài Hát' : 'Lưu Bài Hát'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
