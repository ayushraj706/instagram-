"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, Globe, Copy, Info, ExternalLink, 
  Lock, Key, Activity, ArrowRight, Zap, RefreshCcw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Official Meta Blue Tick SVG Component
const MetaBlueTick = () => (
  <motion.svg 
    viewBox="0 0 24 24" 
    className="w-16 h-16"
    initial={{ scale: 0, rotate: -20 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
  >
    <path 
      fill="#0095f6" 
      d="M12 1L9.654 2.162l-2.617-.468L5.78 4.053l-2.585.534-.418 2.626L1.162 9.654 2.324 12l-1.162 2.346 1.615 2.441.418 2.626 2.585.534 1.257 2.359 2.617-.468L12 23l2.346-1.162 2.617.468 1.257-2.359 2.585-.534.418-2.626 1.615-2.441-1.162-2.346 1.162-2.346-1.615-2.441-.418-2.626-2.585-.534-1.257-2.359-2.617.468L12 1z"
    />
    <motion.path 
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      fill="none" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M8 12l3 3 5-5"
    />
  </motion.svg>
);

export default function AdvancedSetup() {
  const [loading, setLoading] = useState(false);
  const [configGenerated, setConfigGenerated] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [formData, setFormData] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    pageId: '',
    verifyToken: ''
  });

  // 1. AUTO-FILL LOGIC: Load data on mount
  useEffect(() => {
    const fetchConfig = async () => {
      const docSnap = await getDoc(doc(db, "config", "meta"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData(data as any);
        setConfigGenerated(true);
      }
    };
    fetchConfig();

    // Audio setup
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

    // 2. LIVE STATUS & SOUND LOGIC
    const unsub = onSnapshot(doc(db, "system", "status"), (snapshot) => {
      const newStatus = snapshot.data();
      // Agar verified false se true hua, toh sound bajao
      if (newStatus?.verified && !status?.verified) {
        audioRef.current?.play().catch(e => console.log("Audio play blocked by browser"));
      }
      setStatus(newStatus);
    });
    return () => unsub();
  }, [status]);

  const handleGenerate = async () => {
    setLoading(true);
    const vToken = formData.verifyToken || 'basekey_' + Math.random().toString(36).substring(7);
    const finalData = { ...formData, verifyToken: vToken };
    
    try {
      await setDoc(doc(db, "config", "meta"), {
        ...finalData,
        updatedAt: serverTimestamp()
      });
      setFormData(finalData);
      setConfigGenerated(true);
      setLoading(false);
    } catch (e) {
      alert("Firebase Error!");
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : '';

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8 p-4">
      
      {/* Meta Documentation Guide */}
      <section className="bg-blue-600/5 border border-blue-600/10 rounded-[35px] p-8 shadow-inner">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <Info size={24} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Setup Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-500">
              <p>1. Meta App Settings में जाकर <strong>Instagram Graph API</strong> Setup करें।</p>
              <p>2. नीचे दिए गए Webhook URL को Meta Callback URL में पेस्ट करें।</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT FORM (Auto-filled) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="text-blue-500" size={20} /> Credentials
              </h3>
              {configGenerated && <span className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-bold">SAVED IN CLOUD</span>}
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 ml-2">APP ID</label>
                  <input value={formData.appId} onChange={(e)=>setFormData({...formData, appId: e.target.value})} type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 ml-2">APP SECRET</label>
                  <input value={formData.appSecret} onChange={(e)=>setFormData({...formData, appSecret: e.target.value})} type="password"  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 ml-2">PAGE ID</label>
                <input value={formData.pageId} onChange={(e)=>setFormData({...formData, pageId: e.target.value})} type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 ml-2">ACCESS TOKEN</label>
                <textarea value={formData.accessToken} onChange={(e)=>setFormData({...formData, accessToken: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm h-32 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/30"
              >
                {loading ? <RefreshCcw className="animate-spin" /> : <><Zap size={20} /> Update & Sync Data</>}
              </button>
            </div>
          </div>
        </div>

        {/* WEBHOOK & ANIMATED BLUE TICK */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence>
            {configGenerated && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                
                {/* Generated URLs */}
                <div className="bg-zinc-900 text-white rounded-[40px] p-8 border border-zinc-800 shadow-2xl">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Callback URL</p>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl">
                        <code className="text-[10px] flex-1 truncate">{webhookUrl}</code>
                        <button onClick={() => copyToClipboard(webhookUrl)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          {copied ? <ShieldCheck size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Verify Token</p>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl">
                        <code className="text-[10px] flex-1 truncate">{formData.verifyToken}</code>
                        <button onClick={() => copyToClipboard(formData.verifyToken)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Copy size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VERIFICATION CARD WITH BLUE TICK */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-10 text-center shadow-xl relative overflow-hidden">
                   {status?.verified && (
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 0.05 }}
                        className="absolute inset-0 bg-blue-500 pointer-events-none" 
                     />
                   )}
                   
                   <div className="flex flex-col items-center gap-6 relative z-10">
                      {status?.verified ? (
                        <MetaBlueTick />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <Activity className="animate-pulse" size={32} />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black italic tracking-tighter">
                          {status?.verified ? "AUTHENTICATED" : "AWAITING META"}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium max-w-[200px] mx-auto">
                          {status?.verified 
                            ? "Aapka system Meta ke official server se connect ho gaya hai." 
                            : "Meta Portal mein webhook details dalkar verify karein."}
                        </p>
                      </div>
                   </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
