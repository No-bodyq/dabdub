import { StatusBar } from "@/app/shared/StatusBar";
import { BottomNav } from "@/app/shared/BottomNav";
import { Building2, Wallet, ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DepositMethodSheet } from "@/app/shared/DepositMethodSheet";
import { DepositInfoModal } from "@/app/add-money/components/DepositModal";

export function AddMoneyViaScreen() {
  const router = useRouter();
  const [showSheet, setShowSheet] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  return (
    <div className="bg-theme-bg min-h-screen w-full">
      <div className="max-w-[390px] mx-auto relative">
        <div className="px-4 pt-6 pb-32">
        <div className="flex items-center gap-16 mb-8">
          <button onClick={() => router.push("/add-money")} className="p-2">
            <ArrowLeft className="w-6 h-6 text-theme-text" />
          </button>
          <h1 className="text-2xl font-['Mochiy_Pop_One',sans-serif] text-theme-text">
            Nigeria
          </h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-theme-text">
            Add Money via
          </h2>

          <button className="w-full bg-white border border-theme-border rounded p-3 flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-theme-gold rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-theme-text" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-base font-medium text-theme-text">
                From Bank
              </div>
              <div className="text-sm text-theme-text-secondary">
                Usually in minutes - KYC required
              </div>
            </div>
            <div className="absolute top-3 right-3 bg-theme-primary text-white text-xs font-medium px-2 py-1 rounded">
              Soon!
            </div>
          </button>

          <button
            onClick={() => setShowSheet(true)}
            className="w-full bg-white border border-theme-border rounded p-3 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-theme-gold rounded-full flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-theme-text" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-base font-medium text-theme-text">
                From Crypto
              </div>
              <div className="text-sm text-theme-text-secondary">
                Usually arrives instantly
              </div>
            </div>
            <div className="w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
        </div>

        <BottomNav activeTab="home" />
      </div>

      {showSheet && (
        <DepositMethodSheet
          onClose={() => setShowSheet(false)}
          onSelectUSDC={() => setShowDepositModal(true)}
        />
      )}

      {showDepositModal && (
        <DepositInfoModal onClose={() => setShowDepositModal(false)} />
      )}
    </div>
  );
}