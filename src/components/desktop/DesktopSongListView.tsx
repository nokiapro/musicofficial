import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  FileText,
  ShoppingCart,
  CheckCircle,
  Download,
  Filter,
  Sparkles,
  Music,
  Share2,
  ListPlus,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song, AudioFormat } from '../../types/music';

export const DesktopSongListView: React.FC = () => {
  const {
    songs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    likedSongIds,
    toggleLike,
    isSongPurchased,
    setSelectedLrcSong,
    setSongToBuy,
    setIsBuyModalOpen,
    setActiveDesktopTab,
    openShareModal,
    openAddToPlaylistModal,
    downloadSong,
    preferredAudioFormat,
    setPreferredAudioFormat,
  } = useMusic();

  const totalSongs = songs.length;
  const purchasedCount = songs.filter((s) => isSongPurchased(s.id)).length;
  const unpurchasedCount = Math.max(0, totalSongs - purchasedCount);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '03:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayOrPause = (song: Song) => {
    if (currentSong && currentSong.id === song.id) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header with Title and MP3 / WAV LOSSLESS Global Format Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            Danh Sách Bài Hát
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Tổng cộng {totalSongs} bài hát • Đã mua: <span className="text-emerald-400 font-bold">{purchasedCount} bài</span> • Chưa mua: <span className="text-amber-400 font-bold">{unpurchasedCount} bài</span>
          </p>
        </div>

        {/* MP3 & WAV LOSSLESS Audio Format Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 text-xs shadow-sm">
            <button
              onClick={() => setPreferredAudioFormat('MP3')}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
                preferredAudioFormat === 'MP3'
                  ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/40'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Phát tất cả các bài hát ở định dạng MP3 (320kbps)"
            >
              MP3
            </button>
            <button
              onClick={() => setPreferredAudioFormat('WAV')}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
                preferredAudioFormat === 'WAV'
                  ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/40'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Phát tất cả các bài hát ở định dạng WAV Lossless chất lượng cao"
            >
              WAV LOSSLESS
            </button>
          </div>
        </div>
      </div>

      {/* Main Table: STT - TÊN BÀI - TÊN CA SỸ - LRC - THỜI LƯỢNG BÀI HÁT - MP3 HAY WAV */}
      <div
        className="rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold text-white/60 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-14">STT</th>
                <th className="py-3.5 px-4 min-w-[220px]">TÊN BÀI</th>
                <th className="py-3.5 px-4 min-w-[160px]">TÊN CA SỸ</th>
                <th className="py-3.5 px-4 text-center w-24">LRC</th>
                <th className="py-3.5 px-4 text-center w-36">THỜI LƯỢNG</th>
                <th className="py-3.5 px-4 text-center w-32">MP3 HAY WAV</th>
                <th className="py-3.5 px-4 text-right min-w-[150px]">TRẠNG THÁI / MUA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {songs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/50">
                    <Music className="w-10 h-10 text-white/20 mx-auto mb-2" />
                    <p className="text-base font-bold text-white">Chưa có bài hát nào trong hệ thống</p>
                    <p className="text-xs text-white/50 mt-1">Dữ liệu demo đã xóa. Hãy vào trang Admin để thêm bài hát mới.</p>
                    <button
                      onClick={() => setActiveDesktopTab('admin')}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#9b4de0] text-white text-xs font-bold shadow hover:bg-[#8539c9] transition-colors"
                    >
                      + Vào Quản Trị Thêm Bài Hát
                    </button>
                  </td>
                </tr>
              ) : (
                songs.map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  const isPurchased = isSongPurchased(song.id);
                  const isLiked = likedSongIds.includes(song.id);

                return (
                  <tr
                    key={song.id}
                    onClick={() => handlePlayOrPause(song)}
                    className={`cursor-pointer transition-colors group ${
                      isCurrent
                        ? 'bg-[#9b4de0]/15 hover:bg-[#9b4de0]/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* 1: STT */}
                    <td className="py-3.5 px-4 text-center text-xs font-bold text-white/50 group-hover:text-white font-mono">
                      {isCurrentPlaying ? (
                        <div className="w-6 h-6 rounded-full bg-[#9b4de0] text-white flex items-center justify-center mx-auto shadow">
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        </div>
                      ) : (
                        <span className="group-hover:hidden">
                          {song.stt || index + 1}
                        </span>
                      )}
                      {!isCurrentPlaying && (
                        <div className="hidden group-hover:flex w-6 h-6 rounded-full bg-white text-slate-900 items-center justify-center mx-auto shadow">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      )}
                    </td>

                    {/* 2: TÊN BÀI */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center shrink-0 shadow-md relative overflow-hidden border border-white/10`}
                        >
                          {song.coverImage ? (
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

                    {/* 3: TÊN CA SỸ */}
                    <td className="py-3.5 px-4 font-medium text-white/80 truncate">
                      {song.artists}
                    </td>

                    {/* 4: LRC */}
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

                    {/* 5: THỜI LƯỢNG BÀI HÁT */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-white/60 tabular-nums">
                      {formatDuration(song.duration)}
                    </td>

                    {/* 6: MP3 HAY WAV */}
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

                    {/* Status & Actions: Download, Playlist, Share, Buy */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddToPlaylistModal(song);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                          title="Thêm vào playlist cá nhân"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openShareModal(song);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                          title="Chia sẻ bài hát (Deep link)"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {isPurchased ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSong(song, song.audioFormat);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                              title={`Tải file ${song.audioFormat} bản quyền về máy`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải về</span>
                            </button>
                            <span className="p-1 text-emerald-400" title="Đã sở hữu bản quyền full bài">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongToBuy(song);
                              setIsBuyModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow transition-transform active:scale-95"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Mua {(song.price ?? 20000).toLocaleString('vi-VN')}đ</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
