"use client"
import React, { useEffect, useState } from 'react'
import { Add } from '@/assets/icons'
import Download from '@/assets/icons/Download'
import Button from '@/components/base/Button'
import Table from '@/components/layout/Table'
import { Customer } from '@/types'
import Input from '@/components/base/Input'

const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCustomers = async () => {
        try {
            if (window.api?.getCustomers) {
                const data = await window.api.getCustomers();
                setCustomers(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch customers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = (customers || []).filter(customer => 
        customer.name?.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(search.toLowerCase()) ||
        customer.mail?.toLowerCase().includes(search.toLowerCase())
    );

    const exportToCSV = () => {
        const headers = ["Customer Name", "Contact", "Email", "Last Visit", "Total Spent", "Pending Amount"];
        const rows = filteredCustomers.map(c => [
            c.name,
            c.phone,
            c.mail,
            c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "--",
            c.totalSpent,
            c.pending
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `customers_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="w-full h-auto max-h-screen p-4 flex flex-col gap-4 no-scrollbar">
            <header className="w-full py-4 px-4 flex items-center justify-between bg-white rounded-lg shadow-sm border border-[#00000014]">
                <aside className="w-fit h-full">
                    <h1 className="text-2xl font-bold">Customers</h1>
                    {/* <p className="text-sm text-gray-500">Manage your client list and billing history.</p> */}
                </aside>
                <div className="flex items-center gap-3">
                    <Button icon={<Download/>} variant='outline' onClick={exportToCSV}>
                        Export List
                    </Button>
                    <Button icon={<Add/>} variant='primary' >
                        Add Customer
                    </Button>
                </div>
            </header>
            <Input 
                    placeholder="Search customers..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-100"
                />                
                <main className="w-full bg-white rounded-lg shadow-sm border border-[#00000014] overflow-scroll no-scrollbar">
                    <Table className='no-scrollbar'>
                        <Table.Head>
                            <Table.Row>
                                <Table.Th className="px-4 py-3">Customer Name</Table.Th>
                                <Table.Th className="px-4 py-3">Contact</Table.Th>
                                <Table.Th className="px-4 py-3">Last Visit</Table.Th>
                                <Table.Th className="px-4 py-3">Total Spent</Table.Th>
                                <Table.Th className="px-4 py-3">Pending Amount</Table.Th>
                            </Table.Row>
                        </Table.Head>
                        <tbody>
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="p-8 text-center text-gray-400">Loading...</Table.Cell>
                                </Table.Row>
                            ) : filteredCustomers.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} className="p-8 text-center text-gray-400 font-medium">No customers found</Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <Table.Row key={customer.id} className="border-b transition-colors hover:bg-gray-50">
                                        <Table.Cell className="px-4 py-3 font-medium text-[#111827] text-sm ">
                                            {customer.name}
                                        </Table.Cell>
                                        <Table.Cell className="px-4 py-3 text-[#111827] text-sm ">
                                            {customer.phone}
                                            <span className="text-[#64748B] text-xs block">
                                                {customer.mail || "--"}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="px-4 py-3 text-[#111827] text-sm ">
                                            {customer.lastVisit
                                                ? new Date(customer.lastVisit).toLocaleDateString('en-IN')
                                                : "--"}
                                        </Table.Cell>
                                        <Table.Cell className="px-4 py-3 font-semibold text-[#111827] text-sm">
                                            ₹{(customer.totalSpent ?? 0).toLocaleString('en-IN')}
                                        </Table.Cell>
                                        <Table.Cell className="px-4 py-3 font-semibold text-[#111827] text-sm">
                                            ₹{(customer.pending ?? 0).toLocaleString('en-IN')}
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </tbody>
                    </Table>
                    {!loading && filteredCustomers.length > 0 && (
                        <div className="p-4 bg-[#F8FAFC] border-t text-sm text-gray-500 sticky bottom-0 border-b border-[#F1F5F9] z-10">
                            Total {filteredCustomers.length} customers
                        </div>
                    )}
                </main>
        </section>
    )
}

export default Customers