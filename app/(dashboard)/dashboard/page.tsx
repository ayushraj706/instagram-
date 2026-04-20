"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { 
  collection, query, orderBy, limit, onSnapshot, 
  getCountFromServer, doc, setDoc 
} from 'firebase/firestore';
import { 
  Zap, Power, BarChart3, MessageSquare, Download, 
  BrainCircuit, History, TrendingUp, Activity, 
  Smartphone, Hash, Globe, MousePointer2
} from 'lucide-react';
import { 
  ComposedChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend,
  Cell // <--- Bas ye ek word missing tha
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function TerminalDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [timeframe, setTimeframe] = useState('LIVE');

  // 1. REAL-TIME DATA ENGINE
  useEffect(() => {
    // System Status (Power & AI Switch)
    const unsubStatus = onSnapshot(doc(db, "system", "status"), (d) => setStatus(d.data()));
    
    // Total Msg Count
    const getCounts = async () => {
      const coll = collection(db, "automation_logs");
      const snapshot = await getCountFromServer(coll);
      setMsgCount(snapshot.data().count);
    };
    getCounts();

    // Live Activity Logs
    const q = query(collection(db, "automation_logs"), orderBy("time", "desc"), limit(8));
    const unsubLogs = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubStatus(); unsubLogs(); };
  }, []);

  const toggleStatus = async (key: string) => {
    await setDoc(doc(db, "system", "status"), { [key]: !status?.[key] }, { merge: true });
  };

  // 2. TRADING DATA (Incoming vs Outgoing)
  const tradingData = [
    { time: '12:00', incoming: 400, ai_replied: 380, vol: 700 },
    { time: '13:00', incoming: 600, ai_replied: 550, vol: 650 },
    { time: '14:00', incoming: 900, ai_replied: 890, vol: 950 },
    { time: '15:00', incoming: 700, ai_replied: 680, vol: 800 },
    { time: '16:00', incoming: 1200, ai_replied: 1150, vol: 1300 },
    { time: '17:00', incoming: 1500, ai_replied: 1480, vol: 1600 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 p-2 font-mono selection:bg-blue-500/30 text-zinc-300">
      
      {/* --- TOP HUD (SYSTEM STATS) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'META_INBOUND', val: msgCount, color: 'text-green-500' },
          { label: 'AI_LATENCY', val: '142ms', color: 'text-blue-500' },
          { label: 'SRV_UPTIME', val: '99.98%', color: 'text-orange-500' },
          { label: 'DATA_SYNC', val: 'STABLE', color: 'text-purple-500' },
        ].map((item, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex flex-col group hover:border-zinc-700 transition-all">
            <span className="text-[8px] font-black text-zinc-600 mb-1 tracking-widest">{item.label}</span>
            <h2 className={`text-lg font-black tracking-tighter ${item.color}`}>{item.val}</h2>
          </div>
        ))}
      </div>

      {/* --- MASTER TOGGLES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-[25px] flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status?.enabled ? 'bg-blue-600 text-white animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-zinc-900 text-zinc-600'}`}>
              <Power size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest">Master Engine</h4>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">{status?.enabled ? 'Live & Routing' : 'Offline'}</p>
            </div>
          </div>
          <button onClick={() => toggleStatus('enabled')} className={`w-14 h-7 rounded-full p-1 transition-all ${status?.enabled ? 'bg-blue-600' : 'bg-zinc-800'}`}>
            <motion.div animate={{ x: status?.enabled ? 28 : 0 }} className="bg-white w-5 h-5 rounded-full shadow-lg" />
          </button>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-[25px] flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status?.aiActive ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-zinc-900 text-zinc-600'}`}>
              <BrainCircuit size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest">Gemini AI Pilot</h4>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">{status?.aiActive ? 'Autonomous' : 'Manual Control'}</p>
            </div>
          </div>
          <button onClick={() => toggleStatus('aiActive')} className={`w-14 h-7 rounded-full p-1 transition-all ${status?.aiActive ? 'bg-purple-600' : 'bg-zinc-800'}`}>
            <motion.div animate={{ x: status?.aiActive ? 28 : 0 }} className="bg-white w-5 h-5 rounded-full shadow-lg" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* --- ADVANCED TRADING CHART --- */}
        <div className="lg:col-span-9 bg-black border border-zinc-900 rounded-[35px] p-6 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 w-1 h-6 rounded-full" />
              <h3 className="font-black text-sm uppercase tracking-tighter italic">Traffic_Terminal_v2</h3>
            </div>
            
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
              {['LIVE', '1D', '7D', '1Y'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${timeframe === t ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={tradingData}>
                <defs>
                  <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#52525b'}} />
                <YAxis orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#52525b'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                
                {/* Outgoing/Replied (Area) */}
                <Area type="monotone" name="AI Replied" dataKey="ai_replied" stroke="#8b5cf6" fill="url(#blueGlow)" strokeWidth={3} />
                
                {/* Incoming (Line) */}
                <Area type="monotone" name="Incoming Msg" dataKey="incoming" stroke="#3b82f6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                
                {/* Trading Volume Bars (The Lalu-Hariyali logic) */}
                <Bar dataKey="vol" name="Activity Vol" radius={[4, 4, 0, 0]} barSize={15}>
                  {tradingData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.incoming > 800 ? '#22c55e' : '#ef4444'} 
                      fillOpacity={0.2}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-900 pt-4 text-[9px] font-black text-zinc-600">
             <div className="flex gap-4">
                <span className="flex items-center gap-1"><Globe size={10} /> REGION: ASIA_NORTH</span>
                <span className="flex items-center gap-1 text-green-500 italic">● DATA_STREAM_STABLE</span>
             </div>
             <button className="flex items-center gap-1 hover:text-white transition-colors">
                <Maximize2 size={10} /> FULLSCREEN_TERMINAL
             </button>
          </div>
        </div>

        {/* --- LIVE ORDER LOGS --- */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-950 border border-zinc-900 rounded-[35px] p-6 h-full shadow-2xl flex flex-col">
            <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 italic">
               <History size={14} className="text-blue-500" /> System_Logs
            </h3>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[460px] scrollbar-hide">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-black border border-zinc-900 rounded-xl group hover:border-blue-500/50 transition-all">
                  <div className="flex justify-between mb-1">
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full ${log.type === 'ai_reply' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {log.type === 'ai_reply' ? 'AI_EXEC' : 'META_IN'}
                    </span>
                    <span className="text-[7px] text-zinc-700">{log.time?.toDate().toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate leading-tight">{log.text || "MEDIA_ATTACHMENT"}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-4 bg-zinc-900 border border-zinc-800 text-white text-[9px] font-black rounded-2xl uppercase hover:bg-white hover:text-black transition-all">
               <Download size={14} className="inline mr-2" /> Export_CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
      }
