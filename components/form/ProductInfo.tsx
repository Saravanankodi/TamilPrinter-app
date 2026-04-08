'use client'
import React, { useState } from 'react'
import Input from '../base/Input'
import Dropdown from '../base/Dropdown'

const ProductInfo = () => {
    const[product,setProduct] = useState("");
    const productList = [
        {label:'A4',value:'a4'}
    ]
  return (
    <>
    <section className="w-full h-auto p-4 rounded-md bg-white max-w-200">
        <header className="w-full h-auto">
            <h1 className="text-base">
                Basic Information
            </h1>
        </header>
        <form action="" className="w-full">
            <Input label='Product Name' placeholder='e.g. Color Print A4 High Glossy' className='max-w-200 text-black' />
            <div className="w-full flex items-end gap-2">
                <Dropdown name='Category' value={product} option={productList} onChange={(value)=>{setProduct(value)}}/>
                <Input label='Product Code / SKU (Optional)' placeholder='e.g. PRT-001' className='text-black'/>
            </div>
            <Input label='Description' placeholder='Enter product details, specifications...' className='text-black'/>
        </form>
    </section>
    </>
  )
}

export default ProductInfo