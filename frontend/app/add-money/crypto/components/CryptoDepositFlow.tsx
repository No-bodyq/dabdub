"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TokenSelectionStep } from "./TokenSelectionStep";
import { AmountExchangeStep } from "./AmountExchangeStep";
import { DepositStatusStep } from "./DepositStatusStep";
import { Token } from "../types";

export function CryptoDepositFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"token" | "amount" | "status">("token");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");

  const handleBack = () => {
    if (step === "status") {
      // Warn user? or just go back to home? Status usually implies commitment, but here it's simulation.
      // Let's just go back to amount for now.
      router.push("/add-money");
      return;
    }
    if (step === "amount") {
      setStep("token");
      return;
    }
    if (step === "token") {
      router.back();
      return;
    }
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setStep("amount");
  };

  const handleAmountContinue = (amt: string) => {
    setAmount(amt);
    setStep("status");
  };

  const handleComplete = () => {
    router.push("/"); // Back to home/dashboard
  };

  const getTitle = () => {
    if (step === "token") return "Select Token";
    if (step === "amount") return "Exchange";
    if (step === "status") return "Deposit";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-theme-bg-secondary rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-theme-text" />
        </button>
        <h1 className="text-xl font-bold font-['Mochiy_Pop_One',sans-serif] text-theme-text">
          {getTitle()}
        </h1>
      </div>

      {/* Steps */}
      <div className="animate-in slide-in-from-right-4 duration-300">
        {step === "token" && (
          <TokenSelectionStep onSelect={handleTokenSelect} />
        )}

        {step === "amount" && selectedToken && (
          <AmountExchangeStep
            selectedToken={selectedToken}
            onContinue={handleAmountContinue}
            onBack={() => setStep("token")}
          />
        )}

        {step === "status" && selectedToken && (
          <DepositStatusStep
            selectedToken={selectedToken}
            amount={amount}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
