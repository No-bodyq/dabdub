"use client";

import { Search, ChevronRightIcon } from "lucide-react";
import Image from "next/image";

interface Country {
  name: { common: string };
  flags: { svg: string };
  currencies: { [key: string]: { name: string; symbol: string } };
}

interface SelectMethodScreenProps {
  countries: Country[];
  loading: boolean;
  onSelectMethod: (method: string) => void;
}

export function SelectMethodScreen({
  countries,
  loading,
  onSelectMethod,
}: SelectMethodScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-8 custom-scrollbar pt-4 text-black">
      <div className="space-y-4">
        <h5 className="font-helvetica text-base font-bold text-theme-text">
          How would you like to withdraw?
        </h5>
        <div className="relative items-center flex">
          <Search className="absolute left-4 text-theme-text-muted size-5" />
          <input
            type="text"
            placeholder="Search country"
            className="placeholder:text-sm placeholder:font-medium placeholder:text-theme-text-muted w-full h-10 pl-12 pr-4 bg-white border border-theme-border rounded-[2px] font-helvetica text-base focus:outline-none focus:border-brand-green transition-all"
          />
        </div>
      </div>
      <div className="space-y-[9px]">
        <div
          onClick={() => onSelectMethod("crypto")}
          className="w-full h-[60px] rounded-[4px] p-2 flex items-center gap-4 bg-white border border-theme-border cursor-pointer hover:bg-black/5 transition-colors"
        >
          <div className="size-10 rounded-full flex items-center justify-center bg-app-yellow">
            <Image src="/icons/withdraw/wallet2.svg" alt="Wallet" width={18.75} height={16.5} />
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <h4 className="font-helvetica font-medium text-base text-theme-text">
              Crypto Deposit
            </h4>
            <p className="font-helvetica font-normal text-sm text-theme-text-secondary">
              Withdraw to a wallet or exchange
            </p>
          </div>
          <div className="size-[32px] p-2 rounded-full border border-deep-black shadow-hard bg-brand-green flex items-center justify-center">
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          countries.map((country) => (
            <div
              key={country.name.common}
              onClick={() => onSelectMethod(country.name.common)}
              className="w-full h-[60px] rounded-[4px] p-2 flex items-center gap-4 bg-white border border-theme-border cursor-pointer hover:bg-black/5 transition-colors"
            >
              <div className="size-[32px] rounded-full overflow-hidden border border-[#BFBFBF] shrink-0">
                <img
                  src={country.flags.svg}
                  alt={country.name.common}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between overflow-hidden">
                <h4 className="font-helvetica font-medium text-base text-theme-text truncate">
                  {country.name.common}
                </h4>
                <p className="font-helvetica font-normal text-sm text-theme-text-secondary">
                  {Object.keys(country.currencies || {})[0] || "N/A"}
                </p>
              </div>
              <div className="size-[32px] p-2 rounded-full border border-deep-black shadow-hard bg-brand-green flex items-center justify-center">
                <ChevronRightIcon className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
