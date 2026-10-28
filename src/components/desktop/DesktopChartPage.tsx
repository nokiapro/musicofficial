import React from 'react';
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
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song } from '../../types/music';

export const DesktopChartPage: React.FC = () => {
  const {
    songs,
    playSong,
    likedSongIds,
    toggleLike,
    isSongPurchased,
    setSongToBuy,
    setIsBuyModalOpen,
    setSelectedLrcSong,
    currentSong,
    isPlaying,
  } = useMusic();

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '3:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Requirement 5: Sort songs by highest playCount (nghe nhiều nhất)
  const rankedSongs = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));

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
              Top 3 Ca Khúc Được Nghe Nhiều Nhất
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

        {/* Dynamic Chart Visual Curves */}
        <div className="h-40 w-full relative">
          <svg className="w-full h-full" viewBox="0 0 600 130" preserveAspectRatio="none">
            <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="65" x2="600" y2="65" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.06)" />

            {/* Song #1 curve */}
            <path
              d="M 0,65 Q 80,35 150,22 T 300,15 T 450,28 T 600,12"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.5"
            />
            {/* Song #2 curve */}
            <path
              d="M 0,85 Q 90,75 150,68 T 300,50 T 450,48 T 600,55"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            {/* Song #3 curve */}
            <path
              d="M 0,105 Q 80,95 150,100 T 300,85 T 450,90 T 600,95"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Chart List Table */}
      <div className="space-y-2">
        {/* Table Header with evenly spaced CSS grid */}
        <div className="grid grid-cols-[64px_1fr_140px_110px_90px_180px] gap-4 px-5 py-3 text-xs font-bold text-white/50 uppercase tracking-wider border-b border-white/10 bg-white/5 rounded-xl">
          <span className="text-center">Thứ hạng</span>
          <span>Bài hát</span>
          <span className="text-center">Định dạng</span>
          <span className="text-center">Lượt nghe</span>
          <span className="text-center">Thời lượng</span>
          <span className="text-right pr-2">Thao tác</span>
        </div>

        {/* Songs Rows */}
        {rankedSongs.length === 0 ? (
          <div className="py-16 text-center text-white/50 bg-white/5 rounded-2xl border border-white/5">
            <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-base font-bold text-white">Chưa có bài hát nào trên bảng xếp hạng #xuankenchart</p>
            <p className="text-xs text-white/50 mt-1">Hãy thêm bài hát từ trang Admin để hiển thị thứ hạng âm nhạc.</p>
          </div>
        ) : (
          rankedSongs.map((song, index) => {
            const rank = index + 1;
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
                className={`grid grid-cols-[64px_1fr_140px_110px_90px_180px] gap-4 px-5 py-3.5 rounded-2xl border cursor-pointer group transition-all items-center ${
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
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      song.audioFormat === 'WAV'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {song.audioFormat} {song.audioFormat === 'WAV' ? 'Lossless' : '320kbps'}
                  </span>
                </div>

                {/* Real Play Count (Lượt nghe) */}
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

                {/* Actions: Buy / Owned / Lyrics */}
                <div className="flex items-center justify-end gap-2 pr-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleLike(song.id)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
                    title={isLiked ? 'Bỏ thích' : 'Yêu thích'}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => setSelectedLrcSong(song)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-[#c273ed] transition-colors"
                    title="Xem lời LRC"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {isPurchased ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Đã mua
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSongToBuy(song);
                        setIsBuyModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs border border-amber-500/40 transition-colors shadow-sm shrink-0 whitespace-nowrap"
                    >
                      Mua ({(song.price ?? 20000).toLocaleString('vi-VN')}đ)
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
