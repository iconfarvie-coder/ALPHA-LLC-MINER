import React, { useState, useEffect } from 'react';
import { getAccessToken, googleSignIn } from '../firebase';
import { Mail, RefreshCw, Send, Trash2, Inbox } from 'lucide-react';
import { useMining } from '../context/MiningContext';

interface EmailMessage {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

const SANDBOX_MOCK_EMAILS: EmailMessage[] = [
  {
    id: 'mock_mail_1',
    subject: '⚠️ Core Thermal Hazard: Overlock System BTC-04 Critical',
    from: 'Sovereign Telemetry Daemon <alerts@hashsovereign.net>',
    snippet: 'Warning: Core thermal threshold breached on active Bitcoin mining node. Current temperature: 94.2°C. Dynamic Cooling System has responded but further mechanical core ventilation upgrades are highly advised.',
    date: new Date(Date.now() - 360000).toLocaleString()
  },
  {
    id: 'mock_mail_2',
    subject: '🎉 Settlement Receipt: 1.2540 ETH Dispatch Confirmed',
    from: 'Consensus Ledger Clearance <accounting@hashsovereign.net>',
    snippet: 'Blockchain confirmation succeeded. Payout batch #TX-78321 clearing 1.2540 ETH has been consolidated and dispatched to your authorized wallet address or bank wire network. Gas fees: 0.0015 ETH.',
    date: new Date(Date.now() - 7200000).toLocaleString()
  },
  {
    id: 'mock_mail_3',
    subject: '⚡ Infrastructure Update: Liquid Cryo v4 Node Active',
    from: 'Core Operations Chief <eng@hashsovereign.net>',
    snippet: 'The Cryo-Freeze Capsule cluster has finished integration. Local thermal dissipation quotient increased by 45%. You may now trigger overclock serums with 30% lower thermal spike levels.',
    date: new Date(Date.now() - 86400000).toLocaleString()
  },
  {
    id: 'mock_mail_4',
    subject: '📈 High-Frequency Market Signal: SOL Bull Run Initialized',
    from: 'AI Market Predictor Core <oracle@hashsovereign.net>',
    snippet: 'Analysis of cross-chain liquidity indexes indicates a potential 12.4% bullish breakout vector for SOL. Recommended active targeting: Redirect mining node hashing capacities to SOL.',
    date: new Date(Date.now() - 172800000).toLocaleString()
  },
  {
    id: 'mock_mail_5',
    subject: '🎁 Reward Chest Delivered: Overclock Serum Inventory Refreshed',
    from: 'Sovereign Reward Station <rewards@hashsovereign.net>',
    snippet: 'Congratulations! Your daily hashing quota has registered in the system. 1x Overclock Serum has been auto-injected into your local booster inventory list. Power booster duration: 60 seconds.',
    date: new Date(Date.now() - 345600000).toLocaleString()
  }
];

export const GmailInbox: React.FC = () => {
  const { user, login } = useMining();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Auto-fetch emails if logged in using google
  useEffect(() => {
    if (user?.provider === 'google') {
      fetchEmails();
    }
  }, [user]);

  const fetchEmails = async () => {
    setLoading(true);
    setIsSandboxMode(false);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`Gmail API response status: ${res.status}`);
      }
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        const fullMessages: EmailMessage[] = await Promise.all(
          data.messages.map(async (msg: any) => {
            const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const msgData = await msgRes.json();
            const headers = msgData.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
            const dateStr = headers.find((h: any) => h.name === 'Date')?.value || '';
            return {
              id: msg.id,
              snippet: msgData.snippet || '',
              subject,
              from,
              date: dateStr ? new Date(dateStr).toLocaleString() : ''
            };
          })
        );
        setEmails(fullMessages);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.warn('Gmail active token was missing or network blocked, invoking high-fidelity sandbox session.', err);
      setIsSandboxMode(true);
      
