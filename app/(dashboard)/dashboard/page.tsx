"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { 
  Zap, Power, BarChart3, MessageSquare, Download, 
  Cloud, ArrowUpRight, BrainCircuit, History, Maximize2,
  TrendingUp, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvancedDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('LIVE');

  // Real-time Listeners
  useEffect(() => {
    // 1. Status & Toggles
    const unsubStatus = onSnapshot(doc(db, "system", "status"), (d) => setStatus(d.data()));
    
    // 2. Live Activity Feed (Meta + AI Logs)
    const q = query(collection(db, "automation_logs"), orderBy("time", "desc"), limit(6));
    const unsubLogs = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubStatus(); unsubLogs(); };
  }, []);

  const toggleStatus = async (key: string) => {
    await setDoc(doc(db, "system", "status"), { [key]: !status?.[key] }, { merge: true });
  };

  // High-End Trading Data Mockup (Isse load par animation dikhegi)
  const tradingData = [
    { time: '10:00', val: 400 }, { time: '10:30', val: 300 },
    { time: '11:00', val: 600 }, { time: '11:30', val: 800 },
    { time: '12:00', val: 500 }, { time: '12:30', val: 900 },
    { time: '13:00', val: 1100 }, { time: '13:30', val: 1000 },
    { time: '14:00', val: 1400 }, { time: '14:30', val: 1200 },
    { time: '15:00', val: 1600 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-4">
      
      {/* 1. MASTER CONTROL TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[35px] flex items-center justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-4 rounded-2xl ${status?.enabled ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-zinc-800'}`}>
              <Power size={24} className="text-white" />
            </div>
            <div>
              <h4 className="text-white font-black text-sm tracking-tighter uppercase italic">Main Engine</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">{status?.enabled ? 'Operational' : 'System Paused'}</p>
            </div>
          </div>
          <button onClick={() => toggleStatus('enabled')} className={`w-16 h-8 rounded-full p-1 transition-all ${status?.enabled ? 'bg-blue-600' : 'bg-zinc-700'}`}>
            <motion.div animate={{ x: status?.enabled ? 32 : 0 }} className="bg-white w-6 h-6 rounded-full shadow-lg" />
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[35px] flex items-center justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-4 rounded-2xl ${status?.aiActive ? 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'bg-zinc-800'}`}>
              <BrainCircuit size={24} className="text-white" />
            </div>
            <div>
              <h4 className="text-white font-black text-sm tracking-tighter uppercase italic">Gemini AI Auto-Pilot</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">{status?.aiActive ? 'AI Replying' : 'Manual Mode'}</p>
            </div>
          </div>
          <button onClick={() => toggleStatus('aiActive')} className={`w-16 h-8 rounded-full p-1 transition-all ${status?.aiActive ? 'bg-purple-600' : 'bg-zinc-700'}`}>
            <motion.div animate={{ x: status?.aiActive ? 32 : 0 }} className="bg-white w-6 h-6 rounded-full shadow-lg" />
          </button>
        </div>
      </div>

      {/* 2. TRADING STYLE LIVE CHART */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[45px] shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-white font-black text-2xl italic tracking-tighter flex items-center gap-3">
              <Activity className="text-blue-500 animate-pulse" /> TRAFFIC MARKET
            </h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Streaming Meta Data...</span>
            </div>
          </div>
          <div className="flex bg-zinc-800/50 p-1.5 rounded-2xl border border-zinc-700">
            {['LIVE', '1D', '1M', 'MAX'].map(t => (
              <button key={t} onClick={() => setTimeframe(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${timeframe === t ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tradingData}>
              <defs>
                <linearGradient id="tradingGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                itemStyle={{ color: '#60a5fa', fontSize: '12px', fontWeight: '900' }}
                cursor={{ stroke: '#3f3f46', strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Area 
                type="monotone" 
                dataKey="val" 
                stroke="#3b82f6" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#tradingGlow)" 
                animationDuration={2500}
                animationBegin={0}
              />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Graph Bottom Info */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-800/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
           <div className="flex gap-6">
              <span className="flex items-center gap-2"><TrendingUp size={14} className="text-green-500"/> Peak: 1.6k msg</span>
              <span className="flex items-center gap-2"><Maximize2 size={14} /> Volatility: Low</span>
           </div>
           <span className="text-blue-500">Auto-scaling enabled</span>
        </div>
      </div>

      {/* 3. LOGS & REPORTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Logs Feed */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[40px] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black italic text-sm uppercase flex items-center gap-2">
              <History className="text-blue-600" /> Response Logs
            </h3>
            <span className="text-[10px] bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full font-black">LIVE</span>
          </div>
          <div className="space-y-3">
            {logs.length > 0 ? logs.map((log) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={log.id} 
                className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group transition-all hover:border-blue-400/30"
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-[8px] font-black w-fit px-2 py-0.5 rounded-full uppercase ${log.type === 'ai_reply' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {log.type.replace('_', ' ')}
                  </span>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                    {log.text || "Media File Processed"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-zinc-400 font-medium">{log.time?.toDate().toLocaleTimeString()}</p>
                </div>
              </motion.div>
            )) : (
              <p className="text-center py-10 text-xs text-zinc-400 italic">No activity detected yet...</p>
            )}
          </div>
        </div>

        {/* Export Card */}
        <div className="bg-blue-600 p-10 rounded-[45px] text-white flex flex-col justify-between shadow-2xl shadow-blue-600/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <Download size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <h4 className="text-3xl font-black italic tracking-tighter leading-none">SECURE<br/>ARCHIVES</h4>
            <p className="text-xs opacity-70 font-bold uppercase tracking-widest">End-to-End Encrypted PDF Report</p>
          </div>
          <button className="relative z-10 w-full mt-10 py-5 bg-white text-blue-600 font-black rounded-3xl flex items-center justify-center gap-3 hover:bg-zinc-100 transition-all active:scale-95 shadow-xl">
            <Download size={20} /> GENERATE REPORT (.PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
