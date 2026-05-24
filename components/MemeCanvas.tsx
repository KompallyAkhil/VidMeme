'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MemeTextConfig, drawMeme, BAR_HEIGHT } from '@/lib/memeRenderer';

interface MemeCanvasProps {
  videoUrl: string | null;
  config: MemeTextConfig;
}

export interface MemeCanvasHandle {
  startRecording: () => Promise<Blob>;
  getCanvas: () => HTMLCanvasElement | null;
}

const MemeCanvas = forwardRef<MemeCanvasHandle, MemeCanvasProps>(({ videoUrl, config }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number>(0);
  const playingRef = useRef(false);

  // Keep config in a ref so the render loop never needs to be recreated
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // ── Stable render loop ────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with solid black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let videoY = 0;
    if (configRef.current.style === 'top-bar' || configRef.current.style === 'both-bars') {
      videoY = BAR_HEIGHT;
    }
    ctx.drawImage(video, 0, videoY, video.videoWidth, video.videoHeight);
    drawMeme(ctx, canvas.width, canvas.height, configRef.current);
    animRef.current = requestAnimationFrame(render);
  }, []);

  // Draw a single static frame (when paused or config changes)
  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2 || playingRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with solid black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let videoY = 0;
    if (configRef.current.style === 'top-bar' || configRef.current.style === 'both-bars') {
      videoY = BAR_HEIGHT;
    }
    ctx.drawImage(video, 0, videoY, video.videoWidth, video.videoHeight);
    drawMeme(ctx, canvas.width, canvas.height, configRef.current);
  }, []);

  // Redraw whenever config changes (while paused)
  useEffect(() => { drawStatic(); }, [config, drawStatic]);

  // Update canvas size whenever config style changes after video is loaded
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 1) return;

    const nativeWidth = video.videoWidth;
    const nativeHeight = video.videoHeight;

    let extraHeight = 0;
    if (config.style === 'top-bar' || config.style === 'both-bars') {
      extraHeight += BAR_HEIGHT;
    }
    if (config.style === 'bottom-bar' || config.style === 'both-bars') {
      extraHeight += BAR_HEIGHT;
    }

    const targetHeight = nativeHeight + extraHeight;

    if (canvas.width !== nativeWidth || canvas.height !== targetHeight) {
      canvas.width = nativeWidth;
      canvas.height = targetHeight;
      drawStatic();
    }
  }, [config.style, drawStatic, videoUrl]);

  // Start/stop render loop with video play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      playingRef.current = true;
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      playingRef.current = false;
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

  // Load video when URL changes
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    cancelAnimationFrame(animRef.current);
    playingRef.current = false;

    if (!videoUrl) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    video.src = videoUrl;
    video.load();

    const onMeta = () => {
      const nativeWidth = video.videoWidth;
      const nativeHeight = video.videoHeight;

      let extraHeight = 0;
      if (configRef.current.style === 'top-bar' || configRef.current.style === 'both-bars') {
        extraHeight += BAR_HEIGHT;
      }
      if (configRef.current.style === 'bottom-bar' || configRef.current.style === 'both-bars') {
        extraHeight += BAR_HEIGHT;
      }

      canvas.width = nativeWidth;
      canvas.height = nativeHeight + extraHeight;
      video.currentTime = 0.1;
    };
    const onSeeked = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let videoY = 0;
      if (configRef.current.style === 'top-bar' || configRef.current.style === 'both-bars') {
        videoY = BAR_HEIGHT;
      }
      ctx.drawImage(video, 0, videoY, video.videoWidth, video.videoHeight);
      drawMeme(ctx, canvas.width, canvas.height, configRef.current);
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('seeked', onSeeked);
    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('seeked', onSeeked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  // Click canvas to play/pause
  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    video.paused ? video.play() : video.pause();
  }, [videoUrl]);

  // Expose recording API to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    startRecording: (): Promise<Blob> => new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) { reject(new Error('Not ready')); return; }

      const stream = canvas.captureStream(30);
      const chunks: BlobPart[] = [];
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus' : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
      recorder.onerror = (e) => reject(e);

      recorder.start(100);
      video.currentTime = 0;
      video.play().catch(reject);
      video.onended = () => { recorder.stop(); stream.getTracks().forEach(t => t.stop()); };
    }),
  }));

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden border transition-all duration-300 ${
        videoUrl
          ? 'bg-[#030305] border-white/[0.08] shadow-float'
          : 'bg-brand-panel/40 border-white/[0.04] border-dashed hover:border-white/[0.1]'
      }`}
      style={{ cursor: videoUrl ? 'pointer' : 'default' }}
    >
      <video ref={videoRef} className="hidden" playsInline />
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="block select-none transition-all duration-300 max-w-full"
        style={{
          display: videoUrl ? 'block' : 'none',
          maxHeight: 'calc(100vh - 160px)',
        }}
      />
      {!videoUrl && (
        <div className="flex flex-col items-center justify-center text-center px-8 py-20">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            🎬
          </div>
          <div className="text-sm font-semibold text-brand-primary mb-1.5 font-inter">No video loaded</div>
          <div className="text-xs text-brand-secondary max-w-[200px] leading-relaxed font-inter">
            Upload an MP4 or WebM video to start crafting your meme
          </div>
        </div>
      )}
    </div>
  );
});

MemeCanvas.displayName = 'MemeCanvas';
export default MemeCanvas;
