"use client";

import { ChevronLeft, Info, Link, Share2, Home, Search, MessageCircle, HelpCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function RequestMoney() {
  const [step, setStep] = useState<"initial" | "loading" | "success">("initial");
  const [amount, setAmount] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [qrData, setQrData] = useState<string | null>(null);
  const balance = "₦348,269.00";

  const handleCreateRequest = () => {
    setStep("loading");
    // Simulate API call and generate QR data
    setTimeout(() => {
      const data = JSON.stringify({
        amount,
        comment,
        timestamp: new Date().toISOString()
      });
      setQrData(data);
      setStep("success");
    }, 1500);
  };

  const NavItem = ({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) => (
    <div className={`flex flex-col items-center gap-1 ${active ? "text-[#1B7339]" : "text-[#747474]"}`}>
      <Icon size={24} />
      <span className="text-xs">{label}</span>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto font-[Helvetica_Neue] text-[#222222] bg-[#FFFCEE] min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <button className="w-10 h-10 rounded-full border border-[#D9D9D9] flex items-center justify-center bg-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">Request</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 px-6 flex flex-col gap-6">
        {/* Banner */}
        <div className="w-full rounded-xl border-2 bg-white border-[#222222] p-5 flex items-start gap-4 ">
          <div className="w-12 h-12 bg-[#1B7339] rounded-full flex items-center justify-center flex-shrink-0">
            <Link color="white" size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-lg leading-tight">Request money from friends</h2>
            <p className="text-gray-600 text-sm">They don’t need an account to pay</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center overflow-hidden">
                  <Image src="/icons/telegram.svg" alt="T" width={32} height={32} />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center overflow-hidden">
                  <Image src="/icons/whatsapp.svg" alt="W" width={32} height={32} />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center overflow-hidden p-1.5">
                  <MessageCircle className="text-white" size={16} />
                </div>
              </div>
              <p className="text-[#1B7339] text-xs font-medium">Perfect for group chats!</p>
            </div>
          </div>
        </div>

        {/* QR Code Area */}
        <div className="w-full aspect-square bg-white rounded-3xl border-2 border-[#222222] p-8 flex items-center justify-center relative">
          {!qrData ? (
            <div className={`w-full h-full relative ${step === "loading" ? "blur-sm" : ""}`}>
              <Image src="/icons/qrcode.svg" alt="QR Code Placeholder" fill className="object-contain" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              <QRCodeCanvas
                value={qrData}
                size={256}
                level="H"
                includeMargin={false}
                style={{ width: "100%", height: "100%" }}
              />
              {step === "success" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-2 rounded-xl border-2 border-[#222222]">
                    <Image src="/icons/pizza.svg" alt="Logo" width={32} height={32} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Amount Input Section */}
        <div className="w-full bg-white rounded-xl border-2 border-[#222222] p-6  flex flex-col items-center gap-2">
          <div className="flex  items-center">
            {/* <span className="text-4xl font-bold mr-1"></span> */}
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-4xl text-center font-bold bg-transparent border-none outline-none w-full max-w-[200px]"
              placeholder="0.00"
            />
          </div>
          <p className="text-[#747474] font-medium text-xl">Balance: {balance}</p>
          <div className="flex items-center gap-2 bg-[#F5F5F5] px-3 py-1.5 rounded-full mt-2">
            <Info size={14} className="text-[#747474]" />
            <span className="text-[16px] text-[#747474]">Leave empty to let payers chose amounts.</span>
          </div>
        </div>

        {/* Comment Input */}
        <div className="w-full">
          <input
            type="text"
            placeholder={step === "success" ? "Send funds" : "Comment"}
            value={comment}
            onChange={(e) => {setComment(e.target.value)}}
            className="w-full bg-white border-2 border-[#222222] rounded-xl p-4 font-medium placeholder:text-[#747474] outline-none "
          />
        </div>
      </div>

      {/* Action Area */}
      <div className="p-6 flex flex-col gap-4 relative">
        {step === "success" && (
          <div className="absolute -top-4 right-6 bg-white border-2 border-[#222222] rounded-lg px-3 py-2 flex items-center gap-2  animate-bounce">
            <span className="text-xs font-bold whitespace-nowrap">Link created successfully</span>
          </div>
        )}

        <button
          onClick={handleCreateRequest}
          disabled={step === "loading"}
          className={`w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-2 border-2 border-[#222222]  transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
            ${step === "success" ? "bg-[#1B7339] text-white" : "bg-[#1B7339] text-white disabled:bg-[#E5E5E5] disabled:text-[#747474]"}`}
        >
          {step === "loading" ? (
            <Loader2 className="animate-spin" />
          ) : step === "success" ? (
            <>
              <Share2 size={24} />
              Share ₦{amount} request
            </>
          ) : (
            "Create Request"
          )}
        </button>

        {/* Bottom Nav */}
        <div className="flex justify-around items-center pt-4 border-t border-[#D9D9D9] mt-2">
          <NavItem icon={Home} label="Home" active={step !== "success"} />
          <div className="relative -top-8">
            <div className="w-16 h-16 bg-[#1B7339] rounded-2xl border-4 border-[#FFFCEE] flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1 p-1">
                <div className="w-2.5 h-2.5 border-2 border-white rounded-sm" />
                <div className="w-2.5 h-2.5 border-2 border-white rounded-sm" />
                <div className="w-2.5 h-2.5 border-2 border-white rounded-sm" />
                <div className="w-2.5 h-2.5 border-2 border-white rounded-sm" />
              </div>
            </div>
          </div>
          <NavItem icon={HelpCircle} label="Support" />
        </div>
      </div>
    </div>
  );
}
