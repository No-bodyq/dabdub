"use client";

import Image from "next/image";

export function ProcessingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="relative size-[42px] animate-pulse">
        <Image
          src="/icons/request/mini.svg"
          alt="Mini Illustration"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
