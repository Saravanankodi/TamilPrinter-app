"use client";
import React, { useEffect, useState, useRef } from 'react'
import Lable from '../ui/Lable'
import Table from './Table'
import { RadioGroup } from '../base/RadioGroups'
import Cash from '@/assets/icons/Cash';
import Upi from '@/assets/icons/Upi';
import Card from '@/assets/icons/Card';
import { InvoiceProps } from '@/types';
import Button from '../base/Button';
import { Print } from '@/assets/icons';
import Swal from 'sweetalert2';
import { showAlert } from '@/utils/Alert';
import { calculateInvoice } from '@/utils/invoiceCalculator';
import { generatePDF } from '@/utils/pdfGenerator';

const Invoice: React.FC<InvoiceProps> = ({customerData,billData,onSaved}) => {

        const invoiceRef = useRef<HTMLDivElement>(null);
        const [value,setValue] = useState("");
        const [currentTime, setCurrentTime] = useState<Date | null>(null);
        const [billNumber, setBillNumber] = useState<string | null>(null);
        const [shouldDownload, setShouldDownload] = useState(false);

        useEffect(() => {
            if (shouldDownload && invoiceRef.current) {
                generatePDF(
                invoiceRef.current,
                `${customerData.name || "invoice"}.pdf`
                );

                setShouldDownload(false); // reset
            }
        }, [shouldDownload]);

  useEffect(() => {
        // generate new invoice number whenever customerData resets
       
        setValue("");
    }, [customerData]);

        const saveBill = async () => {
            if (!billData || billData.length === 0) {
                await showAlert({
                icon: 'info',
                title: 'Alert!',
                text: 'You cannot enter details temporarily.',
                confirmText: 'OK',
                });
                return;
            }

            if (!value) {
                await showAlert({
                icon: 'warning',
                title: 'Select Payment',
                text: 'Please select a payment method before saving.',
                confirmText: 'OK',
                });
                return;
            }

            try {
                const result = await window.api.saveBill({
                customer: customerData,
                items: billData,
                paymentMethod: value,
                });

                setBillNumber(result.billNumber);

                await showAlert({
                icon: 'success',
                title: 'Bill Saved',
                text: `Bill number: ${result.billNumber}`,
                confirmText: 'OK',
                });

                // ✅ trigger AFTER state update
                setShouldDownload(true);

                if (result?.success) {
                onSaved();
                }

            } catch (err) {
                console.error(err);
                await showAlert({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save bill. Please try again.',
                confirmText: 'OK',
                });
            }
        };

        const BillTotal = calculateInvoice(billData)
            
  return (
    <>
    <section ref={invoiceRef} className="w-full h-full relative rounded-lg bg-white p-2 ">
        <header className="w-full h-auto border-b border-b-[#00000014] p-4">
            <aside className="flex gap-4">
                <h1 className="text-sm">
                    Current Bill
                </h1>
            </aside>
        </header>
        <main className="w-auto space-y-2">
            <aside className="w-full flex justify-between items-center p-2">
                <p className="text-sm h-fit  bg-[#E9F5FF] px-2 rounded-full ">
                    #{billNumber || "Generating..."}
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
            <div className="w-full grid grid-cols-2 grid-rows-2 gap-4 p-2">
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

                <aside className=" absolute bottom-0 flex flex-col gap-5 justify-center items-center mx-auto ">
                    <div className="w-full h-auto space-y-2">
                        
                        <div className="w-full h-min flex items-center justify-between">
                            <p className="text-xs">
                                Subtotal
                            </p>
                            <h4 className="text-xs">
                                ₹{BillTotal.subtotal}
                            </h4>
                        </div>
                        <div className="w-full h-min flex items-center justify-between">
                            <p className="text-xs">
                                Tax (GST 18%)
                            </p>
                            <h4 className="text-xs">
                                ₹{BillTotal.tax}
                            </h4>
                        </div>
                        <div className="w-full h-min flex items-center justify-between">
                            <h4 className="text-sm">
                                Grand Total
                            </h4>
                            <h4 className="text-sm">
                                ₹{BillTotal.grandTotal}
                            </h4>
                        </div>
                    </div>
                    <RadioGroup value={value} onValueChange={setValue} name='serviceType' className='w-full h-auto flex items-center justify-center gap-2 text-sm mx-auto' >
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