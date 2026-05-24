'use client';

import { useRef, useState } from 'react';
import { MemeCanvasHandle } from './MemeCanvas';

interface ExportButtonProps {
  canvasRef: React.RefObject<MemeCanvasHandle | null>;
  hasVideo: boolean;
}

type ExportState = 'idle' | 'recording' | 'done' | 'error';

export default function ExportButton({ canvasRef, hasVideo }: ExportButtonProps) {
  const [state, setState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const handleExport = async () => {
    if (!hasVideo || !canvasRef.current) return;
    setState('recording');
    setProgress(0);
    setErrorMsg('');

    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setProgress(Math.min(95, tick * 1.5));
    }, 200);

    try {
      const blob = await canvasRef.current.startRecording();
      clearInterval(interval);
      setProgress(100);

      const url = URL.createObjectURL(blob);
      const a = downloadLinkRef.current!;
      a.href = url;
      a.download = `meme-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      clearInterval(interval);
      setErrorMsg(err instanceof Error ? err.message : 'Export failed');
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  const label = {
    idle: '⬇️ Export Meme Video',
    recording: '⏺ Recording...',
    done: '✅ Downloaded!',
    error: '❌ Failed',
  }[state];

  return (
    <div className="p-4 border-t border-white/[0.08] bg-brand-panel flex flex-col gap-3">
      <button
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
          state === 'recording'
            ? 'bg-brand-danger text-white animate-pulse-rec shadow-[0_0_15px_rgba(255,77,109,0.4)]'
            : !hasVideo
            ? 'bg-white/[0.04] text-brand-muted border border-white/[0.04] cursor-not-allowed'
            : 'bg-brand-accent text-brand-bg hover:shadow-accent hover:scale-[1.02] active:scale-[0.98]'
        }`}
        onClick={handleExport}
        disabled={!hasVideo || state === 'recording'}
        id="export-btn"
      >
        {label}
      </button>

      {state === 'recording' && (
        <div className="flex flex-col gap-1.5 text-xs text-brand-secondary">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-brand-danger">
            <span>Recording Canvas</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.08]">
            <div className="h-full bg-brand-danger transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">
            Please wait as the video plays through once to capture all frames.
          </div>
        </div>
      )}

      {state === 'done' && (
        <div className="text-[11px] font-medium text-brand-success flex items-center gap-1.5 bg-brand-success/10 border border-brand-success/20 rounded-lg p-2.5">
          <span className="text-sm">✓</span> Saved as .webm — check your Downloads!
        </div>
      )}

      {state === 'error' && (
        <div className="text-[11px] font-medium text-brand-danger flex items-center gap-1.5 bg-brand-danger/10 border border-brand-danger/20 rounded-lg p-2.5">
          <span className="text-sm">❌</span> {errorMsg}
        </div>
      )}

      <a ref={downloadLinkRef} style={{ display: 'none' }} />

      <div className="text-[10px] text-brand-muted flex items-start gap-1.5 leading-relaxed bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5">
        <span className="text-xs">💡</span>
        <span>Export runs a frame-by-frame recorder across the full video duration and downloads the resulting file.</span>
      </div>
    </div>
  );
}
