import React, { useState } from 'react';
import { Clock, Trash2, Play, MoreHorizontal, X, Music } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Visualizer } from '../common/Visualizer';

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

  if (!isQueueDrawerOpen) return null;

  return (
    <aside
      className="w-80 h-full border-l text-white flex flex-col z-20 shrink-0 select-none animate-in slide-in-from-right duration-200 transition-colors"
      style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
    >
      {/* Header with Tabs */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center p-1 bg-white/10 rounded-full">
          <button
            onClick={() => setActiveTab('queue')}
            style={activeTab === 'queue' ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
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
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
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
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Hẹn giờ dừng nhạc"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsQueueDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'queue' ? (
          <>
            {/* Current Song Highlight */}
            {currentSong ? (
              <div>
                <p className="text-[11px] font-semibold text-[#c273ed] uppercase tracking-wider mb-2">
                  Đang phát
                </p>
                <div className="p-2.5 rounded-xl bg-[#9b4de0]/20 border border-[#9b4de0]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${currentSong.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center shrink-0 relative`}
                    >
                      {isPlaying ? (
                        <Visualizer barCount={4} height={14} color="#ffffff" />
                      ) : (
                        <Music className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-white truncate">{currentSong.title}</p>
                      <p className="text-xs text-[#c273ed] truncate">{currentSong.artists}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Next in Queue */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Tiếp theo ({queue.length})
                </p>
                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="flex items-center gap-1 text-[11px] text-white/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa tất cả</span>
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/50">
                  Không còn bài hát nào trong hàng đợi
                </div>
              ) : (
                <div className="space-y-1">
                  {queue.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => playSong(song)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shrink-0 relative`}
                        >
                          <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                          <p className="text-[11px] text-white/50 truncate">{song.artists}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(song.id);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity"
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
                        className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shrink-0 relative`}
                      >
                        <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{song.title}</p>
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
