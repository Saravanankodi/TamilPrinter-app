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

const Invoice: React.FC<InvoiceProps> = ({customerData,billData,onSaved,setBillData, existingBill}) => {

        const invoiceRef = useRef<HTMLDivElement>(null);
        const [value,setValue] = useState("");
        const [currentTime, setCurrentTime] = useState<Date>(new Date());
        const [billNumber, setBillNumber] = useState<string | null>(existingBill?.bill_number || null);
        const [shouldDownload, setShouldDownload] = useState(false);

        useEffect(() => {
            const fetchNextBill = async () => {
                if (!billNumber && !existingBill) {
                    try {
                        const nextBill = await window.api.getNextBillNumber();
                        setBillNumber(nextBill);
                    } catch (error) {
                        console.error("Failed to fetch next bill number:", error);
                    }
                }
            };
            fetchNextBill();
        }, [billNumber, existingBill]);

        useEffect(() => {
            if (shouldDownload && invoiceRef.current) {
                const timer = setTimeout(async () => {
                await generatePDF(
                    invoiceRef.current!,
                    `${customerData.name || "invoice"}.pdf`
                );

                setShouldDownload(false);

                // ✅ RESET ONLY AFTER PDF IS DONE
                onSaved();

                }, 500);

                return () => clearTimeout(timer);
            }
        }, [shouldDownload]);

        useEffect(() => {
            const timer = setInterval(() => setCurrentTime(new Date()), 1000);
            return () => clearInterval(timer);
        }, []);

        useEffect(() => {
                if(!existingBill) setValue("");
        }, [customerData, existingBill]);

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
    <section ref={invoiceRef} className="w-full h-full relative flex flex-col rounded-lg bg-white p-2 ">
        <header className="w-full h-auto border-b border-b-[#00000014] p-4">
            <aside className="flex justify-between">
                <h1 className="text-sm">
                    Current Bill
                </h1>
                <h1 className="text-sm">
                    Tamil Printers
                </h1>
            </aside>
        </header>
        <main className="w-full flex-1 flex flex-col space-y-2">
            <aside className="w-full flex justify-between items-center p-2">
                <p className="text-sm h-fit  bg-[#E9F5FF] px-2 rounded-full ">
                    #{billNumber || "Generating..."}
                </p>
                <div className="w-auto">
                    <p className="text-sm">
                        {existingBill?.created_at ? new Date(existingBill.created_at).toLocaleDateString("en-IN") : currentTime?.toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-sm">
                        {existingBill?.created_at ? new Date(existingBill.created_at).toLocaleTimeString() : currentTime?.toLocaleTimeString()}
                    </p>
                </div>
            </aside>
            <div className="w-full grid grid-cols-2 grid-rows-2 gap-4 p-2">
                <Lable Name='Customer Name' value={customerData.name}/>
                <Lable Name='Phone' value={customerData.phone}/>
                <Lable Name='Email' value={customerData.mail}/>
                <Lable Name='Ref' value={customerData.ref}/>
            </div>
            <section className='flex-1 flex flex-col text-xs space-y-2 mt-4'>
                <main className="w-full">
                    <Table>
                        <tbody>
                            <Table.Row>
                                <Table.Th>Item</Table.Th>
                                <Table.Th>Qty</Table.Th>
                                <Table.Th>Paper</Table.Th>
                                <Table.Th>Rate</Table.Th>
                                <Table.Th>Amount</Table.Th>
                                {setBillData && <Table.Th data-html2canvas-ignore>Actions</Table.Th>}
                            </Table.Row>
                            {Array.isArray(billData) && billData.map((data)=>(
                                <Table.Row key={data.id}>
                                    <Table.Cell>
                                        <div className="font-semibold">{data.service}</div>
                                        {data.print && <div className="text-[10px] text-gray-500 mt-0.5">{data.print}</div>}
                                        {data.note && <div className="text-[10px] text-gray-400 italic mt-0.5">{data.note}</div>}
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
                                        {data.quantity * (data.paper || 1) * data.rate}
                                    </Table.Cell>
                                    {setBillData && (
                                        <Table.Cell data-html2canvas-ignore>
                                            <div className="flex items-center gap-2">
                                                    <button onClick={() => {
                                                        const handleEdit = () => {
                                                            Swal.fire({
                                                                title: 'Edit Item Details',
                                                                html: `
                                                                    <div class="flex flex-col gap-4 text-left">
                                                                        <div class="space-y-1">
                                                                            <label class="text-xs text-gray-400">Quantity</label>
                                                                            <input id="swal-input-qty" type="number" value="${data.quantity}" class="w-full bg-gray-700/50 border border-gray-600 rounded p-2 text-white outline-none focus:border-purple-500" />
                                                                        </div>
                                                                        <div class="space-y-1">
                                                                            <label class="text-xs text-gray-400">Paper (Multiplier)</label>
                                                                            <input id="swal-input-paper" type="number" value="${data.paper}" class="w-full bg-gray-700/50 border border-gray-600 rounded p-2 text-white outline-none focus:border-purple-500" />
                                                                        </div>
                                                                        <div class="space-y-1">
                                                                            <label class="text-xs text-gray-400">Rate (Price per item)</label>
                                                                            <input id="swal-input-rate" type="number" value="${data.rate}" class="w-full bg-gray-700/50 border border-gray-600 rounded p-2 text-white outline-none focus:border-purple-500" />
                                                                        </div>
                                                                    </div>
                                                                `,
                                                                focusConfirm: false,
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Update',
                                                                cancelButtonText: 'Cancel',
                                                                customClass: {
                                                                    popup: 'bg-[#1E1E2E] rounded-xl p-6 shadow-2xl border border-gray-700',
                                                                    title: 'text-xl font-bold text-white mb-4',
                                                                    confirmButton: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition-opacity',
                                                                    cancelButton: 'bg-gray-700 text-gray-300 font-semibold px-6 py-2 rounded hover:bg-gray-600 transition-colors',
                                                                    actions: 'mt-6 flex gap-3'
                                                                },
                                                                buttonsStyling: false,
                                                                preConfirm: () => {
                                                                    const qty = (document.getElementById('swal-input-qty') as HTMLInputElement).value;
                                                                    const paper = (document.getElementById('swal-input-paper') as HTMLInputElement).value;
                                                                    const rate = (document.getElementById('swal-input-rate') as HTMLInputElement).value;
                                                                    
                                                                    if (!qty || !paper || !rate) {
                                                                        Swal.showValidationMessage('Please fill all fields');
                                                                        return false;
                                                                    }
                                                                    
                                                                    return {
                                                                        quantity: Number(qty),
                                                                        paper: Number(paper),
                                                                        rate: Number(rate)
                                                                    }
                                                                }
                                                            }).then((result) => {
                                                                if (result.isConfirmed && result.value && setBillData) {
                                                                    const { quantity, paper, rate } = result.value;
                                                                    setBillData(prev => prev.map(item => 
                                                                        item.id === data.id 
                                                                            ? { ...item, quantity, paper, rate } 
                                                                            : item
                                                                    ));
                                                                }
                                                            });
                                                        };
                                                        handleEdit();
                                                    }} className="text-blue-500 hover:text-blue-700">Edit</button>
                                                <button onClick={() => setBillData(prev => prev.filter(item => item.id !== data.id))} className="text-red-500 hover:text-red-700">Delete</button>
                                            </div>
                                        </Table.Cell>
                                    )}
                                </Table.Row>
                            ))}                    
                        </tbody>
                    </Table>
                </main>

                <aside className="w-full mt-auto flex flex-col gap-5 justify-center items-center mx-auto pt-6 pb-2">
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
                                Tax
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
                    {existingBill ? (
                        <div className="w-full flex flex-col items-center gap-4">
                            <div className='w-full text-center text-sm font-semibold'>
                                Payment Method: {existingBill.payment_method}
                            </div>
                            <div data-html2canvas-ignore className="w-full flex justify-center">
                                <Button variant='primary' icon={<Print className='w-6 h-6'/>} onClick={() => setShouldDownload(true)} className='w-4/5'>
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div data-html2canvas-ignore className="w-full flex flex-col items-center gap-4">
                            <RadioGroup value={value} onValueChange={setValue} name='serviceType' className='w-full h-auto flex items-center justify-center gap-2 text-sm mx-auto' >
                                <RadioGroup.Item value='Cash' label='Cash' icon={<Cash/>} />
                                <RadioGroup.Item value='UPI' label='UPI / QR' icon={<Upi/>} />
                                <RadioGroup.Item value='Card' label='Card' icon={<Card/>}/>
                                <RadioGroup.Item value='Pending' label='Pending'/>
                            </RadioGroup>

                            <Button variant='primary' icon={<Print className='w-6 h-6'/>} onClick={saveBill} className='w-4/5'>
                                Generate & Print Invoice
                            </Button>
                        </div>
                    )}
                </aside>
            </section>
        </main>
    </section>
    </>
  )
}

export default Invoice