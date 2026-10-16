'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  LogIn, 
  LogOut, 
  Cloud, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';

export default function LoginPage() {
  const router = useRouter();
  const { 
    user, 
    isFirebaseAvailable, 
    signInWithGoogle, 
    signInAsGuest, 
    signOut, 
    loginWithEmail, 
    registerWithEmail 
  } = useAuth();
  const { stats, resetProgress } = useProgress();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'register') {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      router.push('/');
    } catch (err: any) {
      console.warn('Auth action error:', err);
      const code = err?.code || '';
      if (code === 'auth/internal-error' || err.message?.includes('auth/internal-error')) {
        setErrorMsg(
          'Network or provider configuration error. If using email, ensure Email/Password is enabled in Firebase Console ➔ Authentication ➔ Sign-in method.'
        );
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication ➔ Sign-in method.'
        );
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please click the "Sign In" tab.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setErrorMsg('Incorrect email or password. If you do not have an account yet, click the "Create Account" tab above.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized. Please add "localhost" under Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network request timed out or blocked. You can continue studying using Offline Guest Mode below.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('The sign-in window was closed.');
      } else if (code === 'auth/internal-error') {
        setErrorMsg('Google sign-in encountered a connection issue. Try Email sign-in or Offline Guest Mode.');
      } else {
        setErrorMsg(err.message || 'Google sign-in failed. Check your network connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleContinueAsGuest = () => {
    signInAsGuest();
    router.push('/');
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all your study streaks and SRS progress?')) {
      await resetProgress();
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* If User is Already Signed In */}
      {user && !user.isAnonymous ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-2xl font-bold font-serif shadow-lg shadow-red-900/40">
              {user.displayName?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
                <Cloud size={13} />
                <span>Cloud Sync Active (Firestore)</span>
              </div>
            </div>
          </div>

          {/* User Progress Summary */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800">
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400 flex items-center justify-center gap-1">
                <Flame size={16} />
                <span>{stats.currentStreak}</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-zinc-100">{stats.totalWordsReviewed}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">{stats.wordsMastered}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Mastered</div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-colors border border-zinc-700"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-zinc-500 hover:text-rose-400 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset SRS Progress & Streaks</span>
            </button>
            {resetConfirm && (
              <p className="text-xs text-emerald-400 text-center">Progress has been reset.</p>
            )}
          </div>
        </div>
      ) : (
        /* Sign In / Register Card */
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-900/40 font-serif font-black text-xl">
              速
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Suji <span className="font-serif text-red-500 font-medium">速记</span> Account
            </h1>
            <p className="text-xs md:text-sm text-zinc-400">
              Sync your flashcards and SM-2 memory intervals across all your devices
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg('');
              }}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'signin'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
              }}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm transition-all shadow-md active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 border-t border-zinc-800" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
              Or with email
            </span>
            <div className="flex-1 border-t border-zinc-800" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500 text-sm outline-none text-zinc-200 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500 text-sm outline-none text-zinc-200 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-md active:scale-98 mt-2 ${
                activeTab === 'register'
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30'
                  : 'bg-zinc-100 hover:bg-white text-zinc-900 shadow-zinc-900/30 font-extrabold'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : activeTab === 'register'
                ? 'Create New Account'
                : 'Sign In to Suji'}
            </button>
          </form>

          {/* Standalone Offline / Guest Option */}
          <div className="pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs font-semibold border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={14} className="text-amber-400" />
              <span>Continue in Offline Local Mode (No Account Required)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
