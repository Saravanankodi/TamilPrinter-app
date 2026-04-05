"use client";

import React, { useState } from 'react'
import { RadioGroup } from '../base/RadioGroups'
import Input from '../base/Input';
import Lable from '../ui/Lable';
import Button from '../base/Button';
import AddRounded from '@/assets/icons/AddRounded';
import Dropdown from '../base/Dropdown';
import { BillData, billData } from '@/types';

const AddBill = ({data,setData}:billData) => {
    const [formData, setFormData] = useState<Omit<BillData, "id">>({
        service: "",
        quantity: 1,
        paper: 0,
        page: 0,
        rate: 0,
        print: "",
        amount:"",
        note: ""
      });
    
    const options = [
        { label: "Select", value: "" },
        { label: "Front-only", value: "Front-only" },
        { label: "Front & Back", value: "Front & Back" },
        { label: "Booklet", value: "Booklet" },
      ];
      const increment = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }));
      };
      
      const decrement = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setFormData(prev => ({
          ...prev,
          quantity: prev.quantity > 0 ? prev.quantity - 1 : 0
        }));
      };
      
    
    React.useEffect(() => {
        if (formData.print === "Booklet") {
            setFormData(prev => ({ ...prev, paper: Math.ceil(prev.page / 4) }));
        } else if (formData.print === "Front & Back") {
            setFormData(prev => ({ ...prev, paper: Math.ceil(prev.page / 2) }));
        } else if (formData.print === "Front-only") {
            setFormData(prev => ({ ...prev, paper: prev.page }));
        }
    }, [formData.page, formData.print]);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setFormData(prev => ({
          ...prev,
          quantity: val >= 1 ? val : 0
        }));
      };      

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setData(prev => [...prev, { ...formData, id: crypto.randomUUID() }]);

        setFormData({
          service: "",
          quantity: 1,
          paper: 0,
          page: 0,
          amount:"",
          rate: 0,
          print: "",
          note: ""
        });
      };
      
  return (
    <>
    <section className="w-full h-full p-2 bg-white rounded-lg ">
        <header className="w-full h-auto max-h-15 flex items-center justify-between p-2 border-b border-b-[#00000014]">
            <h1 className="text-base">
                Add Items
            </h1>
            <button className='text-sm text-[#0496ff]  ' >Reset Form</button>
        </header>
        <form onSubmit={handleSubmit}  className='h-max  p-2 space-y-2'>
            {/* <Lable Name='Service Type' value={formData.service || "Select Service Type"}/> */}
            <p className="text-sm">
                Service Type
            </p>
            <RadioGroup value={formData.service} onValueChange={(e)=>(setFormData((value)=>({...value,service:e})))} name='serviceType' className='w-full h-auto flex gap-2 items-center justify-center flex-wrap  text-sm' >
                <RadioGroup.Item value='A4 Color' label='A4 Color'/>
                <RadioGroup.Item value='A4 (B/W)' label='A4 (B/W)'/>
                <RadioGroup.Item value='Xerox' label='Xerox'/>
                <RadioGroup.Item value='Spiral Bind' label='Spiral Bind'/>
                <RadioGroup.Item value='Lamination' label='Lamination'/>
                <RadioGroup.Item value='Scan' label='Scan'/>
            </RadioGroup>
            <div className="flex items-center justify-center gap-4">
                <div className="w-auto flex items-end justify-center gap-2">
                    <button
                        onClick={decrement}
                        className="px-4 py-2 bg-[#F8FAFC] max-h-10 outline-none border border-[#00000014] text-sm rounded-md "
                    >
                        -
                    </button>
                    <Input label='Quantity' type='number' value={formData.quantity} onChange={handleChange} required />
                    <button
                        onClick={increment}
                        className="px-4 py-2 bg-[#F8FAFC] max-h-10  outline-none border border-[#00000014] text-sm rounded-md "
                    >
                        +
                    </button>
                </div>
                <Input label='Page' type='number' value={formData.page} onChange={(e)=>(setFormData((prev)=>({...prev,page:Number(e.target.value)})))} required/>
                <Dropdown name='Print Type' option={options} value={formData.print} onChange={(value)=>setFormData((prev)=>({...prev,print:value}))}/>
                <Input label='Rate (per paper)' type='number' value={formData.rate} onChange={(e)=>(setFormData((prev)=>({...prev,rate:Number(e.target.value)})))} required />
            </div>

            <div className="flex items-end gap-3">
                <Input label='Paper' type='number' value={formData.paper} onChange={(e)=>(setFormData((prev)=>({...prev,paper:Number(e.target.value)})))} required/>
                <Input label='Name (Optional)' placeholder='Add specific instructions...' value={formData.note} onChange={(e)=>(setFormData((prev)=>({...prev,note:e.target.value})))}/>
            </div>

            <Button type='submit' icon={<AddRounded/>} className='w-full font-semibold' variant='secondary'>
                Add To Bill
            </Button>
        </form>
    </section>
    </>
  )
}

export default AddBill