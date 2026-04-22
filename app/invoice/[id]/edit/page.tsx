"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BillData, CustomerData } from '@/types';
import Invoice from '@/components/layout/Invoice';
import { showAlert } from '@/utils/Alert';
import SvgDelete from '@/assets/icons/Delete';

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
  const [payment, setPayment] = useState("");
  const [loading, setLoading] = useState(true);
  const [existingBill, setExistingBill] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Split payment state
  const [splitPayments, setSplitPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [billStatus, setBillStatus] = useState<'Paid' | 'Partial' | 'Pending'>('Pending');

  // New split payment form
  const [splitMethod, setSplitMethod] = useState('Cash');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitNote, setSplitNote] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);

  const fetchDetails = useCallback(async () => {
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
          setPayment(data.paymentMethod);
          setExistingBill(data.bill);
          setPaymentHistory(data.paymentHistory || []);

          // Split payment data
          setSplitPayments(data.splitPayments || []);
          setTotalPaid(data.totalPaid || 0);
          setRemainingBalance(data.remainingBalance ?? data.bill?.total ?? 0);
          setBillStatus(data.bill?.status || 'Pending');
        }
      } catch (e) {
        console.error(e);
        showAlert({ title: "Error", text: "Failed to load bill details", icon: "error" } as any);
      } finally {
        setLoading(false);
      }
    }
  }, [billId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleSaved = () => {
    showAlert({ title: "Success", text: "Bill updated successfully", icon: "success" } as any);
    router.push('/invoice');
  };

  const handleAddSplitPayment = async () => {
    const amount = parseFloat(splitAmount);
    if (!amount || amount <= 0) {
      showAlert({ title: "Invalid Amount", text: "Please enter a valid payment amount", icon: "warning" } as any);
      return;
    }
    if (amount > remainingBalance) {
      showAlert({ title: "Exceeds Balance", text: `Amount cannot exceed remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}`, icon: "warning" } as any);
      return;
    }

    setAddingPayment(true);
    try {
      const result = await window.api.addSplitPayment({
        billId,
        method: splitMethod,
        amount,
        note: splitNote || undefined
      });

      if (result?.success) {
        // Refresh data
        await fetchDetails();
        setSplitAmount('');
        setSplitNote('');
        showAlert({ title: "Payment Added", text: `₹${amount.toLocaleString('en-IN')} recorded via ${splitMethod}`, icon: "success" } as any);
      }
    } catch (err: any) {
      showAlert({ title: "Error", text: err.message || "Failed to add payment", icon: "error" } as any);
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDeleteSplitPayment = async (paymentId: number) => {
    try {
      const result = await window.api.deleteSplitPayment({ billId, paymentId });
      if (result?.success) {
        await fetchDetails();
        showAlert({ title: "Removed", text: "Payment entry removed", icon: "success" } as any);
      }
    } catch (err: any) {
      showAlert({ title: "Error", text: err.message || "Failed to remove payment", icon: "error" } as any);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Partial':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Pending':
      default:
        return 'bg-red-100 text-red-600 border-red-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return '✅';
      case 'Partial': return '⏳';
      case 'Pending': default: return '🔴';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return 'bg-green-50 text-green-700 border-green-200';
      case 'upi': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'card': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const grandTotal = existingBill?.total || 0;
  const progressPct = grandTotal > 0 ? Math.min(100, (totalPaid / grandTotal) * 100) : 0;

  if (loading) return <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading Invoice Metadata...</div>;

  return (
    <section className="w-full flex-1 flex flex-col h-full overflow-scroll bg-[#F8FAFC]">
      <header className="w-full py-4 px-6 border-b bg-white border-[#E2E8F0] flex justify-between items-center shadow-sm">
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Billing &gt; Edit Mode</div>
          <h1 className="text-xl font-extrabold text-blue-900 leading-none">Modify Existing Invoice</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(billStatus)} flex items-center gap-1.5`}>
            {getStatusIcon(billStatus)} {billStatus}
          </span>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-red-500 transition-colors text-3xl font-light">&times;</button>
        </div>
      </header>

      <div className="flex-1 w-full flex gap-6 bg-[#F1F5F9] p-6 overflow-auto">
        {/* Left: Invoice Preview */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-1 text-blue-800 text-center">
             <p className="text-sm font-semibold">ℹ️ Edit Bill Mode</p>
             <p className="text-xs">Invoice items, totals, and customer details are read-only. Use the panel on the right to manage payments.</p>
          </div>
          <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100 ring-1 ring-black/5">
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

        {/* Right: Split Payment Panel */}
        <div className="w-[400px] shrink-0 flex flex-col gap-4">

          {/* Payment Summary Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">Payment Summary</h2>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(billStatus)}`}>
                {billStatus}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>₹{totalPaid.toLocaleString('en-IN')} paid</span>
                <span>₹{grandTotal.toLocaleString('en-IN')} total</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    progressPct >= 100
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : progressPct > 0
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                      : 'bg-gray-200'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-center text-xs font-medium text-gray-400">
                {progressPct.toFixed(0)}% Complete
              </p>
            </div>

            {/* Key Figures */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Paid</p>
                <p className="text-lg font-extrabold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</p>
              </div>
              <div className={`rounded-lg p-3 text-center border ${remainingBalance > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${remainingBalance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  Remaining
                </p>
                <p className={`text-lg font-extrabold ${remainingBalance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  ₹{remainingBalance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Add Payment Form */}
          {remainingBalance > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 space-y-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">+</span>
                Record Payment
              </h2>

              {/* Method Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setSplitMethod(method)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                        splitMethod === method
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                  <input
                    type="number"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    placeholder={`Max ₹${remainingBalance.toLocaleString('en-IN')}`}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    max={remainingBalance}
                    min={1}
                  />
                </div>
                {/* Quick fill buttons */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSplitAmount(String(remainingBalance))}
                    className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 font-medium transition-colors"
                  >
                    Pay Full (₹{remainingBalance.toLocaleString('en-IN')})
                  </button>
                  <button
                    onClick={() => setSplitAmount(String(Math.round(remainingBalance / 2)))}
                    className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 font-medium transition-colors"
                  >
                    Half (₹{Math.round(remainingBalance / 2).toLocaleString('en-IN')})
                  </button>
                </div>
              </div>

              {/* Note Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Note (Optional)</label>
                <input
                  type="text"
                  value={splitNote}
                  onChange={(e) => setSplitNote(e.target.value)}
                  placeholder="e.g. Advance payment"
                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAddSplitPayment}
                disabled={addingPayment || !splitAmount}
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  addingPayment || !splitAmount
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {addingPayment ? 'Recording...' : `Record ₹${splitAmount || '0'} Payment`}
              </button>
            </div>
          )}

          {/* Paid Badge for Fully Paid */}
          {remainingBalance <= 0 && grandTotal > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 p-5 text-center space-y-2">
              <div className="text-4xl">🎉</div>
              <p className="text-lg font-extrabold text-emerald-700">Fully Paid!</p>
              <p className="text-xs text-emerald-500">This invoice has been fully settled.</p>
            </div>
          )}

          {/* Split Payments History */}
          {splitPayments.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 space-y-3">
              <h2 className="text-base font-bold text-gray-800">Payment Records</h2>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {splitPayments.map((sp, idx) => (
                  <div
                    key={sp.id || idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:shadow-sm transition-shadow group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getMethodColor(sp.method)}`}>
                            {sp.method}
                          </span>
                          <span className="text-sm font-bold text-gray-800">₹{Number(sp.amount).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {new Date(sp.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          {sp.note && (
                            <span className="text-[10px] text-gray-400 italic">• {sp.note}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSplitPayment(sp.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-md"
                      title="Remove payment"
                    >
                      <SvgDelete className="w-4 h-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method History (legacy) */}
          {paymentHistory && paymentHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Payment Method Changes</h2>
              <div className="space-y-1.5">
                {paymentHistory.map((history, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                    <span className="font-medium">{new Date(history.updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-gray-400">{history.old_payment_method || "None"}</span>
                      <span className="text-gray-300">&rarr;</span>
                      <span className="text-blue-600">{history.new_payment_method}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
