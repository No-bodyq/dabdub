import { defineChain } from 'viem';
import { arbitrum, base, celo, optimism, polygon } from 'viem/chains';

export const SUPPORTED_CHAINS = {
  POLYGON: polygon,
  BASE: base,
  CELO: celo,
  ARBITRUM: arbitrum,
  OPTIMISM: optimism,
};

export const CHAIN_IDS = {
  POLYGON: polygon.id,
  BASE: base.id,
  CELO: celo.id,
  ARBITRUM: arbitrum.id,
  OPTIMISM: optimism.id,
};

export const CHAIN_ID_TO_NAME: Record<number, string> = {
  [polygon.id]: 'polygon',
  [base.id]: 'base',
  [celo.id]: 'celo',
  [arbitrum.id]: 'arbitrum',
  [optimism.id]: 'optimism',
};

// USDC Contract Addresses (Mainnet)
export const USDC_CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  [polygon.id]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC.e on Polygon (Check if native is needed)
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [celo.id]: '0xcebA9300c2e7838576d3338E46bC39088D1b48dD', // Check precise address
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [optimism.id]: '0x0b2C639c533813f4Aa9D7837CAf992c96bdB5a56',
};

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
] as const;

export const DEFAULT_RPC_URLS: Record<number, string[]> = {
  [polygon.id]: [process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'],
  [base.id]: [process.env.BASE_RPC_URL || 'https://mainnet.base.org'],
  [celo.id]: [process.env.CELO_RPC_URL || 'https://forno.celo.org'],
  [arbitrum.id]: [
    process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  ],
  [optimism.id]: [
    process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  ],
};
