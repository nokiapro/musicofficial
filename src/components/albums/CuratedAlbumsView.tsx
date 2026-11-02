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
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ExclusiveAlbum, AlbumSong } from '../../types/music';

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
  } = useMusic();

  const [searchAlbumQuery, setSearchAlbumQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

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
    const totalMins = Math.floor(totalDurationSecs / 60);

    return (
      <div className="space-y-6 pb-24 select-none font-['Roboto_Condensed'] animate-in fade-in duration-200">
        {/* Back Button */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs hover:bg-amber-500/30 transition-colors cursor-pointer"
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

        {/* Album Hero Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-purple-900/50 via-zinc-900/80 to-black border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Album Cover Art with Vinyl Effect */}
            <div className="relative group shrink-0">
              {/* Spinning Vinyl Record behind */}
              <div
                className={`absolute -right-3 top-2 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:translate-x-5 ${
                  isPlaying && currentSong?.album === selectedAlbum.title ? 'animate-spin-slow' : ''
                }`}
              >
                <div className="w-14 h-14 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-black border border-zinc-600" />
                </div>
              </div>

              {/* Main Cover Card */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900">
                <img
                  src={selectedAlbum.coverImage}
                  alt={selectedAlbum.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            </div>

            {/* Album Metadata */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-[#c273ed] border border-purple-500/30">
                  Album Độc Quyền
                </span>
                {selectedAlbum.genre && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                    {selectedAlbum.genre}
                  </span>
                )}
                {selectedAlbum.releaseYear && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/60">
                    Năm {selectedAlbum.releaseYear}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                {selectedAlbum.title}
              </h1>
              <p className="text-sm sm:text-base font-bold text-white/80 mt-1">
                Nghệ sĩ: <span className="text-[#c273ed]">{selectedAlbum.artist}</span>
              </p>
              <p className="text-xs text-white/60 mt-2 max-w-2xl leading-relaxed">
                {selectedAlbum.description || 'Album chọn lọc đặc biệt dành riêng cho người dùng XuanKen Music.'}
              </p>

              {/* Stats & Notice */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-white/50">
                <span>{albumSongsList.length} bài hát</span>
                <span>•</span>
                <span>Khoảng {totalMins} phút</span>
                <span>•</span>
                <span className="text-amber-400/90 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bài hát chỉ lưu hành & hiển thị độc quyền trong album này
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-5">
                <button
                  disabled={albumSongsList.length === 0}
                  onClick={() => {
                    if (albumSongsList.length > 0) {
                      playAlbumTrack(albumSongsList[0], selectedAlbum, false);
                    }
                  }}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Phát Tất Cả</span>
                </button>

                <button
                  disabled={albumSongsList.length === 0}
                  onClick={() => {
                    if (albumSongsList.length > 0) {
                      const randomIdx = Math.floor(Math.random() * albumSongsList.length);
                      playAlbumTrack(albumSongsList[randomIdx], selectedAlbum, true);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Phát Ngẫu Nhiên</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tracklist Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-[#c273ed]" />
              <span>Danh Sách Bài Hát Trong Album ({albumSongsList.length})</span>
            </h2>
          </div>

          {albumSongsList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs">
              Album này chưa có bài hát nào. Admin có thể thêm bài hát vào album qua mục Admin Quản Trị!
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-xs">
              <div className="divide-y divide-white/5">
                {albumSongsList.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isPlayingThis = isCurrent && isPlaying;

                  return (
                    <div
                      key={song.id}
                      onClick={() => playAlbumTrack(song, selectedAlbum)}
                      className={`flex items-center justify-between p-3 sm:px-4 hover:bg-white/10 transition-colors cursor-pointer group ${
                        isCurrent ? 'bg-purple-600/20' : ''
                      }`}
                    >
                      {/* Left: STT + Play Indicator + Title */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-7 text-center shrink-0">
                          {isPlayingThis ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <span className="w-1 h-3 bg-[#c273ed] animate-pulse" />
                              <span className="w-1 h-4 bg-[#c273ed] animate-pulse delay-100" />
                              <span className="w-1 h-2 bg-[#c273ed] animate-pulse delay-200" />
                            </div>
                          ) : (
                            <span className="text-xs font-mono font-bold text-white/40 group-hover:hidden">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCurrent) {
                                togglePlay();
                              } else {
                                playAlbumTrack(song, selectedAlbum);
                              }
                            }}
                            className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white hover:bg-purple-600 transition-colors"
                          >
                            {isPlayingThis ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                          </button>
                        </div>

                        {/* Song Cover Thumbnail */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                          <img
                            src={song.coverImage || selectedAlbum.coverImage}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = selectedAlbum.coverImage;
                            }}
                          />
                        </div>

                        {/* Song Title and Artists */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-[#c273ed]' : 'text-white'}`}>
                            {song.title}
                          </p>
                          <p className="text-[11px] text-white/50 truncate mt-0.5">
                            {song.artists}
                          </p>
                        </div>
                      </div>

                      {/* Right: Format Badge + Duration + Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          song.audioFormat === 'WAV'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {song.audioFormat || 'MP3'}
                        </span>

                        {/* View lyrics button */}
                        {song.lrcRaw && (
                          <button
                            onClick={() => {
                              setSelectedLrcSong({
                                id: song.id,
                                title: song.title,
                                artists: song.artists,
                                duration: song.duration,
                                audioFormat: song.audioFormat || 'MP3',
                                price: 0,
                                lyrics: song.lyrics || [],
                                lrcRaw: song.lrcRaw,
                              });
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            title="Xem lời bài hát LRC"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Share to Chat Box */}
                        <button
                          onClick={() => handleShareToChat(song, selectedAlbum)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-[#38bdf8] transition-colors"
                          title="Chia sẻ bài hát lên Chat Box"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duration */}
                        <span className="text-xs font-mono text-white/50 w-12 text-right">
                          {formatSeconds(song.duration || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
