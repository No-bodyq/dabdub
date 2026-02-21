"use client";

import Image from "next/image";
import { SlideButton } from "./SlideButton";
import { X } from "lucide-react";

interface ReviewModalProps {
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ReviewModal({ onConfirm, onCancel }: ReviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full rounded-[4px] border border-theme-border shadow-2xl p-4 space-y-6 relative">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 p-1 hover:bg-black/5 rounded-full transition-colors text-theme-text-muted hover:text-deep-black"
          >
            <X className="size-5" />
          </button>
        )}
        <div className="gap-4 flex flex-col items-center pt-2">
          <div className="size-10 rounded-full flex items-center justify-center bg-app-yellow">
            <Image
              src="/icons/withdraw/alert.svg"
              alt="Alert"
              width={21}
              height={18.75}
            />
          </div>
          <h5 className="font-helvetica font-bold text-base text-charcoal-dark text-center">
            Is this address compatible
          </h5>
          <p className="font-normal text-base text-center text-charcoal-dark font-helvetica">
            Only send to address that support the selected network and token.
            Incorrect transfers may be lost.
          </p>
        </div>
        <div className="pt-4">
          <SlideButton text="Slide to proceed" onSuccess={onConfirm} />
        </div>
      </div>
    </div>
  );
}
