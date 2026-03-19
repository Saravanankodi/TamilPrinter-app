"use client"
import { useEffect, useState } from 'react';
import { Add, Customers, Notification } from "@/assets/icons";
import Card from "@/components/layout/Card";
import Header from "@/components/layout/Header";
import RecentInvoice from "@/components/ui/tables/RecentInvoice";
import { calculateDashboardStats } from '@/utils/dashboard';

export default function Home() {
const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);

  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);

  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  const [invoices, setInvoices] = useState<any[]>([]);

useEffect(() => {
  async function loadInvoices() {
    const data = await window.api.getBills();
    setInvoices(data);
  }

  loadInvoices();
}, []);
const stats = calculateDashboardStats(invoices);
  return (
    <>
    <section className="w-full h-full max-h-svh  flex flex-col gap-1 text-black">
      <header className="w-full h-min p-2 flex items-center justify-between bg-white border border-[#00000014]">
        <aside className="w-fit h-full">
          <h1 className="text-[20px]">
            Dashboard
          </h1>
          <p className="text-sm">
            Welcome back, Admin
          </p>
        </aside>
        <div className="w-fit flex items-center gap-2">
          {/* Date and Time */}
          <div className="w-fit text-right  border-r pr-6 border-[#00000014]">
            <h4 className="text-sm font-semibold text-black">
              {date}
            </h4>
            <p className="text-sm">
              {time}
            </p>
          </div>
          <div className="w-fit h-fit rounded-full bg-[#F1F5F9] p-2 ">
            <Notification className="w-6 h-6"/>
          </div>
        </div>
      </header>
      <div className="w-full h-40 flex items-center justify-center gap-6">
          <Card 
            label="Today's Revenue"
            value={`₹${stats.todaysRevenue.toFixed(2)}`}
            disc={`${stats.percentChange.toFixed(1)}% from yesterday`}
          />

          <Card 
            label="Invoices Generated"
            value={stats.invoicesGenerated.toString()}
            disc="Today"
          />

          <Card 
            label="Monthly Sales"
            value={`₹${stats.monthlySales.toFixed(2)}`}
            disc="This month"
          />

          <Card 
            label="Payment Pending"
            value={`₹${stats.pendingPayments.toFixed(2)}`}
            disc="Unpaid invoices"
          />
      </div>
      <main className="w-full flex-1 grid grid-cols-8 grid-rows-4 gap-4 overflow-hidden pb-4">
          <RecentInvoice/>
        <div className="w-full h-full bg-white rounded-md col-span-3 row-span-2 col-start-6 row-start-1">
          <header className="w-full h-auto px-2 py-3 border-b border-[#00000014] ">
            <h1 className="text-lg">Quick Actions</h1>
          </header>
          <div className=" h-fit flex flex-col gap-2 items-center justify-center p-1">
            <aside className="w-full h-fit flex-1">
              <div className="flex items-center gap-5 border border-[#00000014] p-2 rounded-lg">
                <div className="w-fit h-fit p-1 rounded-md bg-[#0496ff]">
                  <Add className="w-6 h-6 text-white"/>
                </div>
                <div className="w-auto">
                  <span className="text-base">New Bill</span>
                  <p className="text-sm">Create invoice for customer</p>
                </div>
              </div>
            </aside>
            <aside className="w-full h-fit flex-1">
              <div className="flex items-center gap-5 border border-[#00000014] p-2 rounded-lg">
                <div className="w-fit h-fit p-1 rounded-md bg-[#F1F5F9]">
                  <Customers className="w-6 h-6 text-black"/>
                </div>
                <div className="w-auto">
                  <span className="text-base">Add Customer</span>
                  <p className="text-sm">Register new client</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
        <div className="w-full h-full bg-white rounded-md col-span-3 row-span-2 col-start-6 row-start-3">
          <header className="w-full h-auto px-2 py-3 border-b border-[#00000014] ">
            <h1 className="text-lg">Stock Alerts</h1>
          </header>
        </div>
      </main>     
    </section>
    </>
  );
}
