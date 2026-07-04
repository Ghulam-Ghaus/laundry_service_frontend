'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { areasApi } from '@/lib/api/areas.api';
import { ServiceArea } from '@/types/api.types';

export default function Locations() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadAreas() {
      try {
        const data = await areasApi.getAreas();
        setAreas(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch serviceable areas.');
      } finally {
        setLoading(false);
      }
    }
    loadAreas();
  }, []);

  const handleSelectAreaForBooking = (areaId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_booking_area_id', areaId);
    }
  };

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading service areas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">📍</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Offline Locations Mode</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Could not fetch real-time serviceable area coordinates. Displaying standard Lahore delivery ranges.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c]"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 mb-4 font-serif">Service Areas</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Find dry cleaning pickup locations in Lahore. Enter your neighborhood to verify service availability.
        </p>
      </div>

      {/* Search directory */}
      <div className="mb-12 flex justify-center">
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search service areas (e.g. Gulberg, DHA, Johar Town)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Grid of locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAreas.map((area) => (
          <div
            key={area.id}
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md shadow-slate-100/50 flex flex-col justify-between card-premium-hover"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {area.city}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2 font-serif">
                {area.name}
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Complete laundry pickup and next-day delivery options available.
              </p>
            </div>

            <Link
              href="/booking"
              onClick={() => handleSelectAreaForBooking(area.id)}
              className="w-full py-3.5 rounded-xl border border-slate-150 text-[10px] font-bold text-center text-slate-700 bg-slate-50 hover:bg-[#cca43b] hover:text-black hover:border-transparent transition-all uppercase tracking-wider cursor-pointer"
            >
              Book pickup here &rarr;
            </Link>
          </div>
        ))}

        {filteredAreas.length === 0 && (
          <div className="col-span-full text-center py-16 text-xs text-slate-400 font-sans leading-relaxed">
            No serviceable neighborhood matches your search. We are expanding to new zones daily in Lahore.
          </div>
        )}
      </div>

      {/* Call to expand */}
      <section className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto mt-20 shadow-xl shadow-slate-200/40">
        <h3 className="text-lg font-bold text-slate-900 mb-3 font-serif">
          Don't see your area listed?
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto mb-8 font-medium">
          If your neighborhood is outside our default Lahore zone, we may still arrange custom collections. Send our support team a quick note on WhatsApp.
        </p>
        <a
          href="https://wa.me/923001234567?text=Hi, I would like to request dry cleaning service for my neighborhood."
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 transition-all hover:scale-105 cursor-pointer"
        >
          Request Area Expansion
        </a>
      </section>
    </div>
  );
}
