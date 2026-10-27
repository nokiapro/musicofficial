import React, { useState } from 'react';
import { X, FileText, Copy, Check, Download, Mic2 } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const LrcViewerModal: React.FC = () => {
  const { selectedLrcSong, setSelectedLrcSong, setIsLyricsOpen } = useMusic();
  const [copied, setCopied] = useState(false);

  if (!selectedLrcSong) return null;

  const rawLrc =
    selectedLrcSong.lrcRaw ||
    selectedLrcSong.lyrics
      .map((l) => {
        const m = Math.floor(l.time / 60);
        const s = Math.floor(l.time % 60);
        return `[${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}.00] ${l.text}`;
      })
      .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawLrc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawLrc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedLrcSong.title} - ${selectedLrcSong.artists}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                Tệp Lời Bài Hát (LRC): {selectedLrcSong.title}
              </h2>
              <p className="text-xs text-white/50">{selectedLrcSong.artists}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedLrcSong(null)}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LRC Code View */}
        <div className="mt-4 flex-1 overflow-y-auto rounded-xl bg-black/40 border border-white/10 p-4 font-mono text-xs text-purple-200/90 leading-relaxed whitespace-pre-wrap select-text">
          {rawLrc}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setSelectedLrcSong(null);
              setIsLyricsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            <Mic2 className="w-3.5 h-3.5 text-[#c273ed]" />
            <span>Xem Karaoke Trực Tiếp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép LRC'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#9b4de0] hover:bg-[#8539c9] text-white shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file .lrc</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
