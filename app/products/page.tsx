"use client";
import React, { useEffect, useState } from 'react';
import { Calander, Notification, Add } from '@/assets/icons';
import Table from '@/components/layout/Table';
import Filter from '@/assets/icons/Filter';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import { useRouter } from 'next/navigation';
import SvgEdit from '@/assets/icons/Edit';
import SvgDelete from '@/assets/icons/Delete';

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    if (window.api?.getProducts) {
      const data = await window.api.getProducts();
      setProducts(data);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.api?.deleteProduct && confirm("Delete this product?")) {
      await window.api.deleteProduct(id);
      loadProducts();
    }
  };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="w-full flex-1 flex flex-col pt-0 h-full overflow-hidden">
      <header className="w-full py-3 px-4 flex items-center justify-between bg-white border border-[#00000014]">
        <aside className="w-fit h-full">
          <div className="h-fit flex items-center gap-2">
            <h1 className="text-[20px]">Products</h1>
          </div>
          <p className="text-sm">Manage pricing and inventory</p>
        </aside>
        <div className="w-fit flex items-center gap-2">
          {/* Date and Time */}
          <div className="w-fit flex text-right text-[#64748B] border-r pr-6 border-[#00000014]">
            <Calander className="w-6 h-6 mr-2" />
            <p className="flex text-sm font-semibold text-black">
              Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="w-fit h-fit rounded-full bg-[#F1F5F9] p-2">
            <Notification className="w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="w-full h-full p-4 overflow-y-auto">
        <div className="w-full flex items-center justify-between mb-4">
          <Input 
            placeholder="Search products..." 
            className="w-full max-w-75" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <aside className="w-auto h-fit flex items-center gap-3">
            <Button variant="primary" icon={<Add />} onClick={() => router.push('/products/new-product')}>
              Add New Product
            </Button>
          </aside>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#00000014] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] text-gray-500 text-sm font-medium border-b border-[#E2E8F0]">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Pricing Model</th>
                  <th className="p-3">Rate / Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-b border-[#F1F5F9] hover:bg-gray-50 text-sm">
                    <td className="p-3 font-medium text-gray-800">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        {product.description && <span className="text-xs text-gray-400 font-normal">{product.description}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-[#F1F5F9] text-gray-700 px-2 py-1 rounded text-xs">{product.category || 'N/A'}</span>
                    </td>
                    <td className="p-3 text-gray-600">{product.pricing_model}</td>
                    <td className="p-3 font-medium">₹{product.cost_price?.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {product.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <button onClick={() => router.push(`/products/new-product?id=${product.id}`)} className="text-gray-400 hover:text-blue-500 p-1 border rounded bg-white">
                         <SvgEdit className='w-5 h-5 text-[#111827] '/>
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-500 p-1 border rounded bg-white">
                         <SvgDelete className='w-5 h-5 text-[#111827] '/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
                <div className="w-full py-8 text-center text-gray-500 text-sm">
                    No products found.
                </div>
            )}
            <div className="p-3 flex justify-between items-center text-sm text-gray-500 bg-white border-t border-[#E2E8F0] w-full">
                <span>Showing {filtered.length} products</span>
                <div className="flex gap-2">
                    <Button variant="outline" className="px-3 py-1 bg-white text-gray-600">Previous</Button>
                    <Button variant="outline" className="px-3 py-1 bg-white text-gray-600">Next</Button>
                </div>
            </div>
        </div>
      </main>
    </section>
  );
}