export interface MiningUpgrade {
  id: string;
  name: string;
  type: 'gpu' | 'cooling' | 'power' | 'booster';
  level: number;
  maxLevel: number;
  baseCost: number;
  cost: number;
  costMultiplier: number;
  description: string;
  icon: string;
  
  // Stats impact
  multiplier: number; // For GPUs: hash rate boost in MH/s or multipliers. For Cooling: temp decrease. For Power: watts reduction.
  watts: number;      // Power drawn
  heat: number;       // Heat generated (deg C) per level / per second
}

export interface PayoutTransaction {
  id: string;
  amountCoin: number;
  amountUSD: number;
  address: string;
  status: 'pending' | 'processing' | 'confirmed';
  timestamp: number;
  txHash: string;
  fee: number;
  blockNumber: number;
  type?: 'cash' | 'crypto';
  crypto?: string;
}

export interface PriceDataPoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MarketNews {
  id: string;
  headline: string;
  impactType: 'bullish' | 'bearish' | 'neutral';
  impactPercent: number; // how much it shifts the price
  source: string;
  time: string;
}

export interface MiningStats {
  hashRate: number;      // in MH/s
  efficiency: number;    // MH/J (Watts ratio)
  powerDraw: number;     // total Watts consumed
  temperature: number;   // CPU/GPU Temperature in deg C
  thermalCap: number;    // limit before throttling (default 95C)
  throttled: boolean;   // if temperature is too high
}

export interface ActiveBooster {
  id: string;
  type: 'overclock' | 'cryo' | 'market';
  name: string;
  duration: number; // original duration in seconds
  remaining: number; // remaining duration in seconds
  multiplier: number;
}

export interface BoosterInventory {
  overclock: number;
  cryo: number;
  market: number;
  permanent: number;
}

export interface DailyRewardState {
  streak: number;
  lastClaimTime: number; // timestamp
  hasClaimedToday: boolean;
}

