"use client";
import React, { useState } from 'react';
import { Zap, ShieldCheck, CloudUpload, ArrowLeft, RefreshCw, PlayCircle, ExternalLink, Ghost } from 'lucide-react';

export default function InstaBrowser() {
  const [isSyncing, setIsSyncing] = useState(false);

  // GitHub Action Trigger Logic
  const triggerBulkSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/trigger-bot', {
        method: 'POST',
      });

      if (response.ok) {
        alert("🚀 Ghost Engine Started! Check GitHub Actions for live logs.");
      } else {
        alert("❌ Trigger Fail: GITHUB_PAT check karo Vercel mein.");
      }
    } catch (error) {
      alert("❌ Connection Error: " + error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col z-[9999] font-mono text-white">
      {/* Premium Header */}
      <div className="h-16 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Zap size={20} className={`${isSyncing ? 'animate-pulse text-yellow-400' : 'text-blue-500'}`} />
          </div>
          <div>
            <h2 className="text-[11px] font-black tracking-[3px] uppercase italic">BaseKey Ghost_V2</h2>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-yellow-500 animate-ping' : 'bg-green-500'}`} />
              <span className="text-[8px] font-bold text-zinc-500 uppercase">
                {isSyncing ? 'Mirroring_Active' : 'System_Linked'}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={triggerBulkSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all active:scale-95 ${
            isSyncing 
            ? 'bg-zinc-800 border-zinc-700 text-zinc-500' 
            : 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] font-black'
          }`}
        >
          {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <PlayCircle size={14} />}
          <span className="text-[10px] uppercase">Start_Mirror</span>
        </button>
      </div>

      {/* Main Content: Iframe hata kar Gateway banaya h */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="z-10 w-full max-w-sm text-center">
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 flex items-center justify-center shadow-2xl">
              <Ghost size={48} className="text-zinc-700" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border-4 border-[#09090b]">
              <ShieldCheck size={20} className="text-white" />
            </div>
          </div>

          <h3 className="text-lg font-black uppercase italic mb-3 tracking-tighter">Secure Session Gateway</h3>
          <p className="text-zinc-500 text-[11px] leading-relaxed mb-10 px-4 uppercase tracking-widest">
            Instagram blocks embedding. <br/> Open the portal to refresh your cookies before mirroring.
          </p>

          <div className="space-y-4">
            <a 
              href="https://www.instagram.com/accounts/login/" 
              target="_blank"
              className="flex items-center justify-center gap-3 w-full bg-zinc-900 border border-zinc-800 py-5 rounded-3xl text-[10px] font-bold hover:bg-zinc-800 transition-all group"
            >
              <ExternalLink size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
              OPEN INSTAGRAM PORTAL
            </a>
            
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[2px]">
              Active Targets: _anshu_2101, _cool_butterfly_ ...
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-16 bg-zinc-950 border-t border-zinc-900/50 flex items-center justify-around px-8">
        <button onClick={() => window.history.back()} className="p-3 text-zinc-600 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="h-[2px] w-8 bg-zinc-900" />
          <div className={`p-2 rounded-lg border ${isSyncing ? 'bg-green-500/10 border-green-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
            <CloudUpload size={18} className={isSyncing ? 'text-green-500' : 'text-zinc-700'} />
          </div>
          <div className="h-[2px] w-8 bg-zinc-900" />
        </div>

        <div className="p-3 text-blue-900">
           <ShieldCheck size={24} />
        </div>
      </div>
    </div>
  );
}
