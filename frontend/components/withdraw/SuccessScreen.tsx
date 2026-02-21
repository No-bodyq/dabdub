"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SuccessScreenProps {
  amount: string;
  walletAddress: string;
  onBackToHome: () => void;
}

export function SuccessScreen({
  amount,
  walletAddress,
  onBackToHome,
}: SuccessScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 relative text-black">
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[246.76px] h-[266.24px] transform rotate-[20.64deg] ">
        <Image
          src="/icons/withdraw/cheese-big.png"
          alt="Cheese"
          fill
          className="object-contain"
        />
      </div>
      <div className="space-y-4 w-full relative z-10">
        <div className="p-4 rounded-[4px] gap-2.5 flex items-center bg-white border border-theme-border">
          <div className="size-10 rounded-full flex items-center justify-center bg-brand-green"></div>
          <div>
            <p className="font-helvetica font-normal text-base text-theme-text-muted">
              You just withdrew
            </p>
            <h5 className="font-mochiy font-normal text-base text-theme-text">
              ₦{amount || "7,550.00"}
            </h5>
            <p className="font-helvetica font-medium text-base text-theme-text-muted">
              to {walletAddress || "0x601e....f35267"}
            </p>
          </div>
        </div>
        <Button
          onClick={onBackToHome}
          className="w-full h-[47px] bg-brand-green text-white hover:bg-brand-green/95 cursor-pointer rounded-[2px] border-2 border-deep-black font-bold text-base shadow-hard transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
