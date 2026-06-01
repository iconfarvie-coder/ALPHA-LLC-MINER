import React from 'react';
import * as Lucide from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtext?: string;
  iconName: keyof typeof Lucide;
  color: 'green' | 'cyan' | 'amber' | 'red' | 'indigo' | 'slate';
  glow?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtext,
  iconName,
  color,
  glow = false,
}) => {
  const IconComponent = Lucide[iconName] as React.ComponentType<{ className?: string }>;

  const colorMap = {
    green: {
      bg: 'bg-[#0f0f0f] border-white/10 hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      text: 'text-emerald-400',
      glowClass: 'glow-green',
    },
    cyan: {
      bg: 'bg-[#0f0f0f] border-white/10 hover:border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      text: 'text-cyan-400',
      glowClass: 'glow-cyan',
    },
    amber: {
      bg: 'bg-[#0f0f0f] border-white/10 hover:border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
      text: 'text-amber-400',
      glowClass: 'glow-amber',
    },
    red: {
      bg: 'bg-[#0f0f0f] border-white/10 hover:border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-400',
      text: 'text-rose-400',
      glowClass: 'glow-red',
    },
    indigo: {
      bg: 'bg-[#0f0f0f] border-white/10 hover:border-indigo-500/30',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      text: 'text-indigo-400',
      glowClass: 'glow-indigo',
    },
    slate: {
      bg: 'bg-[#0f0f0f] border-white/5 hover:border-white/10',
      iconBg: 'bg-white/5 text-slate-300',
      text: 'text-slate-200',
      glowClass: '',
    },
  };

  const style = colorMap[color] || colorMap.slate;

  return (
    <div
      id={id}
      className={`border rounded-xl p-4 transition-all duration-300 backdrop-blur-sm ${style.bg} ${
        glow ? 'shadow-[0_0_15px_rgba(0,0,0,0.2)]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-mono text-slate-400 font-medium mb-1">
            {title}
          </p>
          <h3 className={`text-lg sm:text-xl md:text-2xl font-bold font-mono tracking-tight ${style.text} ${glow ? style.glowClass : ''}`}>
            {value}
          </h3>
          {subtext && (
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${style.iconBg} border border-white/5`}>
          {IconComponent && <IconComponent className="h-5 w-5" />}
        </div>
      </div>
    </div>
  );
};
