import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Play,
  Pause,
  Heart,
  FileText,
  ShoppingCart,
  CheckCircle,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Wallet,
  Download,
  Share2,
  ListPlus,
  FolderPlus,
  Trophy,
  Sparkles,
  Headphones,
  Crown,
  History,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { MobileTopBar } from './MobileTopBar';
import { MobileProfileView } from './MobileProfileView';
import { AdminPageView } from '../admin/AdminPageView';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMiniPlayer } from './MobileMiniPlayer';
import { MobileFullPlayerModal } from './MobileFullPlayerModal';
import { Song, Playlist } from '../../types/music';

export const MobileAppLayout: React.FC = () => {
  const {
    songs,
    currentSong,
    isPlaying,
    activeMobileTab,
    viewMode,
    setViewMode,
    playSong,
    togglePlay,
    likedSongIds,
    toggleLike,
    isSongPurchased,
    setSelectedLrcSong,
    setSongToBuy,
    setIsBuyModalOpen,
    setIsDemoLimitModalOpen,
    userBalance,
    setIsTopUpModalOpen,
    openShareModal,
    openAddToPlaylistModal,
    downloadSong,
    openDownloadModal,
    playlists,
    createPlaylist,
    deletePlaylist,
    playPlaylist,
    history,
    setIsRewindModalOpen,
    rewindStats,
    preferredAudioFormat,
    setPreferredAudioFormat,
  } = useMusic();

  const [librarySubTab, setLibrarySubTab] = useState<'liked' | 'playlists' | 'purchased'>('liked');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPl, setIsCreatingPl] = useState(false);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  // Requirement 21: 20 songs per page
  const PAGE_SIZE = 20;
  const [discoverPage, setDiscoverPage] = useState(1);
  const [storePage, setStorePage] = useState(1);
  const [chartPage, setChartPage] = useState(1);
  const [likedPage, setLikedPage] = useState(1);
  const [purchasedPage, setPurchasedPage] = useState(1);

  const totalSongs = songs.length;
  const purchasedCount = songs.filter((s) => isSongPurchased(s.id)).length;
  const unpurchasedCount = Math.max(0, totalSongs - purchasedCount);

  const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));
  const ownedSongs = songs.filter((s) => isSongPurchased(s.id));

  const totalDiscoverPages = Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  const paginatedDiscoverSongs = songs.slice((discoverPage - 1) * PAGE_SIZE, discoverPage * PAGE_SIZE);

  const totalStorePages = Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  const paginatedStoreSongs = songs.slice((storePage - 1) * PAGE_SIZE, storePage * PAGE_SIZE);

  const rankedSongs = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  const totalChartPages = Math.max(1, Math.ceil(rankedSongs.length / PAGE_SIZE));
  const paginatedChartSongs = rankedSongs.slice((chartPage - 1) * PAGE_SIZE, chartPage * PAGE_SIZE);

  const totalLikedPages = Math.max(1, Math.ceil(likedSongs.length / PAGE_SIZE));
  const paginatedLikedSongs = likedSongs.slice((likedPage - 1) * PAGE_SIZE, likedPage * PAGE_SIZE);

  const totalPurchasedPages = Math.max(1, Math.ceil(ownedSongs.length / PAGE_SIZE));
  const paginatedOwnedSongs = ownedSongs.slice((purchasedPage - 1) * PAGE_SIZE, purchasedPage * PAGE_SIZE);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '03:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPl(false);
  };

  const renderTabContent = () => {
    switch (activeMobileTab) {
      case 'discover':
        return (
          <div className="space-y-3 px-3 pb-32 pt-2 select-none">
            {/* Header with song count & purchase statistics */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <h1 className="text-lg font-black text-white uppercase tracking-tight">
                  Danh Sách Bài Hát
                </h1>
                <p className="text-[10px] text-white/50">
                  Tổng cộng {totalSongs} bài hát • Đã mua: <span className="text-emerald-400 font-bold">{purchasedCount} bài</span> • Chưa mua: <span className="text-amber-400 font-bold">{unpurchasedCount} bài</span>
                </p>
              </div>
            </div>

            {/* MP3 & WAV Audio Format Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 text-xs shadow-sm w-full">
                <button
                  onClick={() => setPreferredAudioFormat('MP3')}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-all text-center ${
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
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-all text-center ${
                    preferredAudioFormat === 'WAV'
                      ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/40'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Phát tất cả các bài hát ở định dạng WAV chất lượng cao"
                >
                  WAV
                </button>
              </div>
            </div>

            {/* Invisible backdrop when 3-dots popover is open */}
            {activeMenuSongId && (
              <div
                className="fixed inset-0 z-30 bg-transparent"
                onClick={() => setActiveMenuSongId(null)}
              />
            )}

            {/* Songs List */}
            <div className="space-y-2">
              {paginatedDiscoverSongs.map((song, idx) => {
                const isCurrent = currentSong ? currentSong.id === song.id : false;
                const isPurchased = isSongPurchased(song.id);
                const isLiked = likedSongIds.includes(song.id);

                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      if (isCurrent) togglePlay();
                      else playSong(song);
                    }}
                    className={`relative p-2.5 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-[#9b4de0]/20 border-[#9b4de0]/50 shadow-md'
                        : 'bg-white/5 border-white/5 active:bg-white/10'
                    }`}
                  >
                    {/* Left Info: STT, Cover, Title, Artist */}
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <span className="w-5 text-center text-xs font-bold text-white/40 font-mono">
                        {song.stt || (discoverPage - 1) * PAGE_SIZE + idx + 1}
                      </span>

                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow bg-zinc-900 border border-white/10">
                        {song.coverImage ? (
                          <img
                            src={song.coverImage}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 text-white fill-current" />
                          ) : (
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="truncate flex-1 min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            isCurrent ? 'text-[#c273ed]' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </p>
                        <p className="text-[10px] text-white/60 truncate mt-0.5">{song.artists}</p>
                      </div>
                    </div>

                    {/* Right: 3-dots Menu Button replacing WAV badge */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveMenuSongId(activeMenuSongId === song.id ? null : song.id)}
                        className={`p-1.5 rounded-xl transition-all ${
                          activeMenuSongId === song.id
                            ? 'bg-[#9b4de0] text-white'
                            : 'hover:bg-white/10 text-white/60 hover:text-white'
                        }`}
                        title="Tùy chọn bài hát"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* 3-dots Popup Dropdown Menu */}
                      {activeMenuSongId === song.id && (
                        <div
                          className="absolute right-0 top-9 w-48 bg-[#231b2e] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-40 text-xs text-white space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                        >
                          {/* 1. Yêu thích (Tim) */}
                          <button
                            onClick={() => {
                              toggleLike(song.id);
                              setActiveMenuSongId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                            <span>{isLiked ? 'Đã yêu thích' : 'Yêu thích bài hát'}</span>
                          </button>

                          {/* 2. Xem lời bài hát (LRC) */}
                          <button
                            onClick={() => {
                              setSelectedLrcSong(song);
                              setActiveMenuSongId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#c273ed]" />
                            <span>Xem lời bài hát (LRC)</span>
                          </button>

                          {/* 3. Thêm vào playlist */}
                          <button
                            onClick={() => {
                              openAddToPlaylistModal(song);
                              setActiveMenuSongId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                          >
                            <ListPlus className="w-3.5 h-3.5 text-blue-400" />
                            <span>Thêm vào playlist</span>
                          </button>

                          {/* 4. Chia sẻ link bài hát */}
                          <button
                            onClick={() => {
                              openShareModal(song);
                              setActiveMenuSongId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Chia sẻ link bài hát</span>
                          </button>

                          {/* 5. Tải bài hát về máy */}
                          <button
                            onClick={() => {
                              setActiveMenuSongId(null);
                              if (isPurchased) {
                                openDownloadModal(song);
                              } else {
                                setSongToBuy(song);
                                setIsDemoLimitModalOpen(true);
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isPurchased ? 'Tải bài hát về máy' : 'Mua & Tải bài hát'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls (Requirement 21) */}
            {totalDiscoverPages > 1 && (
              <div className="flex items-center justify-between pt-3 pb-2 text-xs">
                <span className="text-white/40 text-[11px]">
                  Trang {discoverPage} / {totalDiscoverPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={discoverPage === 1}
                    onClick={() => setDiscoverPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalDiscoverPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setDiscoverPage(pg)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                        discoverPage === pg
                          ? 'bg-[#9b4de0] text-white shadow'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={discoverPage === totalDiscoverPages}
                    onClick={() => setDiscoverPage((p) => Math.min(totalDiscoverPages, p + 1))}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'store':
        return (
          <div className="space-y-3 px-3 pb-32 pt-2 select-none">
            {/* Wallet Balance Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-[#23143c] to-[#120822] border border-white/10 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#c273ed]">Cửa Hàng XuanKen</p>
                <p className="text-sm font-bold text-white">Mua Nhạc Bản Quyền Full</p>
                <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                  Số dư ví: {userBalance.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nạp ví</span>
              </button>
            </div>

            {/* Songs in Store */}
            <div className="space-y-2">
              {paginatedStoreSongs.map((song) => {
                const isPurchased = isSongPurchased(song.id);
                return (
                  <div
                    key={song.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2.5"
                  >
                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{song.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-white/10 text-white shrink-0">
                          {song.audioFormat}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate mt-0.5">{song.artists}</p>
                      <p className="text-xs font-bold text-amber-400 mt-1">
                        {isPurchased ? 'ĐÃ SỞ HỮU' : `${(song.price ?? 20000).toLocaleString('vi-VN')} đ`}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isPurchased ? (
                        <button
                          onClick={() => openDownloadModal(song)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSongToBuy(song);
                            setIsDemoLimitModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow active:scale-95 transition-all"
                        >
                          Mua ngay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Store Pagination (Requirement 21) */}
            {totalStorePages > 1 && (
              <div className="flex items-center justify-between pt-3 pb-2 text-xs">
                <span className="text-white/40 text-[11px]">
                  Trang {storePage} / {totalStorePages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={storePage === 1}
                    onClick={() => setStorePage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalStorePages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setStorePage(pg)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                        storePage === pg
                          ? 'bg-[#9b4de0] text-white shadow'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={storePage === totalStorePages}
                    onClick={() => setStorePage((p) => Math.min(totalStorePages, p + 1))}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'chart': {
        return (
          <div className="space-y-3 px-3 pb-32 pt-2 select-none">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h1 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-[#9b4de0] to-cyan-400 bg-clip-text text-transparent">
                    #xuankenchart
                  </span>
                </h1>
                <p className="text-[10px] text-white/50">Xếp hạng bài hát nghe nhiều nhất thời gian thực</p>
              </div>
            </div>

            <div className="space-y-2">
              {paginatedChartSongs.map((song, i) => {
                const rank = (chartPage - 1) * PAGE_SIZE + i + 1;
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#9b4de0]/20 border-purple-500/50 shadow'
                        : 'bg-white/5 border-white/5 active:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-black text-xs shrink-0 ${
                        rank === 1
                          ? 'border-amber-400/50 text-amber-300 bg-amber-500/10'
                          : rank === 2
                          ? 'border-sky-400/50 text-sky-300 bg-sky-500/10'
                          : rank === 3
                          ? 'border-rose-400/50 text-rose-300 bg-rose-500/10'
                          : 'border-transparent text-white/40'
                      }`}>
                        {rank === 1 ? <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : rank}
                      </div>

                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-purple-900/40 shrink-0">
                        {song.coverImage ? (
                          <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/50">XK</div>
                        )}
                      </div>

                      <div className="truncate">
                        <p className={`text-xs font-bold truncate ${isCurrent ? 'text-[#c273ed]' : 'text-white'}`}>
                          {song.title}
                        </p>
                        <p className="text-[10px] text-white/50 truncate">{song.artists}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                        <Headphones className="w-3 h-3 text-emerald-400/70" />
                        {(song.playCount || 0).toLocaleString('vi-VN')}
                      </span>

                      <button
                        onClick={() => openShareModal(song)}
                        className="p-1 text-white/40 hover:text-white"
                        title="Chia sẻ link bài hát"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart Pagination (Requirement 21) */}
            {totalChartPages > 1 && (
              <div className="flex items-center justify-between pt-3 pb-2 text-xs">
                <span className="text-white/40 text-[11px]">
                  Trang {chartPage} / {totalChartPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={chartPage === 1}
                    onClick={() => setChartPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalChartPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setChartPage(pg)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                        chartPage === pg
                          ? 'bg-[#9b4de0] text-white shadow'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={chartPage === totalChartPages}
                    onClick={() => setChartPage((p) => Math.min(totalChartPages, p + 1))}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'library':
        return (
          <div className="space-y-3 px-3 pb-32 pt-2 select-none">
            {/* XuanKen Rewind 2026 Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-indigo-900/60 border border-purple-500/30 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white shadow">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>XuanKen Rewind</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-black font-extrabold">2026</span>
                  </h3>
                  <p className="text-[10px] text-purple-200/80">
                    {Math.floor(rewindStats.totalSeconds / 60)} phút • {rewindStats.totalPlays} lượt nghe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRewindModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-xs shadow active:scale-95 transition-all shrink-0"
              >
                Xem Rewind
              </button>
            </div>

            {/* Sub-tabs: Yêu thích, Playlists, Đã mua (Lịch sử removed per Req 9) */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl gap-1 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => setLibrarySubTab('liked')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all whitespace-nowrap text-center ${
                  librarySubTab === 'liked'
                    ? 'bg-[#9b4de0] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Yêu thích ({likedSongs.length})
              </button>
              <button
                onClick={() => setLibrarySubTab('playlists')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all whitespace-nowrap text-center ${
                  librarySubTab === 'playlists'
                    ? 'bg-[#9b4de0] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Playlists ({playlists.length})
              </button>
              <button
                onClick={() => setLibrarySubTab('purchased')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all whitespace-nowrap text-center ${
                  librarySubTab === 'purchased'
                    ? 'bg-[#9b4de0] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Đã mua ({ownedSongs.length})
              </button>
            </div>

            {/* Subtab 1: Yêu thích */}
            {librarySubTab === 'liked' && (
              <div className="space-y-2">
                {likedSongs.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                    Chưa có bài hát yêu thích. Hãy bấm icon tim để lưu bài hát!
                  </div>
                ) : (
                  paginatedLikedSongs.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => playSong(song)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 active:bg-white/10 cursor-pointer"
                    >
                      <div className="truncate min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-white truncate">{song.title}</p>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">{song.artists}</p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openShareModal(song)}
                          className="p-1 text-white/40 hover:text-white"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleLike(song.id)} className="p-1 text-red-500">
                          <Heart className="w-4 h-4 fill-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Liked Pagination (Requirement 21) */}
                {totalLikedPages > 1 && (
                  <div className="flex items-center justify-between pt-3 pb-2 text-xs">
                    <span className="text-white/40 text-[11px]">
                      Trang {likedPage} / {totalLikedPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={likedPage === 1}
                        onClick={() => setLikedPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                      >
                        Trước
                      </button>
                      {Array.from({ length: totalLikedPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => setLikedPage(pg)}
                          className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                            likedPage === pg
                              ? 'bg-[#9b4de0] text-white shadow'
                              : 'bg-white/5 text-white/60'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                      <button
                        disabled={likedPage === totalLikedPages}
                        onClick={() => setLikedPage((p) => Math.min(totalLikedPages, p + 1))}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subtab 2: Custom Playlists */}
            {librarySubTab === 'playlists' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/70 uppercase">Danh sách phát cá nhân</span>
                  <button
                    onClick={() => setIsCreatingPl(true)}
                    className="px-3 py-1 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-xs flex items-center gap-1 shadow"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Tạo mới</span>
                  </button>
                </div>

                {isCreatingPl && (
                  <form onSubmit={handleCreatePlaylist} className="p-3 rounded-2xl bg-white/5 border border-purple-500/30 space-y-2">
                    <input
                      type="text"
                      required
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Nhập tên playlist mới..."
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingPl(false)}
                        className="px-3 py-1 text-xs text-white/60"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 rounded-xl bg-[#9b4de0] text-white font-bold text-xs shadow"
                      >
                        Tạo
                      </button>
                    </div>
                  </form>
                )}

                {playlists.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                    Chưa có playlist nào. Hãy bấm "+ Tạo mới" để tạo danh sách phát riêng!
                  </div>
                ) : (
                  playlists.map((pl) => (
                    <div
                      key={pl.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="truncate min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{pl.name}</h4>
                        <p className="text-[10px] text-white/50">{pl.songIds.length} bài hát</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => playPlaylist(pl)}
                          disabled={pl.songIds.length === 0}
                          className="px-2.5 py-1 rounded-lg bg-[#9b4de0] text-white font-bold text-[10px] flex items-center gap-1 disabled:opacity-30"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Phát</span>
                        </button>
                        <button
                          onClick={() => deletePlaylist(pl.id)}
                          className="p-1 text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Subtab 3: Đã mua (Download MP3/WAV) */}
            {librarySubTab === 'purchased' && (
              <div className="space-y-2">
                {ownedSongs.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                    Chưa có bài hát bản quyền nào được mua.
                  </div>
                ) : (
                  paginatedOwnedSongs.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => playSong(song)}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer"
                    >
                      <div className="truncate min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-white truncate">{song.title}</p>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">{song.artists}</p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {song.audioFormat} Full
                        </span>
                        <button
                          onClick={() => downloadSong(song, song.audioFormat)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow"
                          title="Tải về máy"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Purchased Pagination (Requirement 21) */}
                {totalPurchasedPages > 1 && (
                  <div className="flex items-center justify-between pt-3 pb-2 text-xs">
                    <span className="text-white/40 text-[11px]">
                      Trang {purchasedPage} / {totalPurchasedPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={purchasedPage === 1}
                        onClick={() => setPurchasedPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                      >
                        Trước
                      </button>
                      {Array.from({ length: totalPurchasedPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => setPurchasedPage(pg)}
                          className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                            purchasedPage === pg
                              ? 'bg-[#9b4de0] text-white shadow'
                              : 'bg-white/5 text-white/60'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                      <button
                        disabled={purchasedPage === totalPurchasedPages}
                        onClick={() => setPurchasedPage((p) => Math.min(totalPurchasedPages, p + 1))}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all text-xs"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'admin':
        return (
          <div className="pb-32 px-1 sm:px-3 pt-2 max-w-5xl mx-auto">
            <AdminPageView />
          </div>
        );

      case 'profile':
        return <MobileProfileView />;

      default:
        return null;
    }
  };

  return (
    <div
      className="h-[100dvh] w-full text-white flex flex-col items-center justify-start sm:py-4 transition-colors duration-300 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Top Banner on Desktop when viewing Mobile App mode */}
      <div
        className="hidden sm:flex items-center justify-between w-full max-w-[420px] px-4 py-2 mb-2 rounded-xl border text-xs text-white shrink-0"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#c273ed]" />
          <span className="font-semibold">XuanKen Music - Giao diện Mobile App</span>
        </div>
        <button
          onClick={() => setViewMode('pc')}
          style={{ backgroundColor: 'var(--color-accent)' }}
          className="flex items-center gap-1.5 px-3 py-1 text-white rounded-lg font-medium transition-colors"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Về Web PC</span>
        </button>
      </div>

      {/* Phone Frame on Desktop or Edge-to-Edge on Mobile Phone */}
      <div
        className="w-full h-full sm:max-w-[420px] sm:h-[860px] sm:max-h-[92vh] sm:rounded-[44px] sm:border-[8px] sm:border-zinc-800 sm:ring-1 sm:ring-white/20 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col relative overflow-hidden transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Dynamic Island / Notch on Desktop Mockup */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[var(--bg-header)]">
          <div className="w-24 h-4 bg-black rounded-full border border-zinc-800" />
        </div>

        {/* Mobile App Header */}
        <MobileTopBar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar">{renderTabContent()}</main>

        {/* Mini Player */}
        <MobileMiniPlayer />

        {/* Bottom Tab Navigation */}
        <MobileBottomNav />

        {/* Mobile Full Player */}
        <MobileFullPlayerModal />
      </div>
    </div>
  );
};
