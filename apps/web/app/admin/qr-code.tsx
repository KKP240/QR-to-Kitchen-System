"use client";

import QR from "qrcode";

/** A local SVG keeps table links private and supports offline printing. */
export function QRCode({ value, id }: { value: string; id?: string }) {
  const { modules } = QR.create(value, { errorCorrectionLevel: "M" });
  const border = 4;
  const size = modules.size + border * 2;
  let path = "";
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.get(y, x)) path += `M${x + border},${y + border}h1v1h-1z`;
    }
  }
  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="QR Code สำหรับสแกนดูเมนู"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="white" />
      <path d={path} fill="#2e3b31" />
    </svg>
  );
}
