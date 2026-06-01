import React, { useState, useEffect, useRef } from 'react';
import { useMining } from '../context/MiningContext';
import { 
  Star, 
  MessageSquare, 
  Send, 
  Settings, 
  HelpCircle, 
  ShieldAlert, 
  Wifi, 
  Globe, 
  Volume2, 
  ShieldCheck, 
  User, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Loader, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  Headphones,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface UserReview {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  timestamp: number;
  approved: boolean;
}

export const SupportAndSettings: React.FC = () => {
  const {
    user,
    formatVal,
    usd,
    stats,
  } = useMining();

  // Sub-tabs in Support Section
  const [subTab, setSubTab] = useState<'support' | 'preferences' | 'docs' | 'reviews'>('support');

  // AI Chat Messages state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "System Alpha Terminal initialized. I am your specialized AI Support Operator. Ask me anything about upgrading your GPU rigs, resolving pending payouts in the Mempool, or optimizing thermal ratios.",
      timestamp: Date.now()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Live Agent State
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  const [liveAgent, setLiveAgent] = useState<{ name: string; title: string; avatar: string } | null>(null);
  const [isLiveAgentTyping, setIsLiveAgentTyping] = useState(false);
  const [selectedIssuePrompt, setSelectedIssuePrompt] = useState<string | null>(null);

  // App Service Adjustments
  const [meshProtocol, setMeshProtocol] = useState<'sov' | 'nitro' | 'p2p'>(() => {
    return (localStorage.getItem('pref_mesh_protocol') as any) || 'sov';
  });
  const [hashingFrequency, setHashingFrequency] = useState<'stable' | 'turbo' | 'cryogenic'>(() => {
    return (localStorage.getItem('pref_hashing_freq') as any) || 'stable';
  });
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    return localStorage.getItem('pref_sound_alerts') !== 'false';
  });
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('pref_privacy_mode') === 'true';
  });
  const [nodeSpeed, setNodeSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('pref_node_speed');
    return saved ? parseInt(saved) : 100;
  });

  // App Sync with UI state from LocalStorage (Compact/AutoScale)
  const [compactPref, setCompactPref] = useState(() => {
    return localStorage.getItem('fast_miner_compact_layout') === 'true';
  });
  const [autoScalePref, setAutoScalePref] = useState(() => {
    return localStorage.getItem('fast_miner_auto_scale') !== 'false';
  });

  const triggerUIRefresh = () => {
    // Notify user to click reset/apply or just force an aesthetic UI notice
    const customNotification = new CustomEvent('app_pref_changed');
    window.dispatchEvent(customNotification);
  };

  const handleCompactToggle = () => {
    const nextVal = !compactPref;
    setCompactPref(nextVal);
    localStorage.setItem('fast_miner_compact_layout', nextVal ? 'true' : 'false');
    triggerUIRefresh();
    window.location.reload(); // Quick refresh for standard layout binding update!
  };

  const handleAutoScaleToggle = () => {
    const nextVal = !autoScalePref;
    setAutoScalePref(nextVal);
    localStorage.setItem('fast_miner_auto_scale', nextVal ? 'true' : 'false');
    triggerUIRefresh();
    window.location.reload();
  };

  // Support Documents Accordion State
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Rating and Reviews state
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingHover, setRatingHover] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const [reviewsList, setReviewsList] = useState<UserReview[]>([
    {
      id: 'rev_1',
      name: 'Cyber_Core_9',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberCore9',
      rating: 5,
      comment: 'Decentralized ZK payout verification was smooth! Literally hashes beautifully on standard mobile nodes.',
      timestamp: Date.now() - 4800000,
      approved: true
    },
    {
      id: 'rev_2',
      name: 'Alpha_Validator_0x',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlphaVal',
      rating: 4,
      comment: 'Upgraded to Liquid Nitro cooling. Kept temperatures capped below 55°C. Support was snappy too.',
      timestamp: Date.now() - 32400000,
      approved: true
    }
  ]);

  // Autoscroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping, isLiveAgentTyping]);

  // AI Chat Submission
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessageText = chatInput;
    setChatInput('');

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setIsAiTyping(true);

    try {
      // call server /api/chat route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...chatMessages, newMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error('API server unreachable');
      }

      const resData = await response.json();
      setChatMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: resData.content,
        timestamp: Date.now()
      }]);
    } catch {
      // Safe fallback system if the client server fails or network is offline
      setTimeout(() => {
        let fallbackReply = "Alpha Node Signal is flickering. Upgraded GPU setups automatically process telemetry logs. Navigate to settings to confirm the Local RPC Gateway protocol.";
        
        const lower = userMessageText.toLowerCase();
        if (lower.includes('heat') || lower.includes('hot') || lower.includes('temperature') || lower.includes('cooling')) {
          fallbackReply = "Thermal Safety Watchdog: Your active mining core will automatically scale down hashrate by 90% if temperature hits 85°C. Purchase Cryogenic cooling inside 'Hardware Shop' to optimize performance!";
        } else if (lower.includes('payout') || lower.includes('withdraw') || lower.includes('mempool') || lower.includes('money')) {
          fallbackReply = "Sovereign Dispatch Protocol: Cash outputs dispatch instantly via local cryptonode gateways. If transaction displays as 'UNVERIFIED', pass the compliance checklist by authorizing Google, Apple, or Phone Sync on the wallet list.";
        }

        setChatMessages(prev => [...prev, {
          id: `fallback-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: Date.now()
        }]);
      }, 700);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Live Agent Connection Simulation
  const connectLiveAgent = () => {
    setIsConnectingLive(true);
    setTimeout(() => {
      setIsConnectingLive(false);
      setLiveAgent({
        name: 'Sarah Jennings',
        title: 'ALPHA Senior Compliance Lead',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah'
      });
      setChatMessages(prev => [
        ...prev,
        {
          id: `live-sys-${Date.now()}`,
          role: 'system',
          content: "System message: Secured Peer-to-Peer tunnel established. Support Specialist 'Sarah Jennings' joined the terminal.",
          timestamp: Date.now()
        },
        {
          id: `live-msg-1`,
          role: 'assistant',
          content: "Hello! This is Sarah from ALPHA payout compliance. I see you are currently checking your node connections. How can I assist you with clearing your settlement pending cycles?",
          timestamp: Date.now() + 100
        }
      ]);
    }, 1500);
  };

  // Pre-configured options when discussing with Live Agent
  const triggerLiveAgentAnswer = (type: string) => {
    setSelectedIssuePrompt(type);
    let userText = "";
    let agentText = "";

    switch(type) {
      case 'verify':
        userText = "Why is my payout stuck on UNVERIFIED status?";
        agentText = "I see your transaction in our mempool pool. Because of standard AML requirements, our fast-clear validator requires active account verification. Simply expand your payout row, click the 'Google Sync' or 'Phone Sync' button, and authorize. We will approve the payout instantly!";
        break;
      case 'cooling':
        userText = "Rig heat levels keep throttling mine throughput.";
        agentText = "That's a protective lock! High temperature over 85°C reduces efficiency. I suggest going into preferences and increasing node cooling or upgrading fans. You can also deploy Cryo boosters from your shop page.";
        break;
      case 'auto':
        userText = "Is the auto-miner drawing hardware resources when closed?";
        agentText = "No! Our auto mining operates completely on simulated cloud clusters. It runs off-line safely without consuming any electrical cycles or processing units on your direct device.";
        break;
    }

    setChatMessages(prev => [...prev, {
      id: `live-user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now()
    }]);

    setIsLiveAgentTyping(true);
    setTimeout(() => {
      setIsLiveAgentTyping(false);
      setChatMessages(prev => [...prev, {
        id: `live-agent-reply-${Date.now()}`,
        role: 'assistant',
        content: agentText,
        timestamp: Date.now()
      }]);
    }, 1200);
  };

  // Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) return;

    const newReview: UserReview = {
      id: `user_rev_${Date.now()}`,
      name: user?.name || 'Anonymous Operator',
      avatar: user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
      rating: userRating,
      comment: reviewComment || "Excellent mining workspace!",
      timestamp: Date.now(),
      approved: true
    };

    setReviewsList(prev => [newReview, ...prev]);
    setIsSubmitSuccessful(true);
    setReviewComment('');
    setTimeout(() => {
      setIsSubmitSuccessful(false);
    }, 4500);
  };

  // Save changes to localStorage on adjustments
  const handleMeshChange = (val: 'sov' | 'nitro' | 'p2p') => {
    setMeshProtocol(val);
    localStorage.setItem('pref_mesh_protocol', val);
  };

  const handleFreqChange = (val: 'stable' | 'turbo' | 'cryogenic') => {
    setHashingFrequency(val);
    localStorage.setItem('pref_hashing_freq', val);
  };

  return (
    <div id="support_and_settings_container" className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
      
      {/* Left Column - Navigation sidebar */}
      <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 p-1.5 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-x-auto shrink-0">
        <button
          id="btn_subtab_support"
          onClick={() => setSubTab('support')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all min-w-[130px] lg:w-full select-none cursor-pointer ${
            subTab === 'support' 
              ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 text-emerald-400' 
              : 'border border-transparent text-white/50 hover:text-white/85 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5 shrink-0" />
          <span>Support Chat</span>
        </button>

        <button
          id="btn_subtab_prefs"
          onClick={() => setSubTab('preferences')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all min-w-[130px] lg:w-full select-none cursor-pointer ${
            subTab === 'preferences' 
              ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 text-emerald-400' 
              : 'border border-transparent text-white/50 hover:text-white/85 hover:bg-white/5'
          }`}
        >
          <Settings className="h-4.5 w-4.5 shrink-0" />
          <span>Preferences</span>
        </button>

        <button
          id="btn_subtab_docs"
          onClick={() => setSubTab('docs')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all min-w-[130px] lg:w-full select-none cursor-pointer ${
            subTab === 'docs' 
              ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 text-emerald-400' 
              : 'border border-transparent text-white/50 hover:text-white/85 hover:bg-white/5'
          }`}
        >
          <HelpCircle className="h-4.5 w-4.5 shrink-0" />
          <span>Manuals & Docs</span>
        </button>

        <button
          id="btn_subtab_reviews"
          onClick={() => setSubTab('reviews')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all min-w-[130px] lg:w-full select-none cursor-pointer ${
            subTab === 'reviews' 
              ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 text-emerald-400' 
              : 'border border-transparent text-white/50 hover:text-white/85 hover:bg-white/5'
          }`}
        >
          <Star className="h-4.5 w-4.5 shrink-0" />
          <span>Rate & Review</span>
        </button>
      </div>

      {/* Right Column - Active Screen Panel */}
      <div className="lg:col-span-9 bg-[#0d0d0d]/80 border border-white/10 rounded-2xl min-h-[480px] p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.015] via-transparent to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* 1. SUPPORT CHAT TAB */}
          {subTab === 'support' && (
            <motion.div
              key="support_chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col h-full gap-4"
            >
              {/* Box Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>AI Telemetry Support Core</span>
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1">
                    Ask questions, diagnose hashing speeds, or request fast payout clearing directly.
                  </p>
                </div>
                {!liveAgent && (
                  <button
                    id="btn_connect_live_agent"
                    onClick={connectLiveAgent}
                    disabled={isConnectingLive}
                    className="h-8.5 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold uppercase text-[9px] tracking-wider rounded-xl transition-all flex items-center gap-2 justify-center shrink-0 disabled:opacity-50 cursor-pointer self-start sm:self-center"
                  >
                    {isConnectingLive ? (
                      <>
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                        <span>Connecting Tunnel...</span>
                      </>
                    ) : (
                      <>
                        <Headphones className="h-3.5 w-3.5" />
                        <span>Connect to Live Agent</span>
                      </>
                    )}
                  </button>
                )}
                {liveAgent && (
                  <div className="flex items-center gap-2 bg-[#0d1c16] border border-emerald-500/20 py-1.5 px-3 rounded-xl">
                    <img src={liveAgent.avatar} className="w-5.5 h-5.5 rounded-full border border-emerald-400" alt="Sarah" />
                    <div>
                      <span className="text-[9px] tracking-wider text-emerald-400 font-extrabold block uppercase leading-none">{liveAgent.name}</span>
                      <span className="text-[7.5px] text-white/40 font-mono text-left block mt-1">{liveAgent.title}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 min-h-[260px] bg-black/40 border border-white/5 rounded-2xl p-4 overflow-y-auto space-y-3.5 max-h-[300px]">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {msg.role !== 'system' && (
                      <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center border text-[10px] ${
                        msg.role === 'user' 
                          ? 'bg-[#121c18] border-emerald-500/20 text-emerald-400' 
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}>
                        {msg.role === 'user' ? 'U' : 'AI'}
                      </div>
                    )}
                    
                    {msg.role === 'system' ? (
                      <div className="w-full text-center text-[9px] text-[#e0a050] bg-yellow-950/20 border border-yellow-950/40 py-1.5 px-3 rounded-lg leading-relaxed uppercase tracking-wider font-bold">
                        {msg.content}
                      </div>
                    ) : (
                      <div className={`p-3 rounded-2xl border leading-relaxed text-left space-y-1.5 text-[10.5px] font-sans ${
                        msg.role === 'user'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-white/90 rounded-tr-none'
                          : 'bg-white/[0.02] border-white/5 text-white/85 rounded-tl-none'
                      }`}>
                        <p>{msg.content}</p>
                        <span className="block text-[7.5px] text-white/20 text-right mt-1 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                    <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center border bg-white/5 border-white/10 text-white/60 text-[10px]">
                      A
                    </div>
                    <div className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <Loader className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                      <span className="text-white/40 text-[9px] uppercase font-mono tracking-wide">Syncing telemetry...</span>
                    </div>
                  </div>
                )}

                {isLiveAgentTyping && (
                  <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                    <img src={liveAgent?.avatar} className="h-7 w-7 rounded-full border border-emerald-400 shrink-0" alt="Sarah" />
                    <div className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-0" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-150" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-300" />
                      </div>
                      <span className="text-white/40 text-[9px] uppercase font-mono tracking-wide">sarah is typing...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Quick Queries (Live agent only) */}
              {liveAgent && (
                <div className="space-y-1.5">
                  <span className="text-[8px] text-white/35 uppercase font-bold tracking-wider">Quick Inquiry Prompts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => triggerLiveAgentAnswer('verify')}
                      className={`px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] text-white/70 uppercase font-semibold hover:border-emerald-500/20 hover:text-emerald-400 cursor-pointer transition-all ${
                        selectedIssuePrompt === 'verify' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : ''
                      }`}
                    >
                      Clear Pending Payouts
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLiveAgentAnswer('cooling')}
                      className={`px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] text-white/70 uppercase font-semibold hover:border-emerald-500/20 hover:text-emerald-400 cursor-pointer transition-all ${
                        selectedIssuePrompt === 'cooling' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : ''
                      }`}
                    >
                      Diagnose Overheating Rig
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLiveAgentAnswer('auto')}
                      className={`px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] text-white/70 uppercase font-semibold hover:border-emerald-500/20 hover:text-emerald-400 cursor-pointer transition-all ${
                        selectedIssuePrompt === 'auto' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : ''
                      }`}
                    >
                      Auto-Mining Resource Draw
                    </button>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  id="inp_support_chat_text"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={liveAgent ? "Type custom messages to Sarah..." : "Describe your hardware/withdrawal issue to AI..."}
                  className="flex-1 bg-black/40 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl h-11 px-4 text-xs font-medium outline-none text-white focus:ring-1 focus:ring-emerald-500/20 placeholder-white/30"
                />
                <button
                  id="btn_submit_support_chat"
                  type="submit"
                  className="w-11 h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </motion.div>
          )}

          {/* 2. PREFERENCES TAB */}
          {subTab === 'preferences' && (
            <motion.div
              key="preferences_screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-400" />
                  <span>Hardware & Services Preferences</span>
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Adjust network relay protocols, cooling profiles, and scale ratios inside this mining console.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Protocol Selector */}
                <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-3.5">
                  <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Selected Meshnet RPC Gateway</span>
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'sov', label: 'SoV Meshnet Core v41', desc: 'Secure cryptographically encrypted relay (Standard latency)' },
                      { id: 'nitro', label: 'RPC L2 Arbitrum FastMesh', desc: 'Optimized validation speed (12ms average connection response)' },
                      { id: 'p2p', label: 'Direct P2P Client Relay', desc: 'Shorter block times, minor security check margins' }
                    ].map((proto) => (
                      <label 
                        key={proto.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-[10px] cursor-pointer transition-colors ${
                          meshProtocol === proto.id 
                            ? 'bg-emerald-500/5 border-emerald-500/30 text-white' 
                            : 'bg-transparent border-white/5 text-white/40 hover:text-white/75 hover:bg-white/[0.01]'
                        }`}
                        onClick={() => handleMeshChange(proto.id as any)}
                      >
                        <input 
                          type="radio" 
                          name="mesh_proto"
                          checked={meshProtocol === proto.id}
                          onChange={() => {}} // Controlled by label click
                          className="mt-0.5 rounded-full border-white/20 text-emerald-500 focus:ring-emerald-500/20"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold">{proto.label}</span>
                          <span className="text-[8px] text-white/30 font-medium leading-normal mt-0.5">{proto.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hashing Frequency/Heat strategy */}
                <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-3.5">
                  <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                    <span>Rig Power Capping Profiles</span>
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'stable', label: 'Eco-Balanced Profile', desc: 'Minimal thermal load. Safeguards GPU assembly and preserves energy.' },
                      { id: 'turbo', label: 'Turbo Hydro-Intense Core', desc: 'Spikes speed rate by +15%. Margins elevated power draw levels.' },
                      { id: 'cryogenic', label: 'UNLOCKED NITRO BOOST', desc: 'Max hashrate! Warning: Temperature risk scales heavily. Safe cooling mandatory.' }
                    ].map((freq) => (
                      <label 
                        key={freq.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-[10px] cursor-pointer transition-colors ${
                          hashingFrequency === freq.id 
                            ? 'bg-rose-500/5 border-rose-500/30 text-white' 
                            : 'bg-transparent border-white/5 text-white/40 hover:text-white/75 hover:bg-white/[0.01]'
                        }`}
                        onClick={() => handleFreqChange(freq.id as any)}
                      >
                        <input 
                          type="radio" 
                          name="hash_freq"
                          checked={hashingFrequency === freq.id}
                          onChange={() => {}}
                          className="mt-0.5 rounded-full border-white/20 text-rose-500 focus:ring-rose-500/20"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-rose-350/90">{freq.label}</span>
                          <span className="text-[8px] text-white/30 font-medium leading-normal mt-0.5">{freq.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* General adjustments */}
                <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-3">
                  <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>General Terminal Preferences</span>
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white font-bold">Audio Notification Alerts</span>
                        <span className="text-[8px] text-white/30 mt-0.5">Toggle sound indicators on verified settlement dispatch</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSoundAlerts(!soundAlerts);
                          localStorage.setItem('pref_sound_alerts', (!soundAlerts).toString());
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          soundAlerts ? 'bg-emerald-500' : 'bg-white/10'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow transition duration-200 ease-in-out ${
                          soundAlerts ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white font-bold">Stealth Privacy Session</span>
                        <span className="text-[8px] text-white/30 mt-0.5">Mask your physical node IP inside the live blockchain block explorer</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPrivacyMode(!privacyMode);
                          localStorage.setItem('pref_privacy_mode', (!privacyMode).toString());
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          privacyMode ? 'bg-emerald-500' : 'bg-white/10'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow transition duration-200 ease-in-out ${
                          privacyMode ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Integration Toggles (Synthesized to layout) */}
                <div className="bg-[#050505] border border-white/5 rounded-xl p-4 space-y-3">
                  <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Terminal Scaling Options</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white font-bold">Compact Layout Engine</span>
                        <span className="text-[8px] text-white/30 mt-0.5">Decrease margins and outer spacing limits globally</span>
                      </div>
                      <button
                        type="button"
                        id="toggle_compact_pref"
                        onClick={handleCompactToggle}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          compactPref ? 'bg-emerald-500' : 'bg-white/10'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow transition duration-200 ease-in-out ${
                          compactPref ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white font-bold">Auto viewport adjustment</span>
                        <span className="text-[8px] text-white/30 mt-0.5">Adapt visual size according to frame constraint limits</span>
                      </div>
                      <button
                        type="button"
                        id="toggle_autoscale_pref"
                        onClick={handleAutoScaleToggle}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          autoScalePref ? 'bg-emerald-500' : 'bg-white/10'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow transition duration-200 ease-in-out ${
                          autoScalePref ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* 3. DOCUMENTATION MANUALS */}
          {subTab === 'docs' && (
            <motion.div
              key="docs_screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-400" />
                  <span>Interactive Operating Manuals</span>
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Access quick guides, resolve system error codes, and master hashing multiplier equations.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'doc_delayed',
                    title: '🚨 Troubleshooting Pending/Unverified Withdrawals',
                    content: "All withdrawal requests are sent into our peer-to-peer fast settlement nodes. If a transaction shows 'UNVERIFIED', this indicates an automated compliance freeze. This is to verify physical human operators. Resolve this instantly inside the 'Payout Console' tab: expand the pending card, click either the Google, Apple, or Phone authentication buttons, and grant validation. The status shifts immediately to 'Hashing' and completes ZKP confirmation in less than 30 seconds."
                  },
                  {
                    id: 'doc_overheat',
                    title: '🔥 Handling Temperature Throttled GPUs (Overheating)',
                    content: "When rig heat levels surpass 85°C, the mainframe initiates safety thermal throttling, decreasing your mining speed by 90% in order to protect virtual machinery from thermal degradation. To solve this: 1. Purchase upgraded fan systems (such as Cryogenic loops) in the 'Hardware Shop'. 2. Deploy a temporary 'Cryo Booster' from inventory for an absolute -40°C drop. 3. Configure the Power Cap Profile to Eco-Balanced inside Preferences to lower active voltage."
                  },
                  {
                    id: 'doc_rewards',
                    title: '⭐ Maximizing Block Multipliers & Daily Streaks',
                    content: "By checking in daily, you increment your central streak tracker (up to 7 days). Each successive claim increases your payout rate and grants booster boxes. These boosters (like Overclocks and Cryo loops) sleep in your dashboard drawer and can be fired up instantly to multiply hashrate outputs up to five-fold for rapid Cash generation."
                  },
                  {
                    id: 'doc_protocol',
                    title: '🛰️ Understanding Sovereign Block Explorer & DEX Core',
                    content: "Every valid block hashed gets written on-chain, which you can audit inside the 'Block Explorer' tab. When selling your coins in the 'DEX Trade' tab, timing is everything. Keep a strict check on news headers. Bullish events increase prices up to +600%, granting massive USD balance rewards upon selling."
                  },
                  {
                    id: 'doc_hotkeys',
                    title: '⌨️ Global Operator Hotkeys / Keyboard Shortcuts',
                    content: "To optimize manual workflows, Alpha LLC Mine features integrated global system hotkeys: 1. Press [M] or [m] at any time to switch focus to the 'Mine Reactor' tab; if the tab is already active, this simulates an automatic core manual hashing cycle click. 2. Press [T] or [t] to instantly route to 'DEX Trade & News' to catch live news updates or trade pairs. 3. Press [Esc] / [Escape] as an emergency security breaker to trigger an instant Cluster Hardware Shutdown (halts mining and resets rig core temperatures instantly), or close active authentication portals."
                  }
                ].map((doc) => {
                  const isOpen = expandedDoc === doc.id;
                  return (
                    <div 
                      key={doc.id}
                      className="bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-xl transition-all overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(isOpen ? null : doc.id)}
                        className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-[10.5px] uppercase tracking-wide text-white/80 hover:text-emerald-400 transition-colors"
                      >
                        <span>{doc.title}</span>
                        {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5 bg-black/20"
                          >
                            <p className="p-4 text-[10px] text-white/60 leading-relaxed font-sans font-medium text-left">
                              {doc.content}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 4. RATING AND REVIEWS */}
          {subTab === 'reviews' && (
            <motion.div
              key="reviews_screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-400 fill-emerald-400" />
                  <span>Ratings & reviews portal</span>
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Share your operator feedback, rate your mining terminal, and view active peer reports.
                </p>
              </div>

              {/* Feedback collection form */}
              <div className="bg-[#050505] border border-white/5 rounded-xl p-5 space-y-4">
                <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Post Your Official Review
                </h4>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  
                  {/* Interactive Stars */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest block font-bold">Select Star Rating:</span>
                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          id={`star_selector_${star}`}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                          onClick={() => setUserRating(star)}
                          className="p-1 focus:outline-none transition-transform active:scale-90 cursor-pointer"
                        >
                          <Star 
                            className={`h-7 w-7 transition-colors duration-150 ${
                              (ratingHover || userRating) >= star 
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]' 
                                : 'text-white/10 hover:text-white/30'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input comment */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest block font-bold">Your Operator Feedback:</span>
                    <textarea
                      id="txt_review_feedback"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Comment on hashrates, payout cycles, or support speed..."
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-amber-500/50 rounded-xl p-3.5 text-xs outline-none text-white focus:ring-1 focus:ring-amber-500/20 placeholder-white/30 font-sans leading-normal"
                    />
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between gap-4 pt-1.5">
                    <div className="flex items-center gap-1 text-[9px] text-white/30 font-semibold font-mono">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Review will be stored on physical peer logs</span>
                    </div>
                    <button
                      id="btn_submit_feedback_portal"
                      type="submit"
                      disabled={userRating === 0}
                      className="px-5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase text-[9.5px] tracking-widest rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                    >
                      Publish Review
                    </button>
                  </div>
                </form>

                {/* Submit Feedback Notification Banner */}
                <AnimatePresence>
                  {isSubmitSuccessful && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="bg-[#0c1a13] border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-center gap-2.5 mt-4 text-[9px] leading-relaxed uppercase tracking-wider"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Review published! Transferred securely to peer ledger arrays. Thank you for your feedback!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Feed ticker */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[9px] text-white/40 uppercase font-bold tracking-widest">
                  Live Peer Reviews Board ({reviewsList.length})
                </h4>

                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {reviewsList.map((rev) => (
                    <div 
                      key={rev.id}
                      className="bg-white/[0.015]/60 hover:bg-white/[0.02]/80 border border-white/5 rounded-xl p-4 flex gap-3.5 transition-all text-[10.5px]"
                    >
                      <img src={rev.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
                      <div className="flex-1 space-y-1 text-left">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-bold text-white uppercase">{rev.name}</span>
                          <span className="text-[7.5px] text-white/20 font-mono">
                            {new Date(rev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        
                        {/* Stars icon */}
                        <div className="flex gap-0.5 items-center">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star 
                              key={st} 
                              className={`h-3 w-3 ${
                                rev.rating >= st ? 'text-amber-400 fill-amber-400' : 'text-white/10'
                              }`} 
                            />
                          ))}
                        </div>

                        <p className="text-white/70 leading-normal font-sans py-1">
                          {rev.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      
    </div>
  );
};
