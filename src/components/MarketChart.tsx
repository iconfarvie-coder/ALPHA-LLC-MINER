import React, { useState, useRef, useEffect } from 'react';
import { useMining } from '../context/MiningContext';
import { AreaChart, TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, Newspaper, AlertCircle, Coins, Flame } from 'lucide-react';

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
  } = useMining();

  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
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

      {/* Live Impact Ticker / News Feed */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 backdrop-blur-md font-mono">
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
  );
};
