'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      const roles = response?.user?.roles || [];
      if (roles.includes('admin') || roles.includes('super_admin')) {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 min-h-[550px] flex flex-col justify-center animate-fade-in-up">
      <div className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/40">
        <div className="text-center mb-8">
          <span className="text-[#cca43b] text-[10px] font-extrabold tracking-widest uppercase block mb-1.5">
            Welcome Back
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-serif">
            Client Sign In
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-650 text-xs p-3 rounded-2xl border border-red-100 mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4.5 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 transition-all hover:scale-[1.02] cursor-pointer mt-4"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-8 text-xs text-slate-400 font-medium">
          Don't have a login account?{' '}
          <Link href="/register" className="text-[#cca43b] font-bold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
