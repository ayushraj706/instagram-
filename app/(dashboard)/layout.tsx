"use client";
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  Activity, 
  ShieldSecret, 
  Menu, 
  X,
  Database
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { name: 'Setup & Keys', icon: <ShieldSecret size={20} />, href: '/setup' },
    { name: 'Chat Logs', icon: <MessageSquare size={20} />, href: '/chats' },
    { name: 'System Status', icon: <Activity size={20} />, href: '/status' },
    { name: 'Database', icon: <Database size={20} />, href: '/database' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <span className="font-bold tracking-tight">BaseKey Console</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-blue-600 mb-8">BaseKey <span className="text-xs text-zinc-400 font-normal">v2.0</span></h2>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-white transition-all group"
                >
                  <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="absolute bottom-0 w-full p-6 border-t border-zinc-100 dark:border-zinc-800">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-bold text-xs">AR</div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Ayush Raj</span>
                  <span className="text-[10px] text-zinc-500 uppercase">Administrator</span>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

