'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin.api';

export default function AdminDashboard() {
  const [posOrders, setPosOrders] = useState<any[]>([]);
  const [pickupOrders, setPickupOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Instant local filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pickup' | 'pos'>('pos');
  const [dateFilter, setDateFilter] = useState<'previous' | 'today' | 'coming'>('today');
  const [subFilter, setSubFilter] = useState<string>('all'); // 'all' | 'paid' | 'unpaid' | 'delivered' | 'partial_paid' | 'partial_delivered'

  // Dispatch state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [riderUserId, setRiderUserId] = useState('');
  const [taskTypeCode, setTaskTypeCode] = useState('pickup');

  // Details Modal state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Release Order state
  // releaseMode: 'full' = Full Paid & Release, 'partial' = Partial Paid & Release
  const [releasingOrder, setReleasingOrder] = useState<any | null>(null);
  const [releaseMode, setReleaseMode] = useState<'full' | 'partial'>('full');
  // partial items: key=itemId, value=qty releasing now
  const [releaseItems, setReleaseItems] = useState<Record<string, number>>({});
  // partial items unit price map for auto-calculation
  const [releaseItemPrices, setReleaseItemPrices] = useState<Record<string, number>>({});
  const [paymentAmountCollectedNow, setPaymentAmountCollectedNow] = useState<string>('0');
  const [amountManuallyEdited, setAmountManuallyEdited] = useState(false);
  const [paymentMethodCode, setPaymentMethodCode] = useState('cash');
  const [submittingRelease, setSubmittingRelease] = useState(false);

  const isOrderFullySettled = (order: any): boolean => {
    const fullyPaid = order.payment_status === 'paid';
    const totalQty = (order.items || []).reduce((s: number, i: any) => s + i.quantity, 0);
    const deliveredQty = (order.items || []).reduce((s: number, i: any) => s + (i.quantity_delivered || 0), 0);
    const fullyDelivered = totalQty === 0 || deliveredQty >= totalQty;
    return fullyPaid && fullyDelivered;
  };

  const handleOpenReleaseModal = (order: any, mode: 'full' | 'partial' = 'full') => {
    setReleasingOrder(order);
    setReleaseMode(mode);
    setAmountManuallyEdited(false);
    setPaymentMethodCode('cash');

    const initialItems: Record<string, number> = {};
    const initialPrices: Record<string, number> = {};
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const remainingQty = Math.max(0, item.quantity - (item.quantity_delivered || 0));
        initialItems[item.id] = mode === 'full' ? remainingQty : 0;
        initialPrices[item.id] = item.unit_price || 0;
      });
    }
    setReleaseItems(initialItems);
    setReleaseItemPrices(initialPrices);

    if (mode === 'full') {
      const remaining = Math.max(0, order.grand_total - (order.amount_paid || 0));
      setPaymentAmountCollectedNow(remaining.toFixed(2));
    } else {
      // start partial at 0; updates as items change
      setPaymentAmountCollectedNow('0');
    }
  };

  // When qty changes in partial mode, auto-recalculate amount unless manually edited
  const handlePartialItemQtyChange = (itemId: string, val: number, maxVal: number) => {
    const clamped = Math.min(maxVal, Math.max(0, val));
    const updated = { ...releaseItems, [itemId]: clamped };
    setReleaseItems(updated);
    if (!amountManuallyEdited) {
      const autoAmount = Object.entries(updated).reduce((sum, [id, qty]) => {
        return sum + qty * (releaseItemPrices[id] || 0);
      }, 0);
      setPaymentAmountCollectedNow(autoAmount.toFixed(2));
    }
  };

  const handleReleaseSubmit = async (e: React.FormEvent, forceFullRelease?: boolean) => {
    e.preventDefault();
    if (!releasingOrder) return;
    setSubmittingRelease(true);
    try {
      const isFullRelease = releaseMode === 'full' || forceFullRelease === true;
      const amount = parseFloat(paymentAmountCollectedNow) || 0;
      const itemsPayload = isFullRelease
        ? undefined
        : Object.entries(releaseItems).map(([itemId, qty]) => ({
            itemId,
            quantityDeliveredNow: qty,
          }));

      await adminApi.releaseOrder(releasingOrder.id, {
        isFullRelease,
        items: itemsPayload,
        paymentAmountCollectedNow: amount,
        paymentMethodCode,
      });

      alert('Release and payment updated successfully!');
      setReleasingOrder(null);

      const [posRes, onlineRes] = await Promise.all([
        adminApi.getPosOrders(1, 200, searchQuery || undefined),
        adminApi.getPickupOrders(1, 200, searchQuery || undefined),
      ]);
      setPosOrders(Array.isArray(posRes) ? posRes : posRes?.items || []);
      setPickupOrders(Array.isArray(onlineRes) ? onlineRes : onlineRes?.items || []);

      if (selectedOrderDetails?.id === releasingOrder.id) {
        handleViewDetails(releasingOrder.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to release order.');
    } finally {
      setSubmittingRelease(false);
    }
  };

  const getDeliveryStatus = (order: any) => {
    if (!order.items || order.items.length === 0) return 'pending';
    const totalQty = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const deliveredQty = order.items.reduce((sum: number, i: any) => sum + (i.quantity_delivered || 0), 0);
    if (deliveredQty === 0) return 'pending';
    if (deliveredQty >= totalQty) return 'delivered';
    return 'partial';
  };

  const getDeliveryStatusLabel = (order: any) => {
    if (!order.items || order.items.length === 0) return 'Pending Delivery';
    const totalQty = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const deliveredQty = order.items.reduce((sum: number, i: any) => sum + (i.quantity_delivered || 0), 0);
    if (deliveredQty === 0) return 'Pending Delivery';
    if (deliveredQty >= totalQty) return 'Delivered (All Items)';
    return `Partially Delivered (${deliveredQty}/${totalQty})`;
  };

  const handleViewDetails = async (orderId: string) => {
    setLoadingDetails(true);
    try {
      const details = await adminApi.getOrder(orderId);
      setSelectedOrderDetails(details);
    } catch (err: any) {
      alert(err.message || 'Failed to load order details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load orders lists dynamically based on search
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [posRes, onlineRes] = await Promise.all([
          adminApi.getPosOrders(1, 200, searchQuery || undefined),
          adminApi.getPickupOrders(1, 200, searchQuery || undefined),
        ]);
        setPosOrders(Array.isArray(posRes) ? posRes : posRes?.items || []);
        setPickupOrders(Array.isArray(onlineRes) ? onlineRes : onlineRes?.items || []);
      } catch (err: any) {
        setError(err.message || 'Access Denied or Database Connection Error.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchQuery]);

  const handleStatusChange = async (orderId: string, newStatusCode: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatusCode);
      const [posRes, onlineRes] = await Promise.all([
        adminApi.getPosOrders(1, 200, searchQuery || undefined),
        adminApi.getPickupOrders(1, 200, searchQuery || undefined),
      ]);
      setPosOrders(Array.isArray(posRes) ? posRes : posRes?.items || []);
      setPickupOrders(Array.isArray(onlineRes) ? onlineRes : onlineRes?.items || []);
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleAssignRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrderId || !riderUserId) return;
    try {
      await adminApi.assignStaff(assigningOrderId, riderUserId, taskTypeCode);
      alert('Rider dispatched successfully!');
      setAssigningOrderId(null);
      setRiderUserId('');
    } catch (err: any) {
      alert(err.message || 'Assignment failed.');
    }
  };

  const getOrderTargetDate = (order: any) => {
    if (order.customer_id) {
      return order.pickup_date ? new Date(order.pickup_date) : new Date(order.created_at);
    }
    const metaDate = order.metadata?.orderDate || order.metadata?.order_date || order.created_at;
    return new Date(metaDate);
  };

  const getOrderDeliveryDate = (order: any) => {
    if (order.customer_id) {
      return order.delivery_date ? new Date(order.delivery_date) : new Date(order.created_at);
    }
    const metaDate = order.metadata?.deliveryDate || order.metadata?.delivery_date || order.created_at;
    return new Date(metaDate);
  };

  const posStatusOptions = [
    { code: 'draft', label: 'Received/Draft' },
    { code: 'cleaning', label: 'Cleaning' },
    { code: 'ready_for_delivery', label: 'Ready for Pickup' },
    { code: 'delivered', label: 'Completed/Collected' },
    { code: 'cancelled', label: 'Cancelled' },
  ];

  const pickupStatusOptions = [
    { code: 'pending_confirmation', label: 'Pending Confirmation' },
    { code: 'pickup_assigned', label: 'Rider Dispatched' },
    { code: 'received_at_facility', label: 'Received at Facility' },
    { code: 'cleaning', label: 'Cleaning' },
    { code: 'ready_for_delivery', label: 'Ready for Delivery' },
    { code: 'delivered', label: 'Delivered/Completed' },
    { code: 'cancelled', label: 'Cancelled' },
  ];

  // Apply instant local filters on orders state
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // KPI: Today Received = created today
  // KPI: Today Delivered = delivery date is today AND status is delivered/completed
  let posTodayReceived = 0;
  let posTodayDeliveredCount = 0;
  let posTodayCollected = 0;

  let pickupTodayReceived = 0;
  let pickupTodayDeliveredCount = 0;
  let pickupTodayCollected = 0;

  posOrders.forEach((o) => {
    const createdAtDate = new Date(o.created_at);
    const deliveryDate = getOrderDeliveryDate(o);
    const statusCode = o.status?.code || '';
    const isDelivered = ['delivered', 'completed'].includes(statusCode);
    if (createdAtDate >= startOfToday && createdAtDate <= endOfToday) posTodayReceived++;
    if (isDelivered && deliveryDate >= startOfToday && deliveryDate <= endOfToday) {
      posTodayDeliveredCount++;
      posTodayCollected += (o.amount_paid || 0);
    }
  });

  pickupOrders.forEach((o) => {
    const createdAtDate = new Date(o.created_at);
    const deliveryDate = getOrderDeliveryDate(o);
    const statusCode = o.status?.code || '';
    const isDelivered = ['delivered', 'completed'].includes(statusCode);
    if (createdAtDate >= startOfToday && createdAtDate <= endOfToday) pickupTodayReceived++;
    if (isDelivered && deliveryDate >= startOfToday && deliveryDate <= endOfToday) {
      pickupTodayDeliveredCount++;
      pickupTodayCollected += (o.amount_paid || 0);
    }
  });


  let processedOrders = activeTab === 'pos' ? posOrders : pickupOrders;

  // 2. Main date filter: previous / today / coming
  processedOrders = processedOrders.filter((o) => {
    const targetDate = getOrderTargetDate(o);
    const deliveryDate = getOrderDeliveryDate(o);
    if (dateFilter === 'today') {
      // Today = pickup OR delivery date falls on today
      const pickupToday = targetDate >= startOfToday && targetDate <= endOfToday;
      const deliveryToday = deliveryDate >= startOfToday && deliveryDate <= endOfToday;
      return pickupToday || deliveryToday;
    }
    if (dateFilter === 'previous') {
      // Previous = delivery date is before today
      return deliveryDate < startOfToday;
    }
    if (dateFilter === 'coming') {
      // Coming = pickup date is after today
      return targetDate > endOfToday;
    }
    return true;
  });

  // 3. Sub-filter (only meaningful for 'today' but applies to all)
  if (subFilter !== 'all') {
    processedOrders = processedOrders.filter((o) => {
      const payStatus = o.payment_status || 'unpaid';
      const delivStatus = getDeliveryStatus(o);
      if (subFilter === 'paid') return payStatus === 'paid';
      if (subFilter === 'unpaid') return payStatus === 'unpaid';
      if (subFilter === 'partial_paid') return payStatus === 'partial_paid';
      if (subFilter === 'delivered') return delivStatus === 'delivered';
      if (subFilter === 'partial_delivered') return delivStatus === 'partial';
      return true;
    });
  }

  // 4. Input Search Query filtering (name, phone, order number)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    processedOrders = processedOrders.filter((o) => {
      const orderNo = (o.order_number || '').toLowerCase();
      
      let name = '';
      let phone = '';
      if (o.customer_id && o.customer) {
        name = `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.toLowerCase();
        phone = (o.customer.phone || o.customer.email || '').toLowerCase();
      } else if (o.metadata) {
        name = (o.metadata.customer_name || '').toLowerCase();
        phone = (o.metadata.phone || '').toLowerCase();
      }
      
      return orderNo.includes(query) || name.includes(query) || phone.includes(query);
    });
  }

  if (loading && posOrders.length === 0 && pickupOrders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading administration panel...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      
      {/* Sidebar Admin Navigation Ribbon */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4">
        <Link href="/admin" className="text-sm font-bold text-[#cca43b] border-b-2 border-[#cca43b] pb-2 px-1">
          Orders Dashboard
        </Link>
        <Link href="/admin/receipt" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          New Receipt
        </Link>
        <Link href="/admin/settings" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Settings
        </Link>
      </div>

      {/* Inline error banner for partial failures */}
      {error && (posOrders.length > 0 || pickupOrders.length > 0) && (
        <div className="bg-red-50 border border-red-100 text-red-650 text-xs px-4 py-3 rounded-2xl font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Today's Summary Banner — click any card to filter the table below */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* POS - Today Received */}
        <button
          type="button"
          onClick={() => { setActiveTab('pos'); setDateFilter('today'); setSubFilter('all'); document.getElementById('orders-table-section')?.scrollIntoView({ behavior: 'smooth' }); }}
          className={`bg-[#fffdf9] border rounded-2xl p-5 flex flex-col gap-1 shadow-sm text-left transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${activeTab === 'pos' && dateFilter === 'today' && subFilter === 'all' ? 'border-amber-400 ring-2 ring-amber-300' : 'border-amber-100'}`}
        >
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-700 opacity-80">🏪 POS · Today Received</span>
          <span className="text-3xl font-black font-serif text-amber-800">{posTodayReceived}</span>
          <span className="text-[10px] text-amber-500 font-semibold">orders created today · tap to view ↓</span>
        </button>

        {/* POS - Today Delivered + Collected */}
        <button
          type="button"
          onClick={() => { setActiveTab('pos'); setDateFilter('today'); setSubFilter('delivered'); document.getElementById('orders-table-section')?.scrollIntoView({ behavior: 'smooth' }); }}
          className={`bg-[#fffdf9] border rounded-2xl p-5 flex flex-col gap-1 shadow-sm text-left transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${activeTab === 'pos' && dateFilter === 'today' && subFilter === 'delivered' ? 'border-green-400 ring-2 ring-green-300' : 'border-green-200'}`}
        >
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-green-700 opacity-80">🏪 POS · Today Delivered</span>
          <span className="text-3xl font-black font-serif text-green-800">{posTodayDeliveredCount}</span>
          <span className="text-[10px] text-green-600 font-bold font-mono">PKR {posTodayCollected.toFixed(0)} collected · tap to view ↓</span>
        </button>

        {/* Pickup - Today Received */}
        <button
          type="button"
          onClick={() => { setActiveTab('pickup'); setDateFilter('today'); setSubFilter('all'); document.getElementById('orders-table-section')?.scrollIntoView({ behavior: 'smooth' }); }}
          className={`bg-blue-50/30 border rounded-2xl p-5 flex flex-col gap-1 shadow-sm text-left transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${activeTab === 'pickup' && dateFilter === 'today' && subFilter === 'all' ? 'border-blue-400 ring-2 ring-blue-300' : 'border-blue-100'}`}
        >
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-700 opacity-80">🚚 Pickup · Today Received</span>
          <span className="text-3xl font-black font-serif text-blue-800">{pickupTodayReceived}</span>
          <span className="text-[10px] text-blue-500 font-semibold">orders created today · tap to view ↓</span>
        </button>

        {/* Pickup - Today Delivered + Collected */}
        <button
          type="button"
          onClick={() => { setActiveTab('pickup'); setDateFilter('today'); setSubFilter('delivered'); document.getElementById('orders-table-section')?.scrollIntoView({ behavior: 'smooth' }); }}
          className={`bg-blue-50/30 border rounded-2xl p-5 flex flex-col gap-1 shadow-sm text-left transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${activeTab === 'pickup' && dateFilter === 'today' && subFilter === 'delivered' ? 'border-green-400 ring-2 ring-green-300' : 'border-green-200'}`}
        >
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-green-700 opacity-80">🚚 Pickup · Today Delivered</span>
          <span className="text-3xl font-black font-serif text-green-800">{pickupTodayDeliveredCount}</span>
          <span className="text-[10px] text-green-600 font-bold font-mono">PKR {pickupTodayCollected.toFixed(0)} collected · tap to view ↓</span>
        </button>
      </div>

      {/* Active Orders Queue */}
      <div id="orders-table-section" className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* Tabs Block */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pos');
              setDateFilter('today');
              setSubFilter('all');
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'pos'
                ? 'border-[#cca43b] text-[#cca43b]'
                : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
          >
            POS Receipts ({posOrders.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('pickup');
              setDateFilter('today');
              setSubFilter('all');
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'pickup'
                ? 'border-[#cca43b] text-[#cca43b]'
                : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
          >
            Pickup Orders ({pickupOrders.length})
          </button>
        </div>

        {/* Filters and Search Bar Container */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              {activeTab === 'pickup' ? 'Online Dispatch Log Book' : 'In-Store Walk-in Log Book'}
            </h2>
            
          {/* Search Bar */}
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search by name, phone, order #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#cca43b] bg-white text-gray-850 shadow-sm"
                />
                <span className="absolute left-2.5 top-2.5 text-[10px]">🔍</span>
              </div>
            </div>
          </div>

          {/* ── Main 3 Date-Tab Filters ── */}
          <div className="flex gap-2 pt-2">
            {([
              { code: 'previous', label: '⏮ Previous', color: 'bg-slate-600 border-slate-600 text-white', inactive: 'bg-white border-gray-200 text-gray-500 hover:border-slate-400' },
              { code: 'today',    label: '📅 Today',    color: 'bg-[#cca43b] border-[#cca43b] text-black', inactive: 'bg-white border-gray-200 text-gray-500 hover:border-amber-400' },
              { code: 'coming',  label: '⏭ Coming',   color: 'bg-blue-600 border-blue-600 text-white', inactive: 'bg-white border-gray-200 text-gray-500 hover:border-blue-400' },
            ] as const).map((f) => {
              const tabOrders = activeTab === 'pos' ? posOrders : pickupOrders;
              const cnt = tabOrders.filter((o) => {
                const targetDate = getOrderTargetDate(o);
                const deliveryDate = getOrderDeliveryDate(o);
                if (f.code === 'today') {
                  return (targetDate >= startOfToday && targetDate <= endOfToday) || (deliveryDate >= startOfToday && deliveryDate <= endOfToday);
                }
                if (f.code === 'previous') return deliveryDate < startOfToday;
                if (f.code === 'coming') return targetDate > endOfToday;
                return true;
              }).length;
              return (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => { setDateFilter(f.code); setSubFilter('all'); }}
                  className={`px-5 py-2 rounded-full text-[10px] font-extrabold tracking-wider uppercase transition-all border-2 cursor-pointer shadow-sm ${
                    dateFilter === f.code ? f.color : f.inactive
                  }`}
                >
                  {f.label} <span className="font-mono">({cnt})</span>
                </button>
              );
            })}
          </div>

          {/* ── Sub-Filters (always visible) ── */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider self-center mr-1">Filter:</span>
            {([
              { code: 'all',               label: 'All' },
              { code: 'unpaid',            label: '🔴 Unpaid' },
              { code: 'paid',              label: '🟢 Paid' },
              { code: 'partial_paid',      label: '🟡 Partial Paid' },
              { code: 'delivered',         label: '✅ Delivered' },
              { code: 'partial_delivered', label: '🔀 Part. Delivered' },
            ] as const).map((sf) => {
              // Count against already-date-filtered orders
              const tabOrders = activeTab === 'pos' ? posOrders : pickupOrders;
              const dateFiltered = tabOrders.filter((o) => {
                const targetDate = getOrderTargetDate(o);
                const deliveryDate = getOrderDeliveryDate(o);
                if (dateFilter === 'today') return (targetDate >= startOfToday && targetDate <= endOfToday) || (deliveryDate >= startOfToday && deliveryDate <= endOfToday);
                if (dateFilter === 'previous') return deliveryDate < startOfToday;
                if (dateFilter === 'coming') return targetDate > endOfToday;
                return true;
              });
              const cnt = sf.code === 'all'
                ? dateFiltered.length
                : dateFiltered.filter((o) => {
                    const payStatus = o.payment_status || 'unpaid';
                    const delivStatus = getDeliveryStatus(o);
                    if (sf.code === 'paid') return payStatus === 'paid';
                    if (sf.code === 'unpaid') return payStatus === 'unpaid';
                    if (sf.code === 'partial_paid') return payStatus === 'partial_paid';
                    if (sf.code === 'delivered') return delivStatus === 'delivered';
                    if (sf.code === 'partial_delivered') return delivStatus === 'partial';
                    return false;
                  }).length;
              return (
                <button
                  key={sf.code}
                  type="button"
                  onClick={() => setSubFilter(sf.code)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all border cursor-pointer ${
                    subFilter === sf.code
                      ? 'bg-slate-800 border-slate-800 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {sf.label} ({cnt})
                </button>
              );
            })}
          </div>
        </div>


        {/* Orders Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4">Order Code</th>
                <th className="py-4">Customer Details</th>
                <th className="py-4">Scheduled Date</th>
                <th className="py-4">Total</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processedOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50 group">
                  <td 
                    onClick={() => handleViewDetails(o.id)}
                    className="py-4 font-mono font-bold text-[#cca43b] cursor-pointer hover:underline"
                  >
                    {o.order_number}
                  </td>
                  <td 
                    onClick={() => handleViewDetails(o.id)}
                    className="py-4 cursor-pointer"
                  >
                    <span className="font-semibold block text-[#1a1d20] group-hover:text-[#cca43b] transition-colors">
                      {o.customer
                        ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`
                        : (o.metadata?.customer_name || 'Guest User')
                      }
                    </span>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      {o.customer
                        ? (o.customer.phone || o.customer.email || 'N/A')
                        : (o.metadata?.phone || 'N/A')
                      }
                    </span>
                  </td>
                  <td className="py-4 text-gray-650">
                    {o.order_type === 'pos' ? (
                      <>
                        <span className="font-semibold block text-amber-800 bg-amber-50/50 border border-amber-100/50 px-2 py-0.5 rounded-lg text-[10px] w-fit mb-1">
                          Self Drop/Pickup
                        </span>
                        <span className="font-semibold block">
                          In: {new Date(getOrderTargetDate(o)).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-semibold">
                          Out: {new Date(getOrderDeliveryDate(o)).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold block text-blue-800 bg-blue-50/50 border border-blue-100/50 px-2 py-0.5 rounded-lg text-[10px] w-fit mb-1">
                          Rider Pick/Delivery
                        </span>
                        <span className="font-semibold block">
                          In: {new Date(getOrderTargetDate(o)).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-semibold">
                          Out: {new Date(getOrderDeliveryDate(o)).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="py-4 text-gray-800">
                    <span className="font-bold block text-sm">PKR {o.grand_total}</span>
                    <span className="mt-1 block">
                      {o.payment_status === 'paid' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-100">
                          Paid
                        </span>
                      ) : o.payment_status === 'partial_paid' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          Part Paid (PKR {o.amount_paid})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-100">
                          Unpaid
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1.5">
                      <select
                        value={o.status?.code || ''}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[10px] bg-white focus:outline-none text-gray-800 font-medium cursor-pointer"
                      >
                        {(o.order_type === 'pos' ? posStatusOptions : pickupStatusOptions).map((opt) => (
                          <option key={opt.code} value={opt.code}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="block">
                        {(() => {
                          const deliveryStatus = getDeliveryStatus(o);
                          if (deliveryStatus === 'delivered') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-800 border border-green-200">
                                Released
                              </span>
                            );
                          } else if (deliveryStatus === 'partial') {
                            const totalQty = o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
                            const deliveredQty = o.items?.reduce((sum: number, i: any) => sum + (i.quantity_delivered || 0), 0) || 0;
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Part Released ({deliveredQty}/{totalQty})
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                                Pending Release
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => handleViewDetails(o.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors font-semibold border border-gray-200 cursor-pointer text-[10px] w-full text-center"
                      >
                        👁️ Details
                      </button>
                      {isOrderFullySettled(o) ? (
                        <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 w-full text-center">
                          ✅ Fully Settled
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenReleaseModal(o, 'full')}
                            className="px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-600 hover:text-white text-green-700 transition-colors font-semibold border border-green-200 cursor-pointer text-[10px] w-full"
                          >
                            ✅ Full Paid & Release
                          </button>
                          <button
                            onClick={() => handleOpenReleaseModal(o, 'partial')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-[#cca43b] hover:text-black text-amber-700 transition-colors font-semibold border border-amber-200 cursor-pointer text-[10px] w-full"
                          >
                            🔀 Partial Paid & Release
                          </button>
                        </>
                      )}
                      {o.order_type === 'pickup' && (
                        <button
                          onClick={() => setAssigningOrderId(o.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-[#cca43b] hover:text-black transition-colors font-semibold border border-gray-100 cursor-pointer text-[10px] w-full"
                        >
                          Assign Rider
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {processedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 font-bold">
                    No orders matching this combination of search and filters are currently logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Dispatch Modal Popover */}
      {assigningOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-gray-100 shadow-xl">
            <h3 className="text-base font-bold text-[#1a1d20] mb-4 font-serif">Rider Dispatch</h3>
            
            <form onSubmit={handleAssignRiderSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Rider User ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. supabase-auth-id-1234"
                  value={riderUserId}
                  onChange={(e) => setRiderUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none bg-white text-gray-850"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Task Type</label>
                <select
                  value={taskTypeCode}
                  onChange={(e) => setTaskTypeCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none text-gray-850"
                >
                  <option value="pickup">Rider Pickup Task</option>
                  <option value="delivery">Rider Delivery Task</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setAssigningOrderId(null)}
                  className="w-1/2 py-3 rounded-xl border border-gray-200 font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-[#cca43b] text-black font-bold hover:bg-[#e0b84c] cursor-pointer"
                >
                  Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Order Summary Modal Popover */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-gray-100 shadow-xl overflow-y-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                  Order Details
                </span>
                <h3 className="text-lg font-extrabold text-[#1a1d20] font-serif flex items-center gap-2">
                  <span>{selectedOrderDetails.order_number}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-105 text-slate-700 font-extrabold uppercase font-sans">
                    {selectedOrderDetails.order_type === 'pos' ? '🏪 POS Counter' : '🚚 Online Pickup'}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs text-slate-700">
              
              {/* Left Column: Info details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-[10px] uppercase text-[#cca43b] tracking-wider mb-1">Customer Information</h4>
                  <div className="bg-amber-50/20 border border-amber-100/30 p-3 rounded-2xl space-y-1">
                    <p className="font-bold text-gray-800">
                      {selectedOrderDetails.customer
                        ? `${selectedOrderDetails.customer.first_name || ''} ${selectedOrderDetails.customer.last_name || ''}`
                        : (selectedOrderDetails.metadata?.customer_name || 'Guest User')
                      }
                    </p>
                    <p className="font-mono text-gray-500">
                      Phone: {selectedOrderDetails.customer
                        ? (selectedOrderDetails.customer.phone || 'N/A')
                        : (selectedOrderDetails.metadata?.phone || 'N/A')
                      }
                    </p>
                    {selectedOrderDetails.customer?.email && (
                      <p className="text-gray-500">Email: {selectedOrderDetails.customer.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[10px] uppercase text-[#cca43b] tracking-wider mb-1">Status & Timeline</h4>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1">
                    <p className="font-semibold text-gray-800">
                      Current Status: <span className="font-bold uppercase text-slate-750">{selectedOrderDetails.status?.label || 'Unknown'}</span>
                    </p>
                    <p className="text-gray-500">
                      Created At: {new Date(selectedOrderDetails.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Schedule & Metadata */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-[10px] uppercase text-[#cca43b] tracking-wider mb-1">Schedule Details</h4>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1">
                    <p className="font-semibold text-gray-800">
                      Order Date: {selectedOrderDetails.pickup_date ? new Date(selectedOrderDetails.pickup_date).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="font-semibold text-gray-850">
                      Expected Delivery: {selectedOrderDetails.delivery_date ? new Date(selectedOrderDetails.delivery_date).toLocaleDateString() : 'N/A'}
                    </p>
                    {selectedOrderDetails.address && (
                      <p className="text-gray-500 mt-2 pt-2 border-t border-slate-200">
                        Delivery Address: {selectedOrderDetails.address.address_line_1}, {selectedOrderDetails.address.city}
                      </p>
                    )}
                  </div>
                </div>

                {selectedOrderDetails.special_instructions && (
                  <div>
                    <h4 className="font-bold text-[10px] uppercase text-[#cca43b] tracking-wider mb-1">Special Notes</h4>
                    <div className="bg-red-50/30 border border-red-100/30 p-3 rounded-2xl text-red-800 font-medium font-sans">
                      {selectedOrderDetails.special_instructions}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Items List */}
            <div className="border border-slate-100 rounded-3xl overflow-hidden mb-6">
              <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100">
                <h4 className="font-extrabold text-[10px] uppercase text-gray-500 tracking-wider">Order Items Selection</h4>
              </div>
              <div className="divide-y divide-slate-50 text-xs">
                {(selectedOrderDetails.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50/30">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {item.item_name_snapshot || 'Laundry Item'}
                      </span>
                      <span className="text-[9px] text-[#cca43b] font-bold uppercase tracking-wider block">
                        {item.service_name_snapshot || 'Service Option'}
                      </span>
                      <span className="text-[10px] text-gray-500 block font-medium mt-0.5">
                        Released/Delivered: <span className="font-bold text-slate-850">{item.quantity_delivered || 0} / {item.quantity}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-500 block text-[10px]">
                        PKR {item.unit_price} x {item.quantity}
                      </span>
                      <span className="font-bold text-slate-800 block">
                        PKR {item.line_total}
                      </span>
                    </div>
                  </div>
                ))}
                
                {(!selectedOrderDetails.items || selectedOrderDetails.items.length === 0) && (
                  <div className="p-4 text-center text-gray-400 font-semibold uppercase text-[10px]">
                    No specific items list selected (Quick Booking)
                  </div>
                )}
              </div>
            </div>

            {/* Totals Block Summary */}
            <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl space-y-2.5 text-xs mb-6">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal Selection</span>
                <span className="font-semibold">PKR {selectedOrderDetails.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrderDetails.service_fee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Service Delivery Fee</span>
                  <span className="font-semibold">PKR {selectedOrderDetails.service_fee.toFixed(2)}</span>
                </div>
              )}
              {selectedOrderDetails.discount_total > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Special Coupon Discount</span>
                  <span>- PKR {selectedOrderDetails.discount_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200/60 pt-3 text-sm font-extrabold text-[#1a1d20] font-serif">
                <span>GRAND TOTAL</span>
                <span className="text-[#cca43b]">PKR {selectedOrderDetails.grand_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-650 pt-1">
                <span>Amount Paid</span>
                <span className="font-bold text-green-700 font-mono">PKR {(selectedOrderDetails.amount_paid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-650 pt-0.5">
                <span>Remaining Balance</span>
                <span className="font-bold text-red-700 font-mono">
                  PKR {Math.max(0, selectedOrderDetails.grand_total - (selectedOrderDetails.amount_paid || 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-650 pt-0.5">
                <span>Payment Status</span>
                <span className={`font-extrabold uppercase ${
                  selectedOrderDetails.payment_status === 'paid' ? 'text-green-700' :
                  selectedOrderDetails.payment_status === 'partial_paid' ? 'text-amber-700' : 'text-red-750'
                }`}>
                  {selectedOrderDetails.payment_status || 'unpaid'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="flex-1 min-w-[120px] py-3 rounded-xl border border-gray-200 font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer text-xs"
              >
                Close Window
              </button>
              
              <button
                onClick={() => {
                  handleOpenReleaseModal(selectedOrderDetails);
                }}
                className="flex-1 min-w-[120px] py-3 rounded-xl bg-amber-50 hover:bg-[#cca43b] hover:text-black text-amber-750 font-bold border border-amber-200 cursor-pointer text-xs"
              >
                💸 Release / Pay
              </button>
              
              {selectedOrderDetails.order_type === 'pos' && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${
                    (selectedOrderDetails.metadata?.phone || '').replace(/[^0-9]/g, '').startsWith('0') 
                      ? '92' + (selectedOrderDetails.metadata?.phone || '').replace(/[^0-9]/g, '').slice(1) 
                      : (selectedOrderDetails.metadata?.phone || '').replace(/[^0-9]/g, '')
                  }&text=${encodeURIComponent(
                    `*AWAIS DRY CLEANERS*\n` +
                    `==============================\n` +
                    `*Receipt #:* ${selectedOrderDetails.order_number}\n` +
                    `*Date:* ${new Date(selectedOrderDetails.created_at).toLocaleDateString()}\n` +
                    `==============================\n` +
                    `*Customer:* ${selectedOrderDetails.metadata?.customer_name || 'Guest'}\n` +
                    `*Phone:* ${selectedOrderDetails.metadata?.phone || 'N/A'}\n` +
                    `==============================\n` +
                    `*GRAND TOTAL:* PKR ${selectedOrderDetails.grand_total.toFixed(2)}\n` +
                    `==============================\n` +
                    `Thank you for your visit!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[120px] py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>💬 Share WhatsApp</span>
                </a>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Release & Payment Modal */}
      {releasingOrder && (() => {
        const grandTotal = releasingOrder.grand_total || 0;
        const alreadyPaid = releasingOrder.amount_paid || 0;
        const remaining = Math.max(0, grandTotal - alreadyPaid);

        // Compute auto amount for partial from items
        const partialAutoAmount = Object.entries(releaseItems).reduce((sum, [id, qty]) => {
          return sum + qty * (releaseItemPrices[id] || 0);
        }, 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-100 shadow-xl overflow-y-auto max-h-[90vh]">

              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Release & Payment</span>
                  <h3 className="text-base font-extrabold text-[#1a1d20] font-serif">{releasingOrder.order_number}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {releasingOrder.metadata?.customer_name || releasingOrder.customer?.first_name || 'Customer'}
                    {' '}&bull;{' '}
                    {releasingOrder.metadata?.phone || releasingOrder.customer?.phone || ''}
                  </p>
                </div>
                <button onClick={() => setReleasingOrder(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-lg">✕</button>
              </div>

              {/* Payment Summary Banner */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Grand Total', value: grandTotal.toFixed(2), color: 'bg-slate-50 text-slate-700 border-slate-200' },
                  { label: 'Already Paid', value: alreadyPaid.toFixed(2), color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Remaining', value: remaining.toFixed(2), color: remaining > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200' },
                ].map((c, i) => (
                  <div key={i} className={`${c.color} border rounded-2xl p-3 text-center`}>
                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">{c.label}</span>
                    <span className="text-sm font-extrabold font-mono block">PKR {c.value}</span>
                  </div>
                ))}
              </div>

              {/* Mode selector — Two big action buttons */}
              <div className="flex gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleOpenReleaseModal(releasingOrder, 'full')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-extrabold border-2 transition-all cursor-pointer ${
                    releaseMode === 'full'
                      ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700'
                  }`}
                >
                  <span className="block text-base mb-0.5">✅</span>
                  Full Paid & Release
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenReleaseModal(releasingOrder, 'partial')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-extrabold border-2 transition-all cursor-pointer ${
                    releaseMode === 'partial'
                      ? 'bg-[#cca43b] border-[#cca43b] text-black shadow-lg shadow-amber-200'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-700'
                  }`}
                >
                  <span className="block text-base mb-0.5">🔀</span>
                  Partial Paid & Release
                </button>
              </div>

              <form onSubmit={handleReleaseSubmit} className="space-y-4 text-xs">

                {/* FULL MODE — simple confirmation block */}
                {releaseMode === 'full' && (
                  <div className="bg-green-50/50 border border-green-200 rounded-2xl p-4 text-xs text-green-800">
                    <p className="font-bold text-sm mb-1">✅ Full Paid & Release</p>
                    <p>All remaining items will be marked as <strong>released/delivered</strong>.</p>
                    <p className="mt-1">Full remaining balance of <strong className="font-mono">PKR {remaining.toFixed(2)}</strong> will be recorded as collected.</p>
                  </div>
                )}

                {/* PARTIAL MODE — item list with qty inputs */}
                {releaseMode === 'partial' && releasingOrder.items && releasingOrder.items.length > 0 && (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Items to Release</span>
                      <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        Auto-calculates amount ↓
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {releasingOrder.items.map((item: any) => {
                        const alreadyReleased = item.quantity_delivered || 0;
                        const maxRemaining = Math.max(0, item.quantity - alreadyReleased);
                        const currentQty = releaseItems[item.id] ?? 0;
                        const lineValue = currentQty * (releaseItemPrices[item.id] || 0);
                        return (
                          <div key={item.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800">{item.item_name_snapshot || 'Item'}</p>
                                <p className="text-[9px] text-[#cca43b] font-bold uppercase tracking-wider">{item.service_name_snapshot || ''}</p>
                                <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                                  PKR {(item.unit_price || 0).toFixed(2)} × each &bull; Released: {alreadyReleased}/{item.quantity} &bull; Remaining: {maxRemaining}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-xs text-slate-800 font-mono">PKR {lineValue.toFixed(2)}</p>
                                <p className="text-[9px] text-gray-400">this release</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePartialItemQtyChange(item.id, currentQty - 1, maxRemaining)}
                                disabled={currentQty <= 0}
                                className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-base leading-none flex items-center justify-center"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={maxRemaining}
                                value={currentQty}
                                onChange={(e) => handlePartialItemQtyChange(item.id, parseInt(e.target.value) || 0, maxRemaining)}
                                className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center font-bold focus:outline-none focus:border-[#cca43b]"
                              />
                              <button
                                type="button"
                                onClick={() => handlePartialItemQtyChange(item.id, currentQty + 1, maxRemaining)}
                                disabled={currentQty >= maxRemaining}
                                className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-base leading-none flex items-center justify-center"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePartialItemQtyChange(item.id, maxRemaining, maxRemaining)}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-[9px] font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                              >
                                All
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Partial sub-total line */}
                    <div className="bg-amber-50/50 border-t border-amber-100 px-4 py-2.5 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-amber-800">Items Sub-total (this release)</span>
                      <span className="font-extrabold font-mono text-amber-800">PKR {partialAutoAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payment Collection */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] uppercase text-gray-500 tracking-wider">Payment to Collect Now</h4>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">
                      Amount (PKR)
                      {releaseMode === 'partial' && !amountManuallyEdited && (
                        <span className="ml-2 text-[9px] text-amber-600 normal-case">(auto from items — edit to override)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={paymentAmountCollectedNow}
                      onChange={(e) => {
                        setPaymentAmountCollectedNow(e.target.value);
                        setAmountManuallyEdited(true);
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none bg-white ${
                        amountManuallyEdited ? 'border-[#cca43b] ring-1 ring-amber-200' : 'border-gray-200'
                      }`}
                      placeholder="0.00"
                    />
                    {amountManuallyEdited && releaseMode === 'partial' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmountManuallyEdited(false);
                          setPaymentAmountCollectedNow(partialAutoAmount.toFixed(2));
                        }}
                        className="mt-1 text-[9px] text-amber-700 font-semibold hover:underline cursor-pointer"
                      >
                        ↩ Reset to item auto-total (PKR {partialAutoAmount.toFixed(2)})
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Payment Method</label>
                    <select
                      value={paymentMethodCode}
                      onChange={(e) => setPaymentMethodCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#cca43b] text-gray-850"
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Credit / Debit Card</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="easypaisa">📱 EasyPaisa</option>
                      <option value="jazzcash">📱 JazzCash</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReleasingOrder(null)}
                    className="w-1/2 py-3 rounded-xl border border-gray-200 font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRelease}
                    className={`w-1/2 py-3 rounded-xl font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-xs ${
                      releaseMode === 'full'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-[#cca43b] hover:bg-[#e0b84c] text-black'
                    }`}
                  >
                    {submittingRelease
                      ? 'Processing...'
                      : releaseMode === 'full'
                      ? '✅ Confirm Full Paid & Release'
                      : '🔀 Confirm Partial Paid & Release'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
