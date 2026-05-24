'use client';

import { MemeTextConfig, TEXT_COLORS, STROKE_COLORS } from '@/lib/memeRenderer';

interface TextControlsProps {
  config: MemeTextConfig;
  onChange: (patch: Partial<MemeTextConfig>) => void;
}

const FONTS = ['Impact', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia'];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted mb-3">{children}</p>
);

const ControlLabel = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex items-center justify-between text-[11px] font-medium text-brand-secondary mb-1.5">
    <span>{label}</span>
    {value !== undefined && <span className="tabular-nums text-brand-accent">{value}</span>}
  </div>
);

export default function TextControls({ config, onChange }: TextControlsProps) {
  const showTop    = config.style === 'top-bar'    || config.style === 'both-bars' || config.style === 'overlay-top';
  const showBottom = config.style === 'bottom-bar' || config.style === 'both-bars' || config.style === 'overlay-bottom';
  const isBarStyle = config.style === 'top-bar' || config.style === 'bottom-bar' || config.style === 'both-bars';

  const textareaClass =
    'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] font-inter text-brand-primary resize-none leading-snug transition-colors duration-200 outline-none focus:border-yellow-500/40 placeholder:text-brand-muted';

  return (
    <>
      {/* Top Text */}
      {showTop && (
        <div className="p-4 border-b border-white/[0.08]">
          <SectionLabel>Top Text</SectionLabel>
          <textarea
            className={textareaClass}
            rows={2}
            value={config.topText}
            onChange={(e) => onChange({ topText: e.target.value })}
            placeholder="TOP MEME TEXT..."
            id="top-text-input"
          />
        </div>
      )}

      {/* Bottom Text */}
      {showBottom && (
        <div className="p-4 border-b border-white/[0.08]">
          <SectionLabel>Bottom Text</SectionLabel>
          <textarea
            className={textareaClass}
            rows={2}
            value={config.bottomText}
            onChange={(e) => onChange({ bottomText: e.target.value.toUpperCase() })}
            placeholder="BOTTOM MEME TEXT..."
            id="bottom-text-input"
          />
        </div>
      )}

      {/* Typography */}
      <div className="p-4 border-b border-white/[0.08]">
        <SectionLabel>Typography</SectionLabel>

        {/* Font family */}
        <div className="mb-3">
          <ControlLabel label="Font Family" />
          <div className="flex flex-wrap gap-1.5">
            {FONTS.map((font) => (
              <button
                key={font}
                id={`font-${font.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onChange({ fontFamily: font })}
                style={{ fontFamily: font }}
                className={`
                  flex-auto min-w-[80px] px-1 py-1.5 text-[10px] rounded-lg border cursor-pointer
                  font-inter transition-all duration-200
                  ${config.fontFamily === font
                    ? 'bg-brand-accent border-brand-accent text-black font-semibold'
                    : 'bg-white/[0.04] border-white/[0.08] text-brand-secondary hover:border-yellow-500/40 hover:text-brand-primary'}
                `}
              >
                {font.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <ControlLabel label="Font Size" value={`${config.fontSize}px`} />
          <input type="range" className="slider" min={12} max={100}
            value={config.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            id="font-size-slider" />
        </div>
      </div>

      {/* Colors */}
      <div className="p-4 border-b border-white/[0.08]">
        <SectionLabel>Colors</SectionLabel>

        {/* Text color */}
        <ControlLabel label="Text Color" />
        <div className="flex flex-wrap gap-1.5 mb-4">
          {TEXT_COLORS.map((c) => (
            <div
              key={c}
              role="button"
              title={c}
              id={`text-color-${c.replace('#', '')}`}
              onClick={() => onChange({ textColor: c })}
              style={{ background: c, border: config.textColor === c ? '2px solid #f0f0f5' : c === '#ffffff' ? '2px solid #333' : '2px solid transparent' }}
              className={`w-7 h-7 rounded-md cursor-pointer flex-shrink-0 transition-all duration-200 ${config.textColor === c ? 'scale-110' : 'hover:scale-105'}`}
            />
          ))}
          <input type="color" className="color-picker" value={config.textColor}
            onChange={(e) => onChange({ textColor: e.target.value })} title="Custom" id="text-color-custom" />
        </div>

        {/* Stroke color */}
        <ControlLabel label="Stroke Color" />
        <div className="flex flex-wrap gap-1.5">
          {STROKE_COLORS.map((c) => (
            <div
              key={c}
              role="button"
              title={c}
              id={`stroke-color-${c.replace('#', '')}`}
              onClick={() => onChange({ strokeColor: c })}
              style={{ background: c, border: config.strokeColor === c ? '2px solid #f0f0f5' : c === '#ffffff' ? '2px solid #333' : '2px solid transparent' }}
              className={`w-7 h-7 rounded-md cursor-pointer flex-shrink-0 transition-all duration-200 ${config.strokeColor === c ? 'scale-110' : 'hover:scale-105'}`}
            />
          ))}
          <input type="color" className="color-picker" value={config.strokeColor}
            onChange={(e) => onChange({ strokeColor: e.target.value })} title="Custom stroke" id="stroke-color-custom" />
        </div>
      </div>

      {/* Style details */}
      <div className="p-4">
        <SectionLabel>Style Details</SectionLabel>

        <div className="mb-3">
          <ControlLabel label="Stroke Width" value={`${config.strokeWidth}px`} />
          <input type="range" className="slider" min={0} max={10}
            value={config.strokeWidth}
            onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
            id="stroke-width-slider" />
        </div>
      </div>
    </>
  );
}
