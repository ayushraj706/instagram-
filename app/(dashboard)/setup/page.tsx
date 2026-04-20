"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Globe, 
  Copy, 
  CheckCircle2, 
  Info, 
  ExternalLink, 
  Lock, 
  Key, 
  Activity,
  ArrowRight,
  Zap // <--- Bas yeh ek word add karna hai
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfessionalSetup() {
  const [loading, setLoading] = useState(false);
  const [configGenerated, setConfigGenerated] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    pageId: '',
    verifyToken: 'basekey_secure_' + Math.random().toString(36).substring(7)
  });

  // Live Listener for Meta Verification Status
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "status"), (doc) => {
      setStatus(doc.data());
    });
    return () => unsub();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Save data to Firestore
      await setDoc(doc(db, "config", "meta"), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      // Simulate API processing
      setTimeout(() => {
        setConfigGenerated(true);
        setLoading(false);
      }, 1500);
    } catch (e) {
      alert("Error: Firebase connection failed.");
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
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      
      {/* 1. DOCUMENTATION SECTION */}
      <section className="bg-blue-600/5 border border-blue-600/10 rounded-[32px] p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white">
            <Info size={24} />
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Meta Configuration Guide</h2>
              <p className="text-sm text-zinc-500">Instagram Automation shuru karne ke liye niche diye gaye steps follow karein:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2 text-blue-600">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">1</span>
                  Create Meta App
                </p>
                <p className="text-zinc-400">developers.facebook.com par jao aur "Business" type app banao. Instagram Graph API add karo.</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2 text-blue-600">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">2</span>
                  Get Credentials
                </p>
                <p className="text-zinc-400">Settings {'->'} Basic mein App ID aur Secret milega. Token Generator se Access Token lo.</p>
              </div>
            </div>
            <a href="https://developers.facebook.com/docs/messenger-platform/instagram" target="_blank" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
              Official Documentation <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* 2. INPUT FORM */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Lock className="text-zinc-400" size={20} /> App Credentials
            </h3>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 px-1">App ID</label>
                  <input type="text" placeholder="123456789..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={(e) => setFormData({...formData, appId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 px-1">App Secret</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={(e) => setFormData({...formData, appSecret: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 px-1">Page ID</label>
                <input type="text" placeholder="Instagram Connected Page ID" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 px-1">Access Token</label>
                <textarea placeholder="Paste your Long-lived Access Token here..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm h-32 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" onChange={(e) => setFormData({...formData, accessToken: e.target.value})} />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? <Activity className="animate-spin" /> : <><Zap size={18} /> Generate Infrastructure</>}
              </button>
            </div>
          </div>
        </div>

        {/* 3. GENERATED OUTPUT & LIVE STATUS */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {configGenerated && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Webhook Card */}
                <div className="bg-zinc-900 text-white rounded-[32px] p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Globe className="text-zinc-800" size={80} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Webhook URL</h4>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl">
                        <code className="text-[10px] flex-1 truncate">{webhookUrl}</code>
                        <button onClick={() => copyToClipboard(webhookUrl)} className="text-zinc-400 hover:text-white"><Copy size={16} /></button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Verify Token</h4>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl">
                        <code className="text-[10px] flex-1 truncate">{formData.verifyToken}</code>
                        <button onClick={() => copyToClipboard(formData.verifyToken)} className="text-zinc-400 hover:text-white"><Copy size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 text-center space-y-4">
                  <div className="relative inline-block">
                    <div className={`p-6 rounded-full ${status?.verified ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {status?.verified ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                          <CheckCircle2 size={48} />
                        </motion.div>
                      ) : (
                        <Activity size={48} className="animate-pulse" />
                      )}
                    </div>
                    {status?.verified && (
                       <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-900" 
                       />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{status?.verified ? "Meta Verified" : "Awaiting Meta..."}</h3>
                    <p className="text-xs text-zinc-500">{status?.verified ? "Aapka connection successfully active ho gaya hai." : "Meta Dashboard mein Webhook URL verify karein."}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!configGenerated && (
            <div className="h-full min-h-[300px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px] flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <ShieldCheck size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Credentials save karne ke baad yahan Webhook details aur Live Status dikhega.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
