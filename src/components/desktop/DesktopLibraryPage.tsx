import React, { useState } from 'react';
import {
  Play,
  Heart,
  Music,
  Plus,
  FolderPlus,
  Trash2,
  Download,
  Share2,
  Trophy,
  Sparkles,
  ShoppingBag,
  ListMusic,
  FolderHeart,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Playlist, Song } from '../../types/music';

export const DesktopLibraryPage: React.FC = () => {
  const {
    songs,
    likedSongIds,
    toggleLike,
    playSong,
    playlists,
    createPlaylist,
    deletePlaylist,
    playPlaylist,
    isSongPurchased,
    downloadSong,
    openShareModal,
    setIsRewindModalOpen,
    rewindStats,
    currentUser,
    setIsLoginModalOpen,
  } = useMusic();

  // Requirement 9: Xóa mục Lịch sử đi -> chỉ còn Yêu thích, Playlists, Đã mua
  const [activeTab, setActiveTab] = useState<'liked' | 'playlists' | 'purchased'>('liked');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreatingPl, setIsCreatingPl] = useState(false);

  // Requirement 3: Thư viện cá nhân chỉ khi đăng nhập mới hiện
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-8 rounded-3xl bg-white/5 border border-white/10 select-none">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-4 shadow-xl"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <FolderHeart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 font-['Roboto_Condensed'] uppercase tracking-tight">
          Thư Viện Cá Nhân
        </h2>
        <p className="text-sm text-white/60 max-w-md mb-6 leading-relaxed">
          Vui lòng đăng nhập để truy cập Thư Viện Cá Nhân, xem danh sách bài hát yêu thích, bài hát đã mua và quản lý các danh sách phát của riêng bạn.
        </p>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          style={{ backgroundColor: 'var(--color-accent)' }}
          className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Đăng Nhập Ngay</span>
        </button>
      </div>
    );
  }

  // Requirement 3: Mỗi tài khoản là thư viện mà playlist của người đó nhé
  const userPlaylists = playlists.filter((p) => !p.userId || p.userId === currentUser.uid);

  // Requirement 21: 20 songs per page
  const PAGE_SIZE = 20;
  const [likedPage, setLikedPage] = useState(1);
  const [purchasedPage, setPurchasedPage] = useState(1);

  const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));
  const purchasedSongs = songs.filter((s) => isSongPurchased(s.id));

  const totalLikedPages = Math.max(1, Math.ceil(likedSongs.length / PAGE_SIZE));
  const paginatedLikedSongs = likedSongs.slice((likedPage - 1) * PAGE_SIZE, likedPage * PAGE_SIZE);

  const totalPurchasedPages = Math.max(1, Math.ceil(purchasedSongs.length / PAGE_SIZE));
  const paginatedPurchasedSongs = purchasedSongs.slice((purchasedPage - 1) * PAGE_SIZE, purchasedPage * PAGE_SIZE);

  const formatDuration = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
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
    await createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
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

        {/* Tabs: Requirement 9 - Xóa lịch sử, chỉ giữ Yêu thích vs Playlists vs Đã mua */}
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
              {paginatedLikedSongs.map((song, idx) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className="flex items-center px-4 py-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer group transition-all select-none"
                >
                  <span className="w-12 text-center text-xs text-white/40 group-hover:text-white font-bold">
                    {(likedPage - 1) * PAGE_SIZE + idx + 1}
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

              {/* Pagination (Requirement 21) */}
              {totalLikedPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
                  <span className="text-white/40">
                    Trang {likedPage} / {totalLikedPages} ({likedSongs.length} bài)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={likedPage === 1}
                      onClick={() => setLikedPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all"
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalLikedPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setLikedPage(pg)}
                        className={`w-8 h-8 rounded-xl font-bold transition-all ${
                          likedPage === pg
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      disabled={likedPage === totalLikedPages}
                      onClick={() => setLikedPage((p) => Math.min(totalLikedPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAYLISTS CÁ NHÂN (Requirement 11: Làm theo dạng list!) */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white/80 uppercase">Danh Sách Phát Của Bạn</h3>
              <p className="text-xs text-white/50 mt-0.5">Quản lý và phát các playlist tuyển chọn</p>
            </div>
            <button
              onClick={() => setIsCreatingPl(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Tạo Playlist Mới</span>
            </button>
          </div>

          {/* Create modal/card */}
          {isCreatingPl && (
            <form onSubmit={handleCreatePlaylistSubmit} className="p-4 rounded-2xl bg-white/5 border border-purple-500/30 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#c273ed]" />
                <span>Tạo Danh Sách Phát Mới</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Tên playlist (VD: Nhạc Chill, Top EDM...)"
                  className="bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
                />
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Mô tả playlist (tùy chọn)"
                  className="bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatingPl(false)}
                  className="px-3.5 py-1.5 text-xs text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow"
                >
                  Tạo Playlist
                </button>
              </div>
            </form>
          )}

          {/* Requirement 11: Render Playlists as LIST instead of cards */}
          {userPlaylists.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5">
              <FolderPlus className="w-12 h-12 text-white/20 mx-auto mb-2" />
              <p className="text-base font-bold text-white">Chưa có danh sách phát nào</p>
              <p className="text-xs text-white/50 mt-1">Bấm "+ Tạo Playlist Mới" để tạo playlist riêng của bạn.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4 min-w-[200px]">TÊN PLAYLIST</th>
                      <th className="py-3 px-4 min-w-[220px]">MÔ TẢ</th>
                      <th className="py-3 px-4 text-center w-28">SỐ BÀI HÁT</th>
                      <th className="py-3 px-4 text-center w-36">PHÁT PLAYLIST</th>
                      <th className="py-3 px-4 text-right w-20">XÓA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userPlaylists.map((pl, idx) => {
                      const count = pl.songIds.length;
                      return (
                        <tr key={pl.id} className="hover:bg-white/5 transition-colors group">
                          <td className="py-3.5 px-4 text-center font-mono text-white/40 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-[#c273ed] border border-purple-500/30 flex items-center justify-center shrink-0 shadow-md">
                                <ListMusic className="w-5 h-5" />
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-white text-sm group-hover:text-[#c273ed] transition-colors truncate">
                                  {pl.name}
                                </p>
                                <p className="text-[10px] text-white/40">Tạo bởi cá nhân</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-white/60">
                            {pl.description || 'Danh sách phát cá nhân'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-[#c273ed] border border-purple-500/30 font-mono">
                              {count} bài
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => playPlaylist(pl)}
                              disabled={count === 0}
                              className="px-3.5 py-1.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs inline-flex items-center gap-1.5 shadow transition-all active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              <span>Phát ({count})</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Xóa playlist "${pl.name}"?`)) {
                                  deletePlaylist(pl.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white/60 hover:text-white transition-colors"
                              title="Xóa playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BÀI HÁT ĐÃ MUA BẢN QUYỀN */}
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
              {paginatedPurchasedSongs.map((song, idx) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className="flex items-center px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer group transition-all"
                >
                  <span className="w-10 text-center text-xs text-emerald-400 font-bold">
                    #{(purchasedPage - 1) * PAGE_SIZE + idx + 1}
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
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
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

              {/* Pagination (Requirement 21) */}
              {totalPurchasedPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
                  <span className="text-white/40">
                    Trang {purchasedPage} / {totalPurchasedPages} ({purchasedSongs.length} bài)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={purchasedPage === 1}
                      onClick={() => setPurchasedPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all"
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPurchasedPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setPurchasedPage(pg)}
                        className={`w-8 h-8 rounded-xl font-bold transition-all ${
                          purchasedPage === pg
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      disabled={purchasedPage === totalPurchasedPages}
                      onClick={() => setPurchasedPage((p) => Math.min(totalPurchasedPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
