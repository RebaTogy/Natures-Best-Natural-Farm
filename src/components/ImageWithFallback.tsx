"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

// A beautiful, subtle fallback SVG matching the natural theme
const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect fill="%23f0f4f0" width="800" height="800"/><path fill="%23c4dac4" d="M400,250 C480,250 550,320 550,400 C550,480 480,550 400,550 C320,550 250,480 250,400 C250,320 320,250 400,250 Z M400,290 C340,290 290,340 290,400 C290,460 340,510 400,510 C460,510 510,460 510,400 C510,340 460,290 400,290 Z"/><text fill="%237b987b" x="50%" y="50%" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" alignment-baseline="middle">Image Not Found</text></svg>`;

interface ImageWithFallbackProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

export function ImageWithFallback({
  src,
  fallbackSrc = fallbackSvg,
  alt,
  sizes,
  ...rest
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const effectiveSizes = sizes || "100vw";

  return (
    <Image
      {...rest}
      key={src || fallbackSrc}
      src={imgSrc}
      alt={alt || "Image"}
      sizes={effectiveSizes}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
