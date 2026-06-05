import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MiningUpgrade, PayoutTransaction, PriceDataPoint, MarketNews, MiningStats, ActiveBooster, BoosterInventory, DailyRewardState, UserProfile, SimulatedBlock, UserTransaction, PerformanceRecord, AppToast } from '../types';
import { INITIAL_UPGRADES, NEWS_TEMPLATES } from '../data';
import { playSound, speakVoice } from '../utils/audio';

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
  activeTab: 'mine' | 'upgrades' | 'market' | 'payouts' | 'emails' | 'explorer' | 'alpha_hub' | 'support';
  setActiveTab: (tab: 'mine' | 'upgrades' | 'market' | 'payouts' | 'emails' | 'explorer' | 'alpha_hub' | 'support') => void;
  mineClick: () => void;
  buyUpgrade: (id: string) => boolean;
  sellCoins: (amount: number) => void;
  sellAllCoins: () => void;
  requestPayout: (address: string, usdAmount: number, gateway?: 'paypal' | 'bank' | 'wallet', gatewayDetails?: string, holdForBatching?: boolean) => { success: boolean; message: string; tx?: PayoutTransaction };
  setPayoutAddress: (address: string) => void;
  resetProgress: () => void;
  batchPayouts: (txIds: string[]) => { success: boolean; message: string; tx?: PayoutTransaction };

  // Master sound control
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  voicePromptsEnabled: boolean;
  setVoicePromptsEnabled: (val: boolean) => void;
  appTheme: 'deep-space' | 'high-contrast-light';
  setAppTheme: (val: 'deep-space' | 'high-contrast-light') => void;

  // Block explorer
  simulatedBlocks: SimulatedBlock[];


  // Multiple Cryptocurrencies Selection & Wallets
  activeCrypto: string;
  setActiveCrypto: (crypto: string) => void;
  balances: Record<string, number>;
  prices: Record<string, number>;
  requestCryptoTransfer: (crypto: string, address: string, cryptoAmount: number, holdForBatching?: boolean) => { success: boolean; message: string; tx?: PayoutTransaction };
  initiateAssetTransfer: (crypto: string, recipientAddress: string, amount: number, name?: string) => { success: boolean; message: string; tx?: PayoutTransaction };
  confirmAssetTransfer: (txId: string) => Promise<{ success: boolean; message: string }>;
  activeMiners: Record<string, boolean>;
  toggleMiner: (crypto: string) => void;
  mineAllCoins: boolean;
  setMineAllCoins: (val: boolean) => void;

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
  login: (provider: 'google' | 'apple' | 'phone' | 'email', identifier: string, name?: string, uid?: string, rememberMe?: boolean) => void;
  logout: () => void;
  verifyPayout: (txId: string) => Promise<{ success: boolean; message: string }>;
  transferToMT5: (amountUSD: number) => boolean;

  // Emergency actions
  emergencyShutdown: () => void;
  emergencyCooling: () => boolean;
  isSystemOn: boolean;
  setIsSystemOn: (val: boolean) => void;
  buyGiftCards: (cart: Array<{ brand: string; value: number; qty: number }>, deliverEmail: string) => { success: boolean; message: string };

  // Manual & Auto Action Transaction Registry
  userTransactions: UserTransaction[];
  logUserTransaction: (type: UserTransaction['type'], title: string, amount: string, recipient: string, status?: UserTransaction['status'], overrideRef?: string) => UserTransaction;

  // Real-time Storage & Telemetry logging
  realtimeStorageLogs: string[];
  setRealtimeStorageLogs: React.Dispatch<React.SetStateAction<string[]>>;

  // Dynamic Cooling Profile
  isDynamicCoolingActive: boolean;
  setIsDynamicCoolingActive: (val: boolean) => void;

  // Performance Stats History Export
  performanceHistory: PerformanceRecord[];
  clearPerformanceHistory: () => void;

  // Toast Notifications System
  toasts: AppToast[];
  addToast: (toast: Omit<AppToast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  playSound: (type: any) => void;
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

  const [activeMiners, setActiveMiners] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('fast_miner_active_miners');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      HSC: true,
      BTC: true,
      ETH: true,
      SOL: true,
      DOGE: true,
      ALPHA: true,
    };
  });

  const [mineAllCoins, setMineAllCoinsState] = useState<boolean>(() => {
    return localStorage.getItem('fast_miner_mine_all_coins') !== 'false';
  });

  const toggleMiner = (crypto: string) => {
    setActiveMiners(prev => {
      const updated = { ...prev, [crypto]: !prev[crypto] };
      localStorage.setItem('fast_miner_active_miners', JSON.stringify(updated));
      
      const allTrue = Object.values(updated).every(v => v === true);
      setMineAllCoinsState(allTrue);
      localStorage.setItem('fast_miner_mine_all_coins', allTrue ? 'true' : 'false');
      
      const enabled = updated[crypto];
      playSound('toggle');
      speakVoice(enabled ? `${crypto} core activated.` : `${crypto} core offline.`);
      setNotification(enabled ? `🟢 ${crypto} mining core activated.` : `🔴 ${crypto} mining core deactivated.`);
      return updated;
    });
  };

  const setMineAllCoins = (val: boolean) => {
    setMineAllCoinsState(val);
    localStorage.setItem('fast_miner_mine_all_coins', val ? 'true' : 'false');
    
    setActiveMiners(prev => {
      const updated = {
        HSC: val,
        BTC: val,
        ETH: val,
        SOL: val,
        DOGE: val,
        ALPHA: val,
      };
      localStorage.setItem('fast_miner_active_miners', JSON.stringify(updated));
      playSound('toggle');
      speakVoice(val ? "All multi cryptocurrency mining cores active." : "All mining cores deactivated.");
      setNotification(val ? `🚀 All multi-crypto mining cores booted!` : `⚠️ All multi-crypto cores offline.`);
      return updated;
    });
  };

  // --- One-tap Auto Mining Cluster Core ---
  const [isClusterAutoMining, setIsClusterAutoMiningState] = useState<boolean>(() => {
    return localStorage.getItem('fast_miner_cluster_auto') !== 'false'; // Default to true so it works out of the box
  });

  const setIsClusterAutoMining = (val: boolean) => {
    setIsClusterAutoMiningState(val);
    localStorage.setItem('fast_miner_cluster_auto', val ? 'true' : 'false');
    speakVoice(val ? "Auto mining engine engaged." : "Auto mining system on standby.");
    setNotification(val ? '⚡ Cloud Integration Established! All mining computing machines are synced and auto-mining at maximum efficiency' : '⚠️ Cluster Standby. Auto-mining machines decoupled from central clock.');
  };

  const [isSystemOn, setIsSystemOnState] = useState<boolean>(() => {
    return localStorage.getItem('fast_miner_system_on') !== 'false';
  });

  const setIsSystemOn = (val: boolean) => {
    setIsSystemOnState(val);
    localStorage.setItem('fast_miner_system_on', val ? 'true' : 'false');
    if (!val) {
      playSound('shutdown');
      speakVoice("Emergency core shutdown initiated. Coolant systems venting.");
      setIsClusterAutoMiningState(false);
      tempRef.current = 24.0;
      isThrottledRef.current = false;
      setStats(prev => ({ ...prev, temperature: 24.0, hashRate: 0, powerDraw: 0, efficiency: 0, throttled: false }));
      setNotification("POWER STATUS: EMERGENCY SHUTDOWN. All mining cores decoupled, thermal vents depressurized.");
    } else {
      playSound('startup');
      speakVoice("Sovereign Mining Core online. Central mainframe connected.");
      setIsClusterAutoMiningState(true);
      setNotification("POWER STATUS: ONLINE. Decentralized fast-hash mainframes initialized and active.");
    }
  };

  // --- Master Sound Control ---
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('fast_miner_sound_enabled') !== 'false';
  });

  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    localStorage.setItem('fast_miner_sound_enabled', val ? 'true' : 'false');
  };

  const [voicePromptsEnabled, setVoicePromptsEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('fast_miner_voice_enabled') !== 'false';
  });

  const setVoicePromptsEnabled = (val: boolean) => {
    setVoicePromptsEnabledState(val);
    localStorage.setItem('fast_miner_voice_enabled', val ? 'true' : 'false');
    if (val) {
      speakVoice("AI vocal assistant prompts activated.");
    }
  };

  const [appTheme, setAppThemeState] = useState<'deep-space' | 'high-contrast-light'>(() => {
    return (localStorage.getItem('fast_miner_app_theme') as 'deep-space' | 'high-contrast-light') || 'deep-space';
  });

  const setAppTheme = (val: 'deep-space' | 'high-contrast-light') => {
    setAppThemeState(val);
    localStorage.setItem('fast_miner_app_theme', val);
  };

  useEffect(() => {
    if (appTheme === 'high-contrast-light') {
      document.documentElement.classList.add('high-contrast-light');
    } else {
      document.documentElement.classList.remove('high-contrast-light');
    }
  }, [appTheme]);

  // --- Toast Notifications System ---
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const addToast = (toast: Omit<AppToast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newToast: AppToast = {
      ...toast,
      id,
      timestamp: Date.now()
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts for clean visual layouts
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Dynamic Cooling Profile ---
  const [isDynamicCoolingActive, setIsDynamicCoolingActiveState] = useState<boolean>(() => {
    return localStorage.getItem('fast_miner_dynamic_cooling_active') === 'true';
  });

  const setIsDynamicCoolingActive = (val: boolean) => {
    setIsDynamicCoolingActiveState(val);
    localStorage.setItem('fast_miner_dynamic_cooling_active', val ? 'true' : 'false');
    setNotification(val ? '❄️ Dynamic Cooling Profile Activated! Core fan speeds will now auto-adjust based on real-time temperature telemetry.' : '⚠️ Cooling profile reset to manual mode.');
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
    { id: 'alpha_rpc', name: 'Alpha Network Hub', type: 'Alpha Chain Validator', latency: 6, status: 'connected', height: 452901 },
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
      ALPHA: 0,
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
      ALPHA: 2.15,
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
    const coinsKeys = ['BTC', 'HSC', 'ETH', 'SOL', 'DOGE', 'ALPHA'];
    const basePrices: Record<string, number> = { HSC: 142.50, BTC: 96500.00, ETH: 3450.00, SOL: 185.00, DOGE: 0.38, ALPHA: 2.15 };
    
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
        const isLowValue = k === 'DOGE' || k === 'ALPHA';
        history.push({
          time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: Number(close.toFixed(isLowValue ? 4 : 2)),
          open: Number(open.toFixed(isLowValue ? 4 : 2)),
          high: Number(high.toFixed(isLowValue ? 4 : 2)),
          low: Number(low.toFixed(isLowValue ? 4 : 2)),
          close: Number(close.toFixed(isLowValue ? 4 : 2)),
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

  const [realtimeStorageLogs, setRealtimeStorageLogs] = useState<string[]>([]);

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

  // Automated background auto-login on first page load
  useEffect(() => {
    const autoLoginEnabled = localStorage.getItem('fast_miner_auto_login') !== 'false';
    if (!user && autoLoginEnabled) {
      const lastMethod = localStorage.getItem('fast_miner_last_login_method') as 'google' | 'apple' | 'phone' | 'email' | null;
      const lastEmail = localStorage.getItem('fast_miner_last_login_email');
      const lastPhone = localStorage.getItem('fast_miner_last_login_phone');
      
      if (lastMethod) {
        if (lastMethod === 'google' && lastEmail) {
          login('google', lastEmail);
        } else if (lastMethod === 'apple' && lastEmail) {
          login('apple', lastEmail);
        } else if (lastMethod === 'phone' && lastPhone) {
          login('phone', lastPhone);
        } else if (lastMethod === 'email' && lastEmail) {
          const cachedUserStr = localStorage.getItem('fast_miner_user');
          let name = 'Account User';
          if (cachedUserStr) {
            try {
              name = JSON.parse(cachedUserStr).name || name;
            } catch (e) {}
          }
          login('email', lastEmail, name);
        }
      }
    }
  }, []);

  const login = async (
    provider: 'google' | 'apple' | 'phone' | 'email', 
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
    } else if (provider === 'email') {
      email = identifier;
      if (!formattedName) {
        const localPart = identifier.split('@')[0];
        formattedName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
      }
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
          if (dbProfile.coins !== undefined) {
            setCoins(dbProfile.coins);
            localStorage.setItem('fast_miner_coins', dbProfile.coins.toString());
          }
          if (dbProfile.usd !== undefined) {
            setUsd(dbProfile.usd);
            localStorage.setItem('fast_miner_usd', dbProfile.usd.toString());
          }
          if (dbProfile.lifetimeMined !== undefined) {
            setLifetimeMined(dbProfile.lifetimeMined);
            localStorage.setItem('fast_miner_lifetime', dbProfile.lifetimeMined.toString());
          }
          if (dbProfile.balances !== undefined) {
            setBalances(dbProfile.balances);
            localStorage.setItem('fast_miner_balances', JSON.stringify(dbProfile.balances));
          }
          if (dbProfile.upgrades !== undefined) {
            setUpgrades(dbProfile.upgrades);
            localStorage.setItem('fast_miner_upgrades', JSON.stringify(dbProfile.upgrades));
          }
          if (dbProfile.boosterInventory !== undefined) {
            setInventory(dbProfile.boosterInventory);
            localStorage.setItem('fast_miner_booster_inventory', JSON.stringify(dbProfile.boosterInventory));
          }
          if (dbProfile.activeBoosters !== undefined) {
            setActiveBoosters(dbProfile.activeBoosters);
            localStorage.setItem('fast_miner_active_boosters', JSON.stringify(dbProfile.activeBoosters));
          }
          if (dbProfile.dailyReward !== undefined) {
            setDailyReward(dbProfile.dailyReward);
            localStorage.setItem('fast_miner_daily_reward', JSON.stringify(dbProfile.dailyReward));
          }
          if (dbProfile.activeCrypto !== undefined) {
            setActiveCryptoState(dbProfile.activeCrypto);
            localStorage.setItem('fast_miner_active_crypto', dbProfile.activeCrypto);
          }
          
          const dbPayouts = await getPayoutTransactions(newUser.uid);
          if (dbPayouts && dbPayouts.length > 0) {
            setPayouts(dbPayouts);
            localStorage.setItem('fast_miner_payouts', JSON.stringify(dbPayouts));
          }
          setNotification(`🎉 Sync Success: Securely loaded historical stats from your Cloud Profile Ledger.`);
        } else {
          // Initialize user profile document in Firestore with current local stats
          await saveUserProfile(newUser.uid, newUser, coins, usd, lifetimeMined, {
            upgrades,
            balances,
            boosterInventory: inventory,
            activeBoosters,
            dailyReward,
            activeCrypto
          });
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

  const transferToMT5 = (amountUSD: number): boolean => {
    if (usd >= amountUSD && amountUSD > 0) {
      const nextUsd = Math.max(0, usd - amountUSD);
      setUsd(nextUsd);
      localStorage.setItem('fast_miner_usd', nextUsd.toString());
      setNotification(`📈 Sync: Transferred $${amountUSD.toFixed(2)} USD to connected MetaTrader 5 live account.`);
      return true;
    }
    return false;
  };

  const [lifetimeMined, setLifetimeMined] = useState<number>(() => {
    const saved = localStorage.getItem('fast_miner_lifetime');
    return saved ? parseFloat(saved) : 0;
  });
  
  // --- Active Tab ---
  const [activeTab, setActiveTab ] = useState<'mine' | 'upgrades' | 'market' | 'payouts' | 'emails' | 'explorer' | 'alpha_hub' | 'support'>('mine');

  // --- Simulated Blockchain Blocks ---
  const [simulatedBlocks, setSimulatedBlocks] = useState<SimulatedBlock[]>(() => {
    const saved = localStorage.getItem('fast_miner_simulated_blocks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    const initialHistory: SimulatedBlock[] = [];
    const cryptos = ['HSC', 'BTC', 'ETH', 'SOL', 'DOGE', 'ALPHA'];
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
      DOGE: 5092044,
      ALPHA: 452901
    };

    const difficulties: Record<string, string> = {
      HSC: '8.52 G',
      BTC: '78.43 T',
      ETH: '12.50 P',
      SOL: '44.82 M',
      DOGE: '11.85 M',
      ALPHA: '22.15 G'
    };

    const rewards: Record<string, number> = {
      HSC: 100,
      BTC: 3.125,
      ETH: 2.0,
      SOL: 1.5,
      DOGE: 10000,
      ALPHA: 250
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
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    
    // Seed initial mock transactions if empty so recipient claim is immediately testable
    const now = Date.now();
    const seeded: PayoutTransaction[] = [
      {
        id: 'tx_transfer_in_1',
        amountCoin: 15.50,
        amountUSD: 2208.75,
        address: '0x_self_active_node',
        status: 'pending',
        verificationStatus: 'unverified',
        timestamp: now - 3600000 * 4,
        txHash: '0x9d4a8f9e1c4b7a3d2e5f8b9a0c1d2e3f4a5b6c7d',
        fee: 0.08,
        blockNumber: 6420114,
        type: 'transfer',
        crypto: 'HSC',
        isTransfer: true,
        transferType: 'in',
        senderAddress: '0x882a9b3c4f5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
        recipientName: 'My Cloud Miner Core',
        recipientConfirmed: false
      },
      {
        id: 'tx_transfer_in_2',
        amountCoin: 120.00,
        amountUSD: 45.60,
        address: '0x_self_active_node',
        status: 'pending',
        verificationStatus: 'unverified',
        timestamp: now - 3600000 * 24,
        txHash: '0xa41c9b3d8f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c',
        fee: 1.8,
        blockNumber: 6418903,
        type: 'transfer',
        crypto: 'DOGE',
        isTransfer: true,
        transferType: 'in',
        senderAddress: '0xdoge_validator_peer_west_99',
        recipientName: 'My Cloud Miner Core',
        recipientConfirmed: false
      },
      {
        id: 'tx_hist_1',
        amountCoin: 45.00,
        amountUSD: 45.00,
        address: 'paypal_iconfarvie@gmail.com',
        status: 'confirmed',
        verificationStatus: 'verified',
        timestamp: now - 3600000 * 180, // ~7.5 days ago
        txHash: '0x45a901f4c78b5e28a9c3d41e2f3d4c5c6e7f8b9a',
        fee: 0.68,
        blockNumber: 6410290,
        type: 'cash',
        gateway: 'paypal',
        gatewayDetails: 'paypal_iconfarvie@gmail.com'
      },
      {
        id: 'tx_hist_2',
        amountCoin: 30.00,
        amountUSD: 4275.00,
        address: '0x328ea8fb9c3d4b1a2e3f4c5d6e7a8b9c0d1e2f3a',
        status: 'confirmed',
        verificationStatus: 'verified',
        timestamp: now - 3600000 * 120, // 5 days ago
        txHash: '0x882a3c4f5e6d7f8d9a0c1b2f3a4e5f6c7a8b9c0d',
        fee: 0.15,
        blockNumber: 6413498,
        type: 'crypto',
        crypto: 'HSC'
      },
      {
        id: 'tx_hist_3',
        amountCoin: 0.0085,
        amountUSD: 807.50,
        address: 'bc1qf5ea89c4d3a2e3f4c5d6e7f8a9b0c1d2e3f4a5b',
        status: 'confirmed',
        verificationStatus: 'verified',
        timestamp: now - 3600000 * 72, // 3 days ago
        txHash: '0xf9d8c7b6a5e4d3c2b1a0f8e7d6c5b4a3c2b1a0f8',
        fee: 0.0001,
        blockNumber: 6415982,
        type: 'crypto',
        crypto: 'BTC'
      },
      {
        id: 'tx_hist_4',
        amountCoin: 220.00,
        amountUSD: 83.60,
        address: '0x992a8fc3401fb9be2d3a4ef5c6d7a8bf627def48',
        status: 'confirmed',
        verificationStatus: 'verified',
        timestamp: now - 3600000 * 30, // 1.25 days ago
        txHash: '0x6e7d8c9b0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
        fee: 1.5,
        blockNumber: 6419208,
        type: 'crypto',
        crypto: 'DOGE'
      }
    ];
    localStorage.setItem('fast_miner_payouts', JSON.stringify(seeded));
    return seeded;
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
    status: UserTransaction['status'] = 'CONFIRMED',
    overrideRef?: string
  ): UserTransaction => {
    const characters = '0123456789ABCDEF';
    let blockchainHash = '0x';
    for (let i = 0; i < 40; i++) {
      blockchainHash += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const prefixes: Record<string, string> = {
      'COIN_SELL': 'REF-SWAP',
      'UPGRADE_BUY': 'REF-UPG',
      'BOOSTER_ACTIVATE': 'REF-BST',
      'WITHDRAWAL': 'REF-DSP',
      'CUSTOM_GENERATED': 'REF-TXT'
    };
    const prefix = prefixes[type] || 'REF-TX';
    const randSegment = Math.floor(100000 + Math.random() * 900000);
    const referenceNumber = overrideRef || `${prefix}-${randSegment}`;

    const newTx: UserTransaction = {
      id: `tx-user-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      referenceNumber,
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

  const sendSovereignMail = async (subject: string, bodyText: string, recipientEmail?: string) => {
    const targetEmail = recipientEmail || user?.email || 'operator@hashsovereign.net';
    if (!targetEmail) return;

    const prefix = subject.includes('Delivery') ? '🎁' : '⚡';
    const isGCSell = subject.includes('Voucher') || subject.includes('Gift');
    const sender = isGCSell 
      ? 'Alpha LLC Miner Merchant <merchant@hashsovereign.net>'
      : 'Alpha Sovereign Clearing <clearing@hashsovereign.net>';

    const newEmail = {
      id: `mock_mail_sec_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      subject: `${prefix} ${subject}`,
      from: sender,
      snippet: bodyText.split('\n')[0] || subject,
      body: bodyText,
      date: new Date().toLocaleString()
    };

    // Save to local sandbox simulated mail inbox
    const savedEmails = localStorage.getItem('hash_sovereign_mock_emails');
    let emailArray = [];
    if (savedEmails) {
      try { emailArray = JSON.parse(savedEmails); } catch(e) {}
    }
    emailArray = [newEmail, ...emailArray];
    localStorage.setItem('hash_sovereign_mock_emails', JSON.stringify(emailArray));

    // Try live dispatch with Google OAuth token if active
    try {
      const { getAccessToken: fetchToken } = await import('../firebase');
      const token = await fetchToken();
      if (token) {
        const messageContent = [
          `To: ${targetEmail}`,
          'Content-Type: text/plain; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${prefix} ${subject}`,
          '',
          bodyText,
        ].join('\n');

        const encodedMessage = btoa(unescape(encodeURIComponent(messageContent)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedMessage })
        });
        console.log(`Live Authenticated Google Workspace Dispatch for: "${subject}" sent.`);
      }
    } catch (err) {
      console.warn('Real Workspace/Gmail API token send skipped (sandbox or unauthenticated):', err);
    }
  };

  // --- Performance Stats History Engine ---
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceRecord[]>(() => {
    const saved = localStorage.getItem('fast_miner_perf_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('fast_miner_perf_history', JSON.stringify(performanceHistory));
  }, [performanceHistory]);

  const clearPerformanceHistory = () => {
    setPerformanceHistory([]);
    localStorage.removeItem('fast_miner_perf_history');
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
    if (saved) {
      try {
        const parsed: ActiveBooster[] = JSON.parse(saved);
        const unique: ActiveBooster[] = [];
        const seen = new Set<string>();
        for (const b of parsed) {
          if (b && b.id && !seen.has(b.id)) {
            seen.add(b.id);
            unique.push(b);
          }
        }
        return unique;
      } catch (e) {}
    }
    return [];
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
    playSound('booster');
    speakVoice(`Compensation claimed successfully. Daily reward level ${nextStreak} activated.`);
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
      playSound('toggle');
      
      const boosterName = boosterType === 'permanent' ? 'Silicon Core Purity (Permanent Boost)' : boosterType === 'overclock' ? 'Overclock Serum' : boosterType === 'cryo' ? 'Cryo-Freeze Capsule' : 'Bullish News Spray';
      const loggedTx = logUserTransaction(
        'UPGRADE_BUY', 
        `Buy Booster: ${boosterName}`, 
        `${cost} HSC`, 
        'Booster Inventory System'
      );
      
      sendSovereignMail(
        `Booster Acquired: ${boosterName} Enroute`,
        `====================================================
ALPHA MARKETPLACE - ASSET TRANSACTION RECORD
====================================================
Order Status: COMPLETED
Reference Number: ${loggedTx.referenceNumber || 'N/A'}
Acquisition: 1x ${boosterName}
Cost: ${cost} HSC Coins
Timestamp: ${new Date().toLocaleString()}
Recipient Node: ${user?.email || 'Sovereign Core'}

Booster Details:
----------------------------------------------------
The booster item has been successfully added to your secure hardware inventory. You can trigger this booster at any moment from the main dashboard to modify hash rates, energy cooling, or news sentiment.
====================================================
Alpha Sovereign Trade Registry
ops@hashsovereign.net`
      );

      setNotification(`Item Purchased: Unlocked 1x ${boosterName} in inventory!`);
      speakVoice(`Booster purchase authorized. One unit of ${boosterName} received.`);
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
      
      const bstName = boosterType === 'overclock' ? 'Overclock Serum' : boosterType === 'cryo' ? 'Cryo-Freeze Capsule' : 'Bullish News Spray';
      const bstMult = boosterType === 'overclock' ? 1.5 : boosterType === 'cryo' ? 0.3 : 1.25;

      const newBooster: ActiveBooster = {
        id: `booster_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: boosterType,
        name: bstName,
        duration: 60,
        remaining: 60,
        multiplier: bstMult
      };
      
      setActiveBoosters(prev => [...prev, newBooster]);
      playSound('booster');

      if (boosterType === 'overclock') {
        speakVoice("Swell warning. Core overclock injection sequence initiated. Processors hashing at maximum load.");
      } else if (boosterType === 'cryo') {
        speakVoice("Coolant venting. Cryo freeze capsule depressurized. Reactor core temperature dropping.");
      } else {
        speakVoice("News feed booster active. Transmitting high density bullish sentiment.");
      }

      const loggedTx = logUserTransaction(
        'BOOSTER_ACTIVATE', 
        `Activate Booster: ${bstName}`, 
        `1x Capsule`, 
        'Rig Cooling & Hashing Chambers'
      );

      sendSovereignMail(
        `Reactor Boost Activated: ${bstName} On-Line`,
        `====================================================
ALPHA HARDWARE SYSTEMS - REACTOR EMISSION LOG
====================================================
Log Event: ACTIVE BOOST INJECTED
Reference Number: ${loggedTx.referenceNumber || 'N/A'}
Booster Type: ${bstName}
Multiplier: ${bstMult}x Effect
Duration: 60 Seconds Operational Venting
Timestamp: ${new Date().toLocaleString()}

Operational Alert:
----------------------------------------------------
Cores have been overclocked or cryogenic coolers initialized. Monitor system thermals to ensure peak efficiency.
====================================================
Alpha Sovereign Reactor Management
ops@hashsovereign.net`
      );

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
    isDynamicCoolingActive,
    stats,
    activeMiners,
    mineAllCoins,
    isSystemOn,
    balances,
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
      isDynamicCoolingActive,
      stats,
      activeMiners,
      mineAllCoins,
      isSystemOn,
      balances,
    };
  }, [upgrades, activeBoosters, inventory, isClusterAutoMining, prices, activeCrypto, coins, usd, lifetimeMined, user, isDynamicCoolingActive, stats, activeMiners, mineAllCoins, isSystemOn, balances]);

  const syncUserProfile = async (
    targetUser = user,
    targetCoins = coins,
    targetUsd = usd,
    targetLifetime = lifetimeMined,
    passedUpgrades: MiningUpgrade[] | undefined = undefined,
    passedInventory: BoosterInventory | undefined = undefined,
    passedBalances: Record<string, number> | undefined = undefined
  ) => {
    if (!targetUser || targetUser.uid.startsWith('user_')) return;
    try {
      const { saveUserProfile } = await import('../firebaseSync');
      const current = miningStateRef.current;
      await saveUserProfile(targetUser.uid, targetUser, targetCoins, targetUsd, targetLifetime, {
        upgrades: passedUpgrades ?? current.upgrades,
        balances: passedBalances ?? current.balances,
        boosterInventory: passedInventory ?? current.inventory,
        activeBoosters: current.activeBoosters,
        dailyReward,
        activeCrypto: current.activeCrypto
      });
    } catch (err: any) {
      console.warn('Real-time ledger sync bypassed or failed (expected for sandbox accounts):', err);
    }
  };

  // Auto-save fast-changing variables periodically (every 3 seconds) to prevent heavy main thread blocking
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      const current = miningStateRef.current;
      localStorage.setItem('fast_miner_coins', current.coins.toString());
      localStorage.setItem('fast_miner_usd', current.usd.toString());
      localStorage.setItem('fast_miner_lifetime', current.lifetimeMined.toString());

      // Append real-time performance logging record
      const newRec: PerformanceRecord = {
        id: `perf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        hashRate: current.stats.hashRate,
        temperature: current.stats.temperature,
        powerDraw: current.stats.powerDraw,
        efficiency: current.stats.efficiency,
        activeCrypto: current.activeCrypto,
      };
      setPerformanceHistory(prev => [...prev, newRec].slice(-1000));

      // If simulated mode is disabled and they are logged in, sync instantly to database and append storage log
      if (current.user && current.user.uid && !current.user.uid.startsWith('user_')) {
        const isSimDisabled = localStorage.getItem('fast_miner_disable_simulation') === 'true';
        if (isSimDisabled) {
          try {
            await syncUserProfile(current.user, current.coins, current.usd, current.lifetimeMined);
            
            const timestamp = new Date().toLocaleTimeString();
            const logLine = `[storage] [${timestamp}] Saved state to database (UID: ${current.user.uid.substring(0,8)}...). Balance = ${current.coins.toFixed(6)} ${current.activeCrypto}, Valuation = $${current.usd.toFixed(2)}`;
            console.log(logLine);
            setRealtimeStorageLogs(prev => [logLine, ...prev].slice(0, 50));
          } catch (e: any) {
            console.warn('Real-time database save failed:', e);
          }
        }
      }
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
    const { upgrades: curUpgrades, activeBoosters: curBoosters, inventory: curInventory, isClusterAutoMining: curCluster, isDynamicCoolingActive: curDynamicCooling } = miningStateRef.current;
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

    if (curDynamicCooling) {
      // Dynamic cooling PROFILE: Automatically scales fan intensity.
      // Based on real-time temperature feedback from the node's thermal sensors,
      // we boost cooling power as temperature climbs past 45°C.
      const currentTemp = tempRef.current;
      if (currentTemp > 45) {
        // Max boost factor scales up to 3.0x scaling of cooling capacity to actively fight over-throttling!
        const thermalSurge = Math.min(3.0, 1.0 + (currentTemp - 45) * 0.04);
        coolingPower *= thermalSurge;
      }
    }

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
      const { upgrades: curUpgrades, prices: curPrices, activeCrypto: curCrypto, activeMiners: curActiveMiners, isSystemOn: curSystemOn } = miningStateRef.current;
      
      if (!curSystemOn) {
        tempRef.current = 24.0;
        setStats({
          hashRate: 0,
          efficiency: 0,
          powerDraw: 0,
          temperature: 24.0,
          thermalCap: 95.0,
          throttled: false,
        });
        return;
      }

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
        // Filter out which miners are currently active
        const enabledMiners = Object.entries(curActiveMiners || {})
          .filter(([_, enabled]) => enabled)
          .map(([c]) => c);

        if (enabledMiners.length > 0) {
          // Split of hashrate equally among active miners
          const splitHash = actualHashrate / enabledMiners.length;
          const hscBasePrice = 142.50;
          let activeCryptoEarnings = 0;
          let totalAddedLifetime = 0;

          // Helper object to store incremental additions to non-active miners
          const balancesToAdd: Record<string, number> = {};

          enabledMiners.forEach(coin => {
            const coinPrice = curPrices[coin] || hscBasePrice;
            const hscEarningsPerSec = splitHash * 0.008;
            const scaledEarningsPerSec = (hscEarningsPerSec * hscBasePrice) / coinPrice;
            const tickEarnings = scaledEarningsPerSec * 0.1; // 100ms tick

            totalAddedLifetime += tickEarnings;

            if (coin === curCrypto) {
              activeCryptoEarnings = tickEarnings;
            } else {
              balancesToAdd[coin] = tickEarnings;
            }
          });

          // Update active viewer coin
          if (activeCryptoEarnings > 0) {
            setCoins(c => c + activeCryptoEarnings);
          }

          // Update lifetime accumulator
          if (totalAddedLifetime > 0) {
            setLifetimeMined(lm => lm + totalAddedLifetime);
          }

          // Update any secondary active coins balances directly
          if (Object.keys(balancesToAdd).length > 0) {
            setBalances(prev => {
              const next = { ...prev };
              Object.entries(balancesToAdd).forEach(([coin, amt]) => {
                next[coin] = (next[coin] || 0) + amt;
              });
              localStorage.setItem('fast_miner_balances', JSON.stringify(next));
              return next;
            });
          }
        }

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
      const isSimDisabled = localStorage.getItem('fast_miner_disable_simulation') === 'true';
      if (isSimDisabled) {
        return; // Halt system simulation threads to log real database syncs
      }
      const { activeCrypto: curCrypto, isClusterAutoMining: curCluster, prices: curPrices, isSystemOn: curSystemOn } = miningStateRef.current;
      if (!curSystemOn) {
        return; // Halt transaction simulation during shutdown
      }
      const cryptos = ['BTC', 'HSC', 'ETH', 'SOL', 'DOGE', 'ALPHA'];
      const randomCrypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      
      const addresses = {
        HSC: '0xSovereign_Gateway_Node_',
        BTC: '1Bitcoin_Daemon_Peer_',
        ETH: '0xEthereum_Arbitrum_L2_',
        SOL: 'Solana_Validator_Web3_',
        DOGE: 'DogeCore_Mempool_Peer_',
        ALPHA: 'ALFA_Sovereign_Main_Node_',
      } as Record<string, string>;

      const randomAddr = (addresses[randomCrypto] || '0xAddr_') + Math.floor(1000 + Math.random() * 9000);
      const amountSeed = {
        HSC: 1.5 + Math.random() * 25.0,
        BTC: 0.00015 + Math.random() * 0.0008,
        ETH: 0.005 + Math.random() * 0.045,
        SOL: 0.05 + Math.random() * 0.45,
        DOGE: 12.0 + Math.random() * 50.0,
        ALPHA: 5.0 + Math.random() * 20.0,
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
                        (gw.id === 'hsc_rpc' && randomCrypto === 'HSC') ||
                        (gw.id === 'alpha_rpc' && randomCrypto === 'ALPHA');
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
              DOGE: 10,
              ALPHA: 1.0
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
            DOGE: '11.85 M',
            ALPHA: '22.15 G'
          };

          const rewards: Record<string, number> = {
            HSC: 100,
            BTC: 3.125,
            ETH: 2.0,
            SOL: 1.5,
            DOGE: 10000,
            ALPHA: 250
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
    if (!isSystemOn) {
      setNotification("⚠️ Operations Offline. Turn system power ON to activate mining reactor!");
      return;
    }
    playSound('click');
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

        speakVoice(`Mainframe stacked. Upgrading core ${item.name} to level ${nextLevel}.`);

        const loggedTx = logUserTransaction(
          'UPGRADE_BUY',
          `Upgrade hardware: ${item.name} to Lvl ${nextLevel}`,
          `$${item.cost.toLocaleString()}`,
          'Hardware Inventory System'
        );

        sendSovereignMail(
          `Hardware Dispatch: ${item.name} Level ${nextLevel} Cleared`,
          `====================================================
ALPHA SOVEREIGN MANUFACTURING - SYSTEM DISPATCH
====================================================
Order Status: ASSEMBLED AND RACKED
Reference Number: ${loggedTx.referenceNumber || 'N/A'}
Asset Category: Hardware Mainframe Upgrade
Timestamp: ${new Date().toLocaleString()}
Device Owner: ${user?.email || 'System Network Operator'}

Receipt Specifications:
----------------------------------------------------
Target Rig Core: ${item.name}
Target Tier: Level ${nextLevel} Setup
Acquisition Cost: $${item.cost.toLocaleString()} USD

Rig Efficiency Impact:
----------------------------------------------------
Power Threshold: Upgraded
Decentralized Hash Power Capacity: Increased
====================================================
This is an authenticated, cryptographically signed hardware receipt.
Alpha Sovereign Clearing Network
ops@hashsovereign.net`
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
      playSound('trade');
      speakVoice(`Trade executed. Sold ${amount.toFixed(3)} ${activeCrypto} coins for ${gainedUSD.toFixed(2)} dollars.`);

      const loggedTx = logUserTransaction(
        'COIN_SELL',
        `Sold ${amount.toFixed(4)} ${activeCrypto} Coins`,
        formatVal(gainedUSD),
        'DEX Liquidity Pool'
      );

      addToast({
        type: 'success',
        title: 'Trade Finalized',
        message: `Successfully sold ${amount.toFixed(4)} ${activeCrypto} for ${formatVal(gainedUSD)}`,
        referenceNumber: loggedTx.referenceNumber
      });

      sendSovereignMail(
        `Trade Settlement: Sold ${amount.toFixed(4)} ${activeCrypto} Cleared`,
        `====================================================
ALPHA SOVEREIGN DEX LIQUIDITY EXCHANGE
====================================================
Trade Status: SETTLED & ARCHIVED
Reference Number: ${loggedTx.referenceNumber || 'N/A'}
Liquidity Pool: ${activeCrypto} / USD Automated Clearing
Timestamp: ${new Date().toLocaleString()}
Account Owner: ${user?.email || 'Anonymous Operator'}

Exchange Slip:
----------------------------------------------------
Sold Volume: ${amount.toFixed(4)} ${activeCrypto}
Market Clearing Price: $${marketPrice.toFixed(2)} USD per Coin
Settled Proceeds: $${gainedUSD.toFixed(2)} USD
Recipient: Local Account USD Balance (Primary Asset Ledger)
====================================================
This trade has been recorded and verified by consensus nodes.
Alpha Sovereign Liquidity Exchange
trading@hashsovereign.net`
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
      const amount = coins;
      const gainedUSD = coins * marketPrice;
      const nextCoins = 0;
      const nextUsd = usd + gainedUSD;
      setCoins(nextCoins);
      setUsd(nextUsd);
      playSound('trade');
      speakVoice(`Trade executed. Exchanged all remaining ${amount.toFixed(3)} ${activeCrypto} coins for ${gainedUSD.toFixed(2)} dollars.`);

      const loggedTx = logUserTransaction(
        'COIN_SELL',
        `Sold All ${amount.toFixed(4)} ${activeCrypto} Coins`,
        formatVal(gainedUSD),
        'DEX Liquidity Pool'
      );

      addToast({
        type: 'success',
        title: 'Trade Finalized',
        message: `Successfully sold ${amount.toFixed(4)} ${activeCrypto} for ${formatVal(gainedUSD)}`,
        referenceNumber: loggedTx.referenceNumber
      });

      sendSovereignMail(
        `Trade Settlement: Sold All ${amount.toFixed(4)} ${activeCrypto} Cleared`,
        `====================================================
ALPHA SOVEREIGN DEX LIQUIDITY EXCHANGE
====================================================
Trade Status: SETTLED & ARCHIVED
Reference Number: ${loggedTx.referenceNumber || 'N/A'}
Liquidity Pool: ${activeCrypto} / USD Automated Clearing
Timestamp: ${new Date().toLocaleString()}
Account Owner: ${user?.email || 'Anonymous Operator'}

Exchange Slip:
----------------------------------------------------
Sold Volume: ${amount.toFixed(4)} ${activeCrypto}
Market Clearing Price: $${marketPrice.toFixed(2)} USD per Coin
Settled Proceeds: $${gainedUSD.toFixed(2)} USD
Recipient: Local Account USD Balance (Primary Asset Ledger)
====================================================
This trade has been recorded and verified by consensus nodes.
Alpha Sovereign Liquidity Exchange
trading@hashsovereign.net`
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
            const floor = cryptoKey === 'DOGE' ? 0.01 : cryptoKey === 'ALPHA' ? 0.05 : cryptoKey === 'SOL' ? 5.0 : cryptoKey === 'ETH' ? 50.0 : cryptoKey === 'BTC' ? 1000.0 : 12.0;
            nextPrice = Math.max(floor, nextPrice);
            const decimals = cryptoKey === 'DOGE' || cryptoKey === 'ALPHA' ? 4 : 2;
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
      const payoutRef = `REF-DSP-${Math.floor(100000 + Math.random() * 900000)}`;

      const newTx: PayoutTransaction = {
        id: `tx_${Date.now()}`,
        referenceNumber: payoutRef,
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
        'PENDING',
        payoutRef
      );

      addToast({
        type: 'success',
        title: 'Withdrawal Initialized',
        message: `Requested payment of $${usdAmount.toFixed(2)} USD via ${gateway.toUpperCase()}`,
        referenceNumber: payoutRef
      });

      speakVoice(`Withdrawal request of ${usdAmount.toFixed(2)} dollars initiated. Dispatching transaction via ${gateway.toUpperCase()}.`);

      sendSovereignMail(
        `Withdrawal Dispatched: ${usdAmount} USD Clear Log`,
        `====================================================
ALPHA SOVEREIGN SETTLEMENT PIPELINE - DISPATCH
====================================================
Settlement Status: MEMPOOL QUEUED / ACTIVE HANDSHAKE
Reference Number: ${payoutRef}
Pipeline Gateway: ${gateway.toUpperCase()} (${gatewayDetails || 'Default Routing'})
Target Destination ID: ${address}
Gas / Network Fees: $${(usdAmount * 0.015).toFixed(2)} USD
Consensus Block Height: #${blockNum}
Timestamp: ${new Date().toLocaleString()}

Payout Details:
----------------------------------------------------
Settled Amount: $${usdAmount.toFixed(2)} USD (approx. ${hscEquiv.toFixed(4)} HSC)

Sovereign Secure Audit Notice:
----------------------------------------------------
All external settlement pipelines carry automatic AML verification audits. Go to the Payouts tab to finalize compliance signatures, clear validation holds, and avoid processing freezes.
====================================================
This transaction is secured using SHA-256 decentralized block hash.
Alpha Sovereign Clearing Network
payouts@hashsovereign.net`
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
      speakVoice(`Transfer of ${cryptoAmount.toFixed(crypto === 'DOGE' ? 0 : 2)} ${crypto} initialized. Transaction dispatched to secure block pool.`);
      
      return { success: true, message: 'Cryptocurrency transfer successful!', tx: newTx };
    } else {
      return { success: false, message: `Insufficient ${crypto} balance. Mine more to complete dispatch!` };
    }
  };

  const initiateAssetTransfer = (crypto: string, recipientAddress: string, amount: number, name?: string) => {
    if (!recipientAddress || recipientAddress.length < 8) {
      return { success: false, message: 'Invalid recipient wallet key format.' };
    }

    const coinBalance = crypto === activeCrypto ? coins : (balances[crypto] ?? 0);

    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid amount higher than 0.' };
    }

    if (coinBalance < amount) {
      return { success: false, message: `Insufficient ${crypto} balance.` };
    }

    let nextCoins = coins;
    let nextBalances = { ...balances };

    // Deduct from sender's balance
    if (crypto === activeCrypto) {
      nextCoins -= amount;
      setCoins(nextCoins);
    } else {
      nextBalances[crypto] -= amount;
      setBalances(nextBalances);
      localStorage.setItem('fast_miner_balances', JSON.stringify(nextBalances));
    }

    const cryptoPrice = prices[crypto] || 1.0;
    const usdValue = amount * cryptoPrice;
    const feeAmount = amount * 0.005; // 0.5% peer transfer gas fee

    const characters = '0123456789abcdef';
    let txHash = '0x';
    for (let i = 0; i < 48; i++) {
      txHash += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const blockNum = Math.floor(6305000 + Math.random() * 250000);
    const transferRef = `REF-DSP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: PayoutTransaction = {
      id: `tx_transfer_${Date.now()}`,
      referenceNumber: transferRef,
      amountCoin: Number(amount.toFixed(crypto === 'DOGE' ? 2 : 5)),
      amountUSD: Number(usdValue.toFixed(2)),
      address: recipientAddress,
      status: 'pending',
      verificationStatus: 'unverified',
      timestamp: Date.now(),
      txHash,
      fee: Number(feeAmount.toFixed(crypto === 'DOGE' ? 2 : 5)),
      blockNumber: blockNum,
      type: 'transfer',
      crypto: crypto,
      
      isTransfer: true,
      transferType: 'out',
      senderAddress: payoutAddress || '0x_self_active_node',
      recipientName: name || 'Peer Cryptographic Node',
      recipientConfirmed: false,
    };

    setPayouts(prev => {
      const updated = [newTx, ...prev];
      localStorage.setItem('fast_miner_payouts', JSON.stringify(updated));
      return updated;
    });

    logUserTransaction(
      'WITHDRAWAL',
      `Asset Transfer initiated: ${amount.toFixed(4)} ${crypto} P2P`,
      `${amount.toFixed(4)} ${crypto} (≈ $${usdValue.toLocaleString()})`,
      recipientAddress,
      'PENDING',
      transferRef
    );

    addToast({
      type: 'success',
      title: 'P2P Transfer Dispatched',
      message: `Dispatched ${amount.toFixed(4)} ${crypto} to ${name || recipientAddress.slice(0, 10)}...`,
      referenceNumber: transferRef
    });

    sendSovereignMail(
      `P2P Transfer Dispatched: ${amount.toFixed(4)} ${crypto} Sent`,
      `====================================================
ALPHA SOVEREIGN P2P BLOCKCHAIN DISPATCH
====================================================
Dispatch Status: DISPATCHED / AWAITING REACH-BACK
Reference Number: ${transferRef}
Cryptocurrency: ${crypto}
Target Recipient Node: ${recipientAddress}
Recipient Alias: ${name || 'Peer Cryptographic Node'}
Network Fee: ${feeAmount.toFixed(5)} ${crypto}
Consensus Block Height: #${blockNum}
Timestamp: ${new Date().toLocaleString()}

Transfer Slip:
----------------------------------------------------
Transferred Amount: ${amount.toFixed(4)} ${crypto}
USD Equivalent: $${usdValue.toFixed(2)} USD
====================================================
This P2P transfer is recorded in the blockchain ledger.
Alpha Sovereign Clearing Network
ops@hashsovereign.net`
    );

    // Sync to Firestore if user profile exists
    if (user && !user.uid.startsWith('user_')) {
      import('../firebaseSync').then(async ({ savePayoutTransaction, saveUserProfile }) => {
        try {
          await savePayoutTransaction(user.uid, newTx);
          await saveUserProfile(user.uid, user, nextCoins, usd, lifetimeMined);
        } catch (err) {
          console.error('Error syncing asset transfer to Firestore:', err);
        }
      });
    }

    setNotification(`P2P Transfer of ${amount.toFixed(4)} ${crypto} dispatched! Awaiting recipient handshake...`);
    playSound('trade');
    return { success: true, message: 'Transfer dispatched successfully!', tx: newTx };
  };

  const confirmAssetTransfer = async (txId: string): Promise<{ success: boolean; message: string }> => {
    let targetTx: PayoutTransaction | undefined;
    
    // Find transaction
    setPayouts(prev => {
      const idx = prev.findIndex(t => t.id === txId);
      if (idx !== -1) {
        targetTx = prev[idx];
      }
      return prev;
    });

    if (!targetTx) {
      return { success: false, message: 'Transaction hash not found.' };
    }

    if (targetTx.status === 'confirmed' || targetTx.recipientConfirmed) {
      return { success: false, message: 'Transfer is already settled and confirmed.' };
    }

    // Update state to confirmed
    const updatedPayouts = payouts.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'confirmed' as const,
          verificationStatus: 'verified' as const,
          recipientConfirmed: true,
          recipientConfirmedAt: Date.now()
        };
      }
      return t;
    });

    setPayouts(updatedPayouts);
    localStorage.setItem('fast_miner_payouts', JSON.stringify(updatedPayouts));

    // Credit recipient balance
    const crypto = targetTx.crypto || 'HSC';
    const amountCoin = targetTx.amountCoin || 0;

    if (targetTx.transferType === 'in' || targetTx.address === payoutAddress || targetTx.address === '0x_self_active_node') {
      if (crypto === activeCrypto) {
        setCoins(c => c + amountCoin);
      } else {
        setBalances(prev => {
          const updated = { ...prev, [crypto]: (prev[crypto] ?? 0) + amountCoin };
          localStorage.setItem('fast_miner_balances', JSON.stringify(updated));
          return updated;
        });
      }
    }

    logUserTransaction(
      'CUSTOM_GENERATED',
      `Asset Received & Confirmed: ${amountCoin.toFixed(4)} ${crypto}`,
      `${amountCoin.toFixed(4)} ${crypto}`,
      targetTx.senderAddress || 'Peer Node Relay',
      'VERIFIED'
    );

    // Sync to Firestore if user profile exists
    if (user && !user.uid.startsWith('user_')) {
      const finalTx = updatedPayouts.find(t => t.id === txId);
      if (finalTx) {
        const { savePayoutTransaction, saveUserProfile } = await import('../firebaseSync');
        try {
          await savePayoutTransaction(user.uid, finalTx);
          let currentCoins = coins;
          if (crypto === activeCrypto) {
            currentCoins += amountCoin;
          }
          await saveUserProfile(user.uid, user, currentCoins, usd, lifetimeMined);
        } catch (err) {
          console.error('Error syncing recipient confirmation to Firestore:', err);
        }
      }
    }

    setNotification(`Transaction successfully settled! Handshake established with peer.`);
    return { success: true, message: 'Transfer settled successfully!' };
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
      ALPHA: 0,
    });
    setPrices({
      HSC: 142.50,
      BTC: 96500.00,
      ETH: 3450.00,
      SOL: 185.00,
      DOGE: 0.38,
      ALPHA: 2.15,
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
    setIsSystemOnState(prev => {
      const next = !prev;
      localStorage.setItem('fast_miner_system_on', next ? 'true' : 'false');
      if (!next) {
        playSound('shutdown');
        setIsClusterAutoMiningState(false);
        tempRef.current = 24.0;
        isThrottledRef.current = false;
        setStats(prevStats => ({ ...prevStats, temperature: 24.0, hashRate: 0, powerDraw: 0, efficiency: 0, throttled: false }));
        setNotification("POWER STATUS: EMERGENCY SHUTDOWN. All mining cores decoupled, thermal vents depressurized.");
      } else {
        playSound('startup');
        setIsClusterAutoMiningState(true);
        setNotification("POWER STATUS: ONLINE. Decentralized fast-hash mainframes initialized and active.");
      }
      return next;
    });
  };

  const buyGiftCards = (cart: Array<{ brand: string; value: number; qty: number }>, deliverEmail: string) => {
    if (!deliverEmail || !deliverEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid recipient email address.' };
    }

    const totalCost = cart.reduce((acc, item) => acc + (item.value * item.qty), 0);
    if (totalCost <= 0) {
      return { success: false, message: 'Please select at least one gift card.' };
    }

    // Calculate total layout balance
    const currentTotalEarnings = usd + Object.entries(balances || {}).reduce((acc, [crypto, amt]) => {
      const actualAmt = crypto === activeCrypto ? coins : amt;
      const price = prices[crypto] || 0;
      return acc + (actualAmt * price);
    }, 0);

    if (currentTotalEarnings < totalCost) {
      return { success: false, message: `Insufficient total account valuation. You need $${totalCost.toFixed(2)} USD to check out.` };
    }

    // Deduct funds
    let remaining = totalCost;
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

    const activeCryptoPrice = prices[activeCrypto] || 142.50;

    if (remaining > 0) {
      const activeCryptoValue = nextCoins * activeCryptoPrice;
      if (activeCryptoValue >= remaining) {
        const coinsToDeduct = remaining / activeCryptoPrice;
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

    // Generate gift card details and codes
    const formattedCards = cart.map(item => {
      const codes = [];
      for (let i = 0; i < item.qty; i++) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = `${item.brand.substring(0, 3).toUpperCase()}-`;
        for (let j = 0; j < 4; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        code += '-';
        for (let j = 0; j < 4; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        code += '-';
        for (let j = 0; j < 4; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        codes.push(code);
      }
      return {
        brand: item.brand,
        value: item.value,
        qty: item.qty,
        codes
      };
    });

    const itemsSummary = formattedCards.map(c => `${c.qty}x ${c.brand} Gift Card ($${c.value} USD each)`).join(', ');
    const codesText = formattedCards.map(c => `🔑 ${c.brand} ($${c.value}):\n` + c.codes.map(code => `   • Code: ${code}`).join('\n')).join('\n\n');

    const blockNum = Math.floor(1024300 + Math.random() * 5000);
    const characters = '0123456789abcdef';
    let txHash = '0x';
    for (let i = 0; i < 48; i++) {
       txHash += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const randGCRef = `REF-GIFT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: PayoutTransaction = {
      id: `tx_${Date.now()}`,
      referenceNumber: randGCRef,
      amountCoin: Number((totalCost / activeCryptoPrice).toFixed(4)),
      amountUSD: Number(totalCost.toFixed(2)),
      address: deliverEmail,
      status: 'confirmed',
      timestamp: Date.now(),
      txHash,
      fee: 0,
      blockNumber: blockNum,
      type: 'giftcard' as any,
      crypto: activeCrypto,
      gateway: 'wallet',
      gatewayDetails: itemsSummary
    };

    setPayouts(prev => {
      const updated = [newTx, ...prev];
      localStorage.setItem('fast_miner_payouts', JSON.stringify(updated));
      return updated;
    });

    logUserTransaction(
      'WITHDRAWAL',
      `Bought Gift Cards: ${itemsSummary}`,
      `$${totalCost.toFixed(2)}`,
      deliverEmail,
      'CONFIRMED',
      randGCRef
    );

    addToast({
      type: 'success',
      title: 'Merchant Order Complete',
      message: `Successfully purchased: ${itemsSummary}`,
      referenceNumber: randGCRef
    });

    const primaryBrand = formattedCards[0]?.brand || "vouchers";
    speakVoice(`Merchant order cleared. Successfully dispatched ${primaryBrand} voucher valued at ${totalCost.toFixed(2)} dollars.`);

    if (user && !user.uid.startsWith('user_')) {
      import('../firebaseSync').then(async ({ savePayoutTransaction, saveUserProfile }) => {
        try {
          await savePayoutTransaction(user.uid, newTx);
          await saveUserProfile(user.uid, user, nextCoins, nextUsd, lifetimeMined);
        } catch (err) {
          console.error('Error syncing gift card payout to Firestore:', err);
        }
      });
    }

    // Mock Inbox delivery
    const deliveryBody = `====================================================
ALPHA GLOBAL MERCHANDISE - TRANSACTION RECORD
====================================================
Order Status: AUTHENTICATED & DELIVERED
Reference Number: ${randGCRef}
Merchant Authority: Alpha LLC (Store Gateway Node)
Authentication Status: SSL/OAuth Verified Secured Terminal
Total Purchase Value: $${totalCost.toFixed(2)} USD
Settlement Node: block #${blockNum}
Timestamp: ${new Date().toLocaleString()}
Delivery Recipient: ${deliverEmail}

Purchased Items Summary:
----------------------------------------------------
${itemsSummary}

Voucher Claims Enclosed:
----------------------------------------------------
${codesText}

Terms of Service:
These voucher codes can be redeemed directly on the respective platforms. Once dispatched, digital gift card sales are final and secured.

Best Regards,
Alpha Sovereign Merchant Support
clearing@hashsovereign.net`;

    const newEmail = {
      id: `mock_mail_gc_${Date.now()}`,
      subject: `🎁 Delivery: ${itemsSummary} Dispatched`,
      from: 'Alpha LLC Miner Store <store@hashsovereign.net>',
      snippet: `Your purchased gift vouchers ($${totalCost.toFixed(2)} USD total) have been dispatched to ${deliverEmail}. Codes enclosed.`,
      body: deliveryBody,
      date: new Date().toLocaleString()
    };

    const savedEmails = localStorage.getItem('hash_sovereign_mock_emails');
    let emailArray = [];
    if (savedEmails) {
      try { emailArray = JSON.parse(savedEmails); } catch(e) {}
    }
    emailArray = [newEmail, ...emailArray];
    localStorage.setItem('hash_sovereign_mock_emails', JSON.stringify(emailArray));

    // Send sovereign mail notification
    sendSovereignMail(`🎁 Delivery: ${itemsSummary} Dispatched`, deliveryBody, deliverEmail);

    // Try real send if token available
    import('../firebase').then(({ getAccessToken }) => {
      getAccessToken().then(async token => {
        if (token) {
          try {
            const messageContent = [
              `To: ${deliverEmail}`,
              'Content-Type: text/plain; charset=utf-8',
              'MIME-Version: 1.0',
              `Subject: Delivery: ${itemsSummary} Dispatched`,
              '',
              deliveryBody,
            ].join('\n');

            const encodedMessage = btoa(unescape(encodeURIComponent(messageContent)))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');

            await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ raw: encodedMessage })
            });
            console.log('Real Gmail delivery dispatched successfully for gift cards!');
          } catch (err) {
            console.warn('Real email dispatch failed (scopes or connection expired):', err);
          }
        }
      });
    });

    setNotification(`🎁 Purchased ${cart.reduce((s,i)=>s+i.qty, 0)} gift card items! Deliveries dispatched to ${deliverEmail} (Cloud Mail/Inbox).`);
    playSound('trade');
    return { success: true, message: `Successfully purchased! Codes delivered to recipient: ${deliverEmail}. Open the Cloud Mail tab to view.` };
  };

  const emergencyCooling = () => {
    if (usd >= 25) {
      setUsd(u => u - 25);
      tempRef.current = 32.0;
      isThrottledRef.current = false;
      setStats(prev => ({ ...prev, temperature: 32.0, throttled: false }));
      playSound('toggle');
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
            const providerId = firebaseUser.providerData[0]?.providerId === 'password' ? 'email' : 'google';
            login(
              providerId, 
              firebaseUser.email || firebaseUser.uid, 
              firebaseUser.displayName || (providerId === 'email' ? 'Email Operator' : 'Google Member'), 
              firebaseUser.uid
            );
          },
          () => {
            if (miningStateRef.current.user?.provider === 'google' || miningStateRef.current.user?.provider === 'email') {
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
      const current = miningStateRef.current;
      await syncUserProfile(user, current.coins, current.usd, current.lifetimeMined);
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
      initiateAssetTransfer,
      confirmAssetTransfer,
      activeMiners,
      toggleMiner,
      mineAllCoins,
      setMineAllCoins,

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
      transferToMT5,
      
      // Emergency Actions
      emergencyShutdown,
      emergencyCooling,

      // Real-time Storage logs
      realtimeStorageLogs,
      setRealtimeStorageLogs,

      // Dynamic Cooling Profile
      isDynamicCoolingActive,
      setIsDynamicCoolingActive,

      // Performance Stats Export
      performanceHistory,
      clearPerformanceHistory,

      // System power toggle & Gift Cards store
      isSystemOn,
      setIsSystemOn,
      buyGiftCards,

      // Master sound controls
      soundEnabled,
      setSoundEnabled,
      voicePromptsEnabled,
      setVoicePromptsEnabled,
      appTheme,
      setAppTheme,

      // Toast Notifications System
      toasts,
      addToast,
      removeToast,
      playSound,
    }}>
      {children}
    </MiningContext.Provider>
  );
};
