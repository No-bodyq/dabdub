import { Home, Headphones, QrCode } from "lucide-react";

interface BottomNavProps {
  activeTab?: "home" | "scan" | "support";
}

export function BottomNav({ activeTab = "home" }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#FFFCEE] border-t border-[#A0A0A0]">
      <div className="flex items-end justify-between px-6 py-4 relative max-w-[390px] mx-auto">
        <button className={`flex flex-col items-center gap-2 ${activeTab === "home" ? "text-[#498F61]" : "text-[#747474]"}`}>
          <Home className="w-6 h-6" />
          <span className="text-sm">Home</span>
        </button>
        
        <div className="absolute left-1/2 -translate-x-1/2 -top-8">
          <button className="w-[92px] h-[92px] bg-[#1B7339] rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_black]">
            <QrCode className="w-10 h-10 text-white" />
          </button>
        </div>
        
        <button className={`flex flex-col items-center gap-2 ${activeTab === "support" ? "text-[#498F61]" : "text-[#747474]"}`}>
          <Headphones className="w-6 h-6" />
          <span className="text-sm">Support</span>
        </button>
      </div>
      <div className="h-[34px] flex items-center justify-center">
        <div className="w-[134px] h-[5px] bg-black rounded-full"></div>
      </div>
    </div>
  );
}
