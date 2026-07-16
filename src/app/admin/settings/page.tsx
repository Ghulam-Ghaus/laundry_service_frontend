'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin.api';
import { catalogApi } from '@/lib/api/catalog.api';

export default function AdminSettings() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'system' | 'categories' | 'items' | 'options' | 'pricing' | 'riders'>('options');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // System settings state
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Categories CRUD state
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryForm, setCategoryForm] = useState({ id: '', code: '', nameEng: '', nameUrdu: '', description: '', sortOrder: 0, isActive: true });
  const [savingCategory, setSavingCategory] = useState(false);

  // Items CRUD state
  const [items, setItems] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [itemForm, setItemForm] = useState({ id: '', categoryId: '', code: '', nameEng: '', nameUrdu: '', description: '', unitLabel: 'item', minQuantity: 1, sortOrder: 0, isActive: true });
  const [savingItem, setSavingItem] = useState(false);

  // Service Options CRUD state
  const [options, setOptions] = useState<any[]>([]);
  const [optionForm, setOptionForm] = useState({ id: '', code: '', nameEng: '', nameUrdu: '', description: '', sortOrder: 0, isActive: true });
  const [savingOption, setSavingOption] = useState(false);

  // Pricing state
  const [pricingForm, setPricingForm] = useState({ itemId: '', serviceOptionId: '', price: '', compareAtPrice: '' });
  const [savingPrice, setSavingPrice] = useState(false);
  const [fullCatalog, setFullCatalog] = useState<any[]>([]);

  // Riders state
  const [users, setUsers] = useState<any[]>([]);
  const [riderForm, setRiderForm] = useState({ firstName: '', lastName: '', email: '', phone: '', roleCode: 'staff_pickup' });
  const [savingRider, setSavingRider] = useState(false);

  // Load initial settings
  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  // Load items when category filter changes
  useEffect(() => {
    if (activeTab === 'items' && selectedCategoryId) {
      loadCategoryItems(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
  };

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'system') {
        const list = await adminApi.getSettings();
        setSettingsList(list || []);
        const values: Record<string, string> = {};
        list.forEach((item) => {
          const key = item.setting_key || item.key_name;
          if (key) {
            values[key] = item.setting_value !== undefined ? item.setting_value : (item.key_value || '');
          }
        });
        setSettingsForm(values);
      } else if (activeTab === 'categories') {
        const list = await adminApi.getCategories();
        setCategories(list || []);
      } else if (activeTab === 'items') {
        const catList = await adminApi.getCategories();
        setCategories(catList || []);
        if (catList && catList.length > 0) {
          const defaultCatId = selectedCategoryId || catList[0].id;
          setSelectedCategoryId(defaultCatId);
          await loadCategoryItems(defaultCatId);
        } else {
          setItems([]);
        }
      } else if (activeTab === 'options') {
        const optList = await adminApi.getServiceOptions();
        setOptions(optList || []);
      } else if (activeTab === 'pricing') {
        const [catList, optList, catalog] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getServiceOptions(),
          catalogApi.getFullCatalog(),
        ]);
        setCategories(catList || []);
        setOptions(optList || []);
        setFullCatalog(catalog || []);
      } else if (activeTab === 'riders') {
        const usersRes = await adminApi.getUsers(1, 100);
        setUsers(usersRes.items || usersRes || []);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load configuration configurations.', true);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryItems = async (catId: string) => {
    try {
      const itemsList = await adminApi.getCategoryItems(catId);
      setItems(itemsList || []);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load catalog items.', true);
    }
  };

  // --- Actions ---

  // System Variable submission
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminApi.updateSettings(settingsForm);
      showNotification('System parameters updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update system configs.', true);
    } finally {
      setSavingSettings(false);
    }
  };

  // Category submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);
    try {
      const combinedName = categoryForm.nameUrdu.trim()
        ? `${categoryForm.nameEng.trim()} / ${categoryForm.nameUrdu.trim()}`
        : categoryForm.nameEng.trim();

      if (categoryForm.id) {
        await adminApi.updateCategory(categoryForm.id, {
          code: categoryForm.code,
          name: combinedName,
          description: categoryForm.description,
          sort_order: Number(categoryForm.sortOrder),
          is_active: categoryForm.isActive,
        });
        showNotification('Category updated successfully!');
      } else {
        await adminApi.createCategory({
          code: categoryForm.code,
          name: combinedName,
          description: categoryForm.description,
          sortOrder: Number(categoryForm.sortOrder),
        });
        showNotification('Category created successfully!');
      }
      setCategoryForm({ id: '', code: '', nameEng: '', nameUrdu: '', description: '', sortOrder: 0, isActive: true });
      loadTabContent();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save category.', true);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminApi.deleteCategory(id);
      showNotification('Category deleted/archived successfully.');
      loadTabContent();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete category.', true);
    }
  };

  // Items submission
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);
    try {
      const combinedName = itemForm.nameUrdu.trim()
        ? `${itemForm.nameEng.trim()} / ${itemForm.nameUrdu.trim()}`
        : itemForm.nameEng.trim();

      const payload = {
        categoryId: itemForm.categoryId || selectedCategoryId,
        code: itemForm.code,
        name: combinedName,
        description: itemForm.description,
        unitLabel: itemForm.unitLabel,
        minQuantity: Number(itemForm.minQuantity),
        sortOrder: Number(itemForm.sortOrder),
        is_active: itemForm.isActive,
      };
 
      if (itemForm.id) {
        await adminApi.updateItem(itemForm.id, payload);
        showNotification('Catalog item updated successfully!');
      } else {
        await adminApi.createItem(payload);
        showNotification('Catalog item created successfully!');
      }
      setItemForm({ id: '', categoryId: '', code: '', nameEng: '', nameUrdu: '', description: '', unitLabel: 'item', minQuantity: 1, sortOrder: 0, isActive: true });
      loadCategoryItems(selectedCategoryId);
    } catch (err: any) {
      showNotification(err.message || 'Failed to save catalog item.', true);
    } finally {
      setSavingItem(false);
    }
  };

  const handleItemDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await adminApi.deleteItem(id);
      showNotification('Item deleted/archived successfully.');
      loadCategoryItems(selectedCategoryId);
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete item.', true);
    }
  };

  // Option submission
  const handleOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOption(true);
    try {
      const combinedName = optionForm.nameUrdu.trim()
        ? `${optionForm.nameEng.trim()} / ${optionForm.nameUrdu.trim()}`
        : optionForm.nameEng.trim();

      if (optionForm.id) {
        await adminApi.updateServiceOption(optionForm.id, {
          code: optionForm.code,
          name: combinedName,
          description: optionForm.description,
          sortOrder: Number(optionForm.sortOrder),
          is_active: optionForm.isActive,
        });
        showNotification('Service option updated successfully!');
      } else {
        await adminApi.createServiceOption({
          code: optionForm.code,
          name: combinedName,
          description: optionForm.description,
          sortOrder: Number(optionForm.sortOrder),
        });
        showNotification('Service option created successfully!');
      }
      setOptionForm({ id: '', code: '', nameEng: '', nameUrdu: '', description: '', sortOrder: 0, isActive: true });
      loadTabContent();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save service option.', true);
    } finally {
      setSavingOption(false);
    }
  };

  const handleOptionDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service option?')) return;
    try {
      await adminApi.deleteServiceOption(id);
      showNotification('Service option deleted successfully.');
      loadTabContent();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete service option.', true);
    }
  };

  // Price matrix submission
  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrice(true);
    try {
      await adminApi.setItemPrice({
        itemId: pricingForm.itemId,
        serviceOptionId: pricingForm.serviceOptionId,
        price: pricingForm.price,
        compareAtPrice: pricingForm.compareAtPrice || undefined,
      });
      showNotification('Price successfully set for item pair!');
      setPricingForm({ itemId: '', serviceOptionId: '', price: '', compareAtPrice: '' });
      // Reload full catalog to show updated pricing
      const catalog = await catalogApi.getFullCatalog();
      setFullCatalog(catalog || []);
    } catch (err: any) {
      showNotification(err.message || 'Failed to save item pricing.', true);
    } finally {
      setSavingPrice(false);
    }
  };

  // Rider submission
  const handleRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRider(true);
    try {
      await adminApi.createStaff(riderForm);
      showNotification(`Rider staff user ${riderForm.firstName} registered successfully! Temp password is "TempPassword123!"`);
      setRiderForm({ firstName: '', lastName: '', email: '', phone: '', roleCode: 'staff_pickup' });
      loadTabContent();
    } catch (err: any) {
      showNotification(err.message || 'Failed to register rider user.', true);
    } finally {
      setSavingRider(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      
      {/* Sidebar Admin Navigation Ribbon */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4">
        <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Orders Dashboard
        </Link>
        <Link href="/admin/receipt" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          New Receipt
        </Link>
        <Link href="/admin/settings" className="text-sm font-bold text-[#cca43b] border-b-2 border-[#cca43b] pb-2 px-1">
          Settings
        </Link>
      </div>

      {/* Sub tabs configuration menu bar */}
      <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100/70 text-xs font-semibold text-slate-500 max-w-5xl">
        {[
          { code: 'options', label: 'Service Options / سروس آپشنز' },
          { code: 'categories', label: 'Categories / کیٹیگریز' },
          { code: 'items', label: 'Catalog Items / اشیاء' },
          { code: 'pricing', label: 'Pricing Matrix / قیمتیں' },
          { code: 'system', label: 'System Variables / سسٹم متغیرات' },
          { code: 'riders', label: 'Rider Staff / رائیڈرز' },
        ].map((tab) => (
          <button
            key={tab.code}
            onClick={() => setActiveTab(tab.code as any)}
            className={`px-3.5 py-2 rounded-xl transition-all duration-305 cursor-pointer whitespace-nowrap ${
              activeTab === tab.code
                ? 'bg-white text-slate-900 shadow-sm border border-slate-150/50 font-bold'
                : 'hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert indicators */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-650 text-xs px-4 py-3.5 rounded-2xl font-medium max-w-4xl">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-4 py-3.5 rounded-2xl font-medium max-w-4xl animate-fade-in">
          ✅ {success}
        </div>
      )}

      {/* Loading state indicator */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-wider">
            Loading configurations...
          </div>
        </div>
      ) : (
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm animate-fade-in">
          
          {/* TAB 1: SYSTEM CONFIGS */}
          {activeTab === 'system' && (
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-[#1a1d20] mb-6 font-serif border-b pb-3">System Variables</h3>
              <form onSubmit={handleSettingsSubmit} className="space-y-5 text-xs text-gray-500">
                {settingsList.map((item) => {
                  const key = item.setting_key || item.key_name;
                  if (!key) return null;
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm[key] || ''}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
                      />
                      <p className="text-[10px] text-gray-400">
                        {item.description || 'System-wide configuration value.'}
                      </p>
                    </div>
                  );
                })}
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg transition-all"
                >
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-[#1a1d20] mb-4 font-serif">Service Categories</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-650 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                        <th className="p-4">Name</th>
                        <th className="p-4">Sort</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-700">{cat.name}</td>
                          <td className="p-4">{cat.sort_order}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cat.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                const parts = cat.name.split(' / ');
                                setCategoryForm({ id: cat.id, code: cat.code, nameEng: parts[0] || '', nameUrdu: parts[1] || '', description: cat.description || '', sortOrder: cat.sort_order, isActive: cat.is_active });
                              }}
                              className="text-blue-600 font-bold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(cat.id)}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Form */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/70 space-y-4">
                <h3 className="text-sm font-bold text-[#1a1d20] font-serif border-b pb-2">
                  {categoryForm.id ? '✏️ Edit Category' : '➕ Add Category'}
                </h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Code (Unique)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. wash_fold"
                      value={categoryForm.code}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">English Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wash & Fold"
                      value={categoryForm.nameEng}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, nameEng: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Urdu Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. دھلائی اور استری"
                      value={categoryForm.nameUrdu}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, nameUrdu: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-right font-semibold font-sans"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                    <textarea
                      placeholder="Service descriptions..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white h-20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sort Order</label>
                    <input
                      type="number"
                      required
                      value={categoryForm.sortOrder}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  {categoryForm.id && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="catActive"
                        checked={categoryForm.isActive}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <label htmlFor="catActive" className="text-[10px] font-bold text-gray-650 uppercase cursor-pointer">Category is Active</label>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="w-full py-2.5 bg-[#cca43b] text-black font-bold rounded-xl hover:bg-[#e0b84c]"
                    >
                      {savingCategory ? 'Saving...' : 'Save Category'}
                    </button>
                    {categoryForm.id && (
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ id: '', code: '', nameEng: '', nameUrdu: '', description: '', sortOrder: 0, isActive: true })}
                        className="py-2.5 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: CATALOG ITEMS */}
          {activeTab === 'items' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-bold text-[#1a1d20] font-serif">Catalog items</h3>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-650 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                        <th className="p-4">Item Name</th>
                        <th className="p-4">Unit</th>
                        <th className="p-4">Min Qty</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-700">{item.name}</td>
                          <td className="p-4 text-slate-500">{item.unit_label}</td>
                          <td className="p-4 text-slate-500">{item.min_quantity}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                const parts = item.name.split(' / ');
                                setItemForm({ id: item.id, categoryId: item.category_id, code: item.code, nameEng: parts[0] || '', nameUrdu: parts[1] || '', description: item.description || '', unitLabel: item.unit_label, minQuantity: item.min_quantity, sortOrder: item.sort_order, isActive: item.is_active });
                              }}
                              className="text-blue-600 font-bold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleItemDelete(item.id)}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">
                            No catalog items defined for this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Form */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/70 space-y-4">
                <h3 className="text-sm font-bold text-[#1a1d20] font-serif border-b pb-2">
                  {itemForm.id ? '✏️ Edit Catalog Item' : '➕ Add Catalog Item'}
                </h3>
                <form onSubmit={handleItemSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
                    <select
                      value={itemForm.categoryId || selectedCategoryId}
                      onChange={(e) => setItemForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Code (Unique)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. shirt_dry"
                      value={itemForm.code}
                      onChange={(e) => setItemForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">English Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gents Shirt"
                      value={itemForm.nameEng}
                      onChange={(e) => setItemForm(prev => ({ ...prev, nameEng: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Urdu Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. مردانہ شرٹ"
                      value={itemForm.nameUrdu}
                      onChange={(e) => setItemForm(prev => ({ ...prev, nameUrdu: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-right font-semibold font-sans"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                    <textarea
                      placeholder="Descriptions of fabric or item details..."
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white h-20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Unit Label</label>
                      <input
                        type="text"
                        required
                        value={itemForm.unitLabel}
                        onChange={(e) => setItemForm(prev => ({ ...prev, unitLabel: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Min Quantity</label>
                      <input
                        type="number"
                        required
                        value={itemForm.minQuantity}
                        onChange={(e) => setItemForm(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sort Order</label>
                    <input
                      type="number"
                      required
                      value={itemForm.sortOrder}
                      onChange={(e) => setItemForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  {itemForm.id && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="itemActive"
                        checked={itemForm.isActive}
                        onChange={(e) => setItemForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <label htmlFor="itemActive" className="text-[10px] font-bold text-gray-650 uppercase cursor-pointer">Item is Active</label>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingItem}
                      className="w-full py-2.5 bg-[#cca43b] text-black font-bold rounded-xl hover:bg-[#e0b84c]"
                    >
                      {savingItem ? 'Saving...' : 'Save Item'}
                    </button>
                    {itemForm.id && (
                      <button
                        type="button"
                        onClick={() => setItemForm({ id: '', categoryId: '', code: '', nameEng: '', nameUrdu: '', description: '', unitLabel: 'item', minQuantity: 1, sortOrder: 0, isActive: true })}
                        className="py-2.5 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: SERVICE OPTIONS */}
          {activeTab === 'options' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-[#1a1d20] mb-4 font-serif">Service Options</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-650 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                        <th className="p-4">Option Name</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Sort</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {options.map((opt) => (
                        <tr key={opt.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-700">{opt.name}</td>
                          <td className="p-4 text-slate-500 max-w-[200px] truncate">{opt.description || 'N/A'}</td>
                          <td className="p-4 font-bold text-slate-600">{opt.sort_order || 0}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${opt.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {opt.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                const parts = opt.name.split(' / ');
                                setOptionForm({ id: opt.id, code: opt.code, nameEng: parts[0] || '', nameUrdu: parts[1] || '', description: opt.description || '', sortOrder: opt.sort_order || 0, isActive: opt.is_active });
                              }}
                              className="text-blue-600 font-bold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOptionDelete(opt.id)}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Form */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/70 space-y-4">
                <h3 className="text-sm font-bold text-[#1a1d20] font-serif border-b pb-2">
                  {optionForm.id ? '✏️ Edit Option' : '➕ Add Option'}
                </h3>
                <form onSubmit={handleOptionSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Code (Unique)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. steam_iron"
                      value={optionForm.code}
                      onChange={(e) => setOptionForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">English Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Steam Ironing"
                      value={optionForm.nameEng}
                      onChange={(e) => setOptionForm(prev => ({ ...prev, nameEng: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Urdu Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. اسٹیم استری"
                      value={optionForm.nameUrdu}
                      onChange={(e) => setOptionForm(prev => ({ ...prev, nameUrdu: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-right font-semibold font-sans"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                    <textarea
                      placeholder="Option details..."
                      value={optionForm.description}
                      onChange={(e) => setOptionForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white h-20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sort Order</label>
                    <input
                      type="number"
                      required
                      value={optionForm.sortOrder}
                      onChange={(e) => setOptionForm(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  {optionForm.id && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="optActive"
                        checked={optionForm.isActive}
                        onChange={(e) => setOptionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <label htmlFor="optActive" className="text-[10px] font-bold text-gray-650 uppercase cursor-pointer">Option is Active</label>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingOption}
                      className="w-full py-2.5 bg-[#cca43b] text-black font-bold rounded-xl hover:bg-[#e0b84c]"
                    >
                      {savingOption ? 'Saving...' : 'Save Option'}
                    </button>
                    {optionForm.id && (
                      <button
                        type="button"
                        onClick={() => setOptionForm({ id: '', code: '', nameEng: '', nameUrdu: '', description: '', sortOrder: 0, isActive: true })}
                        className="py-2.5 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: PRICING MATRIX */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Existing Matrix */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-base font-bold text-[#1a1d20] font-serif">Pricing Matrix grouped by Catalog</h3>
                <div className="space-y-6">
                  {fullCatalog.map((cat: any) => (
                    <div key={cat.id} className="space-y-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/30">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px] text-[#cca43b]">{cat.name}</h4>
                      <div className="space-y-2 divide-y divide-slate-100 bg-white rounded-xl border border-slate-100 p-3">
                        {cat.items?.map((item: any) => (
                          <div key={item.id} className="pt-2.5 pb-2 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-700 text-xs">{item.name}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.prices && item.prices.length > 0 ? (
                                item.prices.map((p: any) => (
                                  <span
                                    key={p.id}
                                    onClick={() => setPricingForm({ itemId: item.id, serviceOptionId: p.service_option_id || '', price: p.price.toString(), compareAtPrice: p.compare_at_price?.toString() || '' })}
                                    className="px-2 py-1 rounded bg-[#cca43b]/10 hover:bg-[#cca43b]/20 border border-[#cca43b]/20 text-[10px] font-bold text-slate-800 cursor-pointer transition"
                                    title="Click to edit price value"
                                  >
                                    {p.service_option?.name || 'Service'}: PKR {parseFloat(p.price).toFixed(0)}
                                    {p.compare_at_price && <span className="line-through text-slate-400 ml-1">PKR {parseFloat(p.compare_at_price).toFixed(0)}</span>}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400">No prices configured</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Form */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/70 space-y-4 h-fit">
                <h3 className="text-sm font-bold text-[#1a1d20] font-serif border-b pb-2">Config Item Price</h3>
                <form onSubmit={handlePriceSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Item Selection</label>
                    <select
                      required
                      value={pricingForm.itemId}
                      onChange={(e) => setPricingForm(prev => ({ ...prev, itemId: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="">Choose Catalog Item</option>
                      {fullCatalog.map((cat: any) => (
                        <optgroup key={cat.id} label={cat.name}>
                          {cat.items?.map((item: any) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Service Option</label>
                    <select
                      required
                      value={pricingForm.serviceOptionId}
                      onChange={(e) => setPricingForm(prev => ({ ...prev, serviceOptionId: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="">Choose Service Mode</option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Rate Price (PKR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 250"
                      value={pricingForm.price}
                      onChange={(e) => setPricingForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Original Price (Strikeout / Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 300"
                      value={pricingForm.compareAtPrice}
                      onChange={(e) => setPricingForm(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPrice}
                    className="w-full py-2.5 bg-[#cca43b] text-black font-bold rounded-xl hover:bg-[#e0b84c] shadow"
                  >
                    {savingPrice ? 'Saving Price...' : 'Set Pricing Rate'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: RIDERS */}
          {activeTab === 'riders' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-[#1a1d20] mb-4 font-serif">Staff User Accounts</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-650 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                        <th className="p-4">Full Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Default Role ID</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-700">{u.display_name || `${u.first_name} ${u.last_name || ''}`}</td>
                          <td className="p-4 text-slate-600 select-all">{u.email}</td>
                          <td className="p-4 text-slate-500">{u.phone || 'N/A'}</td>
                          <td className="p-4 font-mono text-[10px] text-slate-400">{u.default_role_id || 'customer'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Form */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/70 space-y-4 h-fit">
                <h3 className="text-sm font-bold text-[#1a1d20] font-serif border-b pb-2">➕ Register Rider Staff</h3>
                <form onSubmit={handleRiderSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Asif"
                        value={riderForm.firstName}
                        onChange={(e) => setRiderForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Khan"
                        value={riderForm.lastName}
                        onChange={(e) => setRiderForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="rider@example.com"
                      value={riderForm.email}
                      onChange={(e) => setRiderForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</label>
                    <input
                      type="text"
                      placeholder="03XXXXXXXXX"
                      value={riderForm.phone}
                      onChange={(e) => setRiderForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Staff Assignment Mode</label>
                    <select
                      value={riderForm.roleCode}
                      onChange={(e) => setRiderForm(prev => ({ ...prev, roleCode: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="staff_pickup">Staff Rider - Pickups (staff_pickup)</option>
                      <option value="staff_delivery">Staff Rider - Deliveries (staff_delivery)</option>
                      <option value="staff_cleaning">Facility Processor - Cleaning (staff_cleaning)</option>
                      <option value="admin">Platform Administrator (admin)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={savingRider}
                    className="w-full py-2.5 bg-[#cca43b] text-black font-bold rounded-xl hover:bg-[#e0b84c] shadow"
                  >
                    {savingRider ? 'Registering Rider...' : 'Register Rider Account'}
                  </button>
                  <p className="text-[9px] text-slate-400 text-center leading-normal">
                    Riders register with a temporary default password: <span className="font-bold text-slate-600">TempPassword123!</span>
                  </p>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
