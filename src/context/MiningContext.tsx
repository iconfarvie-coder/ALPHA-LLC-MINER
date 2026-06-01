import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MiningUpgrade, PayoutTransaction, PriceDataPoint, MarketNews, MiningStats, ActiveBooster, BoosterInventory, DailyRewardState, UserProfile, SimulatedBlock, UserTransaction } from '../types';
import { INITIAL_UPGRADES, NEWS_TEMPLATES } from '../data';

interface MiningContextType {
  coins: number;
  usd: number;
  lifetimeMined: number;
  upgrades: MiningUpgrade[];
  stats: MiningStats;
  marketPrice: number;
  payoutAddress: string;
  payouts: PayoutTransaction[];
  news: MarketNews[];
  activeNews: MarketNews | null;
  marketHistory: PriceDataPoint[];
  activeTab: 'mine' | 'upgrades' | 'market' | 'payouts' | 'emails' | 'explorer' | 'support';
  setActiveTab: (tab: 'mine' | 'upgrades' | 'market' | 'payouts' | 'emails' | 'explorer' | 'support') => void;
  mineClick: () => void;
  buyUpgrade: (id: string) => boolean;
  sellCoins: (amount: number) => void;
  sellAllCoins: () => void;
  requestPayout: (address: string, usdAmount: number, gateway?: 'paypal' | 'bank' | 'wallet', gatewayDetails?: string, holdForBatching?: boolean) => { success: boolean; message: string; tx?: PayoutTransaction };
  setPayoutAddress: (address: string) => void;
  resetProgress: () => void;
  batchPayouts: (txIds: string[]) => { success: boolean; message: string; tx?: PayoutTransaction };

  // Block explorer
  simulatedBlocks: SimulatedBlock[];


  // Multiple Cryptocurrencies Selection & Wallets
  activeCrypto: string;
  setActiveCrypto: (crypto: string) => void;
  balances: Record<string, number>;
  prices: Record<string, number>;
  requestCryptoTransfer: (crypto: string, address: string, cryptoAmount: number, holdForBatching?: boolean) => { success: boolean; message: string; tx?: PayoutTransaction };

  // One-tap Auto Mining Cluster Core & Gateway telemetry
  isClusterAutoMining: boolean;
  setIsClusterAutoMining: (val: boolean) => void;
  selectedCurrency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD';
  setSelectedCurrency: (curr: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD') => void;
  currencySymbols: Record<string, string>;
  currencyRates: Record<string, number>;
  formatVal: (usdAmount: number, decimals?: number) => string;
  liveGateways: Array<{ id: string; name: string; type: string; latency: number; status: 'connected' | 'syncing' | 'offline'; height: number }>;
  processedTxs: Array<{ id: string; amount: number; crypto: string; fee: number; timestamp: number; address: string; status: 'processed' | 'hashing' }>;

  // Daily login & Booster system additions
  dailyReward: DailyRewardState;
  claimDailyReward: () => { success: boolean; message: string; streak: number };
  simulateTimePass: (hours: number) => void;
  activeBoosters: ActiveBooster[];
  inventory: BoosterInventory;
  buyBoosterItem: (boosterType: 'overclock' | 'cryo' | 'market' | 'permanent') => { success: boolean; message: string };
  activateBoosterItem: (boosterType: 'overclock' | 'cryo' | 'market') => { success: boolean; message: string };
  notification: string | null;
  dismissNotification: () => void;

  // Real-Fake Secure One-Tap Account Authentication
  user: UserProfile | null;
  login: (provider: 'google' | 'apple' | 'phone', identifier: string, name?: string, uid?: string, rememberMe?: boolean) => void;
  logout: () => void;
  verifyPayout: (txId: string) => Promise<{ success: boolean; message: string }>;

  // Emergency actions
  emergencyShutdown: () => void;
  emergencyCooling: () => boolean;

  // Manual & Auto Action Transaction Registry
  userTransactions: UserTransaction[];
  logUserTransaction: (type: UserTransaction['type'], title: string, amount: string, recipient: string, status?: UserTransaction['status']) => UserTransaction;
}

const MiningContext = createContext<MiningContextType | undefined>(undefined);

export const useMining = () => {
  const context = useContext(MiningContext);
  if (!context) {
    throw new Error('useMining must be used within a MiningProvider');
  }
  return context;
};

export const MiningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Game Currencies & Settings ---
  const [activeCrypto, setActiveCryptoState] = useState<string>(() => {
    return localStorage.getItem('fast_miner_active_crypto') || 'BTC';
  });

  // --- One-tap Auto Mining Cluster Core ---
  const [isClusterAutoMining, setIsClusterAutoMiningState] = useState<boolean>(() => {
    return localStorage.getItem('fast_miner_cluster_auto') !== 'false'; // Default to true so it works out of the box
  });

  const setIsClusterAutoMining = (val: boolean) => {
    setIsClusterAutoMiningState(val);
    localStorage.setItem('fast_miner_cluster_auto', val ? 'true' : 'false');
    setNotification(val ? '⚡ Cloud Integration Established! All mining computing machines are synced and auto-mining at maximum efficiency' : '⚠️ Cluster Standby. Auto-mining machines decoupled from central clock.');
  };

  // --- Multi-Currency Display Settings ---
  const [selectedCurrency, setSelectedCurrencyState] = useState<'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD'>(() => {
    return (localStorage.getItem('fast_miner_selected_currency') as any) || 'USD';
  });

  const setSelectedCurrency = (curr: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD') => {
    setSelectedCurrencyState(curr);
    localStorage.setItem('fast_miner_selected_currency', curr);
  };

