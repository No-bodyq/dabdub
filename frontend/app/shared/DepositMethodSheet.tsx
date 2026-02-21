"use client";
import { motion } from "motion/react";
import { Coins } from "lucide-react";
import { useRouter } from "next/navigation";

interface DepositMethodSheetProps {
  onClose: () => void;
  onSelectUSDC?: () => void;
}

export function DepositMethodSheet({
  onClose,
  onSelectUSDC,
}: DepositMethodSheetProps) {
  const router = useRouter();
  const handleUSDCClick = () => {
    onClose();
    if (onSelectUSDC) {
      onSelectUSDC();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-theme-overlay z-40"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-w-[390px] mx-auto"
      >
        <div className="w-16 h-1.5 bg-black rounded-full mx-auto mt-4 mb-6"></div>

        <div className="px-6 pb-8">
          <h2 className="text-xl font-bold text-theme-text mb-6">
            Select a deposit method
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleUSDCClick}
              className="w-full bg-white border border-theme-border rounded-lg p-4 flex items-center gap-4"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-medium text-theme-text">
                    USDC on Arbitrum
                  </span>
                  <span className="text-xs font-medium text-theme-primary bg-theme-bg-light px-2 py-1 rounded">
                    Free
                  </span>
                </div>
                <div className="text-sm text-theme-text-secondary">
                  Recommended option for deposits
                </div>
              </div>
              <div className="w-10 h-10 bg-theme-usdc rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                router.push("/add-money/crypto");
              }}
              className="w-full bg-white border border-theme-border rounded-lg p-4 flex items-center gap-4 hover:border-theme-primary transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="text-base font-medium text-theme-text mb-1">
                  Other Token
                </div>
                <div className="text-sm text-theme-text-secondary">
                  Deposit with any token you hold
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <div className="w-6 h-6 bg-theme-bitcoin rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">₿</span>
                </div>
                <div className="w-6 h-6 bg-theme-ethereum rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Ξ</span>
                </div>
                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
                  <Coins className="w-4 h-4 text-white" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
