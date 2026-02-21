"use client";

import { BottomNav } from "@/app/shared/BottomNav";
import { CryptoDepositFlow } from "./components/CryptoDepositFlow";

export default function CryptoDepositPage() {
  return (
    <div className="bg-theme-bg min-h-screen w-full">
      <div className="max-w-[390px] mx-auto relative">
        <div className="px-4 pt-6 pb-32">
          <CryptoDepositFlow />
        </div>
        <BottomNav activeTab="home" />
      </div>
    </div>
  );
}
