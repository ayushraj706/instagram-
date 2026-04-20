"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { 
  Zap, 
  Power, 
  BarChart3, 
  MessageSquare, 
  Download, 
  Cloud, 
  Users, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [status, setStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('7d');

  // Live Status & Stats Listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "status"), (d) => {
      setStatus(d.data());
    });
    return () => unsub();
  }, []);

  const toggleAutomation = async () => {
    await setDoc(doc(db, "system", "status"), {
      enabled: !status?.enabled
    }, { merge: true });
  };

  // Mock Data for Graph (Real time analytics ke liye baad mein update karenge)
  const data = [
    { name: 'Mon', msg: 400 },
    { name: 'Tue', msg: 700 },
    { name: 'Wed', msg: 500 },
    { name: 'Thu', msg: 900 },
    { name: 'Fri', msg: 600 },
    { name: 'Sat', msg: 800 },
    { name: 'Sun', msg: 1100 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Header & Master Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="flex items-center gap-5">
          <div className={`p-5 rounded-3xl transition-colors ${status?.enabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
            <Zap size={32} className={status?.enabled ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">BaseKey Console</h1>
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status?.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
              System {status?.enabled ? 'Operational' : 'Paused'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-[30px] border border-zinc-100 dark:border-zinc-800">
           <span className="text-[10px] font-black uppercase ml-4 text-zinc-400">Automation Mode</span>
           <button 
            onClick={toggleAutomation}
            className={`w-20 h-10 rounded-full p-1 transition-all duration-500 ease-in-out ${status?.enabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
          >
            <motion.div 
              animate={{ x: status?.enabled ? 40 : 0 }}
              className="bg-white w-8 h-8 rounded-full shadow-md flex items-center justify-center text-blue-600"
            >
              <Power size={14} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Messages', val: '12.4k', icon: <MessageSquare size={20}/>, color: 'text-blue-500' },
          { label: 'Active Users', val: '842', icon: <Users size={20}/>, color: 'text-purple-500' },
          { label: 'Cloud Sync', val: '99.9%', icon: <Cloud size={20}/>, color: 'text-green-500' },
          { label: 'AI Efficiency', val: '94%', icon: <TrendingUp size={20}/>, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[35px] border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 ${stat.color}`}>{stat.icon}</div>
              <ArrowUpRight size={16} className="text-zinc-300 group-hover:text-zinc-600" />
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">{stat.label}</p>
            <h4 className="text-2xl font-black tracking-tight">{stat.val}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Analytics Graph */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <BarChart3 size={20} className="text-blue-600"/> Meta Traffic Analytics
            </h3>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              {['24h', '7d', '30d'].map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === t ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-400'}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#A1A1AA'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f4f4f5'}} 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="msg" radius={[10, 10, 10, 10]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#2563eb' : '#e4e4e7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Reports */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h4 className="text-xl font-bold italic tracking-tighter">EXPORT ARCHIVES</h4>
              <p className="text-[10px] text-zinc-400 font-medium leading-relaxed mt-2 uppercase">
                Download your chat history and media logs in Instagram-style PDF format.
              </p>
              <button className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-600/40">
                <Download size={18} /> Generate PDF Report
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <Cloud size={180} />
            </div>
          </div>

          <div className="p-8 bg-blue-600/5 border border-blue-600/10 rounded-[40px] space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Info size={16} />
              <span className="text-xs font-bold uppercase">System Update</span>
            </div>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
              Vercel Edge Functions are running at 100% capacity. Your Gemini AI is ready to handle manual chat requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}
