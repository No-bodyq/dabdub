"use client";

import { Search, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Network = "Ethereum" | "Solana" | "Polygon" | "Bitcoin";

interface Token {
  id: string;
  symbol: string;
  name: string;
  network: Network;
  price: number;
  change24h: number;
  iconColor: string;
}

const NETWORKS: Network[] = ["Ethereum", "Solana", "Polygon", "Bitcoin"];

const MOCK_TOKENS: Token[] = [
  {
    id: "1",
    symbol: "ETH",
    name: "Ethereum",
    network: "Ethereum",
    price: 2250.45,
    change24h: 1.2,
    iconColor: "bg-blue-500",
  },
  {
    id: "2",
    symbol: "USDT",
    name: "Tether",
    network: "Ethereum",
    price: 1.0,
    change24h: 0.01,
    iconColor: "bg-green-500",
  },
  {
    id: "3",
    symbol: "USDC",
    name: "USD Coin",
    network: "Ethereum",
    price: 1.0,
    change24h: 0.0,
    iconColor: "bg-blue-400",
  },
  {
    id: "4",
    symbol: "SOL",
    name: "Solana",
    network: "Solana",
    price: 95.2,
    change24h: 4.5,
    iconColor: "bg-purple-500",
  },
  {
    id: "5",
    symbol: "MATIC",
    name: "Polygon",
    network: "Polygon",
    price: 0.78,
    change24h: -1.2,
    iconColor: "bg-purple-600",
  },
  {
    id: "6",
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    price: 42000.0,
    change24h: 0.8,
    iconColor: "bg-orange-500",
  },
  {
    id: "7",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    network: "Ethereum",
    price: 41950.0,
    change24h: 0.8,
    iconColor: "bg-gray-500",
  },
];

interface TokenSelectionStepProps {
  onSelect: (token: Token) => void;
}

export function TokenSelectionStep({ onSelect }: TokenSelectionStepProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("Ethereum");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = MOCK_TOKENS.filter(
    (token) =>
      token.network === selectedNetwork &&
      (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" />
        <input
          type="text"
          placeholder="Search tokens"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg pl-10 pr-4 py-3 text-sm text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:border-theme-primary"
        />
      </div>

      {/* Network Selector */}
      <div>
        <h3 className="text-sm font-medium text-theme-text-secondary mb-3">
          Network
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {NETWORKS.map((network) => (
            <button
              key={network}
              onClick={() => setSelectedNetwork(network)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                selectedNetwork === network
                  ? "bg-theme-primary text-white border-theme-primary"
                  : "bg-white text-theme-text border-theme-border hover:border-theme-text-muted",
              )}
            >
              {network}
            </button>
          ))}
        </div>
      </div>

      {/* Token List */}
      <div>
        <h3 className="text-sm font-medium text-theme-text-secondary mb-3">
          Tokens
        </h3>
        <div className="space-y-2">
          {filteredTokens.map((token) => (
            <button
              key={token.id}
              onClick={() => onSelect(token)}
              className="w-full bg-white border border-theme-border rounded-xl p-3 flex items-center gap-4 hover:border-theme-primary transition-colors"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs",
                  token.iconColor,
                )}
              >
                {token.symbol[0]}
              </div>
              <div className="flex-1 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-theme-text">
                    {token.symbol}
                  </span>
                  <span className="font-medium text-theme-text">
                    ${token.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs text-theme-text-secondary">
                    {token.name}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      token.change24h >= 0 ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {token.change24h >= 0 ? "+" : ""}
                    {token.change24h}%
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-theme-text-muted" />
            </button>
          ))}

          {filteredTokens.length === 0 && (
            <div className="text-center py-8 text-theme-text-secondary text-sm">
              No tokens found for {selectedNetwork}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
