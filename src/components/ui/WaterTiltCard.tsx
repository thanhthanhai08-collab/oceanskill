"use client";

import {useRef, type PointerEvent, type ReactNode} from "react";

export interface WaterTiltCardProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export default function WaterTiltCard({children, className = ""}: WaterTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = cardRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    element.style.setProperty("--water-x", `${x * 100}%`);
    element.style.setProperty("--water-y", `${y * 100}%`);
    element.style.setProperty("--tilt-x", `${(0.5 - y) * 7}deg`);
    element.style.setProperty("--tilt-y", `${(x - 0.5) * 9}deg`);
  };
  const handlePointerLeave = () => {
    const element = cardRef.current;
    if (!element) return;
    element.style.setProperty("--water-x", "50%");
    element.style.setProperty("--water-y", "50%");
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
  };
  return (
    <div ref={cardRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} className={`water-tilt group/water relative h-full ${className}`}>
      <div aria-hidden="true" className="water-sheen pointer-events-none absolute inset-0 z-20 rounded-[inherit]" />
      <div aria-hidden="true" className="water-ripples pointer-events-none absolute inset-0 z-20 rounded-[inherit]" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
