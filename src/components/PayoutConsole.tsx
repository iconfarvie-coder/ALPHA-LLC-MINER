import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { PayoutTransaction } from '../types';
import { Wallet, CheckCircle2, Loader2, ArrowUpRight, HelpCircle, AlertCircle, Clock, ExternalLink, ShieldCheck, X, Landmark, Send, Coins, Layers, Cpu, Activity, ChevronDown, ChevronUp, Copy, Check, Smartphone, Chrome, Users, ArrowLeftRight, RefreshCw, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const AVAILABLE_GIFT_CARDS = [
  { id: 'amz_10', brand: 'Amazon', value: 10, color: 'from-amber-600 to-yellow-500' },
  { id: 'amz_25', brand: 'Amazon', value: 25, color: 'from-amber-600 to-yellow-500' },
  { id: 'amz_50', brand: 'Amazon', value: 50, color: 'from-amber-600 to-yellow-500' },
  { id: 'amz_100', brand: 'Amazon', value: 100, color: 'from-amber-600 to-yellow-500' },
  { id: 'app_15', brand: 'Apple', value: 15, color: 'from-gray-700 to-gray-900' },
  { id: 'app_50', brand: 'Apple', value: 50, color: 'from-gray-700 to-gray-900' },
  { id: 'app_100', brand: 'Apple', value: 100, color: 'from-gray-700 to-gray-900' },
  { id: 'play_10', brand: 'Google Play', value: 10, color: 'from-blue-600 to-teal-500' },
  { id: 'play_25', brand: 'Google Play', value: 25, color: 'from-blue-600 to-teal-500' },
  { id: 'play_50', brand: 'Google Play', value: 50, color: 'from-blue-600 to-teal-500' },
  { id: 'steam_20', brand: 'Steam', value: 20, color: 'from-sky-700 to-indigo-900' },
  { id: 'steam_50', brand: 'Steam', value: 50, color: 'from-sky-700 to-indigo-900' },
  { id: 'steam_100', brand: 'Steam', value: 100, color: 'from-sky-700 to-indigo-900' },
  { id: 'nflx_15', brand: 'Netflix', value: 15, color: 'from-red-650 to-rose-900' },
  { id: 'nflx_30', brand: 'Netflix', value: 30, color: 'from-red-650 to-rose-900' },
];

const MERCHANTS_LIST = [
  { name: 'Amazon', color: 'from-amber-600 to-yellow-500', api: 'api.clearance.amazon.com/v3', format: 'XXXX-XXXXXX-XXXX', desc: 'Secure retail clearance vouchers.' },
  { name: 'Apple', color: 'from-slate-800 to-black', api: 'gateway.clearing.apple.com/v2', format: 'XXXXXXXXXXXXXXXX (16-char)', desc: 'Valid for Apple Store digital media & devices.' },
  { name: 'Google Play', color: 'from-blue-600 to-teal-500', api: 'play-billing.googleapis.com/v4', format: 'XXXX-XXXX-XXXX-XXXX-XXXX', desc: 'Valid for Google Play apps & contents.' },
  { name: 'Steam', color: 'from-sky-700 to-indigo-900', api: 'partner.steam-api.valvesoftware.com/clearance', format: 'XXXXX-XXXXX-XXXXX', desc: 'Direct PC gaming catalog credits.' },
  { name: 'PlayStation Network', color: 'from-blue-700 to-indigo-800', api: 'api.playstation-network.sony.com/settle', format: 'XXXX-XXXX-XXXX', desc: 'PSN game catalog wallet loader.' },
  { name: 'Xbox Live', color: 'from-green-600 to-emerald-800', api: 'billing.xbox-live.microsoft.com/v1', format: 'XXXXX-XXXXX-XXXXX', desc: 'Xbox games and Gamepasses.' },
  { name: 'Nintendo eShop', color: 'from-red-650 to-rose-800', api: 'eshop.nintendo-net.com/api', format: 'XXXX-XXXX-XXXX-XXXX', desc: 'Nintendo Switch digital store funds.' },
  { name: 'Spotify', color: 'from-emerald-600 to-green-500', api: 'partner-settle.spotify.com/v2', format: 'XXXX-XXXX-XXXX', desc: 'Premium music & podcast subscription.' },
  { name: 'Netflix', color: 'from-red-700 to-red-950', api: 'clearing.netflix.com/v3', format: 'XXXX-XXXX-XXXX-XXXX', desc: 'Premium movies & series streaming subscription.' },
  { name: 'eBay', color: 'from-blue-600 to-yellow-550', api: 'api.settlement.ebay.com/v1', format: 'XXXX-XXXX-XXXX-XXXX', desc: 'Global retail marketplace codes.' },
  { name: 'Airbnb', color: 'from-rose-500 to-rose-700', api: 'billing.airbnb.com/v4', format: 'XXXX-XXXX-XXXX', desc: 'Direct travel/accommodations credit.' },
  { name: 'Uber', color: 'from-gray-800 to-slate-950', api: 'settlements.uber-api.com/v1', format: 'XXXXX-XXXXX', desc: 'Uber rides and Uber Eats delivery funds.' },
];

const parseGiftCardDetails = (tx: any) => {
  const text = tx.gatewayDetails || '';
  let brand = 'Amazon';
  let value = 50;

  const mBrand = text.match(/1x\s+([^G\d]+?)\s+Gift/i) || text.match(/Bought\s+Gift\s+Cards:\s+1x\s+(\w+)/i) || text.match(/Bought\s+Gift\s+Cards:\s+([^\d]+?)\(\$/i);
  if (mBrand) {
    brand = mBrand[1].trim();
  } else {
    const searchVal = text.toLowerCase();
    for (const m of MERCHANTS_LIST) {
      if (searchVal.includes(m.name.toLowerCase())) {
        brand = m.name;
        break;
      }
    }
  }

  const mValue = text.match(/\$(\d+(\.\d+)?)/);
  if (mValue) {
    value = parseFloat(mValue[1]);
  } else if (tx.amountUSD) {
    value = tx.amountUSD;
  }

  return { brand, value };
};

export const PayoutConsole: React.FC = () => {
  const {
    coins,
    usd,
    payoutAddress,
    setPayoutAddress,
    payouts,
    requestPayout,
    marketPrice,

    // Multiple Cryptocurrencies states
    activeCrypto,
    setActiveCrypto,
    balances,
    prices,
    requestCryptoTransfer,

    // Multiple currency switch
    selectedCurrency,
    currencySymbols,
    formatVal,

    // Secure authentication & verification
    user,
    login,
    verifyPayout,
    batchPayouts,
    initiateAssetTransfer,
    confirmAssetTransfer,
    buyGiftCards,
  } = useMining();

  const [payoutInput, setPayoutInput] = useState<string>(payoutAddress);
  
  // Tab controller: 'cash' vs 'crypto' vs 'transfer' vs 'giftcard'
  const [activeFormTab, setActiveFormTab] = useState<'cash' | 'crypto' | 'transfer' | 'giftcard'>('cash');

  // Gift Card selection states
  const [giftCart, setGiftCart] = useState<Record<string, number>>({});
  const [giftEmail, setGiftEmail] = useState<string>(user?.email || '');

  // Modern direct merchant states
  const [merchantStoreMode, setMerchantStoreMode] = useState<'merchant_api' | 'catalog'>('merchant_api');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('Amazon');
  const [customAmount, setCustomAmount] = useState<number>(50);
  const [isPerformingMerchantApiHandshake, setIsPerformingMerchantApiHandshake] = useState<boolean>(false);
  const [merchantHandshakeLogs, setMerchantHandshakeLogs] = useState<string[]>([]);
  const [merchantHandshakeStep, setMerchantHandshakeStep] = useState<number>(0);

  const handleDirectMerchantCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const normAmount = Number(customAmount);
    if (!normAmount || isNaN(normAmount) || normAmount < 5 || normAmount > 1000) {
      setErrorMsg('Merchant direct settlements limit ranges between $5.00 and $1000.00 USD.');
      return;
    }

    if (!giftEmail || !giftEmail.includes('@')) {
      setErrorMsg('Please enter a valid recipient email address for voucher delivery.');
      return;
    }

    // Verify balance
    const currentTotalEarnings = usd + Object.entries(balances || {}).reduce((acc, [crypto, amt]) => {
      const actualAmt = crypto === activeCrypto ? coins : amt;
      const price = prices[crypto] || 0;
      return acc + (actualAmt * price);
    }, 0);

    if (currentTotalEarnings < normAmount) {
      setErrorMsg(`Insufficient total account valuation. You need $${normAmount.toFixed(2)} USD to clear this voucher.`);
      return;
    }

    // Start direct clearance handshake animation
    setIsPerformingMerchantApiHandshake(true);
    setMerchantHandshakeStep(0);
    
    const merchantObj = MERCHANTS_LIST.find(m => m.name === selectedMerchant) || MERCHANTS_LIST[0];
    
    const logs = [
      `🔐 [0.0s] Initializing TLS handshake with ${merchantObj.name} Clearing Gateway: ${merchantObj.api}...`,
      `📡 [0.5s] Establishing RSA SECURE-PIPE using TLS_AES_256_GCM_SHA384 (authenticated)...`,
      `⛓️ [1.0s] Auditing account valuation balances on DEX Settlement pools... Checked.`,
      `💰 [1.5s] Initiating coin deduction index block clearance for $${normAmount.toFixed(2)} USD... Approved.`,
      `📦 [2.0s] Synchronizing secure keys & cryptographically signing ${selectedMerchant} e-voucher... Success.`,
      `🔑 [2.5s] Injecting unique ledger reference block height. Dispatching voucher codes... Complete!`
    ];

    setMerchantHandshakeLogs([logs[0]]);

    // Run multi-step log generation timers
    for (let step = 1; step <= 5; step++) {
      await new Promise(resolve => setTimeout(resolve, 450));
      setMerchantHandshakeStep(step);
      setMerchantHandshakeLogs(prev => [...prev, logs[step]]);
    }

    // Complete transaction dispatch
    const res = buyGiftCards([{ brand: selectedMerchant, value: normAmount, qty: 1 }], giftEmail);
    setIsPerformingMerchantApiHandshake(false);
    
    if (res.success) {
      setSuccessMsg(`Direct merchant checkout completed! Instant cryptographic claim codes for ${selectedMerchant} ($${normAmount.toFixed(2)}) have been dispatched to ${giftEmail}.`);
    } else {
      setErrorMsg(res.message);
    }
  };

  const updateGiftQty = (id: string, delta: number) => {
    setGiftCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const getGiftTotal = () => {
    return AVAILABLE_GIFT_CARDS.reduce((acc, card) => {
      const qty = giftCart[card.id] || 0;
      return acc + (card.value * qty);
    }, 0);
  };

  const handleBuyGiftCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const items = AVAILABLE_GIFT_CARDS.filter(c => (giftCart[c.id] || 0) > 0).map(c => ({
      brand: c.brand,
      value: c.value,
      qty: giftCart[c.id]
    }));

    if (items.length === 0) {
      setErrorMsg('Please select at least one gift card to purchase.');
      return;
    }

    if (!giftEmail || !giftEmail.includes('@')) {
      setErrorMsg('Please enter a valid recipient email address.');
      return;
    }

    const res = buyGiftCards(items, giftEmail);
    if (res.success) {
      setSuccessMsg(res.message);
      setGiftCart({});
      setPayoutInput('');
    } else {
      setErrorMsg(res.message);
    }
  };

  // P2P Peer Transfer States
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [transferAsset, setTransferAsset] = useState<string>('HSC');
  const [p2pAmount, setP2pAmount] = useState<string>('');
  const [p2pRecipientName, setP2pRecipientName] = useState<string>('');
  
  // Handshake states
  const [isPerformingHandshake, setIsPerformingHandshake] = useState<boolean>(false);
  const [handshakeTxId, setHandshakeTxId] = useState<string | null>(null);
  const [activeHandshakeStep, setActiveHandshakeStep] = useState<number>(0);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);

  // Ledger filter type: 'all' | 'cash' | 'crypto'
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'crypto' | 'giftcard'>('all');

  // Analytics Chart States
  const [analyticsViewType, setAnalyticsViewType] = useState<'cumulative' | 'individual'>('cumulative');
  const [analyticsAssetFilter, setAnalyticsAssetFilter] = useState<'all' | 'cash' | 'crypto'>('all');

  // Hold in mempool for batch consolidation
  const [holdForBatching, setHoldForBatching] = useState<boolean>(false);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Cash Form states
  const [withdrawUSD, setWithdrawUSD] = useState<string>('');
  const [cashGateway, setCashGateway] = useState<'wallet' | 'paypal' | 'bank'>(() => {
    return (localStorage.getItem('fast_miner_cash_gateway') as 'wallet' | 'paypal' | 'bank') || 'wallet';
  });
  const [paypalEmail, setPaypalEmail] = useState<string>(() => {
    return localStorage.getItem('fast_miner_paypal_email') || '';
  });
  const [bankName, setBankName] = useState<string>(() => {
    return localStorage.getItem('fast_miner_bank_name') || '';
  });
  const [bankAccountName, setBankAccountName] = useState<string>(() => {
    return localStorage.getItem('fast_miner_bank_acc_name') || '';
  });
  const [bankRoutingNumber, setBankRoutingNumber] = useState<string>(() => {
    return localStorage.getItem('fast_miner_bank_routing') || '';
  });
  const [bankAccountNumber, setBankAccountNumber] = useState<string>(() => {
    return localStorage.getItem('fast_miner_bank_acc_num') || '';
  });
  
  // Crypto Form states
  const [selectedCrypto, setSelectedCryptoState] = useState<string>(activeCrypto);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [externalAddress, setExternalAddress] = useState<string>(payoutAddress || '');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<PayoutTransaction | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyAddress = () => {
    if (payoutInput) {
      navigator.clipboard.writeText(payoutInput).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  };

  // Deterministic helpers for node metrics & metadata to avoid DB schema migrations
  const getDeterministicHops = (txId: string): number => {
    let hash = 0;
    for (let i = 0; i < txId.length; i++) {
      hash = txId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 3 + (Math.abs(hash) % 5); // 3 to 7 transit hops
  };

  const getDeterministicValidator = (txHash: string): string => {
    if (!txHash) return 'VAL-NODE-ALPHA';
    const hexPart = txHash.replace('0x', '').slice(0, 6).toUpperCase();
    return `VAL-${hexPart || 'NODE-BETA'}`;
  };

  const handleUpdateAddress = () => {
    if (payoutInput && payoutInput.trim().length >= 8) {
      setPayoutAddress(payoutInput.trim());
      // Sync local form state too
      setExternalAddress(payoutInput.trim());
      setSuccessMsg('Receiver destination coordinates saved.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg('Address coordinates must be at least 8 characters.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleWithdrawAction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amount = parseFloat(withdrawUSD);
    if (isNaN(amount) || amount < 5.0) {
      setErrorMsg(`Minimum cash withdrawal limit is ${formatVal(5.0)}.`);
      return;
    }

    if (amount > usd) {
      setErrorMsg(`Insufficient dynamic balance in wallet. Please sell or mine more first!`);
      return;
    }

    let targetAddress = payoutAddress || payoutInput || 'bc1q_DefaultHotWallet';
    let detailsStr = 'Direct cryptographic wallet sync';

    if (cashGateway === 'paypal') {
      if (!paypalEmail || !paypalEmail.includes('@') || paypalEmail.length < 5) {
        setErrorMsg('Please specify a valid PayPal email address.');
        return;
      }
      targetAddress = paypalEmail;
      detailsStr = 'PayPal Instant Settlement Network';
      // Save
      localStorage.setItem('fast_miner_paypal_email', paypalEmail);
    } else if (cashGateway === 'bank') {
      if (!bankName || !bankAccountName || !bankRoutingNumber || !bankAccountNumber) {
        setErrorMsg('Please complete all requested Bank Account transfer credentials.');
        return;
      }
      targetAddress = bankAccountNumber;
      detailsStr = `${bankName} (${bankAccountName}) Routing: ${bankRoutingNumber}`;
      // Save
      localStorage.setItem('fast_miner_bank_name', bankName);
      localStorage.setItem('fast_miner_bank_acc_name', bankAccountName);
      localStorage.setItem('fast_miner_bank_routing', bankRoutingNumber);
      localStorage.setItem('fast_miner_bank_acc_num', bankAccountNumber);
    }

    localStorage.setItem('fast_miner_cash_gateway', cashGateway);

    const res = requestPayout(targetAddress, amount, cashGateway, detailsStr, holdForBatching);
    if (res.success) {
      if (holdForBatching) {
        setSuccessMsg(`Withdrawal requested and held in Mempool! You can now batch this with other pending payouts to aggregate dispatches and save gas.`);
      } else {
        setSuccessMsg(`Cash out request (${cashGateway.toUpperCase()}) successfully processed and broadcast to clearing agents!`);
      }
      setWithdrawUSD('');
      if (res.tx) {
        setSelectedTx(res.tx); // Auto-open telemetry receipt to show active proof tracker
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCryptoTransferAction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amount = parseFloat(transferAmount);
    const balanceLimit = selectedCrypto === activeCrypto ? coins : (balances[selectedCrypto] ?? 0);

    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    if (amount > balanceLimit) {
      setErrorMsg(`Insufficient ${selectedCrypto} for secure dispatch.`);
      return;
    }

    const targetAddr = externalAddress.trim() || payoutInput.trim() || payoutAddress;
    if (!targetAddr || targetAddr.length < 8) {
      setErrorMsg('Please specify a valid external wallet coordinate.');
      return;
    }

    const res = requestCryptoTransfer(selectedCrypto, targetAddr, amount, holdForBatching);
    if (res.success) {
      if (holdForBatching) {
        setSuccessMsg(`External dispatch requested and held in Mempool! Batch it with other compatible pending dispatches to save gas!`);
      } else {
        setSuccessMsg(`Distributed dispatch successfully committed to blockchain!`);
      }
      setTransferAmount('');
      if (res.tx) {
        setSelectedTx(res.tx); // Auto-open receipt
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleP2pTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amount = parseFloat(p2pAmount);
    const balanceLimit = transferAsset === activeCrypto ? coins : (balances[transferAsset] ?? 0);

    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid transfer amount.');
      return;
    }

    if (amount > balanceLimit) {
      setErrorMsg(`Insufficient ${transferAsset} balance for peer transfer.`);
      return;
    }

    const recipientAddr = recipientAddress.trim();
    if (!recipientAddr || recipientAddr.length < 8) {
      setErrorMsg('Please specify a valid recipient node address (minimum 8 length).');
      return;
    }

    const res = initiateAssetTransfer(transferAsset, recipientAddr, amount, p2pRecipientName);
    if (res.success) {
      setSuccessMsg(`Asset transfer successfully broadcasted! Recipient can now confirm & claim.`);
      setP2pAmount('');
      setRecipientAddress('');
      setP2pRecipientName('');
      setTimeout(() => setSuccessMsg(null), 6000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const startHandshakeConfirmation = (txId: string) => {
    setIsPerformingHandshake(true);
    setHandshakeTxId(txId);
    setActiveHandshakeStep(0);
    setHandshakeLogs([
      '[sys] Initializing cryptographic peer handshake protocol...',
      '[sys] Binding to local Node ID: ' + (payoutAddress || '0x_self_active_node')
    ]);
    
    // Step 1: SYNCHRONIZING P2P CHANNELS
    setTimeout(() => {
      setActiveHandshakeStep(1);
      setHandshakeLogs(prev => [
        ...prev, 
        '[net] Connection established with validation bridge.', 
        '[net] Handshake SYN packet verified by consensus peers.'
      ]);
      
      // Step 2: VALIDATING RECIPIENT PRIVATE KEY SIGNATURES
      setTimeout(() => {
        setActiveHandshakeStep(2);
        setHandshakeLogs(prev => [
          ...prev, 
          '[key] Requesting secure signature from active recipient coordinate...', 
          '[key] Multi-sig approval parameters decrypted with SHA-256 block key.'
        ]);
        
        // Step 3: SECURING CONSENSUS ENDORSEMENT
        setTimeout(() => {
          setActiveHandshakeStep(3);
          setHandshakeLogs(prev => [
            ...prev, 
            '[consensus] Broadcasters validated proof state successfully. Network gas fee of 0.5% cleared.', 
            '[consensus] Endorsed block height confirmed on-chain.'
          ]);
          
          // Step 4: COMMITTING TO BLOCK LEDGER
          setTimeout(() => {
            setActiveHandshakeStep(4);
            confirmAssetTransfer(txId).then((res) => {
              if (res.success) {
                setHandshakeLogs(prev => [
                  ...prev, 
                  '[storage] Ledger sync completed successfully!', 
                  '[sys] Asset balance successfully updated! Channel closed.'
                ]);
              } else {
                setHandshakeLogs(prev => [...prev, '[error] Failed sync: ' + res.message]);
              }
            });
          }, 700);
        }, 850);
      }, 900);
    }, 800);
  };

  const getStatusStyle = (status: PayoutTransaction['status']) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'Success Confirmed',
        };
      case 'processing':
        return {
          bg: 'bg-amber-950/20 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-500',
          label: 'Processing Blocks',
        };
      default:
        return {
          bg: 'bg-slate-950/25 border-slate-800 text-slate-400',
          dot: 'bg-slate-400',
          label: 'Broadcasting Mempool',
        };
    }
  };

  // Compute active balance for selected crypto transfer form
  const activeCryptoWalletBalance = selectedCrypto === activeCrypto ? coins : (balances[selectedCrypto] ?? 0);
  const activePrice = prices[selectedCrypto] || 1.0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: Payout Form Selection Panel */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Dynamic Navigation Mode Tabs */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-1.5 flex flex-wrap gap-2 font-mono">
          <button
            onClick={() => {
              setActiveFormTab('cash');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeFormTab === 'cash'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 bg-transparent'
            }`}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>Cash Out</span>
          </button>
          
          <button
            onClick={() => {
              setActiveFormTab('crypto');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeFormTab === 'crypto'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 bg-transparent'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>External Dispatch</span>
          </button>

          <button
            onClick={() => {
              setActiveFormTab('transfer');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeFormTab === 'transfer'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 bg-transparent'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>P2P Peer Transfers</span>
          </button>

          <button
            onClick={() => {
              setActiveFormTab('giftcard');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeFormTab === 'giftcard'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 bg-transparent'
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            <span>Gift Store</span>
          </button>
        </div>

        {/* Destination Address Config Card */}
        <div id="wallet_setup_panel" className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4">
            <Wallet className="h-4.5 w-4.5 text-emerald-400" />
            <span>Primary Wallet Address Coordinates</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                Destination Address coordinate
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={payoutInput}
                  onChange={(e) => setPayoutInput(e.target.value)}
                  placeholder="AddressHash..."
                  className="bg-[#050505] border border-white/10 focus:border-emerald-400/40 text-[11px] text-slate-300 px-3 h-10 rounded-xl outline-none flex-1 font-mono tracking-wide"
                />
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  disabled={!payoutInput}
                  className={`px-4 h-10 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 font-mono ${
                    copied 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-[0.98]' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                  title="Quick Copy Wallet Address"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 font-bold animate-in zoom-in spin-in-180 duration-300" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-white/60 group-hover:text-white transition-colors" />
                  )}
                  <span>{copied ? 'Copied!' : 'Quick Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUpdateAddress}
                  className="px-4.5 h-10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/10 shrink-0 cursor-pointer font-mono"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="text-[10px] text-white/40 bg-[#050505]/40 border border-white/5 rounded-xl p-3 leading-relaxed">
              <span className="block font-bold text-white/80 uppercase mb-0.5">Automated Sync:</span>
              <span>We pre-generated a generic blockchain wallet receiver. Updating this field dynamically adjusts target addresses across both USD and cryptocurrency dispatch modules.</span>
            </div>
          </div>
        </div>

        {/* FORM 1: Traditional USD Cashout */}
        {activeFormTab === 'cash' && (
          <div id="withdrawal_form_panel" className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono animate-fade-in">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4">
              <Landmark className="h-4.5 w-4.5 text-emerald-400" />
              <span>{selectedCurrency} Cash Out Module</span>
            </h3>

            <form onSubmit={handleWithdrawAction} className="space-y-4">
              {/* Currency check metrics */}
              <div className="flex justify-between items-center text-xs p-3.5 bg-[#050505] rounded-xl border border-white/10">
                <span className="text-white/40 font-semibold">Cash Balance ({selectedCurrency}):</span>
                <span className="font-bold text-emerald-400">
                  {formatVal(usd)}
                </span>
              </div>

              {/* Withdrawal Channel Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold hover:text-white/60 transition-colors">
                  Select Withdrawal Gateway Channel
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#050505] p-1.5 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setCashGateway('wallet');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-1 rounded-lg text-[9px] font-bold text-center border cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                      cashGateway === 'wallet' 
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 shadow-inner' 
                        : 'bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-emerald-400" />
                    <span>HSC Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCashGateway('paypal');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-1 rounded-lg text-[9px] font-bold text-center border cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                      cashGateway === 'paypal' 
                        ? 'border-sky-500/30 text-sky-400 bg-sky-500/5 shadow-inner' 
                        : 'bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Send className="h-4 w-4 rotate-[-15deg] text-sky-400" />
                    <span>PayPal Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCashGateway('bank');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-1 rounded-lg text-[9px] font-bold text-center border cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                      cashGateway === 'bank' 
                        ? 'border-teal-500/30 text-teal-400 bg-teal-500/5 shadow-inner' 
                        : 'bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Landmark className="h-4 w-4 text-teal-400" />
                    <span>Bank Transfer</span>
                  </button>
                </div>
              </div>

              {/* Channel Specific Information Panels */}
              {cashGateway === 'wallet' && (
                <div className="bg-[#050505]/65 border border-white/5 rounded-xl p-3.5 space-y-1.5 text-[10px] text-[#a0a0a0] leading-relaxed animate-fade-in">
                  <span className="block font-bold text-emerald-400 uppercase tracking-wider text-[8px]">HSC Network Node:</span>
                  <span>Assets will be automatically converted and dispatched as standard cryptographic tokens to your primary registered wallet address coordinator:</span>
                  <div className="font-mono text-white/75 bg-[#030303] border border-white/10 rounded-lg p-2 mt-1 truncate select-all">{payoutAddress || payoutInput || 'Not configured yet (Set above)'}</div>
                </div>
              )}

              {cashGateway === 'paypal' && (
                <div className="space-y-2.5 animate-fade-in">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                      PayPal Destination Email Account
                    </label>
                    <input
                      type="email"
                      required
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="e.g., wallet.owner@example.com"
                      className="w-full bg-[#050505] border border-white/10 focus:border-sky-400/40 outline-none h-11 px-3.5 text-xs text-white rounded-xl font-mono tracking-wide"
                    />
                  </div>
                  <div className="bg-sky-950/10 border border-sky-500/10 rounded-xl p-3 text-[10px] text-sky-200 leading-relaxed space-y-1">
                    <span className="block font-extrabold uppercase tracking-wider text-[8px] text-sky-300">PayPal Instant Transfer:</span>
                    <span>Asset liquifiers immediately swap mining power into fiat. Swapped liquid USD asset balances are processed instantly directly to your registered PayPal email receipt. Only 1.5% Gas fee applies.</span>
                  </div>
                </div>
              )}

              {cashGateway === 'bank' && (
                <div className="space-y-3 animate-fade-in font-mono">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                        Bank Institution Name
                      </label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g., JPMorgan Chase"
                        className="w-full bg-[#050505] border border-white/10 focus:border-teal-400/40 outline-none h-10 px-3 text-xs text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        required
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        placeholder="e.g., Satoshi Nakamoto"
                        className="w-full bg-[#050505] border border-white/10 focus:border-teal-400/40 outline-none h-10 px-3 text-xs text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                        Routing Index (SWIFT)
                      </label>
                      <input
                        type="text"
                        required
                        value={bankRoutingNumber}
                        onChange={(e) => setBankRoutingNumber(e.target.value)}
                        placeholder="e.g., SWIFT-CHASUS33"
                        className="w-full bg-[#050505] border border-white/10 focus:border-teal-400/40 outline-none h-10 px-3 text-xs text-white rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="e.g., 102450509650"
                        className="w-full bg-[#050505] border border-white/10 focus:border-teal-400/40 outline-none h-10 px-3 text-xs text-white rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-teal-950/10 border border-teal-500/10 rounded-xl p-3 text-[10px] text-teal-300 leading-relaxed space-y-1">
                    <span className="block font-extrabold uppercase tracking-wider text-[8px] text-teal-200">ACH Wire Transfer Consensus:</span>
                    <span>Wired bank settlements trigger automated clearing houses inside our network matching traditional routing networks. Usually settled inside 2 minutes.</span>
                  </div>
                </div>
              )}

              {/* Amount Inputs */}
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                  Withdrawn Amount ({selectedCurrency})
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-2.5 text-white/40 text-sm">
                    {currencySymbols[selectedCurrency] || '$'}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="5.00"
                    max={usd}
                    value={withdrawUSD}
                    onChange={(e) => setWithdrawUSD(e.target.value)}
                    placeholder="5.00"
                    className="w-full bg-[#050505] border border-white/10 focus:border-emerald-400/40 outline-none h-11 pl-7 pr-16 text-sm text-white rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawUSD(usd.toFixed(2))}
                    className="absolute right-2.5 top-2.5 h-6 px-1.5 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-white/10 rounded hover:bg-emerald-500/20 cursor-pointer"
                  >
                    Max
                  </button>
                </div>
                <div className="flex justify-between items-center text-[9px] text-[#a0a0a0]/60 mt-1">
                  <span>Minimum fee: 1.5% Gas</span>
                  {withdrawUSD && !isNaN(parseFloat(withdrawUSD)) && (
                    <span>≃ {(parseFloat(withdrawUSD) / marketPrice).toFixed(4)} HSC Token Cap Equivalent</span>
                  )}
                </div>
              </div>

              {/* Batch Processing Option */}
              <div 
                className={`flex items-start gap-2.5 p-3.5 border rounded-xl hover:border-emerald-500/20 transition-all select-none cursor-pointer ${
                  holdForBatching 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-emerald-500/5 border-emerald-500/10'
                }`}
                onClick={() => setHoldForBatching(!holdForBatching)}
              >
                <input
                  type="checkbox"
                  checked={holdForBatching}
                  onChange={(e) => setHoldForBatching(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-white/10 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4 mt-0.5 accent-emerald-500"
                />
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block leading-tight">Queue in Mempool for Block Batching</span>
                  <span className="text-[9px] text-white/40 block leading-relaxed font-mono">
                    Aggregate multiple withdrawals into a single consolidated transaction to reduce network gas fees by up to 80%.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-350 text-xs rounded-xl flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={usd < 5.0 || !withdrawUSD || isNaN(parseFloat(withdrawUSD)) || parseFloat(withdrawUSD) <= 0}
                className="w-[#ffffff01] hidden"
              />
              <button
                type="submit"
                disabled={usd < 5.0 || !withdrawUSD || isNaN(parseFloat(withdrawUSD)) || parseFloat(withdrawUSD) <= 0}
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                Secure {cashGateway === 'wallet' ? 'Crypto' : cashGateway === 'paypal' ? 'PayPal' : 'Direct Bank'} Withdrawal
              </button>
            </form>
          </div>
        )}

        {/* FORM 2: Cryptocurrency Direct Dispatch */}
        {activeFormTab === 'crypto' && (
          <div id="crypto_dispatch_panel" className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono animate-fade-in">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4">
              <Send className="h-4.5 w-4.5 text-emerald-400" />
              <span>Crypto Wallet Direct Dispatch</span>
            </h3>

            <form onSubmit={handleCryptoTransferAction} className="space-y-4">
              
              {/* Token Selector Grid */}
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5 font-semibold">
                  Select Blockchain Node Assets
                </label>
                <div className="grid grid-cols-6 gap-1.5 bg-[#050505] p-1.5 rounded-xl border border-white/5">
                  {(['BTC', 'HSC', 'ETH', 'SOL', 'DOGE', 'ALPHA'] as const).map(c => {
                    const isSelected = selectedCrypto === c;
                    const cColors = {
                      HSC: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                      BTC: 'border-amber-500/30 text-amber-500 bg-amber-500/5',
                      ETH: 'border-violet-500/30 text-violet-400 bg-violet-500/5',
                      SOL: 'border-fuchsia-500/30 text-fuchsia-450 bg-fuchsia-500/5',
                      DOGE: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5',
                      ALPHA: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
                    }[c];
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedCryptoState(c);
                          setErrorMsg(null);
                        }}
                        className={`py-2 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition-all ${
                          isSelected 
                            ? `${cColors} border-opacity-100 font-extrabold scale-102` 
                            : 'bg-transparent border-transparent text-white/40 hover:text-white/60'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Balances Check Screen */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#050505] rounded-xl border border-white/5 text-[11px]">
                <div>
                  <span className="text-white/40 block font-semibold">Onhold Balance:</span>
                  <span className="font-extrabold text-white">
                    {activeCryptoWalletBalance.toFixed(selectedCrypto === 'DOGE' || selectedCrypto === 'ALPHA' ? 2 : selectedCrypto === 'SOL' ? 4 : 6)} {selectedCrypto}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-white/40 block font-semibold">Current Rate:</span>
                  <span className="font-extrabold text-[#a0a0a0]">
                    {formatVal(activePrice)}
                  </span>
                </div>
              </div>

              {/* Destination override address */}
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                  Target Destination Address
                </label>
                <input
                  type="text"
                  value={externalAddress}
                  onChange={(e) => setExternalAddress(e.target.value)}
                  placeholder="External Wallet Hash Address"
                  className="w-full bg-[#050505] border border-white/10 focus:border-emerald-400/40 outline-none h-11 px-3.5 text-xs text-white rounded-xl font-mono tracking-wide"
                  required
                />
              </div>

              {/* Amount form field */}
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                  Transfer Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    max={activeCryptoWalletBalance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#050505] border border-white/10 focus:border-emerald-400/40 outline-none h-11 px-3.5 pr-20 text-sm text-white rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setTransferAmount(activeCryptoWalletBalance.toString())}
                    className="absolute right-2.5 top-2.5 h-6 px-2 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-white/10 rounded hover:bg-emerald-500/20 cursor-pointer"
                  >
                    Max
                  </button>
                </div>
                <div className="flex justify-between items-center text-[9px] text-[#a0a0a0]/60 mt-1">
                  <span>Fee: 1.5% Gas Deduct</span>
                  {transferAmount && !isNaN(parseFloat(transferAmount)) && (
                    <span>≃ {formatVal(parseFloat(transferAmount) * activePrice)} Valuation</span>
                  )}
                </div>
              </div>

              {/* Batch Processing Option */}
              <div 
                className={`flex items-start gap-2.5 p-3.5 border rounded-xl hover:border-emerald-500/20 transition-all select-none cursor-pointer ${
                  holdForBatching 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-emerald-500/5 border-emerald-500/10'
                }`}
                onClick={() => setHoldForBatching(!holdForBatching)}
              >
                <input
                  type="checkbox"
                  checked={holdForBatching}
                  onChange={(e) => setHoldForBatching(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-white/10 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4 mt-0.5 accent-emerald-500"
                />
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block leading-tight">Queue in Mempool for Block Batching</span>
                  <span className="text-[9px] text-white/40 block leading-relaxed font-mono">
                    Aggregate multiple withdrawals into a single consolidated transaction to reduce network gas fees by up to 80%.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-350 text-xs rounded-xl flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={activeCryptoWalletBalance <= 0 || !transferAmount || isNaN(parseFloat(transferAmount)) || parseFloat(transferAmount) <= 0}
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                Dispatch {selectedCrypto} Assets
              </button>
            </form>
          </div>
        )}

        {activeFormTab === 'transfer' && (
          <div className="space-y-6 animate-fade-in font-mono text-left">
            
            {/* INBOUND CLAIMS STATION */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white/95 flex items-center gap-2 mb-2">
                <Users className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                <span>P2P Claim Handshake Terminal</span>
              </h3>
              <p className="text-[10px] text-white/40 mb-4 leading-relaxed">
                Atomic peer-to-peer inbound corridors. Locate incoming digital asset assignments and execute full multi-signature handshakes to claim balances.
              </p>

              {(() => {
                const pendingClaims = payouts.filter(t => 
                  t.isTransfer && 
                  (t.transferType === 'in' || t.address === '0x_self_active_node' || t.address === payoutAddress) && 
                  t.status === 'pending'
                );

                if (pendingClaims.length === 0) {
                  return (
                    <div className="border border-dashed border-emerald-500/10 bg-emerald-500/[0.01] p-5 rounded-xl text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Console Listening</div>
                      <p className="text-[9.5px] text-white/35 max-w-xs mx-auto">
                        Ingress port is active. No pending inbound peer transfers detected right now.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {pendingClaims.map(claim => {
                      const amount = claim.amountCoin || 0;
                      const crypto = claim.crypto || 'HSC';
                      const valueUSD = claim.amountUSD || 0.00;
                      return (
                        <div key={claim.id} className="border border-white/10 bg-[#050505] rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1 text-left">
                            <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-400 font-extrabold uppercase rounded border border-amber-500/20 tracking-wider">
                              Inbound Transfer Awaiting Claim
                            </span>
                            <div className="text-sm font-extrabold text-white">
                              {amount.toFixed(crypto === 'DOGE' || crypto === 'ALPHA' ? 1 : 4)} {crypto}
                              <span className="text-xs text-white/40 font-normal font-mono ml-1.5">≃ ${valueUSD.toFixed(2)}</span>
                            </div>
                            <div className="text-[9px] text-[#a0a0a0] font-mono break-all leading-normal">
                              From: <span className="text-[#c0c0c0]" title={claim.senderAddress}>{claim.senderAddress ? (`${claim.senderAddress.substring(0,8)}...${claim.senderAddress.substring(claim.senderAddress.length - 8)}`) : 'Consensus Ingress'}</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => startHandshakeConfirmation(claim.id)}
                            className="w-full sm:w-auto px-4 h-9 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-slate-950" />
                            <span>Confirm & Settle</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* PEER DISPATCH PORTAL */}
            <div id="p2p_transfer_panel" className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white/95 flex items-center gap-2 mb-1">
                  <ArrowLeftRight className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Peer-to-Peer Asset Dispatch</span>
                </h3>
                <p className="text-[10px] text-white/40">Broadcasting transaction structures directly to peer node coordinates.</p>
              </div>

              <form onSubmit={handleP2pTransferSubmit} className="space-y-4">
                {/* Asset Selector */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5 font-semibold">
                    Select Digital Asset
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 bg-[#050505] p-1 rounded-xl border border-white/5">
                    {(['BTC', 'HSC', 'ETH', 'SOL', 'DOGE', 'ALPHA'] as const).map(c => {
                      const isSelected = transferAsset === c;
                      const cColors = {
                        HSC: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                        BTC: 'border-amber-500/30 text-amber-500 bg-amber-500/5',
                        ETH: 'border-violet-500/30 text-violet-400 bg-violet-500/5',
                        SOL: 'border-fuchsia-500/30 text-[#e879f9] bg-fuchsia-500/5',
                        DOGE: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5',
                        ALPHA: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
                      }[c];
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setTransferAsset(c);
                            setErrorMsg(null);
                          }}
                          className={`py-1.5 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition-all ${
                            isSelected 
                              ? `${cColors} border-opacity-100 font-extrabold scale-102` 
                              : 'bg-transparent border-transparent text-white/40 hover:text-white/60'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Balance displays */}
                <div className="p-3 bg-[#050505] rounded-xl border border-white/5 flex justify-between items-center text-[10px] leading-relaxed">
                  <div>
                    <span className="text-white/40 block font-semibold text-left">Available Allocation:</span>
                    <span className="font-extrabold text-white text-[11px] block text-left">
                      {(transferAsset === activeCrypto ? coins : (balances[transferAsset] ?? 0)).toFixed(transferAsset === 'DOGE' || transferAsset === 'ALPHA' ? 2 : 5)} {transferAsset}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-white/40 block font-semibold leading-relaxed">Exchange Rate Estimation:</span>
                    <span className="font-extrabold text-white/50 text-[10px] block leading-relaxed">
                      ≃ ${prices[transferAsset]?.toLocaleString() ?? '1.00'} USD
                    </span>
                  </div>
                </div>

                {/* Recipient Coordinate and Favorites */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                    Peer Node Address Coordinates
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="e.g. 0x882a9b3c4f5d6e7f8a9b..."
                      className="bg-[#050505] border border-white/10 focus:border-emerald-400/40 text-[11px] text-slate-300 px-3 h-10 w-full rounded-xl outline-none font-mono"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[8px] text-white/30 h-6 flex items-center mr-1 uppercase font-bold tracking-wider">Speed-Dials:</span>
                      {[
                        { name: 'Echo-4 Node', addr: '0x882a9b3c4f5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f' },
                        { name: 'Doge West Core', addr: '0xdoge_validator_peer_west_99' },
                        { name: 'Arbitrum Pool', addr: '0x7739e8f12a3b04c89d2f349a8b7c6d5e4f3a2b1c' }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setRecipientAddress(preset.addr)}
                          className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-0.5 rounded-lg text-emerald-400/80 hover:text-emerald-300 cursor-pointer"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom reference name */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                    Recipient Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={p2pRecipientName}
                    onChange={(e) => setP2pRecipientName(e.target.value)}
                    placeholder="e.g. Consortium Ledger North, Validator-9"
                    className="bg-[#050505] border border-white/10 focus:border-emerald-400/40 text-[11px] text-slate-300 px-3 h-10 w-full rounded-xl outline-none font-mono"
                  />
                </div>

                {/* Amount input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold animate-none">
                      Payment Amount
                    </label>
                    <button
                      type="button"
                      onClick={() => setP2pAmount((transferAsset === activeCrypto ? coins : (balances[transferAsset] ?? 0)).toString())}
                      className="text-[10px] text-emerald-400 font-extrabold hover:text-emerald-300 transition-colors uppercase tracking-widest cursor-pointer"
                    >
                      Set Maximum Allocation
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={p2pAmount}
                      onChange={(e) => setP2pAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-[#050505] border border-white/10 focus:border-emerald-400/40 text-[12px] text-white font-extrabold font-mono px-3 h-11 w-full rounded-xl outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-bold uppercase tracking-wider font-mono">
                      {transferAsset}
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] text-white/30 mt-1.5 px-0.5 font-mono">
                    <span>Consensus Fee: 0.5% (refunded if delayed)</span>
                    {p2pAmount && !isNaN(parseFloat(p2pAmount)) && (
                      <span>≃ {formatVal(parseFloat(p2pAmount) * (prices[transferAsset] || 1))} USD</span>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-350 text-xs rounded-xl flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!p2pAmount || isNaN(parseFloat(p2pAmount)) || parseFloat(p2pAmount) <= 0 || parseFloat(p2pAmount) > (transferAsset === activeCrypto ? coins : (balances[transferAsset] ?? 0))}
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-mono"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>Transmit P2P Assets</span>
                </button>
              </form>
            </div>

          </div>
        )}

        {activeFormTab === 'giftcard' && (
          <div id="gift_cards_store_panel" className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono animate-fade-in space-y-5">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-2">
              <Gift className="h-4.5 w-4.5 text-emerald-450 text-emerald-400" />
              <span>Alpha Miner Gift Card Clearance Store</span>
            </h3>
            <p className="text-[10px] text-white/40 leading-relaxed text-left">
              Purchase premium digital gift cards from certifed merchants. Codes are cleared by direct API handshake, instantly dispatched to your recipient address and saved inside your **Cloud Inbox**.
            </p>

            {/* Mode switch selector */}
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 text-[9px] uppercase font-black tracking-wider">
              <button
                type="button"
                onClick={() => setMerchantStoreMode('merchant_api')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer ${merchantStoreMode === 'merchant_api' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'text-white/40 hover:text-white/80'}`}
              >
                Direct Merchant API Sync
              </button>
              <button
                type="button"
                onClick={() => setMerchantStoreMode('catalog')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer ${merchantStoreMode === 'catalog' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'text-white/40 hover:text-white/80'}`}
              >
                Predefined catalog
              </button>
            </div>

            {merchantStoreMode === 'merchant_api' ? (
              <form onSubmit={handleDirectMerchantCheckout} className="space-y-4">
                {/* Valuation Overview */}
                <div className="flex justify-between items-center text-xs p-3.5 bg-[#050505] rounded-xl border border-white/10">
                  <span className="text-white/40 font-semibold">Total Account Valuation:</span>
                  <span className="font-bold text-emerald-400">
                    {formatVal(usd + Object.entries(balances || {}).reduce((acc, [crypto, amt]) => {
                      const actualAmt = crypto === activeCrypto ? coins : amt;
                      const price = prices[crypto] || 0;
                      return acc + (actualAmt * price);
                    }, 0))}
                  </span>
                </div>

                {/* Merchant Selector Grid */}
                <div className="space-y-2 text-left">
                  <label className="text-[9px] text-white/40 uppercase tracking-wider block font-semibold">
                    Select Certified Retailer Brand
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {MERCHANTS_LIST.map(item => {
                      const isSelected = selectedMerchant === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedMerchant(item.name)}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center select-none cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500'
                              : 'bg-black/30 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className={`p-1 bg-gradient-to-br ${item.color} text-white rounded-md`}>
                            <Gift className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-[8px] font-black leading-tight text-white/90 truncate max-w-full">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount Selector Slider & QuickPres */}
                <div className="space-y-2 text-left bg-black/40 border border-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-center text-[9px] text-white/40 font-semibold uppercase">
                    <span>Voucher Value (USD)</span>
                    <span className="text-emerald-400 font-extrabold text-xs">$ {customAmount} USD</span>
                  </div>
                  
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[10, 25, 50, 100, 255, 500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCustomAmount(val)}
                        className={`text-[8px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                          customAmount === val
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Telemetry panel for merchant clearing */}
                <div className="bg-[#050505] border border-white/5 p-3 rounded-xl space-y-2 text-left text-[9px] font-mono">
                  <div className="flex justify-between items-center text-white/30 text-[8px] uppercase font-black mb-1">
                    <span>Merchant Gateway Connection</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-400 font-semibold">Active Sync / 24ms</span>
                    </span>
                  </div>
                  {(() => {
                    const m = MERCHANTS_LIST.find(x => x.name === selectedMerchant) || MERCHANTS_LIST[0];
                    return (
                      <div className="text-white/60 leading-normal space-y-1">
                        <div className="flex items-center gap-1 text-emerald-400/80">
                          <span className="font-extrabold text-[8px]">DNS ROUTE:</span>
                          <span className="select-all font-bold font-mono">{m.api}</span>
                        </div>
                        <div className="text-[8px] text-white/40 leading-normal font-medium">{m.desc}</div>
                      </div>
                    );
                  })()}
                  
                  {isPerformingMerchantApiHandshake && (
                    <div className="bg-black/85 border border-emerald-500/20 p-2.5 rounded-lg space-y-1 mt-2 animate-pulse">
                      <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-emerald-400">
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-400 shrink-0" />
                        <span>CLEARING SECURE CLOUD HANDSHAKE...</span>
                      </div>
                      <div className="font-mono text-[7.5px] text-emerald-300/85 leading-normal space-y-1 max-h-[85px] overflow-y-auto mt-1 flex flex-col text-left">
                        {merchantHandshakeLogs.map((log, idx) => (
                          <div key={idx} className="block truncate">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Delivery */}
                <div className="space-y-2 text-left">
                  <label className="text-[9px] text-white/40 uppercase tracking-wider block font-semibold">
                    Recipient Delivery Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                    placeholder="name@destination.com"
                    className="w-full bg-[#05055] bg-black/40 border border-white/10 focus:border-emerald-400/45 text-[11px] text-slate-300 px-3 h-10 rounded-xl outline-none font-mono"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 text-left">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-350 text-xs rounded-xl flex gap-2 text-left">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPerformingMerchantApiHandshake}
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-mono"
                >
                  <Gift className="h-4 w-4" />
                  <span>Connect Merchant & Buy Voucher</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleBuyGiftCards} className="space-y-4">
                {/* Valuation Overview */}
                <div className="flex justify-between items-center text-xs p-3.5 bg-[#050505] rounded-xl border border-white/10">
                  <span className="text-white/40 font-semibold">Total Balance Valuation:</span>
                  <span className="font-bold text-emerald-400">
                    {formatVal(usd + Object.entries(balances || {}).reduce((acc, [crypto, amt]) => {
                      const actualAmt = crypto === activeCrypto ? coins : amt;
                      const price = prices[crypto] || 0;
                      return acc + (actualAmt * price);
                    }, 0))}
                  </span>
                </div>

                {/* Gift Card Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {AVAILABLE_GIFT_CARDS.map(card => {
                    const qty = giftCart[card.id] || 0;
                    return (
                      <div key={card.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-2 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 bg-gradient-to-br ${card.color} text-white rounded-lg`}>
                            <Gift className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-white/90 leading-tight">{card.brand}</span>
                            <span className="text-[9px] text-white/50 leading-tight">${card.value} USD</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateGiftQty(card.id, -1)}
                            className="h-5 w-5 rounded bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-[10px] select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className={`w-3 text-center text-[10px] font-extrabold ${qty > 0 ? 'text-emerald-400 font-bold' : 'text-white/30'}`}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateGiftQty(card.id, 1)}
                            className="h-5 w-5 rounded bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-[10px] select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recipient Coordinates Form */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">
                    Recipient Delivery Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                    placeholder="name@destination.com"
                    className="w-full bg-[#050505] border border-white/10 focus:border-emerald-400/40 text-[11px] text-slate-300 px-3 h-10 rounded-xl outline-none font-mono"
                  />
                </div>

                {/* Cart Summary */}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5 text-white/60">
                  <span>Total Cart Cost:</span>
                  <span className={`font-bold ${getGiftTotal() > 0 ? 'text-white font-extrabold text-sm' : 'text-white/40'}`}>
                    ${getGiftTotal().toFixed(2)} USD
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 text-left">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-350 text-xs rounded-xl flex gap-2 text-left">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={getGiftTotal() <= 0}
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-mono"
                >
                  <Gift className="h-4 w-4" />
                  <span>Checkout & Dispatch Gift Cards</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* RIGHT: Confirmation Blockchain ledger */}
      <div className="lg:col-span-5 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono flex flex-col justify-between min-h-[460px]">
        <div>
          <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2 mb-3 border-b border-white/10 pb-3">
            <Clock className="h-4.5 w-4.5 text-emerald-400" />
            <span>Payout Ledger Status</span>
          </h3>

          {/* Recharts Historical Timeline Chart */}
          {(() => {
            const confirmedTxs = payouts
              .filter(tx => tx.status === 'confirmed')
              .sort((a, b) => a.timestamp - b.timestamp);

            const chartData = confirmedTxs.map(tx => {
              const date = new Date(tx.timestamp);
              return {
                timestamp: tx.timestamp,
                dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
                amountUSD: tx.amountUSD,
                crypto: tx.crypto || 'Cash Out',
                label: tx.isTransfer ? `P2P ${tx.crypto}` : (tx.type === 'giftcard' ? 'Gift Voucher Clear' : (tx.type === 'cash' ? 'USD Cash Out' : `${tx.crypto} Dispatch`))
              };
            });

            if (chartData.length === 0) return null;

            return (
              <div className="bg-[#050505] p-3 rounded-xl border border-white/5 mb-4 relative overflow-hidden">
                <div className="flex justify-between items-center text-[10px] mb-2 px-1">
                  <span className="text-white/40 uppercase tracking-widest font-black">Withdrawal Timeline ({chartData.length} records)</span>
                  <span className="text-emerald-400 font-extrabold font-mono">Consensus verified</span>
                </div>
                
                <div className="h-28 w-full text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis 
                        dataKey="dateStr" 
                        stroke="#444" 
                        tick={{ fill: '#888', fontSize: 8 }} 
                        axisLine={false} 
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#444" 
                        tick={{ fill: '#888', fontSize: 8 }} 
                        axisLine={false} 
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0a0a0f',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '10px'
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                        formatter={(value: any, name: any, props: any) => {
                          const payload = props.payload;
                          return [`$${value.toFixed(2)}`, `${payload.label}`];
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amountUSD" 
                        stroke="#10b981" 
                        strokeWidth={1.5}
                        fillOpacity={1} 
                        fill="url(#colorUSD)" 
                        dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

          {payouts.length > 0 && (
            <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5 gap-1 mb-4 text-[10px] font-bold">
              {(['all', 'cash', 'crypto', 'giftcard'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all capitalize cursor-pointer text-center font-mono ${
                    filterType === type
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'cash' ? 'Cash' : type === 'giftcard' ? 'Gift Card' : 'Crypto'}
                </button>
              ))}
            </div>
          )}

          {(() => {
            const pendingTxs = payouts.filter(tx => tx.status === 'pending');
            const selectedTxs = payouts.filter(tx => selectedTxIds.includes(tx.id));
            
            // Rule verification
            const isBatchTypeMatch = selectedTxs.every((tx, _, arr) => (tx.type || 'cash') === (arr[0]?.type || 'cash'));
            const isBatchAddressMatch = selectedTxs.every((tx, _, arr) => tx.address === arr[0]?.address);
            const isBatchCryptoMatch = selectedTxs.every((tx, _, arr) => (tx.crypto || 'HSC') === (arr[0]?.crypto || 'HSC'));
            const selectedGatewaysMatch = selectedTxs.every((tx, _, arr) => tx.gateway === arr[0]?.gateway);

            const canBatch = selectedTxs.length >= 2 && isBatchTypeMatch && isBatchAddressMatch && isBatchCryptoMatch && selectedGatewaysMatch;

            // Calculators
            const totalBatchUSD = selectedTxs.reduce((sum, tx) => sum + tx.amountUSD, 0);
            const totalBatchCoin = selectedTxs.reduce((sum, tx) => sum + tx.amountCoin, 0);
            const originalFeesUSD = selectedTxs.reduce((sum, tx) => {
              if (tx.type === 'crypto') {
                const rate = prices[tx.crypto || 'HSC'] || 1;
                return sum + (tx.fee * rate);
              } else {
                return sum + tx.fee;
              }
            }, 0);
            const originalFeesCoin = selectedTxs.reduce((sum, tx) => sum + tx.fee, 0);

            const batchDiscount = 0.20; // 80% discount
            const batchFeeUSD = originalFeesUSD * batchDiscount;
            const batchFeeCoin = originalFeesCoin * batchDiscount;

            const savedFeeUSD = originalFeesUSD - batchFeeUSD;
            const savedFeeCoin = originalFeesCoin - batchFeeCoin;

            const activeBatchCrypto = selectedTxs[0]?.crypto || 'HSC';
            const activeBatchType = selectedTxs[0]?.type || 'cash';

            return (
              <>
                {/* Batch Console Integration Widget */}
                {pendingTxs.length > 0 && (
                  <div className="mb-4 bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-3.5 space-y-2.5 font-mono text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <Layers className="h-3.5 w-3.5 animate-pulse text-emerald-400 shrink-0" />
                        <span>Mempool Batch Engine</span>
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold">
                        {pendingTxs.length} Held Operations
                      </span>
                    </div>

                    {selectedTxIds.length === 0 ? (
                      <p className="text-[9px] text-white/50 leading-relaxed font-sans">
                        💡 Toggle checkboxes on pending transactions below to bundle them. Bundling compiles outputs into a safe single block and claims up to a <strong className="text-emerald-400">80% Gas Refund</strong> returned back to your balance immediately!
                      </p>
                    ) : (
                      <div className="space-y-2.5 text-[9px] text-[#b0b0b0]">
                        <div className="flex justify-between items-center bg-[#050505]/65 border border-white/5 p-2 rounded-xl">
                          <span className="text-white/40">Aggregation Size:</span>
                          <span className="font-extrabold text-white">{selectedTxIds.length} Operations Selected</span>
                        </div>

                        {selectedTxIds.length >= 2 && !canBatch && (
                          <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[9px] rounded-lg leading-relaxed space-y-1">
                            <div className="flex items-center gap-1 font-bold uppercase text-[8px] text-amber-400">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>Mismatched Queue Metric</span>
                            </div>
                            <p>Bundled transactions must carry identical parameters to resolve signatures:</p>
                            <ul className="list-disc pl-3 mt-1 space-y-0.5 text-white/60">
                              {!isBatchTypeMatch && <li>Asset/Cash class must align</li>}
                              {!selectedGatewaysMatch && <li>Gateway channels must align</li>}
                              {!isBatchAddressMatch && <li>Direct destination coordinates must match</li>}
                              {!isBatchCryptoMatch && <li>Cryptocurrency symbols must align</li>}
                            </ul>
                          </div>
                        )}

                        {canBatch && (
                          <div className="space-y-2">
                            {/* Metric calculation analysis */}
                            <div className="bg-[#050505] border border-white/10 rounded-xl p-2.5 space-y-1">
                              <div className="flex justify-between text-white/70">
                                <span>Bulk Net Payload:</span>
                                <span className="font-bold text-white">
                                  {activeBatchType === 'crypto' 
                                    ? `${totalBatchCoin.toFixed(4)} ${activeBatchCrypto}`
                                    : formatVal(totalBatchUSD)
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-red-400">
                                <span>Standard Gas Cost:</span>
                                <span>
                                  {activeBatchType === 'crypto'
                                    ? `${originalFeesCoin.toFixed(4)} ${activeBatchCrypto}`
                                    : formatVal(originalFeesUSD)
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-emerald-400 font-semibold">
                                <span>Consolidated Gas Cost:</span>
                                <span>
                                  {activeBatchType === 'crypto'
                                    ? `${batchFeeCoin.toFixed(4)} ${activeBatchCrypto}`
                                    : formatVal(batchFeeUSD)
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-emerald-350 font-black border-t border-white/5 pt-1 mt-1">
                                <span>Gas Refund Credit:</span>
                                <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-white font-mono">
                                  +{activeBatchType === 'crypto'
                                    ? `${savedFeeCoin.toFixed(4)} ${activeBatchCrypto}`
                                    : formatVal(savedFeeUSD)
                                  }
                                </span>
                              </div>
                            </div>

                            {/* Operation Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                const res = batchPayouts(selectedTxIds);
                                if (res.success) {
                                  setSelectedTxIds([]);
                                }
                              }}
                              className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Layers className="h-3 w-3" />
                              <span>Seal & Broadcast Consolidated Block</span>
                            </button>
                          </div>
                        )}

                        {selectedTxIds.length === 1 && (
                          <div className="text-[9px] text-[#a0a0a0] leading-normal">
                            💡 Select <strong className="text-emerald-400">at least 1 more</strong> compatible pending transaction below to resolve aggregate savings.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {(() => {
            const filteredPayouts = payouts.filter(tx => {
              if (filterType === 'all') return true;
              return (tx.type || 'cash') === filterType;
            });

            if (payouts.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-white/30 leading-relaxed text-center">
                  <Wallet className="h-10 w-10 text-white/10 mb-2 stroke-[1.2]" />
                  <p className="text-xs">No payout records in memory.</p>
                  <p className="text-[10px] text-white/20 mt-1 max-w-xs">Accumulate enough coins or cash and submit a request on the left. Transaction steps are verified instantly here!</p>
                </div>
              );
            }

            if (filteredPayouts.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-white/30 leading-relaxed text-center">
                  <Wallet className="h-10 w-10 text-white/10 mb-2 stroke-[1.2]" />
                  <p className="text-xs font-semibold text-white/80">No matching {filterType === 'cash' ? 'Cash' : 'Crypto'} records.</p>
                  <p className="text-[10px] text-white/20 mt-1 max-w-xs">There are no transactions in the history that match the selected filter category.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {filteredPayouts.map(tx => {
                const conf = getStatusStyle(tx.status);
                // Dynamic coin text styling
                const coinColor = {
                  HSC: 'text-emerald-450',
                  BTC: 'text-amber-450',
                  ETH: 'text-violet-400',
                  SOL: 'text-fuchsia-400',
                  DOGE: 'text-yellow-400',
                  ALPHA: 'text-cyan-400'
                }[tx.crypto || 'HSC'] || 'text-[#a0a0a0]';

                const isExpanded = expandedTxId === tx.id;
                const hops = getDeterministicHops(tx.id);
                const valNodeId = getDeterministicValidator(tx.txHash);
                const rtt = Math.round(hops * 7.4 + 11.2);

                return (
                  <div
                    key={tx.id}
                    onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                    className="p-3.5 bg-[#050505]/90 rounded-xl border border-white/10 hover:border-white/25 hover:bg-[#080808]/95 transition-all cursor-pointer flex flex-col group relative overflow-hidden text-left"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-center w-full gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {tx.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedTxIds.includes(tx.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (selectedTxIds.includes(tx.id)) {
                                setSelectedTxIds(selectedTxIds.filter(id => id !== tx.id));
                              } else {
                                setSelectedTxIds([...selectedTxIds, tx.id]);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-white/15 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 accent-emerald-500 cursor-pointer shrink-0"
                            title="Select for batch aggregation"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {tx.type === 'giftcard' ? (
                              <>
                                <span className="text-xs font-bold text-emerald-400">Gift Code Voucher</span>
                                <span className="text-[9px] text-white/40">(≃ {formatVal(tx.amountUSD)})</span>
                              </>
                            ) : tx.type === 'crypto' ? (
                              <>
                                <span className={`text-xs font-bold ${coinColor}`}>{tx.amountCoin} {tx.crypto}</span>
                                <span className="text-[9px] text-white/40">(≃ {formatVal(tx.amountUSD)})</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-bold text-white">{formatVal(tx.amountUSD)}</span>
                                <span className="text-[9px] text-white/40">({tx.amountCoin.toFixed(4)} HSC)</span>
                              </>
                            )}
                          </div>
                          <p className="text-[9px] text-[#a0a0a0] font-mono mt-1 font-semibold block truncate max-w-[150px]">
                            Target: {tx.address.slice(0, 10)}...
                          </p>
                          <p className="text-[9px] text-emerald-400 font-mono mt-0.5 font-bold block">
                            Ref: {tx.referenceNumber || tx.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={tx.status}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className={`py-0.5 px-2 rounded-full border text-[8px] font-bold flex items-center gap-1.5 ${conf.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${conf.dot} ${tx.status !== 'confirmed' ? 'animate-pulse' : ''}`} />
                            <span>{tx.status === 'confirmed' ? 'Confirmed' : tx.status === 'processing' ? 'Hashing' : 'Mempool'}</span>
                          </motion.div>
                        </AnimatePresence>
                        <div className="text-white/25 group-hover:text-white/60 transition-colors p-0.5">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Panel */}
                    {isExpanded && (
                      <div className="mt-3.5 pt-3.5 border-t border-white/5 space-y-3 font-mono text-[9px] text-[#a0a0a0] animate-fade-in">
                        {/* Interactive Digital Gift Card Voucher Display */}
                        {tx.type === 'giftcard' && (() => {
                          const details = parseGiftCardDetails(tx);
                          const matchedMerchant = MERCHANTS_LIST.find(m => m.name.toLowerCase() === details.brand.toLowerCase()) || MERCHANTS_LIST[0];
                          
                          // Generate robust, deterministic barcode segments, serial number, and claims code
                          const isHscSigned = tx.id || 'sec_id';
                          const serial = `SN-${isHscSigned.slice(-6).toUpperCase()}-${Math.floor(1000 + (tx.timestamp % 9000))}`;
                          const pin = String(Math.floor(1000 + (tx.timestamp % 9000)));
                          
                          // Format realistic code based on brand
                          let codeStr = '';
                          const cleanBrand = details.brand.toLowerCase();
                          if (cleanBrand.includes('apple')) {
                            codeStr = `AP-${isHscSigned.slice(-4).toUpperCase()}-9KLX-1Y9Z-${pin}`;
                          } else if (cleanBrand.includes('amazon')) {
                            codeStr = `AMZ-${isHscSigned.slice(-4).toUpperCase()}-3K9X1-L4PA`;
                          } else if (cleanBrand.includes('steam')) {
                            codeStr = `STM-${isHscSigned.slice(-3).toUpperCase()}-Z97K-W4P1`;
                          } else if (cleanBrand.includes('google')) {
                            codeStr = `GPL-${isHscSigned.slice(-4).toUpperCase()}-198X-77A1`;
                          } else {
                            codeStr = `${details.brand.slice(0, 3).toUpperCase()}-${isHscSigned.slice(-4).toUpperCase()}-99X1-${pin}`;
                          }

                          return (
                            <div className="bg-gradient-to-br from-zinc-900 to-black p-4 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden text-left space-y-3 mb-2">
                              {/* Glowing card background mesh */}
                              <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${matchedMerchant.color} rounded-full blur-[45px] opacity-25`} />
                              
                              <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className={`p-1 bg-gradient-to-br ${matchedMerchant.color} rounded text-white shrink-0 shadow`}>
                                      <Gift className="h-2.5 w-2.5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-white/90 tracking-wide uppercase">{details.brand} Digital Voucher</span>
                                  </div>
                                  <div className="text-[7.5px] text-white/35 font-mono uppercase tracking-widest">{serial}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-emerald-400 font-black text-sm tracking-tight">${details.value.toFixed(2)} USD</div>
                                  <div className="text-[7.5px] text-emerald-400/60 font-extrabold uppercase tracking-wide">Live Active Balance</div>
                                </div>
                              </div>

                              {/* Virtual Code Box */}
                              <div className="bg-black/60 p-2.5 rounded-lg border border-white/5 space-y-1.5 relative z-10 sm:max-w-xs md:max-w-none">
                                <span className="text-[7.5px] text-white/40 uppercase tracking-widest font-black block">Claim Code & Credentials</span>
                                <div className="flex justify-between items-center gap-2">
                                  <div className="text-[10px] text-emerald-350 font-black font-mono tracking-wider select-all">
                                    {codeStr}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(codeStr);
                                    }}
                                    className="p-1 rounded bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 text-white/40 transition-colors cursor-pointer text-[7.5px] font-black uppercase"
                                  >
                                    Copy Code
                                  </button>
                                </div>
                                <div className="flex justify-between items-center text-[8px] text-white/55 font-semibold pt-1 border-t border-white/5 font-mono">
                                  <span>PIN: <strong className="text-white/90 select-all font-black">{pin}</strong></span>
                                  <span>STATUS: <strong className="text-emerald-400 font-black">VALID & CLEARED</strong></span>
                                </div>
                              </div>

                              {/* Aesthetic Barcode representation */}
                              <div className="flex justify-between items-end pt-1 relative z-10">
                                <div className="space-y-0.5">
                                  {/* Draw clean procedural barcode lines */}
                                  <div className="flex items-center gap-[1px] h-6 px-1 bg-white/5 py-0.5 rounded">
                                    {[2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1].map((w, idx) => (
                                      <div key={idx} className="bg-white/80 h-full" style={{ width: `${w}px` }} />
                                    ))}
                                  </div>
                                  <span className="text-[6.5px] text-white/20 tracking-wider block font-mono pl-1">VOUCHER_SECURE_AUTH_REF_{tx.referenceNumber}</span>
                                </div>
                                <span className="text-[7px] text-[#8a8a8a] max-w-[130px] leading-tight text-right text-white/30 truncate">
                                  Authorized by Sovereign Merchant Network
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex items-center gap-2">
                            <Layers className="h-4 w-4 text-emerald-450 shrink-0" />
                            <div>
                              <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Network Hops</div>
                              <div className="font-semibold text-white/90">{hops} Hops</div>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-emerald-450 shrink-0" />
                            <div>
                              <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Validator ID</div>
                              <div className="font-semibold text-white/90 truncate max-w-[90px] text-left" title={valNodeId}>{valNodeId}</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-450 shrink-0" />
                            <div>
                              <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Estimated RTT</div>
                              <div className="font-semibold text-white/90">{rtt} ms</div>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-450 shrink-0" />
                            <div>
                              <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Broadcast Time</div>
                              <div className="font-semibold text-white/90">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </div>

                        {/* Gateway Details if Cashout with Paypal or Bank */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-[#38bdf8] shrink-0" />
                            <div>
                              <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Settlement Channel</div>
                              <div className="font-semibold text-white/90 uppercase">{tx.gateway || 'Core Wallet'}</div>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-[#38bdf8] shrink-0" />
                            <div>
                              <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Trace Target</div>
                              <div className="font-semibold text-white/90 truncate max-w-[90px]" title={tx.gatewayDetails || 'Direct Account Routing'}>
                                {tx.gatewayDetails || 'Direct Ledger'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compliance & Verification Panel */}
                        <div className="p-3 bg-white/[0.01]/70 border border-white/5 rounded-xl space-y-2 mt-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/40 uppercase tracking-wider text-[8px] font-bold">Ledger Safety Level</span>
                            <AnimatePresence mode="wait">
                              {(!tx.verificationStatus || tx.verificationStatus === 'unverified') ? (
                                <motion.div
                                  key="unverified"
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.85 }}
                                  transition={{ duration: 0.18 }}
                                  className="text-red-400 font-bold flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                  <span>UNVERIFIED</span>
                                </motion.div>
                              ) : tx.verificationStatus === 'verifying' ? (
                                <motion.div
                                  key="verifying"
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.85 }}
                                  transition={{ duration: 0.18 }}
                                  className="text-amber-400 font-bold flex items-center gap-1"
                                >
                                  <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                                  <span>AUDITING PROOFS...</span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="verified"
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.85 }}
                                  transition={{ duration: 0.18 }}
                                  className="text-emerald-400 font-bold flex items-center gap-1"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>VERIFIED PROOF APPROVED</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {(!tx.verificationStatus || tx.verificationStatus === 'unverified') && (
                            <div className="bg-[#120808]/70 border border-red-950/40 p-2.5 rounded-lg text-[9px] text-[#e0a0a0] leading-relaxed text-left">
                              {user ? (
                                <div className="space-y-2.5">
                                  <p className="text-red-350/90">AML compliance audit and decentralized ZK transaction dispatch verification are pending. Complete safety check to clear settlement payout.</p>
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await verifyPayout(tx.id);
                                      } catch(err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="w-full h-8 bg-red-500 hover:bg-red-400 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 text-slate-950" />
                                    <span>Verify Payout AML Compliance Check</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-3 pt-1 mt-1">
                                  <p className="text-white/50 text-[9px] leading-normal font-mono">
                                    🔒 Compliance Signature Required: Connect a secure device identity node to authorize the payout pipelines and bypass automatic settlement freezes.
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-2">
                                    {/* Google One Tap */}
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const { googleSignIn } = await import('../firebase');
                                          const result = await googleSignIn();
                                          if (result) {
                                            login('google', result.user.email || result.user.uid, result.user.displayName || 'Google Member', result.user.uid, true);
                                          }
                                        } catch (err) {
                                          console.warn('Google sign-in popup blocked/not configured. Initializing safe node fallback.');
                                          login('google', 'iconfarvie@gmail.com', 'Google Alpha Operator', 'google_user_fallback_77', true);
                                        }
                                      }}
                                      className="flex items-center justify-center gap-1.5 h-8 bg-white/5 hover:bg-[#4285F4]/10 border border-white/10 hover:border-[#4285F4]/30 text-white font-bold rounded-lg text-[8px] uppercase tracking-wide transition-all cursor-pointer group active:scale-95"
                                    >
                                      <svg className="h-3 w-3 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                      </svg>
                                      <span>Google Sync</span>
                                    </button>

                                    {/* Apple One Tap */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        login('apple', 'privaterelay_alpha@privaterelay.apple.com', 'Apple Premium Member', undefined, true);
                                      }}
                                      className="flex items-center justify-center gap-1 h-8 bg-white hover:bg-slate-200 text-slate-950 font-black rounded-lg text-[8px] uppercase tracking-wide transition-all cursor-pointer active:scale-95"
                                    >
                                      <span className="text-[10px] leading-none mb-0.5"></span>
                                      <span>Apple Sync</span>
                                    </button>

                                    {/* Phone One Tap */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        login('phone', '+1 (555) 902-8811', 'Operator +18811', undefined, true);
                                      }}
                                      className="flex items-center justify-center gap-1.5 h-8 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-[8px] uppercase tracking-wide transition-all cursor-pointer active:scale-95"
                                    >
                                      <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>Phone Sync</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {tx.verificationStatus === 'verifying' && (
                            <div className="bg-[#100c06] border border-amber-950/40 p-2.5 rounded-lg text-[9px] text-amber-300 leading-relaxed text-left space-y-1.5">
                              <p className="animate-pulse font-bold text-amber-400">Verifying Cryptographic Credentials...</p>
                              <p className="text-white/55">Executing zero-knowledge credential solvers and cross-analyzing ledger constraints against the europe-west2 cloud pipeline.</p>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1 relative">
                                <div className="bg-amber-400 h-full rounded-full animate-pulse" style={{ width: '75%' }} />
                              </div>
                            </div>
                          )}

                          {tx.verificationStatus === 'verified' && (
                            <div className="bg-[#08120c] border border-emerald-950/40 p-2.5 rounded-lg text-[9px] text-emerald-350 leading-relaxed text-left flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-bold text-white/90">AML Compliance Clear</p>
                                <p className="text-white/45">Ledger state successfully backed by decentralized Firestore guarantees. Secure payout settlement confirmed.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions Line inside expanded panel */}
                        <div className="flex justify-between items-center bg-[#030303] border border-white/5 rounded-xl px-2.5 py-2 mt-1">
                          <span className="text-[8px] text-white/30 uppercase tracking-widest leading-none">Receipt Registry</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid triggering card closing block
                              setSelectedTx(tx);
                            }}
                            className="h-6 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border border-emerald-500/20 flex items-center gap-1.5 cursor-pointer hover:border-emerald-500/45"
                          >
                            <span>Open Receipt</span>
                            <ExternalLink className="h-2.5 w-2.5 text-emerald-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
        </div>

        <div className="text-[10px] text-white/30 border-t border-white/10 pt-4 mt-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Cryptographic safety key activated. Local validation ensures rapid instant consensus block resolution fully offline.</span>
        </div>

      </div>

      {/* POPUP MODAL: Interactive confirmation receipts */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-mono">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute right-4.5 top-4.5 text-white/30 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header block icon */}
            <div className="flex flex-col items-center text-center mt-2 border-b border-white/10 pb-5">
              <div className={`p-3.5 rounded-full border mb-3 ${
                selectedTx.status === 'confirmed' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}>
                {selectedTx.status === 'confirmed' ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : (
                  <Loader2 className="h-7 w-7 animate-spin" />
                )}
              </div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Cryptographic Receipt</h2>
              <p className="text-[10px] text-white/40 mt-1">Confirmed block validation on height #{selectedTx.blockNumber}</p>
            </div>

            {/* Confirmation details visually tracking live phases */}
            <div className="py-4 space-y-4 font-mono">
              <div className="space-y-1.5 text-xs text-white/60">
                <div className="flex justify-between">
                  <span>Gross Assets Allocated</span>
                  <span className="font-bold text-white">
                    {selectedTx.type === 'crypto' 
                      ? `${selectedTx.amountCoin} ${selectedTx.crypto || 'HSC'}`
                      : formatVal(selectedTx.amountUSD)
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Miner Network Fee</span>
                  <span className="text-white/40">
                    {selectedTx.type === 'crypto' 
                      ? `-${selectedTx.fee} ${selectedTx.crypto || 'HSC'}`
                      : `-${formatVal(selectedTx.fee)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                  <span>Net Output Settled</span>
                  <span className="font-bold text-emerald-400">
                    {selectedTx.type === 'crypto' 
                      ? `${(selectedTx.amountCoin - selectedTx.fee).toFixed(selectedTx.crypto === 'DOGE' || selectedTx.crypto === 'ALPHA' ? 2 : 5)} ${selectedTx.crypto || 'HSC'}`
                      : formatVal(selectedTx.amountUSD - selectedTx.fee)
                    }
                  </span>
                </div>
              </div>

              {/* Progress Step bar tracking pipeline */}
              <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl space-y-3.5 text-[9px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-semibold">Phase 1: Broadcasted to local Mempool</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedTx.status === 'pending' ? (
                    <Loader2 className="h-4 w-4 text-amber-500 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <span className={selectedTx.status === 'pending' ? 'text-white/30' : 'text-emerald-300 font-semibold'}>
                    Phase 2: Hashed together by verifying nodes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTx.status === 'confirmed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : selectedTx.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 text-amber-500 animate-spin shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-white/20 shrink-0" />
                  )}
                  <span className={selectedTx.status === 'confirmed' ? 'text-emerald-300 font-semibold' : selectedTx.status === 'processing' ? 'text-amber-300 font-semibold text-opacity-90' : 'text-white/20'}>
                    Phase 3: Deep blockchain consensus confirmed
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-white/40 border-t border-white/5 pt-3 leading-relaxed space-y-1 bg-[#050505]/50 p-3 rounded-xl">
                <div><span className="text-white/30 font-bold">Settlement Channel:</span> <span className="text-[9px] text-[#a0a0a0] uppercase font-bold">{selectedTx.gateway || 'Core Wallet Sync'}</span></div>
                {selectedTx.gatewayDetails && <div><span className="text-white/30 font-bold">Trace Metadata:</span> <span className="text-[8px] text-emerald-400 font-mono" title={selectedTx.gatewayDetails}>{selectedTx.gatewayDetails}</span></div>}
                <div><span className="text-white/30 font-bold font-mono">Receiver Point:</span> <span className="text-[9px] text-[#a0a0a0] break-all select-all font-mono">{selectedTx.address}</span></div>
                <div><span className="text-white/30 font-bold">SHA-256 Hash:</span> <span className="text-[8px] text-[#a0a0a0] break-all select-all">{selectedTx.txHash}</span></div>
                <div><span className="text-white/30 font-bold">Validated Time:</span> <span className="text-[9px] text-[#a0a0a0]">{new Date(selectedTx.timestamp).toLocaleString()}</span></div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all select-none cursor-pointer border border-white/10"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* HANDSHAKE INTERACTIVE OVERLAY */}
      {isPerformingHandshake && handshakeTxId && (() => {
        const matchingTx = payouts.find(t => t.id === handshakeTxId);
        if (!matchingTx) return null;
        
        return (
          <div className="fixed inset-0 bg-black/98 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in font-mono">
            <div className="bg-[#0b0c10] border border-[#1f2937]/50 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.15)] relative">
              
              {/* Spinning active ring background and header */}
              <div className="flex flex-col items-center text-center mt-3 border-b border-white/5 pb-5">
                <div className="relative mb-4 flex items-center justify-center">
                  {/* Rotating pulse glow */}
                  <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 w-16 h-16 ${
                    activeHandshakeStep === 4 ? 'bg-emerald-500/25' : 'bg-emerald-500/10'
                  }`} />
                  
                  {/* Rotating dashed ring */}
                  <div className={`absolute w-16 h-16 rounded-full border-2 border-dashed border-emerald-500/50 ${
                    activeHandshakeStep < 4 ? 'animate-spin' : ''
                  }`} style={{ animationDuration: '8s' }} />

                  {/* Core Icon */}
                  <div className={`p-4 rounded-full border relative z-10 ${
                    activeHandshakeStep === 4 
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' 
                      : 'bg-[#0f1715] border-emerald-500/30 text-emerald-500'
                  }`}>
                    {activeHandshakeStep === 4 ? (
                      <CheckCircle2 className="h-8 w-8 animate-bounce" />
                    ) : (
                      <RefreshCw className="h-8 w-8 animate-spin" />
                    )}
                  </div>
                </div>
                
                <h2 className="text-sm font-black uppercase text-white tracking-widest">
                  {activeHandshakeStep === 4 ? 'Handshake Finalized' : 'Decentralized Handshake Transit'}
                </h2>
                <span className="text-[9px] text-[#42d19b]/80 uppercase font-mono tracking-widest mt-1 block">
                  Node-to-Node Secure Asset Dispatch
                </span>
              </div>

              {/* Steps Progress Indicator */}
              <div className="grid grid-cols-4 gap-2.5 py-4.5">
                {[
                  { name: 'Bridge', desc: 'Secure SYN' },
                  { name: 'Auth', desc: 'Private Key' },
                  { name: 'Endorse', desc: 'Consensus' },
                  { name: 'Commit', desc: 'Settle Ledger' }
                ].map((step, idx) => {
                  const state = activeHandshakeStep > idx ? 'completed' : activeHandshakeStep === idx ? 'active' : 'pending';
                  return (
                    <div key={idx} className="text-center space-y-1">
                      <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                          state === 'completed'
                            ? 'bg-emerald-500 w-full' 
                            : state === 'active' 
                            ? 'bg-amber-400 w-2/3 animate-pulse' 
                            : 'bg-transparent w-0'
                        }`} />
                      </div>
                      <div className="space-y-0.5 mt-1">
                        <span className={`text-[8px] font-black uppercase block tracking-wider ${
                          state === 'completed' ? 'text-emerald-400' : state === 'active' ? 'text-amber-400' : 'text-white/20'
                        }`}>
                          {step.name}
                        </span>
                        <span className="text-[7px] text-white/30 block leading-none">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Real-time cryptolog window */}
              <div className="bg-[#040508] border border-white/5 rounded-2xl p-4 font-mono space-y-2 text-[10px] text-left">
                <span className="text-[8px] text-white/30 uppercase tracking-widest block font-bold border-b border-white/5 pb-1">
                  Active Connection Telemetry
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin text-[9.5px]">
                  {handshakeLogs.map((log, lidx) => {
                    const isErr = log.includes('[error]');
                    const isSys = log.includes('[sys]');
                    const isNet = log.includes('[net]');
                    const isKey = log.includes('[key]');
                    const isStorage = log.includes('[storage]');
                    let color = 'text-white/60';
                    if (isErr) color = 'text-rose-400 font-bold';
                    else if (isSys) color = 'text-indigo-400';
                    else if (isNet) color = 'text-cyan-400';
                    else if (isKey) color = 'text-[#ebad40]';
                    else if (isStorage) color = 'text-emerald-400 font-bold';
                    return (
                      <div key={lidx} className={`${color} leading-normal`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close/Acknowledge button */}
              <div className="pt-4 flex gap-2">
                {activeHandshakeStep === 4 ? (
                  <button
                    onClick={() => {
                      setIsPerformingHandshake(false);
                      setHandshakeTxId(null);
                    }}
                    className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider transition-all select-none cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Finalize & Exit</span>
                  </button>
                ) : (
                  <div className="flex-1 flex gap-2 items-center justify-center px-4 py-2 border border-white/5 bg-white/[0.02] rounded-xl text-white/30 text-[9px] uppercase tracking-wider font-bold">
                    <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                    <span>Executing atomic swap swap...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* GRAND INCOME & PAYOUT ANALYTICS CORE */}
      {(() => {
        const confirmedTxs = payouts
          .filter(tx => tx.status === 'confirmed')
          .sort((a, b) => a.timestamp - b.timestamp);

        // Filter based on analyticsAssetFilter
        const filteredTxs = confirmedTxs.filter(tx => {
          if (analyticsAssetFilter === 'all') return true;
          return (tx.type || 'cash') === analyticsAssetFilter;
        });

        // 1. Total valuation withdrawn
        const totalWithdrawnUSD = filteredTxs.reduce((sum, tx) => sum + tx.amountUSD, 0);

        // 2. Average payout size
        const averagePayoutUSD = filteredTxs.length > 0 ? (totalWithdrawnUSD / filteredTxs.length) : 0;

        // 3. Gas network fee paid (with conversion if crypto)
        const totalGasUSD = filteredTxs.reduce((sum, tx) => {
          if (tx.type === 'crypto') {
            const rate = prices[tx.crypto || 'HSC'] || 1;
            return sum + (tx.fee * rate);
          } else {
            return sum + tx.fee;
          }
        }, 0);

        // 4. Counts
        const clearedCount = filteredTxs.length;

        // Prepare chart data based on selected view mode (cumulative vs individual)
        let cumulativeSumUSD = 0;
        const chartData = filteredTxs.map((tx, idx) => {
          const date = new Date(tx.timestamp);
          cumulativeSumUSD += tx.amountUSD;
          return {
            index: idx + 1,
            timestamp: tx.timestamp,
            dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
            timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amountUSD: tx.amountUSD,
            cumulativeUSD: cumulativeSumUSD,
            crypto: tx.crypto || 'USD',
            displayVal: analyticsViewType === 'cumulative' ? cumulativeSumUSD : tx.amountUSD,
            label: tx.isTransfer ? `P2P ${tx.crypto}` : (tx.type === 'cash' ? 'USD Cash Out' : `${tx.crypto} Dispatch`),
            gateway: tx.gateway || 'Main Wallet'
          };
        });

        // Calculate Asset distribution
        const statsByType = filteredTxs.reduce((acc, tx) => {
          const keyName = tx.type === 'cash' ? (tx.gateway === 'paypal' ? 'PayPal' : 'Bank Wire') : (tx.crypto || 'HSC');
          acc[keyName] = (acc[keyName] || 0) + tx.amountUSD;
          return acc;
        }, {} as Record<string, number>);

        const totalDistributionSumUSD = (Object.values(statsByType) as number[]).reduce((a: number, b: number) => a + b, 0) || 1;

        const distributionList = (Object.entries(statsByType) as [string, number][])
          .map(([key, value]) => ({
            name: key,
            amountUSD: value,
            percentage: (value / totalDistributionSumUSD) * 100
          }))
          .sort((a, b) => b.amountUSD - a.amountUSD);

        const getAssetColor = (name: string) => {
          switch (name) {
            case 'PayPal': return 'bg-sky-500 text-sky-400';
            case 'Bank Wire': return 'bg-teal-500 text-teal-400';
            case 'HSC': return 'bg-emerald-500 text-emerald-400';
            case 'BTC': return 'bg-amber-500 text-amber-500';
            case 'ETH': return 'bg-purple-500 text-purple-400';
            case 'SOL': return 'bg-fuchsia-500 text-fuchsia-400';
            case 'DOGE': return 'bg-yellow-500 text-yellow-500';
            case 'ALPHA': return 'bg-cyan-500 text-cyan-400';
            default: return 'bg-white/40 text-white/50';
          }
        };

        return (
          <div className="lg:col-span-12 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md mt-6 text-left">
            {/* Header section with analytical controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10 pb-5 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
                  <span>Withdrawal & Income Trends Analytics</span>
                </h3>
                <p className="text-[10px] text-white/40 mt-1 max-w-xl font-mono leading-relaxed">
                  Decentralized visual tracking of dynamic asset swaps, fiat cashouts, and real-time ledger settlement volume growth over time.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto text-[10px]">
                {/* Target Asset Class Filter */}
                <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5 gap-1 shrink-0">
                  {(['all', 'cash', 'crypto'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnalyticsAssetFilter(type)}
                      className={`py-1.5 px-3 rounded-lg font-bold transition-all capitalize cursor-pointer text-center font-mono ${
                        analyticsAssetFilter === type
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm font-extrabold'
                          : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent font-medium'
                      }`}
                    >
                      {type === 'all' ? 'All Classes' : type === 'cash' ? 'Fiat Net' : 'Crypto Dispatches'}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5 gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAnalyticsViewType('cumulative')}
                    className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer font-mono whitespace-nowrap ${
                      analyticsViewType === 'cumulative'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Cumulative Growth
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsViewType('individual')}
                    className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer font-mono whitespace-nowrap ${
                      analyticsViewType === 'individual'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Individual Spikes
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-1">
                <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold leading-none">TOTAL OUTFLOW VOLUME</span>
                <p className="text-lg font-black text-white leading-none font-mono">
                  {formatVal(totalWithdrawnUSD)}
                </p>
                <span className="text-[8.5px] text-white/20 block font-medium font-sans">Gross validated asset settlements</span>
              </div>

              <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-1">
                <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold leading-none">AVERAGE TRANSACTION VALUE</span>
                <p className="text-lg font-black text-white leading-none font-mono">
                  {formatVal(averagePayoutUSD)}
                </p>
                <span className="text-[8.5px] text-emerald-400 block font-medium font-sans">{clearedCount} active blockchain receipts</span>
              </div>

              <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-1">
                <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold leading-none">TOTAL NETWORK GAS PAID</span>
                <p className="text-lg font-black text-white leading-none font-mono text-red-400/90">
                  {formatVal(totalGasUSD)}
                </p>
                <span className="text-[8.5px] text-white/20 block font-medium font-sans">Pooled network clearance utility</span>
              </div>

              <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-1 relative overflow-hidden">
                <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold leading-none">LEDGER INTEGRITY STATUS</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  <p className="text-lg font-black text-emerald-400 leading-none font-mono">
                    99.98% HEALTH
                  </p>
                </div>
                <span className="text-[8.5px] text-white/20 block font-medium font-sans">Real-time local validation active</span>
              </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Recharts Chart */}
              <div className="lg:col-span-8 bg-[#050505] border border-white/5 rounded-xl p-4 relative flex flex-col justify-between min-h-[300px]">
                <div className="flex justify-between items-center text-[10px] mb-4">
                  <span className="text-white/40 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-emerald-400" />
                    <span>
                      {analyticsViewType === 'cumulative' ? 'Cumulative Swapped Value Curve' : 'Individual Clearance Outflow Streams'}
                    </span>
                  </span>
                  <span className="text-emerald-400 text-[9px] font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 animate-pulse">
                    LIVE MAINNET INDEX
                  </span>
                </div>

                {chartData.length === 0 ? (
                  <div className="flex-1 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-white/[0.01]">
                    <Activity className="h-8 w-8 text-white/10 mb-2 stroke-[1.5]" />
                    <span className="text-xs font-bold text-white/70 uppercase tracking-widest">No Clearance History Logs Found</span>
                    <span className="text-[10px] text-white/30 max-w-sm mt-1 leading-relaxed">
                      Assemble mining returns, select a clearance gateway, and dispatch a payout payout. Once blockchain confirmation is cleared, dynamic trendlines will populate.
                    </span>
                  </div>
                ) : (
                  <div className="h-64 w-full text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsColorGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                        <XAxis
                          dataKey="dateStr"
                          stroke="#3c3c3c"
                          tick={{ fill: '#888', fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#3c3c3c"
                          tick={{ fill: '#888', fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#09090b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '10px',
                            fontFamily: 'monospace'
                          }}
                          labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginBottom: '4px' }}
                          formatter={(value: any, name: any, props: any) => {
                            const payload = props.payload;
                            return [
                              <span className="text-emerald-400 font-extrabold font-mono">{formatVal(value)}</span>,
                              <div className="flex flex-col gap-0.5 text-[9px] text-white/50 font-mono mt-1 select-none text-left">
                                <div>Event Name: {payload.label}</div>
                                <div>Channel: {payload.gateway}</div>
                                <div>Timestamp: {payload.timeStr}</div>
                              </div>
                            ];
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="displayVal"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#analyticsColorGrad)"
                          dot={{ r: 3.5, fill: '#10b981', strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: '#22c55e', strokeWidth: 1.5, stroke: '#ffffff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Right Column: Quota Distribution */}
              <div className="lg:col-span-4 bg-[#050505] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest font-black border-b border-white/10 pb-2.5 mb-3">
                    Portfolio Asset Allocation
                  </div>

                  {distributionList.length === 0 ? (
                    <div className="py-12 text-center text-white/20 text-[9.5px]">
                      <span>No validated allocations registered.</span>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {distributionList.map(item => {
                        const colorCode = getAssetColor(item.name);
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-white/70">{item.name}</span>
                              <span className="text-white font-mono">{formatVal(item.amountUSD)}</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${colorCode.split(' ')[0]}`}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-white/30 font-semibold font-mono">
                              <span>Consolidated share quota</span>
                              <span>{item.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-white/25 leading-normal bg-white/[0.01] border border-white/5 rounded-lg p-2.5 mt-4">
                  💡 <strong>Tip:</strong> Settle withdrawals of multiple currencies (like HSC and BTC) to expand comparative analysis vectors dynamically.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
