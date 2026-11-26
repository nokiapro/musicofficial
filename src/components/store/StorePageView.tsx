import React, { useState } from 'react';
import {
  ShoppingBag,
  Download,
  CheckCircle,
  Play,
  Pause,
  Music,
  FileText,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ArtistNames } from '../common/ArtistNames';

export const StorePageView: React.FC = () => {
  const {
    songs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    setSongToBuy,
    setIsDemoLimitModalOpen,
    setSelectedLrcSong,
    isSongPurchased,
    openDownloadModal,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'catalog' | 'owned'>('catalog');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const ownedSongs = songs.filter((s) => isSongPurchased(s.id));
  const rawList = activeTab === 'catalog' ? songs : ownedSongs;

  // Sort alphabetically A -> Z by song title
  const sortedSongs = [...rawList].sort((a, b) =>
    a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
  );

  const totalSongs = sortedSongs.length;
  const totalPages = Math.max(1, Math.ceil(totalSongs / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const paginatedSongs = sortedSongs.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6 pb-20 select-none">

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center p-1 bg-black/30 rounded-2xl border border-white/[0.08] gap-1">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setCurrentPage(1);
            }}
            style={activeTab === 'catalog' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tất Cả Bài Hát ({songs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('owned');
              setCurrentPage(1);
            }}
            style={activeTab === 'owned' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'owned'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Bài Hát Đã Mua ({ownedSongs.length})
          </button>
        </div>
      </div>

      {/* List / Table View */}
      {paginatedSongs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel">
          <ShoppingBag className="w-12 h-12 text-white/30 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">Chưa Có Bài Hát Nào Trong Cửa Hàng</h3>
          <p className="text-xs text-white/50 mt-1">Dữ liệu demo đã được xóa. Quản trị viên có thể thêm bài hát tại trang Admin.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03] text-[11px] font-bold text-white/55 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-14 whitespace-nowrap">STT</th>
                  <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">BÀI HÁT</th>
                  <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">CA SỸ</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[80px]">LRC</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[105px]">ĐỊNH DẠNG</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">GIÁ BẢN QUYỀN</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">MUA</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">TẢI VỀ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {paginatedSongs.map((song, index) => {
                  const isPurchased = isSongPurchased(song.id);
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  const globalIdx = startIndex + index;

                  return (
                    <tr
                      key={song.id}
                      onClick={() => {
                        if (isCurrent) togglePlay();
                        else playSong(song);
                      }}
                      style={
                        isCurrent
                          ? { backgroundColor: 'color-mix(in srgb, var(--color-accent) 16%, transparent)' }
                          : undefined
                      }
                      className={`cursor-pointer transition-colors group ${
                        isCurrent ? '' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* STT */}
                      <td className="w-14 py-3.5 px-3 text-center text-xs font-bold text-white/50 group-hover:text-white font-mono tabular-nums">
                        <div className="relative w-7 h-7 mx-auto flex items-center justify-center">
                          {isCurrentPlaying ? (
                            <div className="w-7 h-7 rounded-full accent-glow-btn text-white flex items-center justify-center shadow">
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            </div>
                          ) : (
                            <>
                              <span className="tabular-nums transition-opacity group-hover:opacity-0">{globalIdx + 1}</span>
                              <div className="absolute inset-0 flex w-7 h-7 rounded-full bg-white text-slate-900 items-center justify-center shadow opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Bài hát */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-xl bg-zinc-950/90 flex items-center justify-center shrink-0 shadow-md relative overflow-hidden border border-white/10`}
                          >
                            {song.coverImage ? (
                              <img
                                src={song.coverImage}
                                alt={song.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain"
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
                              style={isCurrent ? { color: 'var(--color-accent)' } : undefined}
                              className={`font-bold truncate ${
                                isCurrent ? '' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </p>
                            <p className="text-[11px] text-white/45 truncate mt-0.5">
                              Album: {song.album || 'XuanKen Official'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Ca sỹ */}
                      <td className="py-3.5 px-4 font-medium text-white/75 truncate">
                        <ArtistNames artists={song.artists} linkClassName="text-white/75 hover:text-white" />
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.14] text-white/85 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                          title="Bấm để xem và tải file lời (.lrc)"
                        >
                          <FileText className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          <span>LRC</span>
                        </button>
                      </td>

                      {/* Định dạng */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-black tracking-wider font-mono ${
                            song.audioFormat === 'WAV'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                              : 'bg-sky-500/15 text-sky-300 border border-sky-500/35'
                          }`}
                        >
                          {song.audioFormat}
                        </span>
                      </td>

                      {/* Giá bản quyền */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300 whitespace-nowrap tabular-nums">
                        <span className="whitespace-nowrap">{(song.price ?? 20000).toLocaleString('vi-VN')}&nbsp;đ</span>
                      </td>

                      {/* MUA */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {isPurchased ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-bold text-xs inline-flex items-center gap-1 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Đã mua</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSongToBuy(song);
                              setIsDemoLimitModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl accent-glow-btn text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Mua Ngay</span>
                          </button>
                        )}
                      </td>

                      {/* TẢI VỀ */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {isPurchased ? (
                          <button
                            onClick={() => openDownloadModal(song)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors active:scale-95 cursor-pointer"
                            title="Tải bài hát (MP3 hoặc WAV)"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải về</span>
                          </button>
                        ) : (
                          <span className="text-white/30 text-xs font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.02]">
              <p className="text-xs text-white/50 tabular-nums">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, totalSongs)} trong tổng số {totalSongs} bài hát (20 bài/trang)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={validCurrentPage === pageNum ? { backgroundColor: 'var(--color-accent)' } : undefined}
                    className={`w-7 h-7 rounded-lg text-xs font-bold tabular-nums transition-all cursor-pointer ${
                      validCurrentPage === pageNum
                        ? 'text-white shadow'
                        : 'border border-white/10 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
