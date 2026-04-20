"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { 
  collection, query, orderBy, limit, onSnapshot, 
  getCountFromServer, doc, setDoc, getDocs 
} from 'firebase/firestore';
import { 
  Zap, Power, BarChart3, MessageSquare, Download, 
  BrainCircuit, History, TrendingUp, Activity, 
  Smartphone, Hash, Globe, Maximize2
} from 'lucide-react';
import { 
  ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function TerminalDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [timeframe, setTimeframe] = useState('LIVE');
  const [chartData, setChartData] = useState<any[]>([]);

  // 1. DYNAMIC DATA ENGINE (No old data will be lost)
  useEffect(() => {
    // A. System Status Listener
    const unsubStatus = onSnapshot(doc(db, "system", "status"), (d) => {
      if (d.exists()) setStatus(d.data());
    });
    
    // B. Total Stats Count
    const getStats = async () => {
      const snapshot = await getCountFromServer(collection(db, "automation_logs"));
      setMsgCount(snapshot.data().count);
    };
    getStats();

    // C. Live Logs Feed
    const q = query(collection(db, "automation_logs"), orderBy("time", "desc"), limit(10));
    const unsubLogs = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // D. Trading Data Simulator (Timeframe shift logic)
    // Real app mein yahan Firestore se date-wise data aayega
    const generateData = () => {
      const points = timeframe === 'LIVE' ? 10 : timeframe === '7D' ? 20 : 30;
      const newData = Array.from({ length: points }).map((_, i) => ({
        time: `${10 + i}:00`,
        incoming: Math.floor(Math.random() * 1000) + 200,
        ai_replied: Math.floor(Math.random() * 800) + 100,
        vol: Math.floor(Math.random() * 1500)
      }));
      setChartData(newData);
    };
    generateData();

    return () => { unsubStatus(); unsubLogs(); };
  }, [timeframe]); // timeframe badalne par graph update hoga

  const toggleStatus = async (key: string) => {
    await setDoc(doc(db, "system", "status"), { [key]: !status?.[key] }, { merge: true });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 p-2 font-mono text-zinc-400 selection:bg-blue-500/20">
      
      {/* --- HUD: SYSTEM METRICS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'DB_RECORDS', val: msgCount, color: 'text-green-500' },
          { label: 'AI_STATUS', val: status?.aiActive ? 'ACTIVE' : 'IDLE', color: 'text-blue-500' },
          { label: 'ENGINE_LOAD', val: '2.4%', color: 'text-orange-500' },
          { label: 'Vercel_EDGE', val: 'ONLINE', color: 'text-purple-500' },
        ].map((item, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
            <span className="text-[8px] font-bold text-zinc-600 tracking-widest">{item.label}</span>
            <h2 className={`text-lg font-black tracking-tighter ${item.color}`}>{item.val}</h2>
          </div>
        ))}
      </div>

      {/* --- MASTER CONTROLS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-[25px] flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status?.enabled ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-zinc-900 text-zinc-600'}`}>
              <Power size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase italic">BaseKey Engine</h4>
              <p className="text-[9px] font-bold text-zinc-600">{status?.enabled ? 'POWER_ON' : 'SHUTDOWN'}</p>
            </div>
          </div>
          <button onClick={() => toggleStatus('enabled')} className={`w-14 h-7 rounded-full p-1 transition-all ${status?.enabled ? 'bg-blue-600' : 'bg-zinc-800'}`}>
            <motion.div animate={{ x: status?.enabled ? 28 : 0 }} className="bg-white w-5 h-5 rounded-full" />
          </button>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-[25px] flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status?.aiActive ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'bg-zinc-900 text-zinc-600'}`}>
              <BrainCircuit size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase italic">Gemini Pilot</h4>
              <p className="text-[9px] font-bold text-zinc-600">{status?.aiActive ? 'AUTO_REPLY' : 'MANUAL'}</p>
            </div>
          </div>
          <button onClick={() => toggleStatus('aiActive')} className={`w-14 h-7 rounded-full p-1 transition-all ${status?.aiActive ? 'bg-purple-600' : 'bg-zinc-800'}`}>
            <motion.div animate={{ x: status?.aiActive ? 28 : 0 }} className="bg-white w-5 h-5 rounded-full" />
          </button>
        </div>
      </div>

      {/* --- TRADING TERMINAL CHART --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-9 bg-black border border-zinc-900 rounded-[35px] p-6 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h3 className="font-black text-sm uppercase italic flex items-center gap-2">
               <div className="w-1 h-4 bg-blue-500" /> Market_Data_Stream
            </h3>
            
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {['LIVE', '1D', '7D', '1Y'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${timeframe === t ? 'bg-zinc-100 text-black' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 10" vertical={false} stroke="#18181b" />
                <XAxis dataKey="time" hide />
                <YAxis orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#3f3f46'}} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '10px' }} />
                
                {/* AI Replies Area */}
                <Area type="monotone" name="AI_REP" dataKey="ai_replied" stroke="#8b5cf6" fill="url(#glow)" strokeWidth={2} />
                
                {/* Incoming Line */}
                <Area type="monotone" name="IN_MSG" dataKey="incoming" stroke="#3b82f6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                
                {/* Trading Volume (Lalu-Hariyali) */}
                <Bar dataKey="vol" name="VOLUME" barSize={12} radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.incoming > entry.ai_replied ? '#22c55e' : '#ef4444'} fillOpacity={0.3} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 flex justify-between items-center text-[9px] font-black text-zinc-700 uppercase tracking-widest border-t border-zinc-900 pt-4">
             <div className="flex gap-4">
                <span className="flex items-center gap-1"><Activity size={12} className="text-green-500" /> Sync_Secure</span>
                <span>Buffer_Size: 512KB</span>
             </div>
             <span className="text-zinc-500 italic">Scroll to zoom chart</span>
          </div>
        </div>

        {/* --- LIVE SYSTEM LOGS --- */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-950 border border-zinc-900 rounded-[35px] p-6 h-full flex flex-col shadow-2xl">
            <h3 className="text-[10px] font-black uppercase mb-6 italic text-zinc-500">Terminal_Logs</h3>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[480px] scrollbar-hide">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-black border border-zinc-900 rounded-xl group hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full ${log.type === 'ai_reply' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
                      {log.type === 'ai_reply' ? 'AI_EXEC' : 'META_IN'}
                    </span>
                    <span className="text-[7px] text-zinc-700">{log.time?.toDate().toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate lowercase">{log.text || "media_packet_received"}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-4 bg-zinc-900 border border-zinc-800 text-[10px] font-black rounded-2xl hover:bg-white hover:text-black transition-all">
               GENERATE_AUDIT_PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
