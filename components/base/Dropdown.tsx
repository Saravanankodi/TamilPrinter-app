"use clint";

import { DropdownProps, Option } from '@/types'
import React, { useState } from 'react'


const Dropdown = ({name,option,onChange}:DropdownProps) => {
    const [open,setOpen] = useState(false);
    const [select,setSelect] = useState<Option | null>(null)

    const handleSelect =(option:Option)=>{
        setSelect(option)
        onChange(option.value)
        setOpen(false)
    }

  return (
    <>
    <div className="relative w-full max-w-64">
      <p className="text-sm">
        {name}
      </p>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-[#00000014]
                  bg-[#F8FAFC] px-4 py-2 text-sm shadow-sm"
      >
        {select ? select.label : "Select an option"}
        <span className="ml-2">▾</span>
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border
                       border-[#00000014] bg-[#F8FAFC] shadow-lg">
          {option.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option)}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>

    </>
  )
}

export default Dropdown