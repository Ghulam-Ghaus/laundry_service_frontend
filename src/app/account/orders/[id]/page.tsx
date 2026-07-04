'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders.api';
import { Order } from '@/types/api.types';

export default function OrderTracker() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadOrder() {
      try {
        setLoading(true);
        const data = await ordersApi.getOrderById(id);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  // Stage resolver based on order status codes
  const resolveActiveStage = (statusCode: string): number => {
    switch (statusCode) {
      case 'pending_confirmation':
        return 1;
      case 'pickup_assigned':
      case 'received_at_facility':
        return 2;
      case 'cleaning':
        return 3;
      case 'ready_for_delivery':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersApi.cancelOrder(order.id);
      alert('Order cancelled successfully.');
      // Reload order details
      const data = await ordersApi.getOrderById(id);
      setOrder(data);
    } catch (err: any) {
      alert(err.message || 'Cancellation failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading live tracking...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">🔍</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Order Not Logged</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Could not fetch real-time logs for this order reference. Verify code credentials.
        </p>
        <Link
          href="/account"
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c]"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const activeStage = resolveActiveStage(order.status?.code || '');
  const stages = [
    { num: 1, label: 'Pending Book' },
    { num: 2, label: 'Collected' },
    { num: 3, label: 'Cleaning' },
    { num: 4, label: 'Ready Delivery' },
    { num: 5, label: 'Delivered' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-10 animate-fade-in-up">
      
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="text-[#cca43b] text-[10px] font-extrabold tracking-widest uppercase block mb-1">
            Order tracking info
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-serif">
            Booking {order.order_number}
          </h1>
        </div>

        {order.status?.code === 'pending_confirmation' && (
          <button
            onClick={handleCancelOrder}
            className="px-5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-650 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Progress Timeline Stepper */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative">
          
          {/* Progress Connecting Line */}
          <div className="hidden sm:block absolute top-[15px] left-8 right-8 h-0.5 bg-slate-100 -z-10">
            <div 
              className="h-full bg-gradient-to-r from-[#cca43b] to-[#e0b84c] transition-all duration-500 rounded-full" 
              style={{ width: `${((activeStage - 1) / 4) * 100}%` }}
            />
          </div>

          {stages.map((stage) => (
            <div key={stage.num} className="flex sm:flex-col items-center gap-4 text-center">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center border font-extrabold text-xs transition-all ${
                  activeStage >= stage.num
                    ? 'border-[#cca43b] bg-[#cca43b]/10 text-[#cca43b] shadow-md shadow-[#cca43b]/5'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {stage.num}
              </span>
              <span
                className={`text-[9px] uppercase font-extrabold tracking-wider ${
                  activeStage >= stage.num ? 'text-slate-800' : 'text-slate-450'
                }`}
              >
                {stage.label}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Item Summaries */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 text-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 font-serif border-b border-slate-100 pb-3">
            Laundry Inventory
          </h3>

          {!order.is_item_selection_skipped ? (
            <div className="space-y-3.5">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-800">{item.item_name_snapshot}</h4>
                    <span className="text-[10px] text-slate-450 font-medium">Qty: {item.quantity} &times; PKR {item.unit_price}</span>
                  </div>
                  <span className="font-extrabold text-slate-700">PKR {item.line_total}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 font-medium">
              Count on intake selected. Items will list once collected by courier rider.
            </div>
          )}
        </div>

        {/* Schedule & Billing Info */}
        <div className="space-y-6">
          {/* Schedule Recap */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-serif border-b border-slate-100 pb-3 mb-2">
              Schedules Details
            </h3>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Pickup Slot</span>
              <span className="font-semibold text-slate-700 bg-slate-50 border border-slate-100/50 px-2.5 py-1 rounded">
                📅 {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString() : 'N/A'}{' '}
                {order.pickup_slot?.label && `(${order.pickup_slot.label})`}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Delivery Slot</span>
              <span className="font-semibold text-slate-700 bg-slate-50 border border-slate-100/50 px-2.5 py-1 rounded">
                🚚 {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}{' '}
                {order.delivery_slot?.label && `(${order.delivery_slot.label})`}
              </span>
            </div>
          </div>

          {/* Billing card */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 text-xs space-y-3.5 border border-slate-100/50">
            <h3 className="text-sm font-bold text-slate-900 font-serif border-b border-slate-200 pb-3 mb-2">
              Invoice Summary
            </h3>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span>PKR {order.subtotal}</span>
            </div>
            {order.service_fee > 0 && (
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Service Fee</span>
                <span>PKR {order.service_fee}</span>
              </div>
            )}
            {order.discount_total > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Discount Total</span>
                <span>- PKR {order.discount_total}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-3">
              <span>Grand Total</span>
              <span className="text-[#cca43b] text-base">PKR {order.grand_total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
