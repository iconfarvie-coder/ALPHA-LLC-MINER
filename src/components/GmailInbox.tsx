import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../firebase';
import { Mail, RefreshCw, Send, Trash2, Inbox } from 'lucide-react';
import { useMining } from '../context/MiningContext';

interface EmailMessage {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export const GmailInbox: React.FC = () => {
  const { user } = useMining();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  // Auto-fetch emails if logged in using google
  useEffect(() => {
    if (user?.provider === 'google') {
      fetchEmails();
    }
  }, [user]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo) return;
    
    // Explicit user confirmation for sending emails
    const confirmed = window.confirm(`Are you sure you want to send an email to ${composeTo}?`);
    if (!confirmed) return;

    setSending(true);
    try {
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
      setSending(false);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    // Explicit user confirmation for destructive actions
    const confirmed = window.confirm('Are you sure you want to permanently delete this email? This action cannot be undone.');
    if (!confirmed) return;

    try {
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
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center font-mono">
        <Mail className="h-12 w-12 text-white/20 mb-4" />
        <h3 className="text-white font-bold mb-2 uppercase">Google Sync Required</h3>
        <p className="text-white/40 text-xs">Please connect your Google account in the top bar to access the Cloud Email Station.</p>
      </div>
    );
  }

  return (
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
          <div className="space-y-3">
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
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 text-slate-950 disabled:text-slate-950/50 font-black tracking-widest text-xs uppercase transition-all rounded-xl mt-auto flex justify-center items-center gap-2"
          >
            {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Dispatching...' : 'Send Transmission'}
          </button>
        </form>
      </div>
    </div>
  );
};
