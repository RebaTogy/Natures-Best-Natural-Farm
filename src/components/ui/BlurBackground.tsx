import { ReactNode } from "react";

interface BlurBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export default function BlurBackground({ children, className = "" }: BlurBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col bg-farm-cream-50">
      {/* Cinematic Blurred Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 blur-[4px]"
        style={{ backgroundImage: "url('/images/media_bg_common.jpg')" }}
      ></div>

      {/* Frosted Glassmorphism Overlay to ensure content readability and luxury feel */}
      <div
        className="absolute inset-0 z-0 border-y border-white/30 pointer-events-none bg-white/20 backdrop-blur-md shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]"
      ></div>

      {/* Soft gradient lighting */}
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-white/30 via-transparent to-farm-green-900/40 pointer-events-none"
      ></div>

      {/* Content wrapper */}
      <div className={`relative z-10 flex flex-col w-full ${className}`}>
        {children}
      </div>
    </div>
  );
}
