import React from 'react';
import { X, Trophy, Clock, Play, Headphones, Sparkles, Award } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const XuanKenRewindModal: React.FC = () => {
  const { isRewindModalOpen, setIsRewindModalOpen, rewindStats, songs, playSong } = useMusic();

  if (!isRewindModalOpen) return null;

  const totalSecs = Math.max(0, Math.floor(rewindStats.totalSeconds || 0));
  const hours = Math.floor(totalSecs / 3600);
  const remainingSecs = totalSecs % 3600;
  const minutes = Math.floor(remainingSecs / 60);
  const seconds = remainingSecs % 60;

  const formattedListeningTime =
    hours > 0
      ? `${hours} giờ ${minutes} phút ${seconds} giây`
      : minutes > 0
      ? `${minutes} phút ${seconds} giây`
      : `${seconds} giây`;

  // Calculate top songs accurately from rewindStats.songPlays
  const songPlaysList = Object.entries(rewindStats.songPlays || {})
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => {
      const song = songs.find((s) => s.id === id);
      return { id, count, song };
    })
    .filter((item) => item.song)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate top artist accurately from rewindStats.artistPlays
  const topArtistEntry = Object.entries(rewindStats.artistPlays || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0];
  const topArtist = topArtistEntry ? topArtistEntry[0] : (songs[0]?.artists || 'XuanKen Official');

  // Badge calculation
  const totalMinutes = Math.floor(totalSecs / 60);
  let badgeTitle = 'Thính Giả Khởi Động';
  let badgeDesc = 'Bạn đang bắt đầu hành trình thưởng thức âm nhạc bản quyền.';
  if (totalMinutes >= 120) {
    badgeTitle = '👑 Huyền Thoại Âm Nhạc XuanKen';
    badgeDesc = 'Bạn là thính giả trung thành nhất với hơn 2 giờ đắm chìm trong âm nhạc!';
  } else if (totalMinutes >= 45) {
    badgeTitle = '🔥 Fan Cứng XuanKen';
    badgeDesc = 'Giai điệu âm nhạc luôn đồng hành trong từng khoảnh khắc của bạn.';
  } else if (totalMinutes >= 10) {
    badgeTitle = '🎧 Người Yêu Âm Nhạc';
    badgeDesc = 'Bạn có gu âm nhạc tuyệt vời và dành nhiều thời gian để thưởng thức.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#2b1044] via-[#1a0a2a] to-[#0f051a] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-white max-h-[90vh] flex flex-col relative">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 text-white flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 text-white">
                <span>XUANKEN REWIND</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-extrabold uppercase">
                  2026
                </span>
              </h2>
              <p className="text-[11px] text-purple-300">Nhìn lại hành trình âm nhạc cá nhân của bạn</p>
            </div>
          </div>
          <button
            onClick={() => setIsRewindModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 py-1">
          {/* Fan Badge Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/30 text-center relative overflow-hidden shadow-lg">
            <div className="flex justify-center mb-1">
              <Award className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>
            <h3 className="text-base font-extrabold text-amber-300">{badgeTitle}</h3>
            <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto">{badgeDesc}</p>
          </div>

          {/* Stats 2-column Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-[#c273ed] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-white/50 uppercase font-bold">Thời gian nghe</p>
                <p className="text-base font-black text-white">
                  {formattedListeningTime}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-white/50 uppercase font-bold">Tổng lượt phát</p>
                <p className="text-base font-black text-white">
                  {rewindStats.totalPlays} lần
                </p>
              </div>
            </div>
          </div>

          {/* Top Artist */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                🎤
              </div>
              <div>
                <p className="text-[10px] text-white/50 uppercase font-bold">Nghệ sĩ yêu thích #1</p>
                <p className="text-sm font-bold text-white">{topArtist}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30">
              Top 1
            </span>
          </div>

          {/* Top Songs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Bài Hát Nghe Nhiều Nhất</span>
            </h4>

            {songPlaysList.length === 0 ? (
              <div className="py-6 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                Hãy nghe thêm nhạc để khám phá các bài hát yêu thích của bạn!
              </div>
            ) : (
              <div className="space-y-1.5">
                {songPlaysList.map((item, idx) => {
                  const song = item.song!;
                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        playSong(song);
                        setIsRewindModalOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/40 flex items-center justify-between cursor-pointer transition-all active:scale-98"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-5 text-center font-black text-xs ${
                          idx === 0 ? 'text-amber-400 font-extrabold text-sm' : idx === 1 ? 'text-cyan-400' : 'text-white/50'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-purple-900/40 shrink-0">
                          {song.coverImage ? (
                            <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white/50">XK</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 truncate">
                          <p className="text-xs font-bold text-white truncate">{song.title}</p>
                          <p className="text-[10px] text-white/50 truncate">{song.artists}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-purple-300 font-semibold">{item.count} lượt</span>
                        <div className="w-7 h-7 rounded-full bg-[#9b4de0] text-white flex items-center justify-center shadow-md">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-white/40">Thống kê tự động theo thời gian thực</p>
          <button
            onClick={() => setIsRewindModalOpen(false)}
            className="px-5 py-2 text-xs font-bold bg-[#9b4de0] hover:bg-[#8539c9] text-white rounded-xl shadow-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
