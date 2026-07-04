'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, DashboardStats } from '@/lib/api/admin.api';
import { Order } from '@/types/api.types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dispatch state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [riderUserId, setRiderUserId] = useState('');
  const [taskTypeCode, setTaskTypeCode] = useState('pickup');

  // Load KPI stats and orders lists
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const statsData = await adminApi.getDashboardStats();
        setStats(statsData);

        const ordersRes = await adminApi.getOrders(page, 20, statusFilter || undefined);
        setOrders(ordersRes.items || []);
        setTotalPages(ordersRes.pagination?.totalPages || 1);
      } catch (err: any) {
        setError(err.message || 'Access Denied or Database Connection Error.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [page, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatusCode: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatusCode);
      // Reload orders list
      const ordersRes = await adminApi.getOrders(page, 20, statusFilter || undefined);
      setOrders(ordersRes.items || []);
      const statsData = await adminApi.getDashboardStats();
      setStats(statsData);
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

  const statusOptions = [
    { code: 'pending_confirmation', label: 'Pending' },
    { code: 'pickup_assigned', label: 'Rider Dispatched' },
    { code: 'received_at_facility', label: 'Received' },
    { code: 'cleaning', label: 'Cleaning' },
    { code: 'ready_for_delivery', label: 'Ready' },
    { code: 'delivered', label: 'Delivered' },
    { code: 'cancelled', label: 'Cancelled' },
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading administration panel...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">🔐</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restrained</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Admin permission rules prevent loading logs. Verify your super-admin session or retry connections.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c]"
        >
          Retry Access
        </button>
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

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Today Orders', value: stats.todayOrders, color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { label: 'Pending Pickups', value: stats.pendingPickup, color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { label: 'In Cleaning', value: stats.inCleaning, color: 'bg-purple-50 text-purple-700 border-purple-100' },
            { label: 'Ready Delivery', value: stats.readyForDelivery, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
            { label: 'Completed', value: stats.completed, color: 'bg-green-50 text-green-700 border-green-100' },
            { label: 'Revenue Est.', value: `PKR ${stats.revenueEstimate}`, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          ].map((card, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${card.color} shadow-sm text-center`}>
              <span className="text-[10px] uppercase font-semibold opacity-70 tracking-wider block mb-1">
                {card.label}
              </span>
              <span className="text-lg font-bold tracking-tight font-serif">
                {card.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Active Orders Queue */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-[#1a1d20] font-serif">Order Log Book</h2>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-4">Order Code</th>
                <th className="py-4">Customer Details</th>
                <th className="py-4">Total</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="py-4 font-mono font-bold text-gray-700">{o.order_number}</td>
                  <td className="py-4">
                    <span className="font-semibold block text-[#1a1d20]">
                      {o.customer?.first_name || 'Guest User'} {o.customer?.last_name || ''}
                    </span>
                    <span className="text-[10px] text-gray-400 block">{o.customer?.email || 'N/A'}</span>
                  </td>
                  <td className="py-4 font-bold text-[#cca43b]">PKR {o.grand_total}</td>
                  <td className="py-4">
                    <select
                      value={o.status?.code || ''}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[10px] bg-white focus:outline-none"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setAssigningOrderId(o.id)}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#cca43b] hover:text-black transition-colors font-medium border border-gray-100"
                    >
                      Assign Rider
                    </button>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    No orders matching this status code are currently logged.
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Task Type</label>
                <select
                  value={taskTypeCode}
                  onChange={(e) => setTaskTypeCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none"
                >
                  <option value="pickup">Rider Pickup Task</option>
                  <option value="delivery">Rider Delivery Task</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setAssigningOrderId(null)}
                  className="w-1/2 py-3 rounded-xl border border-gray-200 font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-[#cca43b] text-black font-bold hover:bg-[#e0b84c]"
                >
                  Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