  const currencyRates: Record<string, number> = {
    USD: 1.0000,
    EUR: 0.9150,
    GBP: 0.7885,
    JPY: 155.65,
    AUD: 1.5080,
  };

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
  };

  // Utility to convert and format USD amounts to the active target display currency
  const formatVal = (usdAmount: number, decimals: number = 2): string => {
    const rate = currencyRates[selectedCurrency] || 1.0;
    const symbol = currencySymbols[selectedCurrency] || '$';
    const converted = usdAmount * rate;
    
    // Format appropriately
    if (selectedCurrency === 'JPY') {
      return `${symbol}${Math.round(converted).toLocaleString('en-US')}`;
    }
    return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  // --- Live Node Gateways and RPC Status List ---
  const [liveGateways, setLiveGateways] = useState<any[]>(() => [
    { id: 'btc_rpc', name: 'Bitcoin Node Core', type: 'BTC Core RPC v26', latency: 45, status: 'connected', height: 844201 },
    { id: 'eth_rpc', name: 'Ethereum L2 Arbitrum', type: 'Nitro Node v2.1', latency: 18, status: 'connected', height: 19894032 },
    { id: 'sol_rpc', name: 'Solana RPC Validator', type: 'Firedancer v0.1', latency: 12, status: 'connected', height: 265042180 },
    { id: 'doge_rpc', name: 'Dogecoin Core Daemon', type: 'Doge Core v1.14', latency: 68, status: 'connected', height: 5092044 },
    { id: 'hsc_rpc', name: 'HashSovereign Network', type: 'L1 FastMesh Hub', latency: 4, status: 'connected', height: 184520 },
  ]);

  // --- Real-time Processed Block Transactions ---
  const [processedTxs, setProcessedTxs] = useState<any[]>(() => {
    const now = Date.now();
    return [
      { id: 'tx_p_1', amount: 0.0052, crypto: 'BTC', fee: 0.0001, timestamp: now - 35000, address: 'bc1qp1w2t3_node', status: 'processed' },
      { id: 'tx_p_2', amount: 0.1240, crypto: 'ETH', fee: 0.0018, timestamp: now - 68000, address: '0x3841a1c9_arbitrum', status: 'processed' },
      { id: 'tx_p_3', amount: 4.8800, crypto: 'SOL', fee: 0.00005, timestamp: now - 120000, address: '8hN9bXp_helius', status: 'processed' }
    ];
  });

  const [balances, setBalances] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('fast_miner_balances');
    if (saved) return JSON.parse(saved);
    const oldCoins = localStorage.getItem('fast_miner_coins');
    return {
      HSC: oldCoins ? parseFloat(oldCoins) : 0,
      BTC: 0,
      ETH: 0,
      SOL: 0,
      DOGE: 0,
    };
  });

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('fast_miner_prices');
    if (saved) return JSON.parse(saved);
    return {
      HSC: 142.50,
      BTC: 96500.00,
      ETH: 3450.00,
      SOL: 185.00,
      DOGE: 0.38,
    };
  });

  const [marketHistories, setMarketHistories] = useState<Record<string, PriceDataPoint[]>>(() => {
    const saved = localStorage.getItem('fast_miner_market_histories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initialHistories: Record<string, PriceDataPoint[]> = {};
    const coinsKeys = ['BTC', 'HSC', 'ETH', 'SOL', 'DOGE'];
    const basePrices: Record<string, number> = { HSC: 142.50, BTC: 96500.00, ETH: 3450.00, SOL: 185.00, DOGE: 0.38 };
    
    coinsKeys.forEach(k => {
      const history: PriceDataPoint[] = [];
      let price = basePrices[k];
      const now = new Date();
      for (let i = 24; i >= 0; i--) {
        const pointTime = new Date(now.getTime() - i * 60 * 1000);
        const range = price * 0.03 + 0.01;
        const rand = Math.sin(i / 3) * range + (Math.random() - 0.5) * (range * 0.5);
        const open = price + rand;
        const close = price + rand + (Math.random() - 0.5) * (range * 0.2);
        const high = Math.max(open, close) + Math.random() * (range * 0.1);
        const low = Math.max(0.01, Math.min(open, close) - Math.random() * (range * 0.1));
        history.push({
          time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: Number(close.toFixed(k === 'DOGE' ? 4 : 2)),
          open: Number(open.toFixed(k === 'DOGE' ? 4 : 2)),
          high: Number(high.toFixed(k === 'DOGE' ? 4 : 2)),
          low: Number(low.toFixed(k === 'DOGE' ? 4 : 2)),
          close: Number(close.toFixed(k === 'DOGE' ? 4 : 2)),
        });
        price = close;
      }
      initialHistories[k] = history;
    });
    return initialHistories;
  });

  const [coins, setCoins] = useState<number>(() => {
    const savedBalances = localStorage.getItem('fast_miner_balances');
    const active = localStorage.getItem('fast_miner_active_crypto') || 'BTC';
    if (savedBalances) {
      try {
        const parsed = JSON.parse(savedBalances);
        return parsed[active] ?? 0;
      } catch (e) {}
    }
    const saved = localStorage.getItem('fast_miner_coins');
    return saved ? parseFloat(saved) : 0;
  });

  const [usd, setUsd] = useState<number>(() => {
    const saved = localStorage.getItem('fast_miner_usd');
    return saved ? parseFloat(saved) : 0;
  });

  // --- Real-Fake Secure One-Tap Account Authentication ---
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fast_miner_user') || sessionStorage.getItem('fast_miner_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const login = async (
    provider: 'google' | 'apple' | 'phone', 
    identifier: string, 
    name?: string, 
    uid?: string,
    rememberMe: boolean = true
  ) => {
    let formattedName = name || '';
    let email: string | undefined = undefined;
    let phone: string | undefined = undefined;
    
    if (provider === 'google') {
      email = identifier;
      if (!formattedName) {
        const localPart = identifier.split('@')[0];
        formattedName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
      }
    } else if (provider === 'apple') {
      email = identifier;
      formattedName = formattedName || 'Apple Member';
    } else {
      phone = identifier;
      formattedName = formattedName || 'User ' + identifier.slice(-4);
    }

    const newUser: UserProfile = {
      uid: uid || 'user_' + Math.random().toString(36).substring(2, 11),
      name: formattedName,
      email,
      phone,
      provider,
      verified: true,
      createdAt: Date.now(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formattedName)}`
    };

    setUser(newUser);
    localStorage.setItem('fast_miner_remember_me', rememberMe ? 'true' : 'false');
    localStorage.setItem('fast_miner_last_login_method', provider);
    if (email) {
      localStorage.setItem('fast_miner_last_login_email', email);
    }
    if (phone) {
      localStorage.setItem('fast_miner_last_login_phone', phone);
    }

    if (rememberMe) {
      localStorage.setItem('fast_miner_user', JSON.stringify(newUser));
      sessionStorage.removeItem('fast_miner_user');
    } else {
      sessionStorage.setItem('fast_miner_user', JSON.stringify(newUser));
      localStorage.removeItem('fast_miner_user');
    }
    
    // Also store active wallet address/paypal email if not set
    if (provider === 'google' && email) {
      localStorage.setItem('fast_miner_paypal_email', email);
    }

    setNotification(`🎉 Connected securely via ${provider.toUpperCase()}! Cloud synchronization completed.`);

    // If real Firebase Auth user, load from Firestore or create profile
    if (newUser.uid && !newUser.uid.startsWith('user_')) {
      try {
        const { getUserProfile, saveUserProfile, getPayoutTransactions } = await import('../firebaseSync');
        const dbProfile = await getUserProfile(newUser.uid);
        if (dbProfile) {
          if (dbProfile.coins !== undefined) setCoins(dbProfile.coins);
          if (dbProfile.usd !== undefined) setUsd(dbProfile.usd);
          if (dbProfile.lifetimeMined !== undefined) setLifetimeMined(dbProfile.lifetimeMined);
          
          const dbPayouts = await getPayoutTransactions(newUser.uid);
          if (dbPayouts && dbPayouts.length > 0) {
            setPayouts(dbPayouts);
            localStorage.setItem('fast_miner_payouts', JSON.stringify(dbPayouts));
          }
          setNotification(`🎉 Sync Success: Securely loaded historical stats from your Cloud Profile Ledger.`);
        } else {
          // Initialize user profile document in Firestore
          await saveUserProfile(newUser.uid, newUser, coins, usd, lifetimeMined);
          setNotification(`🎉 Sync Success: Provisioned a secure node profile on the Cloud Ledger.`);
        }
      } catch (err: any) {
        console.error('Error synchronizing with Firestore database state on login:', err);
      }
    }
  };

  const logout = async () => {
    try {
      const { logoutProvider } = await import('../firebase');
      await logoutProvider();
    } catch(e) {
      console.error('Firebase Auth logout error', e);
    }
    setUser(null);
    localStorage.removeItem('fast_miner_user');
    sessionStorage.removeItem('fast_miner_user');
    localStorage.removeItem('fast_miner_remember_me');
    setNotification("Successfully signed out. Local device session active.");
  };

  const [lifetimeMined, setLifetimeMined] = useState<number>(() => {
    const saved = localStorage.getItem('fast_miner_lifetime');
    return saved ? parseFloat(saved) : 0;
  });
  
  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'mine' | 'upgrades' | 'market' | 'payouts' | 'emails' | 'explorer' | 'support'>('mine');

  // --- Simulated Blockchain Blocks ---
  const [simulatedBlocks, setSimulatedBlocks] = useState<SimulatedBlock[]>(() => {
    const saved = localStorage.getItem('fast_miner_simulated_blocks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    const initialHistory: SimulatedBlock[] = [];
    const cryptos = ['HSC', 'BTC', 'ETH', 'SOL', 'DOGE'];
    const miners = [
      'bc1q5x92j6_Bitmain_S21',
      '0x5a20d...91c1_HiveOS_3',
      'Firedancer_Validator_Node_4',
      'Antpool_Consensus_Unit_9',
      'DogePool_Asic_Cluster_0',
      'SoloMiner_RaspberryPi_v5',
      'Sovereign_L1_Mesh_Peer_77',
      'Genesis_Decentral_Peer_15',
      'bc1qp1w2t3_node',
      '0x3841a1c9_arbitrum',
      '8hN9bXp_helius',
    ];

    const baseHeights: Record<string, number> = {
      HSC: 184520,
      BTC: 844201,
      ETH: 19894032,
      SOL: 265042180,
      DOGE: 5092044
    };

    const difficulties: Record<string, string> = {
      HSC: '8.52 G',
      BTC: '78.43 T',
      ETH: '12.50 P',
      SOL: '44.82 M',
      DOGE: '11.85 M'
    };

    const rewards: Record<string, number> = {
      HSC: 100,
      BTC: 3.125,
      ETH: 2.0,
      SOL: 1.5,
      DOGE: 10000
    };

    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      const height = baseHeights[crypto] - (i * 2 + Math.floor(Math.random() * 3));
      const rId = Math.floor(100000 + Math.random() * 900000);
      const hashStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      initialHistory.push({
        id: `block_${now - i * 45000}_${rId}`,
        height,
        crypto,
        difficulty: difficulties[crypto],
        miner: miners[Math.floor(Math.random() * miners.length)],
        reward: rewards[crypto],
        timestamp: now - i * 45000 - Math.floor(Math.random() * 5000),
        hash: '00000000' + hashStr.substring(0, 56)
      });
    }
    return initialHistory;
  });

  // Save blocks to localStorage when modified
  useEffect(() => {
    localStorage.setItem('fast_miner_simulated_blocks', JSON.stringify(simulatedBlocks));
  }, [simulatedBlocks]);


  // --- Upgrades State ---
  const [upgrades, setUpgrades] = useState<MiningUpgrade[]>(() => {
    const saved = localStorage.getItem('fast_miner_upgrades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map and ensure all items from INITIAL_UPGRADES are represented
        return INITIAL_UPGRADES.map(initUpg => {
          const matched = parsed.find((p: any) => p.id === initUpg.id);
          return matched ? { ...initUpg, ...matched } : initUpg;
        });
      } catch (e) {
        return INITIAL_UPGRADES;
      }
    }
    return INITIAL_UPGRADES;
  });

  // Derived properties for current currency choice
  const marketPrice = prices[activeCrypto] || 142.50;
  const marketHistory = marketHistories[activeCrypto] || [];

  const setActiveCrypto = (targetCrypto: string) => {
    setBalances(prev => {
      const updated = { ...prev, [activeCrypto]: coins };
      localStorage.setItem('fast_miner_balances', JSON.stringify(updated));
      return updated;
    });
    
    const savedBalances = localStorage.getItem('fast_miner_balances');
    let nextCoins = 0;
    if (savedBalances) {
      try {
        nextCoins = JSON.parse(savedBalances)[targetCrypto] ?? 0;
      } catch (e) {}
    } else {
      nextCoins = balances[targetCrypto] ?? 0;
    }
    
    setCoins(nextCoins);
    setActiveCryptoState(targetCrypto);
    localStorage.setItem('fast_miner_active_crypto', targetCrypto);
  };

  useEffect(() => {
    setBalances(prev => {
      if (prev[activeCrypto] !== coins) {
        const updated = { ...prev, [activeCrypto]: coins };
        localStorage.setItem('fast_miner_balances', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [coins, activeCrypto]);

  // --- News Feed ---
  const [news, setNews] = useState<MarketNews[]>(() => {
    return NEWS_TEMPLATES.slice(0, 4);
  });
  const [activeNews, setActiveNews] = useState<MarketNews | null>(null);

  // --- Payout Setup ---
  const [payoutAddress, setPayoutAddressState] = useState<string>(() => {
    const saved = localStorage.getItem('fast_miner_payout_addr');
    if (saved) return saved;
    // Generate a beautiful mock BCH/BTC wallet address on first load
    const hex = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = 'bc1qp';
    for (let i = 0; i < 28; i++) {
      addr += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return addr;
  });

  const setPayoutAddress = (address: string) => {
    setPayoutAddressState(address);
    localStorage.setItem('fast_miner_payout_addr', address);
  };

  const [payouts, setPayouts] = useState<PayoutTransaction[]>(() => {
    const saved = localStorage.getItem('fast_miner_payouts');
    return saved ? JSON.parse(saved) : [];
  });

  // --- User Activities & Custom Transaction ID Registry ---
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>(() => {
    const saved = localStorage.getItem('fast_miner_user_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const now = Date.now();
    return [
      {
        id: `tx-genesis-${Math.floor(1000 * Math.random())}`,
        type: 'CUSTOM_GENERATED' as const,
        title: 'ALPHA LLC MINER Node Operational',
        amount: '0.00 HSC',
        recipient: 'Mainnet Consensus Layer',
        timestamp: now - 3600000 * 2,
        status: 'VERIFIED' as const,
        blockchainHash: '0x00000000ALPHA_LLC_MINER_CREDENTIALS_VALIDATED'
      },
      {
        id: `tx-genesis-${Math.floor(1000 * Math.random() + 1000)}`,
        type: 'UPGRADE_BUY' as const,
        title: 'L1 Interface Sync Handshake Bootstrap',
        amount: '$0.00 USD',
        recipient: 'Multi-Protocol Relay Network',
        timestamp: now - 3600000,
        status: 'VERIFIED' as const,
        blockchainHash: '0x0000000078D1C90AA620EEF27C3841A1C9A174F8B33332D'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('fast_miner_user_transactions', JSON.stringify(userTransactions));
  }, [userTransactions]);

  const logUserTransaction = (
    type: UserTransaction['type'],
    title: string,
    amount: string,
    recipient: string,
    status: UserTransaction['status'] = 'CONFIRMED'
  ): UserTransaction => {
    const characters = '0123456789ABCDEF';
    let blockchainHash = '0x';
    for (let i = 0; i < 40; i++) {
      blockchainHash += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const newTx: UserTransaction = {
      id: `tx-user-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      title,
      amount,
      recipient,
      timestamp: Date.now(),
      status,
      blockchainHash
    };

    setUserTransactions(prev => [newTx, ...prev]);
    return newTx;
  };


  // --- Daily Login & Gameplay Boosters States ---
  const [simulatedOffset, setSimulatedOffset] = useState<number>(() => {
    const saved = localStorage.getItem('fast_miner_simulated_offset');
    return saved ? parseInt(saved) : 0;
  });

  const [dailyReward, setDailyReward] = useState<DailyRewardState>(() => {
    const saved = localStorage.getItem('fast_miner_daily_reward');
    if (saved) return JSON.parse(saved);
    return {
      streak: 0,
      lastClaimTime: 0,
      hasClaimedToday: false
    };
  });

  const [activeBoosters, setActiveBoosters] = useState<ActiveBooster[]>(() => {
    const saved = localStorage.getItem('fast_miner_active_boosters');
    return saved ? JSON.parse(saved) : [];
  });

  const [inventory, setInventory] = useState<BoosterInventory>(() => {
    const saved = localStorage.getItem('fast_miner_booster_inventory');
    if (saved) return JSON.parse(saved);
    return {
      overclock: 0,
      cryo: 0,
      market: 0,
      permanent: 0
    };
  });

  const [notification, setNotification] = useState<string | null>(null);

  const dismissNotification = () => setNotification(null);

  const getPerceivedTime = () => {
    return Date.now() + simulatedOffset * 1000;
  };

  const getPerceivedDateString = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const checkDailyStatus = (lastClaim: number, offset: number) => {
    const now = Date.now() + offset * 1000;
    if (lastClaim === 0) {
      return { claimedToday: false, shouldResetStreak: false };
    }
    
    const nowStr = getPerceivedDateString(now);
    const lastStr = getPerceivedDateString(lastClaim);
    
    if (nowStr === lastStr) {
      return { claimedToday: true, shouldResetStreak: false };
    }
    
    const diffHours = (now - lastClaim) / (1000 * 3600);
    if (diffHours >= 48) {
      return { claimedToday: false, shouldResetStreak: true };
    }
    
    return { claimedToday: false, shouldResetStreak: false };
  };

  // Synchronize hasClaimedToday and streaks dynamically
  useEffect(() => {
    const status = checkDailyStatus(dailyReward.lastClaimTime, simulatedOffset);
    setDailyReward(prev => {
      let nextStreak = prev.streak;
      if (status.shouldResetStreak && prev.streak > 0) {
        nextStreak = 0;
      }
      
      const nextClaimed = status.claimedToday;
      if (nextClaimed !== prev.hasClaimedToday || nextStreak !== prev.streak) {
        const updated = {
          streak: nextStreak,
          lastClaimTime: prev.lastClaimTime,
          hasClaimedToday: nextClaimed
        };
        localStorage.setItem('fast_miner_daily_reward', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [simulatedOffset, dailyReward.lastClaimTime]);

  const claimDailyReward = () => {
    const now = getPerceivedTime();
    const status = checkDailyStatus(dailyReward.lastClaimTime, simulatedOffset);
    
    if (status.claimedToday) {
      return { success: false, message: 'Daily reward already claimed for today.', streak: dailyReward.streak };
    }
    
    const nextStreak = status.shouldResetStreak ? 1 : (dailyReward.streak % 7) + 1;
    let rewardMsg = '';
    
    if (nextStreak === 1) {
      setCoins(c => c + 0.05);
      rewardMsg = '0.05 free HSC token!';
    } else if (nextStreak === 2) {
      setCoins(c => c + 0.10);
      setUsd(u => u + 2.00);
      rewardMsg = '0.10 free HSC token and $2.00 USD cash!';
    } else if (nextStreak === 3) {
      setInventory(inv => ({ ...inv, overclock: inv.overclock + 1 }));
      rewardMsg = '1x free Overclock Serum pack!';
    } else if (nextStreak === 4) {
      setCoins(c => c + 0.20);
      setUsd(u => u + 5.00);
      rewardMsg = '0.20 free HSC token and $5.00 USD cash!';
    } else if (nextStreak === 5) {
      setInventory(inv => ({ ...inv, cryo: inv.cryo + 1 }));
      rewardMsg = '1x free Cryo-Freeze Capsule!';
    } else if (nextStreak === 6) {
      setCoins(c => c + 0.50);
      setUsd(u => u + 10.00);
      setInventory(inv => ({ ...inv, market: inv.market + 1 }));
      rewardMsg = '0.50 free HSC token, $10.00 USD cash, and 1x free Bullish News Spray!';
    } else if (nextStreak === 7) {
      // Megabonus
      setCoins(c => c + 1.00);
      setUsd(u => u + 25.0);
      setInventory(inv => ({ ...inv, permanent: inv.permanent + 1 }));
      rewardMsg = 'MEGA WEEK CLEAR: 1.00 free HSC token, $25.00 USD cash, and 1x Permanent Silicon Core Purity boost (+10% permanent hashrate)!';
    }
    
    const updated = {
      streak: nextStreak,
      lastClaimTime: now,
      hasClaimedToday: true
    };
    
    setDailyReward(updated);
    localStorage.setItem('fast_miner_daily_reward', JSON.stringify(updated));
    setNotification(`Day ${nextStreak} Login Claimed: You got ${rewardMsg}`);
    
    return { success: true, message: `Day ${nextStreak} reward claimed!`, streak: nextStreak };
  };

  const simulateTimePass = (hours: number) => {
    setSimulatedOffset(curr => {
      const next = curr + hours * 3600;
      localStorage.setItem('fast_miner_simulated_offset', next.toString());
      return next;
    });
    setNotification(`Simulation: Jumped ${hours} hours forward in time!`);
  };

  const buyBoosterItem = (boosterType: 'overclock' | 'cryo' | 'market' | 'permanent') => {
    let cost = 0;
    if (boosterType === 'overclock') cost = 0.15;
    else if (boosterType === 'cryo') cost = 0.25;
    else if (boosterType === 'market') cost = 0.40;
    else if (boosterType === 'permanent') cost = 5.0;
    
    if (coins >= cost) {
      setCoins(c => c - cost);
      setInventory(inv => {
        const key = boosterType === 'permanent' ? 'permanent' : boosterType;
        const updated = {
          ...inv,
          [key]: inv[key] + 1
        };
        localStorage.setItem('fast_miner_booster_inventory', JSON.stringify(updated));
        return updated;
      });
      setNotification(`Item Purchased: Unlocked 1x ${boosterType === 'permanent' ? 'Silicon Core Purity (Permanent Boost)' : boosterType === 'overclock' ? 'Overclock Serum' : boosterType === 'cryo' ? 'Cryo-Freeze Capsule' : 'Bullish News Spray'} in inventory!`);
      return { success: true, message: 'Booster purchased!' };
    } else {
      return { success: false, message: `Insufficient HSC. Requires ${cost} HSC but you have ${coins.toFixed(4)} HSC.` };
    }
  };

  const activateBoosterItem = (boosterType: 'overclock' | 'cryo' | 'market') => {
    if (inventory[boosterType] > 0) {
      setInventory(inv => {
        const updated = {
          ...inv,
          [boosterType]: inv[boosterType] - 1
        };
        localStorage.setItem('fast_miner_booster_inventory', JSON.stringify(updated));
        return updated;
      });
      
      const newBooster: ActiveBooster = {
        id: `booster_${Date.now()}`,
        type: boosterType,
        name: boosterType === 'overclock' ? 'Overclock Serum' : boosterType === 'cryo' ? 'Cryo-Freeze Capsule' : 'Bullish News Spray',
        duration: 60,
        remaining: 60,
        multiplier: boosterType === 'overclock' ? 1.5 : boosterType === 'cryo' ? 0.3 : 1.25
      };
      
      setActiveBoosters(prev => [...prev, newBooster]);
      setNotification(`Active Boost: ${newBooster.name} successfully activated for 60 seconds!`);
      return { success: true, message: 'Booster activated!' };
    } else {
      return { success: false, message: 'Booster is unavailable in inventory.' };
    }
  };

  // Clean booster interval countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBoosters(prev => {
        if (prev.length === 0) return prev;
        const next = prev.map(b => ({ ...b, remaining: b.remaining - 1 })).filter(b => b.remaining > 0);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save additional variables to localStorage on updates
  useEffect(() => {
    localStorage.setItem('fast_miner_active_boosters', JSON.stringify(activeBoosters));
    localStorage.setItem('fast_miner_booster_inventory', JSON.stringify(inventory));
    localStorage.setItem('fast_miner_daily_reward', JSON.stringify(dailyReward));
  }, [activeBoosters, inventory, dailyReward]);

  // --- Physics and Telemetry Stats ---
  const [stats, setStats] = useState<MiningStats>({
    hashRate: 0,
    efficiency: 0,
    powerDraw: 0,
    temperature: 32.0, // starting at ambient temp
    thermalCap: 95.0,
    throttled: false,
  });

  // Store temperatures in ref for fast tick references
  const tempRef = useRef<number>(32.0);
  const isThrottledRef = useRef<boolean>(false);

  // Create a ref containing all state objects that are accessed inside the ticker intervals
  const miningStateRef = useRef({
    upgrades,
    activeBoosters,
    inventory,
    isClusterAutoMining,
    prices,
    activeCrypto,
    coins,
    usd,
    lifetimeMined,
    user,
  });

  // Keep the ref updated on every render
  useEffect(() => {
    miningStateRef.current = {
      upgrades,
      activeBoosters,
      inventory,
      isClusterAutoMining,
      prices,
      activeCrypto,
      coins,
      usd,
      lifetimeMined,
      user,
    };
  }, [upgrades, activeBoosters, inventory, isClusterAutoMining, prices, activeCrypto, coins, usd, lifetimeMined, user]);

  // Auto-save fast-changing variables periodically (every 3 seconds) to prevent heavy main thread blocking
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const current = miningStateRef.current;
      localStorage.setItem('fast_miner_coins', current.coins.toString());
      localStorage.setItem('fast_miner_usd', current.usd.toString());
      localStorage.setItem('fast_miner_lifetime', current.lifetimeMined.toString());
    }, 3000);

    // Also save on window beforeunload
    const handleUnload = () => {
      const current = miningStateRef.current;
      localStorage.setItem('fast_miner_coins', current.coins.toString());
      localStorage.setItem('fast_miner_usd', current.usd.toString());
      localStorage.setItem('fast_miner_lifetime', current.lifetimeMined.toString());
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Save rarely changing states immediately when they actually update
  useEffect(() => {
    localStorage.setItem('fast_miner_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('fast_miner_payouts', JSON.stringify(payouts));
  }, [payouts]);

  // Calculate dynamic outputs whenever upgrades state shifts
  const calculateRigMetrics = () => {
    const { upgrades: curUpgrades, activeBoosters: curBoosters, inventory: curInventory, isClusterAutoMining: curCluster } = miningStateRef.current;
    let totalHash = 0;
    let basePower = 0;
    let totalHeatGen = 0;
    
    // Upgraded devices
    const gpus = curUpgrades.filter(u => u.type === 'gpu');
    const coolings = curUpgrades.filter(u => u.type === 'cooling');
    const powers = curUpgrades.filter(u => u.type === 'power');
    const boosters = curUpgrades.filter(u => u.type === 'booster');

    // 1. Calculate base hash from GPUs
    gpus.forEach(gpu => {
      totalHash += gpu.multiplier * gpu.level;
      basePower += gpu.watts * gpu.level;
      totalHeatGen += gpu.heat * gpu.level;
    });

    // Adjust with active gameplay boosters (e.g. Overclock Serum adds +50% hashrate each)
    const activeOverclocks = curBoosters.filter(b => b.type === 'overclock').length;
    const overclockMult = 1.0 + activeOverclocks * 0.50;
    totalHash *= overclockMult;

    // Apply permanent increases from Silicon Core Purity (+10% hashrate per level)
    const permanentMult = 1.0 + (curInventory.permanent * 0.10);
    totalHash *= permanentMult;

    // Cryo-Freeze Capsule reduces total heat generation to 30% per active capsule
    const activeCryos = curBoosters.filter(b => b.type === 'cryo').length;
    if (activeCryos > 0) {
      totalHeatGen *= Math.pow(0.30, activeCryos);
    }

    // 2. Adjust with overvolt booster
    const overvolt = boosters.find(b => b.id === 'boost_overvolt');
    if (overvolt && overvolt.level > 0) {
      // Each level grants +40% hashrate and generates additional heat/wattage
      const hashPercent = 1 + overvolt.level * 0.40;
      totalHash *= hashPercent;
      
      const powerMultiplier = 1 + overvolt.level * 0.30;
      basePower *= powerMultiplier;

      totalHeatGen += overvolt.heat * overvolt.level * (gpuCount() || 1);
    }

    // 3. Subtract with power optimizers
    let powerReductionFactor = 1.0;
    powers.forEach(p => {
      if (p.level > 0) {
        // e.g. solar saves 8% per level -> reduces by (1 - 0.08 * level)
        powerReductionFactor *= (1 - p.multiplier * p.level);
      }
    });
    const finalPowerDraw = Math.max(10, Math.round(basePower * powerReductionFactor));

    // 4. Calculate cooling power
    let coolingPower = 1.2; // base cooling
    coolings.forEach(cool => {
      if (cool.level > 0) {
        // Multiplier stores cooling capacity like -4.5 per second
        coolingPower += Math.abs(cool.multiplier) * cool.level;
      }
    });

    // Apply Master Auto Mining Cluster Sync (Synchronous 1.5x speed boost to all owned machines and +35.0 MH/s cloud mining slot injection)
    if (curCluster) {
      totalHash = totalHash * 1.5 + 35.0;
    }

    // 5. Total efficiency Hash Rate per Watt
    const finalEfficiency = finalPowerDraw > 0 ? (totalHash / finalPowerDraw) * 1000 : 0; // standard scale

    return {
      hashrate: totalHash,
      powerDraw: curCluster ? Math.max(12, Math.round(finalPowerDraw * 0.7)) : finalPowerDraw, // Master cluster sync improves energy savings by 30%
      heatGenerated: curCluster ? totalHeatGen * 0.8 : totalHeatGen, // Sync keeps thermals 20% cooler
      coolingPower,
      efficiency: finalEfficiency
    };
  };

  const gpuCount = () => {
    return miningStateRef.current.upgrades.filter(u => u.type === 'gpu').reduce((acc, current) => acc + current.level, 0);
  };

  // Keep a loop running to simulate active mining increments in 100ms ticks!
  // Fast mining is responsive with a 100ms interval
  useEffect(() => {
    const mineInterval = setInterval(() => {
      const { upgrades: curUpgrades, prices: curPrices, activeCrypto: curCrypto } = miningStateRef.current;
      const { hashrate, powerDraw, heatGenerated, coolingPower, efficiency } = calculateRigMetrics();

      // 1. Temperature simulator logic
      // Target temperature corresponds to the heat equilibrium:
      // ambient temperature is 24°C, target is higher with power/heat generation and lower with cooling
      const calculatedAmbient = 24.0;
      const heatFactor = heatGenerated > 0 ? (heatGenerated / coolingPower) * 6.5 : 0;
      const targetTemperature = calculatedAmbient + heatFactor;

      // Adjust current temperature gradually towards the target
      let currentTemp = tempRef.current;
      const delta = targetTemperature - currentTemp;
      
      if (Math.abs(delta) > 0.1) {
        currentTemp += delta * 0.08; // smooth step transition per second
      } else {
        currentTemp = targetTemperature;
      }

      // Safeguard boundaries
      currentTemp = Math.max(calculatedAmbient, Math.min(120.0, currentTemp));
      tempRef.current = currentTemp;

      // Check thermal throttling thresholds
      if (currentTemp >= stats.thermalCap && !isThrottledRef.current) {
        isThrottledRef.current = true;
      } else if (currentTemp < 78.0 && isThrottledRef.current) {
        // Must cool down below 78 to resume normal rates
        isThrottledRef.current = false;
      }

      // 2. Compute true final hashrate
      // If throttled, rig operates at only 8% capacity to prevent thermal nuclear meltdown!
      const activeMultiplier = isThrottledRef.current ? 0.08 : 1.0;
      const actualHashrate = hashrate * activeMultiplier;

      // Save stats to state
      setStats({
        hashRate: actualHashrate,
        efficiency,
        powerDraw: isThrottledRef.current ? Math.round(powerDraw * 0.2) : powerDraw,
        temperature: Number(currentTemp.toFixed(1)),
        thermalCap: 95.0,
        throttled: isThrottledRef.current,
      });

      // 3. Accumulate Passive cryptocurrency income!
      if (actualHashrate > 0) {
        const hscEarningsPerSec = actualHashrate * 0.008;
        // Scale earnings proportionally: base coin standard price ($142.50) divided by active crypto price
        const hscBasePrice = 142.50;
        const currentActivePrice = curPrices[curCrypto] || hscBasePrice;
        const scaledEarningsPerSec = (hscEarningsPerSec * hscBasePrice) / currentActivePrice;
        const tickEarnings = scaledEarningsPerSec * 0.1; // 100ms tick
        
        setCoins(c => c + tickEarnings);
        setLifetimeMined(lm => lm + tickEarnings);
 
         // Rare block share drop: 0.015% chance per 100ms tick (~10% chance every minute of active auto-mining)
         if (Math.random() < 0.00015) {
           const rewardTypes: ('overclock' | 'cryo' | 'market')[] = ['overclock', 'cryo', 'market'];
           const chosen = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
           setInventory(inv => {
             const nextInv = { ...inv, [chosen]: inv[chosen] + 1 };
             localStorage.setItem('fast_miner_booster_inventory', JSON.stringify(nextInv));
             return nextInv;
           });
           const itemLabel = chosen === 'overclock' ? 'Overclock Serum' : chosen === 'cryo' ? 'Cryo-Freeze Capsule' : 'Bullish News Spray';
           setNotification(`Gameplay Loot Drop! Your auto-mining rig found 1x free ${itemLabel} in a solved block!`);
         }
       }
 
       // 4. Simulate Auto-Clicker booster
       const autoclick = curUpgrades.find(b => b.id === 'boost_autoclick');
       if (autoclick && autoclick.level > 0) {
         // multiplier stores passive click assistance speed
         const baseClickRevenue = 0.001; // starting cash flow
         const manualBooster = curUpgrades.find(b => b.id === 'boost_manual');
         const clickScaler = 1 + (manualBooster ? manualBooster.level * manualBooster.multiplier : 0);
         
         const clickRevenues = baseClickRevenue * clickScaler * autoclick.level * autoclick.multiplier * 0.1;
         
         const hscBasePrice = 142.50;
         const currentActivePrice = curPrices[curCrypto] || hscBasePrice;
         const scaledClickRevenues = (clickRevenues * hscBasePrice) / currentActivePrice;
         
         setCoins(c => c + scaledClickRevenues);
         setLifetimeMined(lm => lm + scaledClickRevenues);
       }
 
     }, 100);
 
     return () => clearInterval(mineInterval);
   }, []);

  // Simulates live blockchain transaction processing on the connected L1/2 gateways
  useEffect(() => {
    const txTimer = setInterval(() => {
      const { activeCrypto: curCrypto, isClusterAutoMining: curCluster, prices: curPrices } = miningStateRef.current;
      const cryptos = ['BTC', 'HSC', 'ETH', 'SOL', 'DOGE'];
      const randomCrypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      
      const addresses = {
        HSC: '0xSovereign_Gateway_Node_',
        BTC: '1Bitcoin_Daemon_Peer_',
        ETH: '0xEthereum_Arbitrum_L2_',
        SOL: 'Solana_Validator_Web3_',
        DOGE: 'DogeCore_Mempool_Peer_',
      } as Record<string, string>;

      const randomAddr = (addresses[randomCrypto] || '0xAddr_') + Math.floor(1000 + Math.random() * 9000);
      const amountSeed = {
        HSC: 1.5 + Math.random() * 25.0,
        BTC: 0.00015 + Math.random() * 0.0008,
        ETH: 0.005 + Math.random() * 0.045,
        SOL: 0.05 + Math.random() * 0.45,
        DOGE: 12.0 + Math.random() * 50.0,
      }[randomCrypto] || 1.0;

      const feeRate = 0.015; // 1.5% validation commission
      const grossAmount = amountSeed;
      const fee = grossAmount * feeRate;

      // Update node gateway height state and record the updated height to generate a solved block
      let resolvedHeight = 0;
      setLiveGateways(prev => prev.map(gw => {
        const increment = Math.floor(Math.random() * 3) + 1;
        const isMatch = (gw.id === 'btc_rpc' && randomCrypto === 'BTC') ||
                        (gw.id === 'eth_rpc' && randomCrypto === 'ETH') ||
                        (gw.id === 'sol_rpc' && randomCrypto === 'SOL') ||
                        (gw.id === 'doge_rpc' && randomCrypto === 'DOGE') ||
                        (gw.id === 'hsc_rpc' && randomCrypto === 'HSC');
        const finalHeight = isMatch ? gw.height + increment : gw.height + (Math.random() > 0.85 ? 1 : 0);
        if (isMatch) {
          resolvedHeight = finalHeight;
        }
        return {
          ...gw,
          height: finalHeight,
          latency: Math.max(2, gw.latency + Math.floor((Math.random() - 0.5) * 8)),
        };
      }));

      // Create simulated block solved across the network
      if (resolvedHeight > 0) {
        setSimulatedBlocks(prev => {
          const minersList = [
            'bc1q5x92j6_Bitmain_S21',
            '0x5a20d...91c1_HiveOS_3',
            'Firedancer_Validator_Node_4',
            'Antpool_Consensus_Unit_9',
            'DogePool_Asic_Cluster_0',
            'SoloMiner_RaspberryPi_v5',
            'Sovereign_L1_Mesh_Peer_77',
            'Genesis_Decentral_Peer_15',
            'bc1qp1w2t3_node',
            '0x3841a1c9_arbitrum',
            '8hN9bXp_helius',
          ];

          let minerName = minersList[Math.floor(Math.random() * minersList.length)];
          const hasHashrate = miningStateRef.current.stats?.hashRate > 0;
          if (hasHashrate && Math.random() < 0.15) {
            const userName = miningStateRef.current.user?.name || 'Local Cluster Rig';
            minerName = `✨ ${userName} (Your Node #${Math.floor(1 + Math.random() * 3)})`;
            
            // Sweet active bonus reward for solving blocks!
            const bonusMap: Record<string, number> = {
              HSC: 1.5,
              BTC: 0.00005,
              ETH: 0.001,
              SOL: 0.02,
              DOGE: 10
            };
            const rewardAmt = bonusMap[randomCrypto] || 1.0;
            const hscBasePrice = 142.50;
            const rewardCryptoPrice = curPrices[randomCrypto] || 1.0;
            const activeCryptoPrice = curPrices[curCrypto] || hscBasePrice;
            const finalCashValueInUSD = rewardAmt * rewardCryptoPrice;
            const finalActiveCoinsReward = finalCashValueInUSD / activeCryptoPrice;

            setCoins(c => c + finalActiveCoinsReward);
            setNotification(`🏆 BLOCK SOLVED! Your rig successfully mined Block #${resolvedHeight} on the ${randomCrypto} network and earned an extra ${rewardAmt} ${randomCrypto} validation bonus!`);
          }

          const difficulties: Record<string, string> = {
            HSC: '8.52 G',
            BTC: '78.43 T',
            ETH: '12.50 P',
            SOL: '44.82 M',
            DOGE: '11.85 M'
          };

          const rewards: Record<string, number> = {
            HSC: 100,
            BTC: 3.125,
            ETH: 2.0,
            SOL: 1.5,
            DOGE: 10000
          };

          const hashStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const rId = Math.floor(100000 + Math.random() * 900000);

          const newBlock: SimulatedBlock = {
            id: `block_${Date.now()}_${rId}`,
            height: resolvedHeight,
            crypto: randomCrypto,
            difficulty: difficulties[randomCrypto] || '1.0 M',
            miner: minerName,
            reward: rewards[randomCrypto] || 1.0,
            timestamp: Date.now(),
            hash: '00000000' + hashStr.substring(0, 56)
          };

          return [newBlock, ...prev.slice(0, 99)]; // Keep up to 100 blocks
        });
      }

      // Assemble processed transaction data
      const newTx = {
        id: `tx_p_${Date.now()}`,
        amount: Number(grossAmount.toFixed(randomCrypto === 'BTC' ? 6 : randomCrypto === 'DOGE' ? 1 : 4)),
        crypto: randomCrypto,
        fee: Number(fee.toFixed(randomCrypto === 'BTC' ? 7 : randomCrypto === 'DOGE' ? 2 : 5)),
        timestamp: Date.now(),
        address: randomAddr,
        status: Math.random() > 0.25 ? 'processed' : 'hashing',
      };

      setProcessedTxs(prev => [newTx, ...prev.slice(0, 15)]);


      if (curCluster) {
        // Validation rewards
        const hscBasePrice = 142.50;
        const rewardCryptoPrice = curPrices[randomCrypto] || 1.0;
        const activeCryptoPrice = curPrices[curCrypto] || hscBasePrice;
        
        // Fee amount in active target coins path
        const validationRewardInUSD = fee * rewardCryptoPrice * 0.35; // 35% of fee rewards routed to owner
        const validationRewardInActiveCrypto = validationRewardInUSD / activeCryptoPrice;
        
        setCoins(c => c + validationRewardInActiveCrypto);
      }

    }, 4500);

    return () => clearInterval(txTimer);
  }, []);

  // Active Click mining payout (tactile satisfying clicks)
  const mineClick = () => {
    let clickReward = 0.001; // basic reward
    
    // Boost click with hotplates booster
    const manualBooster = upgrades.find(u => u.id === 'boost_manual');
    if (manualBooster && manualBooster.level > 0) {
      clickReward += (manualBooster.multiplier * manualBooster.level * 0.002);
    }

    if (stats.throttled) {
      clickReward *= 0.1; // penalized clicking under throttling
    }

    // Scale click reward based on active crypto price vs standard base (142.50)
    const hscBasePrice = 142.50;
    const currentActivePrice = prices[activeCrypto] || hscBasePrice;
    clickReward = (clickReward * hscBasePrice) / currentActivePrice;

    setCoins(c => c + clickReward);
    setLifetimeMined(lm => lm + clickReward);

    // Minor heat spark upon user action click
    if (tempRef.current < 94.0) {
      tempRef.current += 0.8;
    }

    // 1% chance to discover free booster items during manual excavations
    if (Math.random() < 0.01) {
      const rewardTypes: ('overclock' | 'cryo' | 'market')[] = ['overclock', 'cryo', 'market'];
      const chosen = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
      setInventory(inv => {
        const nextInv = { ...inv, [chosen]: inv[chosen] + 1 };
        localStorage.setItem('fast_miner_booster_inventory', JSON.stringify(nextInv));
        return nextInv;
      });
      const itemLabel = chosen === 'overclock' ? 'Overclock Serum' : chosen === 'cryo' ? 'Cryo-Freeze Capsule' : 'Bullish News Spray';
      setNotification(`Lucky Click! You excavated 1x free ${itemLabel} while touch mining!`);
    }
  };

  // Buy Hardware Upgrades
  const buyUpgrade = (id: string): boolean => {
    let success = false;
    
    const currentTotalEarnings = usd + Object.entries(balances || {}).reduce((acc, [crypto, amt]) => {
      const actualAmt = crypto === activeCrypto ? coins : amt;
      const price = prices[crypto] || 0;
      return acc + (actualAmt * price);
    }, 0);

    setUpgrades(curUpgrades => {
      const targetIndex = curUpgrades.findIndex(u => u.id === id);
      if (targetIndex === -1) return curUpgrades;
      
      const item = curUpgrades[targetIndex];
      if (item.level >= item.maxLevel) return curUpgrades;
      
      if (currentTotalEarnings >= item.cost) {
        success = true;

        let remaining = item.cost;
        if (usd >= remaining) {
          setUsd(curr => curr - remaining);
          remaining = 0;
        } else {
          remaining -= usd;
          setUsd(0);
        }

        if (remaining > 0) {
          const activeCryptoValue = coins * marketPrice;
          if (activeCryptoValue >= remaining) {
            const coinsToDeduct = remaining / marketPrice;
            setCoins(c => Math.max(0, c - coinsToDeduct));
            remaining = 0;
          } else {
            remaining -= activeCryptoValue;
            setCoins(0);
            setBalances(prev => {
              const updated = { ...prev };
              updated[activeCrypto] = 0;
              const cryptos = Object.keys(updated);
              for (const crypto of cryptos) {
                if (remaining <= 0) break;
                const price = prices[crypto] || 0;
                if (price <= 0) continue;
                const val = updated[crypto] * price;
                if (val >= remaining) {
                  updated[crypto] -= remaining / price;
                  remaining = 0;
                } else {
                  remaining -= val;
                  updated[crypto] = 0;
                }
              }
              localStorage.setItem('fast_miner_balances', JSON.stringify(updated));
              return updated;
            });
          }
        }

        const nextLevel = item.level + 1;
        const nextCost = Math.round(item.baseCost * Math.pow(item.costMultiplier, nextLevel));

        logUserTransaction(
          'UPGRADE_BUY',
          `Upgrade hardware: ${item.name} to Lvl ${nextLevel}`,
          `$${item.cost.toLocaleString()}`,
          'Hardware Inventory System'
        );

        const updated = [...curUpgrades];
        updated[targetIndex] = {
          ...item,
          level: nextLevel,
          cost: nextCost,
        };
        return updated;
      }
      return curUpgrades;
    });
    return success;
  };

  // Convert Coin to cash
  const sellCoins = async (amount: number) => {
    if (coins >= amount && amount > 0) {
      const gainedUSD = amount * marketPrice;
      const nextCoins = coins - amount;
      const nextUsd = usd + gainedUSD;
      setCoins(nextCoins);
      setUsd(nextUsd);

      logUserTransaction(
        'COIN_SELL',
        `Sold ${amount.toFixed(4)} ${activeCrypto} Coins`,
        formatVal(gainedUSD),
        'DEX Liquidity Pool'
      );

      if (user && !user.uid.startsWith('user_')) {
        try {
          const { saveUserProfile } = await import('../firebaseSync');
          await saveUserProfile(user.uid, user, nextCoins, nextUsd, lifetimeMined);
        } catch (err) {
          console.error('Error syncing sold coins to Firestore:', err);
        }
      }
    }
  };

  const sellAllCoins = async () => {
    if (coins > 0) {
      const gainedUSD = coins * marketPrice;
      const nextCoins = 0;
      const nextUsd = usd + gainedUSD;
      setCoins(nextCoins);
      setUsd(nextUsd);

      logUserTransaction(
        'COIN_SELL',
        `Sold All ${coins.toFixed(4)} ${activeCrypto} Coins`,
        formatVal(gainedUSD),
        'DEX Liquidity Pool'
      );

      if (user && !user.uid.startsWith('user_')) {
        try {
          const { saveUserProfile } = await import('../firebaseSync');
          await saveUserProfile(user.uid, user, nextCoins, nextUsd, lifetimeMined);
        } catch (err) {
          console.error('Error syncing sold all coins to Firestore:', err);
        }
      }
    }
  };

  // Simulated live candlestick and cryptocurrency value updates
  useEffect(() => {
    const marketInterval = setInterval(() => {
      setPrices(currentPrices => {
        const nextPrices = { ...currentPrices };
        
        setMarketHistories(currentHistories => {
          const nextHistories = { ...currentHistories };
          const { activeNews: curNews, activeBoosters: curBoosters } = miningStateRef.current;

          Object.keys(currentPrices).forEach(cryptoKey => {
            const currentVal = currentPrices[cryptoKey];
            
            let bias = 0;
            if (curNews) {
              bias = curNews.impactPercent * 0.012; // positive or negative tilt
            }

            // Apply upward bias if Bullish news spray booster is active
            const activeMarkets = curBoosters.filter(b => b.type === 'market').length;
            if (activeMarkets > 0) {
              bias += activeMarkets * 0.22; // extreme bullish surge
            }

            const walk = (Math.random() - 0.5 + bias) * 1.8;
            let walkPercent = walk / 100;
            let nextPrice = currentVal * (1 + walkPercent);
            
            // Minimum floor boundaries for coins
            const floor = cryptoKey === 'DOGE' ? 0.01 : cryptoKey === 'SOL' ? 5.0 : cryptoKey === 'ETH' ? 50.0 : cryptoKey === 'BTC' ? 1000.0 : 12.0;
            nextPrice = Math.max(floor, nextPrice);
            const decimals = cryptoKey === 'DOGE' ? 4 : 2;
            nextPrice = Number(nextPrice.toFixed(decimals));

            nextPrices[cryptoKey] = nextPrice;

            // Update this cryptocurrency's history array
            const history = currentHistories[cryptoKey] || [];
            if (history.length > 0) {
              const nextHistory = [...history.slice(1)];
              const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              
              const lastPoint = history[history.length - 1];
              const open = lastPoint ? lastPoint.close : currentVal;
              const close = nextPrice;
              const range = currentVal * 0.02 + 0.02;
              const high = Math.max(open, close) + Math.random() * (range * 0.1);
              const low = Math.max(0.001, Math.min(open, close) - Math.random() * (range * 0.1));

              nextHistory.push({
                time: nowLabel,
                price: nextPrice,
                open: Number(open.toFixed(decimals)),
                high: Number(high.toFixed(decimals)),
                low: Number(low.toFixed(decimals)),
                close: Number(close.toFixed(decimals)),
              });
              nextHistories[cryptoKey] = nextHistory;
            }
          });

          localStorage.setItem('fast_miner_market_histories', JSON.stringify(nextHistories));
          return nextHistories;
        });

        localStorage.setItem('fast_miner_prices', JSON.stringify(nextPrices));
        return nextPrices;
      });
    }, 3500);

    return () => clearInterval(marketInterval);
  }, []);

  // Simulated Real-Time News Feed Events
  useEffect(() => {
    const newsInterval = setInterval(() => {
      const nextNewsIndex = Math.floor(Math.random() * NEWS_TEMPLATES.length);
      const chosenTemplate = NEWS_TEMPLATES[nextNewsIndex];
      
      const uniqueNews: MarketNews = {
        ...chosenTemplate,
        id: `news_live_${Date.now()}`,
        time: 'Just Now',
      };

      // Set active sentiment booster news (influences walking pricing)
      setActiveNews(uniqueNews);
      setNews(prev => {
        // Add new piece of news to the front of logs
        return [uniqueNews, ...prev.slice(0, 5)];
      });

      // After 10s, neutralise specific heavy volatility news
      setTimeout(() => {
        setActiveNews(null);
      }, 10000);

    }, 22000);

    return () => clearInterval(newsInterval);
  }, []);

  // --- Real-Fake Fast, Instant, Satisfying Blockchain Payout Processing! ---
  const requestPayout = (address: string, usdAmount: number, gateway: 'paypal' | 'bank' | 'wallet' = 'wallet', gatewayDetails?: string, holdForBatching?: boolean) => {
    if (!address || address.length < 5) {
      return { success: false, message: 'Invalid target destination identifier.' };
    }
    if (usdAmount < 5.0) {
      return { success: false, message: 'Minimum payout limit is $5.00 USD.' };
    }

    const currentTotalEarnings = usd + Object.entries(balances || {}).reduce((acc, [crypto, amt]) => {
      const actualAmt = crypto === activeCrypto ? coins : amt;
      const price = prices[crypto] || 0;
      return acc + (actualAmt * price);
    }, 0);

    if (currentTotalEarnings >= usdAmount) {
      // Deduct funds immediately
      let remaining = usdAmount;
      let nextUsd = usd;
      let nextCoins = coins;
      let nextBalances = { ...balances };

      if (nextUsd >= remaining) {
        nextUsd -= remaining;
        remaining = 0;
      } else {
        remaining -= nextUsd;
        nextUsd = 0;
      }

      if (remaining > 0) {
        const activeCryptoValue = nextCoins * marketPrice;
        if (activeCryptoValue >= remaining) {
          const coinsToDeduct = remaining / marketPrice;
          nextCoins = Math.max(0, nextCoins - coinsToDeduct);
          remaining = 0;
        } else {
          remaining -= activeCryptoValue;
          nextCoins = 0;
          nextBalances[activeCrypto] = 0;
          const cryptos = Object.keys(nextBalances);
          for (const crypto of cryptos) {
            if (remaining <= 0) break;
            const price = prices[crypto] || 0;
            if (price <= 0) continue;
            const val = nextBalances[crypto] * price;
            if (val >= remaining) {
              nextBalances[crypto] -= remaining / price;
              remaining = 0;
            } else {
              remaining -= val;
              nextBalances[crypto] = 0;
            }
          }
        }
      }

      setUsd(nextUsd);
      setCoins(nextCoins);
      setBalances(nextBalances);
      localStorage.setItem('fast_miner_balances', JSON.stringify(nextBalances));

      const hscEquiv = usdAmount / marketPrice;
      const characters = '0123456789abcdef';
      let txHash = '0x';
      for (let i = 0; i < 48; i++) {
        txHash += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const blockNum = Math.floor(1024300 + Math.random() * 5000);

      const newTx: PayoutTransaction = {
        id: `tx_${Date.now()}`,
        amountCoin: Number(hscEquiv.toFixed(4)),
        amountUSD: Number(usdAmount.toFixed(2)),
        address,
        status: 'pending',
        verificationStatus: 'unverified',
        timestamp: Date.now(),
        txHash,
        fee: Number((usdAmount * 0.015).toFixed(4)), // 1.5% network fee
        blockNumber: blockNum,
        type: 'cash',
        crypto: activeCrypto,
        gateway,
        gatewayDetails,
        holdForBatching: holdForBatching || false
      };

      // Push into pending payouts
      setPayouts(prev => {
        const updated = [newTx, ...prev];
        localStorage.setItem('fast_miner_payouts', JSON.stringify(updated));
        return updated;
      });

      logUserTransaction(
        'WITHDRAWAL',
        `Withdrawal request: ${usdAmount} USD via ${gateway.toUpperCase()}${holdForBatching ? ' (Mempool Held)' : ''}`,
        `$${usdAmount.toLocaleString()}`,
        address,
        'PENDING'
      );

      if (holdForBatching) {
        // Queue for Batch Processing - no automatic timers started
      } else if (user && !user.uid.startsWith('user_')) {
        // Logged-in full-stack user: Sync to secure Firestore & require manual verification
        import('../firebaseSync').then(async ({ savePayoutTransaction, saveUserProfile }) => {
          try {
            await savePayoutTransaction(user.uid, newTx);
            await saveUserProfile(user.uid, user, nextCoins, nextUsd, lifetimeMined);
          } catch (err) {
            console.error('Error syncing payout to Firestore:', err);
          }
        });
      } else {
        // Offline / mock play: trigger automatic status changes
        setTimeout(() => {
          updateTxStatus(newTx.id, 'processing');
        }, 4000);

        setTimeout(() => {
          updateTxStatus(newTx.id, 'confirmed');
        }, 10000);
      }

      return { success: true, message: 'Payout requested successfully!', tx: newTx };
    } else {
      return { success: false, message: 'Insufficient USD funds in main balance.' };
    }
  };

  const requestCryptoTransfer = (crypto: string, address: string, cryptoAmount: number, holdForBatching?: boolean) => {
    if (!address || address.length < 8) {
      return { success: false, message: 'Invalid target wallet key format.' };
    }
    
    const coinBalance = crypto === activeCrypto ? coins : (balances[crypto] ?? 0);
    
    if (cryptoAmount <= 0) {
      return { success: false, message: 'Please enter a valid amount high than 0.' };
    }
    
    if (coinBalance >= cryptoAmount) {
      let nextCoins = coins;
      let nextBalances = { ...balances };

      // Deduct balance
      if (crypto === activeCrypto) {
        nextCoins -= cryptoAmount;
        setCoins(nextCoins);
      } else {
        nextBalances[crypto] -= cryptoAmount;
        setBalances(nextBalances);
        localStorage.setItem('fast_miner_balances', JSON.stringify(nextBalances));
      }
      
      const cryptoPrice = prices[crypto] || 1.0;
      const usdValue = cryptoAmount * cryptoPrice;
      const feeAmount = cryptoAmount * 0.015; // 1.5% blockchain gas fee
      
      const characters = '0123456789abcdef';
      let txHash = '0x';
      for (let i = 0; i < 48; i++) {
        txHash += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const blockNum = Math.floor(6305000 + Math.random() * 250000);
      
      const newTx: PayoutTransaction = {
        id: `tx_${Date.now()}`,
        amountCoin: Number(cryptoAmount.toFixed(crypto === 'DOGE' ? 2 : 5)),
        amountUSD: Number(usdValue.toFixed(2)),
        address,
        status: 'pending',
        verificationStatus: 'unverified',
        timestamp: Date.now(),
        txHash,
        fee: Number(feeAmount.toFixed(crypto === 'DOGE' ? 2 : 5)),
        blockNumber: blockNum,
        type: 'crypto',
        crypto: crypto,
        holdForBatching: holdForBatching || false
      };
      
      setPayouts(prev => {
        const updated = [newTx, ...prev];
        localStorage.setItem('fast_miner_payouts', JSON.stringify(updated));
        return updated;
      });

      logUserTransaction(
        'WITHDRAWAL',
        `Crypto Dispatch: ${cryptoAmount.toFixed(4)} ${crypto}${holdForBatching ? ' (Mempool Held)' : ''}`,
        `${cryptoAmount.toFixed(4)} ${crypto} (≈ $${usdValue.toLocaleString()})`,
        address,
        'PENDING'
      );

      if (holdForBatching) {
        // Held in mempool for manual aggregate batching - skip timers & firestore auto rules
      } else if (user && !user.uid.startsWith('user_')) {
        // Logged-in full-stack user: Sync to secure Firestore & require manual verification
        import('../firebaseSync').then(async ({ savePayoutTransaction, saveUserProfile }) => {
          try {
            await savePayoutTransaction(user.uid, newTx);
            await saveUserProfile(user.uid, user, nextCoins, usd, lifetimeMined);
          } catch (err) {
            console.error('Error syncing crypto transfer to Firestore:', err);
          }
        });
      } else {
        // Cascade statuses for offline mock
        setTimeout(() => {
          updateTxStatus(newTx.id, 'processing');
        }, 4000);
        
        setTimeout(() => {
          updateTxStatus(newTx.id, 'confirmed');
        }, 10000);
      }
      
      setNotification(`External transfer submitted! ${cryptoAmount.toFixed(crypto === 'DOGE' ? 1 : 4)} ${crypto} successfully dispatched.`);
      
      return { success: true, message: 'Cryptocurrency transfer successful!', tx: newTx };
    } else {
      return { success: false, message: `Insufficient ${crypto} balance. Mine more to complete dispatch!` };
    }
  };

  const updateTxStatus = (txId: string, nextStatus: 'pending' | 'processing' | 'confirmed') => {
    setPayouts(prev => {
      const updated = prev.map(t => {
        if (t.id === txId) {
          return { ...t, status: nextStatus };
        }
        return t;
      });
      localStorage.setItem('fast_miner_payouts', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTxVerificationStatus = (
    txId: string, 
    nextVerificationStatus: 'unverified' | 'verifying' | 'verified',
    nextStatus?: 'pending' | 'processing' | 'confirmed'
  ) => {
    setPayouts(prev => {
      const updated = prev.map(t => {
        if (t.id === txId) {
          return { 
            ...t, 
            verificationStatus: nextVerificationStatus,
            ...(nextStatus ? { status: nextStatus } : {})
          };
        }
        return t;
      });
      localStorage.setItem('fast_miner_payouts', JSON.stringify(updated));
      return updated;
    });
  };

  const verifyPayout = async (txId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || user.uid.startsWith('user_')) {
      return { success: false, message: 'OAuth verification required. Secure login must be established.' };
    }

    try {
      const { updatePayoutVerification } = await import('../firebaseSync');

      // 1. Set verifying
      updateTxVerificationStatus(txId, 'verifying');
      await updatePayoutVerification(user.uid, txId, 'verifying');

      // 2. Perform mock delay (calculating decentralized zero-knowledge compliance proofs & AML validation)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // 3. Mark verified & processing
      updateTxVerificationStatus(txId, 'verified', 'processing');
      await updatePayoutVerification(user.uid, txId, 'verified', 'processing');

      // 4. Cascade to final confirmed state on successful block inclusion
      setTimeout(async () => {
        updateTxStatus(txId, 'confirmed');
        if (user && !user.uid.startsWith('user_')) {
          try {
            await updatePayoutVerification(user.uid, txId, 'verified', 'confirmed');
          } catch(err) {
            console.error('Firestore confirmation sync failed:', err);
          }
        }
      }, 5000);

      return { success: true, message: 'AML & Cryptographic Compliance Proofs Verified. Ledger settlement approved!' };
    } catch (err: any) {
      console.error('Compliance gate verification error:', err);
      updateTxVerificationStatus(txId, 'unverified');
      return { success: false, message: 'AML Compliance Gate failed: ' + err.message };
    }
  };

  const batchPayouts = (txIds: string[]): { success: boolean; message: string; tx?: PayoutTransaction } => {
    if (!txIds || txIds.length < 2) {
      return { success: false, message: 'Please select at least 2 pending transactions to batch.' };
    }

    const selectedTxs = payouts.filter(tx => txIds.includes(tx.id));
    if (selectedTxs.length !== txIds.length) {
      return { success: false, message: 'Could not find all selected transactions in historical ledger.' };
    }

    const nonPending = selectedTxs.find(tx => tx.status !== 'pending');
    if (nonPending) {
      return { success: false, message: `Transaction ${nonPending.id.slice(0, 8)} is already being processed or confirmed. Only pending mempool items can be batched.` };
    }

    const firstType = selectedTxs[0].type || 'cash';
    const differentType = selectedTxs.find(tx => (tx.type || 'cash') !== firstType);
    if (differentType) {
      return { success: false, message: 'Cannot batch different transaction models (Cash Out and Crypto Dispatch) together.' };
    }

    const firstAddr = selectedTxs[0].address;
    const differentAddr = selectedTxs.find(tx => tx.address !== firstAddr);
    if (differentAddr) {
      return { success: false, message: 'Cannot batch transactions heading for different target addresses.' };
    }

    const firstCrypto = selectedTxs[0].crypto || 'HSC';
    if (firstType === 'crypto') {
      const differentCrypto = selectedTxs.find(tx => (tx.crypto || 'HSC') !== firstCrypto);
      if (differentCrypto) {
        return { success: false, message: 'Cannot batch different cryptocurrencies together.' };
      }
    }

    const totalUSD = selectedTxs.reduce((sum, tx) => sum + tx.amountUSD, 0);
    const totalCoin = selectedTxs.reduce((sum, tx) => sum + tx.amountCoin, 0);

    const sumOriginalFeesCoin = selectedTxs.reduce((sum, tx) => sum + tx.fee, 0);
    const sumOriginalFeesUSD = selectedTxs.reduce((sum, tx) => {
      if (tx.type === 'crypto') {
        const rate = prices[tx.crypto || 'HSC'] || 1;
        return sum + (tx.fee * rate);
      } else {
        return sum + tx.fee;
      }
    }, 0);

    // Apply an 80% aggregate gas discount for combining payloads in a single block
    const discount = 0.20;
    const newFeeCoin = Number((sumOriginalFeesCoin * discount).toFixed(firstCrypto === 'DOGE' ? 2 : 5));
    const newFeeUSD = Number((sumOriginalFeesUSD * discount).toFixed(2));

    const savedFeeCoin = sumOriginalFeesCoin - newFeeCoin;
    const savedFeeUSD = sumOriginalFeesUSD - newFeeUSD;

    let nextUsd = usd;
    let nextCoins = coins;
    let nextBalances = { ...balances };

    if (firstType === 'crypto') {
      if (firstCrypto === activeCrypto) {
        nextCoins += savedFeeCoin;
      } else {
        nextBalances[firstCrypto] = (nextBalances[firstCrypto] || 0) + savedFeeCoin;
      }
    } else {
      nextUsd += savedFeeUSD;
    }

    setUsd(nextUsd);
    setCoins(nextCoins);
    setBalances(nextBalances);
    localStorage.setItem('fast_miner_balances', JSON.stringify(nextBalances));

    const characters = '0123456789abcdef';
    let txHash = '0x';
    for (let i = 0; i < 48; i++) {
      txHash += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const blockNum = Math.floor(1024300 + Math.random() * 5000);

    const mergedTx: PayoutTransaction = {
      id: `tx_batch_${Date.now()}`,
      amountCoin: Number(totalCoin.toFixed(firstCrypto === 'DOGE' ? 2 : 5)),
      amountUSD: Number(totalUSD.toFixed(2)),
      address: firstAddr,
      status: 'pending',
      verificationStatus: 'unverified',
      timestamp: Date.now(),
      txHash,
      fee: firstType === 'crypto' ? newFeeCoin : newFeeUSD,
      blockNumber: blockNum,
      type: firstType,
      crypto: firstCrypto,
      gateway: selectedTxs[0].gateway || 'wallet',
      gatewayDetails: `Consolidated Batch of ${txIds.length} Payouts. Saved ${firstType === 'crypto' ? `${savedFeeCoin.toFixed(4)} ${firstCrypto}` : formatVal(savedFeeUSD)} in gas!`
    };

    setPayouts(prev => {
      const filtered = prev.filter(tx => !txIds.includes(tx.id));
      const updated = [mergedTx, ...filtered];
      localStorage.setItem('fast_miner_payouts', JSON.stringify(updated));
      return updated;
    });

    logUserTransaction(
      'WITHDRAWAL',
      `Batch settlement: Combined ${txIds.length} transactions into block`,
      firstType === 'crypto' ? `${totalCoin.toFixed(4)} ${firstCrypto} (≈ $${totalUSD.toLocaleString()})` : `$${totalUSD.toLocaleString()}`,
      firstAddr,
      'PENDING'
    );

    if (user && !user.uid.startsWith('user_')) {
      import('../firebaseSync').then(async ({ savePayoutTransaction, saveUserProfile, deletePayoutTransaction }) => {
        try {
          for (const id of txIds) {
            await deletePayoutTransaction(user.uid, id);
          }
          await savePayoutTransaction(user.uid, mergedTx);
          await saveUserProfile(user.uid, user, nextCoins, nextUsd, lifetimeMined);
        } catch (err) {
          console.error('Error syncing batched payouts:', err);
        }
      });
    } else {
      setTimeout(() => {
        updateTxStatus(mergedTx.id, 'processing');
      }, 4000);

      setTimeout(() => {
        updateTxStatus(mergedTx.id, 'confirmed');
      }, 10000);
    }

    setNotification(`🎉 Batch Consolidated! Aggregated ${txIds.length} transfers. Saved ${firstType === 'crypto' ? `${savedFeeCoin.toFixed(4)} ${firstCrypto}` : formatVal(savedFeeUSD)} on gas which was refunded back to your balance!`);

    return { success: true, message: 'Aggregation successful!', tx: mergedTx };
  };

  // Full system restore
  const resetProgress = () => {
    localStorage.clear();
    setCoins(0);
    setUsd(0);
    setLifetimeMined(0);
    setUpgrades(INITIAL_UPGRADES);
    setPayouts([]);
    tempRef.current = 32.0;
    isThrottledRef.current = false;
    setActiveTab('mine');

    setActiveCryptoState('BTC');
    setBalances({
      HSC: 0,
      BTC: 0,
      ETH: 0,
      SOL: 0,
      DOGE: 0,
    });
    setPrices({
      HSC: 142.50,
      BTC: 96500.00,
      ETH: 3450.00,
      SOL: 185.00,
      DOGE: 0.38,
    });

    // Reset daily login rewards, active boosters, and inventory booster states
    setSimulatedOffset(0);
    setDailyReward({
      streak: 0,
      lastClaimTime: 0,
      hasClaimedToday: false
    });
    setActiveBoosters([]);
    setInventory({
      overclock: 0,
      cryo: 0,
      market: 0,
      permanent: 0
    });
    
    // Reset block explorer history
    localStorage.removeItem('fast_miner_simulated_blocks');
    setSimulatedBlocks([]);
    
    // Reset user transactions
    localStorage.removeItem('fast_miner_user_transactions');
    setUserTransactions([]);
    
    setNotification("Simulator restarted to Genesis Blocks successfully!");
  };

  const emergencyShutdown = () => {
    setIsClusterAutoMining(false);
    tempRef.current = 32.0;
    isThrottledRef.current = false;
    setStats(prev => ({ ...prev, temperature: 32.0, throttled: false }));
    setNotification("EMERGENCY SHUTDOWN INITIATED. Cluster halted, thermal build-up cleared.");
  };

  const emergencyCooling = () => {
    if (usd >= 25) {
      setUsd(u => u - 25);
      tempRef.current = 32.0;
      isThrottledRef.current = false;
      setStats(prev => ({ ...prev, temperature: 32.0, throttled: false }));
      setNotification("EMERGENCY COOLING ACTIVATED. -$25.00 | Thermals Reset.");
      return true;
    }
    setNotification("Emergency Cooling failed: Requires $25.00.");
    return false;
  };

  // --- Initialize Firebase Authentication Listener ---
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const loadAuth = async () => {
      try {
        const { initAuth } = await import('../firebase');
        unsubscribe = initAuth(
          (firebaseUser, token) => {
            // Automatically log in and restore cloud stats on page open
            login(
              'google', 
              firebaseUser.email || firebaseUser.uid, 
              firebaseUser.displayName || 'Google Member', 
              firebaseUser.uid
            );
          },
          () => {
            if (miningStateRef.current.user?.provider === 'google') {
              setUser(null);
              localStorage.removeItem('fast_miner_user');
            }
          }
        );
      } catch (err) {
        console.error('Firebase Auth initialization error:', err);
      }
    };
    loadAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- Periodic background sync of accumulated balance state ---
  useEffect(() => {
    if (!user || user.uid.startsWith('user_')) return;
    
    const interval = setInterval(async () => {
      try {
        const { saveUserProfile } = await import('../firebaseSync');
        await saveUserProfile(user.uid, user, miningStateRef.current.coins, miningStateRef.current.usd, miningStateRef.current.lifetimeMined);
      } catch (err) {
        console.error('Periodic stats save failed:', err);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user]);

  const totalEarnings = usd + Object.entries(balances || {}).reduce((acc, [crypto, amt]) => {
    const actualAmt = crypto === activeCrypto ? coins : amt;
    const price = prices[crypto] || 0;
    return acc + (actualAmt * price);
  }, 0);

  return (
    <MiningContext.Provider value={{
      coins,
      usd: totalEarnings,
      lifetimeMined,
      upgrades,
      stats,
      marketPrice,
      payoutAddress,
      payouts,
      news,
      activeNews,
      marketHistory,
      activeTab,
      setActiveTab,
      mineClick,
      buyUpgrade,
      sellCoins,
      sellAllCoins,
      requestPayout,
      setPayoutAddress,
      resetProgress,
      batchPayouts,

      // Block explorer
      simulatedBlocks,
      userTransactions,
      logUserTransaction,
      
      // Multiple Cryptocurrencies Selection & Wallets
      activeCrypto,
      setActiveCrypto,
      balances,
      prices,
      requestCryptoTransfer,

      // One-tap Auto Mining Cluster Core & Gateway telemetry
      isClusterAutoMining,
      setIsClusterAutoMining,
      selectedCurrency,
      setSelectedCurrency,
      currencySymbols,
      currencyRates,
      formatVal,
      liveGateways,
      processedTxs,

      // Booster & reward additions
      dailyReward,
      claimDailyReward,
      simulateTimePass,
      activeBoosters,
      inventory,
      buyBoosterItem,
      activateBoosterItem,
      notification,
      dismissNotification,

      // Authentication
      user,
      login,
      logout,
      verifyPayout,
      
      // Emergency Actions
      emergencyShutdown,
      emergencyCooling,
    }}>
      {children}
    </MiningContext.Provider>
  );
};
