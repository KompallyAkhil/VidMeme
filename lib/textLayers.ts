export interface TextLayer {
  id: string;
  text: string;
  /** Position as fraction of canvas (0–1) */
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bold: boolean;
  /** 'center' | 'left' | 'right' */
  align: 'center' | 'left' | 'right';
}

export const FONTS = ['Impact', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia'];

export const TEXT_COLORS = [
  '#ffffff', '#000000', '#ffd700', '#ff4d6d',
  '#00e676', '#40c4ff', '#ff6d00', '#ea80fc',
];

export const STROKE_COLORS = ['#000000', '#ffffff', '#ffd700', '#ff4d6d'];

export function makeLayer(overrides?: Partial<TextLayer>): TextLayer {
  return {
    id: Math.random().toString(36).slice(2),
    text: 'TEXT',
    x: 0.5,
    y: 0.15,
    fontSize: 72,
    fontFamily: 'Impact',
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 4,
    bold: true,
    align: 'center',
    ...overrides,
  };
}

/** Draw all layers onto a canvas context. */
export function drawLayers(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  layers: TextLayer[],
  selectedId?: string,
  showHandles = false,
) {
  for (const layer of layers) {
    const px = layer.x * cw;
    const py = layer.y * ch;

    ctx.save();
    ctx.font = `${layer.bold ? 'bold ' : ''}${layer.fontSize}px "${layer.fontFamily}", Arial Black, sans-serif`;
    ctx.textAlign = layer.align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    if (layer.strokeWidth > 0) {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = layer.strokeWidth * 2;
      ctx.strokeText(layer.text, px, py);
    }
    ctx.fillStyle = layer.color;
    ctx.fillText(layer.text, px, py);

    // Draw selection indicator
    if (showHandles && selectedId === layer.id) {
      const metrics = ctx.measureText(layer.text);
      const tw = metrics.width;
      const th = layer.fontSize;
      const ox = layer.align === 'center' ? -tw / 2 : layer.align === 'right' ? -tw : 0;
      const pad = 8;
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(px + ox - pad, py - th / 2 - pad, tw + pad * 2, th + pad * 2);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}
