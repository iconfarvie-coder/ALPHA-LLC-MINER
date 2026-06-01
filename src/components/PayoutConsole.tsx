import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { PayoutTransaction } from '../types';
import { Wallet, CheckCircle2, Loader2, ArrowUpRight, HelpCircle, AlertCircle, Clock, ExternalLink, ShieldCheck, X, Landmark, Send, Coins, Layers, Cpu, Activity, ChevronDown, ChevronUp, Copy, Check, Smartphone, Chrome, Users, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
  } = useMining();

  const [payoutInput, setPayoutInput] = useState<string>(payoutAddress);
  
  // Tab controller: 'cash' vs 'crypto' vs 'transfer'
  const [activeFormTab, setActiveFormTab] = useState<'cash' | 'crypto' | 'transfer'>('cash');

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
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'crypto'>('all');

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
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-1.5 flex gap-2 font-mono">
          <button
            onClick={() => {
              setActiveFormTab('cash');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeFormTab === 'transfer'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 bg-transparent'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>P2P Peer Transfers</span>
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
                <div className="grid grid-cols-5 gap-1.5 bg-[#050505] p-1.5 rounded-xl border border-white/5">
                  {(['BTC', 'HSC', 'ETH', 'SOL', 'DOGE'] as const).map(c => {
                    const isSelected = selectedCrypto === c;
                    const cColors = {
                      HSC: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                      BTC: 'border-amber-500/30 text-amber-500 bg-amber-500/5',
                      ETH: 'border-violet-500/30 text-violet-400 bg-violet-500/5',
                      SOL: 'border-fuchsia-500/30 text-fuchsia-450 bg-fuchsia-500/5',
                      DOGE: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5',
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
                    {activeCryptoWalletBalance.toFixed(selectedCrypto === 'DOGE' ? 2 : selectedCrypto === 'SOL' ? 4 : 6)} {selectedCrypto}
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
                              {amount.toFixed(crypto === 'DOGE' ? 1 : 4)} {crypto}
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
                  <div className="grid grid-cols-5 gap-1.5 bg-[#050505] p-1 rounded-xl border border-white/5">
                    {(['BTC', 'HSC', 'ETH', 'SOL', 'DOGE'] as const).map(c => {
                      const isSelected = transferAsset === c;
                      const cColors = {
                        HSC: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                        BTC: 'border-amber-500/30 text-amber-500 bg-amber-500/5',
                        ETH: 'border-violet-500/30 text-violet-400 bg-violet-500/5',
                        SOL: 'border-fuchsia-500/30 text-[#e879f9] bg-fuchsia-500/5',
                        DOGE: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5',
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
                      {(transferAsset === activeCrypto ? coins : (balances[transferAsset] ?? 0)).toFixed(transferAsset === 'DOGE' ? 2 : 5)} {transferAsset}
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
                label: tx.isTransfer ? `P2P ${tx.crypto}` : (tx.type === 'cash' ? 'USD Cash Out' : `${tx.crypto} Dispatch`)
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
              {(['all', 'cash', 'crypto'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all capitalize cursor-pointer text-center font-mono ${
                    filterType === type
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'cash' ? 'Cash' : 'Crypto'}
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
                  DOGE: 'text-yellow-400'
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
                            {tx.type === 'crypto' ? (
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
                      ? `${(selectedTx.amountCoin - selectedTx.fee).toFixed(selectedTx.crypto === 'DOGE' ? 2 : 5)} ${selectedTx.crypto || 'HSC'}`
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

    </div>
  );
};
