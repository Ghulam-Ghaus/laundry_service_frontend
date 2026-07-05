'use client';

import React, { useEffect, useState } from 'react';
import { httpClient } from '@/lib/api/http-client';
import Link from 'next/link';

export default function AdminReceipt() {
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    order_date: '',
    delivery_date: '',
    category_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load service categories for dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await httpClient.get<Array<{ id: string; name: string }>>('/service-categories');
        setCategories(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await httpClient.post('/orders/draft', form);
      alert('Draft order created successfully!');
      // Reset form
      setForm({
        customer_name: '',
        phone: '',
        order_date: '',
        delivery_date: '',
        category_id: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create draft order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading service categories...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      
      {/* Sidebar Admin Navigation Ribbon */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4">
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
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-sm max-w-2xl">
        <h2 className="text-lg font-bold text-[#1a1d20] mb-6 font-serif border-b border-gray-100 pb-3">
          Create Draft Receipt
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-650 text-xs px-4 py-3 rounded-2xl font-medium mb-6">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs text-gray-500">
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
                Order Date
              </label>
              <input
                type="date"
                name="order_date"
                required
                value={form.order_date}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="delivery_date"
                required
                value={form.delivery_date}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Service Category
            </label>
            <select
              name="category_id"
              required
              value={form.category_id}
              onChange={handleChange}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
            >
              <option value="">Select Service Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 transition-all cursor-pointer"
            >
              {saving ? 'Creating Draft...' : 'Create Draft Receipt'}
            </button>
            <Link
              href="/admin"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-center text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
