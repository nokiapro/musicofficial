import React, { useState } from 'react';
import {
  Disc3,
  Play,
  Pause,
  Shuffle,
  Clock,
  ArrowLeft,
  Sparkles,
  Music2,
  Share2,
  FileText,
  Search,
  MessageSquare,
  ShieldCheck,
  Disc,
  Heart,
  MoreVertical,
  ListPlus,
  Download,
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
    setActiveDesktopTab,
    setActiveMobileTab,
    setSelectedLrcSong,
    sendChatMessage,
    isAdmin,
    likedSongIds,
    toggleLike,
    openAddToPlaylistModal,
    openDownloadModal,
    openShareModal,
  } = useMusic();

  const [searchAlbumQuery, setSearchAlbumQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [activeSongMenuId, setActiveSongMenuId] = useState<string | null>(null);
  const [isAlbumLiked, setIsAlbumLiked] = useState<boolean>(false);

  // Convert AlbumSong to Song object for global handlers
  const convertAlbumSongToSong = (song: AlbumSong, album: ExclusiveAlbum): Song => ({
    id: song.id,
    title: song.title,
    artists: song.artists,
    duration: song.duration || 210,
    audioFormat: song.audioFormat || 'MP3',
    coverImage: song.coverImage || album.coverImage,
    demoUrl: song.mp3Url || song.wavUrl,
    mp3Url: song.mp3Url,
    wavUrl: song.wavUrl,
    price: 0,
    lyrics: song.lyrics || [],
    lrcRaw: song.lrcRaw,
    album: album.title,
  });

  // List of genres from existing albums
  const genres: string[] = ['all', ...Array.from(new Set(exclusiveAlbums.map((a) => a.genre).filter((g): g is string => !!g)))];

  const filteredAlbums = exclusiveAlbums.filter((a) => {
    const matchQuery =
      a.title.toLowerCase().includes(searchAlbumQuery.toLowerCase()) ||
      a.artist.toLowerCase().includes(searchAlbumQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchAlbumQuery.toLowerCase()));
    const matchGenre = selectedGenre === 'all' || a.genre === selectedGenre;
    return matchQuery && matchGenre;
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleShareToChat = async (song: AlbumSong, album: ExclusiveAlbum) => {
    try {
      await sendChatMessage(`🎵 Mình vừa nghe bài "${song.title}" trong album "${album.title}", hay tuyệt vời! Mọi người cùng nghe nhé!`, {
        id: song.id,
        title: song.title,
        artists: song.artists,
        coverImage: song.coverImage || album.coverImage,
        mp3Url: song.mp3Url,
        wavUrl: song.wavUrl,
        duration: song.duration,
        isAlbumTrack: true,
        albumTitle: album.title,
      });
      setShareSuccessMsg(`Đã chia sẻ bài hát "${song.title}" lên Chat Box!`);
      setTimeout(() => setShareSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
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

    // Ảnh bài hát đang phát trong album, hoặc bài hát đầu tiên trong album
    const activeSong = albumSongsList.find((s) => s.id === currentSong?.id) || (albumSongsList.length > 0 ? albumSongsList[0] : null);
    const displaySongImage = (isCurrentAlbumActive && currentSong?.coverImage)
      || activeSong?.coverImage
      || selectedAlbum.coverImage
      || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

    return (
      <div className="space-y-6 pb-24 select-none font-['Roboto_Condensed'] animate-in fade-in duration-200">
        {/* Top Back & Admin Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Album Nhạc Hay</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setActiveDesktopTab('admin');
                setActiveMobileTab('admin');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 text-red-300 border border-red-500/40 font-bold text-xs hover:bg-red-600/30 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quản lý Album trong Admin</span>
            </button>
          )}
        </div>

        {/* Share notification toast */}
        {shareSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-lg">
            <span>{shareSuccessMsg}</span>
            <button
              onClick={() => {
                setActiveDesktopTab('chat');
                setActiveMobileTab('chat');
              }}
              className="underline font-bold text-white hover:text-emerald-200 cursor-pointer"
            >
              Mở Chat Box xem
            </button>
          </div>
        )}

        {/* Zing MP3 Album Detail Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start relative">
          {/* CỘT TRÁI CỐ ĐỊNH (Sticky): Bìa đĩa tròn quay 360 độ + Thông tin + Nút phát */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-4 flex flex-col items-center text-center self-start">
            {/* Ảnh bìa bài hát tròn quay 360 độ khi đang phát và dừng khi dừng nghe (không đục lỗ ở giữa) */}
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

            {/* Thông tin Album bên dưới ảnh bìa */}
            <div className="mt-4 w-full px-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase line-clamp-2">
                {selectedAlbum.title}
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Cập nhật: {selectedAlbum.releaseYear ? `Năm ${selectedAlbum.releaseYear}` : '02/11/2026'}
              </p>
              <p className="text-xs font-semibold text-white/70 mt-0.5 line-clamp-1">
                {selectedAlbum.artist}
              </p>

              {/* Tổng hợp trong album có bao nhiêu bài hát và cập nhật thời lượng */}
              <p className="text-xs text-white/50 mt-1.5 font-medium">
                {albumSongsList.length} bài hát • {durationText}
              </p>

              {/* Nút Tiếp Tục Phát / Phát Tất Cả đồng bộ với màu theme */}
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

                {/* Hàng nút phụ: Yêu thích Album + Phát Ngẫu Nhiên */}
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
                  <button
                    disabled={albumSongsList.length === 0}
                    onClick={() => {
                      if (albumSongsList.length > 0) {
                        const randIdx = Math.floor(Math.random() * albumSongsList.length);
                        playAlbumTrack(albumSongsList[randIdx], selectedAlbum, true);
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                    title="Phát ngẫu nhiên album"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Kéo lướt danh sách bài hát độc lập (Ảnh bìa vẫn giữ nguyên vị trí) */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Lời tựa (Description box kiểu Zing MP3) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed backdrop-blur-xs">
              <span className="text-[#c273ed] font-bold">Lời tựa: </span>
              {selectedAlbum.description ||
                `Tuyển tập các ca khúc độc quyền đặc sắc nhất của ${selectedAlbum.artist}. Dữ liệu được chọn lọc và thưởng thức trọn vẹn không giới hạn trên XuanKen Music.`}
            </div>

            {/* Bảng danh sách bài hát */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-xs">
              {/* Tiêu đề cột: # (STT) - BÀI HÁT (không icon) - ALBUM - TIM - THỜI GIAN - THAO TÁC */}
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
                <div className="w-14 sm:w-16 text-center shrink-0">
                  TIM
                </div>
                <div className="w-16 sm:w-20 text-center shrink-0">
                  THỜI GIAN
                </div>
                <div className="w-16 sm:w-20 text-center shrink-0">
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
                        {/* Cột 1: # STT / Sóng nhạc / Nút Play khi hover */}
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

                        {/* Cột 3: ALBUM */}
                        <div className="hidden md:block w-44 lg:w-56 text-left text-xs text-white/50 truncate shrink-0 px-2">
                          {selectedAlbum.title}
                        </div>

                        {/* Cột 4: TIM */}
                        <div className="w-14 sm:w-16 flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
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

                        {/* Cột 5: THỜI GIAN */}
                        <div className="w-16 sm:w-20 flex items-center justify-center shrink-0 text-xs font-mono text-white/50">
                          {formatSeconds(song.duration || 0)}
                        </div>

                        {/* Cột 6: THAO TÁC (3 gạch dọc / MoreVertical menu) */}
                        <div className="w-16 sm:w-20 flex items-center justify-center shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveSongMenuId(isMenuOpen ? null : song.id)}
                            className={`p-1.5 rounded-full hover:bg-white/15 transition-colors cursor-pointer ${
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
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveSongMenuId(null)}
                              />
                              <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-52 rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl p-1.5 z-50 text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                                {/* Thêm bài hát vào playlist */}
                                <button
                                  onClick={() => {
                                    setActiveSongMenuId(null);
                                    openAddToPlaylistModal(songObj);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left font-medium cursor-pointer"
                                >
                                  <ListPlus className="w-3.5 h-3.5 text-[#c273ed]" />
                                  <span>Thêm vào playlist</span>
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

                                {/* Tải bài hát */}
                                <button
                                  onClick={() => {
                                    setActiveSongMenuId(null);
                                    openDownloadModal(songObj);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left font-medium cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Tải bài hát</span>
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
                                    <span>Xem lời bài hát (LRC)</span>
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

  // Album list view
  return (
    <div className="space-y-6 pb-24 select-none font-['Roboto_Condensed'] animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg">
              <Disc3 className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                Album Nhạc Hay
              </h1>
              <p className="text-xs text-white/60">
                Tuyển tập những Album nhạc độc quyền đặc sắc, không trùng lặp danh sách ngoài
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setActiveDesktopTab('admin');
              setActiveMobileTab('admin');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>+ Tạo & Quản Lý Album (Admin)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Genre Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {g === 'all' ? 'Tất cả thể loại' : g}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchAlbumQuery}
            onChange={(e) => setSearchAlbumQuery(e.target.value)}
            placeholder="Tìm tên album, nghệ sĩ..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Album Grid */}
      {filteredAlbums.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs space-y-2">
          <p>Không tìm thấy Album nào phù hợp.</p>
          {isAdmin && (
            <button
              onClick={() => {
                setActiveDesktopTab('admin');
                setActiveMobileTab('admin');
              }}
              className="text-[#c273ed] underline font-bold"
            >
              Vào Admin để thêm Album mới
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredAlbums.map((album) => {
            const isAlbumPlaying = isPlaying && currentSong?.album === album.title;

            return (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className="group relative rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 p-3.5 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Cover Art with Vinyl illusion */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 mb-3 shadow-lg">
                    {/* Vinyl Record peaking out on hover */}
                    <div
                      className={`absolute -right-2 top-2 w-28 h-28 rounded-full bg-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-center transition-transform duration-500 group-hover:translate-x-6 ${
                        isAlbumPlaying ? 'animate-spin-slow' : ''
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-black border border-zinc-600" />
                      </div>
                    </div>

                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

                    {/* Quick Play Button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const sList = Array.isArray(album.songs) ? album.songs : [];
                        if (sList.length > 0) {
                          playAlbumTrack(sList[0], album);
                        }
                      }}
                      disabled={!album.songs || album.songs.length === 0}
                      style={{ backgroundColor: 'var(--color-accent)' }}
                      className="absolute bottom-2.5 right-2.5 z-20 w-10 h-10 rounded-full text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-0"
                      title="Phát album này ngay"
                    >
                      {isAlbumPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    {/* Track count badge */}
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                      <Music2 className="w-3 h-3 text-[#c273ed]" />
                      <span>{Array.isArray(album.songs) ? album.songs.length : 0} bài</span>
                    </div>
                  </div>

                  {/* Album Info */}
                  <h3 className="text-sm font-bold text-white group-hover:text-[#c273ed] transition-colors truncate">
                    {album.title}
                  </h3>
                  <p className="text-xs text-white/60 truncate mt-0.5">
                    {album.artist}
                  </p>
                  <p className="text-[11px] text-white/40 line-clamp-2 mt-1 leading-snug">
                    {album.description || 'Album đặc biệt độc quyền'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[10px] text-white/50">
                  <span>{album.genre || 'V-Pop'}</span>
                  <span className="text-purple-400 font-bold group-hover:underline">Xem album →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
