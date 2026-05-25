'use client';

import { useState, useCallback } from 'react';

interface VideoUploaderProps {
  onVideoLoaded: (url: string, file: File) => void;
  videoName?: string;
  onRemove: () => void;
  compact?: boolean;
}

export default function VideoUploader({ onVideoLoaded, videoName, onRemove, compact }: VideoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) return;
    onVideoLoaded(URL.createObjectURL(file), file);
  }, [onVideoLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (videoName) {
    return (
      <div className="flex items-center justify-between gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-brand-secondary">
        <span>🎬</span>
        <span className="flex-1 font-medium text-brand-primary truncate" title={videoName}>{videoName}</span>
        <button
          onClick={onRemove}
          title="Remove"
          className="text-brand-muted text-base leading-none px-0.5 hover:text-brand-danger transition-colors duration-200 bg-transparent border-none cursor-pointer"
        >
          ✕
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <label
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-[12px] font-semibold transition-all duration-200 ${
          isDragOver
            ? 'border-brand-accent bg-brand-accent-dim text-brand-accent'
            : 'border-white/[0.1] bg-white/[0.04] text-brand-secondary hover:border-brand-accent hover:text-brand-primary'
        }`}
      >
        <input type="file" accept="video/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <span>🎬</span>
        <span>{isDragOver ? 'Drop!' : 'Upload Video'}</span>
      </label>
    );
  }

  return (
    <label
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      className={`
        flex flex-col items-center gap-2.5 text-center cursor-pointer rounded-xl px-4 py-7
        border-2 border-dashed transition-all duration-200
        ${isDragOver
          ? 'border-brand-accent bg-brand-accent-dim shadow-accent'
          : 'border-white/[0.08] bg-white/[0.04] hover:border-brand-accent hover:bg-brand-accent-dim hover:shadow-accent'}
      `}
    >
      <input type="file" accept="video/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <span className="text-3xl opacity-70">{isDragOver ? '🎯' : '🎬'}</span>
      <span className="text-sm font-semibold text-brand-primary">
        {isDragOver ? 'Drop to upload!' : 'Upload your video'}
      </span>
      <span className="text-[11px] text-brand-muted">Drag & drop or click • MP4, WebM, MOV</span>
    </label>
  );
}
