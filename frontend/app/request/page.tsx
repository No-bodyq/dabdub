"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeftIcon, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RequestMoneyPage() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleGenerate = () => {
    if (!amount || status !== "idle") return;
    setStatus("loading");
    // Mocking a transaction/generation delay
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-cream-white text-black flex flex-col py-4 relative overflow-hidden">
      <header className="px-4 flex items-center justify-between mb-6 pt-4">
        <button className="p-2 border size-8 border-black rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-normal font-mochiy">Request</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 flex-1 flex flex-col gap-4 items-center">
        <div className="p-4 flex items-center gap-6 rounded-[4px] bg-white border border-black w-full">
          <div className="size-12 bg-brand-green rounded-full flex items-center justify-center">
            <Image
              src="/icons/request/LinkSimple.svg"
              alt="Link"
              width={16}
              height={16}
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-charcoal-dark font-helvetica">
              Request money from friends
            </h1>
            <p className="font-normal text-base text-slate-grey font-helvetica">
              They don’t need an account to pay
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-2">
                <div className="size-6 rounded-full border border-white overflow-hidden bg-white relative">
                  <Image
                    src="/icons/request/telegram.svg"
                    alt="Telegram"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="size-6 rounded-full border border-white overflow-hidden bg-white relative">
                  <Image
                    src="/icons/request/message.svg"
                    alt="Message"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="size-6 rounded-full border border-white overflow-hidden bg-white relative">
                  <Image
                    src="/icons/request/whatsapp.svg"
                    alt="WhatsApp"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <p className="font-normal text-sm text-muted-text font-helvetica">
                Perfect for group chats!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-[180px] h-[170.43px] overflow-hidden relative">
            <Image
              src="/icons/request/bar-code.svg"
              alt="Bar Code"
              fill
              className={`object-contain transition-all duration-500 ${status === "success" ? "blur-0" : "blur-[4px]"}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`size-10 bg-white rounded-full flex items-center justify-center relative transition-all duration-500 ${status === "loading" || status === "success" ? "blur-0" : "blur-[4px]"}`}>
                <Image
                  src="/icons/request/mini.svg"
                  alt="Mini Logo"
                  width={32}
                  height={36}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 px-3 flex flex-col items-center gap-2 rounded-[4px] bg-white border border-black w-full">
          <div className="flex items-center justify-center">
            <span
              className={`text-3xl font-normal transition-colors duration-200 mr-1 ${amount.length > 0 ? "text-deep-black" : "text-muted-text"}`}
            >
              ₦
            </span>
            <div className="relative inline-flex items-center min-w-[20px]">
              <span className="text-[32px] font-normal font-mochiy invisible whitespace-pre px-1">
                {amount || "0.00"}
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="absolute inset-0 w-full text-[32px] bg-transparent font-normal text-deep-black font-mochiy border-none outline-none placeholder:text-muted-text text-center px-1"
              />
            </div>
          </div>
          <p className="text-base font-normal text-muted-text font-helvetica">
            Balance: ₦348,269.00
          </p>
          <div className="flex items-center gap-2.5 rounded-[32px] px-2 py-1 bg-off-white">
            <div className="size-4 relative">
              <Image src="/icons/request/info.svg" alt="Info" fill />
            </div>
            <p className="font-helvetica">
              Leave empty to let payers chose amounts.
            </p>
          </div>
        </div>

        <div className="w-full">
          <input
            type="text"
            className="bg-white p-3 rounded-[4px] border border-slate-grey w-full placeholder:text-base placeholder:font-normal placeholder:text-deep-black"
            placeholder="comment"
          />
        </div>
        <div className="relative w-full">
          <Button
            onClick={handleGenerate}
            className={`w-full h-[47px] cursor-pointer disabled:cursor-not-allowed py-3  px-4 rounded-[2px] border border-deep-black font-bold text-base shadow-hard transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
              status === "loading"
                ? "bg-off-white hover:bg-off-white/95 text-muted-text border-slate-grey"
                : status === "success"
                  ? "bg-brand-green text-white hover:bg-brand-green/95"
                  : "bg-brand-green text-white hover:bg-brand-green/95"
            }`}
          >
            {status === "loading" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            {status === "success" && <Share2 className="w-5 h-5" />}
            {status === "idle" && "Generate Request"}
            {status === "loading" && "Generating..."}
            {status === "success" && `Share ₦${amount} request`}
          </Button>
          {status === "success" && (
            <div className="absolute bottom-[-44px] right-0 w-fit px-4 py-2 bg-white border-2 border-[#E8CB49] shadow-hard animate-in fade-in slide-in-from-top-2 duration-500 ease-out">
              <p className="text-base font-bold text-deep-black font-helvetica">
                Link created successfully
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="w-full h-[78px] px-6 py-4 border-t border-t-[#A0A0A0]  flex items-center justify-between mt-auto">
        <div className="space-y-2 flex flex-col items-center">
          <div className="size-6 relative">
            <Image src="/icons/request/home2.svg" alt="Home" fill />
          </div>
          <p className="text-sm text-brand-green font-normal font-helvetica">
            Home
          </p>
        </div>
        <div>
          <div className="size-[92px] p-8 -mt-8 bg-brand-green rounded-full flex items-center justify-center">
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
    </main>
  );
}
