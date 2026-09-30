import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Store, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInEmail, signUpEmail, signInWithGoogle, switchDemoRole } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const getFriendlyErrorMessage = (errorMsg: string): string => {
    if (errorMsg.includes('auth/operation-not-allowed')) {
      return 'Firebase Console-এ "Email/Password" লগইন মেথডটি চালু করা নেই। আপনার ফায়ারবেস কনসোলে গিয়ে Build > Authentication > Sign-in method সেকশন থেকে "Email/Password" প্রোভাইডারটি Enable বা চালু করুন।';
    }
    if (errorMsg.includes('auth/email-already-in-use')) {
      return 'এই ইমেইল অ্যাড্রেসটি ইতিমধ্যেই রেজিস্টার করা আছে। হতে পারে আপনি আগে "Google Account" (যেমন Google Login) দিয়ে প্রবেশ করেছিলেন। দয়া করে নিচে থাকা "Google Account" বাটন ব্যবহার করে লগইন করুন অথবা অন্য ইমেইল ব্যবহার করুন।';
    }
    if (errorMsg.includes('auth/weak-password')) {
      return 'পাসওয়ার্ডটি অত্যন্ত দুর্বল। দয়া করে অন্তত ৬ অক্ষরের একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।';
    }
    if (errorMsg.includes('auth/invalid-email')) {
      return 'ভুল ইমেইল ফরম্যাট! দয়া করে সঠিক ইমেইল টাইপ করুন।';
    }
    if (errorMsg.includes('auth/invalid-credential') || errorMsg.includes('auth/wrong-password') || errorMsg.includes('auth/user-not-found')) {
      return 'ভুল ইমেইল অথবা পাসওয়ার্ড! দয়া করে আবার চেষ্টা করুন অথবা Google দিয়ে লগইন করুন।';
    }
    return errorMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (tab === 'signin') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password, name, role);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message || 'Authentication failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message || 'Google sign-in cancelled or failed.'));
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    await switchDemoRole(demoRole);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xl mb-2">
            S
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Sodaipur / সোদাইপুর</h2>
          <p className="text-xs text-slate-500 mt-1">Multi-Vendor E-Commerce Experience</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
          <button
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'signin' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'signup' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Arif Rahman"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">I want to register as:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      role === 'customer' 
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      role === 'owner' 
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    Seller / Store
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 focus:border-emerald-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 focus:border-emerald-600 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-2">
            <span>Or continue with</span>
          </div>
        </div>

        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Google Account
        </button>

        {/* Quick Demo Logins */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 mb-2 text-center">Instant Demo Test Accounts:</p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer')}
              className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors flex flex-col items-center"
            >
              <ShoppingBag className="w-3.5 h-3.5 mb-0.5 text-emerald-600" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('owner')}
              className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors flex flex-col items-center"
            >
              <Store className="w-3.5 h-3.5 mb-0.5 text-blue-600" />
              TTS Seller
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors flex flex-col items-center"
            >
              <ShieldCheck className="w-3.5 h-3.5 mb-0.5 text-rose-600" />
              Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
