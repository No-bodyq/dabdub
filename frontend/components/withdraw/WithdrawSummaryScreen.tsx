"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface WithdrawSummaryScreenProps {
  amount: string;
  walletAddress: string;
  isReviewing: boolean;
  onWithdraw: () => void;
}

export function WithdrawSummaryScreen({
  amount,
  walletAddress,
  isReviewing,
  onWithdraw,
}: WithdrawSummaryScreenProps) {
  return (
    <div className="space-y-6 px-4 flex-1 pt-6 text-black">
      <div className="space-y-6">
        <div className="p-4 rounded-[4px] gap-4 flex items-center bg-white border border-theme-border">
          <div className="size-10 rounded-full flex items-center justify-center bg-app-yellow">
            <Image
              src="/icons/withdraw/wallet2.svg"
              alt="Wallet"
              width={18.75}
              height={16.5}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-helvetica font-medium text-base text-theme-text-muted">
              You’re withdrawing
            </p>
            <h5 className="font-mochiy font-normal text-base text-theme-text">
              ₦{amount || "7,550.00"}
            </h5>
          </div>
        </div>
        <div className="p-4 rounded-[4px] gap-4 space-y-2 bg-white border border-theme-border">
          <p className="font-helvetica font-normal text-base text-theme-text-muted">
            Token and network
          </p>
          <div className="flex items-center gap-2">
            <div className=" rounded-full flex items-center justify-center bg-app-yellow">
              <Image
                src="/icons/withdraw/Adollar.svg"
                alt="Dollar"
                width={32}
                height={32}
              />
            </div>
            <p className="font-helvetica font-bold text-base text-theme-text">
              USDC on Arbitrum
            </p>
          </div>
          <div className="w-full h-1 border-b border-dashed border-[#A0A0A0]" />
          <p className="font-helvetica font-normal text-base text-theme-text-muted">
            To
          </p>
          <p className="font-helvetica font-bold text-base text-theme-text">
            {walletAddress || "0x601e....f35267"}
          </p>
          <div className="w-full h-1 border-b border-dashed border-[#A0A0A0]" />
          <p className="font-helvetica font-normal text-base text-theme-text-muted">
            Max network fee
          </p>
          <p className="font-helvetica font-bold text-base text-theme-text">
            Sponsored by Cheese!
          </p>
          <div className="w-full h-1 border-b border-dashed border-[#A0A0A0]" />
          <p className="font-helvetica font-normal text-base text-theme-text-muted">
            Cheese fee
          </p>
          <p className="font-mochiy font-bold text-base text-theme-text">
            ₦0.00
          </p>
          <div className="w-full h-1 border-b border-dashed border-[#A0A0A0]" />
        </div>
      </div>
      <div className="pt-2">
        <Button
          onClick={onWithdraw}
          className="w-full h-[47px] bg-brand-green text-white hover:bg-brand-green/95 cursor-pointer rounded-[2px] border-2 border-deep-black font-bold text-base shadow-hard transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isReviewing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Withdraw"
          )}
        </Button>
      </div>
    </div>
  );
}
