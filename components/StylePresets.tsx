'use client';

import { MemeStyle } from '@/lib/memeRenderer';

interface StylePresetsProps {
  current: MemeStyle;
  onChange: (style: MemeStyle) => void;
}

const PRESETS: { style: MemeStyle; icon: string; label: string }[] = [
  { style: 'top-bar',       icon: '⬛', label: 'Top Bar' },
  { style: 'bottom-bar',    icon: '▬',  label: 'Bottom Bar' },
  { style: 'both-bars',     icon: '☰',  label: 'Both Bars' },
  { style: 'overlay-top',   icon: '🔤', label: 'Overlay Top' },
  { style: 'overlay-bottom',icon: '💬', label: 'Overlay Bot' },
];

export default function StylePresets({ current, onChange }: StylePresetsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map(({ style, icon, label }) => (
        <button
          key={style}
          id={`preset-${style}`}
          onClick={() => onChange(style)}
          className={`
            flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg border text-[11px] font-medium
            font-inter cursor-pointer transition-all duration-200
            ${current === style
              ? 'border-brand-accent bg-brand-accent-dim text-brand-accent shadow-accent'
              : 'border-white/[0.08] bg-white/[0.04] text-brand-secondary hover:border-yellow-500/40 hover:bg-brand-accent-dim hover:text-brand-primary'}
          `}
        >
          <span className="text-xl">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
