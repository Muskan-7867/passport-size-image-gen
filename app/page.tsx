"use client";
import SheetPreview from "@/src/components/SheetPreview";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";

// A4 at 300 DPI
const A4_W = 2480;
const A4_H = 3508;

function buildSheetCanvas(
  img: HTMLImageElement,
  croppedAreaPixels: any,
  rows: number,
  cols: number,
  padding: number,
  gap: number,
): HTMLCanvasElement {
  // Passport photo aspect ratio: 35mm wide × 45mm tall
  const PASSPORT_RATIO = 35 / 45;

  // Max cell size available from the A4 grid
  const cellW = Math.floor((A4_W - padding * 2 - (cols - 1) * gap) / cols);
  const cellH = Math.floor((A4_H - padding * 2 - (rows - 1) * gap) / rows);

  // Fit photo inside cell while preserving 35:45 ratio (letterbox)
  let photoW: number, photoH: number;
  if (cellW / cellH > PASSPORT_RATIO) {
    // Cell is wider than passport ratio → constrain by height
    photoH = cellH;
    photoW = Math.round(cellH * PASSPORT_RATIO);
  } else {
    // Cell is taller than passport ratio → constrain by width
    photoW = cellW;
    photoH = Math.round(cellW / PASSPORT_RATIO);
  }

  const page = document.createElement("canvas");
  page.width = A4_W;
  page.height = A4_H;
  const ctx = page.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, A4_W, A4_H);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Center photo within its cell
      const cellX = padding + col * (cellW + gap);
      const cellY = padding + row * (cellH + gap);
      const offsetX = Math.round((cellW - photoW) / 2);
      const offsetY = Math.round((cellH - photoH) / 2);
      const x = cellX + offsetX;
      const y = cellY + offsetY;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, photoW, photoH);
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        x,
        y,
        photoW,
        photoH,
      );
      // Cut guide around the photo
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.strokeRect(x, y, photoW, photoH);
    }
  }
  return page;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [padding, setPadding] = useState(20);
  const [gap, setGap] = useState(40);

  const sheetPreviewRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const imageUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedPixels: any) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  // Draw the sheet preview, scaled to the container's current width
  const drawPreview = useCallback(() => {
    if (
      !imageUrl ||
      !croppedAreaPixels ||
      !sheetPreviewRef.current ||
      !previewContainerRef.current
    )
      return;

    const containerW = previewContainerRef.current.clientWidth || 300;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const sheet = buildSheetCanvas(
        img,
        croppedAreaPixels,
        rows,
        cols,
        padding,
        gap,
      );
      const canvas = sheetPreviewRef.current!;
      const scale = containerW / sheet.width;
      canvas.width = sheet.width;
      canvas.height = sheet.height;
      canvas.style.width = `${containerW}px`;
      canvas.style.height = `${Math.round(sheet.height * scale)}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sheet, 0, 0);
    };
  }, [imageUrl, croppedAreaPixels, rows, cols, padding, gap]);

  // Redraw on any dependency change
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Redraw when container resizes (window resize / panel reflow)
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => drawPreview());
    ro.observe(container);
    return () => ro.disconnect();
  }, [drawPreview]);

  const generateImage = () => {
    if (!image || !croppedAreaPixels) return;
    try {
      const url = URL.createObjectURL(image);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const sheet = buildSheetCanvas(
          img,
          croppedAreaPixels,
          rows,
          cols,
          padding,
          gap,
        );
        const a = document.createElement("a");
        a.href = sheet.toDataURL("image/png");
        a.download = "passport_sheet_A4.png";
        a.click();
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.log(error);
    }
  };

  const controls = [
    { label: "Rows", value: rows, setter: setRows, min: 1, max: 10 },
    { label: "Columns", value: cols, setter: setCols, min: 1, max: 10 },
    { label: "Gap (px)", value: gap, setter: setGap, min: 0, max: 200 },
    {
      label: "Margin (px)",
      value: padding,
      setter: setPadding,
      min: 0,
      max: 400,
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col gap-4 items-center p-3 sm:p-4 ${
        image ? "justify-start sm:justify-center" : "justify-center"
      }`}
    >
      {/* Header */}
      <div className="text-center pt-2 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-1">
          Passport Photo Maker
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Professional 35×45mm passport photo generator · A4 sheet output
        </p>
      </div>

      {/* Main content */}
      <div
        className={`w-full max-w-6xl flex gap-4 items-start ${
          image
            ? "flex-col lg:flex-row"
            : "flex-col justify-center items-center"
        }`}
      >
        {/* ── Left panel: Cropper + Controls ── */}
        <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl">
          <div className="p-3 sm:p-5 flex flex-col gap-4">
            {/* Cropper area */}
            <div className="relative h-[280px] sm:h-[340px] lg:h-[360px] w-full bg-zinc-900/50 rounded-xl sm:rounded-2xl border-2 border-dashed border-white/10 overflow-hidden transition-all hover:border-blue-500/50 group">
              {!image ? (
                <label className="flex flex-col items-center justify-center h-full cursor-pointer group-hover:bg-blue-500/5">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-base sm:text-lg font-medium text-white mb-1">
                    Upload Image
                  </span>
                  <span className="text-zinc-500 text-xs sm:text-sm">
                    Tap to browse or drag and drop
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setImage(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
              ) : (
                imageUrl && (
                  <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={35 / 45}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                )
              )}
            </div>

            {image && (
              <>
                {/* Zoom slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-zinc-400 font-medium">Zoom</span>
                    <span className="text-blue-400 font-bold">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Grid controls — 2 cols on mobile, 4 cols on sm+, back to 2 on lg panel, 4 on xl */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
                  {controls.map(({ label, value, setter, min, max }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <label className="text-zinc-400 text-[10px] sm:text-xs font-medium">
                        {label}
                      </label>
                      <input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={(e) =>
                          setter(
                            Math.max(
                              min,
                              Math.min(max, Number(e.target.value)),
                            ),
                          )
                        }
                        className="bg-zinc-800 border border-white/10 text-white rounded-lg sm:rounded-xl px-2 py-1.5 sm:py-2 text-xs sm:text-sm text-center focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  ))}
                </div>

                {/* Action buttons — stacked on mobile, side-by-side on sm+ */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setImage(null);
                      setZoom(1);
                    }}
                    className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-white/10 text-white font-medium hover:bg-white/5 transition-all text-xs sm:text-sm uppercase tracking-wider"
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={generateImage}
                    className="w-full sm:flex-2 bg-linear-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider"
                  >
                    ↓ Download A4 Sheet
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right panel: Sheet Preview ── */}
        {image && (
          <SheetPreview
            image={image}
            croppedAreaPixels={croppedAreaPixels}
            rows={rows}
            cols={cols}
            previewContainerRef={previewContainerRef}
            sheetPreviewRef={sheetPreviewRef}
          />
        )}
      </div>
    </div>
  );
}
