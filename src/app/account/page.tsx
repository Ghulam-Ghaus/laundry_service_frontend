'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { ordersApi } from '@/lib/api/orders.api';
import { AuthUser, Order } from '@/types/api.types';

export default function AccountDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await authApi.getMe();
        setUser(profile);

        const list = await ordersApi.getMyOrders();
        setOrders(list || []);
      } catch (err: any) {
        setError(err.message || 'Access restrained. Please sign in.');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading account information...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-10 animate-fade-in-up">
      {/* Profile Welcome Header */}
      <div className="bg-gradient-to-r from-[#030712] via-[#0b0f19] to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-850 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-center sm:text-left z-10">
          <span className="text-[#cca43b] text-[10px] font-extrabold tracking-widest uppercase">
            Customer Dashboard
          </span>
          <h2 className="text-2xl font-extrabold font-serif text-white">
            Hello, {user.display_name}!
          </h2>
          <p className="text-xs text-slate-400">
            ✉️ {user.email} {user.phone && ` | 📞 ${user.phone}`}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 border border-slate-800 hover:border-slate-400 hover:text-white transition-all cursor-pointer z-10"
        >
          Sign Out
        </button>
        
        {/* Soft aesthetic background bubble */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#cca43b]/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Orders List Log */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40">
        <h3 className="text-base font-bold text-slate-900 mb-6 font-serif border-b border-slate-100 pb-3.5 tracking-wide">
          My Order Log Book
        </h3>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                <th className="py-4">Order Code</th>
                <th className="py-4">Booking Date</th>
                <th className="py-4">Grand Total</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-mono font-extrabold text-slate-700">{o.order_number}</td>
                  <td className="py-4 text-slate-500 font-medium">
                    {new Date(o.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-4 font-extrabold text-[#cca43b]">PKR {o.grand_total}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-50 border border-slate-100 text-slate-700">
                      {o.status?.label || 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      href={`/account/orders/${o.id}`}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold text-center text-[#cca43b] hover:text-[#b08b2c] transition-colors uppercase tracking-wider"
                    >
                      Track Order &rarr;
                    </Link>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-slate-400 font-sans leading-relaxed">
                    You have not placed any laundry or dry cleaning bookings yet.{' '}
                    <Link href="/booking" className="text-[#cca43b] font-bold hover:underline">
                      Schedule a pickup now!
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
