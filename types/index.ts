import React, { ReactNode } from "react";
import { SweetAlertIcon } from "sweetalert2";

export type NavLinkProps ={
    href:string;
    label:string;
    icon?:React.ReactNode;
    collapsed?:boolean;
    exact?: boolean;
}

export type CardProps ={
    label:string;
    icon?:React.ReactNode;
    value:string | number;
    disc:string;
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?:string;
    error?:string;
}
export type RadioGroupContextType = {
    value:string;
    onValueChange:(value: string)=> void;
    name:string;
}
export type RadioGroupProps = {
    value:string;
    onValueChange:(value: string)=> void;
    name?:string;
    children:ReactNode;
    className?:string;
}
export type RadioItemProps ={
    value:string;
    label:string;
    className?:string;
    icon?:React.ReactNode;
}
export type LableProps = {
    Name:string;
    value: string | number;
}
export type ButtonPros = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children:ReactNode;
    icon?:React.ReactNode;
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
}
export type Option ={
    label:string;
    value:string;
}
export type DropdownProps ={
    name:string;
    option: Option[];
    onChange:(value:string)=> void;
}
export type customerData ={
    data:{
        name: string;
        mail:string;
        phone:string;
        ref:string;
    };
    setData:React.Dispatch<React.SetStateAction<{
        name: string;
        mail:string;
        phone:string;
        ref:string;
    }>
    >;
}
export type billData={
    data:BillData[];
    setData:React.Dispatch<React.SetStateAction<BillData[]>>;
}
export interface CustomerData {
    name: string;
    mail: string;
    phone: string;
    ref: string;
  }
  export interface BillData {
    id:string;
    service: string;
    quantity: number;
    paper: number;
    page: number;
    rate: number;
    print: string;
    note: string;
  }
export interface InvoiceProps {
    customerData: CustomerData;
    billData: BillData[];
    onSaved: () => void;
  }
export type Bill = {
    id: number;
    bill_number: string;
    total: number;
    created_at: string;
    name: string;
    phone: string;
  };
  export type Customer = {
  id: number;
  name: string;
  phone: string;
  mail: string;
  totalSpent: number;
  lastVisit: string | null;
  created_at?: string;
};
export type Invoice = {
  id: string;
  total: number;
  status: 'Paid' | 'Pending';
  created_at: string;
};
export interface AlertModalProps {
  title: string;
  text: string;
  type?: SweetAlertIcon;       // success | error | warning | info | question
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  onConfirm?: () => void;      // callback when confirmed
  onCancel?: () => void;       // callback when cancelled
}
export type CalculationResult = {
  subtotal: number;
  tax: number;
  grandTotal: number;
};