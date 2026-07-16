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
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'previous'>('all');
  const [statusFilter, setStatusFilter] = useState('');

  // Dispatch state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [riderUserId, setRiderUserId] = useState('');
  const [taskTypeCode, setTaskTypeCode] = useState('pickup');

  // Details Modal state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Load orders lists dynamically based on search and status filters
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [posRes, onlineRes] = await Promise.all([
          adminApi.getPosOrders(1, 200, searchQuery || undefined, statusFilter || undefined),
          adminApi.getPickupOrders(1, 200, searchQuery || undefined, statusFilter || undefined),
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
  }, [searchQuery, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatusCode: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatusCode);
      // Reload orders list
      const [posRes, onlineRes] = await Promise.all([
        adminApi.getPosOrders(1, 200, searchQuery || undefined, statusFilter || undefined),
        adminApi.getPickupOrders(1, 200, searchQuery || undefined, statusFilter || undefined),
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

  // Dynamic KPI Counts calculations matching user request (separated by POS vs Pickup)
  let posTodayReceived = 0;
  let posTodayReady = 0;
  let posOverdue = 0;
  let posUpcoming = 0;

  let pickupTodayReceived = 0;
  let pickupTodayReady = 0;
  let pickupOverdue = 0;
  let pickupUpcoming = 0;

  posOrders.forEach((o) => {
    const createdAtDate = new Date(o.created_at);
    const targetDate = getOrderTargetDate(o);
    const deliveryDate = getOrderDeliveryDate(o);
    const statusCode = o.status?.code || '';
    const isFinalStatus = ['delivered', 'completed', 'cancelled', 'failed'].includes(statusCode);

    // Is it Today Received? (created today)
    const isTodayReceived = createdAtDate >= startOfToday && createdAtDate <= endOfToday;
    // Is it Today Ready? (status is ready AND delivery date is today)
    const isTodayReady = (statusCode === 'ready_for_delivery') && (deliveryDate >= startOfToday && deliveryDate <= endOfToday);
    // Is it Overdue? (delivery date in past, not completed/delivered/cancelled/failed)
    const isOverdueOrder = deliveryDate < startOfToday && !isFinalStatus;
    // Is it Upcoming? (delivery date is in the future, not finalized)
    const isUpcomingOrder = deliveryDate > endOfToday && !isFinalStatus;

    if (isTodayReceived) posTodayReceived++;
    if (isTodayReady) posTodayReady++;
    if (isOverdueOrder) posOverdue++;
    if (isUpcomingOrder) posUpcoming++;
  });

  pickupOrders.forEach((o) => {
    const createdAtDate = new Date(o.created_at);
    const targetDate = getOrderTargetDate(o);
    const deliveryDate = getOrderDeliveryDate(o);
    const statusCode = o.status?.code || '';
    const isFinalStatus = ['delivered', 'completed', 'cancelled', 'failed'].includes(statusCode);

    // Is it Today Received? (created today)
    const isTodayReceived = createdAtDate >= startOfToday && createdAtDate <= endOfToday;
    // Is it Today Ready? (status is ready AND delivery date is today)
    const isTodayReady = (statusCode === 'ready_for_delivery') && (deliveryDate >= startOfToday && deliveryDate <= endOfToday);
    // Is it Overdue? (delivery date in past, not completed/delivered/cancelled/failed)
    const isOverdueOrder = deliveryDate < startOfToday && !isFinalStatus;
    // Is it Upcoming? (delivery date is in the future, not finalized)
    const isUpcomingOrder = deliveryDate > endOfToday && !isFinalStatus;

    if (isTodayReceived) pickupTodayReceived++;
    if (isTodayReady) pickupTodayReady++;
    if (isOverdueOrder) pickupOverdue++;
    if (isUpcomingOrder) pickupUpcoming++;
  });

  let processedOrders = activeTab === 'pos' ? posOrders : pickupOrders;

  // 2. Date category filtering
  if (dateFilter !== 'all') {
    processedOrders = processedOrders.filter((o) => {
      const targetDate = getOrderTargetDate(o);
      const deliveryDate = getOrderDeliveryDate(o);
      const statusCode = o.status?.code || '';
      const isFinalStatus = ['delivered', 'completed', 'cancelled', 'failed'].includes(statusCode);

      if (dateFilter === 'today') {
        return targetDate >= startOfToday && targetDate <= endOfToday;
      }
      if (dateFilter === 'upcoming') {
        return targetDate > endOfToday && !isFinalStatus;
      }
      if (dateFilter === 'overdue') {
        return deliveryDate < startOfToday && !isFinalStatus;
      }
      if (dateFilter === 'previous') {
        return isFinalStatus || deliveryDate < startOfToday;
      }
      return true;
    });
  }

  // 3. Status Code filtering
  if (statusFilter) {
    processedOrders = processedOrders.filter((o) => o.status?.code === statusFilter);
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

      {/* KPI Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* POS Stats */}
        <div className="bg-[#fffdf9] border border-amber-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200/40 pb-2 flex justify-between items-center">
            <span>🏪 In-Store POS Receipts</span>
            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-amber-100/50 text-amber-800 font-extrabold uppercase font-sans">
              POS Counters
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Today Received', value: posTodayReceived, color: 'bg-amber-50 text-amber-700 border-amber-100' },
              { label: 'Today Ready', value: posTodayReady, color: 'bg-green-50 text-green-700 border-green-100' },
              { label: 'Overdue Logs', value: posOverdue, color: 'bg-red-50 text-red-700 border-red-100' },
              { label: 'Upcoming Delivery', value: posUpcoming, color: 'bg-blue-50 text-blue-700 border-blue-100' }
            ].map((card, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${card.color} text-center shadow-xs`}>
                <span className="text-[9px] uppercase font-bold opacity-85 tracking-wider block mb-0.5">{card.label}</span>
                <span className="text-base font-extrabold font-serif">{card.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup Stats */}
        <div className="bg-blue-50/10 border border-blue-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200/40 pb-2 flex justify-between items-center">
            <span>🚚 Online Pickup Orders</span>
            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-blue-100/50 text-blue-850 font-extrabold uppercase font-sans">
              Pickup Counters
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Today Received', value: pickupTodayReceived, color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { label: 'Today Ready', value: pickupTodayReady, color: 'bg-green-50 text-green-700 border-green-100' },
              { label: 'Overdue Logs', value: pickupOverdue, color: 'bg-red-50 text-red-700 border-red-100' },
              { label: 'Upcoming Delivery', value: pickupUpcoming, color: 'bg-purple-50 text-purple-700 border-purple-100' }
            ].map((card, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${card.color} text-center shadow-xs`}>
                <span className="text-[9px] uppercase font-bold opacity-85 tracking-wider block mb-0.5">{card.label}</span>
                <span className="text-base font-extrabold font-serif">{card.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Active Orders Queue */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* Tabs Block */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pos');
              setDateFilter('all');
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
              setDateFilter('all');
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
            
            {/* Search and Status Select */}
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

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none text-gray-800"
              >
                <option value="">All Statuses</option>
                {(activeTab === 'pos' ? posStatusOptions : pickupStatusOptions).map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {[
              { code: 'all', label: 'All Orders' },
              { code: 'today', label: 'Today' },
              { code: 'overdue', label: 'Overdue' },
              { code: 'upcoming', label: 'Upcoming' },
              { code: 'previous', label: 'Previous' }
            ].map((f) => {
              // Count for this filter item (calculated dynamically for the currently active tab)
              const tabOrders = activeTab === 'pos' ? posOrders : pickupOrders;
              const count = tabOrders.filter((o) => {
                // Date filter
                if (f.code === 'all') return true;
                const targetDate = getOrderTargetDate(o);
                const deliveryDate = getOrderDeliveryDate(o);
                const statusCode = o.status?.code || '';
                const isFinalStatus = ['delivered', 'completed', 'cancelled', 'failed'].includes(statusCode);

                if (f.code === 'today') return targetDate >= startOfToday && targetDate <= endOfToday;
                if (f.code === 'upcoming') return targetDate > endOfToday && !isFinalStatus;
                if (f.code === 'overdue') return deliveryDate < startOfToday && !isFinalStatus;
                if (f.code === 'previous') return isFinalStatus || deliveryDate < startOfToday;
                return true;
              }).length;

              return (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => setDateFilter(f.code as any)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-150 border cursor-pointer ${
                    dateFilter === f.code
                      ? 'bg-[#cca43b] border-[#cca43b] text-black shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {f.label} ({count})
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
                  <td className="py-4 font-bold text-gray-800">PKR {o.grand_total}</td>
                  <td className="py-4">
                    <select
                      value={o.status?.code || ''}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[10px] bg-white focus:outline-none text-gray-800 font-medium cursor-pointer"
                    >
                      {(o.order_type === 'pos' ? posStatusOptions : pickupStatusOptions).map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(o.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-150 text-gray-650 transition-colors font-semibold border border-gray-150 cursor-pointer text-[10px]"
                      >
                        👁️ Details
                      </button>
                      {o.order_type === 'pickup' && (
                        <button
                          onClick={() => setAssigningOrderId(o.id)}
                          className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#cca43b] hover:text-black transition-colors font-semibold border border-gray-100 cursor-pointer text-[10px]"
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
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-1/2 py-3 rounded-xl border border-gray-200 font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer text-xs"
              >
                Close Window
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
                  className="w-1/2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>💬 Share WhatsApp</span>
                </a>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
