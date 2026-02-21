"use client";
import { BottomNav } from "@/app/shared/BottomNav";
import { StatusBar } from "@/app/shared/StatusBar";
import { ChevronRight, Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddMoneyPage() {
  const router = useRouter();

  return (
    <div className="bg-theme-bg min-h-screen w-full">
      <div className="max-w-[390px] mx-auto relative">

        <div className="px-4 pt-6 pb-32">
        <div className="flex items-center gap-16 mb-8">
          <button onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-6 h-6 text-theme-text" />
          </button>
          <h1 className="text-2xl font-['Mochiy_Pop_One',sans-serif] text-theme-text">
            Add Money
          </h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-theme-text">
            Recent methods
          </h2>

          <button
            onClick={() => router.push("/add-money-via")}
            className="w-full bg-white border border-theme-border rounded p-2 flex items-center gap-4"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <div className="w-full h-full flex">
                <div className="w-1/3 bg-theme-primary-dark"></div>
                <div className="w-1/3 bg-white"></div>
                <div className="w-1/3 bg-theme-primary-dark"></div>
              </div>
            </div>
            <div className="flex-1 text-left">
              <div className="text-base font-medium text-theme-text">
                Nigeria
              </div>
              <div className="text-sm text-theme-text-secondary">NGN</div>
            </div>
            <div className="w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_black]">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-theme-text-muted"></div>
          <span className="text-sm text-theme-border">or</span>
          <div className="flex-1 h-px bg-theme-text-muted"></div>
        </div>

        <button 
          onClick={() => router.push("/add-money-via")}
          className="w-full bg-theme-primary text-white rounded border-2 border-theme-border-dark shadow-[4px_4px_0px_0px_black] py-3 px-4 flex items-center justify-center gap-2 font-bold text-base"
        >
          <Plus className="w-6 h-6" />
          Select new method
        </button>
        </div>

        <BottomNav activeTab="home" />
      </div>
    </div>
  );
}