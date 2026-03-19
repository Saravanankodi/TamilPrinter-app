"use client";
import Button from "@/components/base/Button";
import Table from "@/components/layout/Table";
import { Bill } from "@/types";
import { useRouter } from "next/navigation"; 
import { useEffect, useState } from "react";

const RecentInvoice = () => {
    const router = useRouter();
    const [bills, setBills] = useState<any[]>([]);

    useEffect(() => {
        const fetchBills = async () => {
          if (window.api?.getBills) {
            const data = await window.api.getBills();
            setBills(data);
          }
        };
        fetchBills();
      }, []);
      
      
  return (
    <>
    <section className="w-full h-full col-span-5 row-span-4 col-start-1 row-start-1 bg-white rounded-md flex flex-col">
        <header className="w-full flex items-center justify-between px-1 py-2 border-b border-[#00000014]">
            <h1 className="text-lg">Recent Invoices</h1>
            <Button variant="outline" onClick={() => router.push("/invoice")} >
                View All
            </Button>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            <Table >
                <tbody>
                    <Table.Row>
                        <Table.Cell>
                            Invoice ID
                        </Table.Cell>
                        <Table.Cell>
                            Customer
                        </Table.Cell>
                        <Table.Cell>
                            Time
                        </Table.Cell>
                        <Table.Cell>
                            Amount
                        </Table.Cell>
                        <Table.Cell>
                            Payment
                        </Table.Cell>
                        <Table.Cell>
                            Status
                        </Table.Cell>
                    </Table.Row>
                    {bills.map((bill) => (
                <Table.Row key={bill.id} onClick={() => router.push(`/invoice/${bill.id}`)}>
                    <Table.Cell>{bill.bill_number}</Table.Cell>
                    <Table.Cell>{bill.customer_name}</Table.Cell>
                    <Table.Cell>
                    {new Date(bill.created_at).toLocaleString()}
                    </Table.Cell>
                    <Table.Cell>₹ {bill.total}</Table.Cell>
                    <Table.Cell>{bill.payment_method}</Table.Cell>
                    <Table.Cell>
                        <span className={`w-fit h-auto px-2 py-1 rounded-full text-center ${bill.status === "Paid" ? "bg-[#DCFCE7] text-[#166534]":"bg-[#FEF9C3] text-[#854D0E] "}`}>
                            {bill.status}
                        </span>
                    </Table.Cell>
                </Table.Row>
                ))}
                </tbody>
            </Table>
        </main>
    </section>
    </>
  )
}

export default RecentInvoice