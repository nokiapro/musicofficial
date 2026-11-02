import React, { useState, useRef } from 'react';
import {
  Disc3,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  Play,
  Pause,
  Music2,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Upload,
  ArrowUp,
  ArrowDown,
  Search,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ExclusiveAlbum, AlbumSong, AudioFormat } from '../../types/music';
import { audioEngine } from '../../services/audioEngine';

export const AdminCuratedAlbumsTab: React.FC = () => {
  const {
    exclusiveAlbums,
    addExclusiveAlbum,
    updateExclusiveAlbum,
    deleteExclusiveAlbum,
    addSongToAlbum,
    updateSongInAlbum,
    removeSongFromAlbum,
    reorderSongInAlbum,
    seedDefaultAlbums,
    syncExclusiveAlbumsToFirebase,
    playAlbumTrack,
    currentSong,
    isPlaying,
    togglePlay,
    theme,
  } = useMusic();

  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);

  // Album Modal State (Tạo / Sửa Album)
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtist, setAlbumArtist] = useState('XuanKen Official');
  const [albumCoverImage, setAlbumCoverImage] = useState('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumGenre, setAlbumGenre] = useState('V-Pop / Ballad');
  const [albumReleaseYear, setAlbumReleaseYear] = useState('2026');
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);
  const albumFileInputRef = useRef<HTMLInputElement | null>(null);

  // Album Song Modal State (Thêm / Sửa Bài Hát Trong Album)
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState('');
  const [songArtists, setSongArtists] = useState('XuanKen');
  const [songAudioFormat, setSongAudioFormat] = useState<AudioFormat>('MP3');
  const [songMp3Url, setSongMp3Url] = useState('');
  const [songWavUrl, setSongWavUrl] = useState('');
  const [songDemoUrl, setSongDemoUrl] = useState('');
  const [songCoverImage, setSongCoverImage] = useState('');
  const [songDurationMins, setSongDurationMins] = useState('3');
  const [songDurationSecs, setSongDurationSecs] = useState('30');
  const [songLrcRaw, setSongLrcRaw] = useState('');
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);
  const [isSavingSong, setIsSavingSong] = useState(false);
  const songFileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom Delete Modals to bypass iframe window.confirm blocking
  const [albumToDelete, setAlbumToDelete] = useState<ExclusiveAlbum | null>(null);
  const [songToDelete, setSongToDelete] = useState<AlbumSong | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter/Search inside active album
  const [songSearchQuery, setSongSearchQuery] = useState('');

  // Syncing & Seeding loading states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Safely find the current active album
  const activeAlbum = exclusiveAlbums.find((a) => a.id === activeAlbumId) || null;
  const activeAlbumSongs = Array.isArray(activeAlbum?.songs) ? activeAlbum.songs : [];

  // Filter songs in current album
  const filteredAlbumSongs = activeAlbumSongs.filter((s) => {
    if (!songSearchQuery.trim()) return true;
    const q = songSearchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.artists.toLowerCase().includes(q);
  });

  // Handle local image file upload for album cover
  const handleAlbumCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dung lượng dưới 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAlbumCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local image file upload for song cover
  const handleSongCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dung lượng dưới 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSongCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-detect audio duration
  const handleAutoDetectDuration = async (url: string) => {
    if (!url || !url.trim()) return;
    setIsDetectingDuration(true);
    try {
      const dur = await audioEngine.calculateDurationFromUrl(url.trim());
      if (dur > 0) {
        setSongDurationMins(Math.floor(dur / 60).toString());
        setSongDurationSecs(Math.floor(dur % 60).toString().padStart(2, '0'));
        setFeedbackMsg({ text: `Đo thành công: ${Math.floor(dur / 60)} phút ${dur % 60} giây!`, type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsDetectingDuration(false);
    }
  };

  // 1-Click Sync Albums to Firebase
  const handleSyncAlbums = async () => {
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      const res = await syncExclusiveAlbumsToFirebase();
      if (res.success) {
        setFeedbackMsg({
          text: `Đã đồng bộ thành công ${exclusiveAlbums.length} album lên Firebase RTDB & Firestore!`,
          type: 'success',
        });
      } else {
        setFeedbackMsg({
          text: `Lỗi đồng bộ Firebase: ${res.error || 'Quyền ghi bị từ chối'}. Vui lòng kiểm tra tab Rules!`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: 'Lỗi: ' + (err?.message || 'Không thể đồng bộ'), type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Seed default curated albums
  const handleSeedDefaultAlbums = async () => {
    setIsSeeding(true);
    setFeedbackMsg(null);
    try {
      const res = await seedDefaultAlbums();
      if (res.success) {
        setFeedbackMsg({ text: 'Đã nạp 3 Album Nhạc Hay mẫu XuanKen lên hệ thống thành công!', type: 'success' });
      } else {
        setFeedbackMsg({ text: 'Lỗi nạp mẫu: ' + (res.error || 'Thất bại'), type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: 'Lỗi: ' + (err?.message || 'Không thể nạp mẫu'), type: 'error' });
    } finally {
      setIsSeeding(false);
    }
  };

  // Open Create Album Modal
  const handleOpenAddAlbum = () => {
    setEditingAlbumId(null);
    setAlbumTitle('');
    setAlbumArtist('XuanKen Official');
    setAlbumCoverImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80');
    setAlbumDescription('');
    setAlbumGenre('V-Pop / Ballad');
    setAlbumReleaseYear(new Date().getFullYear().toString());
    setIsAlbumModalOpen(true);
  };

  // Open Edit Album Modal
  const handleOpenEditAlbum = (album: ExclusiveAlbum) => {
    setEditingAlbumId(album.id);
    setAlbumTitle(album.title);
    setAlbumArtist(album.artist);
    setAlbumCoverImage(album.coverImage);
    setAlbumDescription(album.description || '');
    setAlbumGenre(album.genre || 'V-Pop / Ballad');
    setAlbumReleaseYear(album.releaseYear || new Date().getFullYear().toString());
    setIsAlbumModalOpen(true);
  };

  // Save Album (Create or Update)
  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim()) return;
    setIsSavingAlbum(true);
    try {
      if (editingAlbumId) {
        await updateExclusiveAlbum(editingAlbumId, {
          title: albumTitle.trim(),
          artist: albumArtist.trim(),
          coverImage: albumCoverImage.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          description: albumDescription.trim(),
          genre: albumGenre.trim(),
          releaseYear: albumReleaseYear.trim(),
        });
        setFeedbackMsg({ text: `Đã cập nhật album "${albumTitle.trim()}" thành công!`, type: 'success' });
      } else {
        const created = await addExclusiveAlbum({
          title: albumTitle.trim(),
          artist: albumArtist.trim(),
          coverImage: albumCoverImage.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          description: albumDescription.trim(),
          genre: albumGenre.trim(),
          releaseYear: albumReleaseYear.trim(),
        });
        setActiveAlbumId(created.id);
        setFeedbackMsg({ text: `Đã tạo album mới "${created.title}" thành công!`, type: 'success' });
      }
      setIsAlbumModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ text: 'Lỗi lưu album: ' + (err?.message || 'Lỗi không xác định'), type: 'error' });
    } finally {
      setIsSavingAlbum(false);
    }
  };

  // Execute Delete Album (via in-UI modal, no window.confirm)
  const handleConfirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExclusiveAlbum(albumToDelete.id);
      if (activeAlbumId === albumToDelete.id) {
        setActiveAlbumId(null);
      }
      setFeedbackMsg({ text: `Đã xóa vĩnh viễn album "${albumToDelete.title}" thành công!`, type: 'success' });
      setAlbumToDelete(null);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ text: 'Lỗi khi xóa album: ' + (err?.message || 'Lỗi'), type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Add Song to Album Modal
  const handleOpenAddSong = () => {
    setEditingSongId(null);
    setSongTitle('');
    setSongArtists(activeAlbum?.artist || 'XuanKen');
    setSongAudioFormat('MP3');
    setSongMp3Url('');
    setSongWavUrl('');
    setSongDemoUrl('');
    setSongCoverImage(activeAlbum?.coverImage || '');
    setSongDurationMins('3');
    setSongDurationSecs('30');
    setSongLrcRaw('');
    setIsSongModalOpen(true);
  };

  // Open Edit Song in Album Modal
  const handleOpenEditSong = (song: AlbumSong) => {
    setEditingSongId(song.id);
    setSongTitle(song.title);
    setSongArtists(song.artists);
    setSongAudioFormat(song.audioFormat || 'MP3');
    setSongMp3Url(song.mp3Url || '');
    setSongWavUrl(song.wavUrl || '');
    setSongDemoUrl(song.demoUrl || '');
    setSongCoverImage(song.coverImage || activeAlbum?.coverImage || '');
    const m = Math.floor((song.duration || 210) / 60);
    const s = Math.floor((song.duration || 210) % 60);
    setSongDurationMins(m.toString());
    setSongDurationSecs(s.toString().padStart(2, '0'));
    setSongLrcRaw(song.lrcRaw || '');
    setIsSongModalOpen(true);
  };

  // Save Song in Album (Add or Update)
  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlbumId || !songTitle.trim()) return;

    setIsSavingSong(true);
    try {
      const mins = parseInt(songDurationMins, 10) || 0;
      const secs = parseInt(songDurationSecs, 10) || 0;
      let finalDuration = mins * 60 + secs;
      if (finalDuration <= 0) finalDuration = 210;

      // Parse lyrics from lrcRaw
      const parsedLyrics = songLrcRaw
        ? songLrcRaw
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

      if (editingSongId) {
        await updateSongInAlbum(activeAlbumId, editingSongId, {
          title: songTitle.trim(),
          artists: songArtists.trim(),
          audioFormat: songAudioFormat,
          mp3Url: songMp3Url.trim() || undefined,
          wavUrl: songWavUrl.trim() || undefined,
          demoUrl: songDemoUrl.trim() || undefined,
          coverImage: songCoverImage.trim() || activeAlbum?.coverImage || undefined,
          duration: finalDuration,
          lrcRaw: songLrcRaw.trim() || undefined,
          lyrics: parsedLyrics,
        });
        setFeedbackMsg({ text: `Đã cập nhật bài hát "${songTitle.trim()}" trong album!`, type: 'success' });
      } else {
        await addSongToAlbum(activeAlbumId, {
          title: songTitle.trim(),
          artists: songArtists.trim(),
          audioFormat: songAudioFormat,
          mp3Url: songMp3Url.trim() || undefined,
          wavUrl: songWavUrl.trim() || undefined,
          demoUrl: songDemoUrl.trim() || undefined,
          coverImage: songCoverImage.trim() || activeAlbum?.coverImage || undefined,
          duration: finalDuration,
          lrcRaw: songLrcRaw.trim() || undefined,
          lyrics: parsedLyrics,
        });
        setFeedbackMsg({ text: `Đã thêm bài hát "${songTitle.trim()}" vào album!`, type: 'success' });
      }
      setIsSongModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ text: 'Lỗi lưu bài hát: ' + (err?.message || 'Lỗi'), type: 'error' });
    } finally {
      setIsSavingSong(false);
    }
  };

  // Execute Delete Song (via in-UI modal, no window.confirm)
  const handleConfirmDeleteSong = async () => {
    if (!activeAlbumId || !songToDelete) return;
    setIsDeleting(true);
    try {
      await removeSongFromAlbum(activeAlbumId, songToDelete.id);
      setFeedbackMsg({ text: `Đã xóa bài hát "${songToDelete.title}" khỏi album!`, type: 'success' });
      setSongToDelete(null);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ text: 'Lỗi khi xóa bài hát: ' + (err?.message || 'Lỗi'), type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Reorder Song
  const handleMoveSong = async (songId: string, direction: 'up' | 'down') => {
    if (!activeAlbumId) return;
    await reorderSongInAlbum(activeAlbumId, songId, direction);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 select-none font-['Roboto_Condensed']">
      {/* Global Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 text-white/60 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: MANAGING SONGS INSIDE AN ALBUM */}
      {activeAlbum ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Bar with Back Button, Info, and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setActiveAlbumId(null)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                title="Quay lại danh sách album"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-md">
                <img
                  src={activeAlbum.coverImage}
                  alt={activeAlbum.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {activeAlbum.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/20 text-[#c273ed] border border-purple-500/30 shrink-0">
                    {activeAlbum.genre || 'V-Pop'}
                  </span>
                </div>
                <p className="text-xs text-white/60 truncate mt-0.5">
                  Nghệ sĩ: <strong className="text-white">{activeAlbum.artist}</strong> • {activeAlbumSongs.length} bài hát • Năm {activeAlbum.releaseYear || '2026'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto shrink-0">
              <button
                onClick={() => handleOpenEditAlbum(activeAlbum)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                title="Sửa thông tin album này"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa Album</span>
              </button>

              <button
                onClick={handleOpenAddSong}
                style={{ backgroundColor: 'var(--color-accent)' }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Bài Hát</span>
              </button>
            </div>
          </div>

          {/* Search bar inside album */}
          {activeAlbumSongs.length > 3 && (
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                placeholder="Tìm bài hát trong album..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* Table / List of Songs inside Album */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#170f23]/90 shadow-xl">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between text-xs font-bold text-white bg-white/5">
              <span>Danh Sách Bài Hát Trong Album ({filteredAlbumSongs.length}/{activeAlbumSongs.length})</span>
              <span className="text-[11px] text-white/50">Dùng nút mũi tên ↑ ↓ để đổi thứ tự bài</span>
            </div>

            {filteredAlbumSongs.length === 0 ? (
              <div className="p-12 text-center text-white/40 text-xs space-y-3">
                <Music2 className="w-10 h-10 mx-auto stroke-[1.2] text-white/30" />
                <p className="text-white/60 font-bold">Album này chưa có bài hát nào.</p>
                <p className="text-[11px]">Bấm vào nút dưới để thêm bài hát đầu tiên vào album.</p>
                <button
                  onClick={handleOpenAddSong}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Bài Hát Ngay</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredAlbumSongs.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isPlayingThis = isCurrent && isPlaying;
                  const originalIndex = activeAlbumSongs.findIndex((s) => s.id === song.id);

                  return (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors gap-2 sm:gap-4 ${
                        isCurrent ? 'bg-purple-600/15' : ''
                      }`}
                    >
                      {/* Left: Reorder Arrows + STT + Play button + Info */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Move Up / Down Buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            onClick={() => handleMoveSong(song.id, 'up')}
                            disabled={originalIndex === 0}
                            className="p-0.5 rounded hover:bg-white/20 disabled:opacity-20 text-white/70 hover:text-white cursor-pointer"
                            title="Di chuyển lên trên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveSong(song.id, 'down')}
                            disabled={originalIndex === activeAlbumSongs.length - 1}
                            className="p-0.5 rounded hover:bg-white/20 disabled:opacity-20 text-white/70 hover:text-white cursor-pointer"
                            title="Di chuyển xuống dưới"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Consecutive STT */}
                        <span className="text-xs font-mono font-bold text-white/40 w-5 text-center shrink-0">
                          {song.stt || idx + 1}
                        </span>

                        {/* Test Play Button */}
                        <button
                          onClick={() => {
                            if (isCurrent) {
                              togglePlay();
                            } else {
                              playAlbumTrack(song, activeAlbum);
                            }
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow shrink-0 active:scale-95 transition-all cursor-pointer ${
                            isCurrent ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-white/10 hover:bg-purple-600'
                          }`}
                          title={isPlayingThis ? 'Tạm dừng' : 'Phát thử bài hát'}
                        >
                          {isPlayingThis ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>

                        {/* Song Cover Thumbnail */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0 relative shadow-sm">
                          <img
                            src={song.coverImage || activeAlbum.coverImage}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = activeAlbum.coverImage;
                            }}
                          />
                        </div>

                        {/* Title and Artists */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-[#c273ed]' : 'text-white'}`}>
                              {song.title}
                            </p>
                            {song.lrcRaw && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                                LRC
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/50 truncate mt-0.5">
                            {song.artists}
                          </p>
                        </div>
                      </div>

                      {/* Right: Audio Format + Duration + Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          song.audioFormat === 'WAV'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {song.audioFormat || 'MP3'}
                        </span>

                        <span className="text-xs font-mono text-white/50 w-11 text-right">
                          {formatSeconds(song.duration || 0)}
                        </span>

                        <button
                          onClick={() => handleOpenEditSong(song)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-[#9b4de0] text-white transition-colors cursor-pointer"
                          title="Chỉnh sửa bài hát này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSongToDelete(song)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer"
                          title="Xóa bài hát khỏi album"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW 2: ALBUMS LIST MANAGEMENT */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-[#c273ed]" />
                <span>Kho Album Nhạc Hay</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-[#c273ed] border border-purple-500/30 font-bold">
                  {exclusiveAlbums.length} album
                </span>
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                Tạo, chỉnh sửa nội dung, thêm xóa bài hát và đồng bộ toàn diện với Firebase
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {/* Force Sync Albums to Firebase */}
              <button
                onClick={handleSyncAlbums}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Đẩy tất cả album lên Firebase RTDB & Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Lên Firebase'}</span>
              </button>

              {/* Seed Sample Albums button */}
              {exclusiveAlbums.length === 0 && (
                <button
                  onClick={handleSeedDefaultAlbums}
                  disabled={isSeeding}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Nạp lại các album nhạc hay mẫu XuanKen"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSeeding ? 'Đang nạp...' : '🌱 Nạp Album Mẫu'}</span>
                </button>
              )}

              {/* Create New Album Button */}
              <button
                onClick={handleOpenAddAlbum}
                style={{ backgroundColor: 'var(--color-accent)' }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Album Mới</span>
              </button>
            </div>
          </div>

          {/* Grid of Albums */}
          {exclusiveAlbums.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-white/20 text-white/50 text-xs space-y-3">
              <Disc3 className="w-12 h-12 text-white/30 mx-auto" />
              <h3 className="text-base font-bold text-white">Chưa Có Album Nào Trong Hệ Thống</h3>
              <p className="max-w-md mx-auto leading-relaxed">
                Tất cả album đã được xóa sạch. Bạn có thể bấm <strong>"+ Tạo Album Mới"</strong> để tự tạo album riêng hoặc bấm <strong>"Nạp Album Mẫu"</strong> khi cần nạp lại 3 album tuyển chọn!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSeedDefaultAlbums}
                  disabled={isSeeding}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  🌱 Nạp 3 Album Mẫu XuanKen
                </button>
                <button
                  onClick={handleOpenAddAlbum}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  + Tự Tạo Album Mới
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exclusiveAlbums.map((album) => {
                const songsCount = Array.isArray(album.songs) ? album.songs.length : 0;

                return (
                  <div
                    key={album.id}
                    className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* Album Header: Cover + Info */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-md">
                          <img
                            src={album.coverImage}
                            alt={album.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white truncate" title={album.title}>
                              {album.title}
                            </h4>
                          </div>
                          <p className="text-xs text-white/60 truncate mt-0.5">
                            {album.artist}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/80">
                              {album.genre || 'V-Pop'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-[#c273ed] font-mono">
                              {songsCount} bài
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                        {album.description || 'Chưa có mô tả chi tiết cho album này.'}
                      </p>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
                      <button
                        onClick={() => setActiveAlbumId(album.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600 text-[#c273ed] hover:text-white border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
                        title="Vào quản lý danh sách bài hát trong album"
                      >
                        <Music2 className="w-3.5 h-3.5" />
                        <span>Quản lý bài ({songsCount})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditAlbum(album)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                        title="Chỉnh sửa album"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setAlbumToDelete(album)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-red-600 text-white/80 hover:text-white transition-colors cursor-pointer"
                        title="Xóa album này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CONFIRM DELETE ALBUM (In-UI modal, no browser window.confirm) */}
      {albumToDelete && (
        <div
          data-theme={theme}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            className="w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Xóa Album</h3>
                <p className="text-xs text-white/50">Hành động này sẽ xóa vĩnh viễn album khỏi hệ thống</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                <img
                  src={albumToDelete.coverImage}
                  alt={albumToDelete.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{albumToDelete.title}</p>
                <p className="text-[11px] text-white/60 truncate">{albumToDelete.artist} • {Array.isArray(albumToDelete.songs) ? albumToDelete.songs.length : 0} bài hát</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Toàn bộ bài hát bên trong album này cũng sẽ được xóa sạch khỏi cơ sở dữ liệu và thiết bị. Bạn có chắc chắn muốn xóa?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAlbumToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAlbum}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa Album Ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE SONG IN ALBUM (In-UI modal, no browser window.confirm) */}
      {songToDelete && (
        <div
          data-theme={theme}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            className="w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Xóa Bài Hát</h3>
                <p className="text-xs text-white/50">Xóa bài hát khỏi album hiện tại</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-bold text-white truncate">{songToDelete.title}</p>
              <p className="text-[11px] text-white/60 truncate mt-0.5">{songToDelete.artists} • {songToDelete.audioFormat}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSongToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSong}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa Bài Hát'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT ALBUM */}
      {isAlbumModalOpen && (
        <div
          data-theme={theme}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            className="w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-[#c273ed]" />
                <h3 className="text-base font-bold text-white">
                  {editingAlbumId ? 'Chỉnh Sửa Album' : 'Tạo Album Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsAlbumModalOpen(false)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="space-y-3.5 text-xs">
              {/* Album Title */}
              <div>
                <label className="block text-white/80 font-bold mb-1.5">Tên Album (*)</label>
                <input
                  type="text"
                  required
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder="Ví dụ: Tuyển Tập Ballad XuanKen"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 font-bold"
                />
              </div>

              {/* Artist */}
              <div>
                <label className="block text-white/80 font-bold mb-1.5">Nghệ Sĩ Thực Hiện (*)</label>
                <input
                  type="text"
                  required
                  value={albumArtist}
                  onChange={(e) => setAlbumArtist(e.target.value)}
                  placeholder="Ví dụ: XuanKen Official"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Genre & Release Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-bold mb-1.5">Thể Loại</label>
                  <input
                    type="text"
                    value={albumGenre}
                    onChange={(e) => setAlbumGenre(e.target.value)}
                    placeholder="V-Pop / Ballad"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-bold mb-1.5">Năm Phát Hành</label>
                  <input
                    type="text"
                    value={albumReleaseYear}
                    onChange={(e) => setAlbumReleaseYear(e.target.value)}
                    placeholder="2026"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Album Cover with URL input & Local File Upload + Preview */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <label className="block text-white/80 font-bold">Ảnh Bìa Album (Cover Art)</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/50 border border-white/20 shrink-0 shadow-md flex items-center justify-center">
                    {albumCoverImage ? (
                      <img
                        src={albumCoverImage}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white/40" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={albumCoverImage}
                      onChange={(e) => setAlbumCoverImage(e.target.value)}
                      placeholder="Dán link ảnh online (https://...)"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-purple-500 font-mono"
                    />

                    <input
                      type="file"
                      ref={albumFileInputRef}
                      accept="image/*"
                      onChange={handleAlbumCoverFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => albumFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#c273ed]" />
                      <span>Chọn ảnh từ máy / thiết bị</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Album Description */}
              <div>
                <label className="block text-white/80 font-bold mb-1.5">Mô Tả Giới Thiệu Album</label>
                <textarea
                  rows={3}
                  value={albumDescription}
                  onChange={(e) => setAlbumDescription(e.target.value)}
                  placeholder="Giới thiệu về album, phong cách âm nhạc..."
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAlbumModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAlbum}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingAlbum ? 'Đang lưu...' : 'Lưu Album'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT SONG IN ALBUM */}
      {isSongModalOpen && (
        <div
          data-theme={theme}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            className="w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-[#c273ed]" />
                <h3 className="text-base font-bold text-white">
                  {editingSongId ? 'Chỉnh Sửa Bài Hát Trong Album' : 'Thêm Bài Hát Vào Album'}
                </h3>
              </div>
              <button
                onClick={() => setIsSongModalOpen(false)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="space-y-3.5 text-xs">
              {/* Song Title & Artists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-bold mb-1.5">Tên Bài Hát (*)</label>
                  <input
                    type="text"
                    required
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Ví dụ: Gió Thoảng Mây Bay"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-bold mb-1.5">Ca Sĩ Thể Hiện (*)</label>
                  <input
                    type="text"
                    required
                    value={songArtists}
                    onChange={(e) => setSongArtists(e.target.value)}
                    placeholder="Ví dụ: XuanKen"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Format & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-bold mb-1.5">Định Dạng Âm Thanh (*)</label>
                  <select
                    value={songAudioFormat}
                    onChange={(e) => setSongAudioFormat(e.target.value as AudioFormat)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="MP3">MP3 (320kbps High Quality)</option>
                    <option value="WAV">WAV (24-bit Lossless Studio Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1.5">Thời Lượng (Phút : Giây)</label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-black/40 border border-white/15 rounded-xl px-3 py-2 flex-1">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={songDurationMins}
                        onChange={(e) => setSongDurationMins(e.target.value)}
                        placeholder="3"
                        className="w-12 bg-transparent text-center text-white font-mono font-bold text-xs focus:outline-none"
                      />
                      <span className="text-white/40 font-bold mx-1">:</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={songDurationSecs}
                        onChange={(e) => setSongDurationSecs(e.target.value)}
                        placeholder="30"
                        className="w-12 bg-transparent text-center text-white font-mono font-bold text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover image (Defaults to album cover, but customizable) */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-white/80 font-bold">Ảnh Bìa Bài Hát (Tùy chọn)</label>
                  <button
                    type="button"
                    onClick={() => setSongCoverImage(activeAlbum?.coverImage || '')}
                    className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                  >
                    Dùng ảnh bìa album
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/15 shrink-0 flex items-center justify-center">
                    {songCoverImage || activeAlbum?.coverImage ? (
                      <img
                        src={songCoverImage || activeAlbum?.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      value={songCoverImage}
                      onChange={(e) => setSongCoverImage(e.target.value)}
                      placeholder="https://... (để trống nếu dùng ảnh album)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <input
                      type="file"
                      ref={songFileInputRef}
                      accept="image/*"
                      onChange={handleSongCoverFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => songFileInputRef.current?.click()}
                      className="text-[10px] font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Chọn ảnh từ thiết bị</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Audio URL Fields */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Liên Kết Âm Thanh</span>
                  <span className="text-[10px] text-white/50">Dán link MP3 hoặc WAV</span>
                </div>

                {/* MP3 URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold text-[11px]">Link Nhạc MP3 (320kbps)</label>
                    {songMp3Url && (
                      <button
                        type="button"
                        onClick={() => handleAutoDetectDuration(songMp3Url)}
                        disabled={isDetectingDuration}
                        className="text-[10px] text-[#c273ed] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{isDetectingDuration ? 'Đang đo...' : 'Tự đo thời lượng'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={songMp3Url}
                    onChange={(e) => setSongMp3Url(e.target.value)}
                    onBlur={() => {
                      if (songMp3Url) handleAutoDetectDuration(songMp3Url);
                    }}
                    placeholder="https://.../song.mp3"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* WAV URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 font-semibold text-[11px]">Link Nhạc WAV (Lossless)</label>
                    {songWavUrl && (
                      <button
                        type="button"
                        onClick={() => handleAutoDetectDuration(songWavUrl)}
                        disabled={isDetectingDuration}
                        className="text-[10px] text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{isDetectingDuration ? 'Đang đo...' : 'Tự đo thời lượng'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={songWavUrl}
                    onChange={(e) => setSongWavUrl(e.target.value)}
                    onBlur={() => {
                      if (!songMp3Url && songWavUrl) handleAutoDetectDuration(songWavUrl);
                    }}
                    placeholder="https://.../song.wav"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Lyrics (LRC) */}
              <div>
                <label className="block text-white/80 font-bold mb-1.5">Lời Bài Hát (Định dạng LRC hoặc lời thô)</label>
                <textarea
                  rows={4}
                  value={songLrcRaw}
                  onChange={(e) => setSongLrcRaw(e.target.value)}
                  placeholder="[00:00.00] Tên bài hát&#10;[00:15.00] Dòng lời bài hát 1...&#10;[00:30.00] Dòng lời bài hát 2..."
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px] resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSongModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingSong}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSong ? 'Đang lưu...' : 'Lưu Bài Hát Vào Album'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
