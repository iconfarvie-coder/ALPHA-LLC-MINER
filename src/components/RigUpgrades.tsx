import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { MiningUpgrade } from '../types';
import * as Lucide from 'lucide-react';

export const RigUpgrades: React.FC = () => {
  const {
    usd,
    upgrades,
    buyUpgrade,
    stats,
  } = useMining();

  const [activeCategory, setActiveCategory] = useState<'gpu' | 'cooling' | 'power' | 'booster'>('gpu');

  // Multi-step bulletproof icon helper
  const renderIcon = (iconName: string, className: string) => {
    let IconComp = Lucide.Settings;
    
    switch (iconName) {
      case 'Cpu': IconComp = Lucide.Cpu; break;
      case 'Zap': IconComp = Lucide.Zap; break;
      case 'HardDrive': IconComp = Lucide.HardDrive; break;
      case 'Server': IconComp = Lucide.Server; break;
      case 'Wind': IconComp = Lucide.Wind; break;
      case 'Droplet': IconComp = Lucide.Droplet; break;
      case 'Snowflake': IconComp = Lucide.Snowflake; break;
      case 'PlugToggleLeft': IconComp = Lucide.Plug; break;
      case 'Sun': IconComp = Lucide.Sun; break;
      case 'Waves': IconComp = Lucide.Waves; break;
      case 'Flame': IconComp = Lucide.Flame; break;
      case 'Fingerprint': IconComp = Lucide.Fingerprint; break;
      case 'ZapSpeed': IconComp = Lucide.TrendingUp; break;
      case 'Gauge': IconComp = Lucide.Gauge; break;
    }

    return <IconComp className={className} />;
  };

  const filteredUpgrades = upgrades.filter(u => u.type === activeCategory);

  const formatUpgradeValue = (item: MiningUpgrade) => {
    if (item.type === 'gpu') {
      return `+${(item.multiplier * item.level).toFixed(2)} MH/s`;
    }
    if (item.type === 'cooling') {
      return `-${Math.abs(item.multiplier * item.level).toFixed(1)}°C/s`;
    }
    if (item.type === 'power') {
      return `-${Math.round((1 - Math.pow((1 - item.multiplier), item.level)) * 100)}% Wattage`;
    }
    if (item.type === 'booster') {
      if (item.id === 'boost_manual') {
        return `+${(item.level * item.multiplier * 100)}% Clicks`;
      }
      if (item.id === 'boost_autoclick') {
        return `${item.level * item.multiplier} auto clicks/s`;
      }
      if (item.id === 'boost_overvolt') {
        return `+${(item.level * item.multiplier * 100)}% Hash Rate`;
      }
    }
    return '';
  };

  const getUpgradePreview = (item: MiningUpgrade) => {
    if (item.type === 'gpu') {
      return `Next: +${item.multiplier.toFixed(2)} MH/s (+${item.watts}W, +${item.heat}°C)`;
    }
    if (item.type === 'cooling') {
      return `Next: -${Math.abs(item.multiplier).toFixed(1)}°C/s (-${item.watts}W loss)`;
    }
    if (item.type === 'power') {
      return `Next: Save ${item.multiplier * 100}% input power`;
    }
    if (item.type === 'booster') {
      if (item.id === 'boost_manual') {
        return `Next: +${item.multiplier * 100}% Active Click Revenue`;
      }
      if (item.id === 'boost_autoclick') {
        return `Next: +${item.multiplier} clicks/sec passive automation`;
      }
      if (item.id === 'boost_overvolt') {
        return `Next: +40% graphics performance (+30% watts draft!)`;
      }
    }
    return '';
  };

  const currentTotalPower = upgrades
    .filter(u => u.type === 'gpu')
    .reduce((acc, u) => acc + u.watts * u.level, 0);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Panel */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        <div>
          <span className="text-[10px] text-white/40 uppercase block tracking-wider font-semibold">Rig Efficiency Summary</span>
          <div className="text-xl font-bold text-white mt-1">
            {stats.efficiency.toFixed(0)} <span className="text-xs text-white/40 font-normal">MH/kW-h</span>
          </div>
          <span className="text-[10px] text-white/30 mt-1 block">Higher = Better fuel savings</span>
        </div>
        <div className="border-t md:border-t-0 md:border-x border-white/10 pt-4 md:pt-0 md:px-6">
          <span className="text-[10px] text-white/40 uppercase block tracking-wider font-semibold">Current Thermal Draft</span>
          <div className="text-xl font-bold text-amber-500 mt-1">
            {stats.temperature}°C <span className="text-xs text-white/40 font-normal">/ 95°C Limit</span>
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            {stats.throttled ? '🚨 THERMAL THROTTLING OVERLOAD' : 'Cooling state optimized'}
          </p>
        </div>
        <div className="border-t md:border-t-0 pt-4 md:pt-0">
          <span className="text-[10px] text-white/40 uppercase block tracking-wider font-semibold">Upgrade Finance Bank</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-white/30 mt-1 block">Sell Mined HSC in Market to acquire USD</span>
        </div>
      </div>

      {/* Categories Tabs Selector */}
      <div className="flex border-b border-white/10 pb-px overflow-x-auto gap-2">
        {(['gpu', 'cooling', 'power', 'booster'] as const).map(category => {
          const isActive = activeCategory === category;
          const label = {
            gpu: 'GPUs & ASIC Miners',
            cooling: 'Thermal Coolers',
            power: 'Power Grids & Generators',
            booster: 'AI Performance Boosters',
          }[category];

          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`py-2.5 px-4 font-bold text-xs rounded-t-xl transition-all uppercase tracking-wider font-display shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#0f0f0f] text-emerald-400 border-t border-x border-white/10 font-black'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Upgrade Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredUpgrades.map(item => {
          const isMax = item.level >= item.maxLevel;
          const canAfford = usd >= item.cost;
          
          return (
            <div
              key={item.id}
              className={`border rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between backdrop-blur-sm ${
                isMax ? 'border-white/5 bg-[#0e0e0e]/50' : 'border-white/10 bg-[#0f0f0f]'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl text-slate-330 ${isMax ? 'bg-white/5 text-white/30' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {renderIcon(item.icon, 'h-5 w-5')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-[10px] font-mono text-white/40 mt-0.5 uppercase tracking-wide">
                        Lvl {item.level} / {item.maxLevel}
                      </p>
                    </div>
                  </div>

                  {!isMax ? (
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-emerald-400">${item.cost}</span>
                      <span className="text-[9px] block text-[#a0a0a0] uppercase">Upgrade Cost</span>
                    </div>
                  ) : (
                    <div className="bg-white/5 text-white/60 text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded">
                      MAX LEVEL
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-white/60 line-clamp-2 min-h-[32px] mt-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Performance stats gauges */}
                <div className="border-t border-white/10 pt-3 mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
                  <div>
                    <span className="text-[#a0a0a0]/60 block uppercase font-semibold">Current impact:</span>
                    <span className="font-semibold text-white/80">
                      {item.level > 0 ? formatUpgradeValue(item) : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#a0a0a0]/60 block uppercase font-semibold">Rig cost parameters:</span>
                    <span className="text-[#a0a0a0]">
                      {item.type === 'gpu' ? `+${item.watts}W heat load` : `Watts drawn: ${item.watts}W`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Trigger Button */}
              <div className="mt-4 pt-3 border-t border-white/5">
                {!isMax ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-mono text-white/40 leading-tight">
                      {getUpgradePreview(item)}
                    </span>
                    <button
                      onClick={() => buyUpgrade(item.id)}
                      disabled={!canAfford}
                      className={`py-2 px-4 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-sm shrink-0 cursor-pointer ${
                        canAfford
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:shadow-emerald-500/10'
                          : 'bg-[#141414] text-white/20 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Upgrade' : 'No Funds'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-[10px] font-mono text-[#a0a0a0]/40 py-1 uppercase tracking-widest">
                    Hardware fully optimized to silicon boundaries
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
