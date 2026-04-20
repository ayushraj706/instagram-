"use client";
import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Yeh "ADMIN_PASS" hum Vercel ke Environment Variables mein set karenge
    const masterPass = process.env.NEXT_PUBLIC_ADMIN_PASS || "1234"; 

    if (password === masterPass) {
      window.location.href = '/dashboard';
    } else {
      setError('Invalid Access Key. Access Denied.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#09090b] transition-all p-4">
      <div className="w-full max-w-[400px] space-y-6">
        
        {/* Branding Area */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/10 rounded-2xl mb-2">
            <ShieldCheck className="text-blue-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            BaseKey Console
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Secure Infrastructure for Instagram Automation
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Admin Access Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              Authorize <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* System Status Footer */}
        <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-zinc-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-green-500" /> System Online
          </span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
          <span>Version 2.0.4</span>
        </div>
      </div>
    </div>
  );
}

