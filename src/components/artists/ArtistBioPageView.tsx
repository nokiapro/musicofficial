import React, { useState, useMemo, useRef } from 'react';
import {
  Mic2,
  Play,
  Shuffle,
  Heart,
  Plus,
  Search,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Sparkles,
  Award,
  Music,
  Share2,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ArtistBio, Song } from '../../types/music';
import { ArtistNames } from '../common/ArtistNames';
import { formatArtistName } from '../../utils/artistUtils';
import { useAutoScrollToSong } from '../../hooks/useAutoScrollToSong';

interface ArtistBioPageViewProps {
  onEditArtistInAdmin?: (artist: ArtistBio) => void;
}

export const ArtistBioPageView: React.FC<ArtistBioPageViewProps> = ({ onEditArtistInAdmin }) => {
  const {
    artistBios,
    selectedArtistName,
    setSelectedArtistName,
    songs,
    exclusiveAlbums,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    playCustomPool,
    toggleLike,
    likedSongIds,
    openAddToPlaylistModal,
    openShareModal,
    isAdmin,
    setActiveDesktopTab,
    setActiveMobileTab,
    effectiveIsMobile,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique artists across the entire catalog (songs + album tracks)
  const allPlatformArtists = useMemo(() => {
    const artistMap = new Map<string, { songCount: number; sampleCover: string }>();

    const recordArtist = (artistStr: string, cover?: string) => {
      if (!artistStr) return;
      const parts = artistStr.split(',').map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        const lower = p.toLowerCase();
        const existing = artistMap.get(lower);
        if (existing) {
          existing.songCount += 1;
        } else {
          artistMap.set(lower, {
            songCount: 1,
            sampleCover: cover || '',
          });
        }
      }
    };

    songs.forEach((s) => recordArtist(s.artists, s.coverImage));
    exclusiveAlbums.forEach((alb) => {
      (alb.songs || []).forEach((s) => recordArtist(s.artists, s.coverImage || alb.coverImage));
    });

    return artistMap;
  }, [songs, exclusiveAlbums]);

  // Merge registered artist bios with any artists found dynamically in songs
  const mergedArtists = useMemo(() => {
    const list: Array<ArtistBio & { songCount: number }> = [];
    const seenNames = new Set<string>();

    // 1. Registered bios
    for (const bio of artistBios) {
      const lower = bio.name.toLowerCase().trim();
      seenNames.add(lower);
      const catalogInfo = allPlatformArtists.get(lower);
      list.push({
        ...bio,
        songCount: catalogInfo?.songCount || 0,
      });
    }

    // 2. Any artist appearing in songs but without a formal bio yet
    allPlatformArtists.forEach((info, lowerName) => {
      if (!seenNames.has(lowerName)) {
        // Find original casing
        let originalName = lowerName;
        for (const s of songs) {
          const parts = s.artists.split(',').map((p) => p.trim());
          const match = parts.find((p) => p.toLowerCase() === lowerName);
          if (match) {
            originalName = match;
            break;
          }
        }
        list.push({
          id: `auto-${lowerName.replace(/[^a-z0-9]/g, '-')}`,
          name: originalName,
          avatarUrl: info.sampleCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          bio: `${originalName} là nghệ sĩ có các tác phẩm âm nhạc được phát hành trên hệ thống XuanKen Music.`,
          genres: ['V-Pop'],
          songCount: info.songCount,
        });
      }
    });

    return list;
  }, [artistBios, allPlatformArtists, songs]);

  // Filtered artists for directory view
  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return mergedArtists;
    const q = searchQuery.toLowerCase().trim();
    return mergedArtists.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.realName && a.realName.toLowerCase().includes(q)) ||
        (a.genres && a.genres.some((g) => g.toLowerCase().includes(q))) ||
        (a.hometown && a.hometown.toLowerCase().includes(q))
    );
  }, [mergedArtists, searchQuery]);

  // Currently selected artist profile
  const currentArtistBio = useMemo(() => {
    if (!selectedArtistName) return null;
    const lower = selectedArtistName.toLowerCase().trim();
    const found = mergedArtists.find((a) => a.name.toLowerCase().trim() === lower);
    if (found) return found;

    // Fallback if not registered
    return {
      id: `bio-${lower.replace(/[^a-z0-9]/g, '-')}`,
      name: selectedArtistName,
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      bio: `${selectedArtistName} là ca sĩ / nghệ sĩ có các tác phẩm âm nhạc trên hệ thống XuanKen Music.`,
      genres: ['V-Pop'],
      songCount: allPlatformArtists.get(lower)?.songCount || 0,
    };
  }, [selectedArtistName, mergedArtists, allPlatformArtists]);

  // All songs featuring this artist (from songs and exclusive albums)
  const artistSongs = useMemo(() => {
    if (!selectedArtistName) return [];
    const q = selectedArtistName.toLowerCase().trim();

    const matchesArtist = (artistsStr?: string) => {
      if (!artistsStr) return false;
      const parts = artistsStr.split(',').map((p) => p.trim().toLowerCase());
      return parts.includes(q) || artistsStr.toLowerCase().includes(q);
    };

    const result: Song[] = [];
    const seenSongIds = new Set<string>();

    // 1. Songs from catalog
    songs.forEach((s) => {
      if (matchesArtist(s.artists) && !seenSongIds.has(s.id)) {
        seenSongIds.add(s.id);
        result.push(s);
      }
    });

    // 2. Songs from curated albums
    exclusiveAlbums.forEach((alb) => {
      (alb.songs || []).forEach((as) => {
        if (matchesArtist(as.artists) && !seenSongIds.has(as.id)) {
          seenSongIds.add(as.id);
          result.push({
            id: as.id,
            stt: as.stt,
            title: as.title,
            artists: as.artists,
            duration: as.duration,
            coverImage: as.coverImage || alb.coverImage,
            coverGradient: 'from-purple-600 to-indigo-800',
            album: alb.title,
            releaseDate: alb.releaseYear || '2026',
            lyrics: as.lyrics || [],
            lrcRaw: as.lrcRaw || '',
            audioFormat: as.audioFormat || 'MP3',
            price: 0,
            isPurchased: true,
            isAlbumTrack: true,
            albumId: alb.id,
            demoUrl: as.demoUrl || as.mp3Url,
            mp3Url: as.mp3Url,
            wavUrl: as.wavUrl,
            playCount: as.playCount || 0,
            plays: `${(as.playCount || 0).toLocaleString('vi-VN')} lượt nghe`,
          });
        }
      });
    });

    return result;
  }, [selectedArtistName, songs, exclusiveAlbums]);

  const artistSongsListRef = useRef<HTMLDivElement | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  useAutoScrollToSong({
    containerRef: artistSongsListRef,
    songId: currentSong?.id,
    enabled: Boolean(currentArtistBio && selectedArtistName),
    viewKey: selectedArtistName || null,
    manualTrigger: scrollTrigger,
    itemCount: artistSongs.length,
  });

  const handlePlayAll = (shuffle: boolean = false) => {
    if (artistSongs.length === 0) return;
    playCustomPool(
      artistSongs,
      `Nghệ sĩ ${selectedArtistName}`,
      shuffle,
      shuffle ? undefined : artistSongs[0]
    );
    setScrollTrigger((t) => t + 1);
  };

  const handleSongClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    playCustomPool(artistSongs, `Nghệ sĩ ${selectedArtistName}`, false, song);
  };

  const handleGoToAdmin = (artist?: ArtistBio) => {
    if (onEditArtistInAdmin && artist) {
      onEditArtistInAdmin(artist);
    }
    setActiveDesktopTab('admin');
    setActiveMobileTab('admin');
  };

  // -------------------------------------------------------------
  // VIEW 1: SINGLE ARTIST PROFILE & DISCOGRAPHY
  // -------------------------------------------------------------
  if (currentArtistBio && selectedArtistName) {
    const isPlayingCurrentPool =
      isPlaying &&
      currentSong &&
      artistSongs.some((s) => s.id === currentSong.id);

    return (
      <div className="w-full space-y-6 pb-28 pt-2 text-white">
        {/* Top bar: Mobile back navigation and/or Admin edit button */}
        {(effectiveIsMobile || isAdmin) && (
          <div className="flex items-center justify-between min-h-[36px]">
            {effectiveIsMobile ? (
              <button
                type="button"
                onClick={() => setSelectedArtistName(null)}
                className="group flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 transition-all hover:bg-white/20 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Tất cả ca sĩ & nghệ sĩ</span>
              </button>
            ) : (
              <div />
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleGoToAdmin(currentArtistBio)}
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-600/20 px-3.5 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-600/30 ml-auto"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa tiểu sử</span>
              </button>
            )}
          </div>
        )}

        {/* Hero Section */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-8">
          {/* Background image backdrop */}
          {currentArtistBio.bannerUrl && (
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-25">
              <img
                src={currentArtistBio.bannerUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/75 to-transparent" />
            </div>
          )}

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* Avatar & Verified Badge */}
            <div className="flex flex-col items-center sm:items-start shrink-0">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-full blur-xl opacity-45 pointer-events-none"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
                <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-white/20 shadow-2xl sm:h-36 sm:w-36 md:h-44 md:w-44 bg-zinc-900">
                  <img
                    src={currentArtistBio.avatarUrl}
                    alt={formatArtistName(currentArtistBio.name)}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>

              {/* Badge màu xanh lá cây ở bên dưới avatar là ĐÃ XÁC MINH */}
              {currentArtistBio.isVerified && (
                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-[11px] font-bold tracking-wider uppercase shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ĐÃ XÁC MINH</span>
                </div>
              )}
            </div>

            {/* Information */}
            <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
              {currentArtistBio.isVerified ? (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Nghệ Sĩ Được Xác Minh</span>
                </div>
              ) : (
                <div style={{ color: 'var(--color-accent)' }} className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-85">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Nghệ Sĩ</span>
                </div>
              )}

              <h1 className="font-display truncate text-2xl font-black text-white sm:text-4xl md:text-5xl">
                {formatArtistName(currentArtistBio.name)}
              </h1>

              {currentArtistBio.realName && (
                <p className="text-sm font-medium text-white/70">
                  Tên thật: <span className="text-white font-semibold">{currentArtistBio.realName}</span>
                </p>
              )}

              {/* Quick Metadata tags */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-white/65">
                {currentArtistBio.birthDate && (
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Calendar style={{ color: 'var(--color-accent)' }} className="h-3.5 w-3.5" />
                    <span>{currentArtistBio.birthDate}</span>
                  </span>
                )}
                {currentArtistBio.hometown && (
                  <span className="flex items-center gap-1.5">
                    <MapPin style={{ color: 'var(--color-accent)' }} className="h-3.5 w-3.5" />
                    <span>{currentArtistBio.hometown}</span>
                  </span>
                )}
                {currentArtistBio.debutYear && (
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Award style={{ color: 'var(--color-accent)' }} className="h-3.5 w-3.5" />
                    <span>Ra mắt: {currentArtistBio.debutYear}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Music style={{ color: 'var(--color-accent)' }} className="h-3.5 w-3.5" />
                  <span>{artistSongs.length} bài hát</span>
                </span>
              </div>

              {/* Genres as clean typographic metadata */}
              {currentArtistBio.genres && currentArtistBio.genres.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5 text-xs text-white/60">
                  {currentArtistBio.genres.map((g, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span aria-hidden="true" className="text-white/30">·</span>}
                      <span className="font-medium text-white/80">{g}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-white/[0.08] pt-5">
            <button
              type="button"
              onClick={() => handlePlayAll(false)}
              disabled={artistSongs.length === 0}
              className="accent-glow-btn flex items-center justify-center gap-2 rounded-full px-7 py-3 font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 text-sm active:scale-95 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{isPlayingCurrentPool ? 'Tiếp tục phát' : 'Phát tất cả'}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlayAll(true)}
              disabled={artistSongs.length === 0}
              className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-6 py-3 font-semibold text-white transition-all hover:bg-white/[0.14] disabled:opacity-50 text-sm active:scale-95 cursor-pointer"
            >
              <Shuffle className="h-4 w-4" />
              <span>Phát ngẫu nhiên</span>
            </button>
          </div>
        </div>

        {/* Biography & Achievements Grid */}
        <div className="grid grid-cols-1 gap-5 lg:gap-6 lg:grid-cols-3">
          {/* Biography narrative (2 columns) */}
          <div className="glass-panel space-y-4 rounded-3xl p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <Mic2 style={{ color: 'var(--color-accent)' }} className="h-5 w-5" />
              <span>Tiểu Sử & Sự Nghiệp</span>
            </div>

            <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">
              {currentArtistBio.bio}
            </p>

            {/* Achievements */}
            {currentArtistBio.achievements && currentArtistBio.achievements.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
                <div style={{ color: 'var(--color-accent)' }} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Award className="h-4 w-4" />
                  <span>Thành Tích & Dấu Ấn Tiêu Biểu</span>
                </div>
                <div className="space-y-2">
                  {currentArtistBio.achievements.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.05] p-3 text-xs text-white/90"
                    >
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Social Links & Meta sidebar (1 column) */}
          <div className="glass-panel space-y-4 rounded-3xl p-5 sm:p-6">
            <div className="font-display text-base font-bold text-white">Thông Tin Chi Tiết</div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-white/[0.07] pb-2">
                <span className="text-white/50">Nghệ danh</span>
                <span className="font-semibold text-white">{formatArtistName(currentArtistBio.name)}</span>
              </div>
              {currentArtistBio.realName && (
                <div className="flex justify-between border-b border-white/[0.07] pb-2">
                  <span className="text-white/50">Tên khai sinh</span>
                  <span className="font-semibold text-white">{currentArtistBio.realName}</span>
                </div>
              )}
              {currentArtistBio.birthDate && (
                <div className="flex justify-between border-b border-white/[0.07] pb-2">
                  <span className="text-white/50">Ngày sinh</span>
                  <span className="font-semibold text-white tabular-nums">{currentArtistBio.birthDate}</span>
                </div>
              )}
              {currentArtistBio.hometown && (
                <div className="flex justify-between border-b border-white/[0.07] pb-2">
                  <span className="text-white/50">Quê quán</span>
                  <span className="font-semibold text-white">{currentArtistBio.hometown}</span>
                </div>
              )}
              {currentArtistBio.debutYear && (
                <div className="flex justify-between border-b border-white/[0.07] pb-2">
                  <span className="text-white/50">Khởi nghiệp</span>
                  <span className="font-semibold text-white tabular-nums">{currentArtistBio.debutYear}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/[0.07] pb-2">
                <span className="text-white/50">Số bài hát trên hệ thống</span>
                <span style={{ color: 'var(--color-accent)' }} className="font-semibold tabular-nums">{artistSongs.length} bài</span>
              </div>
            </div>

            {/* Social media presence */}
            {currentArtistBio.socialLinks && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-white/70">Kênh Trực Tuyến:</div>
                <div className="flex flex-wrap gap-2">
                  {currentArtistBio.socialLinks.youtube && (
                    <a
                      href={currentArtistBio.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-red-600/20 px-2.5 py-1 text-xs text-red-300 transition-colors hover:bg-red-600/30"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>YouTube</span>
                    </a>
                  )}
                  {currentArtistBio.socialLinks.facebook && (
                    <a
                      href={currentArtistBio.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs text-blue-300 transition-colors hover:bg-blue-600/30"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Facebook</span>
                    </a>
                  )}
                  {currentArtistBio.socialLinks.tiktok && (
                    <a
                      href={currentArtistBio.socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80 transition-colors hover:bg-white/20"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Discography / Songs list featuring this artist */}
        <div className="glass-panel space-y-4 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-lg font-bold text-white tabular-nums">
                Bài Hát Của {formatArtistName(currentArtistBio.name)} ({artistSongs.length})
              </h2>
              <p className="text-xs text-white/60">
                Bao gồm các ca khúc solo và các ca khúc kết hợp cùng nghệ sĩ khác
              </p>
            </div>

            {artistSongs.length > 0 && (
              <button
                type="button"
                onClick={() => handlePlayAll(false)}
                style={{ color: 'var(--color-accent)' }}
                className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Phát danh sách này</span>
              </button>
            )}
          </div>

          {artistSongs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 py-12 text-center text-sm text-white/50">
              Chưa có bài hát nào của nghệ sĩ này trong hệ thống.
            </div>
          ) : (
            <div ref={artistSongsListRef} className="divide-y divide-white/[0.05]">
              {artistSongs.map((song, index) => {
                const isCur = currentSong?.id === song.id;
                const isSongPlaying = isCur && isPlaying;
                const isLiked = likedSongIds.includes(song.id);

                return (
                  <div
                    key={song.id}
                    data-song-id={song.id}
                    onClick={() => handleSongClick(song)}
                    style={
                      isCur
                        ? {
                            backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                            boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 32%, transparent)',
                          }
                        : undefined
                    }
                    className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all cursor-pointer ${
                      isCur ? 'text-white' : 'text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {/* Index or Equalizer / Play indicator */}
                    <div className="relative flex w-7 h-7 shrink-0 items-center justify-center text-xs text-white/45 font-mono tabular-nums">
                      {isSongPlaying ? (
                        <div className="flex items-end gap-0.5 h-4">
                          <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-1" />
                          <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-2" />
                          <span style={{ backgroundColor: 'var(--color-accent)' }} className="w-0.5 rounded-full animate-soundwave-3" />
                        </div>
                      ) : (
                        <>
                          <span className="transition-opacity group-hover:opacity-0">{(index + 1).toString().padStart(2, '0')}</span>
                          <Play className="absolute inset-0 m-auto h-3.5 w-3.5 fill-current text-white opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity" />
                        </>
                      )}
                    </div>

                    {/* Cover & Title */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-zinc-950/90 border border-white/10 shadow-sm flex items-center justify-center">
                        <img
                          src={song.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                          alt={song.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={isCur ? { color: 'var(--color-accent)' } : undefined}
                            className="truncate text-sm font-semibold"
                          >
                            {song.title}
                          </span>
                          {song.isAlbumTrack && (
                            <span className="shrink-0 text-[10px] font-medium text-indigo-300">
                              · Album
                            </span>
                          )}
                          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.2 text-[9px] uppercase text-white/70 font-mono">
                            {song.audioFormat || 'MP3'}
                          </span>
                        </div>
                        <div className="text-xs text-white/55">
                          <ArtistNames
                            artists={song.artists}
                            className="text-xs"
                            linkClassName="text-white/60 hover:text-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Plays count (desktop) */}
                    <div className="hidden text-xs text-white/45 md:block tabular-nums">
                      {song.plays || `${(song.playCount || 0).toLocaleString('vi-VN')} lượt`}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song.id);
                        }}
                        className={`rounded-lg p-1.5 transition-colors hover:bg-white/10 ${
                          isLiked ? 'text-red-500' : 'text-white/40 hover:text-white'
                        }`}
                        title={isLiked ? 'Bỏ thích' : 'Yêu thích'}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddToPlaylistModal(song);
                        }}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        title="Thêm vào playlist"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openShareModal(song);
                        }}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        title="Chia sẻ bài hát"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ARTISTS DIRECTORY (GRID OF ALL ARTISTS)
  // -------------------------------------------------------------
  return (
    <div className="w-full space-y-6 pb-28 pt-2 text-white">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Mic2 style={{ color: 'var(--color-accent)' }} className="h-6 w-6" />
            <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">Tiểu Sử Ca Sĩ</h1>
          </div>
          <p className="mt-1 text-xs text-white/60 sm:text-sm">
            Khám phá câu chuyện âm nhạc, cuộc đời và toàn bộ bài hát của các nghệ sĩ hàng đầu trên XuanKen Music
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm ca sĩ, nghệ danh..."
            className="w-full rounded-full border border-white/15 bg-white/[0.07] py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/45 outline-none transition-all focus:border-[var(--color-accent)] focus:bg-white/[0.11]"
          />
        </div>
      </div>

      {/* Grid of Artists */}
      {filteredArtists.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-dashed border-white/15 py-16 text-center text-sm text-white/55">
          Không tìm thấy ca sĩ nào khớp với từ khóa "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => setSelectedArtistName(artist.name)}
              className="glass-panel group relative flex flex-col items-center rounded-2xl p-4 text-center transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-white/20"
            >
              {/* Circular Avatar */}
              <div className="relative mb-2.5 h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/15 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:ring-[var(--color-accent)] sm:h-28 sm:w-28 shrink-0 bg-zinc-900">
                <img
                  src={artist.avatarUrl}
                  alt={formatArtistName(artist.name)}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                  <div className="accent-glow-btn rounded-full p-2.5 text-white shadow-lg">
                    <Play className="h-4 w-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Badge màu xanh lá cây ở bên dưới avatar là ĐÃ XÁC MINH */}
              {artist.isVerified && (
                <div className="mb-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-[9px] font-bold tracking-wider uppercase shadow-sm">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span>ĐÃ XÁC MINH</span>
                </div>
              )}

              {/* Stage Name */}
              <div className="flex items-center justify-center gap-1 w-full">
                <span className="font-display truncate text-sm font-bold text-white transition-colors group-hover:text-white">
                  {formatArtistName(artist.name)}
                </span>
              </div>

              {/* Real Name or Hometown */}
              {artist.realName && (
                <div className="truncate text-[11px] text-white/50">{artist.realName}</div>
              )}

              {/* Songs count & Genre */}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/60 tabular-nums">
                <span style={{ color: 'var(--color-accent)' }} className="font-semibold">{artist.songCount} bài hát</span>
                {artist.genres && artist.genres[0] && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{artist.genres[0]}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
