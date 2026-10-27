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
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { MobileTopBar } from './MobileTopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMiniPlayer } from './MobileMiniPlayer';
import { MobileFullPlayerModal } from './MobileFullPlayerModal';
import { DemoLimitModal } from '../store/DemoLimitModal';
import { BuySongModal } from '../store/BuySongModal';
import { TopUpModal } from '../store/TopUpModal';
import { LoginModal } from '../auth/LoginModal';
import { LrcViewerModal } from '../lyrics/LrcViewerModal';
import { ThemeSelectorModal } from '../common/ThemeSelectorModal';
import { SleepTimerModal } from '../common/SleepTimerModal';
import { KaraokeLyricsModal } from '../lyrics/KaraokeLyricsModal';
import { Song } from '../../types/music';

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
    userBalance,
    setIsTopUpModalOpen,
    removeSong,
  } = useMusic();

  const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));
  const ownedSongs = songs.filter((s) => isSongPurchased(s.id));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderTabContent = () => {
    switch (activeMobileTab) {
      case 'discover':
        // Requirement 2: Clean song list table with STT - TÊN BÀI - CA SỸ - LRC - THỜI LƯỢNG - MP3/WAV
        return (
          <div className="space-y-3 px-3 pb-32 pt-2">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h1 className="text-lg font-black text-white uppercase tracking-tight">
                  Danh Sách Bài Hát
                </h1>
                <p className="text-[10px] text-white/50">
                  {songs.length} bài hát • Nghe demo 60s, mua để nghe full
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {songs.map((song, idx) => {
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
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex flex-col gap-2 ${
                      isCurrent
                        ? 'bg-[#9b4de0]/20 border-[#9b4de0]/40'
                        : 'bg-white/5 border-white/5 active:bg-white/10'
                    }`}
                  >
                    {/* Top Row: STT, Cover, Title, Artist, Play state */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 truncate flex-1">
                        <span className="w-5 text-center text-xs font-bold text-white/40 font-mono">
                          {song.stt || idx + 1}
                        </span>

                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shrink-0 shadow relative`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 text-white fill-current" />
                          ) : (
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          )}
                        </div>

                        <div className="truncate">
                          <p
                            className={`text-xs font-bold truncate ${
                              isCurrent ? 'text-[#c273ed]' : 'text-white'
                            }`}
                          >
                            {song.title}
                          </p>
                          <p className="text-[10px] text-white/60 truncate">{song.artists}</p>
                        </div>
                      </div>

                      {/* Format Badge: MP3 or WAV */}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          song.audioFormat === 'WAV'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {song.audioFormat}
                      </span>
                    </div>

                    {/* Bottom Row: LRC button, Duration, Status & Buy */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[11px]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLrcSong(song);
                          }}
                          className="flex items-center gap-1 text-[#c273ed] hover:underline font-bold"
                        >
                          <FileText className="w-3 h-3" />
                          <span>LRC</span>
                        </button>

                        <span className="text-white/40 font-mono tabular-nums">
                          {formatDuration(song.duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPurchased ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Đã mua
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongToBuy(song);
                              setIsBuyModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9b4de0] text-white font-bold text-[10px] shadow"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Mua {song.price.toLocaleString('vi-VN')}đ</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id);
                          }}
                          className="p-1 text-white/40 hover:text-red-400"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isLiked ? 'text-red-500 fill-red-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'store':
        // Requirement 4: Mobile Music Store
        return (
          <div className="space-y-3 px-3 pb-32 pt-2">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 to-[#23143c] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#c273ed]">Cửa Hàng XuanKen</p>
                <p className="text-sm font-bold text-white">Mua Nhạc Bản Quyền</p>
                <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                  Ví: {userBalance.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow"
              >
                + Nạp ví
              </button>
            </div>

            <div className="space-y-2">
              {songs.map((song) => {
                const isPurchased = isSongPurchased(song.id);
                return (
                  <div
                    key={song.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{song.title}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded font-black bg-white/10 text-white">
                          {song.audioFormat}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate mt-0.5">{song.artists}</p>
                      <p className="text-xs font-bold text-amber-400 mt-1">
                        {isPurchased ? 'ĐÃ SỞ HỮU' : `${song.price.toLocaleString('vi-VN')} đ`}
                      </p>
                    </div>

                    {isPurchased ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        Đã mua
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSongToBuy(song);
                          setIsBuyModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#9b4de0] text-white text-xs font-bold shadow"
                      >
                        Mua ngay
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'admin':
        // Requirement 5: Mobile Admin View
        return (
          <div className="space-y-3 px-3 pb-32 pt-2">
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#c273ed]" />
                Quản Trị XuanKen Music
              </h2>
              <p className="text-[10px] text-white/60 mt-0.5">
                Cơ sở dữ liệu Firebase: newmusic-5625b • Tổng {songs.length} bài hát
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-white/50">Bài MP3</p>
                <p className="text-base font-bold text-blue-400">
                  {songs.filter((s) => s.audioFormat === 'MP3').length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-white/50">Bài WAV</p>
                <p className="text-base font-bold text-amber-400">
                  {songs.filter((s) => s.audioFormat === 'WAV').length}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {songs.map((song, i) => (
                <div
                  key={song.id}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-white truncate">
                      {i + 1}. {song.title}
                    </p>
                    <p className="text-[10px] text-white/50 truncate">
                      {song.artists} • {song.audioFormat} • {song.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa bài hát "${song.title}"?`)) {
                        removeSong(song.id);
                      }
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-3 px-3 pb-32 pt-2">
            <h2 className="text-base font-black text-white">#zingchart Thời Gian Thực</h2>
            <div className="space-y-2">
              {songs.map((song, i) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 active:bg-white/10"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 text-center font-black text-sm text-[#c273ed]">
                      {i + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{song.title}</p>
                      <p className="text-[10px] text-white/50 truncate">{song.artists}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/40">{song.audioFormat}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="space-y-3 px-3 pb-32 pt-2">
            <h2 className="text-base font-bold text-white">Thư Viện Bài Hát Yêu Thích</h2>
            {likedSongs.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8">Chưa có bài hát yêu thích</p>
            ) : (
              <div className="space-y-2">
                {likedSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => playSong(song)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5"
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{song.title}</p>
                      <p className="text-[10px] text-white/50 truncate">{song.artists}</p>
                    </div>
                    <button onClick={() => toggleLike(song.id)} className="p-1 text-red-500">
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0718] flex flex-col items-center justify-start sm:py-6">
      {/* Top Banner on Desktop when viewing Mobile App mode */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md px-4 py-2 mb-3 bg-[#170f23] rounded-xl border border-white/10 text-xs text-white">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#c273ed]" />
          <span className="font-semibold">XuanKen Music - Giao diện Mobile App</span>
        </div>
        <button
          onClick={() => setViewMode('pc')}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#9b4de0] hover:bg-[#8539c9] text-white rounded-lg font-medium transition-colors"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Về Web PC</span>
        </button>
      </div>

      {/* Phone Mockup Frame or Direct Full Screen on real phone */}
      <div className="w-full sm:max-w-[420px] sm:h-[860px] sm:rounded-[44px] sm:border-[8px] sm:border-zinc-800 sm:ring-1 sm:ring-white/20 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] bg-[#120822] flex flex-col relative overflow-hidden">
        {/* Dynamic Island / Notch on Desktop Mockup */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#170f23]">
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

        {/* Modals */}
        <MobileFullPlayerModal />
        <DemoLimitModal />
        <BuySongModal />
        <TopUpModal />
        <LoginModal />
        <LrcViewerModal />
        <ThemeSelectorModal />
        <SleepTimerModal />
        <KaraokeLyricsModal />
      </div>
    </div>
  );
};
