import React, { useEffect, useState } from 'react'
import Input from '../base/Input'
import { customerData, Customer } from '@/types'

const CustomerDetails = ({data,setData}:customerData) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        if (window.api?.getCustomers) {
          const fetchResults = await window.api.getCustomers();
          setCustomers(fetchResults || []);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const match = customers.find(c => c.name === value);
    if (match) {
      setData((prev) => ({ ...prev, name: value, phone: match.phone || "", mail: match.mail || "" }));
    } else {
      setData((prev) => ({ ...prev, name: value }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const match = customers.find(c => c.phone === value);
    if (match) {
      setData((prev) => ({ ...prev, phone: value, name: match.name || "", mail: match.mail || "" }));
    } else {
      setData((prev) => ({ ...prev, phone: value }));
    }
  };

  return (
    <>
    <section className="w-full h-auto p-2 bg-white rounded-lg">
        <aside className="w-full h-auto">
            <h1 className="text-2xl">
                Customer Details
            </h1>
        </aside>
        <form action="" className='w-full h-auto grid grid-cols-2 grid-rows-2 gap-2'>
            <datalist id="customer-names">
              {Array.from(new Set(customers.map(c => c.name))).filter(Boolean).map((name, i) => (
                <option key={`name-${i}`} value={name} />
              ))}
            </datalist>
            <datalist id="customer-phones">
              {Array.from(new Set(customers.map(c => c.phone))).filter(Boolean).map((phone, i) => (
                <option key={`phone-${i}`} value={phone} />
              ))}
            </datalist>

            <Input 
              className='max-w-75'
              label="Customer Name" 
              type='text' 
              list="customer-names"
              placeholder='Walk-in customer' 
              value={data.name || ""} 
              onChange={handleNameChange}
              required
            />

            <Input 
              className='max-w-75'
              label="Phone Number" 
              type='tel' 
              list="customer-phones"
              placeholder='10-digit mobile number'
              value={data.phone || ""} 
              onChange={handlePhoneChange}
              maxLength={10}
              pattern="[0-9]{10}"
            />

            <Input 
              className='max-w-75'
              label="Email ID" 
              type='email' 
              placeholder='customer@example.com (Optional)'
              value={data.mail || ""}
              onChange={(e)=>{setData((prev)=>({...prev,mail:e.target.value}))}} 
            />
            <Input 
              className='max-w-75'
              label="Reference / Note" 
              type='text' 
              placeholder='E.g. College project, ID card xerox' 
              value={data.ref || ""}
              onChange={(e)=>{setData((prev)=>({...prev,ref:e.target.value}))}}
              maxLength={100}
            />
        </form>
    </section>
    </>
  )
}

export default CustomerDetails