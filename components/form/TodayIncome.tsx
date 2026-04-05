import React from 'react'
import Input from '../base/Input'
import { RadioGroup } from '../base/RadioGroups'
import Button from '../base/Button'

const TodayIncome = () => {
    const date = new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})


  return (
    <>
    <section className="w-100 h-125 bg-[#F3F4F6] rounded-lg p-4 border border-[#00000014] space-y-2 ">
        <aside className="w-full">
            <h2 className="text-3xl text-center">
                Today Income
            </h2>
        </aside>
        <h4 className="text-base">
            Date: {date}
        </h4>

        <form action="" className="w-full space-y-2.5">
            <Input
            label='Income'
            placeholder='Enter Today Income'
            type='number'
            />
            <p className="text-base">
                Payment Method
            </p>
            <RadioGroup value={""} onValueChange={()=>{}} name='serviceType' className='w-full h-auto flex gap-2 items-center justify-center flex-wrap  text-sm' >
                <RadioGroup.Item value='cash' label='Cash'/>
                <RadioGroup.Item value='UPI' label='UPI'/>
                <RadioGroup.Item value='Card' label='Card'/>
            </RadioGroup>

            <div className="w-full flex items-center justify-center gap-5">
                <Button variant='secondary'>
                    Cancel
                </Button>
                <Button variant='primary'>
                    Save
                </Button>
            </div>
        </form>
    </section>
    </>
  )
}

export default TodayIncome