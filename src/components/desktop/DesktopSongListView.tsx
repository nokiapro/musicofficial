import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  FileText,
  ShoppingCart,
  CheckCircle,
  Download,
  Music,
  Share2,
  ListPlus,
  MoreVertical,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song } from '../../types/music';

export const DesktopSongListView: React.FC = () => {
  const {
    songs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    likedSongIds,
    toggleLike,
    isSongPurchased,
    setSelectedLrcSong,
    setSongToBuy,
    setIsBuyModalOpen,
    setIsDemoLimitModalOpen,
    setActiveDesktopTab,
    openShareModal,
    openAddToPlaylistModal,
    downloadSong,
    preferredAudioFormat,
    setPreferredAudioFormat,
    songFormatMap,
    setSongAudioFormat,
    openDownloadModal,
  } = useMusic();

  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleToggleMenu = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (activeMenuSongId === songId) {
      setActiveMenuSongId(null);
      setMenuPosition(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      right: Math.max(16, window.innerWidth - rect.right),
    });
    setActiveMenuSongId(songId);
  };

  // Close 3-dots popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSongId(null);
        setMenuPosition(null);
      }
    };
    if (activeMenuSongId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuSongId]);

  // Requirement 6: Sort alphabetically A -> Z (ABCD) by song title
  const sortedSongs = [...songs].sort((a, b) =>
    a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
  );

  const totalSongs = sortedSongs.length;
  const purchasedCount = sortedSongs.filter((s) => isSongPurchased(s.id)).length;
  const unpurchasedCount = Math.max(0, totalSongs - purchasedCount);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '03:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayOrPause = (song: Song) => {
    if (currentSong && currentSong.id === song.id) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header with Title and MP3 / WAV Global Switcher (Requirement 3: remove 'LOSSLESS') */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            Danh Sách Bài Hát
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Tổng cộng {totalSongs} bài hát • Đã mua: <span className="text-emerald-400 font-bold">{purchasedCount} bài</span> • Chưa mua: <span className="text-amber-400 font-bold">{unpurchasedCount} bài</span>
          </p>
        </div>

        {/* MP3 & WAV Audio Format Switcher (Requirement 3: just MP3 and WAV) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 text-xs shadow-sm">
            <button
              onClick={() => setPreferredAudioFormat('MP3')}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
                preferredAudioFormat === 'MP3'
                  ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/40'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Phát tất cả ở định dạng MP3 (320kbps)"
            >
              MP3
            </button>
            <button
              onClick={() => setPreferredAudioFormat('WAV')}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
                preferredAudioFormat === 'WAV'
                  ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/40'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Phát tất cả ở định dạng WAV chất lượng cao"
            >
              WAV
            </button>
          </div>
        </div>
      </div>

      {/* Main Table: STT - TÊN BÀI - TÊN CA SỸ - LRC - THỜI LƯỢNG - MP3 HAY WAV - TRẠNG THÁI / MUA */}
      <div
        className="rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold text-white/60 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-14">STT</th>
                <th className="py-3.5 px-4 min-w-[220px]">TÊN BÀI</th>
                <th className="py-3.5 px-4 min-w-[160px]">TÊN CA SỸ</th>
                <th className="py-3.5 px-4 text-center w-24">LRC</th>
                <th className="py-3.5 px-4 text-center w-32">THỜI LƯỢNG</th>
                <th className="py-3.5 px-4 text-center w-36">MP3 HAY WAV</th>
                <th className="py-3.5 px-4 text-right min-w-[200px]">TRẠNG THÁI / MUA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {sortedSongs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/50">
                    <Music className="w-10 h-10 text-white/20 mx-auto mb-2" />
                    <p className="text-base font-bold text-white">Chưa có bài hát nào trong hệ thống</p>
                    <p className="text-xs text-white/50 mt-1">Dữ liệu demo đã xóa. Hãy vào trang Admin để thêm bài hát mới.</p>
                    <button
                      onClick={() => setActiveDesktopTab('admin')}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#9b4de0] text-white text-xs font-bold shadow hover:bg-[#8539c9] transition-colors"
                    >
                      + Vào Quản Trị Thêm Bài Hát
                    </button>
                  </td>
                </tr>
              ) : (
                sortedSongs.map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  const isPurchased = isSongPurchased(song.id);
                  const isLiked = likedSongIds.includes(song.id);

                  // Determine active format for this specific song
                  const activeFormat = songFormatMap[song.id] || preferredAudioFormat;

                  return (
                    <tr
                      key={song.id}
                      onClick={() => handlePlayOrPause(song)}
                      className={`cursor-pointer transition-colors group ${
                        isCurrent
                          ? 'bg-[#9b4de0]/15 hover:bg-[#9b4de0]/20'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* 1: STT */}
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-white/50 group-hover:text-white font-mono">
                        {isCurrentPlaying ? (
                          <div className="w-6 h-6 rounded-full bg-[#9b4de0] text-white flex items-center justify-center mx-auto shadow">
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          </div>
                        ) : (
                          <span className="group-hover:hidden">
                            {index + 1}
                          </span>
                        )}
                        {!isCurrentPlaying && (
                          <div className="hidden group-hover:flex w-6 h-6 rounded-full bg-white text-slate-900 items-center justify-center mx-auto shadow">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        )}
                      </td>

                      {/* 2: TÊN BÀI */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center shrink-0 shadow-md relative overflow-hidden border border-white/10`}
                          >
                            {song.coverImage ? (
                              <img
                                src={song.coverImage}
                                alt={song.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <Music className="w-5 h-5 text-white/70" />
                            )}
                          </div>
                          <div className="truncate">
                            <p
                              className={`font-bold truncate ${
                                isCurrent ? 'text-[#c273ed]' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </p>
                            <p className="text-[11px] text-white/40 truncate mt-0.5">
                              Album: {song.album || 'XuanKen Official'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3: TÊN CA SỸ */}
                      <td className="py-3.5 px-4 font-medium text-white/80 truncate">
                        {song.artists}
                      </td>

                      {/* 4: LRC */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLrcSong(song);
                        }}
                      >
                        <button
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#9b4de0] text-white/80 hover:text-white text-xs font-semibold transition-colors"
                          title="Bấm để xem và tải tệp lời bài hát (.lrc)"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#c273ed] group-hover:text-white" />
                          <span>LRC</span>
                        </button>
                      </td>

                      {/* 5: THỜI LƯỢNG BÀI HÁT */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-white/60 tabular-nums">
                        {formatDuration(song.duration)}
                      </td>

                      {/* 6: MP3 HAY WAV (Requirement 1: user can select per-song format) */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-bold">
                          <button
                            onClick={() => {
                              setSongAudioFormat(song.id, 'MP3');
                              playSong(song, 'MP3');
                            }}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                              activeFormat === 'MP3'
                                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                            title="Nghe bài này theo MP3 (320kbps)"
                          >
                            MP3
                          </button>
                          <button
                            onClick={() => {
                              setSongAudioFormat(song.id, 'WAV');
                              playSong(song, 'WAV');
                            }}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                              activeFormat === 'WAV'
                                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/50'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                            title="Nghe bài này theo WAV chất lượng cao"
                          >
                            WAV
                          </button>
                        </div>
                      </td>

                      {/* 7: TRẠNG THÁI / MUA (Requirement 1 & 2: fixed 3-dots dropdown without row expansion) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {isPurchased ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Đã mua</span>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSongToBuy(song);
                                setIsDemoLimitModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                              title="Bấm để mua bản quyền full bài hát"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Chưa mua</span>
                            </button>
                          )}

                          {/* 3-dots vertical button */}
                          <button
                            onClick={(e) => handleToggleMenu(e, song.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              activeMenuSongId === song.id
                                ? 'bg-white/20 text-white'
                                : 'hover:bg-white/10 text-white/60 hover:text-white'
                            }`}
                            title="Tùy chọn bài hát"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Fixed Dropdown Menu for 3-dots to avoid table stretching (Requirement 2 & 4) */}
        {activeMenuSongId && menuPosition && (() => {
          const targetSong = sortedSongs.find((s) => s.id === activeMenuSongId);
          if (!targetSong) return null;
          const isTargetPurchased = isSongPurchased(targetSong.id);

          return (
            <div
              ref={menuRef}
              style={{ top: menuPosition.top, right: menuPosition.right }}
              onClick={(e) => e.stopPropagation()}
              className="fixed w-48 rounded-2xl bg-[#231b2e] border border-white/15 shadow-2xl p-1.5 z-[999] text-xs text-white space-y-1 animate-in fade-in duration-150"
            >
              <button
                onClick={() => {
                  openAddToPlaylistModal(targetSong);
                  setActiveMenuSongId(null);
                  setMenuPosition(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors"
              >
                <ListPlus className="w-4 h-4 text-[#c273ed]" />
                <span>Thêm vào playlist</span>
              </button>

              <button
                onClick={() => {
                  openShareModal(targetSong);
                  setActiveMenuSongId(null);
                  setMenuPosition(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Chia sẻ bài hát</span>
              </button>

              {isTargetPurchased && (
                <button
                  onClick={() => {
                    openDownloadModal(targetSong);
                    setActiveMenuSongId(null);
                    setMenuPosition(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium text-emerald-300 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Tải nhạc về (MP3/WAV)</span>
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
