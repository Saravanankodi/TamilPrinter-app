"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BillData, CustomerData } from '@/types';
import AddBill from '@/components/form/AddBill';
import Invoice from '@/components/layout/Invoice';
import { showAlert } from '@/utils/Alert';

export default function EditInvoice() {
  const params = useParams();
  const router = useRouter();
  const billId = Number(params.id);

  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    mail: '',
    ref: ''
  });

  const [billData, setBillData] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      if (window.api?.getBillDetails) {
        try {
          const data = await window.api.getBillDetails(billId);
          if (data && data.bill) {
            setCustomerData({
              name: data.bill.customer_name || '',
              phone: data.bill.customer_phone || '',
              mail: data.bill.customer_mail || '',
              ref: ''
            });
            setBillData(data.items || []);
          }
        } catch (e) {
          console.error(e);
          showAlert({ title: "Error", text: "Failed to load bill details", icon: "error" } as any);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchDetails();
  }, [billId]);

  const handleSaved = () => {
    showAlert({ title: "Success", text: "Bill updated successfully", icon: "success" } as any);
    router.push('/invoice');
  };

  if (loading) return <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading Invoice Metadata...</div>;

  return (
    <section className="w-full flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <header className="w-full py-4 px-6 border-b bg-white border-[#E2E8F0] flex justify-between items-center shadow-sm">
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Billing &gt; Edit Mode</div>
          <h1 className="text-xl font-extrabold text-blue-900 leading-none">Modify Existing Invoice</h1>
        </div>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-red-500 transition-colors text-3xl font-light">&times;</button>
      </header>

      <div className="flex-1 w-full grid grid-cols-11 gap-0 overflow-hidden">
        {/* Left Side: Form */}
        <div className="col-span-5 flex flex-col gap-4 p-6 overflow-y-auto border-r border-[#E2E8F0] bg-white">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-4">
             <p className="text-sm text-orange-800 font-medium">⚠️ Editing an archived invoice. Any changes will update the reports permanently.</p>
          </div>
          <AddBill data={billData} setData={setBillData} />
        </div>

        {/* Right Side: Preview/Invoice */}
        <div className="col-span-6 h-full p-4 overflow-y-auto flex items-start justify-center bg-[#F1F5F9]">
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100 ring-1 ring-black/5">
            <Invoice 
              customerData={customerData} 
              billData={billData} 
              onSaved={handleSaved} 
              setBillData={setBillData} 
              isEditMode={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
