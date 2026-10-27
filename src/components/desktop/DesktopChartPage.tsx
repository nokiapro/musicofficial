import React from 'react';
import {
  Play,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Heart,
  MoreHorizontal,
  Clock3,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { SONGS_DATABASE } from '../../data/songs';

export const DesktopChartPage: React.FC = () => {
  const { songs, playSong, likedSongIds, toggleLike } = useMusic();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0]);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="bg-gradient-to-r from-[#4a90e2] via-[#50e3c2] to-[#e35050] bg-clip-text text-transparent">
            #zingchart
          </span>
        </h1>
        <button
          onClick={handlePlayAll}
          className="w-10 h-10 rounded-full bg-[#9b4de0] hover:bg-[#8539c9] text-white flex items-center justify-center shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
          title="Phát tất cả"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* Hero Visual Chart Spline Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#23143c] via-[#1a0e2d] to-[#120822] border border-[#9b4de0]/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">
              Bảng xếp hạng thời gian thực (Cập nhật mỗi giờ)
            </p>
            <p className="text-sm font-bold text-white mt-0.5">Top 3 Ca Khúc Dẫn Đầu Hôm Nay</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[#4a90e2] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4a90e2]" /> Sơn Tùng M-TP
            </span>
            <span className="flex items-center gap-1.5 text-[#50e3c2] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#50e3c2]" /> Bích Phương
            </span>
            <span className="flex items-center gap-1.5 text-[#e35050] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e35050]" /> Vũ.
            </span>
          </div>
        </div>

        {/* Dynamic Chart SVG */}
        <div className="h-44 w-full">
          <svg className="w-full h-full" viewBox="0 0 600 140" preserveAspectRatio="none">
            <line x1="0" y1="35" x2="600" y2="35" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="70" x2="600" y2="70" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="105" x2="600" y2="105" stroke="rgba(255,255,255,0.06)" />

            {/* Song 1 */}
            <path
              d="M 0,70 Q 80,45 150,30 T 300,20 T 450,40 T 600,15"
              fill="none"
              stroke="#4a90e2"
              strokeWidth="3"
            />
            {/* Song 2 */}
            <path
              d="M 0,90 Q 90,80 150,75 T 300,60 T 450,55 T 600,65"
              fill="none"
              stroke="#50e3c2"
              strokeWidth="2.5"
            />
            {/* Song 3 */}
            <path
              d="M 0,110 Q 80,105 150,110 T 300,95 T 450,100 T 600,105"
              fill="none"
              stroke="#e35050"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Chart List Table */}
      <div className="space-y-1">
        {/* Table Header */}
        <div className="flex items-center px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5">
          <span className="w-16">Thứ hạng</span>
          <span className="flex-1">Bài hát</span>
          <span className="hidden md:block w-48">Album</span>
          <span className="hidden sm:block w-28 text-right">Lượt nghe</span>
          <span className="w-20 text-right">Thời lượng</span>
        </div>

        {/* Songs Rows */}
        {songs.length === 0 ? (
          <div className="py-16 text-center text-white/50 bg-white/5 rounded-2xl border border-white/5">
            <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-base font-bold text-white">Chưa có bài hát nào trên bảng xếp hạng</p>
            <p className="text-xs text-white/50 mt-1">Dữ liệu demo đã xóa. Hãy thêm bài hát mới từ trang Admin.</p>
          </div>
        ) : (
          songs.map((song, index) => {
            const rank = index + 1;
            const isLiked = likedSongIds.includes(song.id);

            const rankColor =
              rank === 1
                ? 'text-[#4a90e2]'
                : rank === 2
                ? 'text-[#50e3c2]'
                : rank === 3
                ? 'text-[#e35050]'
                : 'text-white/40';

            return (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              className="flex items-center px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer group transition-colors select-none"
            >
              {/* Rank column with movement indicator */}
              <div className="w-16 flex items-center gap-1.5 shrink-0">
                <span className={`text-xl font-black font-['Space_Grotesk'] w-6 text-center ${rankColor}`}>
                  {rank}
                </span>

                <div className="text-[10px]">
                  {song.rankChange === 'up' ? (
                    <div className="flex items-center text-emerald-400 font-bold">
                      <ArrowUp className="w-3 h-3 stroke-[3]" />
                      <span>{song.rankChangeValue}</span>
                    </div>
                  ) : song.rankChange === 'down' ? (
                    <div className="flex items-center text-red-400 font-bold">
                      <ArrowDown className="w-3 h-3 stroke-[3]" />
                      <span>{song.rankChangeValue}</span>
                    </div>
                  ) : (
                    <Minus className="w-3 h-3 text-white/30" />
                  )}
                </div>
              </div>

              {/* Song info: Cover + Title + Artist */}
              <div className="flex-1 flex items-center gap-3 truncate pr-4">
                <div
                  className={`w-11 h-11 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shrink-0 relative shadow-md`}
                >
                  <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#c273ed] transition-colors">
                      {song.title}
                    </p>
                    <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-white/10 text-white">
                      {song.audioFormat}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate hover:text-white mt-0.5">
                    {song.artists}
                  </p>
                </div>
              </div>

              {/* Album name */}
              <div className="hidden md:block w-48 text-xs text-white/40 truncate">
                {song.album}
              </div>

              {/* Plays count */}
              <div className="hidden sm:block w-28 text-right text-xs text-white/50 font-medium tabular-nums">
                {song.plays}
              </div>

              {/* Duration + Actions */}
              <div className="w-20 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(song.id);
                  }}
                  className="p-1 text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked ? 'text-red-500 fill-red-500 !opacity-100' : ''
                    }`}
                  />
                </button>
                <span className="text-xs text-white/40 tabular-nums">
                  {formatDuration(song.duration)}
                </span>
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
};
