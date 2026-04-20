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
import SvgDelete from '@/assets/icons/Delete';
import SvgEdit from '@/assets/icons/Edit';

const Invoice: React.FC<InvoiceProps> = ({customerData,billData,onSaved,setBillData, existingBill, isEditMode, billId,paymentMethod, paymentHistory}) => {

        const invoiceRef = useRef<HTMLDivElement>(null);
        const [value,setValue] = useState(paymentMethod?.method || "");
        const [currentTime, setCurrentTime] = useState<Date>(new Date());
        const [billNumber, setBillNumber] = useState<string | null>(existingBill?.bill_number || null);
        const [shouldDownload, setShouldDownload] = useState(false);

        // console.log(paymentMethod?.method)
        useEffect(() => {
            const fetchNextBill = async () => {
                if (!isEditMode && !billNumber && !existingBill) {
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
            if (isEditMode && existingBill?.bill_number) {
                setBillNumber(existingBill.bill_number);
            }
        }, [isEditMode, existingBill]);

        useEffect(() => {
            if (paymentMethod) {
                setValue(paymentMethod?.method);
            }
        }, [paymentMethod]);

        const today = new Date().toLocaleDateString("en-GB")
        useEffect(() => {
            if (shouldDownload && invoiceRef.current) {
                const timer = setTimeout(async () => {
                await generatePDF(
                    invoiceRef.current!,
                    `${customerData.name + '_' + today || "invoice"}.pdf`
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

        // useEffect(() => {
        //     if (isEditMode && paymentHistory) {
        //         const method = paymentHistory.toLowerCase();
        //         if (method.includes('cash')) setValue('Cash');
        //         else if (method.includes('upi')) setValue('UPI');
        //         else if (method.includes('card')) setValue('Card');
        //         else setValue('Pending');
        //     } else if (!existingBill) {
        //         setValue("");
        //     }
        // }, [customerData, existingBill, isEditMode]);

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

            if (customerData.name == '-' && customerData.phone == '-'){
                await showAlert({
                icon: 'warning',
                title: 'Invaild Customer Details',
                text: 'Please Enter customer details',
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
                let result;
                if (isEditMode && billId) {
                    result = await window.api.updateBill({
                        billId: billId,
                        paymentMethod: value,
                    });
                } else {
                    result = await window.api.saveBill({
                        customer: customerData,
                        items: billData,
                        paymentMethod: value,
                    });
                    setBillNumber(result.billNumber);
                }

                await showAlert({
                icon: 'success',
                title: isEditMode ? 'Bill Updated' : 'Bill Saved',
                text: isEditMode ? 'Bill updated successfully' : `Bill number: ${result?.billNumber}`,
                confirmText: 'OK',
                });

                // ✅ trigger AFTER state update
                setShouldDownload(true);

            } catch (err: any) {
                console.error(err);
                await showAlert({
                icon: 'error',
                title: 'Error',
                text: err.message || 'Failed to save bill. Please try again.',
                confirmText: 'OK',
                });
            }
        };

        const BillTotal = calculateInvoice(billData)
        // console.log(BillTotal)
  return (
    <>
    <section ref={invoiceRef} className="w-full h-full relative flex flex-col rounded-lg bg-white p-2 ">
        <header className="w-full h-auto border-b border-b-[#00000014] px-4 py-2">
            <aside className="flex justify-between items-center">
                <h1 className="text-sm text-[#64748B] ">
                    Current Bill
                </h1>
                <h1 className="text-xl">
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
                    <p className="text-xs">
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
                                {setBillData && <th className='text-left px-4 py-2 text-[#8B95A6]' data-html2canvas-ignore>Actions</th>}
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
                                        {data.amount || data.quantity * (data.paper || 1) * data.rate}
                                    </Table.Cell>
                                    {setBillData && (
                                        <td data-html2canvas-ignore>
                                            <div className="flex items-center gap-2">
                                                    <button onClick={() => {
                                                        const handleEdit = () => {
                                                            Swal.fire({
                                                                title: 'Edit Item Details',
                                                                html: `
                                                                    <div class="flex flex-col gap-4 text-left">
                                                                        <div class="space-y-1">
                                                                            <label class="text-[#64748B] text-sm block my-1">Quantity</label>
                                                                            <input id="swal-input-qty" type="number" value="${data.quantity}" class="bg-[#F8FAFC] max-h-10 w-full outline-none border border-[#00000014] text-sm p-2 rounded-md " />
                                                                        </div>
                                                                        <div class="space-y-1">
                                                                            <label class="text-[#64748B] text-sm block my-1">Paper (Multiplier)</label>
                                                                            <input id="swal-input-paper" type="number" value="${data.paper}" class="bg-[#F8FAFC] max-h-10 w-full outline-none border border-[#00000014] text-sm p-2 rounded-md " />
                                                                        </div>
                                                                        <div class="space-y-1">
                                                                            <label class="text-[#64748B] text-sm block my-1">Rate (Price per item)</label>
                                                                            <input id="swal-input-rate" type="number" value="${data.rate}" class="bg-[#F8FAFC] max-h-10 w-full outline-none border border-[#00000014] text-sm p-2 rounded-md " />
                                                                        </div>
                                                                        <div class="space-y-1">
                                                                            <label class="text-[#64748B] text-sm block my-1">Rate (Price per item)</label>
                                                                            <input id="swal-input-amount" type="number" value="${data.amount}" class="bg-[#F8FAFC] max-h-10 w-full outline-none border border-[#00000014] text-sm p-2 rounded-md " />
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
                                                                    confirmButton: 'bg-[#0B76FF] text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition-opacity',
                                                                    cancelButton: 'bg-gray-700 text-gray-300 font-semibold px-6 py-2 rounded hover:bg-gray-600 transition-colors',
                                                                    actions: 'mt-6 flex gap-3'
                                                                },
                                                                buttonsStyling: false,
                                                                preConfirm: () => {
                                                                    const qty = (document.getElementById('swal-input-qty') as HTMLInputElement).value;
                                                                    const paper = (document.getElementById('swal-input-paper') as HTMLInputElement).value;
                                                                    const rate = (document.getElementById('swal-input-rate') as HTMLInputElement).value;
                                                                    const amount = (document.getElementById('swal-input-amount') as HTMLInputElement).value;
                                                                    
                                                                    if (!qty || !paper || !rate) {
                                                                        Swal.showValidationMessage('Please fill all fields');
                                                                        return false;
                                                                    }
                                                                    
                                                                    return {
                                                                        quantity: Number(qty),
                                                                        paper: Number(paper),
                                                                        rate: Number(rate),
                                                                        amount: Number(amount)
                                                                    }
                                                                }
                                                            }).then((result) => {
                                                                if (result.isConfirmed && result.value && setBillData) {
                                                                    const { quantity, paper, rate, amount } = result.value;
                                                                    setBillData(prev => prev.map(item => 
                                                                        item.id === data.id 
                                                                            ? { ...item, quantity, paper, rate, amount } 
                                                                            : item
                                                                    ));
                                                                }
                                                            });
                                                        };
                                                        handleEdit();
                                                    }} className="text-blue-500 hover:text-blue-700">
                                                        <SvgEdit className='w-5 h-5'/>
                                                    </button>
                                                <button onClick={() => setBillData(prev => prev.filter(item => item.id !== data.id))} className="text-red-500 hover:text-red-700">
                                                    <SvgDelete className='w-5 h-5'/>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </Table.Row>
                            ))}                    
                        </tbody>
                    </Table>
                </main>

                <aside className="w-full mt-auto flex flex-col gap-5 justify-center items-center mx-auto pt-6 pb-2">
                    <div className="w-full h-auto space-y-4">
                        
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
                            <p className="text-xs">
                                ₹{BillTotal.tax}
                            </p>
                        </div>
                        <div className="w-full h-min flex items-center justify-between border-y border-[#00000014] py-2">
                            <h4 className="text-sm">
                                Grand Total
                            </h4>
                            <h4 className="text-sm">
                                ₹{BillTotal.grandTotal}
                            </h4>
                        </div>
                    </div>
                    {paymentHistory && paymentHistory.length > 0 && (
                        <div className="w-full h-auto space-y-2 border-t border-[#00000014] pt-2 mt-2">
                            <h2 className="text-base font-bold uppercase tracking-wider mb-1">Payment History</h2>
                            <div className="flex flex-col gap-1.5">
                                {paymentHistory.map((history, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                                        <span className="font-medium">{new Date(history.updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        <div className="flex items-center gap-1.5 font-medium text-sm">
                                            <span className="text-gray-400">{history.old_payment_method || "None"}</span>
                                            <span className="text-gray-400">&rarr;</span>
                                            <span className="text-blue-600">{history.new_payment_method}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {(existingBill && !isEditMode) ? (
                        <div className="w-full flex flex-col items-center gap-4">
                                <div className='w-full text-center text-sm font-semibold'>
                                    <RadioGroup value={value} onValueChange={setValue} name='serviceType' className='w-full h-auto flex items-center justify-center gap-2 text-sm mx-auto' >
                                    <RadioGroup.Item value='Cash' label='Cash' icon={<Cash/>} />
                                    <RadioGroup.Item value='UPI' label='UPI / QR' icon={<Upi/>} />
                                    <RadioGroup.Item value='Card' label='Card' icon={<Card/>}/>
                                    <RadioGroup.Item value='Pending' label='Pending'/>
                                </RadioGroup>
                            </div>
                            <div data-html2canvas-ignore className="w-full flex justify-center">
                                <Button variant='primary' icon={<Print className='w-6 h-6'/>} onClick={() => setShouldDownload(true)} className='w-4/5'>
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center gap-4">
                            <RadioGroup value={value} onValueChange={setValue} name='serviceType' className='w-full h-auto flex items-center justify-center gap-2 text-sm mx-auto' >
                                <RadioGroup.Item value='Cash' label='Cash' icon={<Cash/>} />
                                <RadioGroup.Item value='UPI' label='UPI / QR' icon={<Upi/>} />
                                <RadioGroup.Item value='Card' label='Card' icon={<Card/>}/>
                                <RadioGroup.Item value='Pending' label='Pending'/>
                            </RadioGroup>

                            <Button data-html2canvas-ignore variant='primary' icon={<Print className='w-6 h-6'/>} onClick={saveBill} className='w-4/5'>
                                {isEditMode ? 'Update & Print Invoice' : 'Generate & Print Invoice'}
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