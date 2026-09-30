export async function rasterizeCover(file: Blob, size = 512): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    const min = Math.min(img.width, img.height);
    const sx = (img.width - min) / 2;
    const sy = (img.height - min) / 2;
    ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
    return await canvasToPng(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function generateCover(title: string, artist: string, size = 512): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#08090b";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2 - 12;
  ctx.strokeStyle = "#c9d0db";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#3c4250";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#c9d0db";
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8b909c";
  ctx.font = "500 14px 'IBM Plex Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PARAPACK  ·  PARADIDDLE VR", cx, size - 36);

  ctx.fillStyle = "#eceef2";
  ctx.font = "400 42px 'Bebas Neue', sans-serif";
  const titleLine = fitText(ctx, title || "Untitled", size - 64);
  ctx.fillText(titleLine, cx, size - 78);

  if (artist) {
    ctx.fillStyle = "#8b909c";
    ctx.font = "500 16px 'IBM Plex Sans', sans-serif";
    ctx.fillText(fitText(ctx, artist, size - 80), cx, size - 52);
  }

  return canvasToPng(canvas);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG encode failed"));
    }, "image/png");
  });
}

export async function blobToUint8(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}
