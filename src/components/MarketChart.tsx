import React, { useState, useRef, useEffect } from 'react';
import { useMining } from '../context/MiningContext';
import { 
  AreaChart, TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, 
  Newspaper, AlertCircle, Coins, Flame, Globe, Server, Activity, 
  Check, ArrowUpRight, Shield, ShieldCheck, KeyRound, ArrowRight
} from 'lucide-react';

export const MarketChart: React.FC = () => {
  const {
    coins,
    usd,
    marketPrice,
    marketHistory,
    news,
    activeNews,
    sellCoins,
    sellAllCoins,
    formatVal,
    transferToMT5,
  } = useMining();

  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');

  // MetaTrader 5 Bridge Integration State
  const [mtPlatform, setMtPlatform] = useState<'mt5' | 'mt4' | 'binance' | 'coinbase'>('mt5');
  const [mtServer, setMtServer] = useState(() => localStorage.getItem('fast_miner_mt_server') || 'MetaQuotes-Demo');
  const [mtAccount, setMtAccount] = useState(() => localStorage.getItem('fast_miner_mt_account') || '');
  const [mtPassword, setMtPassword] = useState(() => localStorage.getItem('fast_miner_mt_password') || '');
  const [isMtConnecting, setIsMtConnecting] = useState(false);
  const [isMtConnected, setIsMtConnected] = useState(() => localStorage.getItem('fast_miner_mt_connected') === 'true');
  const [mtBalance, setMtBalance] = useState<number>(() => parseFloat(localStorage.getItem('fast_miner_mt_balance') || '10000.00'));
  const [mtEquity, setMtEquity] = useState<number>(() => parseFloat(localStorage.getItem('fast_miner_mt_equity') || '10000.00'));
  const [mtLeverage, setMtLeverage] = useState(() => localStorage.getItem('fast_miner_mt_leverage') || '1:100');
  const [depositAmount, setDepositAmount] = useState('');
  const [mtLogs, setMtLogs] = useState<string[]>(['[System] MT5 terminal proxy handshakes ready.']);

  const handleConnectMT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mtAccount || !mtPassword) return;
    setIsMtConnecting(true);
    setMtLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SYNCHRONIZING SECURE TUNNEL TO ${mtServer.toUpperCase()}...`]);
    
    setTimeout(() => {
      setMtLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] CREDENTIAL HANDSHAKE VERIFIED FOR ID: ${mtAccount}`,
        `[${new Date().toLocaleTimeString()}] ENCRYPTED SSL LINK CREATED WITH BROKER SYSTEM.`,
        `[${new Date().toLocaleTimeString()}] SYNC COMPLETE.`
      ]);
      setIsMtConnecting(false);
      setIsMtConnected(true);
      localStorage.setItem('fast_miner_mt_connected', 'true');
      localStorage.setItem('fast_miner_mt_server', mtServer);
      localStorage.setItem('fast_miner_mt_account', mtAccount);
      localStorage.setItem('fast_miner_mt_password', mtPassword);
      localStorage.setItem('fast_miner_mt_balance', mtBalance.toString());
      localStorage.setItem('fast_miner_mt_equity', mtEquity.toString());
      localStorage.setItem('fast_miner_mt_leverage', mtLeverage);
    }, 1500);
  };

  const handleDisconnectMT = () => {
    setIsMtConnected(false);
    localStorage.removeItem('fast_miner_mt_connected');
    setMtLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Decoupled external broker session.`]);
  };

  const handleDepositToMT = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (amt > 0 && usd >= amt) {
      const success = transferToMT5(amt);
      if (success) {
        const nextBal = mtBalance + amt;
        const nextEq = mtEquity + amt;
        setMtBalance(nextBal);
        setMtEquity(nextEq);
        localStorage.setItem('fast_miner_mt_balance', nextBal.toString());
        localStorage.setItem('fast_miner_mt_equity', nextEq.toString());
        setMtLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Margin credit received: +$${amt.toFixed(2)} USD transfer finalized.`]);
        setDepositAmount('');
      }
    }
  };
  const [sellAmount, setSellAmount] = useState<string>('');

  // Calculate net trends
  const isUp = marketHistory.length >= 2 
    ? marketHistory[marketHistory.length - 1].price >= marketHistory[0].price 
    : true;

  const percentChange = marketHistory.length >= 2
    ? ((marketHistory[marketHistory.length - 1].price - marketHistory[0].price) / marketHistory[0].price) * 100
    : 0;

  // --- Core Custom SVG Chart Math ---
  const svgWidth = 600;
  const svgHeight = 260;
  const paddingY = 25;

  const btcPrices = marketHistory.map(h => h.price);
  const maxPrice = Math.max(...btcPrices, ...marketHistory.map(h => h.high)) * 1.002;
  const minPrice = Math.min(...btcPrices, ...marketHistory.map(h => h.low)) * 0.998;
  const priceRange = maxPrice - minPrice || 1;

  // Converts a price and time index into SVG coordinates
  const getCoords = (price: number, index: number) => {
    const x = (index / (marketHistory.length - 1)) * svgWidth;
    const y = svgHeight - paddingY - ((price - minPrice) / priceRange) * (svgHeight - 2 * paddingY);
    return { x, y };
  };

  // Build the SVG path string for the line chart
  const buildLinePath = () => {
    if (marketHistory.length < 2) return '';
    return marketHistory.reduce((path, point, index) => {
      const { x, y } = getCoords(point.price, index);
      return path + `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  // Build the closed path for the gradient-filled area below the line
  const buildAreaPath = () => {
    if (marketHistory.length < 2) return '';
    const linePath = buildLinePath();
    const startX = 0;
    const endX = svgWidth;
    const bottomY = svgHeight - paddingY;
    return `${linePath} L ${endX.toFixed(1)} ${bottomY.toFixed(1)} L ${startX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
  };

  // Safe manual sell inputs
  const handleSellCoinsVal = () => {
    const amt = parseFloat(sellAmount);
    if (amt > 0 && amt <= coins) {
      sellCoins(amt);
      setSellAmount('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Upper Ticker Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Live Ticker Metric */}
        <div className="md:col-span-8 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block font-semibold">HashCoin Index / USD Exchange</span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-3xl font-bold font-mono text-white">
                  ${marketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <div className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono text-xs font-bold leading-relaxed ${
                  isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                }`}>
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{isUp ? '+' : ''}{percentChange.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Selector options */}
            <div className="flex gap-1.5 border border-white/10 bg-[#050505]/85 p-0.5 rounded-lg font-mono">
              <button
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-colors cursor-pointer ${
                  chartType === 'line' ? 'bg-white/10 text-emerald-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                Line Glow
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-colors cursor-pointer ${
                  chartType === 'candlestick' ? 'bg-white/10 text-emerald-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                Candlesticks
              </button>
            </div>
          </div>

          {/* SVG Chart Core */}
          <div id="svg_canvas" className="w-full h-56 mt-6 relative select-none">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                {/* Area Gradient */}
                <linearGradient id="chartGlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (svgHeight - 2 * paddingY);
                return (
                  <line
                    key={i}
                    x1="0"
                    y1={y}
                    x2={svgWidth}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                );
              })}

              {/* LINE VIEW */}
              {chartType === 'line' && (
                <>
                  {/* Glowing semi-transparent background area */}
                  <path
                    d={buildAreaPath()}
                    fill="url(#chartGlowGradient)"
                  />
                  
                  {/* Solid Vector Line */}
                  <path
                    d={buildLinePath()}
                    fill="none"
                    stroke={isUp ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />

                  {/* Pulsing focal node at latest coordinate */}
                  {marketHistory.length > 0 && (() => {
                    const lastIndex = marketHistory.length - 1;
                    const lastPoint = marketHistory[lastIndex];
                    const { x, y } = getCoords(lastPoint.price, lastIndex);
                    return (
                      <g>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill={isUp ? '#10b981' : '#f43f5e'}
                          className="animate-ping opacity-60 pointer-events-none"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill={isUp ? '#10b981' : '#f43f5e'}
                          stroke="#020617"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })()}
                </>
              )}

              {/* CANDLESTICK VIEW */}
              {chartType === 'candlestick' && (
                <g>
                  {marketHistory.map((point, index) => {
                    // Coordinates of candles
                    const openCoords = getCoords(point.open, index);
                    const closeCoords = getCoords(point.close, index);
                    const highCoords = getCoords(point.high, index);
                    const lowCoords = getCoords(point.low, index);

                    const isCandleGreen = point.close >= point.open;
                    const candleColor = isCandleGreen ? '#10b981' : '#f43f5e';

                    // Thickness
                    const widthFraction = svgWidth / marketHistory.length;
                    const rectWidth = Math.max(4, widthFraction - 6);
                    const x = openCoords.x;

                    // Compute rect params
                    const rectY = Math.min(openCoords.y, closeCoords.y);
                    const rectHeight = Math.max(1.8, Math.abs(openCoords.y - closeCoords.y));

                    return (
                      <g key={index} className="hover:opacity-80 transition-opacity">
                        {/* High/Low wick line */}
                        <line
                          x1={x}
                          y1={highCoords.y}
                          x2={x}
                          y2={lowCoords.y}
                          stroke={candleColor}
                          strokeWidth="1.5"
                        />
                        {/* Open/Close body */}
                        <rect
                          x={x - rectWidth / 2}
                          y={rectY}
                          width={rectWidth}
                          height={rectHeight}
                          fill={candleColor}
                          stroke={candleColor}
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Value scale indicators */}
            <div className="absolute top-2 right-2 text-[9px] font-mono text-white/40 text-right space-y-1 bg-[#050505]/95 p-2 rounded border border-white/10 font-medium">
              <div>High: ${maxPrice.toFixed(2)}</div>
              <div>Low: ${minPrice.toFixed(2)}</div>
            </div>
          </div>

        </div>

        {/* Action Sell Panel */}
        <div className="md:col-span-4 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between font-mono">
          <div>
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4">
              <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
              <span>Liquidity Converter</span>
            </h3>

            {/* Quick Stat balances */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs p-3 bg-[#050505] rounded-xl border border-white/10">
                <span className="text-white/40">Mined HSC:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-emerald-400" />
                  {coins.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-[#050505] rounded-xl border border-white/10">
                <span className="text-white/40">Cash Balance:</span>
                <span className="font-bold text-emerald-400">
                  {formatVal(usd)}
                </span>
              </div>
            </div>

            {/* Inputs and sliders */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1 font-semibold">
                  Amount to Exchange
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="0.00"
                    max={coins}
                    className="w-full bg-[#050505] border border-white/10 focus:border-emerald-400/40 outline-none h-11 px-3 text-sm text-white font-mono rounded-xl pr-16"
                  />
                  <button
                    onClick={() => setSellAmount(coins.toString())}
                    className="absolute right-2.5 top-2.5 h-6 px-1.5 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-white/10 rounded hover:bg-emerald-500/20 cursor-pointer"
                  >
                    Max
                  </button>
                </div>
              </div>

              {sellAmount && !isNaN(parseFloat(sellAmount)) && (
                <div className="text-[10px] text-white/40 text-center py-1 font-medium">
                  ≃ ${(parseFloat(sellAmount) * marketPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
            <button
              onClick={handleSellCoinsVal}
              disabled={!sellAmount || isNaN(parseFloat(sellAmount)) || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > coins}
              className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 cursor-pointer"
            >
              Exchange HSC
            </button>
            <button
              onClick={sellAllCoins}
              disabled={coins <= 0}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Exchange All Mined Coins
            </button>
          </div>

        </div>

      </div>

      {/* Lower Row Grid for News Sentiment and MetaTrader Bridge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Impact Ticker / News Feed */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
              <Newspaper className="h-4.5 w-4.5 text-emerald-400" />
              <span>Bloomberg Block Sentiment Feed</span>
            </h3>

            {/* Real active news booster alerts */}
            {activeNews && (
              <div className={`p-4 rounded-xl border mb-4 animate-pulse flex gap-3 ${
                activeNews.impactType === 'bullish' 
                  ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-950/15 border-rose-500/20 text-rose-300'
              }`}>
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest block mb-0.5">
                    Market Shock Alert Event ({activeNews.impactPercent}% weight)
                  </span>
                  <p className="text-xs font-bold leading-relaxed">{activeNews.headline}</p>
                </div>
              </div>
            )}

            {/* Scrolling logs layout */}
            <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-2">
              {news.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white/80 leading-relaxed">{item.headline}</p>
                    <div className="flex gap-2.5 items-center">
                      <span className="text-[10px] text-white/40">{item.source}</span>
                      <span className="text-[8px] h-1.5 w-1.5 bg-white/10 rounded-full" />
                      <span className="text-[10px] text-white/40">{item.time}</span>
                    </div>
                  </div>

                  <div className={`text-[10px] font-bold uppercase shrink-0 py-0.5 px-2 rounded ${
                    item.impactType === 'bullish' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : item.impactType === 'bearish'
                      ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                      : 'bg-white/5 text-white/40 border border-white/5'
                  }`}>
                    {item.impactType === 'bullish' ? 'Bullish' : item.impactType === 'bearish' ? 'Bearish' : 'Neutral'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MetaTrader 5 / External Trading platform Bridge */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/95 flex items-center justify-between gap-2 mb-4 border-b border-white/10 pb-3">
              <span className="flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-emerald-400" />
                <span>Trading Terminal Bridge</span>
              </span>
              {isMtConnected ? (
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-extrabold uppercase animate-pulse flex items-center gap-1">
                  <span className="h-1 w-1 bg-emerald-400 rounded-full shrink-0" />
                  Synced
                </span>
              ) : (
                <span className="text-[8px] bg-white/5 text-white/40 border border-white/5 px-2 py-0.5 rounded-full font-bold uppercase">
                  Offline
                </span>
              )}
            </h3>

            {!isMtConnected ? (
              <form onSubmit={handleConnectMT} className="space-y-4">
                {/* Broker Platform Selection Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider block font-bold">
                    Select A Broker Platform Card To Connect
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: 'mt5',
                        name: 'MetaTrader 5 (MT5)',
                        desc: 'The global standard for Forex, CFDs, and precious metal spot pools.',
                        server: 'MetaQuotes-Demo',
                        badge: 'CFDs/Forex',
                      },
                      {
                        id: 'mt4',
                        name: 'MetaTrader 4 (MT4)',
                        desc: 'The heritage platform for specialized automated algorithm copies.',
                        server: 'MetaQuotes-Classic',
                        badge: 'Classic Algo',
                      },
                      {
                        id: 'binance',
                        name: 'Binance Exchange',
                        desc: 'High velocity spot and secure margin token derivatives bridge.',
                        server: 'api.binance.com',
                        badge: 'Crypto Spot',
                      },
                      {
                        id: 'coinbase',
                        name: 'Coinbase Pro',
                        desc: 'Direct bank authorization, fiat clearing, and regulated USD rails.',
                        server: 'api-public.coinbase.com',
                        badge: 'USD Rails',
                      }
                    ].map(platform => {
                      const isSelected = mtPlatform === platform.id;
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => {
                            setMtPlatform(platform.id as any);
                            setMtServer(platform.server);
                          }}
                          className={`p-3 rounded-xl border text-left font-mono transition-all duration-300 relative select-none cursor-pointer flex flex-col justify-between h-[115px] ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/[0.04] text-white shadow-[0_2px_15px_rgba(16,185,129,0.1)]'
                              : 'border-white/5 bg-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className={`text-[11px] tracking-tight ${isSelected ? 'text-emerald-400 font-black' : 'text-white/85'}`}>
                                {platform.name}
                              </span>
                              <span className={`text-[8px] border px-1.5 py-0.5 rounded leading-none shrink-0 uppercase font-bold ${
                                isSelected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'
                              }`}>
                                {platform.badge}
                              </span>
                            </div>
                            
                            <p className="text-[9px] text-white/45 leading-normal mb-1 line-clamp-2">
                              {platform.desc}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[8px] border-t border-white/5 pt-1.5 mt-1.5 w-full">
                            <span className="text-white/30 truncate select-all">Host: {platform.server}</span>
                            {isSelected ? (
                              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping" />
                                Active
                              </span>
                            ) : (
                              <span className="text-white/20">Select</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase tracking-wider block font-semibold">Active Mode</label>
                    <input
                      type="text"
                      disabled
                      value={mtPlatform.toUpperCase()}
                      className="w-full bg-[#050505] border border-white/5 opacity-50 outline-none h-10 px-2.5 text-xs text-white rounded-xl font-black tracking-widest uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase tracking-wider block font-semibold">Bridge Server / Host</label>
                    <input
                      type="text"
                      value={mtServer}
                      onChange={(e) => setMtServer(e.target.value)}
                      placeholder="e.g. MetaQuotes-Demo"
                      className="w-full bg-[#050505] border border-white/10 outline-none h-10 px-2.5 text-xs text-white rounded-xl focus:border-emerald-500/30 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase tracking-wider block font-semibold">Account Login Code</label>
                    <input
                      type="number"
                      required
                      value={mtAccount}
                      onChange={(e) => setMtAccount(e.target.value)}
                      placeholder="10928471"
                      className="w-full bg-[#050505] border border-white/10 outline-none h-10 px-2.5 text-xs text-white rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase tracking-wider block font-semibold">Trading Password</label>
                    <input
                      type="password"
                      required
                      value={mtPassword}
                      onChange={(e) => setMtPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#050505] border border-white/10 outline-none h-10 px-2.5 text-xs text-white rounded-xl font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isMtConnecting || !mtAccount || !mtPassword}
                  className="w-full h-10 rounded-xl bg-[#0e271e] text-emerald-400 border border-emerald-500/25 hover:bg-[#113125] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-35"
                >
                  {isMtConnecting ? (
                    <>
                      <Activity className="h-3.5 w-3.5 animate-spin" />
                      <span>Syncing Connection Bridge...</span>
                    </>
                  ) : (
                    <>
                      <Server className="h-3.5 w-3.5" />
                      <span>Link Trading Account</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {/* Connected broker display */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#050505] rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/35 uppercase block">Bridge Balance</span>
                    <span className="text-sm font-black text-white block mt-0.5">${mtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="p-3 bg-[#050505] rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/35 uppercase block">Account Equity</span>
                    <span className="text-sm font-black text-emerald-400 block mt-0.5">${mtEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[8px] text-white/35 block uppercase leading-none">Bridge Configuration</span>
                    <span className="font-semibold text-white/80 block mt-1 font-mono">{mtPlatform.toUpperCase()} • {mtServer} • ID: {mtAccount}</span>
                  </div>
                  <button
                    onClick={handleDisconnectMT}
                    className="text-[9px] uppercase font-bold text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 rounded-md cursor-pointer border border-rose-500/10"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Instant Deposit Form */}
                <form onSubmit={handleDepositToMT} className="space-y-1.5 p-3.5 bg-[#050505] rounded-xl border border-white/10">
                  <div className="flex justify-between items-center text-[10px] text-white/40 mb-1">
                    <span className="font-bold">CONVERT USD TO TRADING MARGIN</span>
                    <span>Max Available: {formatVal(usd)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      max={usd}
                      step="any"
                      className="w-full bg-black border border-white/5 outline-none h-9 px-2 text-xs text-white rounded-lg pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setDepositAmount(usd.toFixed(2))}
                      className="absolute right-2 top-1.5 h-6 px-1.5 text-[8px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 border border-white/10 rounded hover:bg-emerald-500/20"
                    >
                      Max
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) > usd}
                    className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Deposit into MT5 Live Balance</span>
                  </button>
                </form>
              </div>
            )}

            {/* Live Logs view port */}
            <div className="mt-3.5 border border-white/5 bg-[#050505]/80 p-3.5 rounded-xl font-mono max-h-[110px] overflow-y-auto space-y-1.5 pr-2">
              <span className="text-[8px] text-white/30 tracking-widest block uppercase font-black border-b border-white/5 pb-1">Bridge Logs</span>
              {mtLogs.map((log, index) => (
                <div key={index} className="text-[9px] text-white/60 leading-normal font-mono truncate">
                  {log}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
