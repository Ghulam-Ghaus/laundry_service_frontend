'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { areasApi } from '@/lib/api/areas.api';
import { slotsApi, AvailableSlotInfo } from '@/lib/api/slots.api';
import { catalogApi } from '@/lib/api/catalog.api';
import { ordersApi, CreateOrderRequest } from '@/lib/api/orders.api';
import { authApi } from '@/lib/api/auth.api';
import { ServiceArea, ServiceCategory, CatalogItem } from '@/types/api.types';

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

export default function Booking() {
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [address, setAddress] = useState({
    areaId: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Lahore',
    instructions: '',
  });

  const [selectedItems, setSelectedItems] = useState<{ itemId: string; serviceOptionId: string; quantity: number }[]>([]);
  const [isItemSelectionSkipped, setIsItemSelectionSkipped] = useState(false);

  const [schedule, setSchedule] = useState({
    pickupDate: '',
    pickupSlotId: '',
    deliveryDate: '',
    deliverySlotId: '',
  });

  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  // Dropdown list states
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [catalog, setCatalog] = useState<ServiceCategory[]>([]);
  const [pickupSlots, setPickupSlots] = useState<AvailableSlotInfo[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<AvailableSlotInfo[]>([]);

  // Quote pricing state
  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize Pre-fills
  useEffect(() => {
    async function init() {
      try {
        // Load areas & catalog
        const loadedAreas = await areasApi.getAreas();
        setAreas(loadedAreas || []);

        const loadedCatalog = await catalogApi.getFullCatalog();
        setCatalog(loadedCatalog || []);

        // 1. Pre-fill Area from locations redirection
        if (typeof window !== 'undefined') {
          const savedAreaId = localStorage.getItem('selected_booking_area_id');
          if (savedAreaId) {
            setAddress((prev) => ({ ...prev, areaId: savedAreaId }));
            localStorage.removeItem('selected_booking_area_id');
          }

          // 2. Pre-fill Items from pricing redirection
          const savedItems = localStorage.getItem('selected_booking_items');
          if (savedItems) {
            setSelectedItems(JSON.parse(savedItems));
            localStorage.removeItem('selected_booking_items');
          }
        }

        // 3. Pre-fill user profile if logged in
        const user = await authApi.getMe();
        if (user) {
          setContact({
            firstName: user.first_name,
            lastName: user.last_name || '',
            email: user.email,
            phone: user.phone || '',
          });
        }
      } catch {
        // Silently fail auth loading if guest
      }
    }
    init();
  }, []);

  // Fetch pickup slots when pickupDate changes
  useEffect(() => {
    if (address.areaId && schedule.pickupDate) {
      async function loadPickupSlots() {
        try {
          const slots = await slotsApi.getAvailability(address.areaId, schedule.pickupDate, 'pickup');
          setPickupSlots(slots || []);
        } catch {
          setPickupSlots([]);
        }
      }
      loadPickupSlots();
    }
  }, [address.areaId, schedule.pickupDate]);

  // Fetch delivery slots when deliveryDate changes
  useEffect(() => {
    if (address.areaId && schedule.deliveryDate) {
      async function loadDeliverySlots() {
        try {
          const slots = await slotsApi.getAvailability(address.areaId, schedule.deliveryDate, 'delivery');
          setDeliverySlots(slots || []);
        } catch {
          setDeliverySlots([]);
        }
      }
      loadDeliverySlots();
    }
  }, [address.areaId, schedule.deliveryDate]);

  // Trigger Backend Quote Calculation in Review Step
  useEffect(() => {
    if (currentStep === 5) {
      async function loadQuote() {
        try {
          setQuoteError(null);
          const res = await ordersApi.getQuote({
            items: selectedItems,
            couponCode: couponCode || undefined,
            isItemSelectionSkipped,
          });
          setQuote(res);
        } catch (err: any) {
          setQuoteError(err.message || 'Error calculating order totals.');
        }
      }
      loadQuote();
    }
  }, [currentStep, selectedItems, couponCode, isItemSelectionSkipped]);

  // Quantity updates inside booking form
  const handleQtyChange = (itemId: string, serviceOptionId: string, delta: number) => {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((i) => i.itemId === itemId && i.serviceOptionId === serviceOptionId);
      if (idx > -1) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + delta;
        if (newQty <= 0) {
          updated.splice(idx, 1);
        } else {
          updated[idx].quantity = newQty;
        }
        return updated;
      }
      if (delta > 0) {
        return [...prev, { itemId, serviceOptionId, quantity: delta }];
      }
      return prev;
    });
  };

  const getQty = (itemId: string, serviceOptionId: string): number => {
    const found = selectedItems.find((i) => i.itemId === itemId && i.serviceOptionId === serviceOptionId);
    return found ? found.quantity : 0;
  };

  // Stepper Validations
  const validateStep = () => {
    if (currentStep === 1) {
      return address.areaId && address.addressLine1 && address.city;
    }
    if (currentStep === 2) {
      return isItemSelectionSkipped || selectedItems.length > 0;
    }
    if (currentStep === 3) {
      return schedule.pickupDate && schedule.pickupSlotId && schedule.deliveryDate && schedule.deliverySlotId;
    }
    if (currentStep === 4) {
      return contact.firstName && contact.email && contact.phone;
    }
    return true;
  };

  // Submit Checkout
  const handleCheckoutSubmit = async () => {
    if (!acceptedTerms) return;
    setSubmitting(true);
    try {
      const orderPayload: CreateOrderRequest = {
        address: {
          areaId: address.areaId,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || undefined,
          city: address.city,
          instructions: address.instructions || undefined,
        },
        items: isItemSelectionSkipped ? undefined : selectedItems,
        schedule: {
          pickupDate: schedule.pickupDate,
          pickupSlotId: schedule.pickupSlotId,
          deliveryDate: schedule.deliveryDate,
          deliverySlotId: schedule.deliverySlotId,
        },
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName || undefined,
          email: contact.email,
          phone: contact.phone,
        },
        couponCode: couponCode || undefined,
        specialInstructions: specialInstructions || undefined,
        isItemSelectionSkipped,
        acceptedTerms,
      };

      const response = await ordersApi.createOrder(orderPayload);
      router.push(`/booking/success?orderNumber=${response.orderNumber}`);
    } catch (err: any) {
      alert(err.message || 'Checkout failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up font-sans">
      {/* Stepper indicators */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-8 mb-12 text-xs font-bold text-slate-400">
        {[
          { step: 1, label: 'Address' },
          { step: 2, label: 'Items' },
          { step: 3, label: 'Schedule' },
          { step: 4, label: 'Contact' },
          { step: 5, label: 'Review' },
        ].map((s, idx) => (
          <div
            key={s.step}
            className={`flex items-center gap-2 transition-all duration-300 relative ${
              currentStep === s.step ? 'text-[#e07a5f]' : currentStep > s.step ? 'text-slate-800' : 'text-slate-350'
            }`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center border font-extrabold transition-all duration-300 ${
                currentStep === s.step
                  ? 'border-[#e07a5f] bg-[#ffece6] text-[#e07a5f] shadow-md shadow-[#e07a5f]/10 scale-105'
                  : currentStep > s.step
                  ? 'border-slate-800 bg-slate-900 text-white'
                  : 'border-slate-150 bg-slate-50 text-slate-400'
              }`}
            >
              {s.step}
            </span>
            <span className="hidden sm:inline tracking-wider uppercase text-[10px]">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/40 min-h-[440px] flex flex-col justify-between">
        {/* STEP 1: Address */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <h2 className="text-xl font-extrabold font-serif text-slate-900 mb-1.5">Collection Address</h2>
              <p className="text-[11px] text-slate-400">Please provide the Lahore pickup address details for our rider team.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Service Area</label>
                <select
                  value={address.areaId}
                  onChange={(e) => setAddress({ ...address, areaId: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                >
                  <option value="">Choose Area...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">City</label>
                <input
                  type="text"
                  disabled
                  value={address.city}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 text-xs bg-slate-50 text-slate-400 font-medium select-none shadow-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Address line 1</label>
                <input
                  type="text"
                  placeholder="House number, street name, block..."
                  value={address.addressLine1}
                  onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Address line 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Apartment, near landmarks..."
                  value={address.addressLine2}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Rider Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="Ring doorbell, call on arrival..."
                  value={address.instructions}
                  onChange={(e) => setAddress({ ...address, instructions: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Items */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
              <div>
                <h2 className="text-xl font-extrabold font-serif text-slate-900 mb-1">Item Selections</h2>
                <p className="text-[11px] text-slate-400">Choose items to request pricing estimates, or skip for intake counting.</p>
              </div>
              <button
                onClick={() => {
                  setIsItemSelectionSkipped(!isItemSelectionSkipped);
                  setSelectedItems([]);
                }}
                className={`px-4 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  isItemSelectionSkipped 
                    ? 'bg-[#e07a5f] text-white shadow-md shadow-[#e07a5f]/15' 
                    : 'bg-slate-100 text-slate-550 hover:bg-slate-200'
                }`}
              >
                {isItemSelectionSkipped ? 'Selection Skipped ✓' : 'Skip & Count on Intake'}
              </button>
            </div>

            {!isItemSelectionSkipped ? (
              <div className="space-y-6 max-h-[320px] overflow-y-auto pr-2">
                {catalog.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 font-serif border-b border-slate-100 pb-1.5 uppercase tracking-wide">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {category.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border border-slate-100 rounded-2xl p-4 bg-slate-50/40 hover:border-slate-200 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* Circular product image matching Love2Laundry */}
                            <div className="w-12 h-12 rounded-full border border-slate-150 bg-[#ffece6] p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img 
                                src={getGarmentImage(item.name)} 
                                alt={item.name} 
                                className="w-full h-full object-cover rounded-full" 
                              />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                PKR {item.prices && item.prices[0] ? item.prices[0].price : '0'}
                              </span>
                            </div>
                          </div>

                          {item.prices && item.prices[0] && (
                            <div className="flex items-center border border-slate-150 rounded-full overflow-hidden bg-white shadow-sm">
                              <button
                                onClick={() => handleQtyChange(item.id, item.prices![0].service_option_id, -1)}
                                className="px-2.5 py-1 text-slate-400 font-bold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-extrabold text-slate-800">
                                {getQty(item.id, item.prices[0].service_option_id)}
                              </span>
                              <button
                                onClick={() => handleQtyChange(item.id, item.prices![0].service_option_id, 1)}
                                className="px-2.5 py-1 text-slate-400 font-bold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-slate-50/40 rounded-3xl border border-dashed border-slate-200 px-6 max-w-lg mx-auto">
                <span className="text-3xl block mb-3">🧺</span>
                <p className="text-xs text-slate-550 leading-relaxed max-w-sm mx-auto font-medium">
                  You have skipped item selection. Our intake rider will bag, tag, and inventory your clothes upon pickup. A billing breakdown estimate will be sent to you afterward.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Collection & Delivery */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <h2 className="text-xl font-extrabold font-serif text-slate-900 mb-1.5">Schedules</h2>
              <p className="text-[11px] text-slate-400">Select pickup and return delivery slots suited to your timetable.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Pickup */}
              <div className="space-y-4 bg-slate-50/30 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Pickup Date & Time</h3>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={schedule.pickupDate}
                    onChange={(e) => setSchedule({ ...schedule, pickupDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Time Slot</label>
                  <select
                    value={schedule.pickupSlotId}
                    onChange={(e) => setSchedule({ ...schedule, pickupSlotId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                  >
                    <option value="">Select Slot...</option>
                    {pickupSlots.filter((slot, idx, self) => self.findIndex((s) => s.slotId === slot.slotId) === idx).map((s) => (
                      <option key={s.slotId} value={s.slotId}>
                        {s.label} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery */}
              <div className="space-y-4 bg-slate-50/30 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Delivery Date & Time</h3>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={schedule.deliveryDate}
                    onChange={(e) => setSchedule({ ...schedule, deliveryDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Time Slot</label>
                  <select
                    value={schedule.deliverySlotId}
                    onChange={(e) => setSchedule({ ...schedule, deliverySlotId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                  >
                    <option value="">Select Slot...</option>
                    {deliverySlots.filter((slot, idx, self) => self.findIndex((s) => s.slotId === slot.slotId) === idx).map((s) => (
                      <option key={s.slotId} value={s.slotId}>
                        {s.label} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Contact */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <h2 className="text-xl font-extrabold font-serif text-slate-900 mb-1.5">Contact Details</h2>
              <p className="text-[11px] text-slate-400">Required contact info for receipts, order updates, and delivery alerts.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">First name</label>
                <input
                  type="text"
                  placeholder="Awais"
                  value={contact.firstName}
                  onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Last name (Optional)</label>
                <input
                  type="text"
                  placeholder="Khan"
                  value={contact.lastName}
                  onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email address</label>
                <input
                  type="email"
                  placeholder="awais@example.com"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Phone number</label>
                <input
                  type="text"
                  placeholder="+92 (300) 123-4567"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-slate-700 shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Quote */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <h2 className="text-xl font-extrabold font-serif text-slate-900 mb-1.5">Review Order</h2>
              <p className="text-[11px] text-slate-400">Confirm details before submitting your premium care request.</p>
            </div>

            {quoteError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-2xl border border-red-100">
                {quoteError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Summary Cards */}
              <div className="space-y-4 text-xs">
                <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/20">
                  <h4 className="font-bold text-slate-800 mb-1.5 font-serif uppercase tracking-wider text-[9px] text-slate-400">Pickup address</h4>
                  <p className="text-slate-600 font-medium">{address.addressLine1}, {address.city}</p>
                </div>
                <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/20">
                  <h4 className="font-bold text-slate-800 mb-1.5 font-serif uppercase tracking-wider text-[9px] text-slate-400">Schedules</h4>
                  <p className="text-slate-650 font-medium mb-1">📅 Pickup: {schedule.pickupDate}</p>
                  <p className="text-slate-650 font-medium">🚚 Return: {schedule.deliveryDate}</p>
                </div>
                <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/20">
                  <h4 className="font-bold text-slate-800 mb-1.5 font-serif uppercase tracking-wider text-[9px] text-slate-400">Contact</h4>
                  <p className="text-slate-600 font-medium">{contact.firstName} {contact.lastName} ({contact.phone})</p>
                </div>
              </div>

              {/* Quotation invoice */}
              <div className="bg-slate-50 p-6 rounded-3xl text-xs space-y-4.5 border border-slate-100/60 shadow-sm">
                <h4 className="font-bold text-slate-850 font-serif border-b border-slate-200 pb-2 tracking-wide uppercase text-[9px] text-slate-450">Invoice breakdown</h4>
                {quote ? (
                  <>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Subtotal</span>
                      <span>PKR {quote.subtotal}</span>
                    </div>
                    {parseFloat(quote.serviceFee) > 0 && (
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Service fee</span>
                        <span>PKR {quote.serviceFee}</span>
                      </div>
                    )}
                    {parseFloat(quote.discountTotal) > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>Discount</span>
                        <span>- PKR {quote.discountTotal}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-3.5">
                      <span>Grand total</span>
                      <span className="text-base text-[#cca43b]">PKR {quote.grandTotal}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 py-6 animate-pulse font-sans">Calculating invoice rates...</div>
                )}

                {/* Coupon Code Entry */}
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="PROMO CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#cca43b] uppercase font-bold tracking-wider bg-white shadow-inner"
                  />
                </div>

                <div className="pt-4 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 accent-[#cca43b] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[10px] text-slate-500 leading-normal cursor-pointer select-none font-medium">
                    I agree to terms of service and care guidelines for dry cleaning delicate clothes.
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Nav */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-10">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-250 ${
              currentStep === 1
                ? 'text-slate-300 border border-slate-150 cursor-not-allowed select-none'
                : 'text-slate-650 border border-slate-200 hover:bg-slate-50 cursor-pointer'
            }`}
          >
            Back
          </button>

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!validateStep()}
              className={`px-6 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                validateStep()
                  ? 'bg-slate-950 text-white hover:bg-slate-900 shadow-md shadow-slate-900/10 cursor-pointer scale-102 hover:scale-[1.04]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed select-none'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCheckoutSubmit}
              disabled={!acceptedTerms || submitting}
              className={`px-8 py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/15 transition-all duration-350 ${
                acceptedTerms && !submitting ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-[#cca43b]/25' : 'opacity-55 cursor-not-allowed select-none'
              }`}
            >
              {submitting ? 'Placing Order...' : 'Confirm Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
