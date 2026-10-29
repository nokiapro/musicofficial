import React, { useState } from 'react';
import {
  X,
  Clock,
  Palette,
  Waves,
  Share2,
  Download,
  Heart,
  ListPlus,
  Ban,
  AlertTriangle,
  Check,
  Send,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song } from '../../types/music';

interface MobilePlayerActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
}

export const MobilePlayerActionSheet: React.FC<MobilePlayerActionSheetProps> = ({
  isOpen,
  onClose,
  song,
}) => {
  const {
    likedSongIds,
    toggleLike,
    isSongPurchased,
    openDownloadModal,
    openShareModal,
    openAddToPlaylistModal,
    setIsThemeModalOpen,
    setIsSleepTimerModalOpen,
    sleepTimerRemainingSeconds,
    preferredAudioFormat,
    songFormatMap,
    setSongAudioFormat,
    playSong,
    blockSong,
    isSongBlocked,
    reportSongIssue,
    setSongToBuy,
    setIsDemoLimitModalOpen,
  } = useMusic();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);

  if (!isOpen) return null;

  const isLiked = likedSongIds.includes(song.id);
  const isPurchased = isSongPurchased(song.id);
  const currentFormat = songFormatMap[song.id] || preferredAudioFormat;
  const isBlocked = isSongBlocked(song.id);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleToggleLike = () => {
    toggleLike(song.id);
    showToast(isLiked ? 'Đã bỏ tim bài hát' : 'Đã thả tim bài hát!');
  };

  const handleFormatChange = (newFmt: 'MP3' | 'WAV') => {
    setSongAudioFormat(song.id, newFmt);
    playSong(song, newFmt);
    showToast(`Đã chuyển sang chất lượng ${newFmt}`);
  };

  const handleBlockSong = () => {
    blockSong(song.id);
    showToast('Đã chặn bài hát này! Bài hát sẽ tự động bỏ qua.');
    setTimeout(() => onClose(), 800);
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    setIsSendingReport(true);
    await reportSongIssue(song.id, reportText.trim());
    setIsSendingReport(false);
    setShowReportModal(false);
    setReportText('');
    showToast('Cảm ơn bạn! Đã gửi báo cáo lỗi thành công.');
  };

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex flex-col justify-end select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-[#1a0f2b] border-t border-white/15 rounded-t-3xl shadow-2xl p-5 text-white max-h-[85vh] flex flex-col overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="truncate pr-2">
            <h3 className="text-sm font-bold text-white truncate">{song.title}</h3>
            <p className="text-[11px] text-white/50 truncate mt-0.5">{song.artists}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="my-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 9 Action items as required by user in Item 20 */}
        <div className="space-y-1.5 mt-3 flex-1 overflow-y-auto pr-0.5">
          {/* 1. Hẹn giờ */}
          <button
            onClick={() => {
              onClose();
              setIsSleepTimerModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Hẹn giờ tắt nhạc</p>
                <p className="text-[10px] text-white/50">Tự động tắt nhạc khi ngủ say</p>
              </div>
            </div>
            {sleepTimerRemainingSeconds !== null && (
              <span className="text-[10px] font-bold text-amber-300 font-mono bg-amber-500/20 px-2 py-0.5 rounded-md">
                {Math.ceil(sleepTimerRemainingSeconds / 60)} phút
              </span>
            )}
          </button>

          {/* 2. Tùy chỉnh giao diện */}
          <button
            onClick={() => {
              onClose();
              setIsThemeModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-[#c273ed] flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Tùy chỉnh giao diện</p>
                <p className="text-[10px] text-white/50">Chọn 8 bộ màu sắc chủ đề</p>
              </div>
            </div>
          </button>

          {/* 3. Chất lượng nhạc MP3 hay WAV */}
          <div className="p-3 rounded-2xl bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Waves className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Chất lượng âm thanh</p>
                <p className="text-[10px] text-white/50">Chọn phát định dạng MP3 hay WAV</p>
              </div>
            </div>
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-bold">
              <button
                onClick={() => handleFormatChange('MP3')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  currentFormat === 'MP3'
                    ? 'bg-blue-600 text-white shadow font-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                MP3
              </button>
              <button
                onClick={() => handleFormatChange('WAV')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  currentFormat === 'WAV'
                    ? 'bg-amber-600 text-white shadow font-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                WAV
              </button>
            </div>
          </div>

          {/* 4. Chia sẻ bài hát */}
          <button
            onClick={() => {
              onClose();
              openShareModal(song);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Chia sẻ bài hát</p>
                <p className="text-[10px] text-white/50">Gửi link trực tiếp cho bạn bè</p>
              </div>
            </div>
          </button>

          {/* 5. Tải về */}
          <button
            onClick={() => {
              onClose();
              if (isPurchased) {
                openDownloadModal(song);
              } else {
                setSongToBuy(song);
                setIsDemoLimitModalOpen(true);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Tải về máy</p>
                <p className="text-[10px] text-white/50">
                  {isPurchased ? 'Tải file MP3 hoặc WAV' : 'Mua bản quyền để tải về'}
                </p>
              </div>
            </div>
            {!isPurchased && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                Chưa mua
              </span>
            )}
          </button>

          {/* 6. Tim bài hát */}
          <button
            onClick={handleToggleLike}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">
                  {isLiked ? 'Bỏ tim bài hát' : 'Thả tim bài hát'}
                </p>
                <p className="text-[10px] text-white/50">Lưu vào thư viện yêu thích</p>
              </div>
            </div>
            {isLiked && (
              <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded">
                Đã thích
              </span>
            )}
          </button>

          {/* 7. Thêm vào playlist */}
          <button
            onClick={() => {
              onClose();
              openAddToPlaylistModal(song);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ListPlus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Thêm vào playlist</p>
                <p className="text-[10px] text-white/50">Đưa vào danh sách phát cá nhân</p>
              </div>
            </div>
          </button>

          {/* 8. Chặn bài hát */}
          <button
            onClick={handleBlockSong}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-red-500/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white group-hover:text-red-300">
                  {isBlocked ? 'Đang chặn bài này' : 'Chặn bài hát này'}
                </p>
                <p className="text-[10px] text-white/50">Không bao giờ tự phát bài này nữa</p>
              </div>
            </div>
          </button>

          {/* 9. Báo lỗi bài hát */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-amber-500/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white group-hover:text-amber-300">
                  Báo lỗi bài hát
                </p>
                <p className="text-[10px] text-white/50">Âm thanh rè, link hỏng hoặc lỗi lời nhạc</p>
              </div>
            </div>
          </button>
        </div>

        {/* Modal Báo Lỗi Bài Hát */}
        {showReportModal && (
          <div
            className="fixed inset-0 z-[100000] bg-black/85 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <form
              onSubmit={handleSendReport}
              className="w-full max-w-sm bg-[#231b2e] border border-white/15 rounded-3xl p-5 text-white space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Báo Lỗi Bài Hát</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/70">
                Bài hát: <strong className="text-white">{song.title}</strong>
              </p>
              <textarea
                rows={3}
                required
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Mô tả lỗi bạn gặp phải (âm thanh rè, link không phát, sai lời...)"
                className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#9b4de0]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-1.5 text-xs text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSendingReport}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReport ? 'Đang gửi...' : 'Gửi Báo Lỗi'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
