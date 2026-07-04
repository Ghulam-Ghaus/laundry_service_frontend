'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { catalogApi } from '@/lib/api/catalog.api';
import { ServiceCategory, CatalogItem } from '@/types/api.types';

interface CartItem {
  item: CatalogItem;
  serviceOptionId: string;
  serviceOptionName: string;
  price: number;
  quantity: number;
}

const getGarmentImage = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('shirt')) {
    return '/images/products/shirt.png';
  } else if (lowercaseName.includes('suit') || lowercaseName.includes('blazer') || lowercaseName.includes('coat')) {
    return '/images/products/suit.png';
  } else if (lowercaseName.includes('dress') || lowercaseName.includes('shalwar') || lowercaseName.includes('kameez') || lowercaseName.includes('skirt') || lowercaseName.includes('sari')) {
    return '/images/products/dress.png';
  } else if (lowercaseName.includes('sherwani')) {
    return '/images/products/sherwani.png';
  } else {
    return '/images/products/shirt.png';
  }
};

export default function Pricing() {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Fee parameters from setting defaults
  const MIN_ORDER = 3000;
  const SERVICE_FEE = 100;

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await catalogApi.getFullCatalog();
        setCategories(data || []);
        if (data && data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load service catalog.');
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleQuantityChange = (item: CatalogItem, serviceOptionId: string, serviceOptionName: string, price: number, delta: number) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
         (c) => c.item.id === item.id && c.serviceOptionId === serviceOptionId
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + delta;
        if (newQty <= 0) {
          updated.splice(existingIndex, 1);
        } else {
          updated[existingIndex].quantity = newQty;
        }
        return updated;
      }

      if (delta > 0) {
        return [...prevCart, { item, serviceOptionId, serviceOptionName, price, quantity: delta }];
      }

      return prevCart;
    });
  };

  const getQuantityInCart = (itemId: string, serviceOptionId: string): number => {
    const item = cart.find((c) => c.item.id === itemId && c.serviceOptionId === serviceOptionId);
    return item ? item.quantity : 0;
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const serviceFee = subtotal > 0 && subtotal < MIN_ORDER ? SERVICE_FEE : 0;
  const grandTotal = subtotal + serviceFee;

  const handleContinue = () => {
    if (typeof window !== 'undefined') {
      // Map cart to booking selection format
      const selection = cart.map((c) => ({
        itemId: c.item.id,
        serviceOptionId: c.serviceOptionId,
        quantity: c.quantity,
      }));
      localStorage.setItem('selected_booking_items', JSON.stringify(selection));
      router.push('/booking');
    }
  };

  const handleSkipToBooking = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_booking_items', '[]');
      router.push('/booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#e07a5f] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading pricing details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">⚠️</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Offline Catalog Mode</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Could not fetch real-time database prices. Displaying standard dry cleaning menu placeholder estimates.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-[#e07a5f] hover:bg-[#e88d72]"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const itemsToDisplay = selectedCategory
    ? selectedCategory.items?.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) || []
    : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 mb-4 font-serif">Service Rates</h1>
        <p className="text-xs text-slate-500 leading-relaxed font-sans">
          Select categories, search laundry items, and compute order estimates. Add items to your cart to schedule.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Main Grid */}
        <div className="flex-grow w-full lg:w-2/3">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2.5 mb-8 border-b border-slate-100 pb-5 font-sans">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSearchQuery('');
                }}
                className={`px-5 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-350 cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#e07a5f] text-white shadow-md shadow-[#e07a5f]/15 scale-[1.02]'
                    : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="mb-8 w-full max-w-md">
            <input
              type="text"
              placeholder="Search laundry items (e.g. shirt, suit)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#e07a5f] text-xs bg-white shadow-sm transition-all"
            />
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {itemsToDisplay.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md shadow-slate-100/50 flex flex-col justify-between card-premium-hover">
                <div>
                  <div className="flex items-center gap-3.5 mb-3.5">
                    {/* Circular product image matching Love2Laundry */}
                    <div className="w-14 h-14 rounded-full border border-slate-100 bg-[#ffece6] p-1 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={getGarmentImage(item.name)} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 font-serif">{item.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-5 leading-relaxed font-sans">{item.description || 'Gentle treatment with professional press.'}</p>
                </div>

                {/* Price Options */}
                <div className="space-y-3.5 pt-4 border-t border-slate-50 font-sans">
                  {item.prices && item.prices.length > 0 ? (
                    item.prices.map((priceRec) => {
                      const qty = getQuantityInCart(item.id, priceRec.service_option_id);
                      return (
                        <div key={priceRec.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100/45">Dry Clean</span>
                          <div className="flex items-center gap-4">
                            <span className="font-extrabold text-slate-700">PKR {priceRec.price}</span>
                            <div className="flex items-center border border-slate-150 rounded-full overflow-hidden bg-slate-50 shadow-inner">
                              <button
                                onClick={() => handleQuantityChange(item, priceRec.service_option_id, 'Dry Clean', priceRec.price, -1)}
                                className="px-3.5 py-1.5 hover:bg-slate-150 text-slate-500 font-extrabold transition-colors cursor-pointer text-xs"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-bold text-slate-800 text-xs">{qty}</span>
                              <button
                                onClick={() => handleQuantityChange(item, priceRec.service_option_id, 'Dry Clean', priceRec.price, 1)}
                                className="px-3.5 py-1.5 hover:bg-slate-150 text-slate-500 font-extrabold transition-colors cursor-pointer text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-400">Price estimated during intake</span>
                  )}
                </div>
              </div>
            ))}

            {itemsToDisplay.length === 0 && (
              <div className="col-span-full text-center py-14 text-xs text-slate-400 font-sans">
                No items match your search. Try looking for another keyword.
              </div>
            )}
          </div>
        </div>

        {/* Estimates Sidebar */}
        <div className="w-full lg:w-1/3 bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/40 sticky top-28 font-sans">
          
          {/* I'm too busy Quick Skip Option */}
          <div className="bg-[#ffece6]/80 rounded-2xl p-5 text-center mb-6 border border-[#ffd3c4] shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2 font-serif">I'm too busy</h4>
            <button
              onClick={handleSkipToBooking}
              className="inline-flex items-center gap-1 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all hover:scale-102 cursor-pointer mb-2"
            >
              Skip this step ℹ
            </button>
            <p className="text-[9px] text-[#e07a5f] font-extrabold uppercase tracking-wider">
              JUST SEND ME A BAG AND I'LL FILL IT
            </p>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-6 font-serif border-b border-slate-100 pb-3.5 tracking-wide">
            Order Estimator
          </h3>

          <div className="space-y-4.5 mb-6 max-h-[200px] overflow-y-auto pr-2">
            {cart.map((cartItem) => (
              <div key={`${cartItem.item.id}-${cartItem.serviceOptionId}`} className="flex justify-between items-start text-xs border-b border-slate-50 pb-3">
                <div>
                  <h4 className="font-bold text-slate-800">{cartItem.item.name}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Qty: {cartItem.quantity} &times; PKR {cartItem.price}</span>
                </div>
                <span className="font-extrabold text-slate-700">PKR {cartItem.quantity * cartItem.price}</span>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-400 leading-relaxed font-medium">
                Add laundry items to estimate your subtotal and proceed directly to scheduling a pickup.
              </div>
            )}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <div className="space-y-3.5 pt-4 border-t border-slate-100 text-xs mb-8">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>PKR {subtotal}</span>
              </div>

              {serviceFee > 0 && (
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Service Fee (Order &lt; PKR {MIN_ORDER})</span>
                  <span>PKR {serviceFee}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-50">
                <span>Total Estimate</span>
                <span className="text-base text-[#e07a5f]">PKR {grandTotal}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-center transition-all duration-300 ${
              cart.length > 0
                ? 'bg-[#e07a5f] text-white hover:bg-[#e88d72] shadow-lg shadow-[#e07a5f]/15 hover:scale-[1.02] cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continue to Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
