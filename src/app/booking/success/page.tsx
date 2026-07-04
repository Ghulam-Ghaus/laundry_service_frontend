'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'ADC-2026-XXXXXX';

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[500px] animate-fade-in-up">
      {/* Green Checkmark */}
      <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-8 shadow-lg shadow-emerald-500/5 border border-emerald-500/20">
        ✓
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-3 font-serif">
        Pickup Scheduled!
      </h1>
      <p className="text-xs text-slate-500 mb-8 max-w-sm leading-relaxed">
        Your order has been recorded. Our courier rider will arrive to collect your garments at the scheduled time.
      </p>

      {/* Order Code Box */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 w-full shadow-lg shadow-slate-100/50 mb-10">
        <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest block mb-2">
          Order Reference
        </span>
        <span className="text-xl font-extrabold text-[#cca43b] tracking-widest font-mono">
          {orderNumber}
        </span>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Link
          href="/"
          className="w-full py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-center text-white bg-slate-950 hover:bg-slate-900 transition-colors shadow-md shadow-slate-900/10 cursor-pointer"
        >
          Return Home
        </Link>
        <Link
          href="/pricing"
          className="w-full py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-center text-slate-650 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Browse Price List
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccess() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-gray-400">Loading confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
