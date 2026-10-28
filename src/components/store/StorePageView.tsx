import React, { useState } from 'react';
import {
  ShoppingBag,
  Wallet,
  PlusCircle,
  Download,
  CheckCircle,
  Play,
  Pause,
  Music,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song } from '../../types/music';

export const StorePageView: React.FC = () => {
  const {
    songs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    userBalance,
    setIsTopUpModalOpen,
    setSongToBuy,
    setIsBuyModalOpen,
    setIsDemoLimitModalOpen,
    setSelectedLrcSong,
    isSongPurchased,
    downloadSong,
    openDownloadModal,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'catalog' | 'owned'>('catalog');

  const ownedSongs = songs.filter((s) => isSongPurchased(s.id));
  const rawList = activeTab === 'catalog' ? songs : ownedSongs;

  // Requirement 6: Sort alphabetically A -> Z (ABCD) by song title
  const sortedSongs = [...rawList].sort((a, b) =>
    a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
  );

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Top Banner & Wallet Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-[#23143c] to-[#120822] border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c273ed]">
            <ShoppingBag className="w-4 h-4" />
            <span>Cửa Hàng Bản Quyền XuanKen Music</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Mua & Sở Hữu Âm Nhạc Chất Lượng Cao
          </h1>
          <p className="text-xs text-white/70 mt-1 max-w-xl">
            Nhạc chưa mua sẽ được nghe thử demo 60 giây. Sau khi mua, bạn được nghe trọn đời không giới hạn và tải về tệp gốc định dạng MP3 320kbps hoặc WAV Lossless.
          </p>
        </div>

        {/* Wallet Box */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/50">Số dư ví của bạn</p>
            <p className="text-xl font-black text-amber-300">
              {userBalance.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <button
            onClick={() => setIsTopUpModalOpen(true)}
            className="ml-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nạp tiền</span>
          </button>
        </div>
      </div>

      {/* Tabs (Requirement 4: removed format filter buttons) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('catalog')}
            style={activeTab === 'catalog' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tất Cả Bài Hát ({songs.length})
          </button>
          <button
            onClick={() => setActiveTab('owned')}
            style={activeTab === 'owned' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'owned'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Bài Hát Đã Mua ({ownedSongs.length})
          </button>
        </div>
      </div>

      {/* List / Table View of Store Items (Requirement 5 & 6: clean list view, fixed cover alignment, sorted ABCD) */}
      {sortedSongs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-white/15 bg-white/5">
          <ShoppingBag className="w-12 h-12 text-white/30 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">Chưa Có Bài Hát Nào Trong Cửa Hàng</h3>
          <p className="text-xs text-white/50 mt-1">Dữ liệu demo đã được xóa. Quản trị viên có thể thêm bài hát tại trang Admin.</p>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-200"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-14">STT</th>
                  <th className="py-3.5 px-4 min-w-[220px]">BÀI HÁT</th>
                  <th className="py-3.5 px-4 min-w-[160px]">CA SỸ</th>
                  <th className="py-3.5 px-4 text-center w-24">LRC</th>
                  <th className="py-3.5 px-4 text-center w-28">ĐỊNH DẠNG</th>
                  <th className="py-3.5 px-4 text-center w-36">GIÁ BẢN QUYỀN</th>
                  <th className="py-3.5 px-4 text-right min-w-[180px]">THAO TÁC / MUA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {sortedSongs.map((song, index) => {
                  const isPurchased = isSongPurchased(song.id);
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentPlaying = isCurrent && isPlaying;

                  return (
                    <tr
                      key={song.id}
                      onClick={() => {
                        if (isCurrent) togglePlay();
                        else playSong(song);
                      }}
                      className={`cursor-pointer transition-colors group ${
                        isCurrent ? 'bg-[#9b4de0]/15 hover:bg-[#9b4de0]/20' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-white/50 group-hover:text-white font-mono">
                        {isCurrentPlaying ? (
                          <div className="w-6 h-6 rounded-full bg-[#9b4de0] text-white flex items-center justify-center mx-auto shadow">
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          </div>
                        ) : (
                          <span className="group-hover:hidden">{index + 1}</span>
                        )}
                        {!isCurrentPlaying && (
                          <div className="hidden group-hover:flex w-6 h-6 rounded-full bg-white text-slate-900 items-center justify-center mx-auto shadow">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        )}
                      </td>

                      {/* Bài Hát + Ảnh bìa căn chỉnh chuẩn xác không bị lệch */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${
                              song.coverGradient || 'from-purple-600 to-indigo-800'
                            } flex items-center justify-center shrink-0 shadow-md relative overflow-hidden border border-white/10`}
                          >
                            {song.coverImage ? (
                              <img
                                src={song.coverImage}
                                alt={song.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Music className="w-5 h-5 text-white/70" />
                            )}
                          </div>
                          <div className="truncate">
                            <p
                              className={`font-bold truncate ${
                                isCurrent ? 'text-[#c273ed]' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </p>
                            <p className="text-[11px] text-white/40 truncate mt-0.5">
                              Album: {song.album || 'XuanKen Official'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Ca sỹ */}
                      <td className="py-3.5 px-4 font-medium text-white/80 truncate">
                        {song.artists}
                      </td>

                      {/* LRC */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLrcSong(song);
                        }}
                      >
                        <button
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#9b4de0] text-white/80 hover:text-white text-xs font-semibold transition-colors"
                          title="Bấm để xem và tải tệp lời bài hát (.lrc)"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#c273ed] group-hover:text-white" />
                          <span>LRC</span>
                        </button>
                      </td>

                      {/* Định dạng */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-black tracking-wider ${
                            song.audioFormat === 'WAV'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {song.audioFormat}
                        </span>
                      </td>

                      {/* Giá bản quyền */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300">
                        {(song.price ?? 20000).toLocaleString('vi-VN')} đ
                      </td>

                      {/* Thao tác / Mua */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          {isPurchased ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs inline-flex items-center gap-1 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Đã mua</span>
                              </span>
                              <button
                                onClick={() => openDownloadModal(song)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
                                title="Tải bài hát (MP3 hoặc WAV)"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Tải về</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSongToBuy(song);
                                setIsDemoLimitModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Mua Ngay</span>
                            </button>
                          )}
                        </div>
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
  );
};
