"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Cloud, CheckCircle, Clock, Video } from 'lucide-react';

export default function DownloadMonitor() {
  const [archives, setArchives] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "archives"), orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setArchives(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-6 font-mono">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-black text-white italic tracking-tighter">BASEKEY_DOWNLOAD_LOGS</h1>
        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-500 animate-pulse">
          LIVE_SYNC_ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {archives.map((item) => (
          <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
              {item.type === 'auto_capture' ? <Video className="text-blue-500" size={20} /> : <Cloud className="text-purple-500" size={20} />}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Packet_ID: {item.id.slice(0, 8)}</p>
                <CheckCircle size={12} className="text-green-500" />
              </div>
              <a href={item.url} target="_blank" className="text-xs text-blue-400 font-bold block mt-1 hover:underline truncate">
                View on Cloudinary →
              </a>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-[8px] text-zinc-600 justify-end">
                <Clock size={8} />
                <span>{item.time?.toDate().toLocaleTimeString()}</span>
              </div>
              <p className="text-[10px] font-black text-zinc-400 mt-1">SYNCED</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

