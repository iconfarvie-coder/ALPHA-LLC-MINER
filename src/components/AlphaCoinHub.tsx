import React, { useState, useEffect } from 'react';
import { useMining } from '../context/MiningContext';
import { 
  Coins, 
  Activity, 
  Server, 
  TrendingUp, 
  Vote, 
  Play, 
  Radio, 
  Check, 
  Plus, 
  ShieldCheck, 
  RefreshCw, 
  Network, 
  Users, 
  Sparkles, 
  Flame, 
  Award, 
  Lock, 
  ChevronRight,
  Database,
  Info
} from 'lucide-react';

interface ValidatorNode {
  id: string;
  name: string;
  location: string;
  ip: string;
  latency: number;
  status: 'active' | 'synced' | 'connecting' | 'offline';
  stake: number;
}

interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'queued';
  forVotes: number;
  againstVotes: number;
  totalVotes: number;
  voted?: 'for' | 'against';
  endsAt: string;
  creator: string;
  category: 'protocol' | 'marketing' | 'treasury' | 'hardware';
}

export function AlphaCoinHub() {
  const { 
    prices, 
    balances, 
    coins, 
    activeCrypto, 
    addToast,
    playSound
  } = useMining();

  // Price tracking
  const alphaPrice = prices.ALPHA ?? 2.15;
  const alphaBalance = activeCrypto === 'ALPHA' ? coins : (balances.ALPHA ?? 0);

  // Network Nodes state
  const [nodes, setNodes] = useState<ValidatorNode[]>([
    { id: 'node-1', name: 'Alpha Prime Validator', location: 'London, UK', ip: '45.197.22.10', latency: 4, status: 'active', stake: 125000 },
    { id: 'node-2', name: 'Alpha Aurora Shard', location: 'Tokyo, JP', ip: '112.5.88.92', latency: 18, status: 'synced', stake: 80000 },
    { id: 'node-3', name: 'Alpha Edge Gateway', location: 'New York, US', ip: '198.51.100.41', latency: 12, status: 'synced', stake: 55000 },
    { id: 'node-4', name: 'Alpha Sentry Backup', location: 'Frankfurt, DE', ip: '172.217.16.14', latency: 9, status: 'connecting', stake: 45000 },
  ]);

  const [simulatedTxPool, setSimulatedTxPool] = useState<number>(14);
  const [mempoolHealth, setMempoolHealth] = useState<'healthy' | 'congested'>('healthy');
  const [networkSpeedBoost, setNetworkSpeedBoost] = useState<boolean>(false);
  const [tlsStakingEnforced, setTlsStakingEnforced] = useState<boolean>(true);
  const [shardP2PCompression, setShardP2PCompression] = useState<boolean>(false);

  // Governance proposals list state
  const [proposals, setProposals] = useState<GovernanceProposal[]>([
    {
      id: 'AIP-201',
      title: 'AIP-201: Double Alpha Coin Mining Reward for 72 Hours',
      description: 'Proposes utilizing 45,000 ALPHA from the network treasury to temporarily offer 2.0x block rewards to all connected miners worldwide. This will stress-test the gas throttling mechanics under heavy server loads.',
      status: 'active',
      forVotes: 14850,
      againstVotes: 3410,
      totalVotes: 18260,
      endsAt: 'In 24 hours',
      creator: 'AlphaCore_Labs',
      category: 'hardware'
    },
    {
      id: 'AIP-202',
      title: 'AIP-202: Shift Tx Burn Fee to 35% Stable Burn Protocol',
      description: 'Changes the dynamic gas burn algorithm so that a permanent flat rate of 35% of all verification fees are sent directly to the null address (0x000...dead). This increases deflationary pressure relative to total supply.',
      status: 'active',
      forVotes: 29402,
      againstVotes: 14920,
      totalVotes: 44322,
      endsAt: 'In 3 days',
      creator: 'Sovereign_DevDAO',
      category: 'protocol'
    },
    {
      id: 'AIP-199',
      title: 'AIP-199: Localized Node Relay Ingress Expansion',
      description: 'Allocation of 12,500 USDC equivalent to secure long-term server tenancy in Frankfurt and Sydney to optimize global latency thresholds down to <15ms average.',
      status: 'passed',
      forVotes: 48500,
      againstVotes: 1200,
      totalVotes: 49700,
      endsAt: 'Passed (Enacted)',
      creator: 'AlphaCore_Labs',
      category: 'treasury'
    }
  ]);

  // Form states for creating a proposal
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'protocol' | 'marketing' | 'treasury' | 'hardware'>('protocol');

  // Live chain blocks for Alpha Coin
  const [alphaBlocks, setAlphaBlocks] = useState<any[]>([]);

  // Periodically change node latencies slightly and trigger mempool tx updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Modify latencies
      setNodes(prev => prev.map(n => {
        if (n.status === 'offline') return n;
        const change = Math.floor((Math.random() - 0.5) * 4);
        const newLatency = Math.max(1, n.latency + change);
        return {
          ...n,
          latency: newLatency,
          status: n.id === 'node-4' && Math.random() > 0.8 ? 'synced' : n.status
        };
      }));

      // Randomly change simulated transaction pool size
      setSimulatedTxPool(prev => {
        const delta = Math.floor((Math.random() - 0.5) * 6);
        const next = Math.max(2, prev + delta);
        setMempoolHealth(next > 40 ? 'congested' : 'healthy');
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Generate simulated recent Alpha chain blocks for viewing chain data
  const refreshAlphaBlocks = () => {
    const list = [];
    let startBlock = 452901;
    for (let i = 0; i < 5; i++) {
      list.push({
        height: startBlock - i,
        time: `${i * 3 + 1} min ago`,
        reward: 250,
        txCount: Math.floor(18 + Math.random() * 45),
        hash: '0x' + Math.random().toString(36).substring(2, 12).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
        gasUsed: `${Math.floor(45 + Math.random() * 50)}%`
      });
    }
    setAlphaBlocks(list);
  };

  useEffect(() => {
    refreshAlphaBlocks();
  }, []);

  // Actions
  const handlePingNodes = () => {
    playSound('upgrade');
    setNodes(prev => prev.map(n => {
      let isConnecting = n.status === 'connecting';
      return {
        ...n,
        latency: Math.max(2, Math.floor(n.latency * 0.75)),
        status: isConnecting ? 'synced' : n.status
      };
    }));
    addToast({
      id: 'ping-alpha-nodes',
      type: 'success',
      title: 'Nodes Pinged successfully',
      message: 'Global Alpha validator nodes are handshaking at maximum protocol connection speed.',
      timestamp: Date.now()
    });
  };

  const handleFlushMempool = () => {
    playSound('coins');
    setSimulatedTxPool(0);
    setMempoolHealth('healthy');
    addToast({
      id: 'flush-alpha-mempool',
      type: 'success',
      title: 'Mempool Memblocks Flushed',
      message: 'Successfully broadcast pending transactions to decentralized peer queues.',
      timestamp: Date.now()
    });
  };

  // Voting action
  const handleVote = (proposalId: string, type: 'for' | 'against') => {
    playSound('click');
    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      if (p.voted) {
        addToast({
          id: `already-voted-${proposalId}`,
          type: 'error',
          title: 'Vote Refused',
          message: `Your wallet key has already registered a vote for this bill.`,
          timestamp: Date.now()
        });
        return p;
      }

      const voteWeight = Math.floor(50 + alphaBalance * 10);
      const isFor = type === 'for';
      
      addToast({
        id: `vote-cast-${proposalId}`,
        type: 'success',
        title: 'Decentralized Vote Broadcasted',
        message: `Registered gas-signed ballot supporting "${isFor ? 'FOR' : 'AGAINST'}" with weighted stake representation of ${voteWeight} VP (Vote Power).`,
        timestamp: Date.now()
      });

      return {
        ...p,
        forVotes: isFor ? p.forVotes + voteWeight : p.forVotes,
        againstVotes: !isFor ? p.againstVotes + voteWeight : p.againstVotes,
        totalVotes: p.totalVotes + voteWeight,
        voted: type
      };
    }));
  };

  // Custom Proposal Submitting
  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      addToast({
        id: 'prop-error',
        type: 'error',
        title: 'Validation Failed',
        message: 'Must specify a valid proposal title and governance summary.',
        timestamp: Date.now()
      });
      return;
    }

    if (alphaBalance < 10) {
      addToast({
        id: 'prop-stakereq',
        type: 'error',
        title: 'Insufficient Staked Balance',
        message: 'A minimum staked governance threshold of 10.0 ALPHA is required to propose new mainnet protocols.',
        timestamp: Date.now()
      });
      return;
    }

    playSound('upgrade');
    const newProp: GovernanceProposal = {
      id: `AIP-${Math.floor(203 + Math.random() * 50)}`,
      title: newTitle.startsWith('AIP-') ? newTitle : `AIP-Custom: ${newTitle}`,
      description: newDescription,
      status: 'active',
      forVotes: 0,
      againstVotes: 0,
      totalVotes: 0,
      endsAt: 'In 7 days',
      creator: 'Anonymous_Sovereign_Node',
      category: newCategory
    };

    setProposals(prev => [newProp, ...prev]);
    setNewTitle('');
    setNewDescription('');
    addToast({
      id: 'prop-created',
      type: 'success',
      title: 'Mainnet AIP Filed Successfully',
      message: `Your proposal was compiled and verified correctly on the Alpha Consensus chain!`,
      timestamp: Date.now()
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Header / Banner Section */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        {/* Neon laser background line */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Vote className="h-44 w-44 text-cyan-500" />
        </div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="bg-cyan-550/15 text-cyan-400 border border-cyan-500/30 p-2 rounded-xl">
                <Coins className="h-6 w-6 stroke-[2]" />
              </div>
              <div>
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/35 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                  Alpha Mainnet V2
                </span>
                <h2 className="text-xl font-extrabold text-white uppercase tracking-tight font-display mt-0.5">
                  Alpha Coin (ALPHA) Sovereign Suite
                </h2>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-2xl font-mono">
              The premier hyper-sharded, zero-latency computational ledger. Execute smart governance bills, evaluate high-speed peer relays, query raw cryptographic blocks and fine-tune validator stake.
            </p>
          </div>

          <div className="bg-[#050505] border border-white/10 p-4 rounded-xl flex items-center gap-4 shrink-0 font-mono w-full md:w-auto">
            <div className="text-left">
              <span className="text-[9px] text-[#a0a0a0] block font-semibold uppercase">Wallet Balance</span>
              <span className="font-extrabold text-lg text-white block mt-0.5">
                {alphaBalance.toFixed(4)} ALPHA
              </span>
              <span className="text-[9.5px] text-zinc-500 block">
                ≃ ${(alphaBalance * alphaPrice).toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Live Token Info & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Token Information Stats (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Real-Time ALPHA Network Metrics
            </h3>
            <span className="text-[9px] text-emerald-400 flex items-center gap-1.5 font-bold font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYNCED WITH MAINNET CORE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#050505] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-white/40 block font-semibold uppercase">Live Price</span>
              <span className="text-base font-extrabold text-cyan-400 font-mono block mt-1">
                ${alphaPrice.toFixed(4)}
              </span>
              <span className="text-[8px] text-emerald-400 font-bold font-mono">+4.82% today</span>
            </div>

            <div className="bg-[#050505] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-white/40 block font-semibold uppercase">Total Supply</span>
              <span className="text-base font-extrabold text-white font-mono block mt-1">
                100,000,000
              </span>
              <span className="text-[8px] text-zinc-500 font-mono">ALPHA Max Limit</span>
            </div>

            <div className="bg-[#050505] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-white/40 block font-semibold uppercase">Circulating Supply</span>
              <span className="text-base font-extrabold text-[#f2f2f2] font-mono block mt-1">
                43,190,042
              </span>
              <span className="text-[8px] text-cyan-400 font-bold font-mono">43.1% Unlocked</span>
            </div>

            <div className="bg-[#050505] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-white/40 block font-semibold uppercase">Simulated Market Cap</span>
              <span className="text-base font-extrabold text-white font-mono block mt-1">
                ${(43190042 * alphaPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[8px] text-amber-500 font-bold font-mono">Global Rank #504</span>
            </div>

            <div className="bg-[#050505] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-white/40 block font-semibold uppercase">Total Burned Supply</span>
              <span className="text-base font-extrabold text-rose-400 font-mono block mt-1 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 fill-rose-500/10 stroke-[2.5]" />
                124,902
              </span>
              <span className="text-[8px] text-rose-500 font-bold font-mono">Deflation active</span>
            </div>

            <div className="bg-[#050505] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-white/40 block font-semibold uppercase">Staked Network Rate</span>
              <span className="text-base font-extrabold text-white font-mono block mt-1">
                305,000 ALPHA
              </span>
              <span className="text-[8px] text-emerald-400 font-semibold font-mono">Avg APR: 11.25%</span>
            </div>
          </div>

          <div className="bg-[#050505]/40 border border-white/5 p-3 rounded-xl space-y-2 text-[10px] leading-relaxed font-mono">
            <h4 className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              Sovereign Tokenomics Insights
            </h4>
            <p className="text-white/40 text-[9px]">
              Alpha Coin utilizes a proof-of-stake gas-burn architecture. Mining block operations triggers dynamic block validations that distribute transaction incentives to active workers directly while deflating circulating parameters with each epoch.
            </p>
          </div>
        </div>

        {/* Network Infrastructure Operations (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" />
              Network Node Settings & Services
            </h3>
            <button 
              onClick={handlePingNodes}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-transform hover:rotate-45"
              title="Ping all Alpha Relays"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs p-2.5 bg-[#050505] rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="font-bold text-white flex items-center gap-1.5 text-[9.5px]">
                  Alpha Speed Booster Relay
                  {networkSpeedBoost && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
                </span>
                <span className="text-[8px] text-white/30 text-left">Overclocks P2P message compression to bypass congestion</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNetworkSpeedBoost(!networkSpeedBoost);
                  playSound('toggle');
                }}
                className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  networkSpeedBoost ? 'bg-cyan-500' : 'bg-white/10'
                }`}
              >
                <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-950 shadow transition duration-200 ease-in-out ${
                  networkSpeedBoost ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 bg-[#050505] rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="font-bold text-white text-[9.5px]">Strict TLS Validation</span>
                <span className="text-[8px] text-white/30 text-left">Force node validation checking layers to use TLS L3</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTlsStakingEnforced(!tlsStakingEnforced);
                  playSound('toggle');
                }}
                className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  tlsStakingEnforced ? 'bg-cyan-500' : 'bg-white/10'
                }`}
              >
                <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-950 shadow transition duration-200 ease-in-out ${
                  tlsStakingEnforced ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 bg-[#050505] rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="font-bold text-white text-[9.5px]">Decentralized Block Sharding</span>
                <span className="text-[8px] text-white/30 text-left">Splits RPC ledger files to optimize storage bandwidth parameters</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShardP2PCompression(!shardP2PCompression);
                  playSound('toggle');
                }}
                className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  shardP2PCompression ? 'bg-cyan-500' : 'bg-white/10'
                }`}
              >
                <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-950 shadow transition duration-200 ease-in-out ${
                  shardP2PCompression ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center justify-between gap-3 text-[10px]">
            <div className="text-left font-mono">
              <span className="font-bold text-white block">Mempool Backlog Limit</span>
              <span className="text-white/40 block mt-0.5 text-[8.5px]">Buffered ledger transactions holding waiting block consensus selection</span>
            </div>
            <div className="text-right shrink-0">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold block ${mempoolHealth === 'congested' ? 'bg-red-500/20 text-red-400' : 'bg-[#1a3a2a] text-[#4adf8a]'}`}>
                {simulatedTxPool} PENDING
              </span>
              <button 
                onClick={handleFlushMempool}
                className="mt-1.5 font-bold uppercase tracking-wider text-[8px] bg-red-650 hover:bg-red-700 text-white rounded px-2 py-1 flex items-center gap-1 cursor-pointer"
              >
                Flush queue
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Grid: Global Distributed Nodes list & Block Chain Explorer query */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Validator Nodes (6 Cols) */}
        <div className="lg:col-span-6 bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-400" />
              Active Distributed Chain Validators
            </h3>
            <span className="text-[9px] text-[#a0a0a0] font-mono">Validators: 4 Active</span>
          </div>

          <div className="space-y-2 font-mono text-[10px]">
            {nodes.map(node => (
              <div 
                key={node.id} 
                className="p-3 bg-[#050505] border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{node.name}</span>
                    <span className="text-[8px] text-white/30">({node.location})</span>
                  </div>
                  <div className="text-[9px] text-white/45 flex items-center gap-3">
                    <span>IP: {node.ip}</span>
                    <span>•</span>
                    <span className="text-cyan-400">Stake: {node.stake.toLocaleString()} ALPHA</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{node.latency} ms</span>
                    <span className="text-[8px] text-zinc-500 block uppercase">latency</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
                    node.status === 'active' ? 'bg-[#153420] text-emerald-450 border border-emerald-500/20' : 
                    node.status === 'synced' ? 'bg-[#152a3a] text-cyan-400 border border-cyan-500/20' : 
                    'bg-[#2d2215] text-amber-500 border border-amber-500/20'
                  }`}>
                    {node.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Chain Explorer specific to Alpha (6 Cols) */}
        <div className="lg:col-span-6 bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              Raw Sharded Alpha block loggers
            </h3>
            <button 
              onClick={refreshAlphaBlocks}
              className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded font-bold uppercase transition-all flex items-center gap-1 font-mono cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          <div className="space-y-2 font-mono text-[9px] max-h-[220px] overflow-y-auto pr-1">
            {alphaBlocks.map(block => (
              <div 
                key={block.height} 
                className="p-2.5 bg-[#050505] border border-white/5 rounded-xl flex items-center justify-between gap-3 text-left"
              >
                <div className="space-y-0.5">
                  <div className="font-extrabold text-white flex items-center gap-1.5 text-[10px]">
                    Block #{block.height}
                    <span className="text-[8px] text-[#f1c40f] bg-amber-500/10 border border-amber-500/20 px-1 rounded font-bold">
                      +{block.reward} ALPHA RWD
                    </span>
                  </div>
                  <div className="text-white/40 leading-none">
                    Hash: <span className="text-zinc-500 font-mono break-all">{block.hash}</span>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <span className="text-[#a0a0a0] block">{block.time}</span>
                  <span className="text-zinc-500 block text-[8px] mt-0.5 uppercase font-semibold">Txs: {block.txCount} • Gas: {block.gasUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Governance & Proposal DAO Management Section */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 space-y-6">
        
        <div className="border-b border-white/5 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2.5">
                <Vote className="h-5 w-5 text-cyan-400" />
                ALPHA Decent-Governance & Proposals (DAO)
              </h3>
              <p className="text-[10px] text-white/30 font-mono">
                Holders lock state weight dynamically within consensus cycles to steer software enhancements and mainnet configuration variables.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column layout for submitting and viewing active items */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Proposals list (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-3">
              {proposals.map(prop => {
                const totalVotesWithZero = prop.totalVotes || 1;
                const forPercent = (prop.forVotes / totalVotesWithZero) * 100;
                const againstPercent = (prop.againstVotes / totalVotesWithZero) * 100;

                return (
                  <div 
                    key={prop.id} 
                    className="p-4 bg-[#050505] border border-white/5 rounded-xl hover:border-white/10 transition-all font-mono space-y-3.5 relative overflow-hidden text-left"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                          {prop.id}
                        </span>
                        <span className="text-[8px] text-zinc-500 block uppercase font-bold">
                          Proposed by: {prop.creator}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none self-start sm:self-center ${
                        prop.status === 'active' ? 'bg-[#15342a] text-[#4adf8a] border border-emerald-500/30' :
                        prop.status === 'passed' ? 'bg-[#1a2536] text-blue-400 border border-blue-500/30 font-extrabold' :
                        'bg-red-500/10 text-red-400 border border-red-500/25'
                      }`}>
                        {prop.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-[11.5px] font-extrabold text-white leading-normal uppercase">
                        {prop.title}
                      </h4>
                      <p className="text-[10px] text-white/45 leading-relaxed">
                        {prop.description}
                      </p>
                    </div>

                    {/* Voting visual bar tracker */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[9px] font-semibold">
                        <span className="text-emerald-400 font-bold block">For: {prop.forVotes.toLocaleString()} ({forPercent.toFixed(1)}%)</span>
                        <span className="text-red-400 font-bold block">Against: {prop.againstVotes.toLocaleString()} ({againstPercent.toFixed(1)}%)</span>
                      </div>
                      {/* Weighted Vote Slider Bar */}
                      <div className="h-1.5 w-full bg-[#141414] rounded-full flex overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${forPercent}%` }}
                        />
                        <div 
                          className="bg-red-500 h-full transition-all duration-500"
                          style={{ width: `${againstPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8.5px] text-zinc-500">
                        <span>Consensus Target: 10,000 ALPHA Minimum</span>
                        <span>Total Ballots cast: {prop.totalVotes.toLocaleString()} VP</span>
                      </div>
                    </div>

                    {/* Vote triggers if active */}
                    {prop.status === 'active' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
                        <span className="text-[9px] text-[#a0a0a0]/60 mr-1.5">CAST STAKE BALLOT:</span>
                        <button 
                          onClick={() => handleVote(prop.id, 'for')}
                          disabled={!!prop.voted}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 transition-all ${
                            prop.voted === 'for' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : !!prop.voted 
                                ? 'bg-zinc-500/5 text-zinc-650 cursor-not-allowed border border-white/5'
                                : 'bg-emerald-550/20 hover:bg-emerald-550/30 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                          Vote For
                        </button>
                        <button 
                          onClick={() => handleVote(prop.id, 'against')}
                          disabled={!!prop.voted}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 transition-all ${
                            prop.voted === 'against' 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/35' 
                              : !!prop.voted 
                                ? 'bg-zinc-500/5 text-zinc-650 cursor-not-allowed border border-white/5'
                                : 'bg-red-550/20 hover:bg-red-550/30 text-red-400 border border-red-500/20'
                          }`}
                        >
                          Vote Against
                        </button>
                        {prop.voted && (
                          <span className="text-[8.5px] text-[#f2f2f2]/40 font-semibold italic">YOUR STAKE HAS BEEN REGISTERED</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit New Bill/Proposal Form (5 Cols) */}
          <div className="lg:col-span-5 bg-[#050505] p-5 rounded-2xl border border-white/5 h-fit text-left">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-1.5 flex items-center gap-2">
              <Plus className="h-4 w-4 text-cyan-400" />
              File Governance Proposal (AIP)
            </h4>
            <p className="text-[9px] text-white/30 font-mono mb-4 leading-normal">
              A minimum balance threshold of <strong>10.0 ALPHA</strong> is required to submit. Staked credentials authorize consensus compilation checks automatically.
            </p>

            <form onSubmit={handleSubmitProposal} className="space-y-3.5 font-mono text-xs">
              <div>
                <label className="text-[9px] text-[#a0a0a0]/60 uppercase tracking-wider block mb-1 font-semibold">
                  Proposal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. AIP-203: Expand Frankfurt Relay Nodes Index"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 focus:border-cyan-400/40 outline-none h-10 px-3.5 text-xs text-white rounded-xl"
                />
              </div>

              <div>
                <label className="text-[9px] text-[#a0a0a0]/60 uppercase tracking-wider block mb-1 font-semibold">
                  Select Scope Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#0d0d0d] border border-white/10 focus:border-cyan-400/40 outline-none h-10 px-2.5 text-xs text-white rounded-xl cursor-pointer"
                >
                  <option value="protocol">Protocol Engine (Upgrade)</option>
                  <option value="hardware">Hardware incentives</option>
                  <option value="treasury">Treasury Funding grant</option>
                  <option value="marketing">Brand Marketing expansion</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-[#a0a0a0]/60 uppercase tracking-wider block mb-1 font-semibold">
                  Bill Summary & Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed description of requested network shifts, target balances, block difficulty recalculation speeds, and why other nodes should lock in their votes."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 focus:border-cyan-400/40 outline-none p-3 text-xs text-white rounded-xl leading-normal resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 font-extrabold uppercase tracking-widest text-[9.5px] text-white h-11 rounded-xl transition-all shadow-md shadow-cyan-500/5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4 stroke-[2]" />
                  Broadcast AIP to Consensus
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
