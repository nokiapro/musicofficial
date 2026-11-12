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
  CheckCircle,
  Send,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song } from '../../types/music';
import { ArtistNames } from '../common/ArtistNames';

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
    playlists,
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
    theme,
    setTheme,
  } = useMusic();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const isLiked = likedSongIds.includes(song.id);
  const isPurchased = isSongPurchased(song.id);
  const currentFormat = songFormatMap[song.id] || preferredAudioFormat;
  const isBlocked = isSongBlocked(song.id);
  const isAlreadyInPlaylist = playlists.some((p) => Array.isArray(p.songIds) && p.songIds.includes(song.id));

  const handleAnimatedClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

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
    setTimeout(() => handleAnimatedClose(), 800);
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
      className={`fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex flex-col justify-end select-none duration-200 ${
        isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
      }`}
      onClick={handleAnimatedClose}
    >
      <div
        data-theme={theme}
        className={`w-full max-w-md mx-auto border-t rounded-t-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col overflow-y-auto duration-200 ${
          isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-[var(--text-secondary)]/30 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] shrink-0">
          <div className="truncate pr-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{song.title}</h3>
            <div className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
              <ArtistNames artists={song.artists} linkClassName="text-[var(--text-secondary)] hover:text-purple-300" />
            </div>
          </div>
          <button
            onClick={handleAnimatedClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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

        {/* 9 Action items as required by user */}
        <div className="space-y-2 mt-3 flex-1 overflow-y-auto pr-0.5">
          {/* 1. Hẹn giờ */}
          <button
            onClick={() => {
              handleAnimatedClose();
              setIsSleepTimerModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-hover)] hover:opacity-90 transition-all border border-[var(--border-color)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">Hẹn giờ tắt nhạc</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Tự động tắt nhạc khi ngủ say</p>
              </div>
            </div>
            {sleepTimerRemainingSeconds !== null && (
              <span className="text-[10px] font-bold text-amber-300 font-mono bg-amber-500/20 px-2.5 py-1 rounded-md">
                {Math.floor(sleepTimerRemainingSeconds / 3600).toString().padStart(2, '0')}:
                {Math.floor((sleepTimerRemainingSeconds % 3600) / 60).toString().padStart(2, '0')}:
                {(sleepTimerRemainingSeconds % 60).toString().padStart(2, '0')}
              </span>
            )}
          </button>

          {/* 2. Chất lượng nhạc MP3 hay WAV */}
          <div className="p-3 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Waves className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">Chất lượng âm thanh</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Chọn phát định dạng MP3 hay WAV</p>
              </div>
            </div>
            {song.isAlbumTrack ? (
              <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white/40 opacity-50">
                128 Kbps
              </div>
            ) : (
              <div className="flex items-center p-1 rounded-xl bg-black/25 border border-[var(--border-color)] text-xs font-bold">
                <button
                  onClick={() => handleFormatChange('MP3')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    currentFormat === 'MP3'
                      ? 'bg-blue-600 text-white shadow font-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  MP3
                </button>
                <button
                  onClick={() => handleFormatChange('WAV')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    currentFormat === 'WAV'
                      ? 'bg-amber-600 text-white shadow font-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  WAV
                </button>
              </div>
            )}
          </div>

          {/* 4. Chia sẻ bài hát */}
          <button
            onClick={() => {
              handleAnimatedClose();
              openShareModal(song);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-hover)] hover:opacity-90 transition-all border border-[var(--border-color)] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">Chia sẻ bài hát</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Gửi link trực tiếp cho bạn bè</p>
              </div>
            </div>
          </button>

          {/* 5. Tải về */}
          <button
            onClick={() => {
              handleAnimatedClose();
              if (isPurchased) {
                openDownloadModal(song);
              } else {
                setSongToBuy(song);
                setIsDemoLimitModalOpen(true);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-hover)] hover:opacity-90 transition-all border border-[var(--border-color)] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">Tải về máy</p>
                <p className="text-[10px] text-[var(--text-secondary)]">
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
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-hover)] hover:opacity-90 transition-all border border-[var(--border-color)] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {isLiked ? 'Bỏ tim bài hát' : 'Thả tim bài hát'}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">Lưu vào thư viện yêu thích</p>
              </div>
            </div>
            {isLiked && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                Đã thích
              </span>
            )}
          </button>

          {/* 7. Thêm vào playlist */}
          <button
            onClick={() => {
              handleAnimatedClose();
              openAddToPlaylistModal(song);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border cursor-pointer ${
              isAlreadyInPlaylist
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[var(--bg-surface-hover)] hover:opacity-90 border-[var(--border-color)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isAlreadyInPlaylist ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
              }`}>
                {isAlreadyInPlaylist ? <CheckCircle className="w-4 h-4" /> : <ListPlus className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <p className={`text-xs font-bold ${isAlreadyInPlaylist ? 'text-emerald-400' : 'text-[var(--text-primary)]'}`}>
                  {isAlreadyInPlaylist ? 'Đã thêm vào playlist' : 'Thêm vào playlist'}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {isAlreadyInPlaylist ? 'Bài hát đã có trong playlist' : 'Đưa vào danh sách phát cá nhân'}
                </p>
              </div>
            </div>
            {isAlreadyInPlaylist && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Đã thêm
              </span>
            )}
          </button>

          {/* 8. Chặn bài hát */}
          <button
            onClick={handleBlockSong}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-hover)] hover:bg-red-500/10 transition-all border border-[var(--border-color)] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-red-400">
                  {isBlocked ? 'Đang chặn bài này' : 'Chặn bài hát này'}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">Không bao giờ tự phát bài này nữa</p>
              </div>
            </div>
          </button>

          {/* 9. Báo lỗi bài hát */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-hover)] hover:bg-amber-500/10 transition-all border border-[var(--border-color)] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-amber-400">
                  Báo lỗi bài hát
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">Âm thanh rè, link hỏng hoặc lỗi lời nhạc</p>
              </div>
            </div>
          </button>
        </div>

        {/* Modal Báo Lỗi Bài Hát */}
        {showReportModal && (
          <div
            data-theme={theme}
            className="fixed inset-0 z-[100000] bg-black/85 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <form
              onSubmit={handleSendReport}
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full max-w-sm border rounded-3xl p-5 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <h4 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Báo Lỗi Bài Hát</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Bài hát: <strong className="text-[var(--text-primary)]">{song.title}</strong>
              </p>
              <textarea
                rows={3}
                required
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Mô tả lỗi bạn gặp phải (âm thanh rè, link không phát, sai lời...)"
                className="w-full bg-black/25 border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSendingReport}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
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
