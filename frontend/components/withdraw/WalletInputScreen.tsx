"use client";

import { Button } from "@/components/ui/button";
import { ChevronRightIcon, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface WalletInputScreenProps {
  amount: string;
  walletAddress: string;
  setWalletAddress: (val: string) => void;
  isReviewing: boolean;
  onReview: () => void;
}

export function WalletInputScreen({
  amount,
  walletAddress,
  setWalletAddress,
  isReviewing,
  onReview,
}: WalletInputScreenProps) {
  return (
    <div className="space-y-6 px-4 flex-1 pt-6">
      <div className="space-y-4">
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
        <div className="px-4 py-2 shadow-hard rounded-[4px] flex items-center gap-4 bg-white border border-theme-border">
          <div className="size-[32px] rounded-full flex items-center justify-center">
            <Image
              src="/icons/withdraw/Adollar.svg"
              alt="Dollar"
              width={32}
              height={32}
            />
          </div>
          <div className="space-y-1 flex-1">
            <p className="font-helvetica font-normal text-base text-theme-text">
              <span className="font-bold">USDC</span> on Arbitrum
            </p>
            <h5 className="text-base font-helvetica font-medium text-theme-text-muted">
              No fees with this token.
            </h5>
          </div>
          <ChevronRightIcon className="size-6" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-helvetica font-bold text-base text-deep-black">
            Wallet address
          </h1>
          <div className="relative group">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter an address or ENS"
              className="placeholder:text-sm placeholder:font-medium placeholder:text-theme-text-muted w-full h-10 px-4 py-2 bg-white border-2 border-theme-border rounded-[2px] font-helvetica text-base focus:outline-none focus:border-brand-green transition-all pr-10"
            />
            {walletAddress && (
              <button
                onClick={() => setWalletAddress("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 rounded-full transition-colors text-theme-text-muted hover:text-deep-black"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
        <Button
          onClick={onReview}
          className={`w-full h-[47px] py-3 px-4 rounded-[2px] border-2 border-deep-black font-bold text-base shadow-hard transition-all transform flex items-center justify-center gap-2 ${
            walletAddress === "" || isReviewing
              ? "bg-[#E8F1EB] text-theme-text-secondary cursor-not-allowed pointer-events-none"
              : "bg-brand-green text-white hover:bg-brand-green/95 cursor-pointer active:scale-[0.98]"
          }`}
        >
          {isReviewing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reviewing...
            </>
          ) : (
            "Review"
          )}
        </Button>
      </div>
    </div>
  );
}
