export type MemeStyle = 'top-bar' | 'bottom-bar' | 'both-bars' | 'overlay-top' | 'overlay-bottom';

export interface MemeTextConfig {
  topText: string;
  bottomText: string;
  fontSize: number;
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
  barHeight: number;
  style: MemeStyle;
  fontFamily: string;
  opacity: number;
}

export const BAR_HEIGHT = 200;

export const DEFAULT_CONFIG: MemeTextConfig = {
  topText: 'WHEN YOU DEBUG FOR 5 HOURS',
  bottomText: 'AND IT WAS A MISSING SEMICOLON',
  fontSize: 32,
  textColor: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 3,
  barHeight: 200, // Sync default config to the new fixed 200px height
  style: 'top-bar',
  fontFamily: 'Impact',
  opacity: 1,
};

export const TEXT_COLORS = [
  '#ffffff', '#000000', '#ffd700', '#ff4d6d',
  '#00e676', '#40c4ff', '#ff6d00', '#ea80fc',
];

export const STROKE_COLORS = ['#000000', '#ffffff', '#ffd700', '#ff4d6d'];

export const MEME_TEMPLATES = [
  { emoji: '😤', name: 'Debugging',    top: 'WHEN YOU DEBUG FOR 5 HOURS',  bottom: 'AND IT WAS A MISSING SEMICOLON' },
  { emoji: '🤝', name: 'Handshake',    top: 'ME',                           bottom: 'MY BED AT 3AM' },
  { emoji: '🔥', name: 'This is Fine', top: 'EVERYTHING IS FINE',           bottom: 'THIS IS FINE' },
  { emoji: '😎', name: 'Galaxy Brain', top: 'UNABLE TO SLEEP',              bottom: 'TOO BUSY BEING AWESOME' },
  { emoji: '🐢', name: 'Monday',       top: 'MONDAY MORNING',               bottom: 'MY MOTIVATION' },
  { emoji: '💀', name: 'Expectations', top: 'EXPECTATIONS',                 bottom: 'REALITY' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function setTextStyle(
  ctx: CanvasRenderingContext2D,
  fontSize: number, fontFamily: string,
  textColor: string, strokeColor: string, strokeWidth: number
) {
  ctx.font = `bold ${fontSize}px ${fontFamily}, Arial Black, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth * 2;
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Draws the meme text overlay onto the canvas. */
export function drawMeme(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: MemeTextConfig
) {
  const { topText, bottomText, fontSize, textColor, strokeColor, strokeWidth,
          style, fontFamily, opacity } = config;

  ctx.save();
  ctx.globalAlpha = opacity;

  const drawBar = (text: string, y: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, y, width, BAR_HEIGHT);
    setTextStyle(ctx, fontSize, fontFamily, textColor, strokeColor, strokeWidth);
    const lines = wrapText(ctx, text, width - 32);
    const lineH = fontSize * 1.2;
    const totalH = lines.length * lineH;
    const startY = y + (BAR_HEIGHT - totalH) / 2 + lineH / 2;
    lines.forEach((line, i) => {
      const ly = startY + i * lineH;
      if (strokeWidth > 0) {
        ctx.strokeText(line, width / 2, ly);
      }
      ctx.fillText(line, width / 2, ly);
    });
  };

  const drawOverlay = (text: string, isBottom: boolean) => {
    setTextStyle(ctx, fontSize, fontFamily, textColor, strokeColor, strokeWidth);
    ctx.textBaseline = isBottom ? 'bottom' : 'top';
    const lines = wrapText(ctx, text, width - 40);
    const lineH = fontSize * 1.3;
    const pad = 20;
    lines.forEach((line, i) => {
      const ly = isBottom
        ? height - pad - (lines.length - 1 - i) * lineH
        : pad + i * lineH;
      if (strokeWidth > 0) {
        ctx.strokeText(line, width / 2, ly);
      }
      ctx.fillText(line, width / 2, ly);
    });
  };

  switch (style) {
    case 'top-bar':      drawBar(topText, 0); break;
    case 'bottom-bar':   drawBar(bottomText, height - BAR_HEIGHT); break;
    case 'both-bars':    drawBar(topText, 0); drawBar(bottomText, height - BAR_HEIGHT); break;
    case 'overlay-top':  drawOverlay(topText, false); break;
    case 'overlay-bottom': drawOverlay(bottomText, true); break;
  }

  ctx.restore();
}
