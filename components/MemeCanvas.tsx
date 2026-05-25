'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { TextLayer, drawLayers } from '@/lib/textLayers';
import VideoUploader from './VideoUploader';

interface MemeCanvasProps {
  videoUrl: string | null;
  videoName: string;
  layers: TextLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onAddLayer: (x: number, y: number) => void;
  onEditLayer: (id: string) => void;
  onVideoLoaded: (url: string, file: File) => void;
  borderHeight: number;
  borderColor: string;
}

export interface MemeCanvasHandle {
  getOverlayPng: () => Promise<Blob>;
}

// ── Watermark helper ────────────────────────────────────────────────────────
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const ws = Math.max(12, Math.round(w * 0.022));
  ctx.font = `bold ${ws}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  const padX = w * 0.03;
  const padY = h - h * 0.03;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = Math.max(2, Math.round(ws * 0.18));
  ctx.strokeText('🎭 VidMeme', padX, padY);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('🎭 VidMeme', padX, padY);
  ctx.restore();
}

const MemeCanvas = forwardRef<MemeCanvasHandle, MemeCanvasProps>(
  ({ videoUrl, videoName, layers, selectedId, onSelect, onMove, onAddLayer, onEditLayer, onVideoLoaded, borderHeight, borderColor }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    // Cache the 2D context so getContext() isn't called on every frame
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const animRef = useRef<number>(0);
    const playingRef = useRef(false);
    const layersRef = useRef(layers);
    const selectedIdRef = useRef(selectedId);
    const borderHeightRef = useRef(borderHeight);
    const borderColorRef = useRef(borderColor);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => { layersRef.current = layers; }, [layers]);
    useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
    useEffect(() => { borderHeightRef.current = borderHeight; }, [borderHeight]);
    useEffect(() => { borderColorRef.current = borderColor; }, [borderColor]);

    // Lazily retrieve (and cache) the 2D context
    const getCtx = useCallback((): CanvasRenderingContext2D | null => {
      if (ctxRef.current) return ctxRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return null;
      ctxRef.current = canvas.getContext('2d');
      return ctxRef.current;
    }, []);

    // Invalidate cached context whenever the canvas element changes size,
    // because resizing a canvas resets its context state.
    const resetCtx = useCallback(() => {
      ctxRef.current = null;
    }, []);

    // ── Render loop ──────────────────────────────────────────────────────────
    const render = useCallback(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = getCtx();
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw border bar
      ctx.fillStyle = borderColorRef.current;
      ctx.fillRect(0, 0, canvas.width, borderHeightRef.current);

      // Draw video below the border bar
      ctx.drawImage(video, 0, borderHeightRef.current, canvas.width, canvas.height - borderHeightRef.current);

      drawWatermark(ctx, canvas.width, canvas.height);
      drawLayers(ctx, canvas.width, canvas.height, layersRef.current, selectedIdRef.current ?? undefined, true);
      animRef.current = requestAnimationFrame(render);
    }, [getCtx]);

    const drawStatic = useCallback(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState < 2 || playingRef.current) return;
      const ctx = getCtx();
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw border bar
      ctx.fillStyle = borderColorRef.current;
      ctx.fillRect(0, 0, canvas.width, borderHeightRef.current);

      // Draw video below the border bar
      ctx.drawImage(video, 0, borderHeightRef.current, canvas.width, canvas.height - borderHeightRef.current);

      drawWatermark(ctx, canvas.width, canvas.height);
      drawLayers(ctx, canvas.width, canvas.height, layersRef.current, selectedIdRef.current ?? undefined, true);
    }, [getCtx]);

    // Redraw when layers or selection change while paused
    useEffect(() => { drawStatic(); }, [layers, selectedId, drawStatic]);

    // Play / pause events
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const play = () => {
        playingRef.current = true;
        setIsPlaying(true);
        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(render);
      };
      const stop = () => {
        playingRef.current = false;
        setIsPlaying(false);
        cancelAnimationFrame(animRef.current);
        drawStatic();
      };
      video.addEventListener('play', play);
      video.addEventListener('pause', stop);
      video.addEventListener('ended', stop);
      return () => {
        video.removeEventListener('play', play);
        video.removeEventListener('pause', stop);
        video.removeEventListener('ended', stop);
        cancelAnimationFrame(animRef.current);
      };
    }, [render, drawStatic]);

    // Handle borderHeight change → resize canvas AND redraw
    useEffect(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState < 2) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight + borderHeight;
      // Canvas resize invalidates context state — reset cached ctx
      resetCtx();
      drawStatic();
    }, [borderHeight, drawStatic, resetCtx]);

    // Handle borderColor change → redraw only (no resize needed)
    useEffect(() => {
      drawStatic();
    }, [borderColor, drawStatic]);

    // Load video
    useEffect(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      cancelAnimationFrame(animRef.current);
      playingRef.current = false;
      setIsPlaying(false);

      if (!videoUrl) {
        getCtx()?.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      video.src = videoUrl;
      video.load();

      const onMeta = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight + borderHeightRef.current;
        // Canvas resize invalidates context state
        resetCtx();
        video.currentTime = 0.1;
      };
      const onSeeked = () => {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = borderColorRef.current;
        ctx.fillRect(0, 0, canvas.width, borderHeightRef.current);
        ctx.drawImage(video, 0, borderHeightRef.current, canvas.width, canvas.height - borderHeightRef.current);
        drawWatermark(ctx, canvas.width, canvas.height);
        drawLayers(ctx, canvas.width, canvas.height, layersRef.current, selectedIdRef.current ?? undefined, true);
      };

      video.addEventListener('loadedmetadata', onMeta);
      video.addEventListener('seeked', onSeeked);
      return () => {
        video.removeEventListener('loadedmetadata', onMeta);
        video.removeEventListener('seeked', onSeeked);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoUrl]);

    // ── Expose API ───────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      getOverlayPng: async () => {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas not ready');
        const tmp = document.createElement('canvas');
        tmp.width = canvas.width;
        tmp.height = canvas.height;
        const ctx = tmp.getContext('2d')!;
        ctx.clearRect(0, 0, tmp.width, tmp.height);
        drawLayers(ctx, tmp.width, tmp.height, layersRef.current, undefined, false);
        return new Promise<Blob>((res, rej) =>
          tmp.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png')
        );
      },
    }));

    // ── Pointer interaction ──────────────────────────────────────────────────
    const hitTest = useCallback((ex: number, ey: number): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (ex - rect.left) * scaleX;
      const cy = (ey - rect.top) * scaleY;

      // Reuse the cached context for measuring text (avoids re-creating)
      const ctx = getCtx();
      if (!ctx) return null;

      // Test layers in reverse (top-most first)
      for (let i = layersRef.current.length - 1; i >= 0; i--) {
        const l = layersRef.current[i];
        ctx.font = `${l.bold ? 'bold ' : ''}${l.fontSize}px "${l.fontFamily}", Arial Black, sans-serif`;
        const tw = ctx.measureText(l.text).width;
        const th = l.fontSize;
        const px = l.x * canvas.width;
        const py = l.y * canvas.height;
        const ox = l.align === 'center' ? -tw / 2 : l.align === 'right' ? -tw : 0;
        const pad = 12;
        if (cx >= px + ox - pad && cx <= px + ox + tw + pad &&
            cy >= py - th / 2 - pad && cy <= py + th / 2 + pad) {
          return l.id;
        }
      }
      return null;
    }, [getCtx]);

    const dragRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startLayerX: number; startLayerY: number } | null>(null);
    const clickTargetRef = useRef<string | null>(null);
    const lastClickRef = useRef<{ id: string; time: number } | null>(null);
    // RAF guard for pointer-move throttle — prevents redundant move calls mid-frame
    const movePendingRef = useRef(false);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const hit = hitTest(e.clientX, e.clientY);
      clickTargetRef.current = hit;

      if (hit) {
        onSelect(hit);
        const layer = layersRef.current.find(l => l.id === hit)!;
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        dragRef.current = {
          id: hit,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startLayerX: layer.x,
          startLayerY: layer.y,
        };
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } else {
        onSelect(null);
      }
    }, [hitTest, onSelect]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      // RAF throttle: skip if a move update is already queued this frame
      if (movePendingRef.current) return;
      movePendingRef.current = true;

      const clientX = e.clientX;
      const clientY = e.clientY;

      requestAnimationFrame(() => {
        movePendingRef.current = false;
        const canvas = canvasRef.current;
        if (!canvas || !dragRef.current) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const dx = (clientX - drag.startMouseX) * scaleX / canvas.width;
        const dy = (clientY - drag.startMouseY) * scaleY / canvas.height;
        onMove(drag.id, Math.max(0, Math.min(1, drag.startLayerX + dx)), Math.max(0, Math.min(1, drag.startLayerY + dy)));
        if (!playingRef.current) drawStatic();
      });
    }, [onMove, drawStatic]);

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const wasDragging = dragRef.current &&
        (Math.abs(e.clientX - dragRef.current.startMouseX) > 4 ||
         Math.abs(e.clientY - dragRef.current.startMouseY) > 4);
      dragRef.current = null;

      if (!wasDragging) {
        const hit = clickTargetRef.current;
        if (hit) {
          // Double-click = edit
          const now = Date.now();
          const last = lastClickRef.current;
          if (last && last.id === hit && now - last.time < 400) {
            onEditLayer(hit);
            lastClickRef.current = null;
          } else {
            lastClickRef.current = { id: hit, time: now };
          }
        } else {
          // Click empty area while video loaded = play/pause toggle
          const video = videoRef.current;
          if (video && videoUrl) video.paused ? video.play() : video.pause();
        }
      }
    }, [onEditLayer, videoUrl]);

    const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!videoUrl) return;
      const hit = hitTest(e.clientX, e.clientY);
      if (hit) {
        onEditLayer(hit);
      } else {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        onAddLayer(x, y);
      }
    }, [videoUrl, hitTest, onEditLayer, onAddLayer]);

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Video name breadcrumb */}
        {videoName && (
          <div className="absolute top-3 left-4 flex items-center gap-2 text-[12px] text-brand-secondary z-10 pointer-events-none">
            <span className="text-brand-muted">▶</span>
            <span className="font-medium text-brand-primary truncate max-w-[300px]">{videoName}</span>
          </div>
        )}

        <div
          className={`relative rounded-2xl overflow-hidden border transition-all duration-300 shadow-float ${
            videoUrl
              ? 'border-white/[0.1] bg-black'
              : 'border-white/[0.04] border-dashed bg-brand-panel/40'
          }`}
          style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 160px)' }}
        >
          <video ref={videoRef} className="hidden" playsInline />
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            className="block select-none"
            style={{
              display: videoUrl ? 'block' : 'none',
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 160px)',
              cursor: videoUrl ? 'crosshair' : 'default',
            }}
          />

          {/* Play/Pause overlay icon */}
          {videoUrl && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-2xl opacity-0 hover:opacity-100 transition-opacity">
                ▶
              </div>
            </div>
          )}

          {!videoUrl && (
            <div className="flex items-center justify-center p-8 min-w-[320px]">
              <VideoUploader onVideoLoaded={onVideoLoaded} onRemove={() => {}} />
            </div>
          )}
        </div>

        {/* Keyboard shortcuts bar */}
        {videoUrl && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-5 text-[10px] text-brand-muted pointer-events-none flex-wrap px-6">
            <span><kbd className="bg-white/[0.06] border border-white/[0.1] rounded px-1.5 py-0.5 mr-1">Double-click</kbd>Add text</span>
            <span><kbd className="bg-white/[0.06] border border-white/[0.1] rounded px-1.5 py-0.5 mr-1">Drag</kbd>Move layer</span>
            <span><kbd className="bg-white/[0.06] border border-white/[0.1] rounded px-1.5 py-0.5 mr-1">Click canvas</kbd>Play / Pause</span>
          </div>
        )}
      </div>
    );
  }
);

MemeCanvas.displayName = 'MemeCanvas';
export default MemeCanvas;
