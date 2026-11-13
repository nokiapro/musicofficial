import React, { useState, useRef } from 'react';
import {
  Monitor,
  Smartphone,
  Play,
  Pause,
  Heart,
  FileText,
  CheckCircle,
  Plus,
  Download,
  Share2,
  ListPlus,
  FolderPlus,
  Sparkles,
  Headphones,
  Crown,
  Trash2,
  MoreVertical,
  FolderHeart,
  Shuffle,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { MobileTopBar } from './MobileTopBar';
import { MobileProfileView } from './MobileProfileView';
import { AdminPageView } from '../admin/AdminPageView';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMiniPlayer } from './MobileMiniPlayer';
import { MobileFullPlayerModal } from './MobileFullPlayerModal';
import { FloatingVinylDisc } from './FloatingVinylDisc';
import { CuratedAlbumsView } from '../albums/CuratedAlbumsView';
import { ChatBoxView } from '../chat/ChatBoxView';
import { PlaylistDetailView } from '../playlist/PlaylistDetailView';
import { ArtistBioPageView } from '../artists/ArtistBioPageView';
import { ArtistNames } from '../common/ArtistNames';
import { useAutoScrollToSong } from '../../hooks/useAutoScrollToSong';

export const MobileAppLayout: React.FC = () => {
  const {
    songs,
    currentSong,
    isPlaying,
    activeMobileTab,
    setActiveMobileTab,
    setViewMode,
    playSong,
    togglePlay,
    likedSongIds,
    toggleLike,
    isSongPurchased,
    setSelectedLrcSong,
    setSongToBuy,
    setIsDemoLimitModalOpen,
    userBalance,
    setIsTopUpModalOpen,
    openShareModal,
    openAddToPlaylistModal,
    downloadSong,
    openDownloadModal,
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    createPlaylist,
    deletePlaylist,
    playPlaylist,
    preferredAudioFormat,
    setPreferredAudioFormat,
    currentUser,
    setIsLoginModalOpen,
    setPlaybackSource,
    searchQuery,
    theme,
    allSearchableSongs,
    exclusiveAlbums,
    playAlbumTrack,
    playCustomPool,
  } = useMusic();

  const [librarySubTab, setLibrarySubTab] = useState<'liked' | 'playlists' | 'purchased'>('liked');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPl, setIsCreatingPl] = useState(false);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [menuPositionMap, setMenuPositionMap] = useState<Record<string, 'down' | 'up'>>({});
  const [isPlayMenuOpen, setIsPlayMenuOpen] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const discoverListRef = useRef<HTMLDivElement | null>(null);
  const chartListRef = useRef<HTMLDivElement | null>(null);
  const likedListRef = useRef<HTMLDivElement | null>(null);
  const purchasedListRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!currentUser && activeMobileTab === 'chat') {
      setActiveMobileTab('discover');
    }
  }, [currentUser, activeMobileTab, setActiveMobileTab]);

  // Search filtering across all songs and album tracks (Requirement 3)
  const baseSearchPool = searchQuery.trim() ? (allSearchableSongs || songs) : songs;
  const filteredSongs = searchQuery.trim()
    ? baseSearchPool.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artists.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.album ? s.album.toLowerCase().includes(searchQuery.toLowerCase()) : false)
      )
    : songs;

  // Requirement 14: Hiển thị theo vần ABC ở mobile
  const sortedDiscoverSongs = [...filteredSongs].sort((a, b) =>
    a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
  );

  const handlePlayInOrder = () => {
    const listToPlay = sortedDiscoverSongs.length > 0 ? sortedDiscoverSongs : songs;
    if (listToPlay.length === 0) return;
    playCustomPool(listToPlay, 'Danh sách bài hát', false, listToPlay[0]);
    setScrollTrigger((t) => t + 1);
    setIsPlayMenuOpen(false);
  };

  const handlePlayRandom = () => {
    const listToPlay = sortedDiscoverSongs.length > 0 ? sortedDiscoverSongs : songs;
    if (listToPlay.length === 0) return;
    playCustomPool(listToPlay, 'Danh sách bài hát', true);
    setScrollTrigger((t) => t + 1);
    setIsPlayMenuOpen(false);
  };

  const handleToggleSongMenu = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (activeMenuSongId === songId) {
      setActiveMenuSongId(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dir = spaceBelow >= 240 ? 'down' : 'up';
    setMenuPositionMap((prev) => ({ ...prev, [songId]: dir }));
    setActiveMenuSongId(songId);
  };

  // Requirement 21: 20 songs per page
  const PAGE_SIZE = 20;
  const [discoverPage, setDiscoverPage] = useState(1);
  const [storePage, setStorePage] = useState(1);
  const [chartPage, setChartPage] = useState(1);
  const [likedPage, setLikedPage] = useState(1);
  const [purchasedPage, setPurchasedPage] = useState(1);

  const totalSongs = sortedDiscoverSongs.length;
  const purchasedCount = sortedDiscoverSongs.filter((s) => isSongPurchased(s.id)).length;
  const unpurchasedCount = Math.max(0, totalSongs - purchasedCount);

  // Gộp tất cả bài hát từ catalog và album tuyển chọn (loại bỏ trùng ID) để bài hát đã tim luôn hiển thị trên mọi thiết bị
  const rawMobilePool = allSearchableSongs && allSearchableSongs.length > 0 ? allSearchableSongs : songs;
  const mobileLibraryPool = Array.from(new Map(rawMobilePool.map((s) => [s.id, s])).values());
  const likedSongs = mobileLibraryPool.filter((s) => likedSongIds.includes(s.id));
  const ownedSongs = songs.filter((s) => isSongPurchased(s.id));

  const totalDiscoverPages = Math.max(1, Math.ceil(sortedDiscoverSongs.length / PAGE_SIZE));
  const paginatedDiscoverSongs = sortedDiscoverSongs.slice((discoverPage - 1) * PAGE_SIZE, discoverPage * PAGE_SIZE);

  const totalStorePages = Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  const paginatedStoreSongs = songs.slice((storePage - 1) * PAGE_SIZE, storePage * PAGE_SIZE);

  const rankedSongs = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  const totalChartPages = Math.max(1, Math.ceil(rankedSongs.length / PAGE_SIZE));
  const paginatedChartSongs = rankedSongs.slice((chartPage - 1) * PAGE_SIZE, chartPage * PAGE_SIZE);

  const totalLikedPages = Math.max(1, Math.ceil(likedSongs.length / PAGE_SIZE));
  React.useEffect(() => {
    if (likedPage > totalLikedPages) {
      setLikedPage(totalLikedPages);
    }
  }, [likedPage, totalLikedPages]);
  const paginatedLikedSongs = likedSongs.slice((likedPage - 1) * PAGE_SIZE, likedPage * PAGE_SIZE);

  const totalPurchasedPages = Math.max(1, Math.ceil(ownedSongs.length / PAGE_SIZE));
  React.useEffect(() => {
    if (purchasedPage > totalPurchasedPages) {
      setPurchasedPage(totalPurchasedPages);
    }
  }, [purchasedPage, totalPurchasedPages]);
  const paginatedOwnedSongs = ownedSongs.slice((purchasedPage - 1) * PAGE_SIZE, purchasedPage * PAGE_SIZE);

  useAutoScrollToSong({
    containerRef: discoverListRef,
    songId: currentSong?.id,
    enabled: activeMobileTab === 'discover',
    viewKey: 'mobile-discover',
    paginatedList: sortedDiscoverSongs,
    pageSize: PAGE_SIZE,
    currentPage: discoverPage,
    onPageChange: setDiscoverPage,
    manualTrigger: scrollTrigger,
  });

  useAutoScrollToSong({
    containerRef: chartListRef,
    songId: currentSong?.id,
    enabled: activeMobileTab === 'chart',
    viewKey: 'mobile-chart',
    paginatedList: rankedSongs,
    pageSize: PAGE_SIZE,
    currentPage: chartPage,
    onPageChange: setChartPage,
    manualTrigger: scrollTrigger,
  });

  useAutoScrollToSong({
    containerRef: likedListRef,
    songId: currentSong?.id,
    enabled: activeMobileTab === 'library' && librarySubTab === 'liked',
    viewKey: 'mobile-library-liked',
    paginatedList: likedSongs,
    pageSize: PAGE_SIZE,
    currentPage: likedPage,
    onPageChange: setLikedPage,
    manualTrigger: scrollTrigger,
  });

  useAutoScrollToSong({
    containerRef: purchasedListRef,
    songId: currentSong?.id,
    enabled: activeMobileTab === 'library' && librarySubTab === 'purchased' && Boolean(currentUser),
    viewKey: 'mobile-library-purchased',
    paginatedList: ownedSongs,
    pageSize: PAGE_SIZE,
    currentPage: purchasedPage,
    onPageChange: setPurchasedPage,
    manualTrigger: scrollTrigger,
  });



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
            {/* Header with song count, purchase statistics & circular Play button */}
            <div className="flex items-center justify-between pb-1 gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight truncate">
                  Danh Sách Bài Hát
                </h1>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">
                  Tổng cộng {totalSongs} bài hát • Đã mua: <span className="text-emerald-400 font-bold">{purchasedCount} bài</span> • Chưa mua: <span className="text-amber-400 font-bold">{unpurchasedCount} bài</span>
                </p>
              </div>

              {/* Circular Play button with Play Order / Random Dropdown safely right-aligned */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsPlayMenuOpen(!isPlayMenuOpen)}
                  disabled={songs.length === 0}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 transition-transform active:scale-95 disabled:opacity-40 shrink-0 cursor-pointer"
                  title="Phát nhạc (Theo thứ tự hoặc Ngẫu nhiên)"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5 text-white" />
                </button>

                {isPlayMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setIsPlayMenuOpen(false)}
                    />
                    <div
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      className="absolute right-0 top-12 w-56 rounded-2xl border shadow-2xl p-2 z-50 animate-in zoom-in-95 duration-150 space-y-1"
                    >
                      <button
                        onClick={handlePlayInOrder}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] text-left transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">Phát theo thứ tự</p>
                          <p className="text-[9px] text-[var(--text-secondary)]">Phát lần lượt từ bài đầu</p>
                        </div>
                      </button>

                      <button
                        onClick={handlePlayRandom}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] text-left transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-[#c273ed] flex items-center justify-center shrink-0">
                          <Shuffle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">Phát ngẫu nhiên</p>
                          <p className="text-[9px] text-[var(--text-secondary)]">Xáo trộn bài hát ngẫu nhiên</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>


            {/* MP3 & WAV Audio Format Switcher - 50/50 Grid with crisp visible text */}
            <div className="w-full">
              <div className="grid grid-cols-2 p-1 bg-white/5 rounded-2xl border border-white/10 text-xs shadow-sm w-full">
                <button
                  onClick={() => setPreferredAudioFormat('MP3')}
                  className={`py-2 rounded-xl font-bold transition-all text-center flex items-center justify-center cursor-pointer ${
                    preferredAudioFormat === 'MP3'
                      ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400/40'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Phát tất cả các bài hát ở định dạng MP3 (320kbps)"
                >
                  <span>MP3</span>
                </button>
                <button
                  onClick={() => setPreferredAudioFormat('WAV')}
                  className={`py-2 rounded-xl font-bold transition-all text-center flex items-center justify-center cursor-pointer ${
                    preferredAudioFormat === 'WAV'
                      ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/40'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Phát tất cả các bài hát ở định dạng WAV chất lượng cao"
                >
                  <span>WAV</span>
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
            <div ref={discoverListRef} className="space-y-2">
              {paginatedDiscoverSongs.map((song, idx) => {
                const isCurrent = currentSong ? currentSong.id === song.id : false;
                const isPurchased = isSongPurchased(song.id);
                const isLiked = likedSongIds.includes(song.id);

                return (
                  <div
                    key={song.id}
                    data-song-id={song.id}
                    onClick={() => {
                      if (song.isAlbumTrack) {
                        const found = exclusiveAlbums.find((a) => a.id === song.albumId || a.title === song.album);
                        if (found) playAlbumTrack(song as any, found);
                        else playSong(song);
                      } else {
                        setPlaybackSource('Danh sách bài hát');
                        if (isCurrent) togglePlay();
                        else playSong(song);
                      }
                    }}
                    className={`relative p-2.5 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-[#9b4de0]/20 border-[#9b4de0]/50 shadow-md'
                        : 'bg-white/5 border-white/5 active:bg-white/10'
                    }`}
                  >
                    {/* Left Info: STT, Cover, Title, Artist */}
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <span className="w-5 text-center text-sm font-bold text-white/50 font-so">
                        {(discoverPage - 1) * PAGE_SIZE + idx + 1}
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
                        <div className="text-[10px] text-white/60 truncate mt-0.5">
                          <ArtistNames artists={song.artists} linkClassName="text-white/60 hover:text-purple-300" />
                        </div>
                      </div>
                    </div>

                    {/* Right: 3-dots Menu Button */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleSongMenu(e, song.id)}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          activeMenuSongId === song.id
                            ? 'bg-[#9b4de0] text-white shadow-md'
                            : 'hover:bg-white/10 text-white/60 hover:text-white'
                        }`}
                        title="Tùy chọn bài hát"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* 3-dots Popup Dropdown Menu with Smart Auto-Positioning (Requirement 3 & 5 & 8) */}
                      {activeMenuSongId === song.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30 bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuSongId(null);
                            }}
                          />
                          <div
                            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            className={`absolute right-0 ${
                              menuPositionMap[song.id] === 'up'
                                ? 'bottom-9 origin-bottom-right'
                                : 'top-9 origin-top-right'
                            } w-48 border rounded-2xl shadow-2xl p-1.5 z-40 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150`}
                          >
                            {/* 1. Yêu thích (Tim) */}
                            <button
                              onClick={() => {
                                toggleLike(song.id);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
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
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#c273ed]" />
                              <span>Xem lời bài hát (LRC)</span>
                            </button>

                            {/* 3. Thêm vào playlist / Đã thêm vào playlist (Requirement 6) */}
                            {playlists.some((pl) => Array.isArray(pl.songIds) && pl.songIds.includes(song.id)) ? (
                              <button
                                onClick={() => {
                                  openAddToPlaylistModal(song);
                                  setActiveMenuSongId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors text-emerald-400 group cursor-pointer"
                                title="Bài hát đã có trong danh sách phát"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="font-semibold text-emerald-400">Đã thêm vào playlist</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  openAddToPlaylistModal(song);
                                  setActiveMenuSongId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
                              >
                                <ListPlus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>Thêm vào playlist</span>
                              </button>
                            )}

                            {/* 4. Chia sẻ link bài hát */}
                            <button
                              onClick={() => {
                                openShareModal(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
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
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{isPurchased ? 'Tải bài hát về máy' : 'Mua & Tải bài hát'}</span>
                            </button>
                          </div>
                        </>
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
                      <div className="text-[10px] text-white/50 truncate mt-0.5">
                        <ArtistNames artists={song.artists} linkClassName="text-white/50 hover:text-purple-300" />
                      </div>
                      {/* Item 10: Cho chữ đ cùng 1 hàng đừng xuống dòng */}
                      <p className="text-xs font-bold text-amber-400 mt-1 whitespace-nowrap">
                        {isPurchased ? (
                          <span className="text-emerald-400 font-extrabold whitespace-nowrap">ĐÃ SỞ HỮU</span>
                        ) : (
                          <span className="whitespace-nowrap font-mono">
                            {(song.price ?? 20000).toLocaleString('vi-VN')}&nbsp;đ
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isPurchased ? (
                        <button
                          onClick={() => openDownloadModal(song)}
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center justify-center transition-colors cursor-pointer"
                          title="Tải bài hát"
                        >
                          <Download className="w-4 h-4" />
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

            <div ref={chartListRef} className="space-y-2">
              {paginatedChartSongs.map((song, i) => {
                const rank = (chartPage - 1) * PAGE_SIZE + i + 1;
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    data-song-id={song.id}
                    onClick={() => {
                      setPlaybackSource('#xuankenchart');
                      playSong(song);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#9b4de0]/20 border-purple-500/50 shadow'
                        : 'bg-white/5 border-white/5 active:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-black text-xs shrink-0 font-so ${
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

                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-purple-900/40 shrink-0 relative">
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
                        <div className="text-[10px] text-white/50 truncate">
                          <ArtistNames artists={song.artists} linkClassName="text-white/50 hover:text-purple-300" />
                        </div>
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

      case 'library': {
        const userPlaylists = playlists.filter((p) => !p.userId || (currentUser && p.userId === currentUser.uid));

        return (
          <div className="space-y-3 px-3 pb-32 pt-2 select-none">
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
                onClick={() => {
                  setLibrarySubTab('playlists');
                  setSelectedPlaylist(null);
                }}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all whitespace-nowrap text-center ${
                  librarySubTab === 'playlists'
                    ? 'bg-[#9b4de0] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Playlists ({userPlaylists.length})
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
              <div ref={likedListRef} className="space-y-2">
                {!currentUser && likedSongs.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-600/15 border border-purple-500/30 text-[11px] text-purple-200 flex items-center justify-between gap-2 shadow-sm">
                    <span>💡 Đăng nhập để đồng bộ bài hát yêu thích sang thiết bị khác!</span>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] shrink-0"
                    >
                      Đăng nhập
                    </button>
                  </div>
                )}

                {likedSongs.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                    Chưa có bài hát yêu thích. Hãy bấm icon tim để lưu bài hát!
                  </div>
                ) : (
                  paginatedLikedSongs.map((song) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                    <div
                      key={song.id}
                      data-song-id={song.id}
                      onClick={() => {
                        setPlaybackSource('Thư viện cá nhân');
                        playSong(song);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border active:bg-white/10 cursor-pointer gap-2.5 ${
                        isCurrent
                          ? 'bg-[#9b4de0]/20 border-[#9b4de0]/50'
                          : 'bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-900 shadow relative">
                          {song.coverImage ? (
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center text-[10px] font-bold text-white/60 ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                          >
                            XK
                          </div>
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{song.title}</p>
                          <div className="text-[10px] text-white/50 truncate mt-0.5">
                            <ArtistNames artists={song.artists} linkClassName="text-white/50 hover:text-purple-300" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                    );
                  })
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
            {librarySubTab === 'playlists' && !currentUser && (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center select-none bg-white/5 rounded-2xl border border-white/5">
                <FolderPlus className="w-8 h-8 text-purple-400 mb-2" />
                <p className="text-sm font-bold text-white mb-1">Playlist Cá Nhân</p>
                <p className="text-xs text-white/50 max-w-xs mb-3">Đăng nhập để tạo và lưu danh sách bài hát yêu thích.</p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow cursor-pointer active:scale-95"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )}

            {librarySubTab === 'playlists' && currentUser && selectedPlaylist && (
              <PlaylistDetailView playlist={selectedPlaylist} onBack={() => setSelectedPlaylist(null)} />
            )}

            {librarySubTab === 'playlists' && currentUser && !selectedPlaylist && (
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

                {userPlaylists.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                    Chưa có playlist nào. Hãy bấm "+ Tạo mới" để tạo danh sách phát riêng!
                  </div>
                ) : (
                  userPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div
                        className="truncate min-w-0 flex-1 cursor-pointer active:opacity-70"
                        onClick={() => setSelectedPlaylist(pl)}
                        title="Xem danh sách bài hát trong playlist"
                      >
                        <h4 className="text-xs font-bold text-white truncate hover:text-[#c273ed]">{pl.name}</h4>
                        <p className="text-[10px] text-white/50">{Array.isArray(pl.songIds) ? pl.songIds.length : 0} bài hát &bull; Chạm để xem</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Requirement 3: Phát theo thứ tự và phát random */}
                        <button
                          onClick={() => playPlaylist(pl, 'order')}
                          disabled={!Array.isArray(pl.songIds) || pl.songIds.length === 0}
                          className="px-2.5 py-1 rounded-lg bg-[#9b4de0] hover:bg-[#8539c9] text-white font-bold text-[10px] flex items-center gap-1 disabled:opacity-30 active:scale-95 transition-all shadow-sm cursor-pointer"
                          title="Phát theo thứ tự"
                        >
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                          <span>Thứ tự</span>
                        </button>
                        <button
                          onClick={() => playPlaylist(pl, 'shuffle')}
                          disabled={!Array.isArray(pl.songIds) || pl.songIds.length === 0}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-[#c273ed] hover:text-white font-bold text-[10px] flex items-center gap-1 disabled:opacity-30 active:scale-95 transition-all shadow-sm cursor-pointer"
                          title="Phát ngẫu nhiên"
                        >
                          <Shuffle className="w-3 h-3" />
                          <span>Random</span>
                        </button>
                        <button
                          onClick={() => deletePlaylist(pl.id)}
                          className="p-1 text-white/40 hover:text-red-400 cursor-pointer"
                          title="Xóa playlist"
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
            {librarySubTab === 'purchased' && !currentUser && (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center select-none bg-white/5 rounded-2xl border border-white/5">
                <FolderHeart className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-white mb-1">Kho Nhạc Bản Quyền</p>
                <p className="text-xs text-white/50 max-w-xs mb-3">Đăng nhập tài khoản để xem các bài hát đã mua của bạn.</p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer active:scale-95"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )}

            {librarySubTab === 'purchased' && currentUser && (
              <div ref={purchasedListRef} className="space-y-2">
                {ownedSongs.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                    Chưa có bài hát bản quyền nào được mua.
                  </div>
                ) : (
                  paginatedOwnedSongs.map((song) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                    <div
                      key={song.id}
                      data-song-id={song.id}
                      onClick={() => {
                        setPlaybackSource('Thư viện cá nhân');
                        playSong(song);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer gap-2.5 ${
                        isCurrent
                          ? 'bg-[#9b4de0]/20 border-[#9b4de0]/50'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-900 shadow relative">
                          {song.coverImage ? (
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center text-[10px] font-bold text-white/60 ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                          >
                            XK
                          </div>
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{song.title}</p>
                          <div className="text-[10px] text-white/50 truncate mt-0.5">
                            <ArtistNames artists={song.artists} linkClassName="text-white/50 hover:text-purple-300" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {song.audioFormat} Full
                        </span>
                        <button
                          onClick={() => downloadSong(song, song.audioFormat)}
                          className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow transition-colors cursor-pointer"
                          title="Tải về máy"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })
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
      }

      case 'admin':
        return (
          <div className="pb-32 px-1 sm:px-3 pt-2 max-w-6xl mx-auto">
            <AdminPageView />
          </div>
        );

      case 'albums':
        return (
          <div className="space-y-3 px-3 pb-32 pt-2 select-none">
            <CuratedAlbumsView />
          </div>
        );

      case 'artists':
        return (
          <div className="space-y-3 px-3 pb-32 pt-2 select-none">
            <ArtistBioPageView />
          </div>
        );

      case 'chat':
        return (
          <div className="pb-32 px-2 pt-2 max-w-6xl mx-auto">
            <ChatBoxView />
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
      data-theme={theme}
      className="h-[100dvh] w-full text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-4 transition-colors duration-300 overflow-hidden font-['Roboto_Condensed']"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Top Banner on Desktop when viewing Mobile App mode */}
      <div
        className="hidden sm:flex items-center justify-between w-full max-w-[460px] px-4 py-2 mb-2 rounded-xl border text-xs text-[var(--text-primary)] shrink-0"
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
        data-theme={theme}
        className="w-full h-full sm:max-w-[460px] sm:h-[860px] sm:max-h-[92vh] sm:rounded-[44px] sm:border-[8px] sm:border-zinc-800 sm:ring-1 sm:ring-white/20 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col relative overflow-hidden transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {/* Dynamic Island / Notch on Desktop Mockup */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[var(--bg-header)]">
          <div className="w-24 h-4 bg-black rounded-full border border-zinc-800" />
        </div>

        {/* Mobile App Header */}
        <MobileTopBar />

        {/* Main Content Area: Chat Box has overflow-hidden and fills height */}
        <main
          className={`flex-1 min-h-0 flex flex-col ${
            activeMobileTab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar'
          }`}
        >
          {renderTabContent()}
        </main>

        {/* Mini Player: Hide bottom player when in chat box (Item 8) */}
        {activeMobileTab !== 'chat' && <MobileMiniPlayer />}

        {/* Floating Draggable Vinyl Disc when in Chat Box (Item 1: lơ lửng khắp màn hình) */}
        {activeMobileTab === 'chat' && currentSong && <FloatingVinylDisc />}

        {/* Bottom Tab Navigation */}
        <MobileBottomNav />

        {/* Mobile Full Player */}
        <MobileFullPlayerModal />
      </div>
    </div>
  );
};
