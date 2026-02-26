"use client";
import React, { useEffect, useState } from 'react'
import Lable from '../ui/Lable'
import Table from './Table'
import { RadioGroup } from '../base/RadioGroups'
import Cash from '@/assets/icons/Cash';
import Upi from '@/assets/icons/Upi';
import Card from '@/assets/icons/Card';
import { InvoiceProps } from '@/types';
import Button from '../base/Button';
import { Print } from '@/assets/icons';

const Invoice: React.FC<InvoiceProps> = ({customerData,billData,onSaved}) => {
        const [value,setValue] = useState("");
        const [currentTime, setCurrentTime] = useState<Date | null>(null);

        useEffect(() => {
          const timer = setInterval(() => {
            setCurrentTime(new Date()); // update every second
          }, 1000);
      
          return () => clearInterval(timer); // cleanup on unmount
        }, []);

  useEffect(() => {
        // generate new invoice number whenever customerData resets
       
        setValue("");
    }, [customerData]);

        const saveBill = async () => {
            if (!billData || billData.length === 0) {
              alert("No items in bill");
              return;
            }
          
            if (!value) {
              alert("Select payment method");
              return;
            }
          
            try {
              const result = await window.api.saveBill({
                customer: customerData,
                items: billData,
                paymentMethod: value,
              });
          
              alert("Bill saved: " + result.billNumber);
              if (result?.success) {
                onSaved(); // reset form
                }
            } catch (err) {
              console.error(err);
              alert("Failed to save bill");
            }
          };
            
  return (
    <>
    <section className="w-full h-full relative rounded-lg bg-white p-1 ">
        <header className="w-full h-auto border-b border-b-[#00000014] p-4">
            <aside className="flex gap-4">
                <h1 className="text-sm">
                    Current Bill
                </h1>
                <p className="text-sm bg-[#E9F5FF] px-2 rounded-full ">
                    #INV-2023-8492
                </p>
            </aside>
        </header>
        <main className="w-auto space-y-2">
            <aside className="w-full flex justify-between items-center p-2">
                <p className="text-sm h-fit  bg-[#E9F5FF] px-2 rounded-full ">
                    #INV-2023-8492
                </p>
                <div className="w-auto">
                    <p className="text-sm">
                        {currentTime?.toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-sm">
                        {currentTime?.toLocaleTimeString()}
                    </p>
                </div>
            </aside>
            <div className="grid grid-cols-2 grid-rows-2 gap-4 p-2">
                <Lable Name='Customer Name' value={customerData.name}/>
                <Lable Name='Phone' value={customerData.phone}/>
                <Lable Name='Email' value={customerData.mail}/>
                <Lable Name='Ref' value={customerData.ref}/>
            </div>
            <section className='h-full text-xs space-y-2'>
                <main className="w-full h-full flex-1">
                    <Table>
                        <tbody>
                            <Table.Row>
                                <Table.Th>Item</Table.Th>
                                <Table.Th>Qty</Table.Th>
                                <Table.Th>Paper</Table.Th>
                                <Table.Th>Rate</Table.Th>
                                <Table.Th>Amount</Table.Th>
                            </Table.Row>
                            {Array.isArray(billData) && billData.map((data)=>(
                                <Table.Row key={data.id}>
                                    <Table.Cell>
                                        {data.service}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {data.quantity}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {data.paper}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {data.rate}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {data.quantity * data.paper * data.rate}
                                    </Table.Cell>
                                </Table.Row>
                            ))}                    
                        </tbody>
                    </Table>
                </main>

                <aside className=" absolute bottom-0 flex flex-col gap-3 justify-center items-center">
                    <RadioGroup value={value} onValueChange={setValue} name='serviceType' className='w-full h-auto flex items-center justify-center gap-2 text-sm' >
                        <RadioGroup.Item value='Cash' label='Cash' icon={<Cash/>} />
                        <RadioGroup.Item value='UPI' label='UPI / QR' icon={<Upi/>} />
                        <RadioGroup.Item value='Card' label='Card' icon={<Card/>}/>
                        <RadioGroup.Item value='Pending' label='Pending'/>
                    </RadioGroup>

                    <Button variant='primary' icon={<Print className='w-6 h-6'/>} onClick={saveBill} className='w-4/5'>
                        Generate & Print Invoice
                    </Button>
                </aside>
            </section>
        </main>
    </section>
    </>
  )
}

export default Invoice