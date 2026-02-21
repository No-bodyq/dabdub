"use client";

import { Button } from "@/components/ui/button";

interface AmountInputScreenProps {
  amount: string;
  setAmount: (val: string) => void;
  onContinue: () => void;
}

export function AmountInputScreen({
  amount,
  setAmount,
  onContinue,
}: AmountInputScreenProps) {
  return (
    <div className="flex justify-center items-center w-full flex-1 text-black">
      <div className="px-4 space-y-4 w-full">
        <h5 className="text-base font-bold text-theme-text text-center">
          Amount to withdraw
        </h5>
        <div className="py-6 px-3 flex flex-col items-center gap-2 rounded-[4px] bg-white border border-black w-full">
          <div className="flex items-center justify-center">
            <span
              className={`text-3xl font-normal transition-colors duration-200 mr-1 ${
                amount.length > 0 ? "text-deep-black" : "text-muted-text"
              }`}
            >
              ₦
            </span>
            <div className="relative inline-flex items-center min-w-[20px]">
              <span className="text-[32px] font-normal font-mochiy invisible whitespace-pre px-1">
                {amount || "0.00"}
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="absolute inset-0 w-full text-[32px] bg-transparent font-normal text-deep-black font-mochiy border-none outline-none placeholder:text-muted-text text-center px-1"
              />
            </div>
          </div>
          <p className="text-base font-normal text-muted-text font-helvetica">
            Balance: ₦348,269.00
          </p>
        </div>
        <Button
          disabled={amount === ""}
          onClick={onContinue}
          className="w-full disabled:bg-[#E8F1EB] disabled:text-theme-text-secondary disabled:cursor-not-allowed h-[47px] cursor-pointer py-3 px-4 rounded-[2px] border border-deep-black font-bold text-base shadow-hard transition-all transform active:scale-[0.98] bg-brand-green text-white hover:bg-brand-green/95 flex items-center justify-center gap-2"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
