import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Heart,
  Headphones,
  CheckCircle,
  FileText,
  Crown,
  MoreVertical,
  Download,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  ListPlus,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ArtistNames } from '../common/ArtistNames';
import { formatArtistsString } from '../../utils/artistUtils';
import { useAutoScrollToSong } from '../../hooks/useAutoScrollToSong';

export const DesktopChartPage: React.FC = () => {
  const {
    songs,
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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isPlayMenuOpen, setIsPlayMenuOpen] = useState(false);
  const playMenuRef = useRef<HTMLDivElement | null>(null);
  const chartListRef = useRef<HTMLDivElement | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSongId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (!seconds || isNaN(seconds) || seconds <= 0) return '3:30';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Sort songs by highest playCount
  const rankedSongs = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));

  const totalSongs = rankedSongs.length;
  const totalPages = Math.max(1, Math.ceil(totalSongs / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const paginatedSongs = rankedSongs.slice(startIndex, startIndex + PAGE_SIZE);

  useAutoScrollToSong({
    containerRef: chartListRef,
    songId: currentSong?.id,
    enabled: true,
    viewKey: 'desktop-chart',
    paginatedList: rankedSongs,
    pageSize: PAGE_SIZE,
    currentPage: validCurrentPage,
    onPageChange: setCurrentPage,
    manualTrigger: scrollTrigger,
  });

  const handlePlayInOrder = () => {
    if (rankedSongs.length === 0) return;
    playCustomPool(rankedSongs, '#xuankenchart', false, rankedSongs[0]);
    setScrollTrigger((t) => t + 1);
    setIsPlayMenuOpen(false);
  };

  const handlePlayRandom = () => {
    if (rankedSongs.length === 0) return;
    playCustomPool(rankedSongs, '#xuankenchart', true);
    setScrollTrigger((t) => t + 1);
    setIsPlayMenuOpen(false);
  };

  const top3 = rankedSongs.slice(0, 3);

  return (
    <div className="space-y-7 pb-16 select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 font-display">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, var(--color-accent), #ec4899 52%, #38bdf8)',
              }}
            >
              #xuankenchart
            </span>
          </h1>

          {/* Play button with Play Order or Random popover */}
          <div className="relative" ref={playMenuRef}>
            <button
              onClick={() => setIsPlayMenuOpen(!isPlayMenuOpen)}
              disabled={rankedSongs.length === 0}
              className="w-10 h-10 rounded-full accent-glow-btn text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Phát nhạc #xuankenchart (Theo thứ tự hoặc Ngẫu nhiên)"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>

            {isPlayMenuOpen && (
              <div className="absolute left-0 top-12 w-56 glass-panel rounded-2xl p-2 z-50 animate-in zoom-in-95 duration-150 space-y-1">
                <button
                  onClick={handlePlayInOrder}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] text-left transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Phát theo thứ tự</p>
                    <p className="text-[10px] text-white/50">Phát từ Top 1 BXH</p>
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
                    <p className="text-[10px] text-white/50">Xáo trộn ngẫu nhiên BXH</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] self-start sm:self-auto">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
          <span>Bảng xếp hạng cập nhật theo thời gian thực (Lượt nghe cao nhất)</span>
        </div>
      </div>

      {/* Hero Visual Chart Spline Banner */}
      <div className="p-6 rounded-3xl glass-panel relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 15% 15%, color-mix(in srgb, var(--color-accent) 45%, transparent), transparent 70%), radial-gradient(ellipse 50% 45% at 85% 80%, rgba(56, 189, 248, 0.25), transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] text-white/55 uppercase tracking-wider font-bold">
              Bảng xếp hạng thời gian thực XuanKen Music
            </p>
            <p className="text-base font-extrabold text-white mt-0.5 font-display">
              Top 3 Ca Khúc Nghe Nhiều Nhất
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs flex-wrap">
            {top3.map((s, idx) => {
              const colors = ['#f59e0b', '#38bdf8', '#f43f5e'];
              return (
                <span key={s.id} className="flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-full bg-black/25 border border-white/[0.08]" style={{ color: colors[idx] }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx] }} />
                  <span className="font-so">#{idx + 1}</span> {s.title} ({formatArtistsString(s.artists)})
                </span>
              );
            })}
          </div>
        </div>

        {/* Dynamic Chart Visual Curves */}
        <div className="relative z-10 h-44 w-full pt-2">
          <svg className="w-full h-full" viewBox="0 0 600 130" preserveAspectRatio="none">
            <defs>
              <filter id="chartLineGlow" x="-10%" y="-20%" width="120%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="chartGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="chartGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="chartGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>

            <line x1="0" y1="28" x2="600" y2="28" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <line x1="0" y1="62" x2="600" y2="62" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <line x1="0" y1="96" x2="600" y2="96" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

            <path
              d="M 0,72 C 80,60 140,28 220,22 C 300,18 380,32 460,28 C 520,24 560,18 600,14"
              fill="none"
              stroke="url(#chartGrad1)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#chartLineGlow)"
            />
            <path
              d="M 0,88 C 80,82 140,65 220,58 C 300,52 380,56 460,60 C 520,62 560,60 600,59"
              fill="none"
              stroke="url(#chartGrad2)"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#chartLineGlow)"
            />
            <path
              d="M 0,108 C 80,105 140,100 220,95 C 300,88 380,96 460,102 C 520,106 560,104 600,98"
              fill="none"
              stroke="url(#chartGrad3)"
              strokeWidth="2.2"
              strokeLinecap="round"
              filter="url(#chartLineGlow)"
            />
          </svg>
        </div>
      </div>

      {/* Chart List Table */}
      <div ref={chartListRef} className="space-y-2">
        <div className="grid grid-cols-[80px_1fr_110px_110px_90px_110px_90px] gap-4 px-5 py-3 text-[11px] font-bold text-white/55 uppercase tracking-wider border border-white/[0.07] bg-white/[0.04] rounded-2xl">
          <span className="text-center whitespace-nowrap">Thứ hạng</span>
          <span className="whitespace-nowrap">Bài hát</span>
          <span className="text-center whitespace-nowrap">Định dạng</span>
          <span className="text-center whitespace-nowrap">Lượt nghe</span>
          <span className="text-center whitespace-nowrap">Thời lượng</span>
          <span className="text-center whitespace-nowrap">Mua</span>
          <span className="text-center whitespace-nowrap">Thêm</span>
        </div>

        {/* Songs Rows */}
        {paginatedSongs.length === 0 ? (
          <div className="py-16 text-center text-white/50 glass-panel rounded-2xl">
            <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-base font-bold text-white">Chưa có bài hát nào trên bảng xếp hạng #xuankenchart</p>
            <p className="text-xs text-white/50 mt-1">Hãy thêm bài hát từ trang Admin để hiển thị thứ hạng âm nhạc.</p>
          </div>
        ) : (
          paginatedSongs.map((song, index) => {
            const rank = startIndex + index + 1;
            const isLiked = likedSongIds.includes(song.id);
            const isCurrent = currentSong?.id === song.id;
            const isPurchased = isSongPurchased(song.id);

            const rankBadgeStyle =
              rank === 1
                ? 'text-[#f59e0b] border-amber-500/40 bg-amber-500/15'
                : rank === 2
                ? 'text-[#38bdf8] border-sky-500/40 bg-sky-500/15'
                : rank === 3
                ? 'text-[#f43f5e] border-rose-500/40 bg-rose-500/15'
                : 'text-white/45 border-white/[0.06] bg-white/[0.02]';

            return (
              <div
                key={song.id}
                data-song-id={song.id}
                onClick={() => playSong(song)}
                style={
                  isCurrent
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--color-accent) 45%, transparent)',
                      }
                    : undefined
                }
                className={`grid grid-cols-[80px_1fr_110px_110px_90px_110px_90px] gap-4 px-5 py-3.5 rounded-2xl border cursor-pointer group transition-all items-center ${
                  isCurrent
                    ? 'shadow-xl'
                    : 'bg-white/[0.025] hover:bg-white/[0.07] border-white/[0.06] hover:border-white/15'
                }`}
              >
                {/* Rank column */}
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-sm shadow-sm font-so tabular-nums ${rankBadgeStyle}`}
                  >
                    {rank === 1 ? <Crown className="w-4 h-4 fill-amber-400 text-amber-400" /> : rank}
                  </div>
                  <div className="text-[10px]">
                    {song.rankChange === 'up' ? (
                      <div className="flex items-center text-emerald-400 font-bold">
                        <ArrowUp className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : song.rankChange === 'down' ? (
                      <div className="flex items-center text-red-400 font-bold">
                        <ArrowDown className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <Minus className="w-3 h-3 text-white/30" />
                    )}
                  </div>
                </div>

                {/* Song info & Cover */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-zinc-950/90 flex items-center justify-center">
                    {song.coverImage ? (
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
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
                    <div className="flex items-center gap-2">
                      <p
                        style={isCurrent ? { color: 'var(--color-accent)' } : undefined}
                        className={`text-sm font-bold truncate ${isCurrent ? '' : 'text-white group-hover:text-white transition-colors'}`}
                      >
                        {song.title}
                      </p>
                      {rank <= 3 && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                            color: 'var(--color-accent)',
                            borderColor: 'color-mix(in srgb, var(--color-accent) 35%, transparent)',
                          }}
                        >
                          TOP {rank}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/60 truncate mt-0.5">
                      <ArtistNames artists={song.artists} linkClassName="text-white/60 hover:text-white" />
                    </div>
                  </div>
                </div>

                {/* Audio format badge */}
                <div className="flex items-center justify-center">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider font-mono ${
                      song.audioFormat === 'WAV'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {song.audioFormat}
                  </span>
                </div>

                {/* Real Play Count */}
                <div className="text-center">
                  <span className="text-xs font-mono font-bold text-emerald-400 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 tabular-nums">
                    <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                    {(song.playCount || 0).toLocaleString('vi-VN')}
                  </span>
                </div>

                {/* Duration */}
                <div className="text-center text-xs font-mono font-bold text-white/65 tabular-nums">
                  {formatDuration(song.duration)}
                </div>

                {/* MUA Column */}
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  {isPurchased ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1 shrink-0 whitespace-nowrap">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="whitespace-nowrap">Đã mua</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSongToBuy(song);
                        setIsDemoLimitModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs border border-amber-500/35 transition-colors shadow-sm shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
                      title="Bấm để mua bản quyền"
                    >
                      Chưa mua
                    </button>
                  )}
                </div>

                {/* THAO TÁC Column */}
                <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setActiveMenuSongId(activeMenuSongId === song.id ? null : song.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeMenuSongId === song.id
                        ? 'bg-white/20 text-white'
                        : 'hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                    title="Thao tác bài hát"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuSongId === song.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 w-44 glass-panel rounded-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in duration-150"
                    >
                      <button
                        onClick={() => {
                          toggleLike(song.id);
                          setActiveMenuSongId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                        <span>{isLiked ? 'Bỏ thích' : 'Thả tim'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLrcSong(song);
                          setActiveMenuSongId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors cursor-pointer"
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium text-emerald-400 transition-colors cursor-pointer"
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors cursor-pointer"
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium text-emerald-300 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tải nhạc về</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border border-white/[0.08] bg-white/[0.03] rounded-2xl mt-4">
            <p className="text-xs text-white/50 tabular-nums">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, totalSongs)} trong tổng số {totalSongs} bài hát (20 bài/trang)
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={validCurrentPage === pageNum ? { backgroundColor: 'var(--color-accent)' } : undefined}
                  className={`w-7 h-7 rounded-lg text-xs font-bold tabular-nums transition-all cursor-pointer ${
                    validCurrentPage === pageNum
                      ? 'text-white shadow'
                      : 'border border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
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
