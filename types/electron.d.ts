export { };

declare global {
  interface Window {
    api: {
      saveBill: (data: any) => Promise<any>;
      getBills: () => Promise<any[]>;
      getBillDetails: (id: number) => Promise<any>;
      getNextBillNumber: () => Promise<string>;
      updateBillItem: (item: any) => Promise<{ success: boolean }>;
      deleteBillItem: (itemId: number) => Promise<{ success: boolean }>;
      updateBillPayment: (data: { billId: number; method: string }) => Promise<{ success: boolean }>;
      exportBills?: () => void;
      getCustomers: () => Promise<any[]>;
      addCustomer: (customer: any) => Promise<{ id: number }>;

      // Products
      getProducts: () => Promise<any[]>;
      getProduct: (id: number) => Promise<any>;
      addProduct: (product: any) => Promise<any>;
      updateProduct: (product: any) => Promise<any>;
      deleteProduct: (id: number) => Promise<void>;
      saveProduct: (product: any) => Promise<any>;

      // Reports
      getReportStats: (params: { month: number; year: number }) => Promise<any>;
    };
  }
}
