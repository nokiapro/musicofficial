import React, { useState } from 'react';
import { X, Download, Music2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const DownloadModal: React.FC = () => {
  const {
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    songToDownload,
    downloadSong,
  } = useMusic();

  const [downloadingFormat, setDownloadingFormat] = useState<'MP3' | 'WAV' | null>(null);
  const [downloadMsg, setDownloadMsg] = useState<{ isError: boolean; text: string } | null>(null);

  if (!isDownloadModalOpen || !songToDownload) return null;

  const handleDownload = async (format: 'MP3' | 'WAV') => {
    setDownloadingFormat(format);
    setDownloadMsg(null);
    try {
      const res = await downloadSong(songToDownload, format);
      if (res.success) {
        setDownloadMsg({ isError: false, text: `✅ Đang tải bài hát định dạng ${format} về thiết bị!` });
      } else {
        setDownloadMsg({ isError: true, text: `⚠️ ${res.message || 'Lỗi khi tải file nhạc'}` });
      }
    } catch (e: any) {
      setDownloadMsg({ isError: true, text: `❌ Lỗi: ${e?.message || 'Không thể tải bài hát'}` });
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleClose = () => {
    setIsDownloadModalOpen(false);
    setDownloadMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 text-white space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tải Nhạc Về Máy</h2>
              <p className="text-[11px] text-white/50">Chọn định dạng âm thanh chất lượng cao để tải về</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 relative">
            {songToDownload.coverImage ? (
              <img
                src={songToDownload.coverImage}
                alt={songToDownload.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <div className={`w-full h-full bg-gradient-to-tr ${songToDownload.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${songToDownload.coverImage ? 'absolute inset-0 -z-10' : ''}`}>
              <Music2 className="w-6 h-6 text-white/70" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{songToDownload.title}</h3>
            <p className="text-xs text-white/60 truncate mt-0.5">{songToDownload.artists}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Đã mua bản quyền
            </span>
          </div>
        </div>

        {/* Download Options */}
        <div className="space-y-3">
          <button
            onClick={() => handleDownload('MP3')}
            disabled={downloadingFormat !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/30 to-blue-500/10 hover:from-blue-600/50 hover:to-blue-500/20 border border-blue-500/40 text-left transition-all group active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                MP3
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                  Tải Bản MP3 (320kbps)
                </p>
                <p className="text-[11px] text-white/50 truncate">Dung lượng nhẹ, tương thích mọi thiết bị di động</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shrink-0 whitespace-nowrap">
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{downloadingFormat === 'MP3' ? 'Đang tải...' : 'Tải MP3'}</span>
            </div>
          </button>

          <button
            onClick={() => handleDownload('WAV')}
            disabled={downloadingFormat !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-600/30 to-amber-500/10 hover:from-amber-600/50 hover:to-amber-500/20 border border-amber-500/40 text-left transition-all group active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                WAV
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5 truncate">
                  <span>Tải Bản WAV</span>
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                </p>
                <p className="text-[11px] text-white/50 truncate">Chất lượng âm thanh chuẩn phòng thu, chi tiết sắc nét</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shrink-0 whitespace-nowrap">
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{downloadingFormat === 'WAV' ? 'Đang tải...' : 'Tải WAV'}</span>
            </div>
          </button>
        </div>

        {/* Feedback message */}
        {downloadMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              downloadMsg.isError
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {downloadMsg.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{downloadMsg.text}</span>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
