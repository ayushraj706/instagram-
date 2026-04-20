"use client";
import React from 'react';
import { Save, Key, ShieldCheck } from 'lucide-react';

export default function SetupPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Infrastructure Setup</h1>
        <p className="text-zinc-500">Apne Private API Keys aur Firebase Configuration yahan manage karein.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Firebase Config Card */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-orange-500 font-semibold">
            <Key size={18} /> <span>Firebase Service Account</span>
          </div>
          <textarea 
            placeholder='Paste your JSON Key here...'
            className="w-full h-48 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <button className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all">
            <Save size={16} /> Save Firebase Key
          </button>
        </div>

        {/* Instagram API Card */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-pink-500 font-semibold">
            <ShieldCheck size={18} /> <span>Instagram Graph API</span>
          </div>
          <div className="space-y-3">
             <input type="text" placeholder="Instagram Access Token" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none" />
             <input type="text" placeholder="Verify Token (Any random string)" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none" />
          </div>
          <button className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all">
            <Save size={16} /> Update Meta Tokens
          </button>
        </div>

      </div>
    </div>
  );
}

