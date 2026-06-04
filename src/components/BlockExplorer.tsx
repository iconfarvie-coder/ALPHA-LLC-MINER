import React, { useState, useEffect } from 'react';
import { useMining } from '../context/MiningContext';
import { SimulatedBlock, UserTransaction } from '../types';
import { 
  Database, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Award, 
  Fingerprint, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Blocks,
  Network,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Send,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

export function BlockExplorer() {
  const { 
    simulatedBlocks, 
    userTransactions, 
    logUserTransaction, 
    user, 
    formatVal, 
    prices,
    activeCrypto,
    coins,
    usd,
    liveGateways
  } = useMining();
  
  // Tab control state
  const [activeSubTab, setActiveSubTab] = useState<'blocks' | 'validator' | 'custom-txs'>('blocks');

  // Filtering & Pagination State for L1 Blocks
  const [selectedCrypto, setSelectedCrypto] = useState<string>('ALL');
  const [searchMiner, setSearchMiner] = useState<string>('');
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Manual Transaction Creator States
  const [txType, setTxType] = useState<UserTransaction['type']>('CUSTOM_GENERATED');
  const [txTitle, setTxTitle] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txRecipient, setTxRecipient] = useState<string>('');
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);

  // Copied indicator state to replace window.alert
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const triggerCopy = (str: string) => {
    navigator.clipboard.writeText(str);
    setCopiedText(str);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Track the most recent block ID to flash newly created blocks
  const [lastBlockId, setLastBlockId] = useState<string>('');
  
  useEffect(() => {
    if (simulatedBlocks.length > 0) {
      setLastBlockId(simulatedBlocks[0].id);
    }
  }, [simulatedBlocks]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCrypto, searchMiner, onlyMine]);

  // Filters logic for L1 Blocks
  const filteredBlocks = simulatedBlocks.filter(block => {
    if (selectedCrypto !== 'ALL' && block.crypto !== selectedCrypto) {
      return false;
    }
    if (searchMiner.trim() !== '') {
      const search = searchMiner.toLowerCase();
      const miner = block.miner.toLowerCase();
      const hash = block.hash.toLowerCase();
      const heightStr = block.height.toString();
      if (!miner.includes(search) && !hash.includes(search) && !heightStr.includes(search)) {
        return false;
      }
    }
    if (onlyMine) {
      const isMyBlock = block.miner.includes('✨') || (user && block.miner.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]));
      if (!isMyBlock) {
        return false;
      }
    }
    return true;
  });

  // Pagination bounds
  const totalItems = filteredBlocks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBlocks = filteredBlocks.slice(startIndex, startIndex + itemsPerPage);

  // Cryptocurrency Style Map
  const cryptoStyleMap: Record<string, { bg: string; text: string; border: string; glow: string; networkName: string }> = {
    BTC: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/5', networkName: 'Bitcoin Mainnet Core' },
    ETH: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/5', networkName: 'Ethereum Mainnet (EVM)' },
    SOL: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/5', networkName: 'Solana High-Performance (SVM)' },
    DOGE: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/5', networkName: 'Dogecoin AuxPoW Network' },
    HSC: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/5', networkName: 'Hyper Sovereign Consensus' },
    ALPHA: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/5', networkName: 'Alpha Consensus Sharded Mainnet' },
  };

  const getCryptoProps = (crypto: string) => {
    return cryptoStyleMap[crypto] || { bg: 'bg-white/5', text: 'text-white/80', border: 'border-white/10', glow: '', networkName: 'L1 Blockchain' };
  };

  // Helper block reward valuation
  const getBlockUSDValuation = (block: SimulatedBlock) => {
    const coinPrice = prices[block.crypto] || 0;
    return formatVal(block.reward * coinPrice);
  };

  // Humanize timestamps
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatHeight = (num: number) => num.toLocaleString('en-US');

  const myBlocksCount = simulatedBlocks.filter(block => {
    return block.miner.includes('✨') || (user && block.miner.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]));
  }).length;

  // Active validation identifiers
  const ALPHA_VALIDATOR_ID = 'ALPHA_LLC_MINE_SYS_VALIDATOR_894_SECURE_L1';

  // Handle broadcasting a manual transaction with unique identifier
  const handleBroadcastTx = (e: React.FormEvent) => {
    e.preventDefault();
    setCreationError(null);
    setCreationSuccess(null);

    if (!txTitle.trim()) {
      setCreationError('Please specify a descriptive transaction title.');
      return;
    }
    if (!txAmount.trim()) {
      setCreationError('Please define a cryptocurrency or USD value amount.');
      return;
    }
    if (!txRecipient.trim()) {
      setCreationError('Please enter a target recipient wallet or gateway routing identifier.');
      return;
    }

    const newTx = logUserTransaction(txType, txTitle, txAmount, txRecipient, 'VERIFIED');
    setCreationSuccess(`Broadcasting successful! Transaction #${newTx.id} appended to ALPHA LLC MINER Decentralized Registrar.`);
    
    // Clear inputs
    setTxTitle('');
    setTxAmount('');
    setTxRecipient('');
    
    setTimeout(() => {
      setCreationSuccess(null);
    }, 6000);
  };

  return (
    <div id="block_explorer_tab" className="space-y-6">
      
      {/* Toast-like visual copied state check */}
      {copiedText && (
        <div className="fixed bottom-6 right-6 bg-emerald-500/90 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-400/30 shadow-2xl transition-all duration-300 transform translate-y-0 flex items-center gap-2 z-50">
          <Check className="h-4 w-4 stroke-[2.5]" />
          <span>Copied value: {copiedText.substring(0, 24)}...</span>
        </div>
      )}

      {/* Visual Header Console card */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="bg-gradient-to-tr from-emerald-500/10 to-teal-400/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl shadow-lg mt-0.5">
              <Blocks className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>ALPHA LLC MINER — Ledger & Explorer Cores</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  ACTIVE NODES CONNECTED
                </span>
              </h2>
              <p className="text-xs text-white/50 mt-1 leading-normal max-w-xl">
                Audits secure block height solving events, multi-protocol bridges, and validator connections using the audited <strong className="text-white">ALPHA LLC MINER</strong> credential architecture.
              </p>
            </div>
          </div>

          {/* Quick Statistics Panels */}
          <div className="grid grid-cols-2 gap-4 font-mono w-full md:w-auto shrink-0 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
            <div className="bg-[#050505] border border-white/5 p-3 rounded-xl">
              <span className="text-[10px] text-white/30 uppercase block font-semibold leading-none">Global Logs solved</span>
              <span className="font-bold text-white text-sm mt-2 block font-mono">
                {simulatedBlocks.length} Blocks
              </span>
            </div>
            <div className="bg-[#050505] border border-white/5 p-3 rounded-xl relative overflow-hidden">
              <span className="text-[10px] text-emerald-400/80 uppercase block font-semibold leading-none">Your Solves</span>
              <span className="font-bold text-emerald-400 text-sm mt-2 block font-mono">
                {myBlocksCount} Solves
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Subtabs */}
      <div className="flex border-b border-white/10 gap-1.5 font-mono text-xs">
        <button
          onClick={() => setActiveSubTab('blocks')}
          className={`px-4 py-2.5 border-b-2 text-[11px] font-bold uppercase cursor-pointer transition-all ${
            activeSubTab === 'blocks'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]'
              : 'border-transparent text-white/45 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5" />
            <span>L1 Blockchain Blocks</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('validator')}
          className={`px-4 py-2.5 border-b-2 text-[11px] font-bold uppercase cursor-pointer transition-all ${
            activeSubTab === 'validator'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]'
              : 'border-transparent text-white/45 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <Network className="h-3.5 w-3.5" />
            <span>Alpha Validator Bridges</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('custom-txs')}
          className={`px-4 py-2.5 border-b-2 text-[11px] font-bold uppercase cursor-pointer transition-all ${
            activeSubTab === 'custom-txs'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]'
              : 'border-transparent text-white/45 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send className="h-3.5 w-3.5" />
            <span>ID Generator & Registry</span>
          </div>
        </button>
      </div>

      {/* SUBTAB 1: L1 Block Explorer Grid */}
      {activeSubTab === 'blocks' && (
        <div className="space-y-6">
          {/* Inputs Filter & Search Bar */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center gap-4 shadow-md font-mono text-xs">
            
            {/* Search input field */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 h-4 w-4" />
              <input
                type="text"
                placeholder="Search block height, miner or hash..."
                value={searchMiner}
                onChange={(e) => setSearchMiner(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl h-10 pl-10 pr-4 text-white placeholder-white/30 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans text-xs"
              />
            </div>

            {/* Currency selector filter */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-[10px] text-white/30 uppercase font-semibold shrink-0 hidden lg:inline">Network:</span>
              {['ALL', 'HSC', 'BTC', 'ETH', 'SOL', 'DOGE', 'ALPHA'].map(c => {
                const isActive = selectedCrypto === c;
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCrypto(c)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer transition-all shrink-0 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/5 border-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {c === 'ALL' ? 'All Chains' : c}
                  </button>
                );
              })}
            </div>

            {/* Switched mine check */}
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`h-10 px-3.5 rounded-xl border font-bold flex items-center gap-2 justify-center transition-all w-full md:w-auto cursor-pointer shrink-0 ${
                onlyMine 
                  ? 'bg-[#0f2a1e] border-emerald-500/40 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              <Award className="h-4 w-4 shrink-0" />
              <span>My Solves</span>
              {myBlocksCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-[9px]">
                  {myBlocksCount}
                </span>
              )}
            </button>
          </div>

          {/* Table */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              {paginatedBlocks.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#080808] font-mono text-[10px] uppercase text-white/40 tracking-wider">
                      <th className="py-4 px-4 sm:px-6 font-semibold">Chain / Height</th>
                      <th className="py-4 px-4 font-semibold hidden md:table-cell">Block Hash</th>
                      <th className="py-4 px-4 font-semibold">Miner Identifier</th>
                      <th className="py-4 px-4 font-semibold text-right">Difficulty</th>
                      <th className="py-4 px-4 sm:px-6 font-semibold text-right">Reward / Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs text-white/75">
                    {paginatedBlocks.map((block) => {
                      const style = getCryptoProps(block.crypto);
                      const isNew = block.id === lastBlockId;
                      const isUserMined = block.miner.includes('✨') || (user && block.miner.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]));

                      return (
                        <tr 
                          key={block.id}
                          className={`group hover:bg-white/5 transition-colors ${
                            isNew ? 'bg-emerald-500/[0.04]' : ''
                          } ${
                            isUserMined ? 'bg-emerald-500/[0.02]' : ''
                          }`}
                        >
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                                {block.crypto}
                              </span>
                              <span className="font-bold text-white tracking-widest text-[13px]">
                                #{formatHeight(block.height)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-[#808080]/60 mt-1 pl-0.5 font-semibold">
                              <Clock className="h-3 w-3 shrink-0 text-white/30" />
                              <span>{formatTimeAgo(block.timestamp)}</span>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-mono text-[11px] text-white/30 hidden md:table-cell max-w-[120px] lg:max-w-xs truncate">
                            <span 
                              className="hover:text-emerald-400 cursor-copy select-all flex items-center gap-1"
                              onClick={() => triggerCopy(block.hash)}
                            >
                              <span>{block.hash.substring(0, 16)}...{block.hash.substring(block.hash.length - 8)}</span>
                              <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-ellipsis overflow-hidden">
                              {isUserMined ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-1 mr-0.5 flex shrink-0">
                                  <ShieldCheck className="h-3 w-3" />
                                </div>
                              ) : (
                                <div className="bg-white/5 text-white/30 p-1 rounded-lg shrink-0">
                                  <Fingerprint className="h-3 w-3" />
                                </div>
                              )}
                              <span 
                                className={`font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] lg:max-w-xs ${
                                  isUserMined ? 'text-emerald-400 font-extrabold' : 'text-white/85'
                                }`}
                              >
                                {block.miner}
                              </span>
                            </div>
                            <div className="text-[9px] text-white/20 mt-1 pl-5">
                              L1 Consensus Unit Node
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right font-bold text-white/60">
                            <span>{block.difficulty}</span>
                            <div className="text-[9px] text-[#808080]/60 font-semibold mt-1">
                              Network Target
                            </div>
                          </td>

                          <td className="py-4 px-4 sm:px-6 text-right font-bold">
                            <span className="text-white">
                              +{block.crypto === 'BTC' ? block.reward.toFixed(4) : block.reward.toLocaleString()} {block.crypto}
                            </span>
                            <div className="text-[10px] text-emerald-400 font-medium mt-1">
                              ≈ {getBlockUSDValuation(block)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-white/30 space-y-3">
                  <Database className="h-10 w-10 mx-auto text-white/10 stroke-[1]" />
                  <p className="font-mono text-xs uppercase font-bold tracking-wide">No solved blocks found</p>
                  <p className="text-xs text-white/20 max-w-sm mx-auto font-sans">
                    No matching blocks meet selection criteria. Ensure nodes are active on the main dashboard tab.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-white/5 bg-[#080808] p-4 flex items-center justify-between font-mono text-xs">
                <span className="text-white/30 text-[10px] uppercase font-semibold">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} Blocks
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-white/80 font-bold px-3 py-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ALPHA LLC MINER Validating Nodes Handshaker */}
      {activeSubTab === 'validator' && (
        <div className="space-y-6 animate-fadeIn font-mono">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main credentials overview block */}
            <div className="lg:col-span-1 bg-[#121212] border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider block">ALPHA LLC MINER Node Identifier</span>
                
                <div 
                  className="bg-[#050505] border border-white/10 p-3 rounded-xl mt-2 flex items-center justify-between group cursor-pointer hover:border-emerald-500/20"
                  onClick={() => triggerCopy(ALPHA_VALIDATOR_ID)}
                  title="Click to copy ID"
                >
                  <span className="text-emerald-400 font-extrabold text-[11px] block truncate max-w-[180px]">
                    {ALPHA_VALIDATOR_ID}
                  </span>
                  <Copy className="h-3.5 w-3.5 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </div>

                <div className="space-y-2 mt-4 text-[11px] text-white/55">
                  <div className="flex justify-between">
                    <span>Validation Status:</span>
                    <span className="text-emerald-400 font-bold">100% OPERATIONAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Main Stratum Port:</span>
                    <span className="text-white font-bold">3333 (SSL SECURE)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocol Handshakes:</span>
                    <span className="text-white font-bold">5 L1 Blockchains active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Global Net Rating:</span>
                    <span className="text-white font-bold">Tier-1 Node Operator</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-white/40 font-bold uppercase">Real-Time Ledger Checksum OK</span>
                </div>
              </div>
            </div>

            {/* Protocol Bridges validating identifiers */}
            <div className="lg:col-span-2 bg-[#0d0d0d] border border-white/10 p-5 rounded-2xl relative">
              <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-4">
                Accessible Blockchain Integrations & Validations
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['HSC', 'BTC', 'ETH', 'SOL', 'DOGE', 'ALPHA'].map(c => {
                  const props = getCryptoProps(c);
                  const randomHash = '00000000' + Math.random().toString(36).substring(2, 10).toUpperCase() + '...' + Math.random().toString(36).substring(2, 6).toUpperCase();
                  
                  return (
                    <div key={c} className="bg-[#050505] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-500/10 ${props.bg} ${props.text}`}>
                            {c}
                          </span>
                          <span className="text-white font-bold text-xs">{props.networkName}</span>
                        </div>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      <div className="space-y-1.5 text-[10px] text-[#808080]/80 mt-3.5">
                        <div className="flex justify-between">
                          <span>Connection:</span>
                          <span className="text-emerald-400 font-black">VALIDATED SECURE</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verification Hash:</span>
                          <span className="font-mono text-white/50">{randomHash}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Live Explorer Bridge:</span>
                          <span className="text-emerald-400 underline cursor-pointer hover:text-emerald-300 flex items-center gap-1" onClick={() => triggerCopy(`${c}_EXPLORER_LEDGER_HASH`)}>
                            <span>View Explorer Ledger</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Validation Feed simulation */}
          <div className="bg-[#0f0f0f] border border-white/10 p-4 sm:p-5 rounded-2xl">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-3">Live Validation Logs</span>
            <div className="bg-[#050505] border border-white/5 p-3 sm:p-4 rounded-xl font-mono text-[9px] text-emerald-400/80 space-y-2 leading-relaxed h-[150px] overflow-y-auto max-w-full">
              <div>[{new Date().toLocaleTimeString()}] [ALPHA_LLC_MINE] Successfully loaded block synchronization protocols...</div>
              <div>[{new Date().toLocaleTimeString()}] [HSC-VALIDATOR] Successfully verified block consensus hashes for ALPHA Node. Uptime check complete.</div>
              <div>[{new Date().toLocaleTimeString()}] [BTC-RELAYER] Handshaking valid miner identifier: {ALPHA_VALIDATOR_ID}... Connected to 32 stratum peers.</div>
              <div>[{new Date().toLocaleTimeString()}] [ETH-EVM] Validated ZK-Compliance credentials signature. Node weight updated to index pool.</div>
              <div>[{new Date().toLocaleTimeString()}] [SOL-RPC] Validator node ping: ok (14ms). Active validator ledger updated with SOL block hashes.</div>
              <div>[{new Date().toLocaleTimeString()}] [DOGE-STRATA] Auxiliary proof connection: Validated identifier successfully on high-difficulty pool.</div>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 3: Custom Transaction Builder & User Log */}
      {activeSubTab === 'custom-txs' && (
        <div className="space-y-6 animate-fadeIn font-mono text-xs">
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Input Section (Transaction Generator) */}
            <div className="xl:col-span-5 bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase">Custom Tx ID Creator</h3>
                  <p className="text-[10px] text-white/40 mt-0.5 leading-normal">
                    Manually compile and sign high-fidelity custom transaction records with secure cryptographic consensus IDs.
                  </p>
                </div>
              </div>

              <form onSubmit={handleBroadcastTx} className="space-y-4">
                
                {/* Transaction Type selection */}
                <div>
                  <label className="text-[10px] text-white/35 font-bold uppercase tracking-wider block mb-1.5">Action Category / Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as UserTransaction['type'])}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl h-10 px-3 text-white focus:border-emerald-500/30 font-mono outline-none cursor-pointer"
                  >
                    <option value="CUSTOM_GENERATED">CUSTOM_GENERATED (Self-Created Record)</option>
                    <option value="COIN_SELL">COIN_SELL (Trade/Exchange settlement)</option>
                    <option value="UPGRADE_BUY">UPGRADE_BUY (Hardware equipment expansion)</option>
                    <option value="BOOSTER_ACTIVATE">BOOSTER_ACTIVATE (Overclock status activation)</option>
                    <option value="WITHDRAWAL">WITHDRAWAL (Manual direct withdrawal setup)</option>
                  </select>
                </div>

                {/* Title input */}
                <div>
                  <label className="text-[10px] text-white/35 font-bold uppercase tracking-wider block mb-1.5">Transaction Title / Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALPHA LLC SECURE TRANSFER OUT"
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl h-10 px-3 text-white placeholder-white/20 font-sans outline-none focus:border-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Amount of tx */}
                  <div>
                    <label className="text-[10px] text-white/35 font-bold uppercase tracking-wider block mb-1.5">Volume Size / Amount</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10,000 HSC or $50 USD"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl h-10 px-3 text-white placeholder-white/20 font-sans outline-none focus:border-emerald-500/30"
                    />
                  </div>

                  {/* Recipient details */}
                  <div>
                    <label className="text-[10px] text-white/35 font-bold uppercase tracking-wider block mb-1.5">Consensus Recipient</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BTC-Consensus-Relay"
                      value={txRecipient}
                      onChange={(e) => setTxRecipient(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl h-10 px-3 text-white placeholder-white/20 font-sans outline-none focus:border-emerald-500/30"
                    />
                  </div>
                </div>

                {/* Response states messages */}
                {creationSuccess && (
                  <div className="bg-[#102d1a] border border-emerald-500/20 p-3 rounded-xl text-emerald-400 font-sans text-xs">
                    {creationSuccess}
                  </div>
                )}
                {creationError && (
                  <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-red-400 font-sans text-xs">
                    {creationError}
                  </div>
                )}

                {/* Submit button layout */}
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-mono text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Send className="h-4 w-4" />
                  <span>Broadcast Custom Block Transaction ID</span>
                </button>

              </form>
            </div>

            {/* User Activities registry ledger */}
            <div className="xl:col-span-7 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="border-b border-white/10 bg-[#080808] p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/50 uppercase font-black tracking-wider block">ALPHA LLC MINER Private Activity Ledger</span>
                  <p className="text-[9px] text-[#808080] mt-0.5">Valid hash identifiers for actions and upgrades triggered in the browser console.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  {userTransactions.length} Transactions
                </div>
              </div>

              <div className="max-h-[385px] overflow-y-auto divide-y divide-white/5">
                {userTransactions.length > 0 ? (
                  userTransactions.map(tx => {
                    // Type design color maps
                    const typeStyleMap = {
                      COIN_SELL: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
                      UPGRADE_BUY: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400',
                      BOOSTER_ACTIVATE: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
                      WITHDRAWAL: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
                      CUSTOM_GENERATED: 'border-white/10 bg-white/5 text-white/50'
                    }[tx.type as string] || 'border-white/10 bg-white/5 text-white/50';

                    return (
                      <div key={tx.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors group">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border leading-none ${typeStyleMap}`}>
                              {tx.type}
                            </span>
                            <span className="text-white font-extrabold text-xs tracking-wider truncate max-w-[200px] md:max-w-xs">{tx.title}</span>
                          </div>

                          <div className="flex flex-col gap-1 text-[10px] text-white/40">
                            {tx.referenceNumber && (
                              <div className="flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded max-w-max">
                                <span className="font-black text-emerald-400 tracking-wider">REFERENCE NO:</span>
                                <span 
                                  className="font-black text-emerald-300 font-mono select-all hover:text-emerald-400 cursor-copy flex items-center gap-1"
                                  onClick={() => triggerCopy(tx.referenceNumber!)}
                                  title="Click to copy Reference Number"
                                >
                                  <span>{tx.referenceNumber}</span>
                                  <Copy className="h-3 w-3 text-emerald-400" />
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-extrabold">TRANSACTION ID:</span>
                              <span 
                                className="font-bold text-white/80 hover:text-emerald-400 cursor-copy flex items-center gap-1.5 select-all"
                                onClick={() => triggerCopy(tx.id)}
                                title="Click to copy Transaction ID"
                              >
                                <span>{tx.id}</span>
                                <Copy className="h-3 w-3 inline text-white/20 group-hover:text-emerald-400/50 transition-colors" />
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold">Consensus Hash:</span>
                              <span 
                                className="text-[9px] text-[#808080]/80 select-all font-mono truncate max-w-[220px] sm:max-w-xs hover:text-emerald-400 duration-150 cursor-copy flex items-center gap-1"
                                onClick={() => triggerCopy(tx.blockchainHash)}
                                title="Click to copy Hash"
                              >
                                <span>{tx.blockchainHash.substring(0, 16)}...{tx.blockchainHash.substring(tx.blockchainHash.length - 8)}</span>
                                <Copy className="h-2.5 w-2.5 inline" />
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Destination meta */}
                        <div className="text-right shrink-0">
                          <span className="text-white font-black text-xs font-mono block">
                            {tx.amount}
                          </span>
                          <span className="text-[9px] text-[#808080] block mt-1">
                            to: {tx.recipient}
                          </span>
                          <span className="inline-block mt-1 text-[8px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-black uppercase">
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-white/25 space-y-2">
                    <Database className="h-9 w-9 mx-auto text-white/5" />
                    <p className="font-bold uppercase tracking-wider text-[11px]">Consensus Ledger is blank</p>
                    <p className="text-[10px] text-white/15 max-w-xs mx-auto">No operations recorded yet. Perform mining, upgrades or submit manual transactions on the left map.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
