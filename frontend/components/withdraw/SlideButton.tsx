"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "lucide-react";

interface SlideButtonProps {
  onSuccess: () => void;
  text: string;
}

export function SlideButton({ onSuccess, text }: SlideButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left - 30; // 30 is half handle width

    const max = container.offsetWidth - 56; // 52px width + 4px padding/border
    if (x < 4) x = 4;
    if (x > max) x = max;

    setPosition(x);

    if (x >= max - 5) {
      setIsDragging(false);
      setPosition(max);
      onSuccess();
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const max = containerRef.current
      ? containerRef.current.offsetWidth - 56
      : 0;
    if (position < max - 5) {
      setPosition(4);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, position]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[60px] bg-white border-2 border-deep-black rounded-[4px] shadow-hard overflow-hidden flex items-center justify-center select-none"
    >
      <p className="font-helvetica font-bold text-base text-deep-black/30 pointer-events-none">
        {text}
      </p>
      <div
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{ transform: `translateX(${position}px)` }}
        className="absolute left-[-5px] top-0 h-[60px] w-[52px] bg-brand-green border border-deep-black rounded-[2px] flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out z-10"
      >
        <ChevronRightIcon className="text-black size-8" strokeWidth={3} />
      </div>
    </div>
  );
}
