'use client'
import React, { useState } from 'react'
import Input from '../base/Input'
import Dropdown from '../base/Dropdown'

const Inventory = () => {
    const[product,setProduct] = useState("");
    const productList = [
        {label:'A4',value:'a4'}
    ]
  return (
    <>
    <section className="w-full h-auto p-4 rounded-md bg-white max-w-200">
        <header className="w-full h-auto">
            <h1 className="text-base">
                Pricing & Tax
            </h1>
        </header>
        <form action="" className="w-full grid grid-cols-2 grid-rows-2 gap-2">
            <Dropdown value={product} name='Category' option={productList} onChange={(value)=>{setProduct(value)}}/>
            <Input label='Product Code / SKU (Optional)' placeholder='e.g. PRT-001' className='text-black col-start-1 row-start-2'/>
            <Input label='Description' placeholder='Enter product details, specifications...' className='text-black col-start-2 row-start-2'/>
        </form>
    </section>
    </>
  )
}

export default Inventory