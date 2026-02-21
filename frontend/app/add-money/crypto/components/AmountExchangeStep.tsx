"use client";

import { useState, useEffect } from "react";
import {
  ArrowDown,
  Info,
  Settings,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Token } from "../types";

interface AmountExchangeStepProps {
  selectedToken: Token;
  onContinue: (amount: string) => void;
  onBack: () => void;
}

export function AmountExchangeStep({
  selectedToken,
  onContinue,
  onBack,
}: AmountExchangeStepProps) {
  const [amount, setAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [slippage, setSlippage] = useState<"Auto" | "Low" | "Medium" | "High">(
    "Auto",
  );
  const [showSettings, setShowSettings] = useState(false);

  // Simulation values
  const rate = selectedToken.price; // 1 Token = $price USDC
  const usdcAmount = amount ? (parseFloat(amount) * rate).toFixed(2) : "0.00";
  const fee = amount ? (parseFloat(usdcAmount) * 0.01).toFixed(2) : "0.00"; // 1% fee
  const received = amount
    ? (parseFloat(usdcAmount) - parseFloat(fee)).toFixed(2)
    : "0.00";

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Rate & Refresh */}
      <div className="flex items-center justify-between text-xs text-theme-text-secondary">
        <div className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin-slow" />
          <span>Rate refreshes in {timeLeft}s</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 text-theme-primary hover:text-theme-primary-dark"
        >
          <Settings className="w-3 h-3" />
          <span>Slippage: {slippage}</span>
        </button>
      </div>

      {/* Slippage Settings */}
      {showSettings && (
        <div className="bg-theme-bg-secondary p-3 rounded-lg border border-theme-border text-sm duration-200 animate-in fade-in slide-in-from-top-2">
          <p className="mb-2 font-medium text-theme-text">Max Slippage</p>
          <div className="flex gap-2">
            {(["Auto", "Low", "Medium", "High"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex-1",
                  slippage === s
                    ? "bg-theme-primary text-white border-theme-primary"
                    : "bg-white text-theme-text border-theme-border hover:border-theme-text-muted",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="relative">
        <label className="text-xs font-bold text-theme-text-secondary uppercase mb-1 block">
          From
        </label>
        <div className="bg-white border border-theme-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0",
              selectedToken.iconColor,
            )}
          >
            {selectedToken.symbol[0]}
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-2xl font-bold text-theme-text placeholder:text-theme-text-muted outline-none bg-transparent p-0"
            />
            <div className="text-xs text-theme-text-secondary mt-1">
              Balance: 0.00 {selectedToken.symbol}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-theme-text">
              {selectedToken.symbol}
            </div>
            <div className="text-xs text-theme-text-secondary">
              {selectedToken.network}
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-10 bg-theme-bg p-1 rounded-full">
          <div className="bg-theme-bg-secondary border border-theme-border p-1.5 rounded-full text-theme-text-secondary">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="pt-2">
        {" "}
        {/* Spacer for arrow */}
        <label className="text-xs font-bold text-theme-text-secondary uppercase mb-1 block">
          To (Estimated)
        </label>
        <div className="bg-theme-bg-secondary border border-theme-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
            U
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-theme-text">{received}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-theme-text">USDC</div>
            <div className="text-xs text-theme-text-secondary">Polygon</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white border border-theme-border rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-theme-text-secondary">Rate</span>
          <span className="text-theme-text font-medium">
            1 {selectedToken.symbol} ≈ {rate} USDC
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-theme-text-secondary flex items-center gap-1">
            Network Fee <Info className="w-3 h-3" />
          </span>
          <span className="text-theme-text font-medium">~$2.50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-theme-text-secondary">Platform Fee (1%)</span>
          <span className="text-theme-text font-medium">{fee} USDC</span>
        </div>
        <div className="h-px bg-theme-border my-2"></div>
        <div className="flex justify-between text-base font-bold">
          <span className="text-theme-text">Min. Received</span>
          <span className="text-theme-text">{received} USDC</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onContinue(amount)}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full bg-theme-primary text-white rounded-lg py-3.5 font-bold shadow-[4px_4px_0px_0px_black] border-2 border-theme-border-dark disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 active:translate-y-1 active:shadow-none transition-all"
      >
        Continue to Deposit
      </button>
    </div>
  );
}
