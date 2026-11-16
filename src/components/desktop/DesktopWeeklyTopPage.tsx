import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Flame,
  Calendar,
  Crown,
  Heart,
  MoreVertical,
  CheckCircle,
  FileText,
  Download,
  RotateCcw,
  Shuffle,
  ListPlus,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ArtistNames } from '../common/ArtistNames';
import { useAutoScrollToSong } from '../../hooks/useAutoScrollToSong';

export const DesktopWeeklyTopPage: React.FC = () => {
  const {
    songs,
    weeklyPlays,
    currentWeekKey,
    playSong,
    likedSongIds,
    toggleLike,
    isSongPurchased,
    setSongToBuy,
    setIsDemoLimitModalOpen,
    setSelectedLrcSong,
    currentSong,
    isPlaying,
    openDownloadModal,
    playlists,
    openAddToPlaylistModal,
    playCustomPool,
  } = useMusic();

  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isPlayMenuOpen, setIsPlayMenuOpen] = useState(false);
  const playMenuRef = useRef<HTMLDivElement | null>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  // Close 3-dots Menu on outside click (Requirement 3)
  useEffect(() => {
    const handleClickOutsideMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSongId(null);
      }
    };
    if (activeMenuSongId) {
      document.addEventListener('mousedown', handleClickOutsideMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu);
    };
  }, [activeMenuSongId]);

  // Compute top 10 songs of this week
  const weeklyRankedSongs = [...songs]
    .map((song) => {
      const playsThisWeek = weeklyPlays[song.id] || 0;
      return { ...song, weeklyPlaysCount: playsThisWeek };
    })
    .sort((a, b) => b.weeklyPlaysCount - a.weeklyPlaysCount)
    .slice(0, 10);

  useAutoScrollToSong({
    containerRef: tableBodyRef,
    songId: currentSong?.id,
    enabled: true,
    viewKey: 'desktop-weekly-top',
    manualTrigger: scrollTrigger,
    itemCount: weeklyRankedSongs.length,
  });

  const handlePlayInOrder = () => {
    if (weeklyRankedSongs.length === 0) return;
    playCustomPool(weeklyRankedSongs, 'Top Tuần', false, weeklyRankedSongs[0]);
    setScrollTrigger((t) => t + 1);
    setIsPlayMenuOpen(false);
  };

  const handlePlayRandom = () => {
    if (weeklyRankedSongs.length === 0) return;
    playCustomPool(weeklyRankedSongs, 'Top Tuần', true);
    setScrollTrigger((t) => t + 1);
    setIsPlayMenuOpen(false);
  };

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

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '03:30';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-7 pb-16 select-none">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2.5 font-display">
                <span>Nghe Nhiều Nhất Tuần</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm">
                  Top 10
                </span>
              </h1>
              <p className="text-xs text-white/55 mt-0.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Tuần: <strong className="text-amber-300 font-mono tabular-nums">{currentWeekKey}</strong> • Tự động reset về 0 mỗi tuần</span>
              </p>
            </div>
          </div>

          {/* Large circular Play button with Play Order / Random Dropdown */}
          <div className="relative" ref={playMenuRef}>
            <button
              onClick={() => setIsPlayMenuOpen(!isPlayMenuOpen)}
              disabled={weeklyRankedSongs.length === 0}
              className="w-12 h-12 rounded-full accent-glow-btn text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 shrink-0 ml-2 cursor-pointer"
              title="Nghe tất cả bài hát trong tuần này (Theo thứ tự hoặc Ngẫu nhiên)"
            >
              <Play className="w-6 h-6 fill-current ml-0.5 text-white" />
            </button>

            {isPlayMenuOpen && (
              <div className="absolute left-0 top-14 w-56 glass-panel rounded-2xl p-2 z-50 animate-in zoom-in-95 duration-150 space-y-1">
                <button
                  onClick={handlePlayInOrder}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] text-left transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Phát theo thứ tự</p>
                    <p className="text-[10px] text-white/50">Phát từ Top 1 tuần này</p>
                  </div>
                </button>

                <button
                  onClick={handlePlayRandom}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] text-left transition-colors group cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 22%, transparent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Phát ngẫu nhiên</p>
                    <p className="text-[10px] text-white/50">Xáo trộn ngẫu nhiên Top 10</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60 bg-white/[0.05] px-3.5 py-1.5 rounded-full border border-white/[0.08] self-start sm:self-auto">
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Tự động làm mới lượt nghe hàng tuần</span>
        </div>
      </div>

      {/* Top 10 Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03] text-[11px] font-bold text-white/55 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[105px]">THỨ HẠNG</th>
                <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">BÀI HÁT</th>
                <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">CA SỸ</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[105px]">ĐỊNH DẠNG</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">LƯỢT NGHE TUẦN</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">THỜI LƯỢNG</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">MUA</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[105px]">THÊM</th>
              </tr>
            </thead>
            <tbody ref={tableBodyRef} className="divide-y divide-white/[0.05]">
              {weeklyRankedSongs.map((song, idx) => {
                const rank = idx + 1;
                const isCurrent = currentSong?.id === song.id;
                const isPurchased = isSongPurchased(song.id);
                const isLiked = likedSongIds.includes(song.id);

                const rankStyle =
                  rank === 1
                    ? 'text-amber-400 bg-amber-500/15 border-amber-500/40'
                    : rank === 2
                    ? 'text-sky-400 bg-sky-500/15 border-sky-500/40'
                    : rank === 3
                    ? 'text-rose-400 bg-rose-500/15 border-rose-500/40'
                    : 'text-white/45 border-white/[0.06] bg-white/[0.02]';

                return (
                  <tr
                    key={song.id}
                    data-song-id={song.id}
                    onClick={() => playSong(song)}
                    style={
                      isCurrent
                        ? { backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, transparent)' }
                        : undefined
                    }
                    className={`cursor-pointer transition-colors group ${
                      isCurrent ? '' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-sm mx-auto shadow-sm font-so tabular-nums ${rankStyle}`}>
                        {rank === 1 ? <Crown className="w-4 h-4 fill-amber-400 text-amber-400" /> : rank}
                      </div>
                    </td>

                    {/* Song info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
                          {song.coverImage ? (
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                          >
                            <Play className={`w-4 h-4 text-white ${isCurrent && isPlaying ? 'hidden' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`} />
                          </div>
                        </div>
                        <div className="truncate">
                          <p
                            style={isCurrent ? { color: 'var(--color-accent)' } : undefined}
                            className={`font-bold text-sm truncate ${isCurrent ? '' : 'text-white group-hover:text-white transition-colors'}`}
                          >
                            {song.title}
                          </p>
                          <p className="text-[11px] text-white/45 truncate mt-0.5">
                            Album: {song.album || 'XuanKen Official'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Artist */}
                    <td className="py-3.5 px-4 font-medium text-white/75 truncate">
                      <ArtistNames artists={song.artists} linkClassName="text-white/75 hover:text-white" />
                    </td>

                    {/* Audio format */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase font-mono ${
                        song.audioFormat === 'WAV'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}>
                        {song.audioFormat}
                      </span>
                    </td>

                    {/* Weekly plays */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 font-bold text-amber-300 text-xs tabular-nums">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span><strong className="font-so text-sm">{song.weeklyPlaysCount}</strong> lượt</span>
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 text-center font-mono text-white/60 tabular-nums">
                      {formatDuration(song.duration)}
                    </td>

                    {/* Mua */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {isPurchased ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-bold text-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đã mua</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSongToBuy(song);
                            setIsDemoLimitModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs border border-amber-500/35 transition-colors shadow-sm active:scale-95 cursor-pointer"
                        >
                          Chưa mua
                        </button>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveMenuSongId(activeMenuSongId === song.id ? null : song.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4 mx-auto" />
                      </button>

                      {activeMenuSongId === song.id && (
                        <div
                          ref={activeMenuSongId === song.id ? menuRef : undefined}
                          className="absolute right-4 top-8 w-44 glass-panel rounded-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in duration-150"
                        >
                          <button
                            onClick={() => {
                              toggleLike(song.id);
                              setActiveMenuSongId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium cursor-pointer"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                            <span>{isLiked ? 'Bỏ thích' : 'Thả tim'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLrcSong(song);
                              setActiveMenuSongId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            <span>Xem lyric</span>
                          </button>

                          {playlists.some((p) => Array.isArray(p.songIds) && p.songIds.includes(song.id)) ? (
                            <button
                              onClick={() => {
                                openAddToPlaylistModal(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium text-emerald-400 cursor-pointer"
                              title="Bài hát đã có trong playlist"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-emerald-400 font-semibold">Đã thêm vào playlist</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                openAddToPlaylistModal(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium cursor-pointer"
                            >
                              <ListPlus className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                              <span>Thêm vào playlist</span>
                            </button>
                          )}

                          {isPurchased && (
                            <button
                              onClick={() => {
                                openDownloadModal(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium text-emerald-300 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tải về</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
