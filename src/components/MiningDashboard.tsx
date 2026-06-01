import React, { useState, useEffect, useRef } from 'react';
import { useMining } from '../context/MiningContext';
import { Zap, AlertTriangle, Cpu, Snowflake, Play, Square, RefreshCw, Flame, Coins, Gift, Calendar, Check, PlayCircle, PlusCircle, Sparkles, Clock, X, ChevronRight, Volume2, Vibrate, VolumeX, TrendingUp, Download, Trash2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const MiningDashboard: React.FC = () => {
  const {
    coins,
    stats,
    upgrades,
    mineClick,
    
    // Multiple Cryptocurrencies states
    activeCrypto,
    setActiveCrypto,
    prices,
    balances,
    activeMiners,
    toggleMiner,
    mineAllCoins,
    setMineAllCoins,

    // One-tap Auto Mining Cluster Core & Gateway telemetry
    isClusterAutoMining,
    setIsClusterAutoMining,
    selectedCurrency,
    setSelectedCurrency,
    formatVal,
    liveGateways,
    processedTxs,

    // Reward & Booster additions
    dailyReward,
    claimDailyReward,
    simulateTimePass,
    activeBoosters,
    inventory,
    buyBoosterItem,
    activateBoosterItem,
    notification,
    dismissNotification,
    emergencyShutdown,
    emergencyCooling,
    isDynamicCoolingActive,
    setIsDynamicCoolingActive,
    performanceHistory,
    clearPerformanceHistory,
  } = useMining();

  // Dynamic temperature calculations for smooth color transitions (Green to Red style)
  const ambientTempValue = 24;
  const thermalCapValue = stats.thermalCap || 100;
  const tempRange = Math.max(1, thermalCapValue - ambientTempValue);
  const tempRatio = Math.max(0, Math.min(1, (stats.temperature - ambientTempValue) / tempRange));
  const hue = Math.max(0, Math.min(120, 120 * (1 - tempRatio)));

  const [logs, setLogs] = useState<{ id: string; text: string }[]>([]);
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const particleIdRef = useRef(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // New States for Quick Actions and Feedbacks
  const [showBoostStats, setShowBoostStats] = useState(false);
  const [audioState, setAudioState] = useState<'sound'|'haptic'|'silent'>('sound');

  const handleAudioCycle = () => {
    setAudioState(prev => {
      const next = prev === 'sound' ? 'haptic' : prev === 'haptic' ? 'silent' : 'sound';
      if (next === 'haptic' && navigator.vibrate) navigator.vibrate(50);
      return next;
    });
  };

  const executeActionWithFeedback = (action: () => void) => {
    action();
    if (audioState === 'haptic' && navigator.vibrate) navigator.vibrate(40);
  };

  const handleBoostAll = () => {
    executeActionWithFeedback(() => {
      (['overclock', 'cryo', 'market'] as const).forEach(type => {
        if (inventory[type] > 0) activateBoosterItem(type);
      });
    });
  };

  const handleExportCSV = () => {
    if (!performanceHistory || performanceHistory.length === 0) {
      return;
    }

    const headers = [
      "ID",
      "Timestamp (UTC)",
      "Time (Local)",
      "Hashrate (MH/s)",
      "GPU Temperature (C)",
      "Power Draw (Watts)",
      "Efficiency (MH/W)",
      "Active Cryptocurrency"
    ];

    const csvRows = [
      headers.join(","),
      ...performanceHistory.map(rec => {
        const timeLocal = new Date(rec.timestamp).toLocaleString();
        const timeUTC = new Date(rec.timestamp).toISOString();
        return [
          rec.id,
          timeUTC,
          `"${timeLocal}"`,
          rec.hashRate.toFixed(2),
          rec.temperature.toFixed(1),
          Math.round(rec.powerDraw),
          rec.efficiency.toFixed(3),
          rec.activeCrypto
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `alpha_miner_telemetry_export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Auto-generate realistic funny cryptographic action logs based on hashrate
  useEffect(() => {
    // Fill starting logs
    const initialLogs = [
      { id: 'init-1', text: `[${new Date().toLocaleTimeString()}] System loaded. Standing by for mining core...` },
      { id: 'init-2', text: `[${new Date().toLocaleTimeString()}] Target difficulty: 240.5 T hashes` },
      { id: 'init-3', text: `[${new Date().toLocaleTimeString()}] Default pool node ready. Latency: 18ms` },
    ];
    setLogs(initialLogs);
  }, []);

  useEffect(() => {
    const logTick = setInterval(() => {
      const currentStats = statsRef.current;
      if (currentStats.hashRate <= 0) return;

      const now = new Date().toLocaleTimeString();
      const randomLogs = [
        `[${now}] Found share! Diff 842.1G (low-latency)`,
        `[${now}] Block solve attempt #0x${Math.trunc(Math.random() * 100000).toString(16).toUpperCase()} submitted`,
        `[${now}] Handshaking local stratum node... Success (12ms)`,
        `[${now}] Shared validated by pool controller. Revenue approved.`,
        `[${now}] Thermal equilibrium calculated: ${currentStats.temperature}°C`,
        `[${now}] Hashrate state: ${currentStats.hashRate.toFixed(2)} MH/s | Carbon savings offset active`,
      ];

      const selected = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setLogs(curr => {
        const next = [...curr, { id: `${Date.now()}-${Math.random()}`, text: selected }];
        if (next.length > 30) next.shift(); // keep last 30 logs
        return next;
      });
    }, 4000); // stable 4-second period is highly realistic and performant!

    return () => clearInterval(logTick);
  }, []);

  // Secure scrolling helper when log updates
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle active mining click details (with particles)
  const handleActiveMine = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate click reward
    let clickReward = 0.001;
    const manualBooster = upgrades.find(u => u.id === 'boost_manual');
    if (manualBooster && manualBooster.level > 0) {
      clickReward += (manualBooster.multiplier * manualBooster.level * 0.002);
    }
    if (stats.throttled) {
      clickReward *= 0.1;
    }

    // Scale clickReward based on active crypto price vs standard base (142.50)
    const hscBasePrice = 142.50;
    const currentActivePrice = prices[activeCrypto] || hscBasePrice;
    const scaledReward = (clickReward * hscBasePrice) / currentActivePrice;
    const decimals = activeCrypto === 'DOGE' ? 2 : activeCrypto === 'SOL' ? 4 : 6;

    const text = `+${scaledReward.toFixed(decimals)} ${activeCrypto}`;
    const newParticle: ClickParticle = {
      id: particleIdRef.current++,
      x,
      y,
      text,
    };

    setParticles(p => [...p, newParticle]);
    mineClick();

    // Remove particles after 800ms
    setTimeout(() => {
      setParticles(p => p.filter(part => part.id !== newParticle.id));
    }, 800);
  };

  // Convert fan spin speed based on hashrate percentage
  const getFanSpinClass = () => {
    if (stats.hashRate <= 0) return 'animate-none';
    if (stats.throttled) return 'animate-spin [animation-duration:5s]'; // throttled slow spin
    
    // Scale fan speed based on hashrate
    if (stats.hashRate < 5) return 'animate-spin [animation-duration:2.5s]';
    if (stats.hashRate < 35) return 'animate-spin [animation-duration:1.2s]';
    if (stats.hashRate < 120) return 'animate-spin [animation-duration:0.6s]';
    return 'animate-spin [animation-duration:0.25s]'; // ultra fast spin
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Toast Alert banner system */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            className="fixed top-6 right-6 z-[100] w-[calc(100vw-48px)] sm:w-auto sm:max-w-md bg-[#0a0f0d]/95 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300 shadow-[0_12px_40px_rgba(0,0,0,0.7),_0_0_20px_rgba(16,185,129,0.15)]"
          >
            <div className="flex items-center gap-2.5 mr-4 select-none text-left">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={dismissNotification}
              className="text-white/40 hover:text-white p-1 cursor-pointer transition-colors shrink-0 self-start mt-0.5"
              title="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic One-Tap Global Cluster Auto-Mining Ignition & Gateway Telemetry */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none opacity-40 animate-pulse" />
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 relative z-10 font-mono">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                {isClusterAutoMining && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isClusterAutoMining ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span>Autonomous Cloud Mining Cluster Controller</span>
            </h2>
            <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
              Consolidate every mining computing machine, connect all active crypto networks, and process blocks live.
            </p>
          </div>
          
          {/* Master One-Tap Toggle Button */}
          <button
            onClick={() => setIsClusterAutoMining(!isClusterAutoMining)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all duration-300 border flex items-center gap-2 cursor-pointer shadow-md select-none ${
              isClusterAutoMining
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            {isClusterAutoMining ? (
              <>
                <Zap className="h-4 w-4 animate-bounce fill-slate-950" />
                <span>Cluster Mining Active</span>
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 text-amber-400 animate-pulse text-white/50" />
                <span>Ignite Global Auto-Mining</span>
              </>
            )}
          </button>
        </div>

        {/* Central Grid: Node Gateways & Real-Time Processing Ledger */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
          
          {/* Left Block: Live Node Gateway States */}
          <div className="xl:col-span-6 space-y-4">
            <span className="text-[10px] uppercase font-mono text-white/50 block font-bold tracking-widest flex items-center justify-between">
              <span>Connected RPC Network Gateways</span>
              <span className="text-emerald-400 text-[9px] animate-pulse">● RPC Network Synchronized</span>
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveGateways.map((gw) => {
                const gwColor = {
                  btc_rpc: 'text-amber-500 border-amber-500/15 bg-amber-500/5',
                  eth_rpc: 'text-violet-400 border-violet-500/15 bg-violet-500/5',
                  sol_rpc: 'text-fuchsia-450 border-fuchsia-500/15 bg-fuchsia-500/5',
                  doge_rpc: 'text-yellow-500 border-yellow-500/15 bg-yellow-500/5',
                  hsc_rpc: 'text-emerald-400 border-emerald-500/15 bg-emerald-500/5',
                }[gw.id as string] || 'text-white border-white/10 bg-white/5';

                return (
                  <div
                    key={gw.id}
                    className={`p-3.5 rounded-xl border font-mono text-xs flex flex-col justify-between transition-all duration-300 ${gwColor} hover:scale-[1.01]`}
                  >
                    <div className="flex items-center justify-between mb-1.5 font-bold">
                      <span className="text-white leading-none">{gw.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold leading-none border border-current opacity-70">
                        {gw.type}
                      </span>
                    </div>

                    <div className="space-y-1 text-[10px] text-white/50 mt-1">
                      <div className="flex justify-between">
                        <span>L1 Block height:</span>
                        <span className="font-bold text-white tracking-wide">#{gw.height.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Server Latency:</span>
                        <span className="text-emerald-400 font-bold">{gw.latency} ms</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-[#a0a0a0] leading-none uppercase tracking-wide">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                      <span>Node Active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Block: Live Processed Blocks Feed */}
          <div className="xl:col-span-6 flex flex-col justify-between space-y-4">
            <span className="text-[10px] uppercase font-mono text-white/50 block font-bold tracking-widest flex items-center justify-between">
              <span>Mempool Transaction Processing Ledger</span>
              <span className="text-rose-400 text-[9px] font-bold">● Streaming Core RPC Block Validate</span>
            </span>

            <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex-1 h-[200px] overflow-y-auto font-mono text-[10px] space-y-2">
              {processedTxs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/30 italic">
                  Initializing RPC pipelines...
                </div>
              ) : (
                processedTxs.map((tx: any) => {
                  const coinTag = {
                    BTC: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                    ETH: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
                    SOL: 'text-fuchsia-450 bg-fuchsia-450/10 border-fuchsia-300/20',
                    DOGE: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
                    HSC: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                  }[tx.crypto as string] || 'text-white bg-white/10';

                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-1.5 py-0.5 rounded font-black text-[9px] border leading-none shrink-0 ${coinTag}`}>
                          {tx.crypto}
                        </span>
                        <div className="min-w-0">
                          <span className="text-white/85 block select-all font-bold tracking-tight text-[10px] truncate max-w-[150px] sm:max-w-none">
                            {tx.address}
                          </span>
                          <span className="text-[9px] text-[#a0a0a0] block mt-0.5 leading-none">
                            Relayed at {new Date(tx.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 border-t sm:border-t-0 border-white/5 pt-1.5 sm:pt-0">
                        <span className="font-bold text-white block text-[10px]">
                          Amount: {tx.amount} {tx.crypto}
                        </span>
                        <span className="text-[9px] text-[#a0a0a0] block mt-0.5 leading-none">
                          Validation Fee Cut: {tx.fee} {tx.crypto}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Real-time processing feedback when auto-mining */}
            <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-2.5 text-[10px] font-mono text-white/60">
              <span className="leading-relaxed">
                {isClusterAutoMining 
                  ? "⚡ Cluster Auto-Mining Connected: Dynamic Node height sync rewards standard MH/s outputs passively of all owned compute machines!"
                  : "⚠️ Standby State: Decentralized computation idle. Toggle Cluster Mining above to synchronize all owned processors."}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: Click Reactor & Telemetry Visual */}
      <div id="reactor_panel" className="lg:col-span-7 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[500px] backdrop-blur-md relative overflow-hidden">
        
        {/* Particle Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {particles.map(p => {
            const particleColor = {
              HSC: 'text-emerald-400',
              BTC: 'text-amber-400',
              ETH: 'text-violet-400',
              SOL: 'text-fuchsia-450',
              DOGE: 'text-yellow-400',
            }[activeCrypto] || 'text-emerald-400';
            return (
              <span
                key={p.id}
                className={`absolute ${particleColor} font-black font-mono text-xs md:text-sm`}
                style={{
                  left: `${p.x}px`,
                  top: `${p.y - 12}px`,
                  transform: 'translate(-50%, -100%)',
                  animation: 'floatUp 0.8s ease-out forwards',
                }}
              >
                {p.text}
              </span>
            );
          })}
        </div>

        {/* Ambient Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20" />

        {/* Top telemetry states */}
        <div className="w-full flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${stats.hashRate > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
              {stats.throttled ? 'Core: THROTTLED' : stats.hashRate > 0 ? 'Core: MINING' : 'Core: STANDBY'}
            </span>
          </div>
          
          {stats.throttled && (
            <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider">
                THERMAL CRIPPLING ACTIVE
              </span>
            </div>
          )}
        </div>

        {/* Cryptocurrency Selectable Earnings Cards */}
        <div className="w-full space-y-3 mt-4 z-10 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest block">Select Coin Target & Live Earnings View</span>
              <p className="text-[9.5px] text-white/40 leading-snug">Click any card to select active explorer view. Toggle individual switches to redirect cluster power.</p>
            </div>
            
            {/* Mine All Coins Master Switch */}
            <div className="flex items-center gap-2 border-l border-white/5 pl-0 sm:pl-3 shrink-0">
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">MINE ALL COINS</span>
              <button
                type="button"
                onClick={() => setMineAllCoins(!mineAllCoins)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out font-sans outline-none ${
                  mineAllCoins ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-[0.5px] ${
                    mineAllCoins ? 'translate-x-5' : 'translate-x-[1px]'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 w-full pt-1">
            {(['BTC', 'HSC', 'ETH', 'SOL', 'DOGE'] as const).map(c => {
              const isActive = activeCrypto === c;
              const isMined = activeMiners[c] ?? false;
              
              const coinMeta = {
                HSC: { name: 'Hash Coin', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.02]', activeBg: 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
                BTC: { name: 'Bitcoin', color: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/[0.02]', activeBg: 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
                ETH: { name: 'Ethereum', color: 'text-violet-400', border: 'border-violet-500/20', bg: 'bg-violet-500/[0.02]', activeBg: 'bg-violet-500/10 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]' },
                SOL: { name: 'Solana', color: 'text-fuchsia-400', border: 'border-fuchsia-500/20', bg: 'bg-fuchsia-500/[0.02]', activeBg: 'bg-fuchsia-500/10 border-fuchsia-500/40 shadow-[0_0_15px_rgba(232,121,249,0.15)]' },
                DOGE: { name: 'Dogecoin', color: 'text-yellow-500', border: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.02]', activeBg: 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)]' },
              }[c];

              const bVal = c === activeCrypto ? coins : (balances[c] ?? 0);
              const pVal = prices[c] ?? 0;
              const fiatVal = bVal * pVal;

              return (
                <button
                  key={c}
                  onClick={() => setActiveCrypto(c)}
                  className={`p-3 rounded-2xl border text-left font-mono transition-all duration-300 transform cursor-pointer relative flex flex-col justify-between h-[105px] select-none ${
                    isActive 
                      ? `${coinMeta.activeBg} scale-[1.02] border-emerald-500/40 text-white z-20` 
                      : `${coinMeta.bg} border-white/5 text-white/50 hover:border-white/20 hover:text-white/85 hover:bg-white/[0.01]`
                  } ${!isMined ? 'opacity-65 hover:opacity-100' : ''}`}
                  title={`Switch view to index ${coinMeta.name}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-black tracking-wider ${isActive ? coinMeta.color : 'text-white/80'}`}>{c}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </div>

                    {/* Checkbox / Slide Toggle for individual coin mining */}
                    <span 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleMiner(c); 
                      }}
                      className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider flex items-center gap-1 font-bold select-none transition-all ${
                        isMined 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-[#ff3b30]/10 text-rose-400 border border-rose-500/25 opacity-70 hover:opacity-100'
                      }`}
                      title={`Toggle active mining for ${coinMeta.name}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${isMined ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-ping'}`} />
                      {isMined ? 'Mining' : 'Idle'}
                    </span>
                  </div>
                  
                  <div className="mt-1.5">
                    <span className="text-[11px] font-extrabold text-white block truncate">
                      {bVal.toFixed(c === 'DOGE' ? 2 : c === 'SOL' ? 4 : 5)}
                    </span>
                    <span className="text-[9px] text-[#22c55e] block font-medium leading-none mt-0.5 truncate">
                      {formatVal(fiatVal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[8px] text-white/40 truncate leading-none uppercase tracking-widest mt-1 font-bold">
                    <span>{coinMeta.name}</span>
                    {isMined && (
                      <span className="text-[7.5px] text-[#22c55e] shrink-0 font-medium">
                        {stats.hashRate > 0 && activeMiners ? `${(stats.hashRate / Object.values(activeMiners).filter(Boolean).length).toFixed(1)} MH/s` : '0 MH/s'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Center Plate */}
        <div className="my-auto flex flex-col items-center relative z-10 w-full max-w-sm mt-4">
          
          <button
            id="click_mine_button"
            onClick={handleActiveMine}
            className="group relative h-56 w-56 flex items-center justify-center rounded-full bg-[#050505]/95 border-2 border-white/10 hover:border-emerald-400/60 transition-all duration-300 shadow-[2px_10px_30px_rgba(0,0,0,0.6)] active:scale-95 cursor-pointer overflow-hidden outline-none"
          >
            {/* Spinning Fan Visual inside */}
            <div className="absolute inset-2 rounded-full border border-white/5 flex items-center justify-center">
              
              <svg
                className={`h-40 w-40 text-white/10 group-hover:text-emerald-400/20 transition-colors ${getFanSpinClass()}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* 1st Fan Blade */}
                <path d="M12 12c2.5-4 4.5-5.5 6-3.5s-.5 4.5-3.5 5.5l-2.5-2z" fill="currentColor" opacity="0.15" />
                {/* 2nd Fan Blade */}
                <path d="M12 12c4 2.5 5.5 4.5 3.5 6s-4.5-.5-5.5-3.5l2-2.5z" fill="currentColor" opacity="0.15" />
                {/* 3rd Fan Blade */}
                <path d="M12 12c-2.5 4-4.5 5.5-6 3.5s.5-4.5 3.5-5.5l2.5 2z" fill="currentColor" opacity="0.15" />
                {/* 4th Fan Blade */}
                <path d="M12 12c-4-2.5-5.5-4.5-3.5-6s4.5.5 5.5 3.5l-2 2.5z" fill="currentColor" opacity="0.15" />
                {/* Center cap */}
                <circle cx="12" cy="12" r="2.5" className="fill-[#0f0f0f] stroke-white/20" />
              </svg>

              {/* Core glow light depending on temperature */}
              <div 
                className={`absolute h-8 w-8 rounded-full transition-all duration-500 blur-sm pointer-events-none opacity-80 ${
                  stats.throttled 
                    ? 'bg-rose-500 animate-ping' 
                    : stats.temperature > 80 
                    ? 'bg-amber-500 animate-pulse'
                    : stats.hashRate > 0 
                    ? 'bg-emerald-400 animate-pulse' 
                    : 'bg-indigo-500/40'
                }`} 
              />
            </div>

            {/* Glowing active neon ring */}
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              stats.throttled 
                ? 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] border-rose-500/10' 
                : 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] group-hover:border-emerald-500/20'
            }`} />
          </button>

          <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase mt-4">
            Click core above to actively manual mine
          </span>
        </div>

        {/* Dynamic Horizontal Stats Bar */}
        <div className="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-4 relative z-10 font-mono">
          <div>
            <span className="text-[10px] text-white/40 uppercase block font-semibold">Active Balance ({activeCrypto})</span>
            <div className="text-xl font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Coins className={`h-4 w-4 ${{
                HSC: 'text-emerald-400',
                BTC: 'text-amber-500',
                ETH: 'text-violet-400',
                SOL: 'text-fuchsia-450',
                DOGE: 'text-yellow-500',
              }[activeCrypto] || 'text-white'}`} />
              <span>{coins.toFixed(activeCrypto === 'DOGE' ? 2 : activeCrypto === 'SOL' ? 4 : 6)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-white/40 uppercase block font-semibold">Mining speed ({activeCrypto})</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              <span>{stats.hashRate.toFixed(2)}</span>
              <span className="text-xs text-white/40 ml-1">MH/s</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Control Bar */}
        <div className="w-full mt-4 flex flex-wrap gap-2.5 relative z-10 font-mono border-t border-white/10 pt-4">
          <button 
            onClick={handleBoostAll}
            className="flex-1 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-[9px] sm:text-[10px] text-white/70 hover:text-emerald-400 font-bold uppercase py-2 px-2 rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] active:opacity-70 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5"
          >
            <Sparkles className="h-3 w-3" />
            <span>Boost All</span>
          </button>
          
          <button 
            onClick={() => executeActionWithFeedback(() => emergencyCooling())}
            className="flex-1 bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 text-[9px] sm:text-[10px] text-white/70 hover:text-blue-400 font-bold uppercase py-2 px-2 rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] active:opacity-70 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5"
          >
            <Snowflake className="h-3 w-3" />
            <span>Chill ($25)</span>
          </button>

          <button 
            onClick={() => executeActionWithFeedback(() => setLogs([]))}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-[9px] sm:text-[10px] text-white/70 hover:text-white font-bold uppercase py-2 px-2 rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] active:opacity-70 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5"
          >
            <RefreshCw className="h-3 w-3 inline-block" />
            <span>Clr Cache</span>
          </button>

          <button 
            onClick={() => executeActionWithFeedback(() => emergencyShutdown())}
            className="flex-1 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30 text-[9px] sm:text-[10px] text-rose-400 hover:text-rose-300 font-extrabold uppercase py-2 px-2 rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] active:opacity-70 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"
          >
            <Square className="h-3 w-3 fill-rose-500/30" />
            <span>Shutdown</span>
          </button>
        </div>

        <div className="w-full mt-2 flex gap-2.5 relative z-10 font-mono">
           {/* Boost Stats Hover popup wrapper */}
           <div className="relative flex-1 group">
             <button 
               onMouseEnter={() => setShowBoostStats(true)}
               onMouseLeave={() => setShowBoostStats(false)}
               className="w-full bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 text-[9px] sm:text-[10px] text-indigo-300 font-bold uppercase py-1.5 px-2 rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
             >
               <TrendingUp className="h-3 w-3" />
               Boost Stats
             </button>
             <AnimatePresence>
               {showBoostStats && (
                 <motion.div 
                   initial={{ opacity: 0, y: -10, x: "-50%" }}
                   animate={{ opacity: 1, y: 0, x: "-50%" }}
                   exit={{ opacity: 0, y: -10, x: "-50%" }}
                   transition={{ duration: 0.2 }}
                   className="absolute bottom-full left-1/2 mb-2 w-[160px] sm:w-48 bg-[#0a0a0a] border border-indigo-500/30 p-3 rounded-xl shadow-[0_4px_30px_rgba(99,102,241,0.15)] z-50 text-[10px]"
                 >
                   <span className="block text-indigo-400 font-black mb-1.5 border-b border-indigo-500/20 pb-1.5">LIVE MULTIPLIERS</span>
                   <div className="flex justify-between mt-1"><span className="text-white/50">Hashrate:</span> <span>x{stats.efficiency.toFixed(1)}</span></div>
                   <div className="flex justify-between mt-1"><span className="text-white/50">Power Draw:</span> <span>{stats.powerDraw}W</span></div>
                   <div className="flex justify-between mt-1 pt-1.5 border-t border-white/5"><span className="text-white/50">Load:</span> <span className="font-bold">{(stats.hashRate / (stats.efficiency || 1)).toFixed(2)} Base</span></div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <button 
             onClick={() => executeActionWithFeedback(handleAudioCycle)}
             className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] sm:text-[10px] text-white/70 font-bold uppercase py-1.5 px-2 rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
           >
             {audioState === 'sound' ? <Volume2 className="h-3 w-3 text-emerald-400" /> : audioState === 'haptic' ? <Vibrate className="h-3 w-3 text-amber-400" /> : <VolumeX className="h-3 w-3 text-white/30" />}
             <span className="hidden sm:inline">{audioState === 'sound' ? 'Audio On' : audioState === 'haptic' ? 'Haptics Only' : 'Silent Mode'}</span>
             <span className="inline sm:hidden">{audioState === 'sound' ? 'Audio' : audioState === 'haptic' ? 'Haptic' : 'Silent'}</span>
           </button>
        </div>

        {/* CSS Keyframes injected directly */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes floatUp {
            0% {
              transform: translate(-50%, 0) scale(0.8);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -120px) scale(1.1);
              opacity: 0;
            }
          }
        `}} />

      </div>

      {/* RIGHT: Live Cryptographic Mining Logs & Heat Metrics */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Core Temperature Gauge */}
        <div 
          id="temperature_governor" 
          className="border rounded-2xl p-6 backdrop-blur-md transition-all duration-500"
          style={{
            borderColor: `hsla(${hue}, 75%, 45%, 0.25)`,
            boxShadow: `0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px -3px hsla(${hue}, 75%, 45%, 0.15)`,
            backgroundColor: `hsla(${hue}, 70%, 5%, 0.45)`,
            transition: 'border-color 0.5s ease, box-shadow 0.5s ease, background-color 0.5s ease'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Flame 
                className={`h-4.5 w-4.5 transition-colors duration-500 ${stats.temperature > 80 ? 'animate-pulse' : ''}`} 
                style={{ color: `hsl(${hue}, 85%, 50%)` }} 
              />
              <h3 className="text-sm font-semibold text-white/90">Thermo-Governor Telemetry</h3>
            </div>
            <span className="text-xs font-mono text-white/40 font-semibold">Cap: {stats.thermalCap}°C</span>
          </div>

          <div className="space-y-4 font-mono">
            {/* Thermometer scale bar */}
            <div>
              <div className="flex justify-between text-xs text-white/55 mb-1">
                <span>Core Temperature</span>
                <span className="font-bold transition-colors duration-500" style={{ color: `hsl(${hue}, 85%, 55%)` }}>
                  {stats.temperature.toFixed(1)}°C
                </span>
              </div>
              <div className="h-3 bg-[#050505] rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stats.temperature > 90 ? 'animate-pulse' : ''}`}
                  style={{ 
                    width: `${Math.min(100, (stats.temperature / stats.thermalCap) * 100)}%`,
                    backgroundColor: `hsl(${hue}, 85%, 45%)`,
                    boxShadow: `0 0 8px hsl(${hue}, 85%, 45%)`,
                    transition: 'width 0.5s ease, background-color 0.5s ease, box-shadow 0.5s ease'
                  }}
                />
              </div>
            </div>

            {/* Thermal warning labels */}
            {stats.temperature > 80 && (
              <div className="p-3 bg-amber-950/10 border border-amber-500/10 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> OVERHEATING DANGER
                </p>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Core clock is nearing safety limits. Upgrade your **Cooling Efficiency** in the hardware room to lower base watts heat.
                </p>
              </div>
            )}

            {stats.throttled && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1 animate-pulse">
                <p className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> CRITICAL COOLDOWN TRIGGERED
                </p>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Rig has entered safety self-preservation throttling mode. Mining rates restricted to **10%** until temperature goes below 78.0°C.
                </p>
              </div>
            )}

            {/* Dynamic Cooling Toggle Sector */}
            <div className="pt-3 border-t border-white/10 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs text-white/90 font-semibold flex items-center gap-1.5 select-none">
                    <Snowflake className={`h-3.5 w-3.5 ${isDynamicCoolingActive ? 'animate-spin text-cyan-400' : 'text-white/40'}`} style={{ animationDuration: isDynamicCoolingActive ? `${Math.max(0.4, 3 - Math.min(2.5, (stats.temperature - 40) * 0.05))}s` : '0s' }} />
                    Dynamic Cooling Profile
                  </span>
                  <span className="text-[10px] text-white/30">
                    {isDynamicCoolingActive 
                      ? "Telemetry-guided PID fan speed governor active" 
                      : "Core running with manual/static fan levels"
                    }
                  </span>
                </div>

                <button
                  onClick={() => executeActionWithFeedback(() => setIsDynamicCoolingActive(!isDynamicCoolingActive))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDynamicCoolingActive ? 'bg-cyan-500' : 'bg-white/10'
                  }`}
                  id="toggle_dynamic_cooling"
                  title="Toggle auto-cooling governance"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                      isDynamicCoolingActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Dynamic Telemetry Status Panel */}
              <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-2.5 font-sans">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold">Dynamic Fan Speed</span>
                  <span className="text-xs font-mono font-bold text-white/90 mt-0.5">
                    {isDynamicCoolingActive 
                      ? `${Math.min(100, Math.round(20 + Math.max(0, stats.temperature - 45) * 1.6))}%`
                      : '40% (Manual Mode)'
                    }
                  </span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold">Thermal State</span>
                  <span className={`text-[9.5px] font-bold mt-0.5 px-1.5 py-0.5 rounded leading-none ${
                    stats.throttled 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : stats.temperature > 80 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : isDynamicCoolingActive 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {stats.throttled 
                      ? 'THROTTLED' 
                      : stats.temperature > 80 
                        ? 'SURGING HEAT' 
                        : isDynamicCoolingActive 
                          ? 'STABILIZING' 
                          : 'STANDBY'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic temperature tips */}
            <div className="text-[10px] text-white/30 border-t border-white/10 pt-3">
              <span className="block font-semibold uppercase mb-1">Telemetry Tip:</span>
              <span>Adding bigger Core Graphics adds heat (+1.2°C to +45.0°C per GPU level). Overvolting multiplies this heat significantly. Keep cooling and fan profiles matched!</span>
            </div>
          </div>
        </div>

        {/* CSV Telemetry Exporter Card */}
        <div id="telemetry_csv_exporter" className="border border-white/10 bg-[#0f0f0f] rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
              <span>Telemetry Recorder Logs</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded font-black select-none">
              {performanceHistory.length} / 1000 Snapshots
            </span>
          </div>

          <p className="text-[11.5px] text-white/45 leading-relaxed text-left">
            Consensus node records telemetry (hash rate, temperature, power draw) periodically in micro-caches. Export your node metadata as a CSV file to trace device efficiency and configure dynamic profiles.
          </p>

          {performanceHistory.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-left">
              <div>
                <span className="text-white/30 block mb-0.5 uppercase tracking-wider text-[8px]">Peak Hash</span>
                <span className="text-emerald-400 font-extrabold text-xs">
                  {Math.max(...performanceHistory.map(p => p.hashRate)).toFixed(1)} MH/s
                </span>
              </div>
              <div>
                <span className="text-white/30 block mb-0.5 uppercase tracking-wider text-[8px]">Peak Temp</span>
                <span className="text-red-400 font-extrabold text-xs">
                  {Math.max(...performanceHistory.map(p => p.temperature)).toFixed(1)}°C
                </span>
              </div>
              <div>
                <span className="text-white/30 block mb-0.5 uppercase tracking-wider text-[8px]">Avg Draw</span>
                <span className="text-cyan-400 font-extrabold text-xs">
                  {Math.round(performanceHistory.reduce((s, p) => s + p.powerDraw, 0) / performanceHistory.length)}W
                </span>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 bg-white/[0.01] rounded-xl p-4 text-center">
              <span className="text-[10px] text-white/30 italic block">No active logs captured yet. Solvers are warming up...</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleExportCSV}
              disabled={performanceHistory.length === 0}
              className={`flex-1 py-1.5 px-3 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 h-9 shrink-0 ${
                performanceHistory.length > 0
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.15)] active:scale-95'
                  : 'bg-white/5 text-white/25 cursor-not-allowed border border-white/2'
              }`}
              title="Download historical logs as CSV document"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            {performanceHistory.length > 0 && (
              <button
                onClick={clearPerformanceHistory}
                className="w-9 h-9 shrink-0 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500 hover:border-red-500 hover:text-slate-950 text-white/60 transition-all duration-300 cursor-pointer text-xs flex items-center justify-center"
                title="Wipe cached telemetry registry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Real-time Cryptographic Activity Logs */}
        <div id="stratum_logs" className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 flex flex-col flex-1 backdrop-blur-md min-h-[220px]">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-emerald-400" />
              <span>Stratum Pool Console</span>
            </h3>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
              Live Feed
            </span>
          </div>

          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto max-h-[190px] font-mono text-[10px] text-white/50 space-y-1.5 pr-2 scroll-smooth"
          >
            {logs.length === 0 ? (
              <p className="text-white/30 italic">Core is standby. Click the reactor or purchase discrete graphic processors to start block solves.</p>
            ) : (
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="leading-relaxed hover:text-white transition-colors break-all"
                  >
                    <span className="text-white/20">&gt; </span>
                    {log.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>

    </div>

      {/* NEW: Gamified dynamics: Daily Rewards + Gameplay Booster shop panels */}
      <div id="gamified_dynamics_systems" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Daily Login Rewards Station */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Gift className="h-4.5 w-4.5 text-emerald-400" />
                <span>Daily Rewards Hub</span>
              </h3>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-semibold">
                Streak: {dailyReward.streak} / 7 Days
              </span>
            </div>

            {/* List of 7 days rewards */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-4">
              {[
                { day: 1, label: '0.05 HSC', size: 'sm' },
                { day: 2, label: '0.1 HSC + $2', size: 'sm' },
                { day: 3, label: 'Serum x1', size: 'sm' },
                { day: 4, label: '0.2 HSC + $5', size: 'sm' },
                { day: 5, label: 'Cryo x1', size: 'sm' },
                { day: 6, label: '0.5 HSC + Spray', size: 'md' },
                { day: 7, label: 'Colossal Jackpot!', size: 'lg' },
              ].map((item) => {
                const isClaimedObj = 
                  item.day < dailyReward.streak || 
                  (item.day === dailyReward.streak && dailyReward.hasClaimedToday);
                
                const isCurrentObj = 
                  item.day === dailyReward.streak + 1 ||
                  (dailyReward.streak === 0 && item.day === 1) ||
                  (dailyReward.streak === 7 && dailyReward.hasClaimedToday && item.day === 1);

                const isActiveCurrently = isCurrentObj && !dailyReward.hasClaimedToday;

                return (
                  <div
                    key={item.day}
                    className={`p-2 rounded-xl flex flex-col items-center justify-between text-center border font-mono transition-all duration-300 min-h-[95px] relative overflow-hidden ${
                      isClaimedObj
                        ? 'bg-emerald-950/5 border-emerald-500/20 text-emerald-500/30'
                        : isActiveCurrently
                        ? 'bg-emerald-500/10 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse'
                        : 'bg-[#050505] border-white/5 text-white/40'
                    }`}
                  >
                    <span className="text-[8px] font-semibold tracking-wider uppercase block leading-none">Day {item.day}</span>
                    
                    {/* Visual icon/checkmark */}
                    <div className="my-1 flex items-center justify-center">
                      {isClaimedObj ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : item.day === 7 ? (
                        <Sparkles className={`h-4.5 w-4.5 ${isActiveCurrently ? 'text-amber-400 rotate-12' : 'text-white/20'}`} />
                      ) : (
                        <Gift className={`h-3.5 w-3.5 ${isActiveCurrently ? 'text-emerald-400' : 'text-white/10'}`} />
                      )}
                    </div>

                    <span className={`text-[8px] font-bold block leading-relaxed ${item.day === 7 ? 'text-[7px]' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Claim button */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  const res = claimDailyReward();
                  if (!res.success) {
                    alert(res.message);
                  }
                }}
                disabled={dailyReward.hasClaimedToday}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider font-display transition-all border duration-300 cursor-pointer ${
                  dailyReward.hasClaimedToday
                    ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-emerald-500 border-emerald-400 text-slate-950 hover:bg-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:scale-[1.01]'
                }`}
              >
                {dailyReward.hasClaimedToday ? '✓ Already claimed today' : 'Claim Daily Login Reward'}
              </button>
            </div>
          </div>

          {/* Dev Simulation controls */}
          <div className="mt-5 border-t border-white/5 pt-4">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-2 font-bold">
              🕹️ Sandboxed Tester Controls
            </span>
            <div className="flex gap-2 font-mono text-[10px]">
              <button
                onClick={() => simulateTimePass(24)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1"
                title="Fast forward simulated time by 1 day"
              >
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>Simulate +24 hr</span>
              </button>
              <button
                onClick={() => simulateTimePass(48)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-rose-400 transition-all cursor-pointer flex items-center justify-center gap-1"
                title="Miss a calendar day value completely to reset streak"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Force Miss / Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Gameplay Booster Array */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-amber-400" />
                <span>Gameplay Booster Management</span>
              </h3>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                Mined-Currency Store
              </span>
            </div>

            {/* Active countdowns list */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-mono text-white/40 block mb-2 font-bold">
                Active Temporary Boosters
              </span>
              <div className="space-y-1.5">
                {activeBoosters.length === 0 ? (
                  <p className="text-[10px] font-mono text-white/30 italic py-2 bg-[#050505] border border-white/5 rounded-xl px-3">
                    No active runtime countdown buffers.
                  </p>
                ) : (
                  activeBoosters.map((b) => (
                    <div
                      key={b.id}
                      className="bg-amber-955 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono text-amber-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span>{b.name} active</span>
                      </div>
                      <span className="text-xs font-bold text-white tracking-widest leading-none">
                        {b.remaining}s left
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Inventory listing */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-mono text-white/40 block mb-2 font-bold">
                Consumable Storage Inventory
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'overclock' as const, label: 'Serum', icon: PlayCircle, color: 'text-amber-400', desc: '+50% hashes' },
                  { key: 'cryo' as const, label: 'Ice Cap', icon: Snowflake, color: 'text-cyan-400', desc: '-70% heat' },
                  { key: 'market' as const, label: 'News Spray', icon: Sparkles, color: 'text-emerald-400', desc: 'UP market walk' },
                ].map((item) => {
                  const count = inventory[item.key];
                  return (
                    <div key={item.key} className="p-3 bg-[#050505] border border-white/5 rounded-xl flex flex-col justify-between items-center text-center">
                      <span className="text-[9px] font-mono text-white/40 block leading-none mb-1 font-bold">{item.label}</span>
                      <span className="text-sm font-extrabold text-white my-1 block select-none">Count: {count}</span>
                      <button
                        onClick={() => {
                          const res = activateBoosterItem(item.key);
                          if (!res.success) alert(res.message);
                        }}
                        disabled={count <= 0}
                        className={`w-full py-1.5 px-2 rounded-lg text-[9px] font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                          count <= 0
                            ? 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-amber-500/10 border border-amber-400/30 text-amber-300 hover:bg-amber-450 hover:text-slate-950 hover:border-amber-400'
                        }`}
                      >
                        Activate
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mined Currency Shop */}
            <div>
              <span className="text-[10px] uppercase font-mono text-white/40 block mb-2 font-bold">
                Buy Free Gameplay Boosters (Spends mined HSC)
              </span>

              <div className="space-y-2">
                {[
                  {
                    id: 'overclock' as const,
                    name: 'Overclock Serum (Active)',
                    cost: 0.15,
                    desc: 'Boosts passive/click hashrate +50% for 60 seconds.'
                  },
                  {
                    id: 'cryo' as const,
                    name: 'Cryo-Freeze Capsule (Active)',
                    cost: 0.25,
                    desc: 'Restricts temperature heat generation by -70% for 60 seconds.'
                  },
                  {
                    id: 'market' as const,
                    name: 'Bullish News Spray (Active)',
                    cost: 0.40,
                    desc: 'Triggers heavy bullish walks in DEX trading price for 60 seconds.'
                  },
                  {
                    id: 'permanent' as const,
                    name: 'Silicon Core Purity (PERMANENT)',
                    cost: 5.0,
                    levelInfo: `Lvl +${inventory.permanent}`,
                    desc: 'Permanently increases core base mining hashrate output by +10%.'
                  },
                ].map((booster) => {
                  return (
                    <div key={booster.id} className="bg-[#050505] p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-left font-mono text-[10px]">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-white/80">{booster.name}</span>
                          {'levelInfo' in booster && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded text-[8px] font-extrabold">
                              {booster.levelInfo}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-white/40 leading-relaxed">{booster.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          const res = buyBoosterItem(booster.id);
                          if (!res.success) alert(res.message);
                        }}
                        className={`py-1.5 px-2.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide shrink-0 transition-all cursor-pointer ${
                          coins >= booster.cost
                            ? 'bg-white/10 hover:bg-emerald-400 border-white/10 hover:border-emerald-400 hover:text-slate-950 font-bold'
                            : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        Cost: {booster.cost} HSC
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
