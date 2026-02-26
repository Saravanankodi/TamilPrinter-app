import React from 'react'
import Input from '../base/Input'
import { customerData } from '@/types'

const CustomerDetails = ({data,setData}:customerData) => {
  return (
    <>
    <section className="w-full h-auto p-2 bg-white rounded-lg">
        <aside className="w-full h-auto">
            <h1 className="text-2xl">
                Customer Details
            </h1>
        </aside>
        <form action="" className='w-full h-auto grid grid-cols-2 grid-rows-2 gap-2'>
            <Input 
              label="Customer Name" 
              type='text' 
              placeholder='Walk-in customer' 
              value={data.name  || ""} 
              onChange={(e)=>{setData((prev)=>({...prev,name:e.target.value}))}} />

            <Input 
              label="Phone Number" 
              type='number' 
              placeholder='Enter mobile number'
              value={data.phone  || ""} 
              onChange={(e)=>{setData((prev)=>({...prev,phone:e.target.value}))}} />

            <Input 
              label="Email ID" 
              type='email' 
              placeholder='Optional for invoice copy'
              value={data.mail  || ""}
              onChange={(e)=>{setData((prev)=>({...prev,mail:e.target.value}))}} />
            <Input 
              label="Reference / Note" 
              type='text' 
              placeholder='E.g. College project, ID card xerox' 
              value={data.ref  || ""}
              onChange={(e)=>{setData((prev)=>({...prev,ref:e.target.value}))}}/>
        </form>
    </section>
    </>
  )
}

export default CustomerDetails