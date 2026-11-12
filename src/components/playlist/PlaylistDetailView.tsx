import React from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Shuffle,
  Trash2,
  Heart,
  Music2,
  Clock,
  Disc3,
  X,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Playlist, Song } from '../../types/music';
import { ArtistNames } from '../common/ArtistNames';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onBack: () => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({ playlist, onBack }) => {
  const {
    allSearchableSongs,
    songs,
    currentSong,
    isPlaying,
    togglePlay,
    playCustomPool,
    playPlaylist,
    removeSongFromPlaylist,
    deletePlaylist,
    likedSongIds,
    toggleLike,
    isShuffle,
  } = useMusic();

  const pool = allSearchableSongs && allSearchableSongs.length > 0 ? allSearchableSongs : songs;
  const songIds = Array.isArray(playlist.songIds) ? playlist.songIds : [];

  // Map playlist songIds to Song objects
  const playlistSongs: Song[] = songIds
    .map((id) => pool.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  const totalDurationSecs = playlistSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Math.floor(totalDurationSecs / 3600);
  const totalMins = Math.floor((totalDurationSecs % 3600) / 60);
  const durationText =
    totalHours > 0 ? `${totalHours} giờ ${totalMins} phút` : `${totalMins} phút`;

  const isCurrentPlaylistActive = playlistSongs.some((s) => s.id === currentSong?.id);
  const isSpinning = isPlaying && isCurrentPlaylistActive;
  const isPlaylistShuffleActive = isCurrentPlaylistActive && isShuffle;

  const displayCover =
    (isCurrentPlaylistActive && currentSong?.coverImage) ||
    playlistSongs[0]?.coverImage ||
    playlist.coverImage ||
    'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png';

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlaySongInPlaylist = (song: Song) => {
    playCustomPool(playlistSongs, playlist.name, false, song);
  };

  return (
    <div className="w-full max-w-full space-y-6 pb-24 select-none font-['Roboto_Condensed'] animate-in fade-in duration-200">
      {/* Top Bar: Back Button */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 w-full">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách Playlist</span>
        </button>

        <button
          onClick={() => {
            if (confirm(`Bạn có chắc chắn muốn xóa playlist "${playlist.name}"?`)) {
              deletePlaylist(playlist.id);
              onBack();
            }
          }}
          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Xóa playlist này"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xóa Playlist</span>
        </button>
      </div>

      {/* Playlist Detail Layout - Matched with CuratedAlbumsView */}
      <div className="w-full max-w-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
        {/* CỘT TRÁI: Đĩa tròn xoay 360 độ + Thông tin + Nút điều khiển */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-4 flex flex-col items-center text-center self-start">
          <div
            className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)] border-4 border-white/20 select-none group shrink-0"
            style={{
              animation: 'spin 20s linear infinite',
              animationPlayState: isSpinning ? 'running' : 'paused',
            }}
          >
            <img
              src={displayCover}
              alt={playlist.name}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.currentTarget.src = 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png';
              }}
            />
          </div>

          {/* Thông tin Playlist */}
          <div className="mt-4 w-full px-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Playlist Riêng
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase line-clamp-2 mt-2">
              {playlist.name}
            </h1>
            <p className="text-xs text-white/50 mt-1">
              {playlist.description || 'Danh sách phát cá nhân của bạn trên XuanKen Music'}
            </p>
            <p className="text-xs text-white/50 mt-1.5 font-medium">
              {playlistSongs.length} bài hát • {durationText}
            </p>

            {/* Nút Tiếp Tục Phát / Phát Tất Cả */}
            <div className="flex flex-col items-center gap-3 mt-4">
              <button
                disabled={playlistSongs.length === 0}
                onClick={() => {
                  if (playlistSongs.length === 0) return;
                  if (isCurrentPlaylistActive) {
                    togglePlay();
                  } else {
                    playPlaylist(playlist, 'order');
                  }
                }}
                style={{ backgroundColor: 'var(--color-accent)' }}
                className="w-full max-w-[220px] py-2.5 px-6 rounded-full hover:opacity-90 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-40"
              >
                {isSpinning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>TẠM DỪNG</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>{isCurrentPlaylistActive ? 'TIẾP TỤC PHÁT' : 'PHÁT TẤT CẢ'}</span>
                  </>
                )}
              </button>

              {/* Nút Random sáng đèn */}
              <button
                disabled={playlistSongs.length === 0}
                onClick={() => {
                  if (playlistSongs.length === 0) return;
                  playPlaylist(playlist, 'shuffle');
                }}
                style={
                  isPlaylistShuffleActive
                    ? {
                        backgroundColor: 'var(--color-accent)',
                        color: '#ffffff',
                        boxShadow: '0 0 12px var(--color-accent)',
                      }
                    : undefined
                }
                className={`py-2 px-5 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 ${
                  isPlaylistShuffleActive
                    ? 'ring-2 ring-white/60 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                }`}
                title={isPlaylistShuffleActive ? 'Đang bật random trong playlist này' : 'Phát ngẫu nhiên trong playlist này'}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>PHÁT NGẪU NHIÊN</span>
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Danh sách bài hát */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xs relative overflow-hidden">
            {/* Header bảng */}
            <div className="flex items-center px-3 sm:px-4 py-2.5 text-xs font-bold text-white/50 border-b border-white/10 uppercase tracking-wider select-none">
              <div className="w-8 sm:w-10 text-center shrink-0 text-white/40">#</div>
              <div className="flex-1 min-w-0 pl-3 sm:pl-4 text-left">BÀI HÁT</div>
              <div className="hidden sm:flex w-20 items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="w-16 sm:w-20 text-center shrink-0">BỎ KHỎI DS</div>
            </div>

            {/* Danh sách bài hát */}
            {playlistSongs.length === 0 ? (
              <div className="p-12 text-center text-white/50 text-xs space-y-2">
                <Music2 className="w-10 h-10 text-white/20 mx-auto" />
                <p>Chưa có bài hát nào trong playlist này.</p>
                <p className="text-[11px] text-white/40">
                  Hãy nhấn vào biểu tượng <span className="text-[#c273ed] font-bold">Thêm vào playlist</span> ở bất kỳ bài hát nào để thêm vào đây.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {playlistSongs.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isPlayingThis = isCurrent && isPlaying;
                  const isLiked = likedSongIds.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySongInPlaylist(song)}
                      className={`w-full relative flex items-center px-2 sm:px-4 py-2.5 transition-all cursor-pointer group ${
                        isCurrent
                          ? 'bg-purple-600/25 border-l-2 border-[#c273ed]'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {/* STT */}
                      <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                        {isPlayingThis ? (
                          <div className="flex items-end justify-center gap-0.5 h-3.5">
                            <span className="w-0.5 h-3.5 bg-pink-400 animate-pulse" />
                            <span className="w-0.5 h-2 bg-pink-400 animate-pulse delay-100" />
                            <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-200" />
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-bold text-white/50 group-hover:hidden font-so">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCurrent) {
                                  togglePlay();
                                } else {
                                  handlePlaySongInPlaylist(song);
                                }
                              }}
                              className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white hover:bg-pink-600 transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0 flex items-center gap-3 pl-3 sm:pl-4 pr-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                          <img
                            src={song.coverImage || playlist.coverImage}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.src = playlist.coverImage || 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-pink-400' : 'text-white group-hover:text-pink-300'}`}>
                            {song.title}
                          </p>
                          <div className="text-[11px] text-white/50 truncate mt-0.5">
                            <ArtistNames artists={song.artists} linkClassName="text-white/50 hover:text-purple-300" />
                          </div>
                        </div>
                      </div>

                      {/* Thời lượng */}
                      <div className="hidden sm:flex w-20 items-center justify-center shrink-0 text-xs font-mono text-white/50">
                        {formatSeconds(song.duration || 0)}
                      </div>

                      {/* Thao tác: Bỏ khỏi playlist */}
                      <div className="w-16 sm:w-20 flex items-center justify-center shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleLike(song.id)}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            isLiked ? 'text-rose-500' : 'text-white/30 hover:text-rose-400'
                          }`}
                          title={isLiked ? 'Bỏ thích' : 'Thích bài hát'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                          className="p-1.5 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                          title="Bỏ bài hát khỏi playlist này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
