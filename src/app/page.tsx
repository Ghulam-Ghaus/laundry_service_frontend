'use client';

import React from 'react';
import Link from 'next/link';

// Custom SVGs with animations
const CalendarIcon = () => (
  <svg className="w-8 h-8 text-[#cca43b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
);

const TruckIcon = () => (
  <svg className="w-8 h-8 text-[#cca43b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125a1.125 1.125 0 001.125-1.125V9.75M9 4.5h5.625c.621 0 1.125.504 1.125 1.125v1.875m-6.75-3H9m1.5 0V9.75m0 3.75h4.5M10.5 13.5v-3.75m6.75 3.75h1.875a1.125 1.125 0 001.125-1.125v-1.5M18.75 9h-3.75V4.5" />
  </svg>
);

const HangerIcon = () => (
  <svg className="w-8 h-8 text-[#cca43b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 0L6 9.5a1.5 1.5 0 00-.7 1.25V18a2 2 0 002 2h9.4a2 2 0 002-2v-7.25a1.5 1.5 0 00-.7-1.25L12 6z" />
  </svg>
);

const LeafIcon = () => (
  <svg className="w-6 h-6 text-[#cca43b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 12h14m-7-9a9 9 0 00-9 9m9-9a9 9 0 019 9" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6 text-[#cca43b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-6 h-6 text-[#cca43b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.813zM19.071 4.929l-.244 1.53-.244-1.53-1.53-.244 1.53-.244.244-1.53.244 1.53 1.53.244-1.53.244zM19.071 19.071l-.244 1.53-.244-1.53-1.53-.244 1.53-.244.244-1.53.244 1.53 1.53.244-1.53.244z" />
  </svg>
);

const ShirtGarment = () => (
  <svg className="w-14 h-14 text-[#cca43b] animate-float-garment mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5a2.5 2.5 0 012.5 2.5c0 .65-.25 1.25-.65 1.7L12 8.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8.5L3 11v3h3v5h12v-5h3v-3l-3-2.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.5l3 3.5 3-3.5M12 12v6M12 14h.01M12 16h.01" />
  </svg>
);

const SuitGarment = () => (
  <svg className="w-14 h-14 text-[#cca43b] animate-float-garment mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5a2.5 2.5 0 012.5 2.5c0 .65-.25 1.25-.65 1.7L12 8.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8.5l-2 3v7h18v-7l-2-3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8.5l5 7 5-7M12 8.5v3l-1.5 2.5L12 16.5l1.5-2.5L12 11.5" />
  </svg>
);

const DressGarment = () => (
  <svg className="w-14 h-14 text-[#cca43b] animate-float-garment mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5a2.5 2.5 0 012.5 2.5c0 .65-.25 1.25-.65 1.7L12 8.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 8.5L8 13.5l-3.5 6h15l-3.5-6 1.5-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13.5h8" />
  </svg>
);

const SherwaniGarment = () => (
  <svg className="w-14 h-14 text-[#cca43b] animate-float-garment mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5a2.5 2.5 0 012.5 2.5c0 .65-.25 1.25-.65 1.7L12 8.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 8.5l-2.5 3v9h16v-9l-2.5-3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 8.5h5M12 8.5v12M12 11h.01M12 13h.01M12 15h.01M12 17h.01M12 19h.01" />
  </svg>
);

export default function Home() {
  const steps = [
    {
      num: '01',
      icon: <CalendarIcon />,
      title: 'Schedule a Pickup',
      desc: 'Pick your slots online. Set dates for collections & deliveries or count clothing pieces later.',
    },
    {
      num: '02',
      icon: <TruckIcon />,
      title: 'Contactless Collection',
      desc: 'Our driver arrives with premium laundry bags to safely collect your garments right from your Lahore doorstep.',
    },
    {
      num: '03',
      icon: <HangerIcon />,
      title: 'Premium Hand-Finished Care',
      desc: 'Clothes undergo strict stain inspection, eco-cleaning, steam-pressing, and return clean on premium hangers.',
    },
  ];

  const popularItems = [
    { name: 'Formal Shirt', price: '250', option: 'Dry Clean & Press', image: '/images/products/shirt.png' },
    { name: 'Gentlemens Suit (2pc)', price: '850', option: 'Dry Clean & Press', image: '/images/products/suit.png' },
    { name: 'Ladies Shalwar Kameez', price: '450', option: 'Dry Clean & Press', image: '/images/products/dress.png' },
    { name: 'Sherwani', price: '1200', option: 'Premium Care', image: '/images/products/sherwani.png' },
  ];

  const badges = [
    { icon: <LeafIcon />, title: 'Eco-Friendly Solvents', desc: 'Scent-free dry cleaning agents safe for skin and laces.' },
    { icon: <ClockIcon />, title: '48h Standard Delivery', desc: 'Fast, scheduled turnaround time tailored to your timetable.' },
    { icon: <SparklesIcon />, title: 'Steam Iron Finish', desc: 'Crisp, hand-finished professional pressing on all formalwear.' },
  ];

  const bubbleOffsets = [
    { left: '15%', size: '25px', delay: '0s', duration: '14s' },
    { left: '35%', size: '15px', delay: '3s', duration: '18s' },
    { left: '55%', size: '35px', delay: '1s', duration: '15s' },
    { left: '75%', size: '20px', delay: '5s', duration: '13s' },
  ];

  return (
    <div className="flex flex-col w-full animate-fade-in-up">
      
      {/* 1. Hero Section: Warm Coral Peach */}
      <section 
        className="relative w-full py-16 lg:py-24 bg-gradient-to-br from-[#fff7f5] via-[#ffece6] to-[#ffd3c4]/50 text-slate-800 overflow-hidden border-b border-slate-100"
      >
        {/* Soft floating bubbles overlay */}
        {bubbleOffsets.map((b, i) => (
          <div
            key={i}
            className="bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          />
        ))}

        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#e07a5f_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[360px]">
          {/* Left Column: Headings */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-[#e07a5f]/10 text-[#e07a5f] border border-[#e07a5f]/20 mb-4 animate-pulse">
              ✨ Lahore's Trusted Dry Cleaning Service
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4 font-serif text-slate-950">
              Lahore's Leading Laundry & <span className="text-[#e07a5f]">Dry Cleaning</span> Service
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mb-8 leading-relaxed font-sans max-w-md">
              We collect, clean, and return your garments at a time and location of your choice. Next-day delivery with lowest prices guaranteed.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-900 transition-all hover:scale-105 shadow-xl shadow-slate-900/10"
              >
                Book Pickup Now
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-slate-700 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all"
              >
                Browse Price List
              </Link>
            </div>
          </div>

          {/* Right Column: Love2Laundry Booking Box */}
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/40 text-center flex flex-col items-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#ffece6] flex items-center justify-center text-[#e07a5f] text-lg font-bold mb-4">
              ⚡
            </div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-1 font-sans">
              Schedule Your Pickup
            </h3>
            <p className="text-xs text-slate-400 font-medium mb-6">
              Book online and have a rider arrive in 60 minutes
            </p>
            <Link
              href="/booking"
              className="w-full py-4 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-center text-white bg-[#e07a5f] hover:bg-[#e88d72] transition-all hover:scale-[1.02] shadow-lg shadow-[#e07a5f]/25 active:scale-98 cursor-pointer font-sans"
            >
              Order in 60 Minutes
            </Link>
            <div className="flex items-center gap-2 mt-4 text-[9px] text-slate-450 uppercase font-bold tracking-wider font-sans">
              <span>✓ Free Collection</span>
              <span className="text-slate-300">•</span>
              <span>✓ Next-Day Return</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-12 relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/40 flex items-start gap-5 card-premium-hover cursor-default"
            >
              <span className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[#e07a5f]">
                {badge.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1.5 font-serif">{badge.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4 font-serif">Valet Laundry Process</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Professional garment care made effortless. Save time and skip the local laundry shop runs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center px-6 py-4 rounded-2xl hover:bg-slate-50/50 transition-colors group">
              <span className="text-8xl font-black text-slate-100/70 font-sans mb-4 absolute -top-12 left-1/2 -translate-x-1/2 -z-10 select-none group-hover:text-[#e07a5f]/10 transition-colors">
                {step.num}
              </span>
              <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-md transition-transform group-hover:scale-110">
                {step.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 font-serif">{step.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs font-sans">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Popular Pricing */}
      <section className="bg-white border-y border-slate-100 py-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4 font-serif">Popular Dry Clean Menu</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Clear upfront laundry quotes. Free collection and door delivery on all orders above PKR 3,000.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {popularItems.map((item, i) => (
              <div
                key={i}
                className="border border-slate-100 rounded-2xl p-6 text-center bg-white flex flex-col justify-between items-center card-premium-hover cursor-pointer relative overflow-hidden group shadow-md shadow-slate-100/50"
              >
                {/* Circular framed garment product image */}
                <div className="flex justify-center items-center mb-5">
                  <div className="w-24 h-24 rounded-full border border-slate-100 bg-[#ffece6] p-1.5 shadow-inner transition-transform duration-300 group-hover:scale-105 flex items-center justify-center overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-800 font-serif mb-1.5">{item.name}</h4>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    {item.option}
                  </span>
                </div>
                <div className="text-base font-extrabold text-[#e07a5f]">
                  PKR {item.price}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center font-sans">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#e07a5f] hover:text-[#c94c2d] transition-colors uppercase tracking-wider"
            >
              Check Full Pricing List &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Founder Message Section */}
      <section className="bg-slate-50/50 py-16 border-b border-slate-100 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-md">
          <div className="relative w-32 h-32 rounded-full border-4 border-[#e07a5f]/30 shadow-xl overflow-hidden bg-slate-50 flex-shrink-0">
            <img 
              src="/images/laundry_owner.png" 
              alt="M. Awais - Founder" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center md:text-left space-y-3">
            <span className="text-[#e07a5f] text-[9px] font-extrabold tracking-widest uppercase block">Our Leadership</span>
            <h3 className="text-lg font-bold font-serif text-slate-800">Founder's Quality Pledge</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-sans italic">
              "At Awais Dry Cleaner, we treat every garment as if it were our own. By combining modern eco-friendly solvents with master steam pressing techniques, we guarantee your clothing returns fresh, clean, and beautifully finished."
            </p>
            <div className="text-xs font-bold text-slate-700 font-sans">
              M. Awais — Founder & Lead Care Officer
            </div>
          </div>
        </div>
      </section>

      {/* 5. Mobile Companion Mockup */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] rounded-3xl overflow-hidden relative p-8 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-10 border border-slate-200 shadow-2xl">
          <div className="max-w-xl flex flex-col gap-4 text-left">
            <span className="text-[#e07a5f] text-[10px] font-extrabold tracking-widest uppercase">Dry Clean Companion App</span>
            <h2 className="text-3xl font-bold text-white font-serif leading-tight">
              Order Valets in One Tap
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Track dry cleaning statuses, reschedule deliveries, check coupon updates, and text your assigned collection rider. Coming soon to Android and iOS.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 min-w-[200px] w-full sm:w-auto font-sans">
            <span className="px-6 py-3 bg-slate-800/80 text-white rounded-xl text-[10px] font-bold text-center border border-slate-700/80 uppercase tracking-wider select-none hover:bg-slate-750 transition-colors cursor-default">
              App Store (Soon)
            </span>
            <span className="px-6 py-3 bg-slate-800/80 text-white rounded-xl text-[10px] font-bold text-center border border-slate-700/80 uppercase tracking-wider select-none hover:bg-slate-750 transition-colors cursor-default">
              Google Play (Soon)
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
