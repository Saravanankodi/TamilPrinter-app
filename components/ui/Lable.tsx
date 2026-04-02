import { LableProps } from '@/types'
import React from 'react'

const Lable = ({Name,value}:LableProps) => {
  return (
    <>
    <div className='w-full h-auto'>
        <label htmlFor='name' className='text-[#64748B] text-sm block my-1' >
            {Name}
        </label>
        <h4 className='bg-[#F8FAFC] text-black min-h-9.5 w-full outline-none border border-[#00000014] text-sm p-2 rounded-md '>
            {value || '-'}
        </h4>
    </div>    
    </>
  )
}

export default Lable