      const savedMock = localStorage.getItem('hash_sovereign_mock_emails');
      if (savedMock) {
        try {
          setEmails(JSON.parse(savedMock));
        } catch (e) {
          setEmails(SANDBOX_MOCK_EMAILS);
        }
      } else {
        setEmails(SANDBOX_MOCK_EMAILS);
        localStorage.setItem('hash_sovereign_mock_emails', JSON.stringify(SANDBOX_MOCK_EMAILS));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectRealGmail = async () => {
    try {
      setSyncing(true);
      const result = await googleSignIn();
      if (result) {
        login('google', result.user.email || result.user.uid, result.user.displayName || 'Google Member', result.user.uid, true);
        setIsSandboxMode(false);
        setTimeout(() => fetchEmails(), 500);
      }
    } catch (err) {
      console.error('Failed to link authentic Google Account:', err);
      alert('Authentication popups might be blocked or blocked by the developer frame sandbox. Utilizing high-fidelity sandbox simulation interface for client preview.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo) return;
    
    // Explicit user confirmation for sending emails
    const confirmed = window.confirm(`Are you sure you want to send this email dispatch to ${composeTo}?`);
    if (!confirmed) return;

    setSending(true);
    try {
      if (isSandboxMode) {
        const newMockMsg: EmailMessage = {
          id: `mock_sent_${Date.now()}`,
          subject: composeSubject || 'No Subject',
          from: `Primary Operator <${user?.email || 'operator@hashsovereign.net'}>`,
          snippet: composeBody,
          date: new Date().toLocaleString()
        };
        const updated = [newMockMsg, ...emails];
        setEmails(updated);
        localStorage.setItem('hash_sovereign_mock_emails', JSON.stringify(updated));
        
        setTimeout(() => {
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          setSending(false);
          alert('Transmission complete. Message buffered into dynamic offline sandbox ledger.');
        }, 850);
        return;
      }

      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      const messageContent = [
        `To: ${composeTo}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${composeSubject}`,
        '',
        composeBody,
      ].join('\n');

      const encodedMessage = btoa(unescape(encodeURIComponent(messageContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMessage })
      });

      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      alert('Email sent successfully!');
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email.');
    } finally {
      if (!isSandboxMode) {
        setSending(false);
      }
    }
  };

  const handleDeleteEmail = async (id: string) => {
    // Explicit user confirmation for destructive actions
    const confirmed = window.confirm('Are you sure you want to permanently delete this email? This action cannot be undone.');
    if (!confirmed) return;

    try {
      if (isSandboxMode) {
        const updated = emails.filter(e => e.id !== id);
        setEmails(updated);
        localStorage.setItem('hash_sovereign_mock_emails', JSON.stringify(updated));
        return;
      }

      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setEmails(emails.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting email:', err);
      alert('Failed to delete email.');
    }
  };

  if (user?.provider !== 'google') {
    return (
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center font-mono max-w-xl mx-auto">
        <Mail className="h-12 w-12 text-white/20 mb-4 animate-pulse" />
        <h3 className="text-white font-bold mb-2 uppercase">Google Sync Required</h3>
        <p className="text-white/40 text-xs mb-6 leading-relaxed">
          Please connect your Google account to access your central Cloud Mail Station and sync inbox alerts.
        </p>
        <button
          onClick={handleConnectRealGmail}
          disabled={syncing}
          className="flex items-center gap-2 px-5 h-11 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 text-slate-950 font-black tracking-widest text-[10px] uppercase transition-all rounded-xl cursor-pointer"
        >
          {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Inbox className="h-4 w-4" />}
          {syncing ? 'Linking Provider...' : 'Sync with Google'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sandbox Status Alert */}
      {isSandboxMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
          <div className="space-y-1 font-mono">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 leading-none">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              Local Sandbox Session Active
            </span>
            <p className="text-[10px] text-white/50 leading-relaxed font-mono">
              Live Google access token not found. Running high-fidelity offline mail sandbox to preserve simulator fidelity in preview frames. Link a live account below.
            </p>
          </div>
          <button
            onClick={handleConnectRealGmail}
            disabled={syncing}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 text-slate-950 font-black tracking-wider rounded-xl uppercase transition-all whitespace-nowrap text-[10px] shrink-0 font-mono"
          >
            {syncing ? 'Linking...' : 'Connect Live Account'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbox Panel */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 font-mono relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <h2 className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Inbox className="h-4 w-4" /> Priority Inbox
            </h2>
            <button 
              onClick={fetchEmails}
              disabled={loading}
              className="p-2 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center rounded-xl transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : 'text-white/50'}`} />
            </button>
          </div>

          {loading && emails.length === 0 ? (
            <div className="py-8 text-center text-white/40 animate-pulse text-xs uppercase">Fetching Network Missives...</div>
          ) : emails.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-xs uppercase">Inbox Empty</div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {emails.map(email => (
                <div key={email.id} className="bg-[#050505] p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group relative pr-10">
                  <div className="flex items-start justify-between">
                    <div className="truncate pr-4 text-xs">
                      <div className="text-white font-bold truncate">{email.subject}</div>
                      <div className="text-white/40 truncate mt-0.5">{email.from}</div>
                    </div>
                    <div className="text-[#a0a0a0] text-[9px] shrink-0">{email.date}</div>
                  </div>
                  <div className="text-[#a0a0a0] text-[10px] mt-2 line-clamp-2 leading-relaxed bg-[#0a0a0a] p-2 rounded-lg">{email.snippet}</div>
                  
                  {/* Delete button appears on hover */}
                  <button 
                    onClick={() => handleDeleteEmail(email.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Permanent Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compose Terminal */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 font-mono flex flex-col">
          <h2 className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
            <Send className="h-4 w-4" /> Quick Dispatch
          </h2>
          
          <form onSubmit={handleSendEmail} className="flex-1 flex flex-col gap-3">
            <input 
              type="email" 
              required
              placeholder="Recipient Address..."
              value={composeTo}
              onChange={e => setComposeTo(e.target.value)}
              className="bg-[#050505] border border-white/10 hover:border-white/20 focus:border-emerald-500/40 outline-none text-xs text-white px-4 h-10 rounded-xl transition-colors"
            />
            <input 
              type="text" 
              placeholder="Subject Line..."
              value={composeSubject}
              onChange={e => setComposeSubject(e.target.value)}
              className="bg-[#050505] border border-white/10 hover:border-white/20 focus:border-emerald-500/40 outline-none text-xs text-white px-4 h-10 rounded-xl transition-colors"
            />
            <textarea 
              required
              placeholder="Transmission contents..."
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              className="bg-[#050505] border border-white/10 hover:border-white/20 focus:border-emerald-500/40 outline-none text-xs text-white p-4 flex-1 min-h-[120px] rounded-xl transition-colors resize-none mb-2"
            />
            <button 
              type="submit" 
              disabled={sending || !composeTo}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 text-slate-950 disabled:text-slate-950/50 font-black tracking-widest text-xs uppercase transition-all rounded-xl mt-auto flex justify-center items-center gap-2 cursor-pointer"
            >
              {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Dispatching...' : 'Send Transmission'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
