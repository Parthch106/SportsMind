'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ShieldAlert, Navigation, Cpu, LayoutDashboard, Radio, BookOpen } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { href: '/directory', label: 'Player Directory', icon: BookOpen },
  { href: '/live', label: 'Live Match Center', icon: Radio },
  { href: '/performance', label: 'Performance Prediction', icon: Activity },
  { href: '/injury', label: 'Injury Risk', icon: ShieldAlert },
  { href: '/tactics', label: 'Tactical Analysis', icon: Navigation },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen border-r border-emerald-500/20 bg-[#060d14]/90 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50 overflow-y-auto">
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-emerald-500/20 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="font-[var(--font-space)] font-bold text-lg tracking-wider text-emerald-400">SYS.CORE</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/50">SportsMind v1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        <div className="px-2 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-emerald-500/50 font-bold">Modules</p>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'text-emerald-500/60 hover:bg-emerald-500/5 hover:text-emerald-400 border border-transparent'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,1)]" />
              )}
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-emerald-500/40 group-hover:text-emerald-400'}`} />
              <span className="text-sm font-medium font-[var(--font-space)] tracking-wide">{item.label}</span>
              
              {/* Hover sweep effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:animate-[scan_1s_ease-in-out]" />
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-6 border-t border-emerald-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-emerald-500/50 font-bold">System Status</span>
          <span className="text-xs font-mono text-emerald-400">ONLINE</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-500/60 font-mono">Qdrant DB</span>
            <span className="text-emerald-400 font-mono">6333</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-500/60 font-mono">XGB Models</span>
            <span className="text-emerald-400 font-mono">Loaded</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
