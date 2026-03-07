// ─── UploadProgress ───────────────────────────────────────────────────────────
//
// Small progress bar overlay rendered on top of images during upload.
// Accepts a progress value from 0 to 100.

interface UploadProgressProps {
  progress: number;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-4">
      {/* Label */}
      <span className="text-xs font-medium text-white drop-shadow">
        Enviando... {pct}%
      </span>

      {/* Track */}
      <div className="w-full max-w-[80%] overflow-hidden rounded-full bg-white/30 h-1.5">
        {/* Fill */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ width: `${pct}%` }}
          className="h-full rounded-full bg-white transition-[width] duration-150 ease-out"
        />
      </div>
    </div>
  );
}
