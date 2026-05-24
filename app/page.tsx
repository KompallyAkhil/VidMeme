'use client';

import { useRef, useState, useCallback } from 'react';
import MemeCanvas, { MemeCanvasHandle } from '@/components/MemeCanvas';
import VideoUploader from '@/components/VideoUploader';
import StylePresets from '@/components/StylePresets';
import TextControls from '@/components/TextControls';
import ExportButton from '@/components/ExportButton';
import { MemeTextConfig, MemeStyle, DEFAULT_CONFIG, MEME_TEMPLATES } from '@/lib/memeRenderer';

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [config, setConfig] = useState<MemeTextConfig>(DEFAULT_CONFIG);
  const canvasRef = useRef<MemeCanvasHandle>(null);

  const handleVideoLoaded = useCallback((url: string, file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(url);
    setVideoName(file.name);
  }, [videoUrl]);

  const handleRemove = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setVideoName('');
  }, [videoUrl]);

  const patchConfig = useCallback((patch: Partial<MemeTextConfig>) =>
    setConfig(prev => ({ ...prev, ...patch })), []);

  const handleStyleChange = useCallback((style: MemeStyle) =>
    setConfig(prev => ({ ...prev, style })), []);

  const applyTemplate = useCallback((top: string, bottom: string) =>
    setConfig(prev => ({ ...prev, topText: top, bottomText: bottom, style: 'both-bars' })), []);

  return (
    <div className="grid h-screen overflow-hidden" style={{ gridTemplateRows: '56px 1fr' }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 border-b border-white/[0.08] bg-[rgba(10,10,15,0.9)] backdrop-blur-md z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-accent rounded-md flex items-center justify-center text-base">🎭</div>
          <span className="text-base font-bold tracking-tight text-brand-primary">
            Meme<span className="text-brand-accent">Forge</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent bg-brand-accent-dim border border-yellow-500/20 rounded-full px-2 py-0.5">
            BETA
          </span>
        </div>

        {/* Status chips */}
        {videoUrl && (
          <div className="flex items-center gap-3 text-[11px] text-brand-muted">
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-blink" />
              Live Preview
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
              ▶️ Click canvas to play / pause
            </div>
          </div>
        )}
      </header>

      {/* ── Editor Layout ── */}
      <div className="grid overflow-hidden" style={{ gridTemplateColumns: '280px 1fr 320px' }}>

        {/* LEFT PANEL */}
        <aside className="border-r border-white/[0.08] bg-brand-panel flex flex-col overflow-y-auto">

          {/* Upload */}
          <div className="p-4 border-b border-white/[0.08]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted mb-3">Video Source</p>
            <VideoUploader onVideoLoaded={handleVideoLoaded} videoName={videoName} onRemove={handleRemove} />
          </div>

          {/* Style presets */}
          <div className="p-4 border-b border-white/[0.08]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted mb-3">Meme Style</p>
            <StylePresets current={config.style} onChange={handleStyleChange} />
          </div>

          {/* Templates */}
          {/* <div className="p-4 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted mb-3">Quick Templates</p>
            <div className="flex flex-col gap-1.5">
              {MEME_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t.top, t.bottom)}
                  id={`template-${t.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 cursor-pointer text-left text-brand-secondary text-xs font-inter transition-all duration-200 hover:border-yellow-500/40 hover:bg-brand-accent-dim hover:text-brand-primary"
                >
                  <span className="text-lg flex-shrink-0">{t.emoji}</span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium text-brand-primary">{t.name}</div>
                    <div className="text-[10px] text-brand-muted truncate">{t.top}</div>
                  </div>
                </button>
              ))}
            </div>
          </div> */}
        </aside>

        {/* CENTER — Canvas */}
        <main className="bg-[#050508] flex flex-col items-center justify-center p-6 relative overflow-hidden canvas-glow">
          <MemeCanvas ref={canvasRef} videoUrl={videoUrl} config={config} />
        </main>

        {/* RIGHT PANEL */}
        <aside className="border-l border-white/[0.08] bg-brand-panel flex flex-col overflow-y-auto">
          <TextControls config={config} onChange={patchConfig} />
          <div className="flex-1" />
          <ExportButton canvasRef={canvasRef} hasVideo={!!videoUrl} />
        </aside>

      </div>
    </div>
  );
}
