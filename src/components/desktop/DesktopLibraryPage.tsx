import React, { useState } from 'react';
import { Play, Heart, Shuffle, Music, History, Plus } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const DesktopLibraryPage: React.FC = () => {
  const {
    songs,
    likedSongIds,
    toggleLike,
    playSong,
    history,
    toggleShuffle,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'liked' | 'history'>('liked');

  const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayLiked = () => {
    if (likedSongs.length > 0) {
      playSong(likedSongs[0]);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">Thư Viện Cá Nhân</h1>
          <button
            onClick={handlePlayLiked}
            disabled={likedSongs.length === 0}
            className="w-10 h-10 rounded-full bg-[#9b4de0] hover:bg-[#8539c9] text-white flex items-center justify-center shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95 disabled:opacity-40"
            title="Phát tất cả"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 bg-white/10 rounded-full">
          <button
            onClick={() => setActiveTab('liked')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'liked'
                ? 'bg-[#9b4de0] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Yêu thích ({likedSongs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'history'
                ? 'bg-[#9b4de0] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Lịch sử ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'liked' ? (
        <div>
          {likedSongs.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40 mb-3">
                <Heart className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-white">Chưa có bài hát yêu thích</p>
              <p className="text-xs text-white/50 mt-1">
                Hãy thả tim cho các bài hát bạn thích để thưởng thức lại ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5">
                <span className="w-12 text-center">#</span>
                <span className="flex-1">Bài hát</span>
                <span className="hidden md:block w-48">Album</span>
                <span className="w-20 text-right">Thời lượng</span>
              </div>

              {likedSongs.map((song, idx) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className="flex items-center px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer group transition-colors select-none"
                >
                  <span className="w-12 text-center text-xs text-white/40 group-hover:text-white">
                    {idx + 1}
                  </span>

                  <div className="flex-1 flex items-center gap-3 truncate pr-4">
                    <div
                      className={`w-11 h-11 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shrink-0 relative shadow-md`}
                    >
                      <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-[#c273ed] transition-colors">
                        {song.title}
                      </p>
                      <p className="text-xs text-white/50 truncate hover:text-white mt-0.5">
                        {song.artists}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block w-48 text-xs text-white/40 truncate">
                    {song.album}
                  </div>

                  <div className="w-20 flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song.id);
                      }}
                      className="p-1 text-red-500 hover:text-white transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                    <span className="text-xs text-white/40 tabular-nums">
                      {formatDuration(song.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* History View */
        <div>
          {history.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40 mb-3">
                <History className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-white">Chưa có bài hát đã nghe</p>
              <p className="text-xs text-white/50 mt-1">
                Các bài hát bạn đã nghe sẽ được lưu lại tự động
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((song, idx) => (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => playSong(song)}
                  className="flex items-center px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer group transition-colors select-none"
                >
                  <span className="w-12 text-center text-xs text-white/40 group-hover:text-white">
                    {idx + 1}
                  </span>

                  <div className="flex-1 flex items-center gap-3 truncate pr-4">
                    <div
                      className={`w-11 h-11 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shrink-0 relative shadow-md`}
                    >
                      <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-[#c273ed] transition-colors">
                        {song.title}
                      </p>
                      <p className="text-xs text-white/50 truncate hover:text-white mt-0.5">
                        {song.artists}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block w-48 text-xs text-white/40 truncate">
                    {song.album}
                  </div>

                  <div className="w-20 text-right text-xs text-white/40 tabular-nums">
                    {formatDuration(song.duration)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
