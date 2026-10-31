import React, { useState } from 'react';
import { X, Plus, Check, ListPlus, FolderPlus } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const PlaylistModal: React.FC = () => {
  const {
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    songForPlaylistModal,
    playlists,
    createPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
  } = useMusic();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  if (!isPlaylistModalOpen || !songForPlaylistModal) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsPlaylistModalOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleToggleSong = async (playlistId: string, isAlreadyIn: boolean) => {
    if (isAlreadyIn) {
      await removeSongFromPlaylist(playlistId, songForPlaylistModal.id);
      showToast('Đã xóa bài hát khỏi playlist');
    } else {
      await addSongToPlaylist(playlistId, songForPlaylistModal.id);
      showToast('Đã thêm bài hát vào playlist');
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const created = await createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    await addSongToPlaylist(created.id, songForPlaylistModal.id);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreating(false);
    showToast(`Đã tạo playlist "${created.name}" và thêm bài hát!`);
  };

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none transition-opacity duration-200 ${
        isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-200'
      }`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-[var(--bg-surface)] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-5 text-white max-h-[90vh] flex flex-col transition-all duration-200 ${
          isClosing ? 'animate-out zoom-out-95 fade-out duration-200' : 'animate-in zoom-in-95 duration-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#c273ed] flex items-center justify-center">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Thêm Vào Playlist</h2>
              <p className="text-[11px] text-white/50">Tạo & quản lý danh sách phát cá nhân</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Target Song Info */}
        <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-900/40 shrink-0">
            {songForPlaylistModal.coverImage ? (
              <img src={songForPlaylistModal.coverImage} alt={songForPlaylistModal.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/50">XK</div>
            )}
          </div>
          <div className="min-w-0 flex-1 truncate">
            <h3 className="text-xs font-bold text-white truncate">{songForPlaylistModal.title}</h3>
            <p className="text-[10px] text-white/50 truncate">{songForPlaylistModal.artists}</p>
          </div>
        </div>

        {/* Playlists List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Danh sách Playlist của bạn</h4>

          {playlists.length === 0 ? (
            <div className="py-6 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
              Bạn chưa có playlist nào. Hãy tạo playlist đầu tiên bên dưới!
            </div>
          ) : (
            <div className="space-y-1.5">
              {playlists.map((pl) => {
                const isAlreadyIn = pl.songIds.includes(songForPlaylistModal.id);
                return (
                  <div
                    key={pl.id}
                    onClick={() => handleToggleSong(pl.id, isAlreadyIn)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                      isAlreadyIn
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                      <p className="text-[10px] text-white/50">{pl.songIds.length} bài hát</p>
                    </div>

                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                      isAlreadyIn ? 'bg-[#9b4de0] text-white shadow-md' : 'bg-white/10 text-white/50'
                    }`}>
                      {isAlreadyIn ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create New Playlist Form Toggle */}
          <div className="pt-2">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <FolderPlus className="w-4 h-4 text-[#c273ed]" />
                <span>+ Tạo Playlist Mới</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNew} className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/30 space-y-2.5">
                <h5 className="text-xs font-bold text-white">Tạo Playlist Mới</h5>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Tên danh sách phát (Ví dụ: Nhạc chill, Remix...)"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
                />
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Mô tả ngắn (tùy chọn)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
                />
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-md"
                  >
                    Tạo & Thêm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
