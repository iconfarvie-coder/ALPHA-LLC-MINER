import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { 
  X, Lock, Smartphone, Chrome, ShieldCheck, Mail, LogOut, Code, User, 
  Sparkles, CheckCircle, RefreshCw, Smartphone as AppleIcon, ChevronRight
} from 'lucide-react';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, logout } = useMining();
  
  // Tab/State handlers
  const [phoneInput, setPhoneInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [animatingStep, setAnimatingStep] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handles google / apple flow
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setErrorText(null);
    setAnimatingStep(provider);
    
    if (provider === 'google') {
      try {
        const { googleSignIn } = await import('../firebase');
        const result = await googleSignIn();
        if (result) {
          login('google', result.user.email || result.user.uid, result.user.displayName || 'Google Member');
        }
      } catch (err: any) {
        console.error('Login failed', err);
        setErrorText('Failed to sync with Google: ' + err.message);
      } finally {
        setAnimatingStep(null);
        if (!errorText) onClose();
      }
    } else {
      // Apple is still simulated
      setTimeout(() => {
        const appleEmails = ['privaterelay_94a8@privaterelay.apple.com', 'sub_atomic_hashing@icloud.com', 'genesis_block@icloud.com'];
        const identifier = appleEmails[Math.floor(Math.random() * appleEmails.length)];
        const name = 'Apple Club Member';
        
        login(provider, identifier, name);
        setAnimatingStep(null);
        onClose();
      }, 1200);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    
    // Clean formatted check
    const cleanNum = phoneInput.replace(/[^0-9+]/g, '');
    if (cleanNum.length < 7) {
      setErrorText('Please enter a valid global mobile telephone number.');
      return;
    }

    setAnimatingStep('phone_send');
    setTimeout(() => {
      setOtpSent(true);
      setAnimatingStep(null);
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    
    if (otpCode.length !== 4) {
      setErrorText('Please input the simulated 4-digit code.');
      return;
    }

    setAnimatingStep('phone_verify');
    setTimeout(() => {
      login('phone', phoneInput);
      setAnimatingStep(null);
      setPhoneInput('');
      setOtpSent(false);
      setOtpCode('');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred overlay backdrop */}
      <div 
        className="absolute inset-0 bg-[#030303]/85 backdrop-blur-md cursor-pointer transition-opacity"
        onClick={onClose}
      />

      {/* Main glass-morphic dialog panel */}
      <div className="relative w-full max-w-md bg-[#0b0b0b]/95 border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Futuristic glowing node matrix in background */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-white/5 border border-white/5 text-white/40 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Dynamic header content */}
        {!user ? (
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 p-2.5 rounded-2xl border border-emerald-500/20 mb-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-white uppercase font-display">
              Cloud Identity Station
            </h2>
            <p className="text-xs text-white/50 max-w-xs mx-auto">
              Link your device instantly with a secure network node account to synchronize assets, upgrades, and trigger automatic instant settlement.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2 mb-6">
            <div className="relative inline-block mb-2">
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="w-16 h-16 rounded-full border-2 border-emerald-500 bg-[#0f0f0f] shadow-inner"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-[#0a0a0a] flex items-center justify-center">
                <CheckCircle className="h-2.5 w-2.5 text-slate-950 stroke-[3]" />
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-white uppercase font-display">
              Secured Connection Active
            </h2>
            <div className="inline-block bg-[#050505] border border-emerald-500/20 px-3 py-1 rounded-full">
              <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                {user.provider.toUpperCase()} Linked Engine
              </p>
            </div>
          </div>
        )}

        {/* Error Messaging Row */}
        {errorText && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-[11px] text-rose-300 font-medium">
            {errorText}
          </div>
        )}

        {/* Simulated Handshakes */}
        {animatingStep && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 font-mono">
            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
            <div className="text-center">
              <span className="text-xs text-white uppercase font-bold tracking-wider animate-pulse block">
                {animatingStep === 'google' && 'Initiating Google Safe-Handshake...'}
                {animatingStep === 'apple' && 'Verifying Apple Identity Token...'}
                {animatingStep === 'phone_send' && 'Dispatched SMS Passcode...'}
                {animatingStep === 'phone_verify' && 'Reconciling Passcode Ledger...'}
              </span>
              <span className="text-[10px] text-white/40 block mt-1">
                Synchronizing node cryptography signatures
              </span>
            </div>
          </div>
        )}

        {/* Normal Form Rendering if not loading state */}
        {!animatingStep && (
          <div className="space-y-4">
            {!user ? (
              <>
                {/* One-Tap Google Button */}
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="w-full h-12 rounded-2xl border border-white/10 hover:border-[#4285F4]/50 bg-white/5 hover:bg-[#4285F4]/10 transition-all font-sans font-bold text-xs text-white/95 flex items-center justify-center gap-3 cursor-pointer group hover:shadow-lg hover:shadow-[#4285F4]/5"
                >
                  <svg className="h-4.5 w-4.5 text-white shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Sync Instantly with Google</span>
                </button>

                {/* One-Tap Apple Button */}
                <button
                  onClick={() => handleSocialLogin('apple')}
                  className="w-full h-12 rounded-2xl bg-white text-slate-950 hover:bg-[#e4e4e4] transition-all font-sans font-black text-xs flex items-center justify-center gap-3 cursor-pointer group shadow-lg"
                >
                  <span className="text-base font-normal leading-none shrink-0 transition-transform group-hover:scale-105"></span>
                  <span>Sync Instantly with Apple ID</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1 font-mono text-[9px] text-white/30 uppercase tracking-widest font-bold">
                  <div className="h-px bg-white/5 flex-1" />
                  <span>OR WITH MOBILE TELEPHONY</span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>

                {/* Mobile Phone Verification Gate */}
                {!otpSent ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-3 font-mono">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-widest block mb-1.5 font-semibold">
                        Enter Mobile Telephone Number
                      </label>
                      <div className="relative flex items-center">
                        <Smartphone className="absolute left-4.5 h-4 w-4 text-white/30" />
                        <input
                          type="tel"
                          required
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="e.g., +1 (555) 019-2834"
                          className="w-full bg-[#050505] border border-white/10 hover:border-white/20 focus:border-emerald-500/40 outline-none h-12 pl-12 pr-4 text-xs text-white rounded-2xl tracking-wide select-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={phoneInput.length < 5}
                      className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/5 hover:shadow-emerald-500/10"
                    >
                      <span>Send Instant Verification Key</span>
                      <ChevronRight className="h-4 w-4 stroke-[3]" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3 font-mono animate-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5 text-[10px] text-emerald-400/80 leading-relaxed text-center">
                      <p className="font-bold uppercase tracking-wider text-emerald-400 mb-1">Passcode Dispatched!</p>
                      <span>We sent a simulated 4-digit token to your mobile receiver. To confirm instantly, click the prefilled block below.</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                          4-Digit Verification OTP Key
                        </label>
                        <button 
                          type="button" 
                          onClick={() => {
                            setOtpCode('8952');
                          }}
                          className="text-[9px] text-emerald-400 hover:text-emerald-300 hover:underline font-bold"
                        >
                          Auto-Fill ("8952")
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="8952"
                        className="w-full bg-[#050505] border border-white/10 focus:border-emerald-500/40 outline-none h-12 text-center text-lg tracking-[1.5em] text-emerald-400 font-extrabold rounded-2xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="h-11 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={otpCode.length !== 4}
                        className="h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        Sync Node
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              // Connected Account Dashboard
              <div className="space-y-4 font-mono">
                <div className="bg-[#050505]/60 border border-white/5 rounded-2xl p-4 space-y-3 text-[11px] text-[#a0a0a0]">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    <span>Identity Property</span>
                    <span>Verified Value</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-white/30" /> Name</span>
                    <span className="font-extrabold text-white">{user.name}</span>
                  </div>

                  {user.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-white/30" /> Email</span>
                      <span className="font-bold text-white/80 select-all">{user.email}</span>
                    </div>
                  )}

                  {user.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-white/30" /> Telephone</span>
                      <span className="font-bold text-white/80 select-all">{user.phone}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-white/40 flex items-center gap-1.5"><Code className="h-3.5 w-3.5 text-white/30" /> Node UID</span>
                    <span className="text-[10px] text-white/60 font-mono tracking-tight select-all">{user.uid}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/40 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Cloud Sync</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Secured & Encrypted</span>
                  </div>
                </div>

                <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4 text-[10px] text-emerald-300/85 leading-relaxed flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-emerald-300 uppercase tracking-wider text-[8px] mb-1">
                      Direct Clearing Authorized
                    </span>
                    <span>Your synchronized status bypasses automated AML/KYC hold thresholds. Any pending and future payout transactions are dispatched directly to settlement pools instantly with minimized server queue heights.</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full h-11 rounded-2xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-white/60 hover:text-rose-400 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Safely De-Authorize Sync</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
