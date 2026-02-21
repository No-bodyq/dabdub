"use client";

import { Button } from "@/components/ui/button";
import { AlertCircleIcon, Plus } from "lucide-react";
import Image from "next/image";

interface NoAccountScreenProps {
  onAddAccount: () => void;
}

export function NoAccountScreen({ onAddAccount }: NoAccountScreenProps) {
  return (
    <div className="px-4 flex-1 flex items-center justify-center">
      <div className="w-full p-4 bg-white border space-y-6 border-slate-grey rounded-[16px]">
        <div className="gap-4 flex flex-col items-center">
          <div className="size-10 rounded-full flex items-center justify-center bg-app-yellow">
            <Image 
              src="/icons/withdraw/alert.svg" 
              alt="Alert" 
              width={21} 
              height={18.75}
            />
          </div>
          <h5 className="font-helvetica font-bold text-base text-charcoal-dark">
            No accounts yet
          </h5>
          <p className="font-normal text-base text-center text-charcoal-dark font-helvetica">
            Add your account details once <br /> to withdraw in one tap
          </p>
        </div>
        <Button
          onClick={onAddAccount}
          className="w-full h-[48px] cursor-pointer py-3 px-4 rounded-[2px] border border-deep-black font-bold text-base shadow-hard transition-all transform active:scale-[0.98] bg-brand-green flex items-center justify-center gap-2"
        >
          <div className="size-6  flex items-center justify-center">
            <Plus size={24} className="text-theme-bg-light" />
          </div>
          <p className="font-helvetica font-bold text-base text-theme-bg-light">
            Add account
          </p>
        </Button>
      </div>
    </div>
  );
}
