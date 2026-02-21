"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

import { NoAccountScreen } from "@/components/withdraw/NoAccountScreen";
import { SelectMethodScreen } from "@/components/withdraw/SelectMethodScreen";
import { AmountInputScreen } from "@/components/withdraw/AmountInputScreen";
import { WalletInputScreen } from "@/components/withdraw/WalletInputScreen";
import { WithdrawSummaryScreen } from "@/components/withdraw/WithdrawSummaryScreen";
import { ProcessingScreen } from "@/components/withdraw/ProcessingScreen";
import { SuccessScreen } from "@/components/withdraw/SuccessScreen";
import { ReviewModal } from "@/components/withdraw/ReviewModal";

interface Country {
  name: { common: string };
  flags: { svg: string };
  currencies: { [key: string]: { name: string; symbol: string } };
}

type WithdrawStep =
  | "no-account"
  | "select-method"
  | "amount-input"
  | "wallet-input"
  | "summary"
  | "processing"
  | "success";

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<WithdrawStep>("no-account");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,currencies")
      .then((res) => res.json())
      .then((data: Country[]) => {
        const nigeria = data.find((c) => c.name.common === "Nigeria");
        const others = data
          .filter((c) => c.name.common !== "Nigeria")
          .sort((a, b) => a.name.common.localeCompare(b.name.common));

        const selected = nigeria
          ? [nigeria, ...others.slice(0, 29)]
          : others.slice(0, 30);
        setCountries(selected);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch countries:", err);
        setLoading(false);
      });
  }, []);

  const handleBack = () => {
    switch (step) {
      case "select-method": setStep("no-account"); break;
      case "amount-input": setStep("select-method"); break;
      case "wallet-input": setStep("amount-input"); break;
      case "summary": setStep("wallet-input"); break;
      default: break;
    }
  };

  const renderScreen = () => {
    switch (step) {
      case "no-account":
        return <NoAccountScreen onAddAccount={() => setStep("select-method")} />;
      case "select-method":
        return (
          <SelectMethodScreen
            countries={countries}
            loading={loading}
            onSelectMethod={() => setStep("amount-input")}
          />
        );
      case "amount-input":
        return (
          <AmountInputScreen
            amount={amount}
            setAmount={setAmount}
            onContinue={() => setStep("wallet-input")}
          />
        );
      case "wallet-input":
        return (
          <WalletInputScreen
            amount={amount}
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            isReviewing={isReviewing}
            onReview={() => {
              setIsReviewing(true);
              setTimeout(() => {
                setIsReviewing(false);
                setShowModal(true);
              }, 1500);
            }}
          />
        );
      case "summary":
        return (
          <WithdrawSummaryScreen
            amount={amount}
            walletAddress={walletAddress}
            isReviewing={isReviewing}
            onWithdraw={() => {
              setStep("processing");
              setTimeout(() => {
                setStep("success");
              }, 3000);
            }}
          />
        );
      case "processing":
        return <ProcessingScreen />;
      case "success":
        return (
          <SuccessScreen
            amount={amount}
            walletAddress={walletAddress}
            onBackToHome={() => router.push("/")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="h-screen bg-cream-white text-black flex flex-col pt-4 relative overflow-hidden">
      <header className="px-4 flex items-center justify-between mb-2 mt-4 pt-4">
        <button 
          onClick={handleBack}
          className="p-2 border size-8 border-black rounded-full hover:bg-black/5 transition-colors flex items-center justify-center font-bold"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-normal font-mochiy text-black">Withdraw</h1>
        <div className="w-10" />
      </header>

      {renderScreen()}

      <footer className="w-full h-[78px] px-6 py-4 border-t border-t-[#A0A0A0] flex items-center justify-between mt-auto bg-cream-white">
        <div className="space-y-2 flex flex-col items-center">
          <div className="size-6 relative">
            <Image src="/icons/request/home2.svg" alt="Home" fill />
          </div>
          <p className="text-sm text-brand-green font-normal font-helvetica">
            Home
          </p>
        </div>
        <div>
          <div className="size-[92px] p-8 -mt-8 bg-brand-green rounded-full flex items-center justify-center border-4 border-cream-white">
            <Image
              src="/icons/request/menu.svg"
              alt="Menu"
              width={32}
              height={32}
            />
          </div>
        </div>
        <div className="space-y-2 flex flex-col items-center">
          <div className="size-6 relative">
            <Image src="/icons/request/support.svg" alt="Support" fill />
          </div>
          <p className="text-sm text-muted-text font-normal font-helvetica">
            Support
          </p>
        </div>
      </footer>

      {showModal && (
        <ReviewModal
          onConfirm={() => {
            setShowModal(false);
            setStep("summary");
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </main>
  );
}
