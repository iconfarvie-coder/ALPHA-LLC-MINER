import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { PayoutTransaction } from '../types';
import { Wallet, CheckCircle2, Loader2, ArrowUpRight, HelpCircle, AlertCircle, Clock, ExternalLink, ShieldCheck, X, Landmark, Send, Coins } from 'lucide-react';

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
  
  // Crypto Form states
  const [selectedCrypto, setSelectedCryptoState] = useState<string>(activeCrypto);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [externalAddress, setExternalAddress] = useState<string>(payoutAddress || '');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<PayoutTransaction | null>(null);

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

    const targetAddress = payoutAddress || payoutInput || 'HSC_DefaultHotWallet';
    const res = requestPayout(targetAddress, amount);
    if (res.success) {
      setSuccessMsg('Cash payout successfully broadcasted to server ledger!');
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
                  onClick={handleUpdateAddress}
                  className="px-4.5 h-10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/10 shrink-0 cursor-pointer"
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
                <span className="text-white/40 font-semibold">Withdrawable Balance ({selectedCurrency}):</span>
                <span className="font-bold text-emerald-400">
                  {formatVal(usd)}
                </span>
              </div>

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
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                Secure USD Cash Out
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
                  {(['HSC', 'BTC', 'ETH', 'SOL', 'DOGE'] as const).map(c => {
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

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="p-3.5 bg-[#050505]/90 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
                  >
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
                      <ExternalLink className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
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
                <div><span className="text-white/30 font-bold">Wallet Address:</span> <span className="text-[9px] text-[#a0a0a0] break-all select-all">{selectedTx.address}</span></div>
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
