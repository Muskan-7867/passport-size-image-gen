import React, { RefObject } from "react";

type Props = {
  image: File | null;
  croppedAreaPixels: any;
  rows: number;
  cols: number;
  previewContainerRef: RefObject<HTMLDivElement | null>;
  sheetPreviewRef: RefObject<HTMLCanvasElement | null>;
};

function SheetPreview({
  image,
  croppedAreaPixels,
  rows,
  cols,
  previewContainerRef,
  sheetPreviewRef,
}: Props) {
  return (
    <div className="w-full flex-1  backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl">
      <div className="p-3 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xs font-semibold uppercase tracking-widest">
            Sheet Preview
          </h2>
          {image && croppedAreaPixels && (
            <span className="text-zinc-500 text-[10px] sm:text-xs">
              A4 · {rows}×{cols} · {rows * cols} photos
            </span>
          )}
        </div>

        {image && croppedAreaPixels ? (
          <div ref={previewContainerRef} className="w-full overflow-hidden">
            <div className="shadow-2xl shadow-black/60 overflow-hidden">
              <canvas ref={sheetPreviewRef} style={{ display: "block" }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-3 py-12 sm:py-20">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 opacity-20 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-zinc-500 text-xs sm:text-sm">
              Upload and crop an image to see the A4 sheet preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SheetPreview;
