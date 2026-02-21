"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Token } from "../types";

interface DepositStatusStepProps {
  selectedToken: Token;
  amount: string;
  onComplete: () => void;
}

type StepStatus = "pending" | "current" | "completed";

export function DepositStatusStep({
  selectedToken,
  amount,
  onComplete,
}: DepositStatusStepProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [address] = useState("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

  const steps = [
    {
      title: "Waiting for deposit",
      description: `Send ${amount} ${selectedToken.symbol}`,
    },
    { title: "Tokens received", description: "Confirming transaction" },
    {
      title: `Swapping ${selectedToken.symbol} to USDC`,
      description: "Finding best rate",
    },
    {
      title: "Settlement complete",
      description: "Funds added to your balance",
    },
  ];

  useEffect(() => {
    // Simulate progress
    const timers = [
      setTimeout(() => setCurrentStep(1), 3000), // Deposit received after 3s
      setTimeout(() => setCurrentStep(2), 6000), // Swap started after 6s
      setTimeout(() => setCurrentStep(3), 9000), // Swap done after 9s
      setTimeout(() => setCurrentStep(4), 10000), // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const getStepStatus = (index: number): StepStatus => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "pending";
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    // Could add toast here
  };

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <span className="font-bold">Important:</span> Only send{" "}
          <strong>{selectedToken.symbol}</strong> on the{" "}
          <strong>{selectedToken.network}</strong> network. Sending other tokens
          will result in permanent loss.
        </div>
      </div>

      {/* Address & QR */}
      <div className="bg-white border border-theme-border rounded-xl p-6 text-center space-y-4">
        <div className="mx-auto w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <span className="text-gray-400 font-medium">QR Code</span>
        </div>
        <div>
          <div className="text-xs text-theme-text-secondary uppercase mb-1 font-bold">
            Deposit Address
          </div>
          <div className="flex items-center gap-2 justify-center bg-theme-bg-secondary p-2 rounded-lg border border-theme-border">
            <code className="text-xs md:text-sm text-theme-text truncate max-w-[200px]">
              {address}
            </code>
            <button
              onClick={copyAddress}
              className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Copy className="w-4 h-4 text-theme-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white z-10 transition-colors duration-500",
                    status === "completed"
                      ? "bg-green-500 text-white"
                      : status === "current"
                        ? "bg-theme-primary text-white"
                        : "bg-gray-100 text-gray-400",
                  )}
                >
                  {status === "completed" ? (
                    <Check className="w-4 h-4" />
                  ) : status === "current" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 h-10 transition-colors duration-500",
                      status === "completed" ? "bg-green-500" : "bg-gray-100",
                    )}
                  />
                )}
              </div>
              <div
                className={cn(
                  "pb-8 transition-opacity duration-500",
                  status === "pending" ? "opacity-40" : "opacity-100",
                )}
              >
                <div className="font-bold text-theme-text text-sm">
                  {step.title}
                </div>
                <div className="text-xs text-theme-text-secondary">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish Button */}
      {currentStep === 4 && (
        <button
          onClick={onComplete}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-3.5 font-bold shadow-[4px_4px_0px_0px_black] border-2 border-green-700 transition-all animate-in zoom-in"
        >
          Return to Dashboard
        </button>
      )}
    </div>
  );
}
