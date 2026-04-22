"use client"
import { useEffect, useState, useRef } from 'react';
import { Add, Customers, Notification, Calander, Document, Info } from "@/assets/icons";
import Card from "@/components/layout/Card";
import RecentInvoice from "@/components/ui/tables/RecentInvoice";
import { calculateDashboardStats } from '@/utils/dashboard';
import Link from 'next/link';
import Cash from '@/assets/icons/Cash';
import Download from '@/assets/icons/Download';
import SvgDoc from '@/assets/icons/Doc';
import { generatePDF } from '@/utils/pdfGenerator';
import TodayIncome from '@/components/form/TodayIncome';

export default function Home() {
    const [now, setNow] = useState(new Date());
    const [invoices, setInvoices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [totalPrints, setTotalPrints] = useState(0);
    const [showIncomePopup, setShowIncomePopup] = useState(false);
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    useEffect(() => {
        async function loadData() {
            if (window.api?.getBills) {
                const data = await window.api.getBills();
                setInvoices(data || []);
            }
            if (window.api?.getProducts) {
                const prodData = await window.api.getProducts();
                setProducts(prodData || []);
            }
            if (window.api?.getReportStats) {
                const d = new Date();
                const stats = await window.api.getReportStats({ month: d.getMonth() + 1, year: d.getFullYear() });
                if (stats && stats.totalPrints !== undefined) {
                    setTotalPrints(stats.totalPrints);
                }
            }
        }
        loadData();
    }, []);

    const stats = calculateDashboardStats(invoices);
    const lowStockItems = products.filter(p => p.track_stock === 1 && p.current_stock < 10);

    return (
        <section ref={dashboardRef} className="w-full h-full flex flex-col gap-2 text-black p-4 pt-0 overflow-y-auto relative">
            <header data-html2canvas-ignore className="w-full h-min p-2 flex items-center justify-between bg-white border border-[#00000014]">
                <aside>
                    <h1 className="text-2xl font-bold">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Welcome back, Admin
                    </p>
                </aside>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-fit text-right flex flex-col  border-r pr-6 border-[#00000014]">
                            <span className="text-sm font-semibold text-black">
                                {dateStr}
                            </span>
                            <span className="text-sm">
                                {timeStr}
                            </span>
                        </div>
                    </div>
                    <div
                        className="relative cursor-pointer group hover:bg-[#F1F5F9] transition-all rounded-full p-2 border border-transparent hover:border-gray-200"
                        onClick={() => dashboardRef.current && generatePDF(dashboardRef.current, `Dashboard_${dateStr.replace(/ /g, '_')}.pdf`)}
                    >
                        <Download className="w-6 h-6 text-gray-600 transition-colors group-hover:text-blue-600" />
                        {/* <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-100 animate-pulse"></span> */}
                    </div>
                </div>
            </header>

            <div className="w-full h-40 flex items-center justify-center gap-6">
                <Card
                    label="Today's Revenue"
                    value={`₹${stats.todaysRevenue.toLocaleString('en-IN')}`}
                    disc={`${stats.percentChange >= 0 ? '↗' : '↘'} ${Math.abs(stats.percentChange).toFixed(1)}% vs yesterday`}
                    color='#10B981'
                    icon={<Cash className='w-8 h-8 bg-[#EBF8FF] text-[#0B84FF] rounded-md p-2 ' />}
                />
                <Card
                    label="Invoices Generated"
                    value={stats.invoicesGenerated.toString()}
                    disc="Today so far"
                    color='#10B981'
                    icon={<Document className='w-8 h-8 bg-[#F3F4F6] text-[#374151] rounded-md p-2 ' />}
                />
                <Card
                    label="Total Paper Print"
                    value={totalPrints.toString()}
                    disc="This month"
                    color='#10B981'
                    icon={<SvgDoc className='w-8 h-8 bg-[#FEF2F2] rounded-md p-2 ' />}
                />
                <Card
                    label="Today Total"
                    value={`₹${stats.todaysIncome.toLocaleString('en-IN')}`}
                    disc="Current month billing"
                    color='#10B981'
                    icon={<Calander className='w-8 h-8 bg-[#ECFDF5] text-[#059669] rounded-md p-2 ' />}
                />
                <Card
                    label="Payment Pending"
                    value={`₹${stats.pendingPayments.toLocaleString('en-IN')}`}
                    disc="Total pending collections"
                    color='#EF4444'
                    icon={<Info className='w-8 h-8 bg-[#FEF2F2] text-[#DC2626] rounded-md p-2 ' />}
                />
            </div>
            <main className="w-full max-h-screen grid grid-cols-12 grid-rows-6 gap-4 overflow-hidden pb-4">
                <div className="col-span-8 row-span-6 flex flex-col gap-2">
                    <RecentInvoice />
                </div>
                {/* Quick Actions */}
                <div className="col-span-4 row-span-3 bg-white rounded-xl shadow-sm border border-[#00000014] overflow-scroll no-scrollbar flex flex-col">
                    <header className="w-full h-auto px-2 py-3 border-b border-[#00000014] ">
                        <h3 className="font-bold text-lg">
                            Quick Actions
                        </h3>
                    </header>
                    <div className="p-2 flex flex-col gap-3">
                        <Link href="/new-bill" className="flex items-center gap-4 p-2 border border-[#E2E8F0] hover:border-blue-400 hover:bg-blue-50/50 rounded-xl transition-all group">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                                <Add className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm group-hover:text-blue-700">Create New Bill</h4>
                                <p className="text-xs text-gray-500 font-medium">Start a new customer invoice</p>
                            </div>
                        </Link>
                        <Link href="/customers" className="flex items-center gap-4 p-2 border border-[#E2E8F0] hover:border-blue-400 hover:bg-blue-50/50 rounded-xl transition-all group">
                            <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:scale-110 transition-transform">
                                <Customers className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm group-hover:text-blue-700">
                                    Client Database
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">
                                    Manage your customer list
                                </p>
                            </div>
                        </Link>
                        <button onClick={() => setShowIncomePopup(true)} className="flex items-center gap-4 p-2 border border-[#E2E8F0] hover:border-blue-400 hover:bg-blue-50/50 rounded-xl transition-all group">
                            <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:scale-110 transition-transform">
                                <Customers className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm group-hover:text-blue-700">
                                    Today Income
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">
                                    View today's earnings
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Inventory Overview */}
                <div className="col-span-4 row-span-3 w-full h-full bg-white rounded-xl shadow-sm border border-[#00000014] overflow-hidden flex flex-col flex-1 ">
                    <header className="w-full h-auto px-2 py-3 border-b border-[#00000014] flex justify-between items-center">
                        <h3 className="font-bold text-lg">
                            Inventory Overview
                        </h3>
                        {lowStockItems.length > 0 && (
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{lowStockItems.length} Low</span>
                        )}
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {products.filter(p => p.track_stock === 1).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8 gap-3 opacity-60">
                                <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center">📦</div>
                                <p className="text-sm font-medium">No items tracked</p>
                            </div>
                        ) : (
                            products.filter(p => p.track_stock === 1).map(item => (
                                <div key={item.id} className={`flex items-center justify-between p-3 border rounded-lg ${item.current_stock < 10 ? 'border-red-50 bg-red-50/30' : 'border-gray-50 bg-gray-50/30'}`}>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</span>
                                        <span className="text-[10px] text-gray-500 uppercase">{item.category}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold p-1 rounded bg-white border ${item.current_stock < 10 ? 'text-red-600 border-red-100' : 'text-blue-600 border-blue-100'}`}>
                                            {item.current_stock} {item.current_stock <= 1 ? 'unit' : 'units'} left
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border-t">
                        <Link href="/products" className="text-xs text-blue-600 font-bold hover:underline w-full text-center block uppercase tracking-wider">Manage Inventory</Link>
                    </div>
                </div>

            </main>
            {
                showIncomePopup && (
                    <div className="w-auto absolute top-1/2 left-1/2 -translate-1/2 z-11">
                        <TodayIncome />
                    </div>
                )
            }

        </section>
    );
}
