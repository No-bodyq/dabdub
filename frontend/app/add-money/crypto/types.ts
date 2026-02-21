export type Network = "Ethereum" | "Solana" | "Polygon" | "Bitcoin";

export interface Token {
  id: string;
  symbol: string;
  name: string;
  network: Network;
  price: number;
  change24h: number;
  iconColor: string;
}
