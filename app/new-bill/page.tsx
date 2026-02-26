"use client"
import AddBill from '@/components/form/AddBill'
import CustomerDetails from '@/components/form/CustomerDetails'
import Invoice from '@/components/layout/Invoice'
import { BillData } from '@/types'
import { useState } from 'react'


// const emptyCustomer = {
//   name: "",
//   mail: "",
//   phone: "",
//   ref: ""
// };

const NewBill = () => {
  const [customerData,setCustomerData]=useState({
    name:"",
    mail:"",
    phone:"",
    ref:""
  });

  const [billData, setBillData] = useState<BillData[]>([]);
  const resetForm = () => {
    setCustomerData({ name: "", mail: "", phone: "", ref: "" });
    setBillData([]);
  };
  return (
    <>
    <section className="w-full h-max max-h-screen ">
      <header className="w-full p-2 flex items-center justify-between bg-white border border-[#00000014]">
        <aside className="w-fit h-full">
          <div className="h-fit flex items-center gap-2">
          <h1 className="text-[20px]">
            New Bill
          </h1>
          <p className="text-sm ">
            Fast counter billing
          </p>
          </div>
          <p className="text-sm">
            Use Tab / Enter to move between fields
          </p>
        </aside>
        <div className="w-fit flex items-center gap-2">
          {/* Date and Time */}
          <div className="w-fit text-right  border-r pr-6 border-[#00000014]">
            <p className="text-sm font-semibold ">
              Bill No.
            </p>
            <span className="text-base text-black font-semibold">
              #INV-0102
            </span>
          </div>
          
        </div>
      </header>
      <main className="w-full h-full grid grid-cols-5 grid-rows-3 my-2 gap-2">
        <div className="w-auto col-span-3 ">
          <CustomerDetails data={customerData} setData={setCustomerData} />
        </div>
        <div className="col-span-3 row-span-2 ">
          <AddBill data={billData} setData={setBillData}/>
        </div>
        <div className="row-span-3 col-span-2 row-start-1 col-start-4 ">
          <Invoice onSaved={resetForm} customerData={customerData} billData={billData}/>
        </div>
      </main>
    </section>
    </>
  )
}

export default NewBill