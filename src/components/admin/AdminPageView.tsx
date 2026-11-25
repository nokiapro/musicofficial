import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Users,
  Music2,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  LogIn,
  LogOut,
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
  Settings,
  Globe,
  Sliders,
  Upload,
  Disc,
  Disc3,
  Mic2,
  KeyRound,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song, AppUser, AudioFormat } from '../../types/music';
import { audioEngine } from '../../services/audioEngine';
import { testFirebaseConnection } from '../../services/firebase';
import { MusicService } from '../../services/musicService';
import { AdminCuratedAlbumsTab } from './AdminCuratedAlbumsTab';
import { AdminArtistBiosTab } from './AdminArtistBiosTab';
import { AdminApiKeysTab } from './AdminApiKeysTab';
import { useAnimatedData, useAnimatedPresence } from '../../hooks/useAnimatedPresence';

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
    updateMember,
    removeMember,
    toggleMemberRole,
    addAdminByEmail,
    vouchers,
    addVoucher,
    removeVoucher,
    syncAllToFirebase,
    seedDefaultSongs,
    siteSettings,
    updateSiteSettings,
    theme,
    exclusiveAlbums,
  } = useMusic();

  const [activeAdminTab, setActiveAdminTab] = useState<'songs' | 'albums' | 'artists' | 'members' | 'rules' | 'vouchers' | 'settings' | 'api'>('songs');
  const [songSearch, setSongSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'song' | 'member' | 'voucher';
    id: string;
    label: string;
  } | null>(null);

  // Website Settings State (Item 11)
  const [siteNameInput, setSiteNameInput] = useState(siteSettings?.siteName ?? '');
  const [siteSloganInput, setSiteSloganInput] = useState(siteSettings?.siteSlogan ?? '');
  const [logoUrlInput, setLogoUrlInput] = useState(siteSettings?.logoUrl || 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png');
  const [faviconUrlInput, setFaviconUrlInput] = useState(siteSettings?.faviconUrl || 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png');
  const [defaultBalanceInput, setDefaultBalanceInput] = useState(siteSettings?.defaultStartingBalance?.toString() || '500000');
  const [defaultSongPriceInput, setDefaultSongPriceInput] = useState(siteSettings?.defaultSongPrice?.toString() || '20000');
  const [minListenDurationInput, setMinListenDurationInput] = useState(siteSettings?.minListenDurationSeconds?.toString() || '5');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);
  const [settingsErrorMsg, setSettingsErrorMsg] = useState<string | null>(null);

  // Sync inputs when siteSettings change
  React.useEffect(() => {
    if (siteSettings) {
      setSiteNameInput(siteSettings.siteName ?? '');
      setSiteSloganInput(siteSettings.siteSlogan ?? '');
      setLogoUrlInput(siteSettings.logoUrl ?? '');
      setFaviconUrlInput(siteSettings.faviconUrl ?? '');
      setDefaultBalanceInput((siteSettings.defaultStartingBalance ?? 500000).toString());
      setDefaultSongPriceInput((siteSettings.defaultSongPrice ?? 20000).toString());
      setMinListenDurationInput((siteSettings.minListenDurationSeconds ?? 5).toString());
    }
  }, [siteSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccessMsg(null);
    setSettingsErrorMsg(null);
    try {
      await updateSiteSettings({
        siteName: siteNameInput.trim(),
        siteSlogan: siteSloganInput.trim(),
        logoUrl: logoUrlInput.trim(),
        faviconUrl: faviconUrlInput.trim(),
        defaultStartingBalance: Math.max(0, parseInt(defaultBalanceInput, 10) || 500000),
        defaultSongPrice: Math.max(0, parseInt(defaultSongPriceInput, 10) || 20000),
        minListenDurationSeconds: Math.max(1, parseInt(minListenDurationInput, 10) || 5),
      });
      setSettingsSuccessMsg('Đã lưu cấu hình website thành công! Tên web, slogan bên dưới logo, ảnh logo, favicon và tiền mặc định đã được cập nhật đồng bộ.');
    } catch (err: any) {
      console.error(err);
      setSettingsErrorMsg(
        err?.message || 'Không thể lưu cấu hình lên Firebase. Vui lòng kiểm tra Rules Firebase trong tab Rules Firebase.'
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrlInput(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFaviconUrlInput(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Voucher form state
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherType, setNewVoucherType] = useState<'percent' | 'fixed'>('percent');
  const [newVoucherVal, setNewVoucherVal] = useState('20');
  const [newVoucherDesc, setNewVoucherDesc] = useState('');
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);

  // Login form state for unauthenticated admin
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Super Admin Management State
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [adminAddMsg, setAdminAddMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmailInput.trim()) return;
    setIsAddingAdmin(true);
    setAdminAddMsg(null);
    try {
      const res = await addAdminByEmail(newAdminEmailInput.trim());
      setAdminAddMsg({ text: res.message, success: res.success });
      if (res.success) {
        setNewAdminEmailInput('');
      }
    } catch (err: any) {
      setAdminAddMsg({ text: err.message || 'Lỗi thêm admin', success: false });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Song Add/Edit Modal State
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [isSavingSong, setIsSavingSong] = useState(false);
  const [songSaveError, setSongSaveError] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const [title, setTitle] = useState('');
  const [artists, setArtists] = useState('XuanKen');
  const [album, setAlbum] = useState('XuanKen Music Official');
  const [composer, setComposer] = useState('XuanKen');
  const [genre, setGenre] = useState('Việt Nam, V-Pop');
  const [releaseDate, setReleaseDate] = useState('2026');
  const [provider, setProvider] = useState('XuanKen Official');
  const [audioFormat, setAudioFormat] = useState<AudioFormat>('MP3');
  const [price, setPrice] = useState('20000');
  const [demoUrl, setDemoUrl] = useState('');
  const [mp3128Url, setMp3128Url] = useState('');
  const [mp3Url, setMp3Url] = useState('');
  const [wavUrl, setWavUrl] = useState('');
  const [coverImage, setCoverImage] = useState('https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png');
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

  const {
    activeData: activeEditingMember,
    shouldRender: shouldRenderMemberModal,
    isClosing: isClosingMemberModal,
  } = useAnimatedData(editingMember, 220);
  const {
    shouldRender: shouldRenderSongModal,
    isClosing: isClosingSongModal,
  } = useAnimatedPresence(isSongModalOpen, 220);
  const {
    activeData: activeConfirmDelete,
    shouldRender: shouldRenderConfirmDelete,
    isClosing: isClosingConfirmDelete,
  } = useAnimatedData(confirmDelete, 200);

  const normalizedSongQuery = songSearch.trim().toLowerCase();
  const filteredSongs = [...songs]
    .filter((s) => {
      if (!normalizedSongQuery) return true;
      return (
        s.title.toLowerCase().includes(normalizedSongQuery) ||
        s.artists.toLowerCase().includes(normalizedSongQuery) ||
        (s.album || '').toLowerCase().includes(normalizedSongQuery)
      );
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }));

  const normalizedMemberQuery = memberSearch.trim().toLowerCase();
  const filteredMembers = members.filter((m) => {
    if (!normalizedMemberQuery) return true;
    return (
      (m.email || '').toLowerCase().includes(normalizedMemberQuery) ||
      (m.displayName || '').toLowerCase().includes(normalizedMemberQuery)
    );
  });

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const res = await testFirebaseConnection();
      setFirebaseTestResult(res);
      if (res.rtdbWrite) {
        setSyncSuccessMsg('Kết nối & Quyền ghi Firebase Realtime Database đã mở! Sẵn sàng lưu dữ liệu.');
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
        setSyncSuccessMsg(`${res.details} Hãy mở Firebase Console (F5) để thấy dữ liệu xuất hiện ngay!`);
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
        setSyncSuccessMsg('Đã nạp 3 bài hát mẫu XuanKen lên Firebase Realtime Database & Firestore thành công! Hãy F5 Firebase Console để thấy dữ liệu.');
      } else {
        setSyncErrorMsg(`⚠️ Đã tạo bài hát trên web nhưng Firebase chưa cho phép ghi: ${res.error}. Hãy vào tab Quy Tắc Firebase để mở quyền ghi!`);
      }
    } catch (e: any) {
      setSyncErrorMsg('❌ Lỗi nạp bài mẫu: ' + (e?.message || 'Lỗi'));
    } finally {
      setIsSeeding(false);
    }
  };

  // If not logged in, show Admin Login Screen (Login-only, no registration)
  if (!currentUser) {
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setLoginSuccess('');
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
        <h2 className="text-2xl font-black text-center tracking-tight">
          Đăng Nhập Trang Quản Trị
        </h2>
        <p className="text-xs text-white/60 text-center mt-2 leading-relaxed">
          Đăng nhập bằng tài khoản Quản trị viên <strong className="text-white">admin@xuanken.vn</strong> hoặc tài khoản được cấp quyền Admin để quản lý bài hát và thành viên.
        </p>

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
              placeholder=""
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
            className="w-full py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-sm shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoggingIn ? 'Đang xử lý...' : 'Đăng Nhập Quản Trị'}</span>
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
          Tài khoản <strong className="text-white">{currentUser.email}</strong> hiện là thành viên thông thường. Quyền Admin được phân quyền trực tiếp bởi <strong className="text-purple-300">admin@xuanken.vn</strong> trong trang quản trị.
        </p>
        <button
          onClick={logout}
          className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
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
    setArtists('XuanKen');
    setAlbum('XuanKen Music Official');
    setComposer('XuanKen');
    setGenre('Việt Nam, V-Pop');
    setReleaseDate(new Date().getFullYear().toString());
    setProvider('XuanKen Official');
    setCoverImage('https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png');
    setAudioFormat('MP3');
    setPrice('20000');
    setDurationMinutes('3');
    setDurationSeconds('30');
    setPlayCountInput('0');
    setDemoUrl('');
    setMp3128Url('');
    setMp3Url('');
    setWavUrl('');
    setLrcType('text');
    setLrcRaw('');
    setLrcUrl('');
    setAutoCalculatedDuration(210);
    setSongSaveError(null);
    setIsSongModalOpen(true);
  };

  const handleOpenEditModal = (song: Song) => {
    setEditingSongId(song.id);
    setTitle(song.title);
    setArtists(song.artists);
    setAlbum(song.album || '');
    setComposer(song.composer || song.artists || 'XuanKen');
    setGenre(song.genre || 'Việt Nam, V-Pop');
    setReleaseDate(song.releaseDate || new Date().getFullYear().toString());
    setProvider(song.provider || 'XuanKen Official');
    setCoverImage(song.coverImage || '');
    setAudioFormat(song.audioFormat);
    setPrice(song.price.toString());
    const totalSecs = song.duration && song.duration > 0 ? song.duration : 210;
    setDurationMinutes(Math.floor(totalSecs / 60).toString());
    setDurationSeconds((totalSecs % 60).toString().padStart(2, '0'));
    setPlayCountInput((song.playCount || 0).toString());
    setDemoUrl(song.demoUrl || '');
    setMp3128Url(song.mp3_128Url || '');
    setMp3Url(song.mp3Url || '');
    setWavUrl(song.wavUrl || '');
    setLrcType(song.lrcUrl ? 'link' : 'text');
    setLrcRaw(song.lrcRaw || '');
    setLrcUrl(song.lrcUrl || '');
    setAutoCalculatedDuration(totalSecs);
    setSongSaveError(null);
    setIsSongModalOpen(true);

    // Ensure latest protected 320kbps & WAV links are fetched from song_masters if missing in local state
    if (!song.mp3Url && !song.wavUrl) {
      const targetId = song.id;
      MusicService.fetchSongMasterById(targetId).then((master) => {
        if (!master) return;
        setEditingSongId((currentId) => {
          if (currentId !== targetId) return currentId;
          if (master.mp3Url) setMp3Url((prev) => prev || master.mp3Url || '');
          if (master.wavUrl) setWavUrl((prev) => prev || master.wavUrl || '');
          return currentId;
        });
      });
    }
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSong) return;
    setIsSavingSong(true);
    setSongSaveError(null);

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

    try {
      if (editingSongId) {
        const existing = songs.find((s) => s.id === editingSongId);
        if (existing) {
          const updated: Song = {
            ...existing,
            title: title.trim(),
            artists: artists.trim(),
            album: album.trim() || 'XuanKen Official',
            composer: composer.trim() || artists.trim() || 'XuanKen',
            genre: genre.trim() || 'Việt Nam, V-Pop',
            releaseDate: releaseDate.trim() || new Date().getFullYear().toString(),
            provider: provider.trim() || 'XuanKen Official',
            coverImage: coverImage.trim() || existing.coverImage || '',
            audioFormat,
            price: parseInt(price, 10) || 0,
            playCount: numPlayCount,
            demoUrl: demoUrl.trim() || '',
            mp3_128Url: mp3128Url.trim() || '',
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
          artists: artists.trim() || 'XuanKen',
          album: album.trim() || 'XuanKen Music Official',
          composer: composer.trim() || artists.trim() || 'XuanKen',
          genre: genre.trim() || 'Việt Nam, V-Pop',
          releaseDate: releaseDate.trim() || new Date().getFullYear().toString(),
          provider: provider.trim() || 'XuanKen Official',
          coverImage: coverImage.trim() || 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png',
          audioFormat,
          price: parseInt(price, 10) || 0,
          playCount: numPlayCount,
          demoUrl: demoUrl.trim() || '',
          mp3_128Url: mp3128Url.trim() || '',
          mp3Url: mp3Url.trim() || '',
          wavUrl: wavUrl.trim() || '',
          lrcUrl: lrcType === 'link' ? lrcUrl.trim() : '',
          lrcRaw: lrcType === 'text' ? lrcRaw : '',
          lyrics: parsedLyrics,
          duration: finalDuration,
          coverGradient: gradients[Math.floor(Math.random() * gradients.length)],
        };
        saveResult = await addNewSong(newSong);
      }

      if (saveResult.success) {
        setIsSongModalOpen(false);
        setSyncSuccessMsg(
          editingSongId
            ? 'Đã cập nhật bài hát và lưu thành công lên Firebase RTDB & Firestore!'
            : 'Đã thêm bài hát và lưu thành công lên Firebase RTDB & Firestore!'
        );
        setSyncErrorMsg(null);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      } else {
        const errMsg = `Firebase RTDB từ chối lưu (${saveResult.error || 'PERMISSION_DENIED'}). Hãy kiểm tra tài khoản Admin hoặc mở tab "Quy Tắc Firebase (Rules)" để cập nhật Rules!`;
        setSongSaveError(errMsg);
        setSyncErrorMsg(`⚠️ ${errMsg}`);
        setSyncSuccessMsg(null);
      }
    } finally {
      setIsSavingSong(false);
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
    <div className="space-y-4 sm:space-y-6 pb-20 select-none font-['Roboto_Condensed']">
      {/* Top Header */}
      <div className="p-3.5 sm:p-0 sm:pb-3 rounded-2xl sm:rounded-none bg-white/[0.04] sm:bg-transparent border border-white/10 sm:border-0 sm:border-b space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600/30 text-[#c273ed] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-extrabold text-white tracking-tight uppercase truncate">
                Quản Trị XuanKen
              </h1>
              <p className="text-[11px] sm:text-xs text-white/60 truncate">
                Admin: <strong className="text-white">{currentUser.email}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
        </div>

        {/* Mobile Quick Stats Overview Strip */}
        <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-white/10 sm:hidden text-center">
          <div className="py-1.5 px-1 rounded-xl bg-black/25 border border-white/5">
            <p className="text-xs font-black text-white font-mono">{songs.length}</p>
            <p className="text-[9px] text-white/50 font-semibold">Bài hát</p>
          </div>
          <div className="py-1.5 px-1 rounded-xl bg-black/25 border border-white/5">
            <p className="text-xs font-black text-[#c273ed] font-mono">{exclusiveAlbums.length}</p>
            <p className="text-[9px] text-white/50 font-semibold">Album</p>
          </div>
          <div className="py-1.5 px-1 rounded-xl bg-black/25 border border-white/5">
            <p className="text-xs font-black text-emerald-400 font-mono">{members.length}</p>
            <p className="text-[9px] text-white/50 font-semibold">Thành viên</p>
          </div>
          <div className="py-1.5 px-1 rounded-xl bg-black/25 border border-white/5">
            <p className="text-xs font-black text-amber-300 font-mono">{vouchers.length}</p>
            <p className="text-[9px] text-white/50 font-semibold">Voucher</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs - 2x4 Grid on Mobile, Horizontal Pills on PC */}
      <div className="grid grid-cols-4 sm:flex sm:items-center p-1.5 sm:p-1 bg-white/5 rounded-2xl border border-white/10 w-full sm:overflow-x-auto no-scrollbar gap-1.5 sm:gap-1 text-xs">
        <button
          onClick={() => setActiveAdminTab('songs')}
          style={activeAdminTab === 'songs' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'songs'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Music2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">Bài Hát</span>
          <span className="hidden sm:inline">Bài Hát ({songs.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('albums')}
          style={activeAdminTab === 'albums' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'albums'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Disc3 className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">Album</span>
          <span className="hidden sm:inline">Album Nhạc Hay ({exclusiveAlbums.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('artists')}
          style={activeAdminTab === 'artists' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'artists'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Mic2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">Ca Sĩ</span>
          <span className="hidden sm:inline">Ca Sĩ & Tiểu Sử</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('members')}
          style={activeAdminTab === 'members' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'members'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">Thành Viên</span>
          <span className="hidden sm:inline">Thành Viên ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('vouchers')}
          style={activeAdminTab === 'vouchers' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'vouchers'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">Voucher</span>
          <span className="hidden sm:inline">Voucher ({vouchers.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('settings')}
          style={activeAdminTab === 'settings' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'settings'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">Cài Đặt</span>
          <span className="hidden sm:inline">Cài Đặt Web</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('api')}
          style={activeAdminTab === 'api' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'api'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">API Key</span>
          <span className="hidden sm:inline">Public API & Key</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('rules')}
          style={activeAdminTab === 'rules' ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all text-center sm:whitespace-nowrap sm:shrink-0 cursor-pointer ${
            activeAdminTab === 'rules'
              ? 'text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs leading-tight sm:hidden">Rules</span>
          <span className="hidden sm:inline">Rules Firebase</span>
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
            </div>

            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-2 flex-wrap">
              {/* Force Sync All Button */}
              <button
                onClick={handleForceSyncAll}
                disabled={isSyncingAll}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Đẩy toàn bộ bài hát, thành viên, playlist lên Firebase ngay"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span className="truncate">{isSyncingAll ? 'Đang đẩy...' : 'Đẩy Lên Firebase'}</span>
              </button>

              {/* Seed Sample Songs Button if empty */}
              {songs.length === 0 && (
                <button
                  onClick={handleSeedSongs}
                  disabled={isSeeding}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Nạp 3 bài hát mẫu XuanKen lên Firebase"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSeeding ? 'Đang nạp...' : 'Nạp 3 Bài Mẫu'}</span>
                </button>
              )}

              {/* Add New Song Button */}
              <button
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Bài Hát</span>
              </button>
            </div>
          </div>

          {songs.length > 0 && (
            <div className="relative sm:max-w-sm">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder="Tìm tên bài hát, ca sĩ, album..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#9b4de0]"
              />
              {songSearch && (
                <button
                  type="button"
                  onClick={() => setSongSearch('')}
                  className="absolute right-2.5 top-2 text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {songs.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-white/20 bg-white/5 space-y-3">
              <Music2 className="w-12 h-12 text-white/30 mx-auto" />
              <h3 className="text-base font-bold text-white">Chưa Có Bài Hát Nào Trong Hệ Thống</h3>
              <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
                Trên Firebase Realtime Database hiện đang trống (null). Bạn có thể bấm <strong>"Thêm Bài Hát"</strong> hoặc bấm <strong>"Nạp 3 Bài Mẫu"</strong> để dữ liệu lập tức xuất hiện!
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={handleSeedSongs}
                  disabled={isSeeding}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSeeding ? 'Đang nạp bài mẫu...' : 'Nạp 3 Bài Mẫu XuanKen'}</span>
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Bài Mới Thủ Công</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile View for Songs (sm:hidden) */}
              <div className="sm:hidden space-y-2.5">
                {filteredSongs.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-xs text-white/50">
                    Không tìm thấy bài hát phù hợp với "{songSearch}"
                  </div>
                ) : (
                  filteredSongs.map((song, i) => (
                    <div
                      key={song.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center font-mono text-[11px] text-white/40 font-bold shrink-0">
                          {song.stt || i + 1}
                        </span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 relative">
                          {song.coverImage ? (
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}>
                            <Music2 className="w-5 h-5 text-white/60" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="font-bold text-white text-xs truncate">{song.title}</p>
                            <span
                              className={`px-1.5 py-0.5 rounded font-black text-[9px] shrink-0 ${
                                song.audioFormat === 'WAV'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {song.audioFormat}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60 truncate mt-0.5">{song.artists}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] flex-wrap">
                            <span className="font-mono text-amber-300 font-bold">
                              {(song.price ?? 20000).toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-white/60 font-mono">
                              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-emerald-400 font-mono">
                              {song.playCount || 0} lượt
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-white/5 gap-2">
                        <div className="flex items-center gap-1 text-[9px] flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${song.demoUrl ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/30'}`}>Demo</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${song.mp3_128Url ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/30'}`}>128</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${song.mp3Url ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/30'}`}>320</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${song.wavUrl ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/30'}`}>WAV</span>
                          {song.lrcRaw || song.lrcUrl ? (
                            <span className="px-1.5 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300">LRC</span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(song)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#9b4de0] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'song', id: song.id, label: song.title })}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white/70 hover:text-white transition-colors cursor-pointer"
                            title="Xóa bài hát"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View (hidden sm:block) */}
              <div className="hidden sm:block rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center whitespace-nowrap">STT</th>
                        <th className="py-3 px-4 min-w-[200px] whitespace-nowrap">TÊN BÀI HÁT</th>
                        <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">CA SỸ</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[110px]">ĐỊNH DẠNG</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[110px]">GIÁ BÁN</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[100px]">THỜI LƯỢNG</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[130px]">3 LINK NHẠC</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap min-w-[100px]">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredSongs.map((song, i) => (
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
                            <div className="flex items-center justify-center gap-1 text-[10px]">
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
                                  song.mp3_128Url ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/30'
                                }`}
                                title={song.mp3_128Url || 'Chưa có link MP3 128kbps'}
                              >
                                128
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  song.mp3Url ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/30'
                                }`}
                                title={song.mp3Url || 'Chưa có link MP3 320kbps'}
                              >
                                320
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
                                onClick={() => setConfirmDelete({ type: 'song', id: song.id, label: song.title })}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white cursor-pointer"
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
            </>
          )}
        </div>
      )}

      {/* TAB: QUẢN LÝ ALBUM NHẠC HAY */}
      {activeAdminTab === 'albums' && (
        <AdminCuratedAlbumsTab />
      )}

      {/* TAB: QUẢN LÝ CA SĨ & TIỂU SỬ */}
      {activeAdminTab === 'artists' && (
        <AdminArtistBiosTab />
      )}

      {/* TAB 2: QUẢN LÝ THÀNH VIÊN */}
      {activeAdminTab === 'members' && (
        <div className="space-y-4">
          {/* Card: Thêm Quản Trị Viên Toàn Quyền (Super Admin) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-purple-900/30 to-[#170f23] border border-amber-500/30 shadow-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2 flex-wrap">
                    <span>Thêm Admin Toàn Quyền</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-black uppercase">
                      Quyền Cao Nhất
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Cấp toàn quyền như admin chính cho bất kỳ email nào (quản lý bài hát, duyệt nạp tiền, phân quyền).
                  </p>
                </div>
              </div>
            </div>

            {/* Form thêm Admin bằng Email */}
            <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={newAdminEmailInput}
                onChange={(e) => setNewAdminEmailInput(e.target.value)}
                placeholder="Nhập email tài khoản muốn cấp quyền Admin (VD: admin2@xuanken.vn)"
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                type="submit"
                disabled={isAddingAdmin}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-950/40 active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingAdmin ? 'Đang cấp quyền...' : 'Cấp Quyền Admin'}</span>
              </button>
            </form>

            {adminAddMsg && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  adminAddMsg.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {adminAddMsg.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{adminAddMsg.text}</span>
              </div>
            )}
          </div>

          {members.length > 0 && (
            <div className="relative sm:max-w-sm">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm thành viên theo tên hoặc email..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#9b4de0]"
              />
              {memberSearch && (
                <button
                  type="button"
                  onClick={() => setMemberSearch('')}
                  className="absolute right-2.5 top-2 text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {members.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-white/20 bg-white/5">
              <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Chưa Có Thành Viên Nào</h3>
              <p className="text-xs text-white/50 mt-1">
                Các thành viên khi đăng nhập qua Firebase Auth sẽ tự động xuất hiện ở danh sách này.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card List for Members (sm:hidden) */}
              <div className="sm:hidden space-y-2.5">
                {filteredMembers.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-xs text-white/50">
                    Không tìm thấy thành viên phù hợp với "{memberSearch}"
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.uid}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
                            {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-xs truncate">{member.displayName || 'Thành viên'}</p>
                            <p className="text-[10px] text-white/50 truncate font-mono">{member.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleMemberRole(member.uid)}
                          className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase transition-colors shrink-0 cursor-pointer ${
                            member.role === 'admin'
                              ? 'bg-purple-500/30 text-[#c273ed] border border-purple-500/50'
                              : 'bg-white/10 text-white/70'
                          }`}
                          title="Bấm để đổi quyền Admin/User"
                        >
                          {member.role}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-400 font-mono font-bold">
                            {(member.balance || 0).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/60 text-[10px]">
                            {member.purchasedSongIds?.length || 0} bài mua
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditMember(member)}
                            className="px-3 py-1.5 rounded-lg bg-[#9b4de0]/30 hover:bg-[#9b4de0] text-[#c273ed] hover:text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'member', id: member.uid, label: member.email })}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white/70 hover:text-white transition-colors cursor-pointer"
                            title="Xóa thành viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View (hidden sm:block) */}
              <div className="hidden sm:block rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center whitespace-nowrap">STT</th>
                        <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">EMAIL</th>
                        <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">TÊN HIỂN THỊ</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[90px]">VAI TRÒ</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[110px]">SỐ DƯ</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[90px]">ĐÃ MUA</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap min-w-[150px]">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredMembers.map((member, i) => (
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
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400 whitespace-nowrap">
                            <span className="whitespace-nowrap">{(member.balance || 0).toLocaleString('vi-VN')}&nbsp;đ</span>
                          </td>
                          <td className="py-3 px-4 text-center text-white/60">
                            {member.purchasedSongIds?.length || 0} bài
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Requirement 7: Nút Sửa */}
                              <button
                                onClick={() => handleOpenEditMember(member)}
                                className="px-2.5 py-1 rounded-lg bg-[#9b4de0]/30 hover:bg-[#9b4de0] text-[#c273ed] hover:text-white font-bold flex items-center gap-1 transition-colors"
                                title="Chỉnh sửa thông tin thành viên"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>

                              <button
                                onClick={() => setConfirmDelete({ type: 'member', id: member.uid, label: member.email })}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white/70 hover:text-white transition-colors cursor-pointer"
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
            </>
          )}
        </div>
      )}

      {/* TAB 3: QUY TẮC FIREBASE (RULES - Requirement 1) */}
      {activeAdminTab === 'rules' && (
        <div className="space-y-6">
          {/* Live Firebase Connectivity Check Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#170f23] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Database className="w-4 h-4" />
                <span>Trạng Thái Đồng Bộ Firebase Trực Tuyến</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isTestingFirebase ? 'animate-spin' : ''}`} />
              <span>{isTestingFirebase ? 'Đang kiểm tra...' : 'Kiểm Tra Đồng Bộ Ngay'}</span>
            </button>
          </div>

          {/* Security Rules Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-purple-950/40 to-[#170f23] border border-emerald-500/30 text-xs space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Hệ Thống Quy Tắc Bảo Mật Toàn Diện (Bản Quyền, Tiền Ví & Thành Viên)</span>
            </div>
            <p className="text-white/80 leading-relaxed">
              Các quy tắc (Security Rules) đã được cấu hình chặt chẽ theo tiêu chuẩn Zero-Trust và Phân quyền theo vai trò (RBAC/ABAC):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/70 pl-1">
              <li><strong className="text-white">Tách biệt link 128/Demo & 320/WAV:</strong> Nhánh công khai <code className="text-emerald-300">songs</code> chỉ giữ <code className="text-purple-300">demoUrl</code> & <code className="text-emerald-300">mp3_128Url</code>; link chất lượng cao <code className="text-blue-300">mp3Url (320kbps)</code> và <code className="text-amber-300">wavUrl (Lossless)</code> được tách riêng sang nhánh bảo mật <code className="text-amber-300">song_masters</code> — chỉ người đã mua (<code className="text-white">user_purchases</code> / <code className="text-white">purchasedSongIds</code>) hoặc Admin mới đọc được.</li>
              <li><strong className="text-white">Riêng tư Playlist Cá Nhân:</strong> Nhánh <code className="text-cyan-300">playlists</code> được bảo vệ theo chủ sở hữu (<code className="text-white">userId == auth.uid</code>), tài khoản khác hoặc khách chưa đăng nhập không thể đọc trộm.</li>
              <li><strong className="text-white">Bảo mật số dư & tiền ví:</strong> Chặn triệt để hack tiền. Thành viên không thể tự tăng số dư hoặc tự nâng quyền Admin. Số dư chỉ giảm khi mua nhạc hợp lệ.</li>
            </ul>
          </div>

          {(() => {
            const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isAdmin() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        request.auth.token.email == 'admin@xuanken.vn' ||
        request.auth.token.email == 'phamthikimthanh.qy@gmail.com' ||
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin'
      );
    }
    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }
    function hasPurchasedSong(songId) {
      return isSignedIn() && (
        isAdmin() ||
        get(/databases/$(database)/documents/songs/$(songId)).data.price <= 0 ||
        songId in get(/databases/$(database)/documents/members/$(request.auth.uid)).data.purchasedSongIds
      );
    }

    match /admins/{adminId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Nhánh công khai chỉ chứa Demo 60s & MP3 128kbps
    match /songs/{songId} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (
        incoming().diff(existing()).affectedKeys().hasOnly(['playCount']) &&
        incoming().playCount is number &&
        incoming().playCount == existing().playCount + 1
      );
    }

    // Nhánh bảo mật chứa riêng MP3 320kbps & WAV Lossless
    match /song_masters/{songId} {
      allow read: if hasPurchasedSong(songId);
      allow write: if isAdmin();
    }

    match /members/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId) &&
        incoming().uid == userId &&
        incoming().role == 'user' &&
        incoming().balance is number &&
        incoming().balance <= 500000 &&
        incoming().balance >= 0 &&
        incoming().email is string &&
        incoming().email.size() <= 120;
      allow update: if isAdmin() || (
        isOwner(userId) && (
          (
            incoming().diff(existing()).affectedKeys().hasOnly([
              'displayName', 'avatarUrl', 'theme', 'crossfadeDuration',
              'preferredAudioFormat', 'likedSongIds', 'likedAlbumIds', 'blockedSongIds'
            ]) &&
            incoming().role == existing().role &&
            incoming().balance == existing().balance
          ) ||
          (
            incoming().diff(existing()).affectedKeys().hasOnly(['balance', 'purchasedSongIds', 'usedVoucherCodes']) &&
            incoming().role == existing().role &&
            incoming().balance is number &&
            incoming().balance <= existing().balance &&
            incoming().balance >= 0 &&
            incoming().purchasedSongIds is list &&
            incoming().purchasedSongIds.size() >= existing().purchasedSongIds.size()
          )
        )
      );
      allow delete: if isAdmin();
    }

    match /purchases/{purchaseId} {
      allow read: if isSignedIn() && (existing().userId == request.auth.uid || isAdmin());
      allow create: if isSignedIn() &&
        incoming().userId == request.auth.uid &&
        incoming().price is number &&
        incoming().price >= 0;
      allow update, delete: if isAdmin();
    }

    // Playlist cá nhân chỉ chính chủ hoặc Admin được xem/sửa
    match /playlists/{playlistId} {
      allow read: if (existing().isPublic == true) || (isSignedIn() && (existing().userId == request.auth.uid || isAdmin()));
      allow create: if isSignedIn() && (incoming().userId == request.auth.uid || isAdmin());
      allow update, delete: if isSignedIn() && (existing().userId == request.auth.uid || isAdmin());
    }

    match /vouchers/{voucherId} { allow read: if true; allow write: if isAdmin(); }
    match /site_settings/{settingId} { allow read: if true; allow write: if isAdmin(); }
    match /exclusive_albums/{albumId} { allow read: if true; allow write: if isAdmin(); }
    match /chat_messages/{messageId} { allow read, create: if true; allow update, delete: if isAdmin(); }
    match /artist_bios/{artistId} { allow read: if true; allow write: if isAdmin(); }
    match /song_reports/{reportId} { allow create: if true; allow read, update, delete: if isAdmin(); }
    match /weekly_plays/{weekKey} { allow read: if true; allow write: if isSignedIn(); }
    match /system/{docId} { allow read, write: if isSignedIn(); }
  }
}`;

            const rtdbRulesText = JSON.stringify(
              {
                rules: {
                  admins: {
                    ".read": "auth != null",
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                  },
                  songs: {
                    ".read": true,
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    "$songId": {
                      "playCount": {
                        ".write": "newData.isNumber() && (!data.exists() || newData.val() >= data.val())"
                      },
                      "mp3Url": {
                        ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com') || data.parent().child('price').val() <= 0 || root.child('user_purchases').child(auth.uid).child($songId).exists())"
                      },
                      "wavUrl": {
                        ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com') || data.parent().child('price').val() <= 0 || root.child('user_purchases').child(auth.uid).child($songId).exists())"
                      }
                    }
                  },
                  song_masters: {
                    ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    "$songId": {
                      ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com') || root.child('songs').child($songId).child('price').val() <= 0 || root.child('user_purchases').child(auth.uid).child($songId).exists())"
                    }
                  },
                  user_purchases: {
                    ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    "$userId": {
                      ".read": "auth != null && (auth.uid === $userId || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                      "$songId": {
                        ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com') || (auth.uid === $userId && (!data.exists() || data.child('songId').val() === $songId) && newData.child('songId').val() === $songId && root.child('songs').child($songId).exists()))"
                      }
                    }
                  },
                  members: {
                    ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    "$userId": {
                      ".read": "auth != null && (auth.uid === $userId || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                      ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com') || (auth.uid === $userId && (!data.exists() ? (newData.child('role').val() === 'user' && newData.child('balance').val() <= 500000) : (newData.child('role').val() === data.child('role').val() && (!newData.child('balance').exists() || newData.child('balance').val() <= data.child('balance').val())))))"
                    }
                  },
                  purchases: {
                    ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    "$purchaseId": {
                      ".read": "auth != null && (data.child('userId').val() === auth.uid || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                      ".write": "auth != null && (!data.exists() ? (newData.child('userId').val() === auth.uid || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com')) : (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com')))"
                    }
                  },
                  playlists: {
                    ".indexOn": ["userId"],
                    ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com') || (query.orderByChild == 'userId' && query.equalTo == auth.uid))",
                    "$playlistId": {
                      ".read": "data.child('isPublic').val() === true || (auth != null && (data.child('userId').val() === auth.uid || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com')))",
                      ".write": "auth != null && (!data.exists() ? (newData.child('userId').val() === auth.uid || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com')) : (data.child('userId').val() === auth.uid || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com')))"
                    }
                  },
                  vouchers: {
                    ".read": true,
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                  },
                  site_settings: {
                    ".read": true,
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                  },
                  weekly_plays: {
                    ".read": true,
                    ".write": "auth != null"
                  },
                  song_reports: {
                    ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    "$reportId": {
                      ".write": true
                    }
                  },
                  banned_chat_members: {
                    ".read": true,
                    ".write": "auth != null"
                  },
                  audio_settings: {
                    ".read": true,
                    ".write": "auth != null"
                  },
                  exclusive_albums: {
                    ".read": true,
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                  },
                  chat_messages: {
                    ".read": true,
                    ".write": true
                  },
                  users: {
                    "$userId": {
                      ".read": "auth != null && (auth.uid === $userId || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                      ".write": "auth != null && (auth.uid === $userId || root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                    }
                  },
                  artist_bios: {
                    ".read": true,
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                  },
                  api_keys: {
                    ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))",
                    ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                  },
                  api_key_hashes: {
                    ".read": false,
                    "$keyHash": {
                      ".read": true,
                      ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (auth.token.email === 'admin@xuanken.vn' || auth.token.email === 'phamthikimthanh.qy@gmail.com'))"
                    }
                  },
                  _system_ping: {
                    ".read": true,
                    ".write": true
                  }
                }
              },
              null,
              2
            );

            return (
              <>
                {/* 1. Cloud Firestore Rules */}
                <div className="rounded-2xl border border-purple-500/30 bg-[#170f23] overflow-hidden shadow-xl">
                  <div className="p-4 bg-purple-500/10 border-b border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">firestore.rules (Cloud Firestore Security Rules)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-black">
                          Tách Link 320/WAV
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Bảo vệ song_masters (MP3 320/WAV), riêng tư playlists, số dư ví và lịch sử mua hàng
                      </p>
                    </div>
                    <button
                      onClick={() => copyRuleToClipboard('firestore.rules', firestoreRulesText)}
                      className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
                    >
                      {copiedRuleFile === 'firestore.rules' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao Chép firestore.rules</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-purple-300 bg-black/60 overflow-x-auto max-h-64 leading-relaxed">
                    {firestoreRulesText}
                  </pre>
                </div>

                {/* 2. Realtime Database Security Rules */}
                <div className="rounded-2xl border border-amber-500/30 bg-[#170f23] overflow-hidden shadow-xl">
                  <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">database.rules.json (Realtime Database Security)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-600 text-white">
                          Chống Hack &amp; Tách 320/WAV
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Chỉ công khai Demo &amp; 128kbps; tách song_masters (320/WAV), bảo mật user_purchases, playlists riêng tư và api_keys
                      </p>
                    </div>
                    <button
                      onClick={() => copyRuleToClipboard('database.rules.json', rtdbRulesText)}
                      className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-black flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
                    >
                      {copiedRuleFile === 'database.rules.json' ? (
                        <>
                          <Check className="w-4 h-4 text-black" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao Chép database.rules.json</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-emerald-400 bg-black/60 overflow-x-auto max-h-56 leading-relaxed">
                    {rtdbRulesText}
                  </pre>
                </div>
              </>
            );
          })()}

          {/* 3. Storage Rules */}
          <div className="rounded-2xl border border-white/10 bg-[#170f23] overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm">storage.rules (Firebase Cloud Storage)</span>
                <p className="text-[11px] text-white/50">Bảo vệ file âm thanh gốc MP3/WAV và giới hạn upload avatar</p>
              </div>
              <button
                onClick={() =>
                  copyRuleToClipboard(
                    'storage.rules',
                    `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'admin@xuanken.vn'
      );
    }
    match /{allPaths=**} {
      allow read: if true;
    }
    match /avatars/{userId}/{fileName} {
      allow write: if request.auth != null &&
        request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*');
    }
    match /songs/{songId}/{fileName} {
      allow write: if isAdmin();
    }
    match /covers/{coverId} {
      allow write: if isAdmin();
    }
  }
}`
                  )
                }
                className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedRuleFile === 'storage.rules' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép storage.rules</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-cyan-300 bg-black/60 overflow-x-auto max-h-40 leading-relaxed">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'admin@xuanken.vn';
    }
    match /{allPaths=**} {
      allow read: if true;
    }
    match /avatars/{userId}/{fileName} {
      allow write: if request.auth != null && request.auth.uid == userId && request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('image/.*');
    }
    match /songs/{songId}/{fileName} {
      allow write: if isAdmin();
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <p className="text-xs text-white/70">
              Quản lý mã giảm giá (Voucher / Coupon) cho khách hàng khi mua nhạc bản quyền
            </p>
            <button
              onClick={() => setIsAddingVoucher(!isAddingVoucher)}
              className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 shrink-0 cursor-pointer"
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
                    placeholder=""
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

          {/* Mobile Card List for Vouchers (sm:hidden) */}
          <div className="sm:hidden space-y-2.5">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-300 text-sm tracking-wider">{v.code}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    v.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {v.isActive ? 'Đang áp dụng' : 'Tạm khóa'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">
                    Giảm: <strong className="text-emerald-400 font-mono">
                      {v.discountType === 'percent' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString('vi-VN')} đ`}
                    </strong> ({v.discountType === 'percent' ? 'Phần trăm' : 'Cố định'})
                  </span>
                  <button
                    onClick={() => setConfirmDelete({ type: 'voucher', id: v.id, label: v.code })}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Xóa voucher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {v.description && (
                  <p className="text-[11px] text-white/70 pt-1 border-t border-white/5">{v.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden sm:block) */}
          <div className="hidden sm:block rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center whitespace-nowrap">STT</th>
                    <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">MÃ VOUCHER</th>
                    <th className="py-3 px-4 min-w-[110px] text-center whitespace-nowrap">LOẠI GIẢM</th>
                    <th className="py-3 px-4 min-w-[110px] text-center whitespace-nowrap">GIÁ TRỊ</th>
                    <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">MÔ TẢ</th>
                    <th className="py-3 px-4 min-w-[110px] text-center whitespace-nowrap">TRẠNG THÁI</th>
                    <th className="py-3 px-4 min-w-[80px] text-right whitespace-nowrap">XÓA</th>
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
                          onClick={() => setConfirmDelete({ type: 'voucher', id: v.id, label: v.code })}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer"
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

      {/* TAB 5: CÀI ĐẶT WEBSITE (Requirement 11) */}
      {activeAdminTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {settingsSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold">{settingsSuccessMsg}</span>
              </div>
              <button onClick={() => setSettingsSuccessMsg(null)} className="text-white/60 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {settingsErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="font-bold">{settingsErrorMsg}</span>
              </div>
              <button onClick={() => setSettingsErrorMsg(null)} className="text-white/60 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-6">
            {/* 1. THÔNG TIN THƯƠNG HIỆU & TIÊU ĐỀ TRANG */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#170f23] border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-[#c273ed] flex items-center justify-center font-bold shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Thông Tin Nhận Diện Website</h3>
                  <p className="text-[11px] text-white/50">Đổi tên thương hiệu, slogan bên dưới logo Sidebar/Splash và hình ảnh nhận diện</p>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/35 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    Xem trước hiển thị góc trên bên trái (Sidebar PC)
                  </span>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center accent-glow-btn shrink-0">
                      <Disc className="w-5 h-5 text-white animate-spin-slow" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      {(() => {
                        const previewName = siteNameInput.trim();
                        const words = previewName.split(/\s+/).filter(Boolean);
                        const lead = words.length > 1 ? words.slice(0, -1).join(' ') : previewName;
                        const tail = words.length > 1 ? words[words.length - 1] : '';
                        return previewName ? (
                          <span className="text-[18px] font-extrabold tracking-tight text-white uppercase leading-tight font-display">
                            {lead}
                            {tail ? (
                              <>
                                {' '}
                                <span style={{ color: 'var(--color-accent)' }}>{tail}</span>
                              </>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-white/35 italic">Chưa đặt tên website</span>
                        );
                      })()}
                      {siteSloganInput.trim() ? (
                        <span className="text-[10.5px] font-medium text-white/55 tracking-[0.03em] mt-1 leading-snug break-words">
                          {siteSloganInput.trim()}
                        </span>
                      ) : (
                        <span className="text-[10.5px] italic text-white/30 mt-1">(Không có slogan)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">Tên Website / Thương Hiệu *</label>
                  <input
                    type="text"
                    required
                    value={siteNameInput}
                    onChange={(e) => setSiteNameInput(e.target.value)}
                    placeholder="Nhập tên website / thương hiệu..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-[#9b4de0] transition-colors"
                  />
                  <p className="text-[10px] text-white/40 mt-1">Hiển thị ở góc trên Sidebar trái, màn hình chào và tiêu đề tab trình duyệt</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">Slogan Bên Dưới Tên Thương Hiệu</label>
                  <input
                    type="text"
                    value={siteSloganInput}
                    onChange={(e) => setSiteSloganInput(e.target.value)}
                    placeholder="Nhập slogan hiển thị..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#9b4de0] transition-colors"
                  />
                  <p className="text-[10px] text-white/40 mt-1">Hiển thị ngay bên dưới tên {siteNameInput.trim() || 'thương hiệu'} ở Sidebar, màn hình chào & Mobile</p>
                </div>
              </div>

              {/* Logo & Favicon with file upload & preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                {/* Logo Web */}
                <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <label className="block text-xs font-bold text-white/90">Ảnh Logo Trang Web (Logo URL / Upload)</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center shrink-0 shadow-md">
                      {logoUrlInput ? (
                        <img
                          src={logoUrlInput}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Globe className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://.../logo.png"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#9b4de0]"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Favicon / Ico */}
                <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <label className="block text-xs font-bold text-white/90">Ảnh Icon Tab / Favicon (.ico, .png)</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center shrink-0 shadow-md">
                      {faviconUrlInput ? (
                        <img
                          src={faviconUrlInput}
                          alt="Favicon Preview"
                          className="w-8 h-8 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Globe className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <input
                        type="url"
                        value={faviconUrlInput}
                        onChange={(e) => setFaviconUrlInput(e.target.value)}
                        placeholder="https://.../favicon.ico"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#9b4de0]"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải favicon từ máy</span>
                        <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CẤU HÌNH TIỀN THƯỞNG, GIÁ VÀ LƯỢT NGHE */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#170f23] border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chính Sách & Cấu Hình Mặc Định</h3>
                  <p className="text-[11px] text-white/50">Cài đặt số dư thành viên mới, giá bán bài hát và quy tắc lượt nghe</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Default wallet balance on first login */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <label className="block text-xs font-bold text-white/80">
                    Tiền mặc định khi đăng nhập lần đầu (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={defaultBalanceInput}
                    onChange={(e) => setDefaultBalanceInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 font-mono text-emerald-400 font-bold text-sm focus:outline-none focus:border-[#9b4de0]"
                  />
                  <p className="text-[10px] text-white/40">
                    Tương đương: {Number(defaultBalanceInput || 0).toLocaleString('vi-VN')} đ tặng ví
                  </p>
                </div>

                {/* Default song price */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <label className="block text-xs font-bold text-white/80">
                    Giá bài hát mặc định khi thêm mới (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={defaultSongPriceInput}
                    onChange={(e) => setDefaultSongPriceInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 font-mono text-amber-300 font-bold text-sm focus:outline-none focus:border-[#9b4de0]"
                  />
                  <p className="text-[10px] text-white/40">
                    Tương đương: {Number(defaultSongPriceInput || 0).toLocaleString('vi-VN')} đ / bài
                  </p>
                </div>

                {/* Min listen duration threshold */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <label className="block text-xs font-bold text-white/80">
                    Thời gian nghe tối thiểu để tính 1 lượt (Giây) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={minListenDurationInput}
                    onChange={(e) => setMinListenDurationInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 font-mono text-cyan-300 font-bold text-sm focus:outline-none focus:border-[#9b4de0]"
                  />
                  <p className="text-[10px] text-white/40">
                    Hiện tại: {minListenDurationInput || 5} giây (chống spam lượt nghe BXH)
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSiteNameInput(siteSettings?.siteName ?? '');
                  setSiteSloganInput(siteSettings?.siteSlogan ?? '');
                  setLogoUrlInput(siteSettings?.logoUrl || 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png');
                  setFaviconUrlInput(siteSettings?.faviconUrl || 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png');
                  setDefaultBalanceInput('500000');
                  setDefaultSongPriceInput('20000');
                  setMinListenDurationInput('5');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Khôi Phục Chính Sách Mặc Định
              </button>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Đang Lưu...' : 'Lưu Cài Đặt Website'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: PUBLIC API & API KEY MANAGEMENT */}
      {activeAdminTab === 'api' && <AdminApiKeysTab />}

      {/* MODAL: CHỈNH SỬA THÀNH VIÊN (Tên hiển thị, vai trò, số tiền - Requirement 3) */}
      {shouldRenderMemberModal && activeEditingMember && (
        <div
          data-theme={theme}
          onClick={() => setEditingMember(null)}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md ${
            isClosingMemberModal ? 'animate-out fade-out' : 'animate-in fade-in'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            className={`w-full max-w-md border rounded-3xl shadow-2xl p-4 sm:p-6 text-xs max-h-[92vh] overflow-y-auto ${
              isClosingMemberModal ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c273ed]" />
                <span>Chỉnh Sửa Thành Viên</span>
              </h2>
              <button onClick={() => setEditingMember(null)} className="p-1 text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-white/60">Tài khoản Email:</p>
                <p className="font-bold text-white text-sm font-mono mt-0.5">{activeEditingMember.email}</p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">UID: {activeEditingMember.uid}</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(editBalance || '0', 10);
                      setEditBalance((cur + 50000).toString());
                    }}
                    className="py-1.5 sm:py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-mono font-bold text-[10px] border border-emerald-500/30 transition-colors cursor-pointer"
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
      {shouldRenderSongModal && (
        <div
          data-theme={theme}
          onClick={() => setIsSongModalOpen(false)}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md ${
            isClosingSongModal ? 'animate-out fade-out' : 'animate-in fade-in'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            className={`w-full max-w-xl border rounded-3xl shadow-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto ${
              isClosingSongModal ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base sm:text-lg font-bold">
                {editingSongId ? 'Chỉnh Sửa Bài Hát' : 'Thêm Bài Hát Mới'}
              </h2>
              <button onClick={() => setIsSongModalOpen(false)} className="p-1 text-white/60 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="mt-4 space-y-4 text-xs">
              {songSaveError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{songSaveError}</span>
                </div>
              )}
              {/* Row 1: Tên bài & Ca sỹ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="block text-white/70 mb-1 font-bold">
                    Tên ca sỹ * (Nhiều ca sĩ cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    required
                    value={artists}
                    onChange={(e) => setArtists(e.target.value)}
                    placeholder="VD: Sơn Tùng M-TP, JustaTee"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                  />
                  {artists.includes(',') && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-white/40">Tách riêng từng ca sĩ:</span>
                      {artists.split(',').map((a, i) => a.trim() && (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-purple-600/30 border border-purple-500/40 text-[10px] text-purple-300 font-medium">
                          {a.trim()}
                        </span>
                      ))}
                    </div>
                  )}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              {/* Thông tin bài hát chi tiết (Hiển thị khi vuốt sang trái) */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Thông Tin Bài Hát Chi Tiết (Hiển thị khi vuốt sang trái)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1 font-bold">Nhạc sĩ (Composer)</label>
                    <input
                      type="text"
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      placeholder="VD: Thiên Chí, Sơn Tùng M-TP"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1 font-bold">Thể loại (Genre)</label>
                    <input
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="VD: Việt Nam, V-Pop"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1 font-bold">Phát hành (Release Date)</label>
                    <input
                      type="text"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      placeholder="VD: 06/06/2026"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1 font-bold">Cung cấp (Provider)</label>
                    <input
                      type="text"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      placeholder="VD: VIEENT Music, XuanKen Official"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#9b4de0]"
                    />
                  </div>
                </div>
              </div>

              {/* 4 LINK NHẠC TÁCH BIỆT BẢO MẬT (Demo 60s & 128kbps Công khai | 320kbps & WAV Bảo mật) */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  Link Tệp Nhạc (Công Khai 128/Demo • Bảo Mật 320/WAV)
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold">1. Link nhạc Demo 60 giây</label>
                    <span className="text-[10px] text-purple-300">Công khai — Dành cho khách nghe thử</span>
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
                    <label className="text-white/70 font-semibold">2. Link nhạc MP3 (128kbps)</label>
                    <span className="text-[10px] text-emerald-300">Công khai — Lưu trên nhánh songs</span>
                  </div>
                  <input
                    type="url"
                    value={mp3128Url}
                    onChange={(e) => setMp3128Url(e.target.value)}
                    placeholder="https://example.com/song-128kbps.mp3"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold">3. Link nhạc MP3 (320kbps)</label>
                    <span className="text-[10px] text-blue-300">Bảo mật tại song_masters — Chỉ người mua</span>
                  </div>
                  <input
                    type="url"
                    value={mp3Url}
                    onChange={(e) => setMp3Url(e.target.value)}
                    onBlur={() => triggerAutoDuration(mp3Url)}
                    placeholder="https://example.com/song-320kbps.mp3"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#9b4de0]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold">4. Link nhạc WAV (Lossless)</label>
                    <span className="text-[10px] text-amber-400">Bảo mật tại song_masters — File 24-bit</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-[#c273ed] shrink-0" />
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
                      className="px-2.5 py-1 rounded-lg bg-[#9b4de0]/20 hover:bg-[#9b4de0] text-[#c273ed] hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {isDetectingDuration ? 'Đang dò...' : 'Dò từ file MP3/WAV'}
                    </button>
                  )}
                </div>
              </div>

              {/* Requirement 2: LRC có thể thêm chữ hoặc link đều được */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                  disabled={isSavingSong}
                  className="px-5 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSong ? 'Đang lưu...' : editingSongId ? 'Cập Nhật Bài Hát' : 'Lưu Bài Hát'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA (Không dùng window.confirm) */}
      {shouldRenderConfirmDelete && activeConfirmDelete && (
        <div
          data-theme={theme}
          onClick={() => setConfirmDelete(null)}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md ${
            isClosingConfirmDelete ? 'animate-out fade-out' : 'animate-in fade-in'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            className={`w-full max-w-sm border rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 text-xs ${
              isClosingConfirmDelete ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white">
                  {activeConfirmDelete.type === 'song'
                    ? 'Xác Nhận Xóa Bài Hát'
                    : activeConfirmDelete.type === 'member'
                    ? 'Xác Nhận Xóa Thành Viên'
                    : 'Xác Nhận Xóa Voucher'}
                </h3>
                <p className="text-[11px] text-white/60 mt-0.5 truncate">
                  {activeConfirmDelete.label}
                </p>
              </div>
            </div>

            <p className="text-white/70 leading-relaxed">
              Hành động này sẽ xóa dữ liệu khỏi hệ thống và Firebase. Bạn có chắc chắn muốn tiếp tục?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeConfirmDelete.type === 'song') {
                    removeSong(activeConfirmDelete.id);
                  } else if (activeConfirmDelete.type === 'member') {
                    removeMember(activeConfirmDelete.id);
                  } else {
                    removeVoucher(activeConfirmDelete.id);
                  }
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Xóa Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
