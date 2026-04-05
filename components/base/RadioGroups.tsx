"use client";
import { RadioGroupContextType, RadioGroupProps, RadioItemProps } from '@/types';
import React, { createContext, useContext } from 'react'

const RadioGroupContext = createContext<RadioGroupContextType | null>(null);

function RadioGroupRoot({value,onValueChange,name='radio-group',children,className}:RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{value,onValueChange,name}}>
        <div role='radiogroup' className={className}>
            {children}
        </div>
    </RadioGroupContext.Provider>
  )
}
function RadioGroupItem({
    value,
    label,
    icon,
  }: RadioItemProps) {
    const ctx = useContext(RadioGroupContext);
  
    if (!ctx) {
      throw new Error("RadioGroup.Item must be used within RadioGroup");
    }
  
    const checked = ctx.value === value;
  
    return (
      <label
        className={`
          flex items-center gap-2 cursor-pointer select-none
          border  rounded-md 
          transition
          ${checked ? " bg-[#0496ff] text-white" : "bg-[#F2F4F6] border-gray-300"}
          ${icon ? "px-2 py-1" :"px-4 py-2.5"}
        `}
      >
        {/* hidden real radio */}
        <input
          type="radio"
          name={ctx.name}
          value={value}
          checked={checked}
          onChange={() => ctx.onValueChange(value)}
          className="sr-only"
          required
        />
        {icon && (
          <span className="w-8 h-8 p-1">
            {icon}
          </span> 
        )} 
        <span>{label}</span>
      </label>
    );
  }
  
export const RadioGroup= Object.assign(RadioGroupRoot,{Item:RadioGroupItem,});