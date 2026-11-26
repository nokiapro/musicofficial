import React, { useState } from 'react';
import { Clock, Trash2, Play, X, Music } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Visualizer } from '../common/Visualizer';
import { ArtistNames } from '../common/ArtistNames';
import { useAnimatedPresence } from '../../hooks/useAnimatedPresence';

export const DesktopQueueDrawer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    queue,
    history,
    playSong,
    removeFromQueue,
    clearQueue,
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    setIsSleepTimerModalOpen,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const { shouldRender, isClosing } = useAnimatedPresence(isQueueDrawerOpen, 220);

  if (!shouldRender) return null;

  return (
    <aside
      className={`w-80 h-full border-l glass-bar text-white flex flex-col z-20 shrink-0 select-none transition-colors ${
        isClosing ? 'animate-out slide-out-to-right' : 'animate-in slide-in-from-right'
      }`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-sidebar) 88%, transparent)',
        borderColor: 'rgba(255, 255, 255, 0.07)',
      }}
    >
      {/* Header with Tabs */}
      <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center p-1 bg-white/[0.06] border border-white/[0.07] rounded-full">
          <button
            onClick={() => setActiveTab('queue')}
            style={activeTab === 'queue' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Danh sách phát
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={activeTab === 'history' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Nghe gần đây
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSleepTimerModalOpen(true)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Hẹn giờ dừng nhạc"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsQueueDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'queue' ? (
          <>
            {/* Current Song Highlight */}
            {currentSong ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-accent)' }}>
                  Đang phát
                </p>
                <div
                  className="p-2.5 rounded-2xl flex items-center justify-between border shadow-md"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-accent) 36%, transparent)',
                  }}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative border border-white/15 bg-zinc-950/90 shadow flex items-center justify-center">
                      {currentSong.coverImage ? (
                        <img
                          src={currentSong.coverImage}
                          alt={currentSong.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-gradient-to-tr ${currentSong.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${currentSong.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                      >
                        {isPlaying ? (
                          <Visualizer barCount={4} height={14} color="#ffffff" />
                        ) : (
                          <Music className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-white truncate">{currentSong.title}</p>
                      <div className="text-xs text-white/70 truncate">
                        <ArtistNames artists={currentSong.artists} linkClassName="text-white/70 hover:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Next in Queue */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-white/55 uppercase tracking-wider">
                  Tiếp theo ({queue.length})
                </p>
                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="flex items-center gap-1 text-[11px] text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa tất cả</span>
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/45 rounded-2xl border border-dashed border-white/10">
                  Không còn bài hát nào trong hàng đợi
                </div>
              ) : (
                <div className="space-y-1">
                  {queue.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => playSong(song)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative border border-white/10 bg-zinc-950/90 shadow flex items-center justify-center">
                          {song.coverImage ? (
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                          >
                            <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                          </div>
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-[var(--color-accent)] transition-colors">{song.title}</p>
                          <div className="text-[11px] text-white/50 truncate">
                            <ArtistNames artists={song.artists} linkClassName="text-white/50 hover:text-white" />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(song.id);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity cursor-pointer"
                        title="Xóa khỏi hàng đợi"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* History Tab */
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Bài hát đã nghe gần đây ({history.length})
            </p>
            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/50">
                Chưa có lịch sử nghe bài hát
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((song, i) => (
                  <div
                    key={`${song.id}-${i}`}
                    onClick={() => playSong(song)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative border border-white/10 bg-zinc-950/90 shadow flex items-center justify-center"
                      >
                        {song.coverImage ? (
                          <img
                            src={song.coverImage}
                            alt={song.title}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                        >
                          <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                        </div>
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-[#c273ed] transition-colors">{song.title}</p>
                        <p className="text-[11px] text-white/50 truncate">{song.artists}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
