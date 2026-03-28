import { LableProps } from '@/types'
import React from 'react'

const Lable = ({Name,value}:LableProps) => {
  return (
    <>
    <div className='w-full h-auto'>
        <label htmlFor='name' className='text-[#64748B] text-sm block my-1' >
            {Name}
        </label>
        <p className='bg-[#F8FAFC] min-h-[38px] w-full outline-none border border-[#00000014] text-sm p-2 rounded-md '>
            {value || '-'}
        </p>
    </div>    
    </>
  )
}

export default Lable