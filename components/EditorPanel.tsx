'use client';

import { useState } from 'react';
import { TextLayer, FONTS, TEXT_COLORS, STROKE_COLORS } from '@/lib/textLayers';

interface EditorPanelProps {
  layers: TextLayer[];
  selectedId: string | null;
  videoFile: File | null;
  exportState: 'idle' | 'exporting' | 'done' | 'error';
  exportProgress: number;
  exportError: string;
  onSelect: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onUpdateLayer: (id: string, patch: Partial<TextLayer>) => void;
  onExport: (format: 'mp4' | 'mp3') => void;
  onCopyPng: () => void;
  borderHeight: number;
  borderColor: string;
  onUpdateBorderHeight: (height: number) => void;
  onUpdateBorderColor: (color: string) => void;
}

export default function EditorPanel({
  layers, selectedId, videoFile,
  exportState, exportProgress, exportError,
  onSelect, onAddLayer, onDeleteLayer, onUpdateLayer,
  onExport, onCopyPng,
  borderHeight, borderColor,
  onUpdateBorderHeight, onUpdateBorderColor,
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'style'>('text');
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = layers.find(l => l.id === selectedId) ?? null;

  return (
    <aside className="w-[400px] min-w-[400px] border-l border-white/[0.08] bg-[#0d0d12] flex flex-col overflow-hidden h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <span className="text-[13px] font-semibold text-brand-primary">Editor</span>
        <span className="text-[11px] text-brand-muted">{layers.length} layer{layers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] px-4 pt-2 gap-0.5">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-t-md transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-white/[0.06] text-brand-primary border-b-2 border-brand-accent'
              : 'text-brand-muted hover:text-brand-secondary'
          }`}
        >
          <span>𝗧</span> Text
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-t-md transition-all cursor-pointer ${
            activeTab === 'style'
              ? 'bg-white/[0.06] text-brand-primary border-b-2 border-brand-accent'
              : 'text-brand-muted hover:text-brand-secondary'
          }`}
        >
          🎨 Style
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'text' && (
          <>
            {/* Add text button */}
            <div className="px-4 pt-4 pb-3">
              <button
                onClick={onAddLayer}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-[12px] font-semibold text-brand-secondary hover:text-brand-primary hover:border-white/[0.2] hover:bg-white/[0.07] transition-all cursor-pointer"
                id="add-text-btn"
              >
                <span className="text-base">+</span> Add Text
              </button>
            </div>

            {/* Layer list */}
            <div className="flex flex-col gap-1 px-3 pb-3">
              {layers.length === 0 && (
                <div className="text-center text-[11px] text-brand-muted py-6">
                  No text layers yet.<br />Double-click the canvas or press Add Text.
                </div>
              )}
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => onSelect(layer.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-all group ${
                    selectedId === layer.id
                      ? 'bg-brand-accent/10 border border-brand-accent/30'
                      : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-[11px] text-brand-muted font-mono">𝗧</span>
                  {editingId === layer.id ? (
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-[12px] font-medium text-brand-primary outline-none border-b border-brand-accent"
                      value={layer.text}
                      onChange={(e) => onUpdateLayer(layer.id, { text: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="flex-1 text-[12px] font-medium text-brand-primary truncate"
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingId(layer.id); }}
                    >
                      {layer.text || <span className="text-brand-muted italic">empty</span>}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                    className="opacity-0 group-hover:opacity-100 text-brand-danger hover:text-red-400 text-[14px] transition-all cursor-pointer p-0.5"
                    title="Delete layer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Selected layer inline edit */}
            {selected && (
              <div className="border-t border-white/[0.08] px-4 py-3 flex flex-col gap-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-muted font-semibold">Selected Layer</p>

                {/* Text content */}
                <textarea
                  rows={2}
                  value={selected.text}
                  onChange={(e) => onUpdateLayer(selected.id, { text: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-brand-primary resize-none outline-none focus:border-yellow-500/40 font-inter placeholder:text-brand-muted"
                  placeholder="Type here..."
                />

                {/* Font size */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-brand-secondary mb-1.5">
                    <span>Font Size</span>
                    <span className="text-brand-accent tabular-nums">{selected.fontSize}px</span>
                  </div>
                  <input type="range" className="slider" min={12} max={200}
                    value={selected.fontSize}
                    onChange={(e) => onUpdateLayer(selected.id, { fontSize: Number(e.target.value) })}
                  />
                </div>

                {/* Fonts */}
                <div>
                  <p className="text-[11px] text-brand-secondary mb-1.5">Font</p>
                  <div className="flex flex-wrap gap-1">
                    {FONTS.map((f) => (
                      <button
                        key={f}
                        onClick={() => onUpdateLayer(selected.id, { fontFamily: f })}
                        style={{ fontFamily: f }}
                        className={`px-2 py-1 text-[10px] rounded-md border cursor-pointer transition-all ${
                          selected.fontFamily === f
                            ? 'bg-brand-accent border-brand-accent text-black font-bold'
                            : 'bg-white/[0.04] border-white/[0.08] text-brand-secondary hover:border-white/20'
                        }`}
                      >
                        {f.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text color */}
                <div>
                  <p className="text-[11px] text-brand-secondary mb-1.5">Text Color</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TEXT_COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => onUpdateLayer(selected.id, { color: c })}
                        style={{ background: c, outline: selected.color === c ? '2px solid #fff' : 'none', outlineOffset: '2px' }}
                        className="w-6 h-6 rounded-md cursor-pointer border border-white/10 hover:scale-110 transition-transform"
                      />
                    ))}
                    <input type="color" className="color-picker" value={selected.color}
                      onChange={(e) => onUpdateLayer(selected.id, { color: e.target.value })} />
                  </div>
                </div>

                {/* Stroke color */}
                <div>
                  <p className="text-[11px] text-brand-secondary mb-1.5">Stroke</p>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {STROKE_COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => onUpdateLayer(selected.id, { strokeColor: c })}
                        style={{ background: c, outline: selected.strokeColor === c ? '2px solid #fff' : 'none', outlineOffset: '2px' }}
                        className="w-6 h-6 rounded-md cursor-pointer border border-white/10 hover:scale-110 transition-transform"
                      />
                    ))}
                    <input type="color" className="color-picker" value={selected.strokeColor}
                      onChange={(e) => onUpdateLayer(selected.id, { strokeColor: e.target.value })} />
                    <input type="range" className="slider flex-1 min-w-[60px]" min={0} max={12}
                      value={selected.strokeWidth}
                      onChange={(e) => onUpdateLayer(selected.id, { strokeWidth: Number(e.target.value) })} />
                    <span className="text-[10px] text-brand-muted tabular-nums">{selected.strokeWidth}px</span>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <p className="text-[11px] text-brand-secondary mb-1.5">Align</p>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          const x = a === 'left' ? 0.05 : a === 'center' ? 0.5 : 0.95;
                          onUpdateLayer(selected.id, { align: a, x });
                        }}
                        className={`flex-1 py-1.5 text-[11px] rounded-md border cursor-pointer transition-all ${
                          selected.align === a
                            ? 'bg-brand-accent border-brand-accent text-black'
                            : 'bg-white/[0.04] border-white/[0.08] text-brand-secondary hover:border-white/20'
                        }`}
                      >
                        {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'style' && (
          <div className="px-4 py-4 flex flex-col gap-5">
            <div className="flex flex-col gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-widest text-brand-accent font-bold">Top Border Canvas Config</p>
              
              {/* Border Height Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] text-brand-secondary font-medium">
                  <span>Border Height</span>
                  <span className="text-brand-accent font-mono font-bold tabular-nums">{borderHeight}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={240}
                  value={borderHeight}
                  onChange={(e) => onUpdateBorderHeight(Number(e.target.value))}
                  className="slider"
                />
              </div>

              {/* Border Color Selection */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-brand-secondary font-medium">Border Color</span>
                <div className="flex gap-2 items-center flex-wrap">
                  {['#000000', '#ffffff', '#ffd700', '#ff4d6d', '#00e676', '#40c4ff'].map((c) => (
                    <div
                      key={c}
                      onClick={() => onUpdateBorderColor(c)}
                      style={{
                        background: c,
                        outline: borderColor === c ? '2px solid #ffb700' : 'none',
                        outlineOffset: '2px',
                      }}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-white/10 hover:scale-110 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    />
                  ))}
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => onUpdateBorderColor(e.target.value)}
                    className="w-7 h-7 bg-transparent border-0 cursor-pointer p-0 select-none outline-none scale-110"
                    title="Custom color picker"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-brand-muted leading-relaxed bg-white/[0.01] border border-white/[0.04] p-3 rounded-lg">
              ℹ️ Select a text layer under the <strong>Text</strong> tab to edit individual layer properties like font size, stroke, and alignments.
            </div>
          </div>
        )}
      </div>

      {/* Export footer */}
      <div className="border-t border-white/[0.08] p-4 flex flex-col gap-3">
        {/* Progress */}
        {exportState === 'exporting' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-brand-danger">
              <span>Encoding</span>
              <span>{exportProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.08]">
              <div className="h-full bg-brand-danger transition-all duration-200" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        )}
        {exportState === 'done' && (
          <div className="text-[11px] text-brand-success flex items-center gap-1.5 bg-brand-success/10 border border-brand-success/20 rounded-lg p-2.5">
            ✓ Downloaded!
          </div>
        )}
        {exportState === 'error' && (
          <div className="text-[11px] text-brand-danger flex items-center gap-1.5 bg-brand-danger/10 border border-brand-danger/20 rounded-lg p-2.5 break-all">
            ❌ {exportError}
          </div>
        )}

        {/* Buttons row */}
        <button
          id="export-copy-btn"
          onClick={() => onExport('mp4')}
          disabled={!videoFile || exportState === 'exporting'}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold border transition-all cursor-pointer ${
            videoFile && exportState !== 'exporting'
              ? 'bg-brand-accent border-brand-accent text-black hover:bg-brand-accent/90 active:scale-95 shadow-[0_0_12px_rgba(255,200,0,0.2)]'
              : 'bg-white/[0.02] text-brand-muted border-white/[0.04] cursor-not-allowed'
          }`}
        >
          {exportState === 'exporting' ? '⚡ Encoding & Downloading Video...' : '🎬 Download Video (MP4)'}
        </button>
      </div>
    </aside>
  );
}
