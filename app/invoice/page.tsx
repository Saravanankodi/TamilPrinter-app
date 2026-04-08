"use client";
import DownloadIcon from '@/assets/icons/Download'
import Button from '@/components/base/Button'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import Input from '@/components/base/Input';
import SvgEdit from '@/assets/icons/Edit';
import Download from '@/assets/icons/Download';
import Dropdown from '@/components/base/Dropdown';

const AllInvoice = () => {
    const router = useRouter()
    const [bills, setBills] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");

    const options = [
        { label: "All", value: "" },
        { label: "Paid", value: "Paid" },
        { label: "Pending", value: "Pending" },
      ];
    const paymentMode = [
        { label: "All", value: "" },
        { label: "UPI", value: "UPI" },
        { label: "Cash", value: "Cash" },
        { label: "Card", value: "Card" },
        { label: "Pending", value: "Pending" },
      ];
    const fetchBills = async () => {
        if (window.api?.getBills) {
            const data = await window.api.getBills();
            setBills(data);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const filteredBills = bills.filter(bill => {
        const matchesSearch =
            bill.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
            bill.customer_name?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter ? bill.status === statusFilter : true;

        const matchesPayment =
            paymentFilter ? bill.payment_method === paymentFilter : true;

        return matchesSearch && matchesStatus && matchesPayment;
    });

    const exportToCSV = () => {
        const headers = ["Bill No", "Date", "Customer", "Amount", "Payment", "Status"];
        const rows = filteredBills.map(b => [
            b.bill_number,
            new Date(b.created_at).toLocaleString(),
            b.customer_name,
            b.total,
            b.payment_method,
            b.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `invoices_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="w-full h-auto max-h-screen p-4 flex flex-col gap-4">
            <header className="w-full h-auto p-4 flex items-center justify-between bg-white rounded-lg shadow-sm border border-[#00000014]">
                <div className="w-auto">
                    <h1 className="text-2xl">
                        Transactions
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button 
                        icon={<DownloadIcon />} 
                        className='text-white' 
                        onClick={exportToCSV}
                    >
                        Export Data
                    </Button>
                </div>
            </header>
            <aside className="w-auto">
                <span className="text-2xl font-bold">All Invoices</span>
                <p className="text-sm text-gray-500">View and manage all your past billing transactions.</p>
            </aside>
            <aside className="w-full h-auto flex items-center gap-5 flex-wrap">
                <Input 
                    placeholder="Search invoices..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-80"
                />
                <Dropdown name='' option={options} value={statusFilter} onChange={(value) => setStatusFilter(value)}/>
                <Dropdown name='' option={paymentMode} value={paymentFilter} onChange={(value) => setPaymentFilter(value)}/>
            </aside>
            <main className="w-full bg-white rounded-lg shadow-sm border border-[#00000014] overflow-scroll no-scrollbar">
                <table className="min-w-full text-left overflow-auto">
                    <thead className="bg-[#F8FAFC] border-b border-[#00000014] sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Bill No</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Date & Time</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Payment</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBills.map((bill) => (
                            <tr 
                                key={bill.id} 
                                className="border-b border-[#F1F5F9] hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => router.push(`/invoice/${bill.id}`)}
                            >
                                <td className="px-4 py-3 text-sm font-medium text-gray-700">{bill.bill_number}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(bill.created_at).toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{bill.customer_name}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹ {bill.total.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{bill.payment_method || "N/A"}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bill.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                        {bill.status || "Pending"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right">
                                    <div className="flex justify-end gap-2">
                                        {bill.status !== "Paid" && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/invoice/${bill.id}/edit`); // Assuming edit page exists or will be added
                                                }}
                                                className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                                                title="Edit"
                                            >
                                                <SvgEdit className='w-5 h-5'/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/invoice/${bill.id}`); // This shows printable view
                                            }}
                                            className="p-1 hover:bg-gray-100 text-gray-600 rounded"
                                            title="Download PDF"
                                        >
                                            <Download className='w-5 h-5'/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredBills.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No invoices found matching your search.
                    </div>
                )}
            </main>
        </section>
    )
}

export default AllInvoice;
