'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { TextLayer, drawLayers } from './textLayers';

// ── ffmpeg singleton (used only for MP3 extraction) ───────────────────────────
let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  const ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  const workerURL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/worker.js';
  await ffmpeg.load({
    classWorkerURL: await toBlobURL(workerURL, 'text/javascript'),
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

// ── MP4 export via MediaRecorder (canvas capture) ────────────────────────────
/**
 * Records the video file in real-time while drawing text layers on top,
 * using the browser's native MediaRecorder. No WASM/ffmpeg needed.
 *
 * Uses requestVideoFrameCallback (RVFC) when available for frame-accurate
 * sync — fires only when the video has a real new decoded frame, preventing
 * duplicate/dropped frames that cause choppiness.
 *
 * Falls back to requestAnimationFrame on browsers without RVFC (Firefox).
 */
async function exportVideoWithCanvas(
  videoFile: File,
  layers: TextLayer[],
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const report = (n: number) => onProgress?.(Math.round(n));

  return new Promise<Blob>((resolve, reject) => {
    // ── 1. Set up video element ──────────────────────────────────────────
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    video.muted = true;      // no audible playback during export
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';  // buffer fully before playback starts

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Video failed to load: ${video.error?.message ?? 'unknown'}`));
    };

    video.onloadedmetadata = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const duration = video.duration;

      // ── 2. Set up canvas ─────────────────────────────────────────────
      const canvas = document.createElement('canvas');
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d')!;

      // ── 3. Set up audio via Web Audio API ────────────────────────────
      let audioStream: MediaStream | null = null;
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        // NOT connected to audioCtx.destination, so no audible playback
        audioStream = dest.stream;
      } catch {
        audioStream = null;
      }

      // ── 4. Frame drawing helper ──────────────────────────────────────
      const drawFrame = () => {
        ctx.clearRect(0, 0, vw, vh);
        ctx.drawImage(video, 0, 0, vw, vh);
        drawLayers(ctx, vw, vh, layers, undefined, false);
      };

      // ── 5. Set up MediaRecorder ──────────────────────────────────────
      // 60 fps hint: RVFC only pushes real decoded frames so no duplicates
      const canvasStream = canvas.captureStream(60);

      const tracks = [
        ...canvasStream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : []),
      ];
      const combinedStream = new MediaStream(tracks);

      const mimeType =
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
        MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' :
        MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' :
        'video/mp4';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 12_000_000, // 12 Mbps for high-quality smooth output
        });
      } catch (e) {
        reject(new Error(`MediaRecorder init failed: ${e}`));
        return;
      }

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      let rafId = 0;
      const cleanup = () => {
        cancelAnimationFrame(rafId);
        canvasStream.getTracks().forEach((t) => t.stop());
        URL.revokeObjectURL(objectUrl);
      };

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      recorder.onerror = (e) => {
        cleanup();
        reject(new Error(`MediaRecorder error: ${(e as ErrorEvent).message ?? e}`));
      };

      // ── 6. Frame-accurate draw loop ──────────────────────────────────
      // requestVideoFrameCallback fires exactly when the video decoder has a
      // new frame ready — no duplicate frames, no dropped frames, no stutter.
      const hasRVFC = 'requestVideoFrameCallback' in video;

      if (hasRVFC) {
        const onVideoFrame = () => {
          drawFrame();
          if (!video.ended && !video.paused) {
            (video as any).requestVideoFrameCallback(onVideoFrame);
          }
        };
        (video as any).requestVideoFrameCallback(onVideoFrame);
      }

      // RAF fallback for browsers without RVFC (e.g. Firefox)
      const startRafLoop = () => {
        const loop = () => {
          drawFrame();
          rafId = requestAnimationFrame(loop);
        };
        loop();
      };

      // ── 7. Progress ──────────────────────────────────────────────────
      video.ontimeupdate = () => {
        if (duration > 0) report(5 + Math.round((video.currentTime / duration) * 90));
      };

      video.onended = () => {
        // Draw the very last frame and give MediaRecorder 300ms to flush it
        drawFrame();
        setTimeout(() => recorder.stop(), 300);
      };

      // ── 8. Start recording ───────────────────────────────────────────
      // 100ms timeslice = more frequent chunks = smoother progressive output
      recorder.start(100);
      video.currentTime = 0;
      video
        .play()
        .then(() => {
          if (!hasRVFC) startRafLoop();
        })
        .catch((err) => {
          recorder.stop();
          reject(new Error(`Video play failed: ${err.message ?? err}`));
        });

      report(5);
    };
  });
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function exportInBackground(
  videoFile: File,
  layers: TextLayer[],
  format: 'mp4' | 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const report = (n: number) => onProgress?.(Math.round(n));

  // ── MP3: use ffmpeg (audio-only, no canvas needed) ───────────────────────
  if (format === 'mp3') {
    report(5);
    const ffmpeg = await getFFmpeg();
    report(15);

    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    report(30);

    const progressCb = ({ progress }: { progress: number }) => report(30 + progress * 55);
    ffmpeg.on('progress', progressCb);
    try {
      const code = await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vn',
        '-acodec', 'libmp3lame',
        '-q:a', '2',
        'output.mp3',
      ]);
      if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);
    } finally {
      ffmpeg.off('progress', progressCb);
    }
    report(88);

    const data = await ffmpeg.readFile('output.mp3');
    await ffmpeg.deleteFile('input.mp4').catch(() => {});
    await ffmpeg.deleteFile('output.mp3').catch(() => {});
    report(100);
    return new Blob([(data as Uint8Array).buffer], { type: 'audio/mpeg' });
  }

  // ── MP4: real-time canvas capture via MediaRecorder ──────────────────────
  const blob = await exportVideoWithCanvas(videoFile, layers, onProgress);
  report(100);
  return blob;
}