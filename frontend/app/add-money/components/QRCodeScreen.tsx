import { StatusBar } from "@/app/shared/StatusBar";
import { BottomNav } from "@/app/shared/BottomNav";
import { Copy, Wallet, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function QRCodeScreen() {
  const router = useRouter();
  const depositAddress =
    "bc1q9z0y8k2xw3q5i7n6m4r2s1d0f9h8c7v6b5";

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    // Address copied to clipboard
  };

  return (
    <div className="bg-theme-bg min-h-screen w-full">
      <div className="max-w-[390px] mx-auto relative">

        <div className="px-4 pt-6 pb-32">
        <div className="flex items-center gap-16 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-6 h-6 text-theme-text" />
          </button>
          <h1 className="text-2xl font-['Mochiy_Pop_One',sans-serif] text-theme-text">
            Add Money
          </h1>
        </div>

        <div className="bg-theme-bg-light border border-theme-primary rounded-lg p-3 flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-theme-gold rounded-full flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-theme-text" />
          </div>
          <div className="flex-1 text-sm">
            <p className="text-theme-text">
              <strong>Deposit</strong>{" "}
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-4 h-4 bg-theme-usdc rounded-full"></span>
                <strong>USDC</strong>
              </span>{" "}
              on{" "}
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-4 h-4 bg-theme-usdc rounded-full"></span>
                <strong>Arbitrum one</strong>
              </span>
            </p>
            <p className="text-theme-text-secondary mt-1">
              Other tokens or networks will be lost.
            </p>
          </div>
        </div>

        <div className="bg-white border-4 border-theme-text rounded-2xl p-6 flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center">
              <span className="text-sm text-gray-500">QR Code</span>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-theme-gold rounded-full border-4 border-white flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-bold text-theme-text mb-2">
            Your deposit address
          </h3>
          <div className="bg-white border border-theme-border rounded p-3 flex items-center gap-2">
            <div className="flex-1 text-sm text-theme-text font-mono overflow-hidden">
              <div className="truncate">{depositAddress}</div>
            </div>
            <button
              onClick={handleCopy}
              className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            >
              <Copy className="w-5 h-5 text-theme-text" />
            </button>
          </div>
        </div>

        <button className="w-full bg-theme-bg-disabled text-theme-text opacity-50 rounded py-3 px-4 font-medium text-base cursor-not-allowed">
          I did it!
        </button>
        </div>

        <BottomNav activeTab="home" />
      </div>
    </div>
  );
}