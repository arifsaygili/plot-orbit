/**
 * Overlay configuration for video burn-in
 */

export interface OverlayTextConfig {
  /** Text to display */
  text: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Font weight */
  fontWeight: "normal" | "bold" | "600" | "700";
  /** Text color */
  color: string;
  /** Text shadow/stroke color for contrast */
  shadowColor: string;
  /** Shadow blur radius */
  shadowBlur: number;
  /** Horizontal alignment */
  align: "left" | "center" | "right";
  /** Vertical alignment */
  verticalAlign: "top" | "middle" | "bottom";
  /** X offset from alignment edge (percentage of canvas width) */
  offsetXPercent: number;
  /** Y offset from alignment edge (percentage of canvas height) */
  offsetYPercent: number;
  /** Max width as percentage of canvas width (for text wrapping) */
  maxWidthPercent: number;
}

export interface OverlayConfig {
  /** Top text overlay (e.g., location/title) */
  topText?: OverlayTextConfig;
  /** Bottom text overlay (e.g., description/date) */
  bottomText?: OverlayTextConfig;
  /** Show safe area guides during preview (not burned in) */
  showSafeAreaGuides?: boolean;
  /** Safe area top percentage */
  safeAreaTopPercent: number;
  /** Safe area bottom percentage */
  safeAreaBottomPercent: number;
}

/**
 * Default overlay text configuration
 */
export const DEFAULT_TOP_TEXT: OverlayTextConfig = {
  text: "",
  fontSize: 24,
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: "bold",
  color: "#ffffff",
  shadowColor: "rgba(0, 0, 0, 0.8)",
  shadowBlur: 4,
  align: "center",
  verticalAlign: "top",
  offsetXPercent: 0,
  offsetYPercent: 12, // Below safe area
  maxWidthPercent: 80,
};

export const DEFAULT_BOTTOM_TEXT: OverlayTextConfig = {
  text: "",
  fontSize: 18,
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: "600",
  color: "#ffffff",
  shadowColor: "rgba(0, 0, 0, 0.8)",
  shadowBlur: 4,
  align: "center",
  verticalAlign: "bottom",
  offsetXPercent: 0,
  offsetYPercent: 22, // Above safe area
  maxWidthPercent: 80,
};

/**
 * Default overlay config for Reels
 */
export const DEFAULT_REELS_OVERLAY: OverlayConfig = {
  topText: DEFAULT_TOP_TEXT,
  bottomText: DEFAULT_BOTTOM_TEXT,
  showSafeAreaGuides: false,
  safeAreaTopPercent: 8,
  safeAreaBottomPercent: 18,
};

/**
 * Draw text with shadow/stroke on canvas context
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  config: OverlayTextConfig,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!config.text.trim()) return;

  ctx.save();

  // Configure font
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
  ctx.textAlign = config.align;
  ctx.textBaseline = config.verticalAlign === "middle" ? "middle" : config.verticalAlign === "bottom" ? "bottom" : "top";

  // Calculate position
  let x: number;
  let y: number;

  // X position based on alignment
  switch (config.align) {
    case "left":
      x = canvasWidth * (config.offsetXPercent / 100);
      break;
    case "right":
      x = canvasWidth - canvasWidth * (config.offsetXPercent / 100);
      break;
    case "center":
    default:
      x = canvasWidth / 2 + canvasWidth * (config.offsetXPercent / 100);
      break;
  }

  // Y position based on vertical alignment
  switch (config.verticalAlign) {
    case "top":
      y = canvasHeight * (config.offsetYPercent / 100);
      break;
    case "bottom":
      y = canvasHeight - canvasHeight * (config.offsetYPercent / 100);
      break;
    case "middle":
    default:
      y = canvasHeight / 2 + canvasHeight * (config.offsetYPercent / 100);
      break;
  }

  // Calculate max width
  const maxWidth = canvasWidth * (config.maxWidthPercent / 100);

  // Draw shadow
  ctx.shadowColor = config.shadowColor;
  ctx.shadowBlur = config.shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // Draw text stroke for extra contrast
  ctx.strokeStyle = config.shadowColor;
  ctx.lineWidth = 3;
  ctx.strokeText(config.text, x, y, maxWidth);

  // Draw fill
  ctx.shadowBlur = 0;
  ctx.fillStyle = config.color;
  ctx.fillText(config.text, x, y, maxWidth);

  ctx.restore();
}

/**
 * Draw safe area guides (for preview only)
 */
function drawSafeAreaGuides(
  ctx: CanvasRenderingContext2D,
  topPercent: number,
  bottomPercent: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();

  // Semi-transparent overlay for safe areas
  ctx.fillStyle = "rgba(255, 0, 0, 0.15)";

  // Top safe area
  const topHeight = canvasHeight * (topPercent / 100);
  ctx.fillRect(0, 0, canvasWidth, topHeight);

  // Bottom safe area
  const bottomHeight = canvasHeight * (bottomPercent / 100);
  ctx.fillRect(0, canvasHeight - bottomHeight, canvasWidth, bottomHeight);

  // Draw border lines
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, topHeight);
  ctx.lineTo(canvasWidth, topHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, canvasHeight - bottomHeight);
  ctx.lineTo(canvasWidth, canvasHeight - bottomHeight);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw overlay onto canvas context
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  config: OverlayConfig,
  canvasWidth: number,
  canvasHeight: number,
  includeGuides: boolean = false
): void {
  // Draw safe area guides if enabled (preview only)
  if (includeGuides && config.showSafeAreaGuides) {
    drawSafeAreaGuides(
      ctx,
      config.safeAreaTopPercent,
      config.safeAreaBottomPercent,
      canvasWidth,
      canvasHeight
    );
  }

  // Draw top text
  if (config.topText) {
    drawText(ctx, config.topText, canvasWidth, canvasHeight);
  }

  // Draw bottom text
  if (config.bottomText) {
    drawText(ctx, config.bottomText, canvasWidth, canvasHeight);
  }
}
