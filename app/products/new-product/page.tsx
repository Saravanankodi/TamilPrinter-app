"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Dropdown from '@/components/base/Dropdown';
import { showAlert } from '@/utils/Alert';
import AddRounded from '@/assets/icons/AddRounded';

function NewProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    description: '',
    pricingModel: 'Per Unit / Item',
    costPrice: '',
    taxRate: 'None (0%)',
    trackStock: false,
    currentStock: '0',
    status: 'Active'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productId && window.api?.getProducts) {
      window.api.getProducts().then((data: any[]) => {
        const prod = data.find(p => p.id === Number(productId));
        if (prod) {
          setFormData({
            ...prod,
            pricingModel: prod.pricing_model || 'Per Unit / Item',
            costPrice: prod.cost_price?.toString() || '',
            taxRate: prod.tax_rate || 'None (0%)',
            trackStock: prod.track_stock === 1,
            currentStock: prod.current_stock?.toString() || '0'
          });
        }
      });
    }
  }, [productId]);

  const handleSubmit = async () => {
    if (!formData.name) {
      showAlert({ title: "Error", text: "Product Name is required", icon: "error" } as any);
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        id: productId ? Number(productId) : undefined,
        costPrice: Number(formData.costPrice) || 0,
        currentStock: Number(formData.currentStock) || 0
      };

      if (productId) {
        await window.api.updateProduct(payload);
        showAlert({ title: "Success", text: "Product updated successfully", icon: "success" } as any);
      } else {
        await window.api.addProduct(payload);
        showAlert({ title: "Success", text: "Product added successfully", icon: "success" } as any);
      }
      router.push('/products');
    } catch (e) {
      console.error(e);
      showAlert({ title: "Error", text: "Failed to save product", icon: "error" } as any);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { label: "Paper", value: "Paper" },
    { label: "INK", value: "INK" },
    { label: "Binding", value: "Binding" },
    { label: "Lamination", value: "Lamination" },
    { label: "Report Sheet", value: "Report Sheet" },
    { label: "Service", value: "Service" }
  ];

  const pricingModels = [
    { label: "Per Unit / Item", value: "Per Unit / Item" },
    { label: "Per Box", value: "Per Box" },
    { label: "Per Set", value: "Per Set" },
    { label: "Per Ink", value: "Per Ink" }
  ];

  const taxRates = [
    { label: "None (0%)", value: "None (0%)" },
    { label: "GST (5%)", value: "GST (5%)" },
    { label: "GST (12%)", value: "GST (12%)" },
    { label: "GST (18%)", value: "GST (18%)" },
    { label: "GST (28%)", value: "GST (28%)" }
  ];

  return (
    <section className="w-full flex-1 flex flex-col h-full bg-[#F8FAFC]">
      <header className="w-full py-4 px-6 bg-white border-b border-[#E2E8F0] flex justify-between items-center">
        <div>
          <div className="text-gray-500 text-sm mb-1">Products &gt; {productId ? 'Edit Product' : 'New Product'}</div>
          <h1 className="text-xl font-semibold">{productId ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl font-light">
          &times;
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
            <h2 className="text-md font-semibold mb-4">Basic Information</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                type="text"
                placeholder="e.g. Color Print A4 High Glossy" 
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="" disabled>Select Category...</option>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Code / SKU (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. PRT-001" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                placeholder="Enter product details, specifications..." 
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-[100px] resize-y focus:outline-none focus:border-blue-500"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>

          {/* Pricing & Tax */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
            <h2 className="text-md font-semibold mb-4">Pricing & Tax</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm appearance-none bg-white font-medium text-gray-700"
                    value={formData.pricingModel}
                    onChange={e => setFormData({ ...formData, pricingModel: e.target.value })}
                  >
                    {pricingModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹) (Optional)</label>
                <input 
                  type="number"
                  placeholder="0.00" 
                  className="w-full border border-gray-300 rounded bg-[#F8FAFC] px-3 py-2 text-sm focus:outline-none"
                  value={formData.costPrice}
                  onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (GST)</label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm appearance-none bg-white"
                    value={formData.taxRate}
                    onChange={e => setFormData({ ...formData, taxRate: e.target.value })}
                  >
                    {taxRates.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory & Settings */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
            <h2 className="text-md font-semibold mb-4">Inventory & Settings</h2>
            
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Track Stock</h3>
                <p className="text-xs text-gray-500">Enable this for physical goods like paper reams or spiral coils.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  value="" 
                  className="sr-only peer"
                  checked={formData.trackStock}
                  onChange={e => setFormData({ ...formData, trackStock: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.trackStock && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                <input 
                  type="number"
                  placeholder="0" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm max-w-[200px] focus:outline-none focus:border-blue-500"
                  value={formData.currentStock}
                  onChange={e => setFormData({ ...formData, currentStock: e.target.value })}
                />
              </div>
            )}
            
            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button variant="outline" className="px-6 py-2 bg-white text-gray-600 border-gray-300" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="button" variant="primary" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit}>
                💾 Save Product
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default function NewProduct() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading editor...</div>}>
      <NewProductForm />
    </Suspense>
  );
}