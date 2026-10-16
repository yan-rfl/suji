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
  Sparkles
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
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
      console.error(err);
      setErrorMsg(err.message || 'Google sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
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
                <span>Firestore Cloud Sync Active</span>
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
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-900/40">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {isRegister ? 'Create Your Account' : 'Welcome to Suji 速记'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-400">
              Sync your SM-2 flashcard progress, review schedules, and study streaks across devices.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {isFirebaseAvailable ? (
            <>
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

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 border-t border-zinc-800" />
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Or with email
                </span>
                <div className="flex-1 border-t border-zinc-800" />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500 text-sm outline-none text-zinc-200"
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
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500 text-sm outline-none text-zinc-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-md shadow-red-900/30 active:scale-98 mt-2"
                >
                  {isRegister ? 'Register Account' : 'Sign In'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Local Guest Mode explanation when Firebase credentials are not yet entered */
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                  <Cloud size={16} />
                  <span>Local Guest Mode Active</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your flashcard progress, SM-2 memory intervals, and study streaks are safely stored in your browser's local storage.
                </p>
                <p className="text-[11px] text-zinc-500">
                  To sync across phones, tablets, and computers, provide your Firebase keys in your environment variables (<code className="text-zinc-400">.env.local</code>).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  signInAsGuest();
                  router.push('/');
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-md shadow-red-900/30 active:scale-98"
              >
                Continue Learning as Guest
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
