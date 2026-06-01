import React, { useState, useEffect } from 'react';
// @ts-ignore
import appIcon from './assets/images/app_icon_1780276747579.png';
import { MiningProvider, useMining } from './context/MiningContext';
import { MetricCard } from './components/MetricCard';
import { MiningDashboard } from './components/MiningDashboard';
import { RigUpgrades } from './components/RigUpgrades';
import { MarketChart } from './components/MarketChart';
import { PayoutConsole } from './components/PayoutConsole';
import { UserAuthModal } from './components/UserAuthModal';
import { GmailInbox } from './components/GmailInbox';
import { BlockExplorer } from './components/BlockExplorer';
import { SupportAndSettings } from './components/SupportAndSettings';
import { Cpu, Server, TrendingUp, Wallet, ShieldAlert, AlertCircle, RefreshCw, Zap, Coins, DollarSign, ShieldCheck, Mail, Database, HelpCircle, Settings } from 'lucide-react';

function AppContent() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const {
    activeTab,
    setActiveTab,
    coins,
    usd,
    stats,
    resetProgress,
    selectedCurrency,
    setSelectedCurrency,
    formatVal,
    user,
    mineClick,
    emergencyShutdown,
  } = useMining();

  // Unified layout fitting and scale settings
  const [scaleFactor, setScaleFactor] = useState<number>(() => {
    const saved = localStorage.getItem('fast_miner_scale_factor');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [compactLayout, setCompactLayout] = useState<boolean>(() => {
    const saved = localStorage.getItem('fast_miner_compact_layout');
    return saved === 'true';
  });
  const [autoScale, setAutoScale] = useState<boolean>(() => {
    const saved = localStorage.getItem('fast_miner_auto_scale');
    return saved !== 'false'; // Default to true for premium experience!
  });

  // Automatically adjust scale ratio by sniffing viewport width (stops headings clashing on small iframes)
  useEffect(() => {
    if (!autoScale) return;
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScaleFactor(0.80);
      } else if (width < 1024) {
        setScaleFactor(0.90);
      } else {
        setScaleFactor(1.0);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoScale]);

  const changeScale = (val: number) => {
    setScaleFactor(val);
    localStorage.setItem('fast_miner_scale_factor', val.toString());
  };

  const changeCompact = (val: boolean) => {
    setCompactLayout(val);
    localStorage.setItem('fast_miner_compact_layout', val ? 'true' : 'false');
  };

  const changeAutoScale = (val: boolean) => {
    setAutoScale(val);
    localStorage.setItem('fast_miner_auto_scale', val ? 'true' : 'false');
    if (val) {
      const width = window.innerWidth;
      if (width < 640) setScaleFactor(0.80);
      else if (width < 1024) setScaleFactor(0.90);
      else setScaleFactor(1.0);
    }
  };

  // Global Keyboard Shortcuts (M: Mine Reactor, T: Market, Esc: Shutdown / Close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside dynamic input fields, textareas or contenteditables
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'm') {
        e.preventDefault();
        setActiveTab('mine');
        // also trigger clean operator click for maximum usability
        mineClick();
      } else if (key === 't') {
        e.preventDefault();
        setActiveTab('market');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isAuthOpen) {
          setIsAuthOpen(false);
        } else {
          emergencyShutdown();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, mineClick, isAuthOpen, emergencyShutdown]);

  // Tab configurations
  const tabs = [
    { id: 'mine', label: 'Mine Reactor', shortcut: 'M', icon: Cpu },
    { id: 'upgrades', label: 'Hardware Shop', icon: Server },
    { id: 'market', label: 'DEX Trade & News', shortcut: 'T', icon: TrendingUp },
    { id: 'payouts', label: 'Payout/Withdrawal', icon: Wallet },
    { id: 'emails', label: 'Cloud Mail', icon: Mail },
    { id: 'explorer', label: 'Block Explorer', icon: Database },
    { id: 'support', label: 'Help & Prefs', icon: HelpCircle },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f2f2f2] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Top Banner Alert System for Throttling over-temperature */}
      {stats.throttled && (
        <div className="bg-red-650 text-white py-1.5 px-4 text-center text-xs font-mono font-bold animate-pulse flex items-center justify-center gap-2 relative z-20 shadow-md border-b border-red-500/30">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          <span>WARNING: DETECTED GPU TEMPERATURE CRIPPLING AT {stats.temperature}°C. Mining throttling enabled to protect hardware!</span>
        </div>
      )}

      {/* Main Top Header Navigation */}
      <header className="border-b border-white/10 bg-[#0f0f0f] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 min-h-[4.5rem] flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Branded Logo layout (Literal, Human labels and zero margin clutter) */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#141414] border border-white/10 p-1.5 rounded-xl shadow-lg shrink-0 flex items-center justify-center">
              <img 
                src={appIcon} 
                alt="ALPHA LLC Logo_Flower" 
                className="h-7 w-7 rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight font-display text-white uppercase sm:text-base leading-none">
                ALPHA LLC MINER
              </h1>
              <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase font-semibold mt-1">
                Payout/Withdrawal Station
              </p>
            </div>
          </div>

          {/* Quick Header Mini-Metrics with flexible layout safety */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 font-mono text-xs w-full md:w-auto">
            <div className="hidden lg:block text-right text-xs">
              <span className="text-[9px] text-white/30 uppercase block font-semibold leading-none">Global Power Draw</span>
              <span className="font-semibold text-white/85 mt-0.5 block">{stats.powerDraw} Watts</span>
            </div>

            <div className="bg-[#050505] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-3">
              <div>
                <span className="text-[9px] text-[#a0a0a0]/60 uppercase block leading-none font-semibold">Coins</span>
                <span className="font-bold text-white flex items-center gap-1 mt-0.5 text-xs">
                  <Coins className="h-3 w-3 text-emerald-400" />
                  {coins.toFixed(3)}
                </span>
              </div>
              <div className="border-l border-white/10 h-6" />
              <div>
                <span className="text-[9px] text-[#a0a0a0]/60 uppercase block leading-none font-semibold">Cash Balance</span>
                <span className="font-bold text-emerald-400 mt-0.5 text-xs block">
                  {formatVal(usd)}
                </span>
              </div>
            </div>

            {/* Direct One-Tap Account Authentication Widget */}
            <div className="relative shrink-0">
              {user ? (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-[#0f1f18] border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 rounded-xl h-9 px-2.5 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-4.5 h-4.5 rounded-full border border-emerald-400"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden sm:inline font-semibold text-white/95 truncate max-w-[70px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 rounded-xl h-9 px-2.5 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/5 hover:shadow-emerald-500/10"
                >
                  <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Sync Portal</span>
                  <span className="sm:hidden">Sync</span>
                </button>
              )}
            </div>

            {/* Live rates currency type switcher */}
            <div className="relative shrink-0">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as any)}
                className="bg-[#050505] border border-white/10 text-white rounded-xl h-9 px-2 text-xs font-bold outline-none font-mono cursor-pointer hover:bg-white/5 transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>

            {/* Clear button to completely restart progress */}
            <button
              onClick={() => {
                if(window.confirm("Are you sure you want to hard reset the mining simulation progress metrics?")) {
                  resetProgress();
                }
              }}
              title="Reset Simulated Data"
              className="p-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-450 transition-all rounded-xl shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Global Settings Button (Accesses SupportAndSettings) */}
            <button
              onClick={() => setActiveTab('support')}
              title="System Settings & Preferences"
              className={`px-3 py-2 border transition-all rounded-xl shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'support'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-md shadow-emerald-500/5'
                  : 'border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <Settings className={`h-4 w-4 transition-transform duration-500 ${activeTab === 'support' ? 'rotate-90' : 'hover:scale-105'}`} />
              <span className="hidden sm:inline text-[10px] font-bold font-mono tracking-wider uppercase">Settings</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Core Section Frame */}
      <main 
        className={`flex-1 max-w-6xl w-full mx-auto transition-all duration-300 origin-top ${
          compactLayout ? 'px-3 md:px-4 py-4 space-y-4' : 'px-4 md:px-6 py-8 space-y-8'
        }`}
        style={{
          transform: scaleFactor !== 1 ? `scale(${scaleFactor})` : undefined,
          width: scaleFactor !== 1 ? `${100 / scaleFactor}%` : '100%',
        }}
      >
        
        {/* Viewport Scale & Auto-Adjust Control Console */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-5 font-mono text-xs shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
          
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Zap className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span>Viewport Optimizer</span>
                {autoScale && (
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-extrabold uppercase animate-pulse">
                    Auto Adjusting
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-white/40 mt-1 leading-normal">
                Prevents heading overlap, squished cards, and scrolling fatigue on small screens.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 w-full lg:w-auto justify-start lg:justify-end border-t lg:border-t-0 border-white/5 pt-3.5 lg:pt-0">
            {/* Auto-Adjust fitting trigger */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={autoScale}
                onChange={(e) => changeAutoScale(e.target.checked)}
                className="rounded border-white/20 bg-black text-emerald-500 focus:ring-relative h-4 w-4"
              />
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-wide">Auto Fit Screen</span>
            </label>

            {/* Compact margins layout trigger */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={compactLayout}
                onChange={(e) => changeCompact(e.target.checked)}
                className="rounded border-white/20 bg-black text-emerald-500 focus:ring-relative h-4 w-4"
              />
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-wide">Compact View</span>
            </label>

            {/* Manual preset scale buttons */}
            <div className="flex items-center gap-1 border border-white/10 bg-[#050505] p-0.5 rounded-xl">
              <button
                onClick={() => { changeAutoScale(false); changeScale(0.80); }}
                className={`px-2.5 py-1 text-[9px] uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                  scaleFactor === 0.80 && !autoScale ? 'bg-white/10 text-emerald-400 font-extrabold' : 'text-white/40 hover:text-white/70'
                }`}
                title="80% fitted scaling"
              >
                80% Fit
              </button>
              <button
                onClick={() => { changeAutoScale(false); changeScale(0.90); }}
                className={`px-2.5 py-1 text-[9px] uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                  scaleFactor === 0.90 && !autoScale ? 'bg-white/10 text-emerald-400 font-extrabold' : 'text-white/40 hover:text-white/70'
                }`}
                title="90% optimal scaling"
              >
                90%
              </button>
              <button
                onClick={() => { changeAutoScale(false); changeScale(1.0); }}
                className={`px-2.5 py-1 text-[9px] uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                  scaleFactor === 1.0 && !autoScale ? 'bg-white/10 text-emerald-400 font-extrabold' : 'text-white/40 hover:text-white/70'
                }`}
                title="100% standard scaling"
              >
                100%
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Metrics Board */}
        <div id="quick_telemetry_blocks" className={`grid grid-cols-2 lg:grid-cols-4 ${compactLayout ? 'gap-3' : 'gap-4'}`}>
          <MetricCard
            title="Sovereign Hashrate"
            value={`${stats.hashRate.toFixed(1)} MH/s`}
            subtext={stats.throttled ? "Throttling -90%" : "Hardware running normal"}
            iconName="Cpu"
            color={stats.throttled ? "red" : stats.hashRate > 0 ? "green" : "slate"}
            glow={stats.hashRate > 0}
          />
          <MetricCard
            title="Current Rig Draw"
            value={`${stats.powerDraw} W`}
            subtext="Voltage active"
            iconName="Zap"
            color={stats.powerDraw > 1000 ? "amber" : "cyan"}
          />
          <MetricCard
            title="Core Thermals"
            value={`${stats.temperature.toFixed(1)}°C`}
            subtext={stats.temperature > 85 ? "Overheat critical" : "Fluid temperature stable"}
            iconName="Flame"
            color={stats.temperature > 85 ? "red" : stats.temperature > 65 ? "amber" : "green"}
            glow={stats.temperature > 85}
          />
          <MetricCard
            title={`Cash Balance (${selectedCurrency})`}
            value={formatVal(usd)}
            subtext="Total earnings available"
            iconName="Wallet"
            color="green"
            glow={usd >= 5.0}
          />
        </div>

        {/* Tab Controllers Sub Navigation */}
        <div className="flex bg-[#050505] p-1.5 rounded-2xl border border-white/10 gap-1 overflow-x-auto">
          {tabs.filter(tab => tab.id !== 'support').map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 h-11 text-xs font-bold uppercase tracking-wider font-display rounded-xl cursor-pointer transition-all shrink-0 flex-1 ${
                  isActive
                    ? 'bg-white/10 text-emerald-400 font-extrabold'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {'shortcut' in tab && (
                  <span className="hidden sm:inline-block text-[8px] bg-white/5 border border-white/10 px-1 py-0.2 rounded text-white/30 font-mono">
                    {tab.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Tab content display */}
        <div id="primary_tab_content" className="min-h-[460px] animate-fade-in duration-300">
          {activeTab === 'mine' && <MiningDashboard />}
          {activeTab === 'upgrades' && <RigUpgrades />}
          {activeTab === 'market' && <MarketChart />}
          {activeTab === 'payouts' && <PayoutConsole />}
          {activeTab === 'emails' && <GmailInbox />}
          {activeTab === 'explorer' && <BlockExplorer />}
          {activeTab === 'support' && <SupportAndSettings />}
        </div>

      </main>

      {/* Futuristic Clean Footer banner (Strictly NO telemetry clutter or port numbers) */}
      <footer className="border-t border-white/5 bg-[#050505]/40 py-6 font-mono text-center text-white/30 text-[10px] tracking-wide mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            ALPHA LLC MINER SIMULATOR • COMPLIANT DIGITAL HASH ENGINES
          </p>
          <p className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Payout/Withdrawal Gateway Status: ONLINE
          </p>
        </div>
      </footer>

      <UserAuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

    </div>
  );
}

export default function App() {
  return (
    <MiningProvider>
      <AppContent />
    </MiningProvider>
  );
}
