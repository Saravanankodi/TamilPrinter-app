"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Invoice from "@/components/layout/Invoice";

export default function InvoicePage() {
  const params = useParams();
  const id = Number(params.id);

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!window.api) return;

    window.api.getBillDetails(id).then(setData);
  }, [id]);

  if (!data) return <p>Loading...</p>;

  const { bill, customer, items } = data;

  return (
    <>
    <section className="w-1/2 h-full">
      <Invoice billData={items} customerData={customer} onSaved={()=>{}} existingBill={bill} />
    </section>
    </>
  );
}
