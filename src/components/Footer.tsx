import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#05070c] text-slate-400 border-t border-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        
        {/* Brand Details */}
        <div className="flex flex-col gap-4">
          <span className="text-xl font-extrabold tracking-widest text-white font-serif">
            AWAIS <span className="text-[#cca43b] font-sans font-medium text-lg tracking-wider">DRY CLEANER</span>
          </span>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Lahore's premier dry cleaning, wash & fold laundry, and premium steam pressing service. Experienced care for your finest garments.
          </p>
        </div>

        {/* Services Links */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-sans">Services</h4>
          <ul className="space-y-3 text-xs">
            <li><Link href="/pricing" className="hover:text-[#cca43b] transition-colors duration-200">Dry Cleaning</Link></li>
            <li><Link href="/pricing" className="hover:text-[#cca43b] transition-colors duration-200">Wash & Fold Laundry</Link></li>
            <li><Link href="/pricing" className="hover:text-[#cca43b] transition-colors duration-200">Premium Steam Pressing</Link></li>
            <li><Link href="/pricing" className="hover:text-[#cca43b] transition-colors duration-200">Wedding Gowns & Silks</Link></li>
          </ul>
        </div>

        {/* Help & Support */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-sans">Support</h4>
          <ul className="space-y-3 text-xs">
            <li><Link href="/locations" className="hover:text-[#cca43b] transition-colors duration-200">Service Areas</Link></li>
            <li><a href="https://wa.me/923001234567" target="_blank" rel="noreferrer" className="hover:text-[#cca43b] transition-colors duration-200">WhatsApp Helpdesk</a></li>
            <li><Link href="/terms" className="hover:text-[#cca43b] transition-colors duration-200">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-[#cca43b] transition-colors duration-200">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-sans">Contact Us</h4>
          <ul className="space-y-3 text-xs text-slate-500">
            <li className="flex items-start gap-2"><span>📍</span> <span>45-C, Gulberg II, Lahore, Pakistan</span></li>
            <li className="flex items-center gap-2"><span>📞</span> <span className="hover:text-slate-300 transition-colors">+92 (300) 123-4567</span></li>
            <li className="flex items-center gap-2"><span>✉️</span> <span className="hover:text-slate-300 transition-colors">support@awaisdrycleaner.com</span></li>
            <li className="pt-2 text-slate-400 border-t border-slate-900/60 flex items-center gap-2"><span>🕒</span> <span>Mon - Sat: 9:00 AM - 9:00 PM</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-900/40 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Awais Dry Cleaner. All rights reserved. Designed for premium care.
      </div>
    </footer>
  );
}
