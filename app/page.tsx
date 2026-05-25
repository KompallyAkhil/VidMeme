'use client';

import { useRef, useState, useCallback } from 'react';
import MemeCanvas, { MemeCanvasHandle } from '@/components/MemeCanvas';
import EditorPanel from '@/components/EditorPanel';
import VideoUploader from '@/components/VideoUploader';
import { TextLayer, makeLayer } from '@/lib/textLayers';
import { exportInBackground } from '@/lib/backgroundCompiiler';

type ExportState = 'idle' | 'exporting' | 'done' | 'error';

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [layers, setLayers] = useState<TextLayer[]>([makeLayer()]);
  const [selectedId, setSelectedId] = useState<string | null>(layers[0]?.id ?? null);

  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState('');

  const canvasRef = useRef<MemeCanvasHandle>(null);

  // ── Video ─────────────────────────────────────────────────────────────────
  const handleVideoLoaded = useCallback((url: string, file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(url);
    setVideoName(file.name);
    setVideoFile(file);
  }, [videoUrl]);

  const handleRemove = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setVideoName('');
    setVideoFile(null);
  }, [videoUrl]);

  // ── Layers ────────────────────────────────────────────────────────────────
  const addLayer = useCallback((x = 0.5, y = 0.15) => {
    const layer = makeLayer({ x, y, text: 'TEXT' });
    setLayers(prev => [...prev, layer]);
    setSelectedId(layer.id);
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setLayers(prev => {
      const next = prev.filter(l => l.id !== id);
      if (selectedId === id) setSelectedId(next[next.length - 1]?.id ?? null);
      return next;
    });
  }, [selectedId]);

  const updateLayer = useCallback((id: string, patch: Partial<TextLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const moveLayer = useCallback((id: string, x: number, y: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, x, y } : l));
  }, []);

  const handleEditLayer = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = useCallback(async (format: 'mp4' | 'mp3') => {
    if (!videoFile) return;
    setExportState('exporting');
    setExportProgress(0);
    setExportError('');

    try {
      const blob = await exportInBackground(videoFile, layers, format, (p) => setExportProgress(p));
      setExportProgress(100);

      const ext = format === 'mp3' ? 'mp3' : 'mp4';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 15_000);

      setExportState('done');
      setTimeout(() => setExportState('idle'), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Export] failed:', err);
      setExportError(msg);
      setExportState('error');
      setTimeout(() => setExportState('idle'), 8000);
    }
  }, [videoFile, layers]);

  const handleCopyPng = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await canvas.getOverlayPng();
      // Download as PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      console.error('[CopyPng] failed:', err);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#080810]">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-white/[0.07] bg-[rgba(8,8,16,0.95)] backdrop-blur-md z-10 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-accent rounded-md flex items-center justify-center text-base shadow-[0_0_12px_rgba(255,200,0,0.3)]">🎭</div>
          <span className="text-base font-bold tracking-tight text-brand-primary font-inter">
            Meme<span className="text-brand-accent">Forge</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent bg-brand-accent-dim border border-yellow-500/20 rounded-full px-2 py-0.5">
            BETA
          </span>
        </div>

        {/* Video name + status */}
        {videoName && (
          <div className="flex items-center gap-2 text-[12px]">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-success animate-blink" />
            <span className="text-brand-primary font-medium truncate max-w-xs">{videoName}</span>
          </div>
        )}

        {/* Upload / Remove */}
        <div className="w-52 flex-shrink-0">
          <VideoUploader compact onVideoLoaded={handleVideoLoaded} videoName={videoName} onRemove={handleRemove} />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* CENTER — Canvas */}
        <main className="flex-1 bg-[#050508] relative overflow-hidden canvas-glow flex flex-col items-center justify-center p-6">
          <MemeCanvas
            ref={canvasRef}
            videoUrl={videoUrl}
            videoName={videoName}
            layers={layers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={moveLayer}
            onAddLayer={addLayer}
            onEditLayer={handleEditLayer}
          />
        </main>

        {/* RIGHT — Editor */}
        <EditorPanel
          layers={layers}
          selectedId={selectedId}
          videoFile={videoFile}
          exportState={exportState}
          exportProgress={exportProgress}
          exportError={exportError}
          onSelect={setSelectedId}
          onAddLayer={() => addLayer()}
          onDeleteLayer={deleteLayer}
          onUpdateLayer={updateLayer}
          onExport={handleExport}
          onCopyPng={handleCopyPng}
        />
      </div>
    </div>
  );
}
