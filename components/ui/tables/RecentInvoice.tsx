"use client";
import Download from "@/assets/icons/Download";
import Button from "@/components/base/Button";
import Table from "@/components/layout/Table";
import SvgEdit from "@/assets/icons/Edit";
import { useRouter } from "next/navigation"; 
import { useEffect, useState } from "react";

const RecentInvoice = () => {
    const router = useRouter();
    const [bills, setBills] = useState<any[]>([]);

    useEffect(() => {
        const fetchBills = async () => {
          if (window.api?.getBills) {
            const data = await window.api.getBills();
            setBills(data || []);
          }
        };
        fetchBills();
      }, []);
      
  return (
    <section className="w-full h-full bg-white rounded-xl shadow-sm border border-[#00000014] overflow-hidden flex flex-col">
        <header className="w-full flex items-center justify-between px-1 py-2 border-b border-[#00000014]">
            <h1 className="text-lg font-bold">Recent Invoices</h1>
            <Button variant="outline" onClick={() => router.push("/invoice")} className="text-xs bg-white text-gray-600 border-gray-300 hover:bg-gray-50 transition-colors">
                View All
            </Button>
        </header>
        <div className="flex-1 overflow-y-auto">
            <Table className="w-full text-left">
                <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#F1F5F9] z-10">
                    <Table.Row>
                        <Table.Cell className="text-xs font-bold text-[#667085] tracking-wider">Bill ID</Table.Cell>
                        <Table.Cell className="text-xs font-bold text-[#667085] tracking-wider">Customer</Table.Cell>
                        <Table.Cell className="text-xs font-bold text-[#667085] tracking-wider">Date</Table.Cell>
                        <Table.Cell className="text-xs font-bold text-[#667085] tracking-wider text-right">Amount</Table.Cell>
                        <Table.Cell className="text-xs font-bold text-[#667085] tracking-wider text-center">Status</Table.Cell>
                        <Table.Cell className="text-xs font-bold text-[#667085] tracking-wider text-right">Actions</Table.Cell>
                    </Table.Row>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                    {bills.map((bill) => (
                        <Table.Row 
                            key={bill.id} 
                            className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/invoice/${bill.id}`)}
                        >
                            <Table.Cell className="text-sm font-normal text-black">
                                {bill.bill_number}
                            </Table.Cell>

                            <Table.Cell className="text-sm font-medium text-black">
                                {bill.customer_name || 'Walk-in'}
                            </Table.Cell>

                            <Table.Cell className="text-xs text-[#667085] ">
                                {new Date(bill.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Table.Cell>

                            <Table.Cell className="text-sm font-semibold text-right text-black">
                                ₹{bill.total.toLocaleString('en-IN')}
                            </Table.Cell>
                            <Table.Cell className="text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-widest ${bill.status === "Paid" ? "bg-[#DCFCE7] text-[#166534]":"bg-[#FEF9C3] text-[#854D0E] "}`}>
                                    {bill.status}
                                </span>
                            </Table.Cell>
                            <Table.Cell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        className="p-1.5 hover:bg-white text-blue-600 border border-transparent hover:border-blue-100 rounded-lg shadow-sm"
                                        title="Print"
                                        onClick={(e) => { e.stopPropagation(); router.push(`/invoice/${bill.id}`); }}
                                    >
                                        <Download className="w-5 h-5"/>
                                    </button>
                                    <button 
                                        className="p-1.5 hover:bg-white text-gray-600 border border-transparent hover:border-gray-100 rounded-lg shadow-sm"
                                        title="Edit"
                                        onClick={(e) => { e.stopPropagation(); router.push(`/invoice/${bill.id}/edit`); }}
                                    >
                                        <SvgEdit className="w-5 h-5"/>
                                    </button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                    {bills.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No recent invoices found</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    </section>
  )
}

export default RecentInvoice;