'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  BrainCircuit, 
  Home, 
  Flame, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { useLevel } from '@/context/LevelContext';
import { PWAInstaller } from './PWAInstaller';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { stats } = useProgress();
  const { currentLevel, theme } = useLevel();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: Home },
    { label: 'Dictionary', href: '/dictionary', icon: BookOpen },
    { label: 'Quiz Engine', href: '/quiz', icon: BrainCircuit },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navbar */}
      <header 
        className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors"
        style={{ 
          backgroundColor: 'var(--nav-bg)', 
          borderColor: 'var(--nav-border)' 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-serif font-black text-xl shadow-lg transition-transform group-hover:scale-105"
              style={{ 
                backgroundColor: theme.primary,
                boxShadow: `0 4px 14px rgba(${theme.rgb}, 0.35)`
              }}
            >
              速
            </div>
            <div className="flex flex-col">
              <span 
                className="font-bold text-lg tracking-tight flex items-center gap-1.5"
                style={{ color: 'var(--nav-text)' }}
              >
                Suji <span style={{ color: theme.primary }} className="font-serif font-medium">速记</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: theme.badgeBg,
                    color: theme.badgeText,
                    border: `1px solid ${theme.badgeBorder}`
                  }}
                >
                  HSK {currentLevel}
                </span>
              </span>
              <span 
                className="text-[10px] -mt-0.5 hidden sm:inline"
                style={{ color: 'var(--nav-muted)' }}
              >
                Personal Mandarin Mastery
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon 
                    size={16} 
                    style={{ color: isActive ? theme.primary : undefined }} 
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Section: Streak, PWA, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Pill */}
            <div 
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold"
              title={`${stats.currentStreak} day study streak!`}
            >
              <Flame size={14} className="fill-amber-500 text-amber-500 animate-pulse" />
              <span>{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</span>
            </div>

            {/* PWA Install Trigger */}
            <PWAInstaller />

            {/* User Account Button */}
            <Link
              href="/login"
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                user && !user.isAnonymous
                  ? 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <UserIcon size={15} />
              <span className="hidden sm:inline">
                {user ? (user.displayName || 'Learner') : 'Account'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg px-6 py-2 flex items-center justify-around transition-colors"
        style={{ 
          backgroundColor: 'var(--nav-bg)', 
          borderColor: 'var(--nav-border)' 
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
                isActive ? 'font-semibold' : 'hover:opacity-80'
              }`}
              style={{ color: isActive ? theme.primary : 'var(--nav-muted)' }}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : ''} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/login"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
            pathname === '/login' ? 'font-semibold' : 'hover:opacity-80'
          }`}
          style={{ color: pathname === '/login' ? theme.primary : 'var(--nav-muted)' }}
        >
          <UserIcon size={20} className={pathname === '/login' ? 'stroke-[2.5]' : ''} />
          <span>Account</span>
        </Link>
      </nav>
    </>
  );
};
