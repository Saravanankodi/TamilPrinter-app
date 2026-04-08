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
  const [payment,setPayment] = useState("")
  const [loading, setLoading] = useState(true);
  const [existingBill, setExistingBill] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDetails() {
      if (window.api?.getBillDetails) {
        try {
          const data = await window.api.getBillDetails(billId);
          if (data && data.customer) {
            setCustomerData({
              name: data.customer.name || '',
              phone: data.customer.phone || '',
              mail: data.customer.mail || '',
              ref: data.customer.ref || ''
            });
            setBillData(data.items || []);
            setPayment(data.paymentMethod)
            setExistingBill(data.bill); 
            setPaymentHistory(data.paymentHistory || []);
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
    <section className="w-full flex-1 flex flex-col h-full overflow-scroll bg-[#F8FAFC]">
      <header className="w-full py-4 px-6 border-b bg-white border-[#E2E8F0] flex justify-between items-center shadow-sm">
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Billing &gt; Edit Mode</div>
          <h1 className="text-xl font-extrabold text-blue-900 leading-none">Modify Existing Invoice</h1>
        </div>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-red-500 transition-colors text-3xl font-light">&times;</button>
      </header>

      <div className="flex-1 w-full flex flex-col items-center bg-[#F1F5F9] p-6">
        <div className="w-full max-w-2xl p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6 flex flex-col gap-1 text-blue-800 text-center">
           <p className="text-sm font-semibold">ℹ️ Edit Bill Mode</p>
           <p className="text-xs">Invoice items, totals, and customer details are read-only. You may only update the payment method.</p>
        </div>
        <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100 ring-1 ring-black/5">
          <Invoice 
            customerData={customerData} 
            billData={billData} 
            onSaved={handleSaved} 
            isEditMode={true}
            existingBill={existingBill}
            paymentMethod={payment}
            billId={billId}
            paymentHistory={paymentHistory}
          />
        </div>
      </div>
    </section>
  );
}
