import React, { useState, useRef, useEffect } from 'react';
import {
  Disc3,
  Play,
  Pause,
  Shuffle,
  Share2,
  FileText,
  Heart,
  MoreVertical,
  ListPlus,
  Download,
  CheckCircle,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ExclusiveAlbum, AlbumSong, Song } from '../../types/music';
import { ArtistNames } from '../common/ArtistNames';
import { useAutoScrollToSong } from '../../hooks/useAutoScrollToSong';

export const CuratedAlbumsView: React.FC = () => {
  const {
    exclusiveAlbums,
    selectedAlbum,
    setSelectedAlbum,
    playAlbumTrack,
    currentSong,
    isPlaying,
    togglePlay,
    setSelectedLrcSong,
    likedSongIds,
    likedAlbumIds,
    toggleLike,
    toggleLikeAlbum,
    openAddToPlaylistModal,
    openDownloadModal,
    openShareModal,
    isShuffle,
    playlists,
  } = useMusic();

  const [activeSongMenuId, setActiveSongMenuId] = useState<string | null>(null);
  const [activeAlbumMenuId, setActiveAlbumMenuId] = useState<string | null>(null);
  const [albumToast, setAlbumToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const albumMenuRef = useRef<HTMLDivElement | null>(null);
  const albumSongsListRef = useRef<HTMLDivElement | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  useAutoScrollToSong({
    containerRef: albumSongsListRef,
    songId: currentSong?.id,
    enabled: Boolean(selectedAlbum),
    viewKey: selectedAlbum?.id || null,
    manualTrigger: scrollTrigger,
    itemCount: Array.isArray(selectedAlbum?.songs) ? selectedAlbum.songs.length : 0,
  });

  // Close 3-dots popup on click outside (PC & Mobile - Requirement 7)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveSongMenuId(null);
      }
      if (albumMenuRef.current && !albumMenuRef.current.contains(e.target as Node)) {
        setActiveAlbumMenuId(null);
      }
    };
    if (activeSongMenuId || activeAlbumMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeSongMenuId, activeAlbumMenuId]);

  // Convert AlbumSong to Song object for global handlers
  const convertAlbumSongToSong = (song: AlbumSong, album: ExclusiveAlbum): Song => ({
    id: song.id,
    title: song.title,
    artists: song.artists,
    duration: song.duration || 210,
    audioFormat: 'MP3',
    coverImage: song.coverImage || album.coverImage,
    demoUrl: song.mp3Url || song.wavUrl,
    mp3Url: song.mp3Url,
    wavUrl: song.wavUrl,
    price: 0,
    isPurchased: true,
    lyrics: song.lyrics || [],
    lrcRaw: song.lrcRaw,
    album: album.title,
    isAlbumTrack: true,
    albumId: album.id,
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // If viewing a single album
  if (selectedAlbum) {
    const rawSongsList = Array.isArray(selectedAlbum.songs) ? selectedAlbum.songs : [];
    // Requirement 15: danh sách bài hát trong album nhạc trẻ hay được sắp xếp theo vần ABC
    const isNhacTreAlbum =
      selectedAlbum.title.toLowerCase().includes('nhạc trẻ') ||
      (selectedAlbum.genre && selectedAlbum.genre.toLowerCase().includes('nhạc trẻ')) ||
      selectedAlbum.title.toLowerCase().includes('tuyển tập');
    const albumSongsList = isNhacTreAlbum
      ? [...rawSongsList].sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }))
      : rawSongsList;

    const totalDurationSecs = albumSongsList.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = Math.floor(totalDurationSecs / 3600);
    const totalMins = Math.floor((totalDurationSecs % 3600) / 60);
    const durationText = totalHours > 0
      ? `${totalHours} giờ ${totalMins} phút`
      : `${totalMins} phút`;

    const isCurrentAlbumActive = albumSongsList.some((s) => s.id === currentSong?.id);
    const isCurrentAlbumSpinning = isPlaying && isCurrentAlbumActive;
    const isAlbumShuffleActive = isCurrentAlbumActive && isShuffle;

    const activeSong = albumSongsList.find((s) => s.id === currentSong?.id) || (albumSongsList.length > 0 ? albumSongsList[0] : null);
    const displaySongImage = (isCurrentAlbumActive && currentSong?.coverImage)
      || activeSong?.coverImage
      || selectedAlbum.coverImage
      || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

    return (
      <div className="w-full max-w-full space-y-6 pb-24 select-none animate-in fade-in duration-200">
        {/* Album Detail Layout */}
        <div className="w-full max-w-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
          {/* CỘT TRÁI (Sticky): Đĩa tròn quay 360 độ + Thông tin + Nút phát */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-4 flex flex-col items-center text-center self-start">
            <div className="relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-full blur-2xl opacity-45 pointer-events-none transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 55%, transparent) 0%, transparent 72%)',
                  opacity: isCurrentAlbumSpinning ? 0.65 : 0.35,
                }}
              />
              <div
                className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.65)] ring-4 ring-white/15 select-none group shrink-0"
                style={{
                  animation: 'spin 20s linear infinite',
                  animationPlayState: isCurrentAlbumSpinning ? 'running' : 'paused',
                }}
              >
                <img
                  src={displaySongImage}
                  alt={activeSong?.title || selectedAlbum.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = selectedAlbum.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
            </div>

            {/* Thông tin Album */}
            <div className="mt-5 w-full px-2">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight line-clamp-2">
                {selectedAlbum.title}
              </h1>
              <p className="text-xs text-white/55 mt-1 tabular-nums">
                Cập nhật: {selectedAlbum.releaseYear ? `Năm ${selectedAlbum.releaseYear}` : '2026'}
              </p>
              <div className="text-xs font-semibold text-white/75 mt-1 line-clamp-1">
                <ArtistNames artists={selectedAlbum.artist} linkClassName="text-white/75 hover:text-white transition-colors" />
              </div>
              <p className="text-xs text-white/55 mt-1.5 font-medium tabular-nums">
                {albumSongsList.length} bài hát · {durationText}
              </p>

              {/* Nút Tiếp Tục Phát / Phát Tất Cả */}
              <div className="flex flex-col items-center gap-3 mt-4">
                <button
                  disabled={albumSongsList.length === 0}
                  onClick={() => {
                    if (albumSongsList.length === 0) return;
                    if (isCurrentAlbumActive) {
                      togglePlay();
                    } else {
                      playAlbumTrack(albumSongsList[0], selectedAlbum, false);
                    }
                  }}
                  className="accent-glow-btn w-full max-w-[220px] py-2.5 px-6 rounded-full active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                >
                  {isCurrentAlbumSpinning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>TẠM DỪNG</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>{isCurrentAlbumActive ? 'TIẾP TỤC PHÁT' : 'PHÁT TẤT CẢ'}</span>
                    </>
                  )}
                </button>

                {/* Hàng nút phụ: Yêu thích Album + Nút Random sáng đèn */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLikeAlbum(selectedAlbum.id)}
                    className={`w-9 h-9 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/[0.16] flex items-center justify-center transition-colors cursor-pointer ${
                      likedAlbumIds.includes(selectedAlbum.id) ? 'text-rose-500 border-rose-500/30 bg-rose-500/15' : 'text-white/75 hover:text-white'
                    }`}
                    title="Yêu thích album"
                  >
                    <Heart className={`w-4 h-4 ${likedAlbumIds.includes(selectedAlbum.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Sáng đèn khi random trong album này, và chỉ random trong album này */}
                  <button
                    disabled={albumSongsList.length === 0}
                    onClick={() => {
                      if (albumSongsList.length === 0) return;
                      const randIdx = Math.floor(Math.random() * albumSongsList.length);
                      playAlbumTrack(albumSongsList[randIdx], selectedAlbum, true);
                      setScrollTrigger((t) => t + 1);
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
                      isAlbumShuffleActive
                        ? 'accent-glow-btn ring-2 ring-white/50 text-white font-bold'
                        : 'bg-white/[0.08] border border-white/10 hover:bg-white/[0.16] text-white/75 hover:text-white'
                    }`}
                    title={isAlbumShuffleActive ? 'Đang bật random trong album này' : 'Phát ngẫu nhiên trong album này'}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Danh sách bài hát */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Lời tựa */}
            <div className="glass-panel p-4 rounded-2xl text-xs text-white/80 leading-relaxed">
              <span style={{ color: 'var(--color-accent)' }} className="font-bold">Lời tựa: </span>
              {selectedAlbum.description ||
                `Tuyển tập các ca khúc độc quyền đặc sắc nhất của ${selectedAlbum.artist}. Dữ liệu được chọn lọc và thưởng thức trọn vẹn không giới hạn trên XuanKen Music.`}
            </div>

            {/* Bảng danh sách bài hát */}
            <div className="glass-panel w-full rounded-2xl relative overflow-visible">
              {/* Tiêu đề cột:
                  - Trên Mobile (Requirement 6): Xóa thời gian, chuyển tim vào 3 gạch dọc
                  - Trên PC: Hiển thị đầy đủ
              */}
              <div className="flex items-center px-3 sm:px-4 py-2.5 text-xs font-bold text-white/50 border-b border-white/10 uppercase tracking-wider select-none">
                <div className="w-8 sm:w-10 text-center shrink-0 text-white/40">
                  #
                </div>
                <div className="flex-1 min-w-0 pl-3 sm:pl-4 text-left">
                  BÀI HÁT
                </div>
                <div className="hidden md:block w-44 lg:w-56 text-left shrink-0 truncate px-2">
                  ALBUM
                </div>
                {/* Cột TIM: ẩn trên mobile, hiện trên sm/md */}
                <div className="hidden sm:flex w-14 sm:w-16 items-center justify-center shrink-0">
                  TIM
                </div>
                {/* Cột THỜI GIAN: ẩn trên mobile (Requirement 6), hiện trên sm/md */}
                <div className="hidden sm:flex w-16 sm:w-20 items-center justify-center shrink-0">
                  THỜI GIAN
                </div>
                <div className="w-12 sm:w-20 text-center shrink-0">
                  THÊM
                </div>
              </div>

              {/* Danh sách các bài hát trong album */}
              {albumSongsList.length === 0 ? (
                <div className="p-12 text-center text-white/40 text-xs">
                  Album này chưa có bài hát nào.
                </div>
              ) : (
                <div ref={albumSongsListRef} className="divide-y divide-white/5">
                  {albumSongsList.map((song, idx) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isPlayingThis = isCurrent && isPlaying;
                    const isLiked = likedSongIds.includes(song.id);
                    const songObj = convertAlbumSongToSong(song, selectedAlbum);
                    const isMenuOpen = activeSongMenuId === song.id;
                    const isAlreadyInPlaylist = playlists.some((p) => Array.isArray(p.songIds) && p.songIds.includes(song.id));

                    return (
                      <div
                        key={song.id}
                        data-song-id={song.id}
                        onClick={() => playAlbumTrack(song, selectedAlbum)}
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
                        {/* Cột 1: # STT */}
                        <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                          <div className="relative w-7 h-7 flex items-center justify-center">
                            {isPlayingThis ? (
                              <div className="flex items-end justify-center gap-0.5 h-4">
                                <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-1" />
                                <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-2" />
                                <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-3" />
                              </div>
                            ) : (
                              <>
                                <span className="text-xs sm:text-sm font-bold text-white/45 group-hover:opacity-0 transition-opacity font-mono tabular-nums">
                                  {(idx + 1).toString().padStart(2, '0')}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isCurrent) {
                                      togglePlay();
                                    } else {
                                      playAlbumTrack(song, selectedAlbum);
                                    }
                                  }}
                                  style={{ backgroundColor: 'var(--color-accent)' }}
                                  className="absolute inset-0 m-auto flex items-center justify-center w-6 h-6 rounded-full text-white shadow-md opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity cursor-pointer"
                                >
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Cột 2: BÀI HÁT (Thumbnail + Title + Artists) */}
                        <div className="flex-1 min-w-0 flex items-center gap-3 pl-3 sm:pl-4 pr-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-sm">
                            <img
                              src={song.coverImage || selectedAlbum.coverImage}
                              alt={song.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = selectedAlbum.coverImage;
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

                        {/* Cột 3: ALBUM (desktop only) */}
                        <div className="hidden md:block w-44 lg:w-56 text-left text-xs text-white/50 truncate shrink-0 px-2">
                          {selectedAlbum.title}
                        </div>

                        {/* Cột 4: TIM (Ẩn trên mobile, hiển thị trên desktop) */}
                        <div className="hidden sm:flex w-14 sm:w-16 items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleLike(song.id)}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              isLiked ? 'text-rose-500' : 'text-white/30 hover:text-rose-400'
                            }`}
                            title={isLiked ? 'Bỏ thích bài hát' : 'Thích bài hát này'}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Cột 5: THỜI GIAN (Ẩn trên mobile, hiển thị trên desktop) */}
                        <div className="hidden sm:flex w-16 sm:w-20 items-center justify-center shrink-0 text-xs font-mono tabular-nums text-white/55">
                          {formatSeconds(song.duration || 0)}
                        </div>

                        {/* Cột 6: THAO TÁC (3 gạch dọc / MoreVertical menu) */}
                        <div className="w-12 sm:w-20 flex items-center justify-center shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveSongMenuId(isMenuOpen ? null : song.id)}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              isMenuOpen ? 'bg-white/20 text-white' : 'text-white/45 hover:text-white hover:bg-white/10'
                            }`}
                            title="Thao tác"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Menu Tùy Chọn Popup */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setActiveSongMenuId(null)}
                              />
                              <div
                                ref={menuRef}
                                className="glass-panel absolute right-0 top-full mt-1.5 w-52 rounded-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 space-y-0.5 origin-top-right shadow-2xl"
                              >
                                {/* Requirement 6: Yêu thích / Thả tim bài hát trong 3 gạch dọc */}
                                <button
                                  onClick={() => {
                                    toggleLike(song.id);
                                    setActiveSongMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left font-medium cursor-pointer"
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-rose-400'}`} />
                                  <span>{isLiked ? 'Bỏ thích bài hát' : 'Thả tim bài hát'}</span>
                                </button>

                                {/* Thêm vào playlist */}
                                <button
                                  onClick={() => {
                                    setActiveSongMenuId(null);
                                    openAddToPlaylistModal(songObj);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left font-medium cursor-pointer"
                                >
                                  {isAlreadyInPlaylist ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-emerald-400 font-semibold">Đã có trong playlist</span>
                                    </>
                                  ) : (
                                    <>
                                      <ListPlus className="w-3.5 h-3.5 text-[#c273ed]" />
                                      <span>Thêm vào playlist</span>
                                    </>
                                  )}
                                </button>

                                {/* Chia sẻ bài hát */}
                                <button
                                  onClick={() => {
                                    setActiveSongMenuId(null);
                                    openShareModal(songObj);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left font-medium cursor-pointer"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Chia sẻ bài hát</span>
                                </button>

                                {/* Tải bài hát (Requirement 8: Chỉ 128kbps) */}
                                <button
                                  onClick={() => {
                                    setActiveSongMenuId(null);
                                    openDownloadModal(songObj);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left font-medium cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Tải bài hát (128kbps)</span>
                                </button>

                                {/* Xem lời bài hát */}
                                {song.lrcRaw && (
                                  <button
                                    onClick={() => {
                                      setActiveSongMenuId(null);
                                      setSelectedLrcSong(songObj);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left font-medium cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Xem lời (LRC)</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
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
  }

  // =========================================================================
  // Requirement 5:
  // - Xóa dòng chữ "Tuyển tập những Album nhạc độc quyền đặc sắc, không trùng lặp danh sách ngoài"
  // - Xóa phần tạo và quản lý album admin
  // - Xóa tùy chọn tất cả thể loại và vpop ballad
  // - Xóa tìm kiếm trong đây
  // - HIỂN THỊ ALBUM NHẠC HAY THEO DẠNG LIST (THAY VÌ GRID)
  // =========================================================================
  return (
    <div className="w-full max-w-full space-y-6 pb-36 select-none animate-in fade-in duration-200">
      {/* Top Banner Header: Clean Title only */}
      <div className="border-b border-white/[0.08] pb-4 w-full">
        <div className="flex items-center gap-3.5">
          <div className="accent-glow-btn w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0">
            <Disc3 className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Album Nhạc Hay
            </h1>
            <p className="text-xs text-white/55 mt-0.5 tabular-nums">
              Tổng hợp {exclusiveAlbums.length} Album tuyển chọn đặc sắc
            </p>
          </div>
        </div>
      </div>

      {/* Album List View (Full width on PC & Mobile) */}
      {exclusiveAlbums.length === 0 ? (
        <div className="glass-panel w-full p-12 text-center rounded-2xl text-white/55 text-xs space-y-2">
          <p>Chưa có Album nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="glass-panel w-full rounded-2xl relative overflow-visible">
          <div className="w-full divide-y divide-white/[0.06]">
            {exclusiveAlbums.map((album, idx) => {
              const isAlbumPlaying = isPlaying && currentSong?.album === album.title;
              const songCount = Array.isArray(album.songs) ? album.songs.length : 0;

              return (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className={`w-full p-4 sm:p-5 hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-between gap-4 group relative first:rounded-t-2xl last:rounded-b-2xl ${
                    activeAlbumMenuId === album.id ? 'z-50' : 'z-10'
                  }`}
                >
                  {/* Left: STT + Vinyl Thumbnail + Title & Artist */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="w-6 text-center font-bold text-xs sm:text-sm text-white/45 group-hover:text-white shrink-0 font-mono tabular-nums">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>

                    {/* Album Cover Thumbnail */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-md">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />
                      {isAlbumPlaying && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-4">
                            <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-1 rounded-full animate-soundwave-1" />
                            <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-1 rounded-full animate-soundwave-2" />
                            <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-1 rounded-full animate-soundwave-3" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Album Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm sm:text-base font-bold text-white group-hover:text-white transition-colors truncate">
                          {album.title}
                        </h3>
                        {album.genre && (
                          <span className="hidden sm:inline-block text-[11px] font-medium text-white/50 shrink-0">
                            · {album.genre}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 truncate mt-0.5 tabular-nums">
                        {album.artist} · <span style={{ color: 'var(--color-accent)' }} className="font-semibold">{songCount} bài hát</span>
                      </p>
                      {album.description && (
                        <p className="hidden md:block text-[11px] text-white/45 truncate mt-1">
                          {album.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: 3 Vertical Dots Menu */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveAlbumMenuId((prev) => (prev === album.id ? null : album.id))}
                      className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="Tùy chọn album"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Dropdown Menu - Opens downward & leftward */}
                    {activeAlbumMenuId === album.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-transparent"
                          onClick={() => setActiveAlbumMenuId(null)}
                        />
                        <div
                          ref={albumMenuRef}
                          className="glass-panel absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-xs origin-top-right space-y-0.5"
                        >
                        {/* 1. Chạy theo thứ tự */}
                        <button
                          type="button"
                          onClick={() => {
                            const sList = Array.isArray(album.songs) ? album.songs : [];
                            if (sList.length > 0) {
                              playAlbumTrack(sList[0], album, false);
                            }
                            setActiveAlbumMenuId(null);
                          }}
                          disabled={songCount === 0}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-[#c273ed]" />
                          <span>Chạy theo thứ tự</span>
                        </button>

                        {/* 2. Chạy random */}
                        <button
                          type="button"
                          onClick={() => {
                            const sList = Array.isArray(album.songs) ? album.songs : [];
                            if (sList.length > 0) {
                              const randIdx = Math.floor(Math.random() * sList.length);
                              playAlbumTrack(sList[randIdx], album, true);
                            }
                            setActiveAlbumMenuId(null);
                          }}
                          disabled={songCount === 0}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Chạy random</span>
                        </button>

                        {/* 3. Tim album */}
                        <button
                          type="button"
                          onClick={() => {
                            const isLiked = likedAlbumIds.includes(album.id);
                            toggleLikeAlbum(album.id);
                            setAlbumToast(
                              isLiked ? `Đã bỏ tim album "${album.title}"` : `Đã thả tim album "${album.title}"! ❤️`
                            );
                            setTimeout(() => setAlbumToast(null), 2500);
                            setActiveAlbumMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white font-semibold transition-colors cursor-pointer"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              likedAlbumIds.includes(album.id)
                                ? 'text-red-500 fill-red-500'
                                : 'text-red-400'
                            }`}
                          />
                          <span>{likedAlbumIds.includes(album.id) ? 'Đã thích album' : 'Tim album'}</span>
                        </button>

                        {/* 4. Chia sẻ album */}
                        <button
                          type="button"
                          onClick={() => {
                            const shareUrl = `${window.location.origin}?album=${encodeURIComponent(album.id)}`;
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(shareUrl).then(() => {
                                setAlbumToast(`Đã sao chép liên kết album "${album.title}"!`);
                                setTimeout(() => setAlbumToast(null), 2500);
                              });
                            }
                            setActiveAlbumMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white font-semibold transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Chia sẻ album</span>
                        </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Album Toast notification */}
      {albumToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-zinc-900 border border-white/20 text-white font-bold text-xs shadow-2xl animate-in fade-in zoom-in-95 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{albumToast}</span>
        </div>
      )}
    </div>
  );
};
