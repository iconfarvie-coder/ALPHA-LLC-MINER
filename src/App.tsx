import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { MiningProvider, useMining } from './context/MiningContext';
import { MetricCard } from './components/MetricCard';
import { MiningDashboard } from './components/MiningDashboard';
import { RigUpgrades } from './components/RigUpgrades';
import { MarketChart } from './components/MarketChart';
import { PayoutConsole } from './components/PayoutConsole';
import { UserAuthModal } from './components/UserAuthModal';
import { GmailInbox } from './components/GmailInbox';
import { Cpu, Server, TrendingUp, Wallet, ShieldAlert, AlertCircle, RefreshCw, Zap, Coins, DollarSign, ShieldCheck, Mail } from 'lucide-react';

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
  } = useMining();

  // Tab configurations
  const tabs = [
    { id: 'mine', label: 'Mine Reactor', icon: Cpu },
    { id: 'upgrades', label: 'Hardware Shop', icon: Server },
    { id: 'market', label: 'DEX Trade & News', icon: TrendingUp },
    { id: 'payouts', label: 'Easy Payouts', icon: Wallet },
    { id: 'emails', label: 'Cloud Mail', icon: Mail },
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
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Branded Logo layout (Literal, Human labels and zero margin clutter) */}
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-xl shadow-lg shadow-emerald-500/10">
              <Zap className="h-5 w-5 text-slate-950 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight font-display text-white uppercase sm:text-base">
                FAST CRYPTO MINER
              </h1>
              <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase font-semibold">
                Easy Payout Station
              </p>
            </div>
          </div>

          {/* Quick Header Mini-Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 font-mono text-xs">
            <div className="hidden sm:block text-right">
              <span className="text-[9px] text-white/30 uppercase block font-semibold">Global Power Draw</span>
              <span className="font-semibold text-white/85">{stats.powerDraw} Watts</span>
            </div>

            <div className="bg-[#050505] border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-4">
              <div>
                <span className="text-[9px] text-[#a0a0a0]/60 uppercase block leading-none font-semibold">Coins</span>
                <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                  <Coins className="h-3 w-3 text-emerald-400" />
                  {coins.toFixed(3)}
                </span>
              </div>
              <div className="border-l border-white/10 h-6" />
              <div>
                <span className="text-[9px] text-[#a0a0a0]/60 uppercase block leading-none font-semibold">Cash Balance</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  {formatVal(usd)}
                </span>
              </div>
            </div>

            {/* Direct One-Tap Account Authentication Widget */}
            <div className="relative shrink-0">
              {user ? (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-[#0f1f18] border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 rounded-xl h-9 px-3 text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-5 h-5 rounded-full border border-emerald-400"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden md:inline font-semibold text-white/95 truncate max-w-[80px]">
                    {user.name}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 rounded-xl h-9 px-3 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/5 hover:shadow-emerald-500/10"
                >
                  <ShieldCheck className="h-4.5 w-4.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Sync Portal</span>
                  <span className="sm:hidden">Sync</span>
                </button>
              )}
            </div>

            {/* Live rates currency type switcher */}
            <div className="relative">
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
              className="p-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-400 transition-all rounded-lg shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Core Section Frame */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* Dynamic Telemetry Metrics Board */}
        <div id="quick_telemetry_blocks" className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-5 py-3 h-11 text-xs font-bold uppercase tracking-wider font-display rounded-xl cursor-pointer transition-all shrink-0 flex-1 ${
                  isActive
                    ? 'bg-white/10 text-emerald-400'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
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
        </div>

      </main>

      {/* Futuristic Clean Footer banner (Strictly NO telemetry clutter or port numbers) */}
      <footer className="border-t border-white/5 bg-[#050505]/40 py-6 font-mono text-center text-white/30 text-[10px] tracking-wide mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            FAST CRYPTO MINER SIMULATOR • COMPLIANT DIGITAL HASH ENGINES
          </p>
          <p className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Easy Payout Gateway Status: ONLINE
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
      <Analytics />
    </MiningProvider>
  );
}
