'use client';

import React, { useEffect, useState } from 'react';
import { httpClient } from '@/lib/api/http-client';
import Link from 'next/link';
import { ServiceCategory, ServiceOption, CatalogItem } from '@/types/api.types';

const formatLocalDateTime = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateForReceipt = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function AdminReceipt() {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  // Overrides & special notes
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    order_date: formatLocalDateTime(new Date()),
    delivery_date: formatLocalDateTime(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);

  // Load catalog full list and service options on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setError(null);
        // Load the full catalog (categories + items + prices)
        const catalogData = await httpClient.get<ServiceCategory[]>('/catalog/full');
        setCategories(catalogData || []);
        if (catalogData && catalogData.length > 0) {
          setSelectedCategoryId(catalogData[0].id);
        }

        // Load service options
        const optionsData = await httpClient.get<ServiceOption[]>('/admin/catalog/service-options');
        setServiceOptions(optionsData || []);
        if (optionsData && optionsData.length > 0) {
          // Default to Wash & Iron if present, otherwise first available
          const defaultOpt = optionsData.find(o => o.code === 'wash_iron') || optionsData[0];
          setSelectedOptionId(defaultOpt.id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load initial catalog data');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (step === 4 && createdOrder && shouldAutoPrint) {
      setShouldAutoPrint(false);
      const timer = setTimeout(() => {
        window.print();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step, createdOrder, shouldAutoPrint]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleQtyChange = (itemId: string, optionId: string, delta: number) => {
    const key = `${itemId}_${optionId}`;
    setSelectedItems((prev) => {
      const currentQty = prev[key] || 0;
      const newQty = currentQty + delta;
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[key];
      } else {
        updated[key] = newQty;
      }
      return updated;
    });
  };

  const validateStep1 = () => {
    if (!form.customer_name.trim()) {
      setError('Customer name is required');
      return false;
    }
    if (!form.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!form.order_date) {
      setError('Order date is required');
      return false;
    }
    if (!form.delivery_date) {
      setError('Expected delivery date is required');
      return false;
    }
    const orderDate = new Date(form.order_date);
    const deliveryDate = new Date(form.delivery_date);
    if (deliveryDate < orderDate) {
      setError('Expected delivery date must be the same day or after order date');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextToSummary = () => {
    const itemsCount = Object.keys(selectedItems).length;
    if (itemsCount === 0) {
      setError('Please select at least one item.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setSaving(true);
    setError(null);

    // Map selected items into payload format
    const itemsPayload = Object.entries(selectedItems).map(([key, qty]) => {
      const [itemId, serviceOptionId] = key.split('_');
      return {
        itemId,
        serviceOptionId,
        quantity: qty,
      };
    });

    const parsedDiscount = parseFloat(discountAmount) || 0;
    const finalGrandTotal = Math.max(0, subtotal - parsedDiscount);

    const payload = {
      customerName: form.customer_name,
      phone: form.phone,
      orderDate: form.order_date,
      deliveryDate: form.delivery_date,
      categoryId: selectedCategoryId,
      items: itemsPayload,
      discountAmount: parsedDiscount,
      grandTotal: finalGrandTotal,
      notes: notes,
    };

    try {
      const res = await httpClient.post<any>('/orders/draft', payload);
      
      // Store created receipt details in local state for Step 4 Preview
      setCreatedOrder({
        orderNumber: res.orderNumber,
        customerName: form.customer_name,
        phone: form.phone,
        orderDate: form.order_date,
        deliveryDate: form.delivery_date,
        items: selectedItemsList,
        subtotal: subtotal,
        discount: parsedDiscount,
        grandTotal: finalGrandTotal,
        notes: notes,
      });

      setShouldAutoPrint(true);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to create draft order');
    } finally {
      setSaving(false);
    }
  };

  const handleResetFlow = () => {
    setForm({
      customer_name: '',
      phone: '',
      order_date: formatLocalDateTime(new Date()),
      delivery_date: formatLocalDateTime(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    });
    setSelectedItems({});
    setNotes('');
    setDiscountAmount('0');
    setCreatedOrder(null);
    setStep(1);
  };

  const getItemPriceForSelectedOption = (item: CatalogItem) => {
    return item.prices?.find((p) => p.service_option_id === selectedOptionId && p.is_active);
  };

  // Find active category item list
  const activeCategoryItems = categories.find((c) => c.id === selectedCategoryId)?.items || [];

  // Calculate live subtotal
  const subtotal = Object.entries(selectedItems).reduce((sum, [key, qty]) => {
    const [itemId, optionId] = key.split('_');
    const item = categories
      .flatMap((c) => c.items || [])
      .find((i) => i.id === itemId);
    if (!item) return sum;
    const priceObj = item.prices?.find((p) => p.service_option_id === optionId);
    return sum + (priceObj ? priceObj.price * qty : 0);
  }, 0);

  // Compute selected items list for summary
  const selectedItemsList = Object.entries(selectedItems).map(([key, qty]) => {
    const [itemId, optionId] = key.split('_');
    const item = categories.flatMap((c) => c.items || []).find((i) => i.id === itemId);
    const option = serviceOptions.find((o) => o.id === optionId);
    const priceObj = item?.prices?.find((p) => p.service_option_id === optionId);
    return {
      key,
      itemName: item?.name || 'Unknown Item',
      optionName: option?.name || 'Unknown Option',
      price: priceObj ? priceObj.price : 0,
      quantity: qty,
      total: (priceObj ? priceObj.price : 0) * qty,
    };
  });

  // Calculate Summary View Pos Totals
  const currentDiscount = parseFloat(discountAmount) || 0;
  const currentGrandTotal = Math.max(0, subtotal - currentDiscount);

  const getWhatsAppShareLink = (order: any) => {
    if (!order) return '#';
    const itemsText = order.items
      .map((item: any) => `- ${item.itemName} (${item.optionName}) x${item.quantity} = Rs. ${item.total}`)
      .join('\n');
      
    const message = `*AWAIS DRY CLEANERS*\n` +
      `==============================\n` +
      `*Receipt #:* ${order.orderNumber}\n` +
      `*Date:* ${formatDateForReceipt(order.orderDate)}\n` +
      `*Expected Delivery:* ${formatDateForReceipt(order.deliveryDate)}\n` +
      `==============================\n` +
      `*Customer:* ${order.customerName}\n` +
      `*Phone:* ${order.phone}\n` +
      `==============================\n` +
      `*Items:*\n${itemsText}\n` +
      `==============================\n` +
      `*Subtotal:* PKR ${order.subtotal.toFixed(2)}\n` +
      `*Discount:* - PKR ${parseFloat(order.discount).toFixed(2)}\n` +
      `*GRAND TOTAL:* PKR ${order.grandTotal.toFixed(2)}\n` +
      `==============================\n` +
      `*Notes:* ${order.notes || 'None'}\n\n` +
      `Thank you for your visit!\nVisit Again.`;
      
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const whatsappPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    
    return `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading catalog data...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      
      {/* Printable CSS Overrides */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, button, a, .no-print {
            display: none !important;
          }
          .print-container {
            width: 62mm !important;
            max-width: 62mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            font-size: 10px !important;
          }
          #thermal-receipt-print {
            width: 62mm !important;
            max-width: 62mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            border: none !important;
            box-shadow: none !important;
            font-family: monospace !important;
            box-sizing: border-box !important;
          }
          /* Scale text inside receipt for safe print fit */
          #thermal-receipt-print,
          #thermal-receipt-print * {
            font-size: 9px !important;
            line-height: 1.2 !important;
          }
          #thermal-receipt-print h1 {
            font-size: 12px !important;
          }
          /* Hide main app containers */
          main, div.max-w-7xl {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
          }
          div.max-w-2xl {
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          /* Page config */
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
      
      {/* Sidebar Admin Navigation Ribbon (Hidden when printing) */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4 no-print">
        <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Orders Dashboard
        </Link>
        <Link href="/admin/receipt" className="text-sm font-bold text-[#cca43b] border-b-2 border-[#cca43b] pb-2 px-1">
          New Receipt
        </Link>
        <Link href="/admin/settings" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Settings
        </Link>
        <Link href="/admin/audit-logs" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Audit Logs
        </Link>
        <Link href="/admin/trash" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Trash Bin
        </Link>
      </div>

      {/* Editor Panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-sm max-w-2xl print:border-none print:shadow-none print:p-0">
        
        {/* Stepper Header (Hidden when printing) */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3 no-print">
          <h2 className="text-lg font-bold text-[#1a1d20] font-serif">
            Create Draft Receipt
          </h2>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full">
            Step {step} of 4
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-650 text-xs px-4 py-3 rounded-2xl font-medium mb-6 no-print">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs text-gray-500 print:space-y-0">
          
          {/* STEP 1: Customer Details & Dates */}
          {step === 1 && (
            <div className="space-y-6 no-print">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  placeholder="e.g. Awais"
                  value={form.customer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="e.g. 03001234567"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Order Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="order_date"
                    required
                    value={form.order_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Expected Delivery Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="delivery_date"
                    required
                    value={form.delivery_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!form.customer_name.trim() || !form.phone.trim() || !form.order_date || !form.delivery_date}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all text-center ${
                    (!form.customer_name.trim() || !form.phone.trim() || !form.order_date || !form.delivery_date)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                      : 'text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 cursor-pointer'
                  }`}
                >
                  Continue to Items Selection
                </button>
                <Link
                  href="/admin"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-center text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: Service Options, Categories & Items */}
          {step === 2 && (
            <div className="space-y-6 no-print">
              
              {/* Service Options (On Top) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Service Option
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {serviceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`px-4 py-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                        selectedOptionId === opt.id
                          ? 'border-[#cca43b] bg-[#cca43b]/5 text-[#cca43b] shadow-sm font-semibold'
                          : 'border-gray-200 bg-white text-gray-650 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wide">{opt.name}</div>
                      {opt.description && (
                        <div className="text-[9px] text-gray-400 font-normal line-clamp-1 mt-0.5">
                          {opt.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Category Selection */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Service Category
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(c.id)}
                      className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                        selectedCategoryId === c.id
                          ? 'bg-[#cca43b] border-[#cca43b] text-black shadow-md shadow-[#cca43b]/10'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items & Prices */}
              <div className="space-y-3 pt-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Items & Prices
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {activeCategoryItems.map((item) => {
                    const priceObj = getItemPriceForSelectedOption(item);
                    const qtyKey = `${item.id}_${selectedOptionId}`;
                    const qty = selectedItems[qtyKey] || 0;
                    
                    return (
                      <div
                        key={item.id}
                        className={`flex justify-between items-center border rounded-2xl p-4 transition-all duration-200 bg-white ${
                          priceObj 
                            ? 'border-gray-100 hover:border-gray-200 hover:shadow-sm' 
                            : 'border-gray-100 bg-gray-50/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-gray-100 bg-amber-50/50 flex items-center justify-center text-base">
                            👕
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-800">{item.name}</h4>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {priceObj ? `PKR ${priceObj.price}` : 'Price not set'}
                            </span>
                          </div>
                        </div>

                        {priceObj ? (
                          <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.id, selectedOptionId, -1)}
                              className="px-2.5 py-1 text-gray-455 font-bold hover:bg-gray-50 transition-colors cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-extrabold text-gray-800">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.id, selectedOptionId, 1)}
                              className="px-2.5 py-1 text-gray-455 font-bold hover:bg-gray-50 transition-colors cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-gray-450 tracking-wider">
                            N/A
                          </span>
                        )}
                      </div>
                    );
                  })}
                  
                  {activeCategoryItems.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-400 font-medium">
                      No items found in this category.
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Items Summary */}
              {selectedItemsList.length > 0 && (
                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-3 mt-4">
                  <h3 className="text-[10px] font-bold text-gray-650 uppercase tracking-wider border-b border-gray-200/50 pb-2">
                    Selected Items Summary
                  </h3>
                  <div className="space-y-2 text-[11px] text-gray-550 max-h-[120px] overflow-y-auto pr-1">
                    {selectedItemsList.map((item) => (
                      <div key={item.key} className="flex justify-between items-center">
                        <span>
                          <span className="font-bold text-gray-750">{item.itemName}</span>{' '}
                          <span className="text-[9px] text-gray-450 font-bold">({item.optionName})</span>{' '}
                          <span className="text-gray-400 font-medium">x{item.quantity}</span>
                        </span>
                        <span className="font-bold text-gray-700">PKR {item.total}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200/50 pt-2 flex justify-between items-center text-xs font-bold text-gray-800">
                    <span>ESTIMATED SUBTOTAL</span>
                    <span className="text-[#cca43b]">PKR {subtotal}</span>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-center text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Back to Details
                </button>
                <button
                  type="button"
                  onClick={handleNextToSummary}
                  disabled={Object.keys(selectedItems).length === 0}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all text-center ${
                    Object.keys(selectedItems).length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                      : 'text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 cursor-pointer'
                  }`}
                >
                  Continue to Summary
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: POS Order Summary & Custom Overrides */}
          {step === 3 && (
            <div className="space-y-6 no-print">
              
              {/* Customer Details Review Card */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-650 uppercase tracking-wider border-b border-gray-200/50 pb-2 mb-3">
                  Customer Details Review
                </h3>
                <div className="grid grid-cols-2 gap-y-3 text-[11px] text-gray-700">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Name</span>
                    <span className="font-bold text-gray-800">{form.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Phone</span>
                    <span className="font-bold text-gray-800">{form.phone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Order Date</span>
                    <span>{formatDateForReceipt(form.order_date)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Expected Return</span>
                    <span>{formatDateForReceipt(form.delivery_date)}</span>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-250 text-gray-500 uppercase tracking-wider text-[9px] font-bold">
                      <th className="p-3">Item (Option)</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Rate</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedItemsList.map((item) => (
                      <tr key={item.key} className="hover:bg-gray-50/50 text-gray-750">
                        <td className="p-3 font-semibold">
                          {item.itemName} <span className="text-[9px] font-normal text-gray-400 block sm:inline">({item.optionName})</span>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-600">{item.quantity}</td>
                        <td className="p-3 text-right">PKR {item.price}</td>
                        <td className="p-3 text-right font-bold">PKR {item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Custom Overrides & Notes Form Elements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Discount Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Special Notes / Care Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Stain on collar, delicate silk care..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800 resize-none"
                  />
                </div>
              </div>

              {/* Final Receipt Total Block */}
              <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100 space-y-2.5">
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span>Discount</span>
                  <span>- PKR {currentDiscount.toFixed(2)}</span>
                </div>
                <div className="border-t border-amber-200/50 pt-2.5 flex justify-between text-sm font-bold text-gray-900">
                  <span>GRAND TOTAL</span>
                  <span className="text-[#cca43b]">PKR {currentGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-center text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Back to Items
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 transition-all cursor-pointer"
                >
                  {saving ? 'Saving Receipt...' : 'Create Draft Receipt'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Printable Thermal Receipt POS Preview */}
          {step === 4 && createdOrder && (
            <div className="space-y-6">
              
              {/* Receipt Body Container (id target for media print stylesheet mapping) */}
              <div 
                id="thermal-receipt-print" 
                className="bg-[#fffdf9] border border-amber-100 rounded-3xl p-6 sm:p-8 max-w-sm mx-auto shadow-inner text-xs font-mono text-gray-800 border-dashed print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white"
              >
                {/* Receipt Header */}
                <div className="text-center space-y-1 mb-4">
                  <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Awais Dry Cleaners
                  </h1>
                  <p className="text-[10px] text-gray-500">
                    Main Road, Gulberg, Lahore
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Ph: +92 300 1234567
                  </p>
                  <div className="text-gray-400 mt-2 text-[9px]">
                    ================================
                  </div>
                </div>

                {/* Meta details */}
                <div className="space-y-1 text-[10px] mb-3">
                  <div className="flex justify-between">
                    <span>Receipt # :</span>
                    <span className="font-bold text-gray-900">{createdOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Date:</span>
                    <span>{formatDateForReceipt(createdOrder.orderDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exp Return:</span>
                    <span className="font-bold text-gray-900">{formatDateForReceipt(createdOrder.deliveryDate)}</span>
                  </div>
                  <div className="text-gray-400 text-[9px] my-1">
                    --------------------------------
                  </div>
                  <div className="flex justify-between">
                    <span>Customer  :</span>
                    <span className="font-bold">{createdOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone     :</span>
                    <span>{createdOrder.phone}</span>
                  </div>
                  <div className="text-gray-400 text-[9px] my-1">
                    ================================
                  </div>
                </div>

                {/* Receipt Items list */}
                <div className="space-y-2 mb-3">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-gray-700 border-b border-gray-200/50 pb-1 mb-1">
                    <span className="col-span-6">Item (Option)</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-4 text-right">Total</span>
                  </div>
                  
                  {createdOrder.items.map((item: any) => (
                    <div key={item.key} className="grid grid-cols-12 text-[10px] text-gray-800 leading-tight">
                      <span className="col-span-6">
                        {item.itemName} <span className="text-[9px] text-gray-400 block">({item.optionName})</span>
                      </span>
                      <span className="col-span-2 text-center font-bold">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold">Rs.{item.total}</span>
                    </div>
                  ))}
                  <div className="text-gray-400 text-[9px] my-1">
                    --------------------------------
                  </div>
                </div>

                {/* Receipt POS Totals */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>PKR {createdOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>- PKR {createdOrder.discount.toFixed(2)}</span>
                  </div>
                  <div className="text-gray-400 text-[9px] my-1">
                    ================================
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-900">
                    <span>GRAND TOTAL:</span>
                    <span>PKR {createdOrder.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-gray-400 text-[9px] my-1">
                    ================================
                  </div>
                </div>

                {/* Special Instructions Notes */}
                {createdOrder.notes && (
                  <div className="text-[9px] border border-amber-100 rounded-lg p-2.5 bg-amber-50/20 text-gray-600 mb-3 italic">
                    <span className="font-bold uppercase not-italic block text-[8px] text-gray-500 mb-0.5">Special Care Notes:</span>
                    "{createdOrder.notes}"
                  </div>
                )}

                {/* Footer Barcode / Greetings mockup */}
                <div className="text-center space-y-2 mt-4">
                  <div className="h-6 w-full max-w-[150px] mx-auto bg-gray-200 border-x border-gray-400 flex items-center justify-center font-serif text-[10px] tracking-[6px] text-gray-700 select-none">
                    ||||||||||||||||||
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 uppercase">
                    Thank you! Visit Again.
                  </p>
                  <p className="text-[8px] text-gray-400">
                    Receipt printed locally via POS device.
                  </p>
                </div>

              </div>

              {/* Administrative Receipt POS Action Triggers (Hidden when printing) */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 no-print">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Receipt POS Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer transition-all"
                  >
                    <span>🖨️</span> Print Thermal Receipt
                  </button>
                  <a
                    href={getWhatsAppShareLink(createdOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 cursor-pointer transition-all"
                  >
                    <span>💬</span> Share on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer transition-all"
                  >
                    <span>📄</span> Download POS PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFlow}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 transition-all cursor-pointer text-center"
                  >
                    Create New Receipt
                  </button>
                </div>
              </div>

            </div>
          )}

        </form>
      </div>
    </div>
  );
}
