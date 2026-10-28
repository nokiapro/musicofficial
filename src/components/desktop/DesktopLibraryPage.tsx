import React, { useState } from 'react';
import {
  Play,
  Heart,
  Music,
  History,
  Plus,
  FolderPlus,
  Trash2,
  Download,
  Share2,
  Trophy,
  Sparkles,
  ShoppingBag,
  CheckCircle,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Playlist, Song } from '../../types/music';

export const DesktopLibraryPage: React.FC = () => {
  const {
    songs,
    likedSongIds,
    toggleLike,
    playSong,
    history,
    playlists,
    createPlaylist,
    deletePlaylist,
    playPlaylist,
    isSongPurchased,
    downloadSong,
    openShareModal,
    setIsRewindModalOpen,
    rewindStats,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'liked' | 'playlists' | 'purchased' | 'history'>('liked');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPl, setIsCreatingPl] = useState(false);

  const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));
  const purchasedSongs = songs.filter((s) => isSongPurchased(s.id));

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

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPl(false);
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Rewind Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-indigo-900/60 border border-purple-500/30 flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">XuanKen Rewind 2026</h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-black">
                Mới
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Bạn đã thưởng thức {Math.floor(rewindStats.totalSeconds / 60)} phút âm nhạc với {rewindStats.totalPlays} lượt phát
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRewindModalOpen(true)}
          className="relative z-10 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 active:scale-95 font-bold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Xem Thống Kê Của Tôi</span>
        </button>
      </div>

      {/* Main Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            Thư Viện Cá Nhân
          </h1>
          {activeTab === 'liked' && (
            <button
              onClick={handlePlayLiked}
              disabled={likedSongs.length === 0}
              style={{ backgroundColor: 'var(--color-accent)' }}
              className="w-9 h-9 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-40 hover:opacity-90"
              title="Phát tất cả bài yêu thích"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          )}
        </div>

        {/* Tabs: Yêu thích vs Playlists vs Đã mua vs Lịch sử */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('liked')}
            style={activeTab === 'liked' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'liked'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Yêu thích ({likedSongs.length})
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            style={activeTab === 'playlists' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'playlists'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Playlists ({playlists.length})
          </button>

          <button
            onClick={() => setActiveTab('purchased')}
            style={activeTab === 'purchased' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'purchased'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Đã mua ({purchasedSongs.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={activeTab === 'history' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Lịch sử ({history.length})
          </button>
        </div>
      </div>

      {/* TAB 1: YÊU THÍCH */}
      {activeTab === 'liked' && (
        <div>
          {likedSongs.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40 mb-3">
                <Heart className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-white">Chưa có bài hát yêu thích</p>
              <p className="text-xs text-white/50 mt-1">
                Hãy bấm thả tim các bài hát bạn thích để thưởng thức lại ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5">
                <span className="w-12 text-center">#</span>
                <span className="flex-1">Bài hát</span>
                <span className="hidden md:block w-48">Ca sỹ</span>
                <span className="w-24 text-center">Định dạng</span>
                <span className="w-24 text-right">Hành động</span>
              </div>

              {likedSongs.map((song, idx) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className="flex items-center px-4 py-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer group transition-all select-none"
                >
                  <span className="w-12 text-center text-xs text-white/40 group-hover:text-white font-bold">
                    {idx + 1}
                  </span>

                  <div className="flex-1 flex items-center gap-3 truncate pr-4">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-900/40 shrink-0 relative shadow-md">
                      {song.coverImage ? (
                        <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/60">XK</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-white truncate group-hover:text-[#c273ed] transition-colors">
                        {song.title}
                      </p>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {song.artists}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block w-48 text-xs text-white/50 truncate">
                    {song.artists}
                  </div>

                  <div className="w-24 text-center">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {song.audioFormat}
                    </span>
                  </div>

                  <div className="w-24 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openShareModal(song)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                      title="Chia sẻ link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleLike(song.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-red-500"
                      title="Bỏ thích"
                    >
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAYLISTS CÁ NHÂN */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/70 uppercase">Danh sách phát của bạn</h3>
            <button
              onClick={() => setIsCreatingPl(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Tạo Playlist</span>
            </button>
          </div>

          {/* Create modal/card toggle */}
          {isCreatingPl && (
            <form onSubmit={handleCreatePlaylistSubmit} className="p-4 rounded-2xl bg-white/5 border border-purple-500/30 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nhập tên playlist mới..."
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPl(false)}
                  className="px-3 py-2 text-xs text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow"
                >
                  Tạo ngay
                </button>
              </div>
            </form>
          )}

          {playlists.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5">
              <FolderPlus className="w-12 h-12 text-white/20 mx-auto mb-2" />
              <p className="text-base font-bold text-white">Chưa có danh sách phát nào</p>
              <p className="text-xs text-white/50 mt-1">Bấm "+ Tạo Playlist" hoặc bấm vào bài hát để tạo playlist riêng.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((pl) => {
                const count = pl.songIds.length;
                return (
                  <div
                    key={pl.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between h-40 group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-[#c273ed]">
                          {count} bài hát
                        </span>
                        <button
                          onClick={() => deletePlaylist(pl.id)}
                          className="p-1 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                          title="Xóa playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="text-base font-bold text-white mt-2 truncate">{pl.name}</h4>
                      <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                        {pl.description || 'Danh sách phát tuyển chọn cá nhân'}
                      </p>
                    </div>

                    <button
                      onClick={() => playPlaylist(pl)}
                      disabled={count === 0}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-[#9b4de0] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Phát Playlist ({count} bài)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BÀI HÁT ĐÃ MUA BẢN QUYỀN (VỚI NÚT DOWNLOAD) */}
      {activeTab === 'purchased' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white/80 uppercase">Kho Nhạc Bản Quyền Của Bạn</h3>
              <p className="text-xs text-white/50 mt-0.5">Tải file chất lượng cao MP3 320kbps và WAV Lossless trực tiếp về máy</p>
            </div>
          </div>

          {purchasedSongs.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5">
              <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-2" />
              <p className="text-base font-bold text-white">Chưa có bài hát bản quyền nào</p>
              <p className="text-xs text-white/50 mt-1">Hãy ghé thăm Cửa Hàng để mua nhạc bản quyền full chất lượng.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {purchasedSongs.map((song, idx) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className="flex items-center px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer group transition-all"
                >
                  <span className="w-10 text-center text-xs text-emerald-400 font-bold">
                    #{idx + 1}
                  </span>

                  <div className="flex-1 flex items-center gap-3 truncate pr-4">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-900/40 shrink-0 relative">
                      {song.coverImage ? (
                        <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/60">XK</div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-white truncate">{song.title}</p>
                      <p className="text-xs text-white/50 truncate mt-0.5">{song.artists}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {song.audioFormat} Full
                    </span>

                    <button
                      onClick={() => downloadSong(song, song.audioFormat)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                      title="Tải file bản quyền về thiết bị"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LỊCH SỬ NGHE */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5">
              <History className="w-12 h-12 text-white/20 mx-auto mb-2" />
              <p className="text-base font-bold text-white">Chưa có bài hát trong lịch sử</p>
              <p className="text-xs text-white/50 mt-1">Các bài hát bạn đã nghe sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((song, idx) => (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => playSong(song)}
                  className="flex items-center px-4 py-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer group transition-all"
                >
                  <span className="w-10 text-center text-xs text-white/40 group-hover:text-white font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 flex items-center gap-3 truncate pr-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-900/40 shrink-0">
                      {song.coverImage ? (
                        <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/60">XK</div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-white truncate">{song.title}</p>
                      <p className="text-xs text-white/50 truncate mt-0.5">{song.artists}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/50">{formatDuration(song.duration)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
