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
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

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
  } = useMusic();

  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSongId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handlePlayAll = () => {
    if (rankedSongs.length > 0) {
      playSong(rankedSongs[0]);
    }
  };

  const top3 = rankedSongs.slice(0, 3);

  return (
    <div className="space-y-8 pb-16 select-none">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-[#9b4de0] via-[#c273ed] to-[#38ef7d] bg-clip-text text-transparent font-['Roboto_Condensed']">
              #xuankenchart
            </span>
          </h1>
          <button
            onClick={handlePlayAll}
            disabled={rankedSongs.length === 0}
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-40 hover:opacity-90"
            title="Phát tất cả theo thứ hạng"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <TrendingUp className="w-4 h-4 text-[#c273ed]" />
          <span>Bảng xếp hạng cập nhật theo thời gian thực (Lượt nghe cao nhất)</span>
        </div>
      </div>

      {/* Hero Visual Chart Spline Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#23143c] via-[#1a0e2d] to-[#120822] border border-[#9b4de0]/20 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">
              Bảng xếp hạng thời gian thực XuanKen Music
            </p>
            <p className="text-sm font-bold text-white mt-0.5">
              Top 3 Ca Khúc Nghe Nhiều Nhất
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            {top3.map((s, idx) => {
              const colors = ['#f59e0b', '#38bdf8', '#f43f5e'];
              return (
                <span key={s.id} className="flex items-center gap-1.5 font-semibold" style={{ color: colors[idx] }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx] }} />
                  #{idx + 1} {s.title} ({s.artists})
                </span>
              );
            })}
          </div>
        </div>

        {/* Dynamic Chart Visual Curves (Item 4: tỉ lệ đường cong chuẩn nhất theo BXH thực tế) */}
        <div className="h-44 w-full relative pt-2">
          <svg className="w-full h-full" viewBox="0 0 600 130" preserveAspectRatio="none">
            <defs>
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

            {/* Subtle Horizontal Reference Guidelines */}
            <line x1="0" y1="28" x2="600" y2="28" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1="0" y1="62" x2="600" y2="62" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1="0" y1="96" x2="600" y2="96" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

            {/* #1 Top Song (Orange/Amber) */}
            <path
              d="M 0,72 C 80,60 140,28 220,22 C 300,18 380,32 460,28 C 520,24 560,18 600,14"
              fill="none"
              stroke="url(#chartGrad1)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* #2 Second Song (Sky Blue) */}
            <path
              d="M 0,88 C 80,82 140,65 220,58 C 300,52 380,56 460,60 C 520,62 560,60 600,59"
              fill="none"
              stroke="url(#chartGrad2)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* #3 Third Song (Rose Pink) */}
            <path
              d="M 0,108 C 80,105 140,100 220,95 C 300,88 380,96 460,102 C 520,106 560,104 600,98"
              fill="none"
              stroke="url(#chartGrad3)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Chart List Table (Requirement 8: bỏ chữ trạng thái đi để MUA, bên cạnh ghi THAO TÁC) */}
      <div className="space-y-2">
        <div className="grid grid-cols-[64px_1fr_110px_110px_90px_110px_80px] gap-4 px-5 py-3 text-xs font-bold text-white/50 uppercase tracking-wider border-b border-white/10 bg-white/5 rounded-xl">
          <span className="text-center">Thứ hạng</span>
          <span>Bài hát</span>
          <span className="text-center">Định dạng</span>
          <span className="text-center">Lượt nghe</span>
          <span className="text-center">Thời lượng</span>
          <span className="text-center">Mua</span>
          <span className="text-center">Thao tác</span>
        </div>

        {/* Songs Rows */}
        {paginatedSongs.length === 0 ? (
          <div className="py-16 text-center text-white/50 bg-white/5 rounded-2xl border border-white/5">
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
                ? 'text-[#f59e0b] border-amber-500/40 bg-amber-500/10'
                : rank === 2
                ? 'text-[#38bdf8] border-sky-500/40 bg-sky-500/10'
                : rank === 3
                ? 'text-[#f43f5e] border-rose-500/40 bg-rose-500/10'
                : 'text-white/40 border-transparent';

            return (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className={`grid grid-cols-[64px_1fr_110px_110px_90px_110px_80px] gap-4 px-5 py-3.5 rounded-2xl border cursor-pointer group transition-all items-center ${
                  isCurrent
                    ? 'bg-purple-900/40 border-purple-500/50 shadow-xl'
                    : 'bg-white/[0.02] hover:bg-white/[0.08] border-white/5 hover:border-white/15'
                }`}
              >
                {/* Rank column */}
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-sm shadow-sm ${rankBadgeStyle}`}
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
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-zinc-900">
                    {song.coverImage ? (
                      <img
                        src={song.coverImage}
                        alt={song.title}
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
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold truncate ${isCurrent ? 'text-[#c273ed]' : 'text-white group-hover:text-[#c273ed] transition-colors'}`}>
                        {song.title}
                      </p>
                      {rank <= 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/20 text-[#c273ed] border border-purple-500/30 shrink-0">
                          TOP {rank}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 truncate mt-0.5">
                      {song.artists}
                    </p>
                  </div>
                </div>

                {/* Audio format badge */}
                <div className="flex items-center justify-center">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      song.audioFormat === 'WAV'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {song.audioFormat}
                  </span>
                </div>

                {/* Real Play Count */}
                <div className="text-center">
                  <span className="text-xs font-mono font-bold text-emerald-400 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                    {(song.playCount || 0).toLocaleString('vi-VN')}
                  </span>
                </div>

                {/* Duration */}
                <div className="text-center text-xs font-mono font-bold text-white/70 tabular-nums">
                  {formatDuration(song.duration)}
                </div>

                {/* MUA Column (Requirement 8) */}
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  {isPurchased ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1 shrink-0 whitespace-nowrap">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="whitespace-nowrap">Đã mua</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSongToBuy(song);
                        setIsDemoLimitModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs border border-amber-500/40 transition-colors shadow-sm shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
                      title="Bấm để mua bản quyền"
                    >
                      Chưa mua
                    </button>
                  )}
                </div>

                {/* THAO TÁC Column (Requirement 8) */}
                <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setActiveMenuSongId(activeMenuSongId === song.id ? null : song.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      activeMenuSongId === song.id
                        ? 'bg-white/20 text-white'
                        : 'hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                    title="Thao tác bài hát"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuSongId === song.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 w-44 rounded-2xl bg-[#231b2e] border border-white/15 shadow-2xl p-1.5 z-50 text-xs text-white space-y-1 animate-in fade-in duration-150"
                    >
                      <button
                        onClick={() => {
                          toggleLike(song.id);
                          setActiveMenuSongId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                        <span>{isLiked ? 'Bỏ thích' : 'Thả tim'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLrcSong(song);
                          setActiveMenuSongId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>Xem lyric</span>
                      </button>
                      {isPurchased && (
                        <button
                          onClick={() => {
                            openDownloadModal(song);
                            setActiveMenuSongId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium text-emerald-300 transition-colors"
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

        {/* Requirement 21: Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-white/[0.02] rounded-xl mt-4">
            <p className="text-xs text-white/50">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, totalSongs)} trong tổng số {totalSongs} bài hát (20 bài/trang)
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
