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
  Sparkles,
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
    purchasedSongIds,
    userBalance,
    setIsTopUpModalOpen,
    setSongToBuy,
    setIsBuyModalOpen,
    setSelectedLrcSong,
    isSongPurchased,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'catalog' | 'owned'>('catalog');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'MP3' | 'WAV'>('ALL');

  const ownedSongs = songs.filter((s) => isSongPurchased(s.id));

  const displaySongs = (activeTab === 'catalog' ? songs : ownedSongs).filter((s) => {
    if (formatFilter !== 'ALL' && s.audioFormat !== formatFilter) return false;
    return true;
  });

  const handleDownloadFile = (song: Song) => {
    // Generate simulated high-res audio container download
    const dummyAudioContent = `XuanKen Music - Licensed Master Audio
Title: ${song.title}
Artist: ${song.artists}
Format: ${song.audioFormat} High Definition Audio
License: Purchased Full Rights
Bitrate: ${song.audioFormat === 'WAV' ? '24-bit 96kHz Lossless' : '320kbps High Quality'}`;

    const blob = new Blob([dummyAudioContent], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title} - ${song.artists}.${song.audioFormat.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-[#9b4de0] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tất Cả Bài Hát ({songs.length})
          </button>
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'owned'
                ? 'bg-[#9b4de0] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Bài Hát Đã Mua ({ownedSongs.length})
          </button>
        </div>

        {/* Format toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/50">Lọc định dạng:</span>
          <button
            onClick={() => setFormatFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold ${
              formatFilter === 'ALL' ? 'bg-white/20 text-white' : 'text-white/50'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFormatFilter('MP3')}
            className={`px-3 py-1 rounded-lg font-bold ${
              formatFilter === 'MP3' ? 'bg-blue-600 text-white' : 'text-white/50'
            }`}
          >
            MP3
          </button>
          <button
            onClick={() => setFormatFilter('WAV')}
            className={`px-3 py-1 rounded-lg font-bold ${
              formatFilter === 'WAV' ? 'bg-amber-600 text-white' : 'text-white/50'
            }`}
          >
            WAV
          </button>
        </div>
      </div>

      {/* Grid of Store Items */}
      {displaySongs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-white/15 bg-white/5">
          <ShoppingBag className="w-12 h-12 text-white/30 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">Chưa Có Bài Hát Nào Trong Cửa Hàng</h3>
          <p className="text-xs text-white/50 mt-1">Dữ liệu demo đã được xóa. Quản trị viên có thể thêm bài hát tại trang Admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displaySongs.map((song) => {
            const isPurchased = isSongPurchased(song.id);
            const isCurrent = currentSong?.id === song.id;

          return (
            <div
              key={song.id}
              className={`p-4 rounded-2xl border transition-all ${
                isPurchased
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              } flex flex-col justify-between gap-4`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden border border-white/10`}
                >
                  {song.coverImage ? (
                    <img
                      src={song.coverImage}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <button
                    onClick={() => {
                      if (isCurrent) togglePlay();
                      else playSong(song);
                    }}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110"
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="flex-1 truncate">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        song.audioFormat === 'WAV'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {song.audioFormat}
                    </span>
                    <button
                      onClick={() => setSelectedLrcSong(song)}
                      className="text-[11px] text-white/50 hover:text-[#c273ed] flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      LRC
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white truncate mt-1">
                    {song.title}
                  </h3>
                  <p className="text-xs text-white/60 truncate">{song.artists}</p>
                </div>
              </div>

              {/* Bottom Price & Action */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/50 uppercase">
                    {isPurchased ? 'Trạng thái' : 'Giá bản quyền'}
                  </p>
                  <p className="text-base font-black text-amber-300">
                    {isPurchased ? 'ĐÃ SỞ HỮU' : `${song.price.toLocaleString('vi-VN')} đ`}
                  </p>
                </div>

                {isPurchased ? (
                  <button
                    onClick={() => handleDownloadFile(song)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải {song.audioFormat}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSongToBuy(song);
                      setIsBuyModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-lg shadow-[#9b4de0]/30 transition-transform active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Mua Ngay</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
