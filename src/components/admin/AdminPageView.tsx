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
  Tag,
  Sparkles,
  RefreshCw,
  Database,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song, AppUser, AudioFormat, Voucher } from '../../types/music';
import { audioEngine } from '../../services/audioEngine';
import { testFirebaseConnection } from '../../services/firebase';

export const AdminPageView: React.FC = () => {
  const {
    songs,
    addNewSong,
    editSong,
    removeSong,
    currentUser,
    isAdmin,
    loginWithEmail,
    registerWithEmail,
    logout,
    members,
    updateMemberBalance,
    updateMember,
    removeMember,
    toggleMemberRole,
    vouchers,
    addVoucher,
    removeVoucher,
    syncAllToFirebase,
    seedDefaultSongs,
  } = useMusic();

  const [activeAdminTab, setActiveAdminTab] = useState<'songs' | 'members' | 'rules' | 'vouchers'>('songs');

  // Voucher form state
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherType, setNewVoucherType] = useState<'percent' | 'fixed'>('percent');
  const [newVoucherVal, setNewVoucherVal] = useState('20');
  const [newVoucherDesc, setNewVoucherDesc] = useState('');
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);

  // Login form state for unauthenticated admin
  const [loginEmail, setLoginEmail] = useState('xuankensinger123@gmail.com');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Song Add/Edit Modal State
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

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
  const [firebaseTestResult, setFirebaseTestResult] = useState<{
    firestore: boolean;
    rtdb: boolean;
    rtdbWrite: boolean;
    message: string;
    details: string[];
  } | null>(null);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const res = await testFirebaseConnection();
      setFirebaseTestResult(res);
      if (res.rtdbWrite) {
        setSyncSuccessMsg('✅ Kết nối & Quyền ghi Firebase Realtime Database đã mở! Sẵn sàng lưu dữ liệu.');
        setSyncErrorMsg(null);
      } else {
        setSyncErrorMsg('⚠️ Firebase RTDB đang chặn quyền ghi (PERMISSION_DENIED). Hãy kiểm tra tab "Quy Tắc Firebase (Rules)" để mở quyền!');
      }
    } catch (e: any) {
      setFirebaseTestResult({
        firestore: false,
        rtdb: false,
        rtdbWrite: false,
        message: e?.message || 'Lỗi kiểm tra kết nối',
        details: [e?.message || 'Lỗi kiểm tra'],
      });
      setSyncErrorMsg('❌ Không thể kết nối Firebase: ' + (e?.message || 'Lỗi mạng'));
    } finally {
      setIsTestingFirebase(false);
    }
  };

  const handleForceSyncAll = async () => {
    setIsSyncingAll(true);
    setSyncErrorMsg(null);
    setSyncSuccessMsg(null);
    try {
      const res = await syncAllToFirebase();
      if (res.success) {
        setSyncSuccessMsg(`✅ ${res.details} Hãy mở Firebase Console (F5) để thấy dữ liệu xuất hiện ngay!`);
      } else {
        setSyncErrorMsg(`❌ ${res.details}. Nguyên nhân: Tab Quy tắc (Rules) trên Firebase Console đang khóa ghi. Hãy qua tab "Quy Tắc Firebase (Rules)" để mở!`);
      }
    } catch (e: any) {
      setSyncErrorMsg('❌ Lỗi đồng bộ: ' + (e?.message || 'Lỗi không xác định'));
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSeedSongs = async () => {
    setIsSeeding(true);
    setSyncErrorMsg(null);
    setSyncSuccessMsg(null);
    try {
      const res = await seedDefaultSongs();
      if (res.success) {
        setSyncSuccessMsg('✅ Đã nạp 3 bài hát mẫu XuanKen lên Firebase Realtime Database & Firestore thành công! Hãy F5 Firebase Console để thấy dữ liệu.');
      } else {
        setSyncErrorMsg(`⚠️ Đã tạo bài hát trên web nhưng Firebase chưa cho phép ghi: ${res.error}. Hãy vào tab Quy Tắc Firebase để mở quyền ghi!`);
      }
    } catch (e: any) {
      setSyncErrorMsg('❌ Lỗi nạp bài mẫu: ' + (e?.message || 'Lỗi'));
    } finally {
      setIsSeeding(false);
    }
  };

  // If not logged in, show Admin Login / Register Screen
  if (!currentUser) {
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setLoginSuccess('');
      setIsLoggingIn(true);
      if (authMode === 'login') {
        const res = await loginWithEmail(loginEmail, loginPass);
        setIsLoggingIn(false);
        if (!res.success) {
          setLoginError(res.message);
        }
      } else {
        const res = await registerWithEmail(loginEmail, loginPass);
        setIsLoggingIn(false);
        if (!res.success) {
          setLoginError(res.message);
        } else {
          setLoginSuccess('Tạo tài khoản Admin thành công! Đang tự động đăng nhập...');
        }
      }
    };

    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-[#170f23] border border-white/10 shadow-2xl text-white">
        <div className="w-14 h-14 rounded-2xl bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-center tracking-tight">
          {authMode === 'login' ? 'Đăng Nhập Trang Quản Trị' : 'Tạo Tài Khoản Admin'}
        </h2>
        <p className="text-xs text-white/60 text-center mt-2 leading-relaxed">
          {authMode === 'login'
            ? 'Đăng nhập tài khoản Admin trên Firebase Authentication để quản lý nhạc và đồng bộ dữ liệu.'
            : 'Tạo tài khoản Admin mới trên Firebase Auth cho dự án newmusic-5625b.'}
        </p>

        {/* Tab switch between Login and Register */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mt-5">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setLoginError(''); setLoginSuccess(''); }}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
              authMode === 'login' ? 'bg-[#9b4de0] text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setLoginError(''); setLoginSuccess(''); }}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
              authMode === 'register' ? 'bg-[#9b4de0] text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Tạo Tài Khoản Mới
          </button>
        </div>

        {loginError && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {loginSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{loginSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-white/70 mb-1 font-bold">Email Admin</label>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="xuankensinger123@gmail.com"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#9b4de0]"
            />
          </div>

          <div>
            <label className="block text-white/70 mb-1 font-bold">Mật khẩu (ít nhất 6 ký tự)</label>
            <input
              type="password"
              required
              minLength={6}
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
            <span>{isLoggingIn ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng Nhập Quản Trị' : 'Tạo Tài Khoản Admin'}</span>
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

    let saveResult: { success: boolean; rtdb?: boolean; firestore?: boolean; error?: string } = { success: false };

    if (editingSongId) {
      const existing = songs.find((s) => s.id === editingSongId);
      if (existing) {
        const updated: Song = {
          ...existing,
          title: title.trim(),
          artists: artists.trim(),
          album: album.trim() || 'XuanKen Official',
          coverImage: coverImage.trim() || existing.coverImage || '',
          audioFormat,
          price: parseInt(price, 10) || 0,
          playCount: numPlayCount,
          demoUrl: demoUrl.trim() || '',
          mp3Url: mp3Url.trim() || '',
          wavUrl: wavUrl.trim() || '',
          lrcUrl: lrcType === 'link' ? lrcUrl.trim() : '',
          lrcRaw: lrcType === 'text' ? lrcRaw : '',
          lyrics: parsedLyrics,
          duration: finalDuration,
        };
        saveResult = await editSong(updated);
      }
    } else {
      const newSong: Song = {
        id: `song-${Date.now()}`,
        stt: songs.length + 1,
        title: title.trim(),
        artists: artists.trim(),
        album: album.trim() || 'XuanKen Official',
        coverImage: coverImage.trim() || '',
        audioFormat,
        price: parseInt(price, 10) || 0,
        playCount: numPlayCount,
        demoUrl: demoUrl.trim() || '',
        mp3Url: mp3Url.trim() || '',
        wavUrl: wavUrl.trim() || '',
        lrcUrl: lrcType === 'link' ? lrcUrl.trim() : '',
        lrcRaw: lrcType === 'text' ? lrcRaw : '',
        lyrics: parsedLyrics,
        duration: finalDuration,
        coverGradient: gradients[Math.floor(Math.random() * gradients.length)],
        releaseDate: new Date().getFullYear().toString(),
      };
      saveResult = await addNewSong(newSong);
    }

    setIsSongModalOpen(false);
    if (saveResult.success) {
      setSyncSuccessMsg(
        editingSongId
          ? '✅ Đã cập nhật bài hát và lưu thành công lên Firebase RTDB & Firestore!'
          : '✅ Đã thêm bài hát và lưu thành công lên Firebase RTDB & Firestore!'
      );
      setSyncErrorMsg(null);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } else {
      setSyncErrorMsg(
        `⚠️ Lưu trên ứng dụng nhưng Firebase từ chối: ${saveResult.error || 'PERMISSION_DENIED'}. Hãy mở tab "Quy Tắc Firebase (Rules)" để mở quyền ghi!`
      );
      setSyncSuccessMsg(null);
    }
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

      {/* Admin Tabs: Quản Lý Bài Hát vs Quản Lý Thành Viên vs Quy Tắc Firebase vs Mã Giảm Giá */}
      <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveAdminTab('songs')}
          style={activeAdminTab === 'songs' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'songs'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span>Quản Lý Bài Hát ({songs.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('members')}
          style={activeAdminTab === 'members' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'members'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản Lý Thành Viên ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('rules')}
          style={activeAdminTab === 'rules' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'rules'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Quy Tắc Firebase (Rules)</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('vouchers')}
          style={activeAdminTab === 'vouchers' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminTab === 'vouchers'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Mã Giảm Giá ({vouchers.length})</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {syncSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-white/60 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {syncErrorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-300">{syncErrorMsg}</p>
              <p className="text-[11px] text-white/70">
                👉 Gợi ý: Hãy mở tab <strong>"Quy Tắc Firebase (Rules)"</strong> bên cạnh, bấm <strong>"Sao Chép Quy Tắc Mở Quyền"</strong> rồi dán vào Firebase Console để mở quyền ghi!
              </p>
            </div>
          </div>
          <button onClick={() => setSyncErrorMsg(null)} className="text-white/60 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: QUẢN LÝ BÀI HÁT */}
      {activeAdminTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>Kho Bài Hát Trực Tuyến</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-[#c273ed] border border-purple-500/30 font-bold">
                  {songs.length} bài
                </span>
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                Đồng bộ realtime với Firebase RTDB ({'newmusic-5625b'})
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Force Sync All Button */}
              <button
                onClick={handleForceSyncAll}
                disabled={isSyncingAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50"
                title="Đẩy toàn bộ bài hát, thành viên, playlist lên Firebase ngay"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Đang đẩy lên Firebase...' : '🚀 Đẩy Lên Firebase'}</span>
              </button>

              {/* Seed Sample Songs Button if empty */}
              {songs.length === 0 && (
                <button
                  onClick={handleSeedSongs}
                  disabled={isSeeding}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50"
                  title="Nạp 3 bài hát mẫu XuanKen lên Firebase"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSeeding ? 'Đang nạp...' : '🌱 Nạp 3 Bài Mẫu'}</span>
                </button>
              )}

              {/* Add New Song Button */}
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Bài Hát Mới</span>
              </button>
            </div>
          </div>

          {songs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/20 bg-white/5 space-y-3">
              <Music2 className="w-12 h-12 text-white/30 mx-auto" />
              <h3 className="text-base font-bold text-white">Chưa Có Bài Hát Nào Trong Hệ Thống</h3>
              <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
                Trên Firebase Realtime Database hiện đang trống (null). Bạn có thể bấm <strong>"Thêm Bài Hát Mới"</strong> hoặc bấm <strong>"Nạp 3 Bài Mẫu Lên Firebase"</strong> để dữ liệu lập tức xuất hiện trên Firebase Console!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSeedSongs}
                  disabled={isSeeding}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSeeding ? 'Đang nạp bài mẫu...' : '🌱 Nạp 3 Bài Mẫu Của XuanKen Lên Firebase'}</span>
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Bài Mới Thủ Công</span>
                </button>
              </div>
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
                          {(song.price ?? 20000).toLocaleString('vi-VN')} đ
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
                          {(member.balance || 0).toLocaleString('vi-VN')} đ
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
          {/* Live Firebase Connectivity Check Card */}
          <div className="p-5 rounded-2xl bg-[#170f23] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Database className="w-4 h-4" />
                <span>Trạng Thái Đồng Bộ Firebase Trực Tuyến</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Kiểm Tra Kết Nối Cloud Firestore & Realtime Database
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Dự án Firebase kết nối: <code className="text-amber-300 font-mono">newmusic-5625b</code>
              </p>
              {firebaseTestResult && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${firebaseTestResult.rtdb ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400'}`} />
                    <span className="text-white font-medium">Realtime Database:</span>
                    <span className={firebaseTestResult.rtdb ? 'text-emerald-300 font-bold' : 'text-red-300'}>
                      {firebaseTestResult.rtdb ? 'Đang hoạt động (Đọc dữ liệu bài hát thành công)' : 'Chưa kết nối'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${firebaseTestResult.firestore ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400'}`} />
                    <span className="text-white font-medium">Cloud Firestore:</span>
                    <span className={firebaseTestResult.firestore ? 'text-emerald-300 font-bold' : 'text-red-300'}>
                      {firebaseTestResult.firestore ? 'Đang hoạt động (Đọc dữ liệu bài hát thành công)' : 'Chưa kết nối'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">{firebaseTestResult.message}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleTestFirebase}
              disabled={isTestingFirebase}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg shadow-emerald-900/30"
            >
              <RefreshCw className={`w-4 h-4 ${isTestingFirebase ? 'animate-spin' : ''}`} />
              <span>{isTestingFirebase ? 'Đang kiểm tra...' : 'Kiểm Tra Đồng Bộ Ngay'}</span>
            </button>
          </div>

          {/* Dedicated Firebase null Explanation Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-purple-950/40 to-[#170f23] border border-amber-500/30 text-xs space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-black text-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Tại Sao Firebase Console Hiển Thị: "{'https://...firebasedatabase.app/: null'}"?</span>
            </div>
            <p className="text-white/80 leading-relaxed">
              Bạn thấy dòng chữ <code className="text-amber-300 font-mono">: null</code> trên Firebase Console vì nhánh gốc cơ sở dữ liệu hiện chưa có bản ghi nào được ghi thành công. Có 2 nguyên nhân chính:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-white/70 pl-1">
              <li>
                <strong className="text-white">Quy tắc (Rules) bị khóa:</strong> Khi mới tạo Realtime Database, Firebase đặt mặc định <code className="text-red-300">.write: false</code> hoặc <code className="text-red-300">"auth != null"</code>. Khi bạn thao tác lưu bài hát từ web mà chưa đăng nhập Firebase Auth, Firebase sẽ chặn ghi (PERMISSION_DENIED).
              </li>
              <li>
                <strong className="text-white">Lỗi trường undefined:</strong> Phiên bản cũ gửi link demo/mp3 chưa điền dưới dạng <code className="text-red-300">undefined</code>, làm Firebase SDK hủy bỏ lệnh ghi. <em>(Lỗi này hiện đã được hệ thống sửa hoàn toàn với hàm cleanForFirebase)</em>.
              </li>
            </ol>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>3 Bước Đơn Giản Để Dữ Liệu Hiện Lên Firebase Ngay Lập Tức:</span>
              </p>
              <p className="text-white/80">
                1. Bấm nút <strong>"Sao Chép Quy Tắc Mở Quyền"</strong> ngay bên dưới.
              </p>
              <p className="text-white/80">
                2. Mở{' '}
                <a
                  href="https://console.firebase.google.com/project/newmusic-5625b/database/newmusic-5625b-default-rtdb/rules"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-300 underline font-bold"
                >
                  Firebase Console &gt; Realtime Database &gt; Tab Quy tắc (Rules)
                </a>
                , dán đè vào và bấm <strong>Xuất bản (Publish)</strong>.
              </p>
              <p className="text-white/80">
                3. Quay lại website, bấm nút <strong>"🚀 Đẩy Lên Firebase"</strong> hoặc <strong>"🌱 Nạp 3 Bài Mẫu"</strong> trong tab "Quản Lý Bài Hát". F5 lại Firebase Console là dữ liệu hiện ra 100%!
              </p>
            </div>
          </div>

          {/* 1. Realtime Database Open Rules (Recommended for immediate data persistence) */}
          <div className="rounded-2xl border border-amber-500/40 bg-[#170f23] overflow-hidden shadow-xl">
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">database.rules.json (Quy Tắc Mở Quyền - Khuyên Dùng Ngay)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-black">
                    Ưu tiên số 1
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-0.5">
                  Cho phép website ghi bài hát, thành viên, playlist ngay lập tức mà không bị chặn quyền
                </p>
              </div>
              <button
                onClick={() =>
                  copyRuleToClipboard(
                    'open_rtdb_rules',
                    JSON.stringify(
                      {
                        rules: {
                          ".read": true,
                          ".write": true,
                        },
                      },
                      null,
                      2
                    )
                  )
                }
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-black flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95"
              >
                {copiedRuleFile === 'open_rtdb_rules' ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Đã sao chép! Dán vào Firebase ngay</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao Chép Quy Tắc Mở Quyền</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-400 bg-black/60 overflow-x-auto leading-relaxed">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
            </pre>
          </div>

          {/* 2. Realtime Database Granular Rules (Optional) */}
          <div className="rounded-2xl border border-white/10 bg-[#170f23] overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm">database.rules.json (Quy Tắc Phân Quyền Chi Tiết)</span>
                <p className="text-[11px] text-white/50">Phân quyền theo từng nhánh songs, members, purchases, vouchers</p>
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
                            ".write": true,
                          },
                          members: {
                            ".read": true,
                            ".write": true,
                          },
                          purchases: {
                            ".read": true,
                            ".write": true,
                          },
                          playlists: {
                            ".read": true,
                            ".write": true,
                          },
                          vouchers: {
                            ".read": true,
                            ".write": true,
                          },
                        },
                      },
                      null,
                      2
                    )
                  )
                }
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedRuleFile === 'database.rules.json' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Quy Tắc Chi Tiết</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-emerald-400 bg-black/60 overflow-x-auto max-h-56 leading-relaxed">
{`{
  "rules": {
    "songs": {
      ".read": true,
      ".write": true
    },
    "members": {
      ".read": true,
      ".write": true
    },
    "purchases": {
      ".read": true,
      ".write": true
    },
    "playlists": {
      ".read": true,
      ".write": true
    },
    "vouchers": {
      ".read": true,
      ".write": true
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
    match /songs/{songId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /members/{userId} {
      allow read, write: if request.auth != null;
    }
    match /purchases/{purchaseId} {
      allow read, write: if request.auth != null;
    }
    match /playlists/{playlistId} {
      allow read, write: if true;
    }
    match /vouchers/{voucherId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
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
    match /songs/{songId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /members/{userId} {
      allow read, write: if request.auth != null;
    }
    match /purchases/{purchaseId} {
      allow read, write: if request.auth != null;
    }
    match /playlists/{playlistId} {
      allow read, write: if true;
    }
    match /vouchers/{voucherId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
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
      allow write: if request.auth != null;
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
      allow write: if request.auth != null;
    }
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: QUẢN LÝ VOUCHER / MÃ GIẢM GIÁ */}
      {activeAdminTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Quản lý mã giảm giá (Voucher / Coupon) cho khách hàng khi mua nhạc bản quyền
            </p>
            <button
              onClick={() => setIsAddingVoucher(!isAddingVoucher)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingVoucher ? 'Đóng Form' : 'Thêm Voucher Mới'}</span>
            </button>
          </div>

          {/* Form thêm voucher mới */}
          {isAddingVoucher && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newVoucherCode.trim()) return;
                const numVal = parseInt(newVoucherVal, 10) || 0;
                await addVoucher({
                  id: `v-${Date.now()}`,
                  code: newVoucherCode.trim().toUpperCase(),
                  discountType: newVoucherType,
                  discountValue: numVal,
                  description: newVoucherDesc.trim() || (newVoucherType === 'percent' ? `Giảm ${numVal}%` : `Giảm ${numVal.toLocaleString('vi-VN')}đ`),
                  isActive: true,
                });
                setNewVoucherCode('');
                setNewVoucherDesc('');
                setIsAddingVoucher(false);
              }}
              className="p-4 rounded-2xl bg-[#170f23] border border-purple-500/30 space-y-3"
            >
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#c273ed]" />
                <span>Tạo Mã Giảm Giá Mới</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-white/70 mb-1 font-bold">Mã Code *</label>
                  <input
                    type="text"
                    required
                    value={newVoucherCode}
                    onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                    placeholder="VD: XUANKEN50"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono uppercase text-xs focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 font-bold">Loại Giảm Giá *</label>
                  <select
                    value={newVoucherType}
                    onChange={(e) => setNewVoucherType(e.target.value as 'percent' | 'fixed')}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#9b4de0]"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 mb-1 font-bold">
                    Giá trị giảm ({newVoucherType === 'percent' ? '%' : 'VNĐ'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newVoucherVal}
                    onChange={(e) => setNewVoucherVal(e.target.value)}
                    placeholder="VD: 50"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/70 mb-1 font-bold">Mô tả hiển thị</label>
                <input
                  type="text"
                  value={newVoucherDesc}
                  onChange={(e) => setNewVoucherDesc(e.target.value)}
                  placeholder="VD: Giảm 50% cho tất cả bài hát bản quyền"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#9b4de0]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingVoucher(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold shadow-md"
                >
                  Lưu Voucher
                </button>
              </div>
            </form>
          )}

          {/* Danh sách voucher */}
          <div className="rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 min-w-[140px]">MÃ VOUCHER</th>
                    <th className="py-3 px-4 w-32 text-center">LOẠI GIẢM</th>
                    <th className="py-3 px-4 w-32 text-center">GIÁ TRỊ</th>
                    <th className="py-3 px-4 min-w-[200px]">MÔ TẢ</th>
                    <th className="py-3 px-4 w-28 text-center">TRẠNG THÁI</th>
                    <th className="py-3 px-4 w-20 text-right">XÓA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vouchers.map((v, i) => (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-white/40">{i + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300 text-sm">{v.code}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                          {v.discountType === 'percent' ? 'Phần trăm' : 'Số tiền'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                        {v.discountType === 'percent' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString('vi-VN')}đ`}
                      </td>
                      <td className="py-3 px-4 text-white/80">{v.description}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {v.isActive ? 'Đang áp dụng' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Xóa voucher "${v.code}"?`)) {
                              removeVoucher(v.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-colors"
                          title="Xóa voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
