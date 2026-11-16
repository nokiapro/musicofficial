import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  Music2,
  Clock,
  X,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Playlist, Song } from '../../types/music';
import { ArtistNames } from '../common/ArtistNames';
import { useAutoScrollToSong } from '../../hooks/useAutoScrollToSong';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onBack?: () => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({ playlist }) => {
  const {
    allSearchableSongs,
    songs,
    currentSong,
    isPlaying,
    togglePlay,
    playCustomPool,
    playPlaylist,
    removeSongFromPlaylist,
    likedSongIds,
    toggleLike,
    isShuffle,
  } = useMusic();

  const pool = allSearchableSongs && allSearchableSongs.length > 0 ? allSearchableSongs : songs;
  const songIds = Array.isArray(playlist.songIds) ? playlist.songIds : [];

  // Map playlist songIds to unique Song objects sorted alphabetically (A-Z)
  const uniqueMap = new Map<string, Song>();
  songIds.forEach((id) => {
    const found = pool.find((s) => s.id === id);
    if (found && !uniqueMap.has(found.id)) {
      uniqueMap.set(found.id, found);
    }
  });
  const playlistSongs: Song[] = Array.from(uniqueMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
  );

  const playlistSongsListRef = useRef<HTMLDivElement | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  useAutoScrollToSong({
    containerRef: playlistSongsListRef,
    songId: currentSong?.id,
    enabled: true,
    viewKey: playlist.id,
    manualTrigger: scrollTrigger,
    itemCount: playlistSongs.length,
  });

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
    <div className="w-full max-w-full space-y-6 pb-24 select-none animate-in fade-in duration-200">
      {/* Playlist Detail Layout - Matched with CuratedAlbumsView */}
      <div className="w-full max-w-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
        {/* CỘT TRÁI: Đĩa tròn xoay 360 độ + Thông tin + Nút điều khiển */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-4 flex flex-col items-center text-center self-start">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-full blur-2xl pointer-events-none transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 55%, transparent) 0%, transparent 72%)',
                opacity: isSpinning ? 0.65 : 0.35,
              }}
            />
            <div
              className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.65)] ring-4 ring-white/15 select-none group shrink-0"
              style={{
                animation: 'spin 20s linear infinite',
                animationPlayState: isSpinning ? 'running' : 'paused',
              }}
            >
              <img
                src={displayCover}
                alt={playlist.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.src = 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png';
                }}
              />
            </div>
          </div>

          {/* Thông tin Playlist */}
          <div className="mt-5 w-full px-2">
            <p style={{ color: 'var(--color-accent)' }} className="text-[11px] font-bold uppercase tracking-wider">
              Playlist Riêng
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight line-clamp-2 mt-1">
              {playlist.name}
            </h1>
            <p className="text-xs text-white/55 mt-1">
              {playlist.description || 'Danh sách phát cá nhân của bạn trên XuanKen Music'}
            </p>
            <p className="text-xs text-white/55 mt-1.5 font-medium tabular-nums">
              {playlistSongs.length} bài hát · {durationText}
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
                className="accent-glow-btn w-full max-w-[220px] py-2.5 px-6 rounded-full active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
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
                  setScrollTrigger((t) => t + 1);
                }}
                className={`py-2 px-5 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 ${
                  isPlaylistShuffleActive
                    ? 'accent-glow-btn ring-2 ring-white/50 text-white'
                    : 'bg-white/[0.08] border border-white/10 hover:bg-white/[0.16] text-white/75 hover:text-white'
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
          <div className="glass-panel w-full rounded-2xl relative overflow-hidden">
            {/* Header bảng */}
            <div className="flex items-center px-3 sm:px-4 py-3 text-xs font-bold text-white/50 border-b border-white/[0.08] uppercase tracking-wider select-none">
              <div className="w-8 sm:w-10 text-center shrink-0 text-white/40">#</div>
              <div className="flex-1 min-w-0 pl-3 sm:pl-4 text-left">BÀI HÁT</div>
              <div className="hidden sm:flex w-20 items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="w-16 sm:w-20 text-center shrink-0">BỎ KHỎI DS</div>
            </div>

            {/* Danh sách bài hát */}
            {playlistSongs.length === 0 ? (
              <div className="p-12 text-center text-white/55 text-xs space-y-2">
                <Music2 className="w-10 h-10 text-white/20 mx-auto" />
                <p>Chưa có bài hát nào trong playlist này.</p>
                <p className="text-[11px] text-white/45">
                  Hãy nhấn vào biểu tượng <span style={{ color: 'var(--color-accent)' }} className="font-bold">Thêm vào playlist</span> ở bất kỳ bài hát nào để thêm vào đây.
                </p>
              </div>
            ) : (
              <div ref={playlistSongsListRef} className="divide-y divide-white/[0.05]">
                {playlistSongs.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isPlayingThis = isCurrent && isPlaying;
                  const isLiked = likedSongIds.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      data-song-id={song.id}
                      onClick={() => handlePlaySongInPlaylist(song)}
                      style={
                        isCurrent
                          ? {
                              backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 32%, transparent)',
                            }
                          : undefined
                      }
                      className={`w-full relative flex items-center px-2.5 sm:px-4 py-2.5 transition-all cursor-pointer group ${
                        isCurrent ? '' : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      {/* STT */}
                      <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                        {isPlayingThis ? (
                          <div className="flex items-end justify-center gap-0.5 h-4">
                            <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-1" />
                            <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-2" />
                            <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-3" />
                          </div>
                        ) : (
                          <>
                            <span className="text-xs sm:text-sm font-bold text-white/45 group-hover:hidden font-mono tabular-nums">
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
                              style={{ backgroundColor: 'var(--color-accent)' }}
                              className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0 flex items-center gap-3 pl-3 sm:pl-4 pr-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-sm">
                          <img
                            src={song.coverImage || playlist.coverImage}
                            alt={song.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = playlist.coverImage || 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            style={isCurrent ? { color: 'var(--color-accent)' } : undefined}
                            className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? '' : 'text-white group-hover:text-white'}`}
                          >
                            {song.title}
                          </p>
                          <div className="text-[11px] text-white/55 truncate mt-0.5">
                            <ArtistNames artists={song.artists} linkClassName="text-white/55 hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>

                      {/* Thời lượng */}
                      <div className="hidden sm:flex w-20 items-center justify-center shrink-0 text-xs font-mono tabular-nums text-white/55">
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
