'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
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

  const [borderHeight, setBorderHeight] = useState(120);
  const [borderColor, setBorderColor] = useState('#000000');

  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState('');

  const canvasRef = useRef<MemeCanvasHandle>(null);

  // Refs for stable callbacks — avoids stale closures and unstable identities
  const videoUrlRef = useRef<string | null>(videoUrl);
  const borderHeightRef = useRef(borderHeight);
  const borderColorRef = useRef(borderColor);
  useEffect(() => { videoUrlRef.current = videoUrl; }, [videoUrl]);
  useEffect(() => { borderHeightRef.current = borderHeight; }, [borderHeight]);
  useEffect(() => { borderColorRef.current = borderColor; }, [borderColor]);

  // ── Video ─────────────────────────────────────────────────────────────────
  // Stable callback — reads URL from ref so its identity never changes,
  // preventing MemeCanvas from re-rendering just because videoUrl changed.
  const handleVideoLoaded = useCallback((url: string, file: File) => {
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    setVideoUrl(url);
    setVideoName(file.name);
    setVideoFile(file);
  }, []); // intentionally empty — reads live value via ref

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
      // Read borderHeight/borderColor from refs to avoid stale closure values
      // (user may have changed them after the callback was created)
      const blob = await exportInBackground(
        videoFile,
        layers,
        format,
        borderHeightRef.current,
        borderColorRef.current,
        (p) => setExportProgress(p)
      );
      setExportProgress(100);

      let ext = 'mp4';
      if (format === 'mp3') {
        ext = 'mp3';
      } else if (blob.type.includes('webm')) {
        ext = 'webm';
      } else if (blob.type.includes('ogg')) {
        ext = 'ogg';
      }
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
  }, [videoFile, layers]); // borderHeight/borderColor are read via refs — no extra deps

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
          
          <span className="text-base font-bold tracking-tight text-brand-primary font-inter">
            Vide<span className="text-brand-accent">Meme</span>
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
        <div className="w-56 flex-shrink-0">
          {videoName && (
            <VideoUploader compact onVideoLoaded={handleVideoLoaded} videoName={videoName} onRemove={handleRemove} />
          )}
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
            onVideoLoaded={handleVideoLoaded}
            borderHeight={borderHeight}
            borderColor={borderColor}
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
          borderHeight={borderHeight}
          borderColor={borderColor}
          onUpdateBorderHeight={setBorderHeight}
          onUpdateBorderColor={setBorderColor}
        />
      </div>
    </div>
  );
}
