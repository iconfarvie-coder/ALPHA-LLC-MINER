import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { PayoutTransaction } from '../types';
import { Wallet, CheckCircle2, Loader2, ArrowUpRight, HelpCircle, AlertCircle, Clock, ExternalLink, ShieldCheck, X, Landmark, Send, Coins, Layers, Cpu, Activity, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

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
  } = useMining();

  const [payoutInput, setPayoutInput] = useState<string>(payoutAddress);
  
  // Tab controller: 'cash' (USD payout) vs 'crypto' (external direct dispatch)
  const [activeFormTab, setActiveFormTab] = useState<'cash' | 'crypto'>('cash');

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

    const res = requestPayout(targetAddress, amount, cashGateway, detailsStr);
    if (res.success) {
      setSuccessMsg(`Cash out request (${cashGateway.toUpperCase()}) successfully processed and broadcast to clearing agents!`);
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

    const res = requestCryptoTransfer(selectedCrypto, targetAddr, amount);
    if (res.success) {
      setSuccessMsg(`Distributed dispatch successfully committed to blockchain!`);
      setTransferAmount('');
      if (res.tx) {
        setSelectedTx(res.tx); // Auto-open receipt
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(res.message);
    }
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
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeFormTab === 'cash'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 bg-transparent'
            }`}
          >
            <Landmark className="h-4 w-4" />
            <span>Cash Out ({selectedCurrency})</span>
          </button>
          
          <button
            onClick={() => {
              setActiveFormTab('crypto');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeFormTab === 'crypto'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 bg-transparent'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>Crypto External Dispatch</span>
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

      </div>

      {/* RIGHT: Confirmation Blockchain ledger */}
      <div className="lg:col-span-5 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono flex flex-col justify-between min-h-[460px]">
        <div>
          <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
            <Clock className="h-4.5 w-4.5 text-emerald-400" />
            <span>Payout Ledger Status</span>
          </h3>

          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30 leading-relaxed text-center">
              <Wallet className="h-10 w-10 text-white/10 mb-2 stroke-[1.2]" />
              <p className="text-xs">No payout records in memory.</p>
              <p className="text-[10px] text-white/20 mt-1 max-w-xs">Accumulate enough coins or cash and submit a request on the left. Transaction steps are verified instantly here!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {payouts.map(tx => {
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
                    className="p-3.5 bg-[#050505]/90 rounded-xl border border-white/10 hover:border-white/25 hover:bg-[#080808]/95 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-center w-full">
                      <div>
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

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`py-0.5 px-2 rounded-full border text-[8px] font-bold flex items-center gap-1.5 ${conf.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${conf.dot} ${tx.status !== 'confirmed' ? 'animate-pulse' : ''}`} />
                          <span>{tx.status === 'confirmed' ? 'Confirmed' : tx.status === 'processing' ? 'Hashing' : 'Mempool'}</span>
                        </div>
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
          )}
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

    </div>
  );
};
