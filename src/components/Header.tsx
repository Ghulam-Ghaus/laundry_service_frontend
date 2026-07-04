'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    router.push('/');
  };

  const navLinks = [
    { 
      name: 'Home', 
      href: '/', 
      icon: (
        <svg className="w-3.5 h-3.5 transition-transform group-hover/link:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Pricing', 
      href: '/pricing',
      icon: (
        <svg className="w-3.5 h-3.5 transition-transform group-hover/link:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 14.5l-3-3M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Locations', 
      href: '/locations',
      icon: (
        <svg className="w-3.5 h-3.5 transition-transform group-hover/link:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 border-b border-slate-100 backdrop-blur-md shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Animated mini washer logo */}
          <div className="w-8 h-8 rounded-lg border border-[#e07a5f]/40 flex items-center justify-center relative overflow-hidden bg-slate-50 transition-colors group-hover:border-[#e07a5f]">
            <div className="w-5 h-5 rounded-full border border-dashed border-[#e07a5f]/60 animate-spin-drum flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#e07a5f]"></div>
            </div>
            <div className="absolute top-[3px] right-[3px] w-1 h-1 rounded-full bg-[#e07a5f] animate-pulse"></div>
          </div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-slate-800 font-serif group-hover:text-[#e07a5f] transition-colors">
            AWAIS <span className="text-[#e07a5f] font-sans font-semibold text-xs tracking-wider block sm:inline sm:ml-1">DRY CLEANER</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs font-bold transition-all duration-300 flex items-center gap-2 group/link relative py-1 ${
                  isActive ? 'text-[#e07a5f]' : 'text-slate-600 hover:text-[#e07a5f]'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#e07a5f] to-[#f9a78c] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-5">
          {isLoggedIn ? (
            <>
              <Link
                href="/account"
                className="text-xs font-bold text-slate-600 hover:text-[#e07a5f] transition-colors"
              >
                Account
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-400 hover:text-[#e07a5f] transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold text-slate-600 hover:text-[#e07a5f] transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-900 transition-all hover:scale-105 shadow-md shadow-slate-900/10"
          >
            Schedule Pickup
          </Link>
        </div>
      </div>
    </header>
  );
}
