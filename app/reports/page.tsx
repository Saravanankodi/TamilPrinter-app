"use client";

import React, { useEffect, useState } from 'react';
import Card from '@/components/layout/Card';
import Button from '@/components/base/Button';
import { Calander } from '@/assets/icons';
import Table from '@/components/layout/Table';
import SvgRs from '@/assets/icons/Rs';
import SvgPaper from '@/assets/icons/Paper';
import SvgDoc from '@/assets/icons/Doc';
import SvgAvgOrder from '@/assets/icons/AvgOrder';

const Reports = () => {
    const [stats, setStats] = useState<any>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [year, setYear] = useState(new Date().getFullYear());
    const [view, setView] = useState<'month' | 'week'>('month');

    useEffect(() => {
        const fetchStats = async () => {
            if (window.api?.getReportStats) {
                const data = await window.api.getReportStats({ month, year });
                setStats(data);
            }
        };
        fetchStats();
    }, [month, year]);

    if (!stats) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading report data...</div>;

    const filteredDaily = view === 'week' 
        ? (stats.dailyRevenue || []).slice(-7) 
        : (stats.dailyRevenue || []);

    const maxRevenue = Math.max(...(filteredDaily.map((d: any) => d.revenue) || [1]));

    const exportToCSV = () => {
        const headers = ["Invoice ID", "Date", "Customer", "Items", "Amount", "Status"];
        const rows = (stats.recentTransactions || []).map((tx: any) => [
            tx.bill_number,
            new Date(tx.created_at).toLocaleString(),
            tx.customer_name,
            tx.items,
            tx.total,
            tx.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `report_${year}_${month}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <section className="w-full max-h-screen flex flex-col gap-6 overflow-y-auto pb-10 pt-0">
            <header className="w-full py-4 px-4 flex items-center justify-between bg-white rounded-lg shadow-sm border border-[#00000014]">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-sm text-gray-500">Track your business performance and revenue trends.</p>
                </div>
                <div className="flex gap-3">
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="bg-white border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {months.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select 
                        value={year} 
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-white border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <Button variant="primary" onClick={exportToCSV}>
                        Export Data
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-6 grid-rows-2 gap-6">
                <div className="w-auto col-span-2">
                    <Card 
                        label="Monthly Revenue" 
                        value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`} 
                        disc={stats.revenueChange >= 0 ? `↗ +${stats.revenueChange.toFixed(1)}% vs last month` : `↘ ${stats.revenueChange.toFixed(1)}% vs last month`} 
                        icon={<SvgRs className='w-6 h-6 text-[#0B76FF] '/>}
                    />
                </div>
                <div className="w-auto col-span-2">
                    <Card 
                        label="Total Prints" 
                        value={stats.totalPrints.toLocaleString('en-IN')} 
                        disc="This month" 
                        icon={<SvgPaper className='w-6 h-6 text-[#0B76FF] '/>}
                    />
                </div>
                <div className="w-auto col-span-2">
                    <Card 
                        label="Invoices Generated" 
                        value={stats.invoicesGenerated.toLocaleString('en-IN')} 
                        disc="Total count" 
                        icon={<SvgDoc className='w-6 h-6 text-[#0B76FF] '/>}
                    />
                </div>
                <div className="w-auto row-start-2 row-end-3 col-span-3 ">
                    <Card 
                        label="Avg. Order Value" 
                        value={`₹${Math.round(stats.avgOrderValue).toLocaleString('en-IN')}`} 
                        disc="" 
                        icon={<SvgAvgOrder className='w-6 h-6 text-[#0B76FF] '/>}
                    />
                </div>
                <div className="w-auto row-start-2 row-end-3 col-span-3">
                    <Card 
                        label="Avg. Order Value" 
                        value={`₹${Math.round(stats.avgOrderValue).toLocaleString('en-IN')}`} 
                        disc="" 
                        icon={<SvgAvgOrder className='w-6 h-6 text-[#0B76FF] '/>}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-xl p-6 border border-[#00000014] shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Revenue Overview</h3>
                            <p className="text-sm text-gray-500">Daily revenue chart</p>
                        </div>
                        <div className="flex bg-[#F1F5F9] rounded-lg p-1">
                            <button 
                                onClick={() => setView('week')}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'week' ? 'bg-white shadow-sm text-blue-600':'text-gray-500 hover:text-gray-700'}`}
                            >
                                This Week
                            </button>
                            <button 
                                onClick={() => setView('month')}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'month' ? 'bg-white shadow-sm text-blue-600':'text-gray-500 hover:text-gray-700'}`}
                            >
                                This Month
                            </button>
                        </div>
                    </div>
                    <div className="w-full h-56 flex items-end justify-between gap-1 mt-4">
                        {filteredDaily.map((day: any) => (
                            <div key={day.day} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                {day.revenue > 0 && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded hidden group-hover:block z-20 whitespace-nowrap shadow-xl">
                                        ₹{day.revenue.toLocaleString('en-IN')}
                                    </div>
                                )}
                                <div 
                                    className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600 hover:scale-x-105 opacity-80 hover:opacity-100" 
                                    style={{ height: `${Math.max((day.revenue / (maxRevenue || 1)) * 100, 3)}%` }}
                                ></div>
                                <span className={`text-[10px] text-gray-400 mt-3 block w-full text-center overflow-hidden transition-colors group-hover:text-gray-600`}>
                                    {day.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-1 bg-white rounded-xl p-6 border border-[#00000014] shadow-sm">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Service Breakdown</h3>
                    <p className="text-sm text-gray-500 mb-8">Revenue share per item type</p>
                    <div className="flex flex-col gap-6">
                        {stats.serviceBreakdown?.map((service: any) => (
                            <div key={service.name}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700">{service.name || 'Unknown'}</span>
                                    <span className="font-bold text-blue-600">{service.pct}%</span>
                                </div>
                                <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out" 
                                        style={{ width: `${service.pct}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {(!stats.serviceBreakdown || stats.serviceBreakdown.length === 0) && (
                            <div className="text-sm text-gray-400 text-center py-12 italic">No services billed this month</div>
                        )}
                    </div>
                </div>
            </div>

            {/* <div className="w-full bg-white rounded-xl p-6 border border-[#00000014] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Recent Monthly Transactions</h3>
                        <p className="text-sm text-gray-500">Latest 10 bills in selected period</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <thead>
                            <tr className="bg-[#F8FAFC] border-b">
                                <Table.Th className="text-left py-3 px-4">Bill No</Table.Th>
                                <Table.Th className="text-left py-3 px-4">Date & Time</Table.Th>
                                <Table.Th className="text-left py-3 px-4 text-gray-700">Customer</Table.Th>
                                <Table.Th className="text-left py-3 px-4 text-gray-500">Items</Table.Th>
                                <Table.Th className="text-left py-3 px-4">Amount</Table.Th>
                                <Table.Th className="text-center py-3 px-4">Status</Table.Th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentTransactions?.map((tx: any) => (
                                <tr key={tx.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-4 font-bold text-blue-600">{tx.bill_number}</td>
                                    <td className="py-4 px-4 text-sm text-gray-600">
                                        {new Date(tx.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="py-4 px-4 text-sm font-medium">{tx.customer_name || 'Walk-in Customer'}</td>
                                    <td className="py-4 px-4 text-xs text-gray-500 line-clamp-1 truncate max-w-50">{tx.items}</td>
                                    <td className="py-4 px-4 font-bold font-sans">₹{tx.total.toLocaleString('en-IN')}</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div> */}
        </section>
    );
};

export default Reports;
