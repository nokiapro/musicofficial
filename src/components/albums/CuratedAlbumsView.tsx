import React, { useState, useRef, useEffect } from 'react';
import {
  Disc3,
  Play,
  Pause,
  Shuffle,
  Music2,
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
    toggleLike,
    openAddToPlaylistModal,
    openDownloadModal,
    openShareModal,
    isShuffle,
    toggleShuffle,
    playlists,
  } = useMusic();

  const [activeSongMenuId, setActiveSongMenuId] = useState<string | null>(null);
  const [isAlbumLiked, setIsAlbumLiked] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close 3-dots popup on click outside (PC & Mobile - Requirement 7)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveSongMenuId(null);
      }
    };
    if (activeSongMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeSongMenuId]);

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
    const albumSongsList = Array.isArray(selectedAlbum.songs) ? selectedAlbum.songs : [];
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
      <div className="space-y-6 pb-24 select-none font-['Roboto_Condensed'] animate-in fade-in duration-200">
        {/* Album Detail Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start relative">
          {/* CỘT TRÁI (Sticky): Đĩa tròn quay 360 độ + Thông tin + Nút phát */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-4 flex flex-col items-center text-center self-start">
            <div
              className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)] border-4 border-white/20 select-none group shrink-0"
              style={{
                animation: 'spin 20s linear infinite',
                animationPlayState: isCurrentAlbumSpinning ? 'running' : 'paused',
              }}
            >
              <img
                src={displaySongImage}
                alt={activeSong?.title || selectedAlbum.title}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.src = selectedAlbum.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Thông tin Album */}
            <div className="mt-4 w-full px-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase line-clamp-2">
                {selectedAlbum.title}
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Cập nhật: {selectedAlbum.releaseYear ? `Năm ${selectedAlbum.releaseYear}` : '2026'}
              </p>
              <p className="text-xs font-semibold text-white/70 mt-0.5 line-clamp-1">
                {selectedAlbum.artist}
              </p>
              <p className="text-xs text-white/50 mt-1.5 font-medium">
                {albumSongsList.length} bài hát • {durationText}
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
                      playAlbumTrack(albumSongsList[0], selectedAlbum);
                    }
                  }}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="w-full max-w-[220px] py-2.5 px-6 rounded-full hover:opacity-90 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-40"
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

                {/* Hàng nút phụ: Yêu thích Album + Nút Random sáng đèn (Requirement 2) */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAlbumLiked(!isAlbumLiked)}
                    className={`w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer ${
                      isAlbumLiked ? 'text-rose-500' : 'text-white/70 hover:text-white'
                    }`}
                    title="Yêu thích album"
                  >
                    <Heart className={`w-4 h-4 ${isAlbumLiked ? 'fill-current' : ''}`} />
                  </button>

                  {/* Requirement 2: Sáng đèn khi random trong album này, và chỉ random trong album này */}
                  <button
                    disabled={albumSongsList.length === 0}
                    onClick={() => {
                      if (albumSongsList.length === 0) return;
                      if (isCurrentAlbumActive) {
                        toggleShuffle();
                      } else {
                        const randIdx = Math.floor(Math.random() * albumSongsList.length);
                        playAlbumTrack(albumSongsList[randIdx], selectedAlbum, true);
                      }
                    }}
                    style={
                      isAlbumShuffleActive
                        ? {
                            backgroundColor: 'var(--color-accent)',
                            color: '#ffffff',
                            boxShadow: '0 0 12px var(--color-accent)',
                          }
                        : undefined
                    }
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
                      isAlbumShuffleActive
                        ? 'ring-2 ring-white/60 text-white font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
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
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed backdrop-blur-xs">
              <span className="text-[#c273ed] font-bold">Lời tựa: </span>
              {selectedAlbum.description ||
                `Tuyển tập các ca khúc độc quyền đặc sắc nhất của ${selectedAlbum.artist}. Dữ liệu được chọn lọc và thưởng thức trọn vẹn không giới hạn trên XuanKen Music.`}
            </div>

            {/* Bảng danh sách bài hát */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-xs">
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
                  THAO TÁC
                </div>
              </div>

              {/* Danh sách các bài hát trong album */}
              {albumSongsList.length === 0 ? (
                <div className="p-12 text-center text-white/40 text-xs">
                  Album này chưa có bài hát nào.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {albumSongsList.map((song, idx) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isPlayingThis = isCurrent && isPlaying;
                    const isLiked = likedSongIds.includes(song.id);
                    const songObj = convertAlbumSongToSong(song, selectedAlbum);
                    const isMenuOpen = activeSongMenuId === song.id;
                    const isAlreadyInPlaylist = playlists.some((p) => p.songIds.includes(song.id));

                    return (
                      <div
                        key={song.id}
                        onClick={() => playAlbumTrack(song, selectedAlbum)}
                        className={`relative flex items-center px-3 sm:px-4 py-2.5 transition-all cursor-pointer group ${
                          isCurrent
                            ? 'bg-purple-600/25 border-l-2 border-[#c273ed]'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        {/* Cột 1: # STT */}
                        <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                          {isPlayingThis ? (
                            <div className="flex items-end justify-center gap-0.5 h-3.5">
                              <span className="w-0.5 h-3.5 bg-pink-400 animate-pulse" />
                              <span className="w-0.5 h-2 bg-pink-400 animate-pulse delay-100" />
                              <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-200" />
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-mono font-bold text-white/40 group-hover:hidden">
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
                                className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white hover:bg-pink-600 transition-colors"
                              >
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Cột 2: BÀI HÁT (Thumbnail + Title + Artists) */}
                        <div className="flex-1 min-w-0 flex items-center gap-3 pl-3 sm:pl-4 pr-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                            <img
                              src={song.coverImage || selectedAlbum.coverImage}
                              alt={song.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.currentTarget.src = selectedAlbum.coverImage;
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-pink-400' : 'text-white group-hover:text-pink-300'}`}>
                              {song.title}
                            </p>
                            <p className="text-[11px] text-white/50 truncate mt-0.5">
                              {song.artists}
                            </p>
                          </div>
                        </div>

                        {/* Cột 3: ALBUM (desktop only) */}
                        <div className="hidden md:block w-44 lg:w-56 text-left text-xs text-white/50 truncate shrink-0 px-2">
                          {selectedAlbum.title}
                        </div>

                        {/* Cột 4: TIM (Ẩn trên mobile theo Yêu cầu 6, hiển thị trên desktop) */}
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

                        {/* Cột 5: THỜI GIAN (Ẩn trên mobile theo Yêu cầu 6, hiển thị trên desktop) */}
                        <div className="hidden sm:flex w-16 sm:w-20 items-center justify-center shrink-0 text-xs font-mono text-white/50">
                          {formatSeconds(song.duration || 0)}
                        </div>

                        {/* Cột 6: THAO TÁC (3 gạch dọc / MoreVertical menu)
                            Requirement 7: Nhấp vào và ấn ra chỗ khác sẽ ẩn đi ngay mượt mà cả PC và Mobile
                        */}
                        <div className="w-12 sm:w-20 flex items-center justify-center shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveSongMenuId(isMenuOpen ? null : song.id)}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              isMenuOpen ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
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
                                className="absolute right-0 top-full mt-1 sm:top-8 w-52 rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl p-1.5 z-50 text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
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
    <div className="space-y-6 pb-24 select-none font-['Roboto_Condensed'] animate-in fade-in duration-200">
      {/* Top Banner Header: Clean Title only, No Subtitle, No Admin Button */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Disc3 className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Album Nhạc Hay
            </h1>
            <p className="text-xs text-white/50 mt-0.5">
              Tổng hợp {exclusiveAlbums.length} Album tuyển chọn đặc sắc
            </p>
          </div>
        </div>
      </div>

      {/* Album List View (Dạng Danh Sách LIST theo Yêu Cầu 5) */}
      {exclusiveAlbums.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs space-y-2">
          <p>Chưa có Album nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#170f23]/90 overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5">
            {exclusiveAlbums.map((album, idx) => {
              const isAlbumPlaying = isPlaying && currentSong?.album === album.title;
              const songCount = Array.isArray(album.songs) ? album.songs.length : 0;

              return (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="p-3.5 sm:p-4 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  {/* Left: STT + Vinyl Thumbnail + Title & Artist */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="w-6 text-center font-mono font-bold text-xs text-white/40 group-hover:text-white shrink-0">
                      {idx + 1}
                    </span>

                    {/* Album Cover Thumbnail */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-md">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                      {isAlbumPlaying && (
                        <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center">
                          <Play className="w-5 h-5 fill-white text-white animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Album Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#c273ed] transition-colors truncate">
                          {album.title}
                        </h3>
                        {album.genre && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/70 shrink-0">
                            {album.genre}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 truncate mt-0.5">
                        {album.artist} • <span className="text-[#c273ed] font-semibold">{songCount} bài hát</span>
                      </p>
                      {album.description && (
                        <p className="hidden md:block text-[11px] text-white/40 truncate mt-1">
                          {album.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Quick Play or View Album */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const sList = Array.isArray(album.songs) ? album.songs : [];
                        if (sList.length > 0) {
                          playAlbumTrack(sList[0], album);
                        } else {
                          setSelectedAlbum(album);
                        }
                      }}
                      disabled={songCount === 0}
                      style={{ backgroundColor: 'var(--color-accent)' }}
                      className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                      title="Phát album này"
                    >
                      {isAlbumPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Tạm dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span className="hidden sm:inline">Phát Album</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedAlbum(album)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
