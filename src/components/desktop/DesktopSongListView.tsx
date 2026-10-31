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
  ChevronLeft,
  ChevronRight,
  Shuffle,
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
    setIsDemoLimitModalOpen,
    setActiveDesktopTab,
    openShareModal,
    openAddToPlaylistModal,
    preferredAudioFormat,
    setPreferredAudioFormat,
    songFormatMap,
    setSongAudioFormat,
    openDownloadModal,
    isShuffle,
    toggleShuffle,
    setPlaybackSource,
    playlists,
  } = useMusic();

  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Requirement 2: Play Order or Random Dropdown state
  const [isPlayMenuOpen, setIsPlayMenuOpen] = useState(false);
  const playMenuRef = useRef<HTMLDivElement | null>(null);

  // Requirement 21: 20 songs per page
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

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

  // Close Play Menu when clicking outside
  useEffect(() => {
    const handleClickOutsidePlayMenu = (e: MouseEvent) => {
      if (playMenuRef.current && !playMenuRef.current.contains(e.target as Node)) {
        setIsPlayMenuOpen(false);
      }
    };
    if (isPlayMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsidePlayMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsidePlayMenu);
    };
  }, [isPlayMenuOpen]);

  // Requirement 5: Do NOT close activeMenuSongId on outside click!
  // It only closes when the user clicks the 3 vertical dots button again or chooses an option.

  // Sort alphabetically A -> Z
  const sortedSongs = [...songs].sort((a, b) =>
    a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
  );

  const totalSongs = sortedSongs.length;
  const purchasedCount = sortedSongs.filter((s) => isSongPurchased(s.id)).length;
  const unpurchasedCount = Math.max(0, totalSongs - purchasedCount);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalSongs / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const paginatedSongs = sortedSongs.slice(startIndex, startIndex + PAGE_SIZE);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '03:30';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayOrPause = (song: Song) => {
    setPlaybackSource('Danh sách bài hát');
    if (currentSong && currentSong.id === song.id) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const handlePlayInOrder = () => {
    if (sortedSongs.length === 0) return;
    setPlaybackSource('Danh sách bài hát');
    if (isShuffle) toggleShuffle();
    playSong(sortedSongs[0]);
    setIsPlayMenuOpen(false);
  };

  const handlePlayRandom = () => {
    if (sortedSongs.length === 0) return;
    setPlaybackSource('Danh sách bài hát');
    if (!isShuffle) toggleShuffle();
    const randomIndex = Math.floor(Math.random() * sortedSongs.length);
    playSong(sortedSongs[randomIndex]);
    setIsPlayMenuOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header with Title and MP3 / WAV Global Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
              Danh Sách Bài Hát
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Tổng cộng {totalSongs} bài hát • Đã mua: <span className="text-emerald-400 font-bold">{purchasedCount} bài</span> • Chưa mua: <span className="text-amber-400 font-bold">{unpurchasedCount} bài</span>
            </p>
          </div>

          {/* Requirement 2: Circular Play button with Play Order / Random Dropdown */}
          <div className="relative" ref={playMenuRef}>
            <button
              onClick={() => setIsPlayMenuOpen(!isPlayMenuOpen)}
              disabled={sortedSongs.length === 0}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white flex items-center justify-center shadow-xl shadow-amber-600/30 transition-transform active:scale-95 disabled:opacity-40 shrink-0 ml-1"
              title="Phát nhạc (Theo thứ tự hoặc Ngẫu nhiên)"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5 text-white" />
            </button>

            {isPlayMenuOpen && (
              <div className="absolute left-0 top-14 w-56 rounded-2xl bg-[#231b2e] border border-white/15 shadow-2xl p-2 z-50 text-white animate-in zoom-in-95 duration-150 space-y-1">
                <button
                  onClick={handlePlayInOrder}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Phát theo thứ tự</p>
                    <p className="text-[10px] text-white/50">Phát lần lượt từ bài đầu</p>
                  </div>
                </button>

                <button
                  onClick={handlePlayRandom}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-[#c273ed] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Phát ngẫu nhiên</p>
                    <p className="text-[10px] text-white/50">Xáo trộn bài hát ngẫu nhiên</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MP3 & WAV Audio Format Switcher */}
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

      {/* Main Table: STT - TÊN BÀI - TÊN CA SỸ - LRC - THỜI LƯỢNG - MP3 HAY WAV - MUA - THAO TÁC */}
      <div
        className="rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold text-white/60 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-14 whitespace-nowrap">STT</th>
                <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">TÊN BÀI</th>
                <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">TÊN CA SỸ</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[80px]">LRC</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">THỜI LƯỢNG</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">MP3 HAY WAV</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">MUA</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[90px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {paginatedSongs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/50">
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
                paginatedSongs.map((song, idx) => {
                  const globalIndex = startIndex + idx;
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  const isPurchased = isSongPurchased(song.id);
                  const isLiked = likedSongIds.includes(song.id);
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
                            {globalIndex + 1}
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
                          title="Bấm để xem và tải file lời (.lrc)"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#c273ed] group-hover:text-white" />
                          <span>LRC</span>
                        </button>
                      </td>

                      {/* 5: THỜI LƯỢNG */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-white/60 tabular-nums">
                        {formatDuration(song.duration)}
                      </td>

                      {/* 6: MP3 HAY WAV */}
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

                      {/* 7: MUA (Item 1: luôn trên 1 dòng, không bị xuống dòng) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {isPurchased ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="whitespace-nowrap">Đã mua</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSongToBuy(song);
                              setIsDemoLimitModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap shrink-0"
                            title="Bấm để mua bản quyền full bài hát"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">Chưa mua</span>
                          </button>
                        )}
                      </td>

                      {/* 8: THAO TÁC (Requirement 2: mục Thao tác bên phải) */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleMenu(e, song.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            activeMenuSongId === song.id
                              ? 'bg-white/20 text-white'
                              : 'hover:bg-white/10 text-white/60 hover:text-white'
                          }`}
                          title="Thao tác bài hát"
                        >
                          <MoreVertical className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Fixed Dropdown Menu for 3-dots: Includes Heart / Tim bài hát (Requirement 12) */}
        {activeMenuSongId && menuPosition && (() => {
          const targetSong = sortedSongs.find((s) => s.id === activeMenuSongId);
          if (!targetSong) return null;
          const isTargetPurchased = isSongPurchased(targetSong.id);
          const isTargetLiked = likedSongIds.includes(targetSong.id);

          return (
            <div
              ref={menuRef}
              style={{ top: menuPosition.top, right: menuPosition.right }}
              onClick={(e) => e.stopPropagation()}
              className="fixed w-52 rounded-2xl bg-[#231b2e] border border-white/15 shadow-2xl p-1.5 z-[999] text-xs text-white space-y-1 animate-in fade-in duration-150"
            >
              {/* Requirement 12: Tim bài hát */}
              <button
                onClick={() => {
                  toggleLike(targetSong.id);
                  setActiveMenuSongId(null);
                  setMenuPosition(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors"
              >
                <Heart className={`w-4 h-4 ${isTargetLiked ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                <span>{isTargetLiked ? 'Bỏ tim bài hát' : 'Tim bài hát'}</span>
              </button>

              {playlists.some((p) => p.songIds.includes(targetSong.id)) ? (
                <button
                  onClick={() => {
                    openAddToPlaylistModal(targetSong);
                    setActiveMenuSongId(null);
                    setMenuPosition(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium text-emerald-400 transition-colors cursor-pointer"
                  title="Bài hát đã có trong playlist"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-semibold">Đã thêm vào playlist</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    openAddToPlaylistModal(targetSong);
                    setActiveMenuSongId(null);
                    setMenuPosition(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors cursor-pointer"
                >
                  <ListPlus className="w-4 h-4 text-[#c273ed] shrink-0" />
                  <span>Thêm vào playlist</span>
                </button>
              )}

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

        {/* Requirement 21: Pagination Controls (20 bài 1 trang) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-white/[0.02]">
            <p className="text-xs text-white/50">
              Hiển thị {(validCurrentPage - 1) * PAGE_SIZE + 1} - {Math.min(validCurrentPage * PAGE_SIZE, totalSongs)} trong tổng số {totalSongs} bài hát (20 bài/trang)
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    validCurrentPage === pageNum
                      ? 'bg-[#9b4de0] text-white shadow'
                      : 'border border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
