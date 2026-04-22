import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // Bills
  saveBill: (data: any) => ipcRenderer.invoke("save-bill", data),
  updateBill: (data: any) => ipcRenderer.invoke("update-bill", data),
  getBills: (filters?: any) => ipcRenderer.invoke("get-bills", filters),
  getBillDetails: (id: number) => ipcRenderer.invoke("get-bill-details", id),
  exportBills: () => ipcRenderer.invoke("export-bills"),

  // Bill Items
  getNextBillNumber: () => ipcRenderer.invoke("get-next-bill-number"),
  updateBillItem: (item: any) => ipcRenderer.invoke("update-bill-item", item),
  deleteBillItem: (itemId: number) => ipcRenderer.invoke("delete-bill-item", itemId),
  updateBillPayment: (data: { billId: number; method: string }) => ipcRenderer.invoke("update-bill-payment", data),

  // Split Payments
  addSplitPayment: (data: { billId: number; method: string; amount: number; note?: string }) => ipcRenderer.invoke("add-split-payment", data),
  getSplitPayments: (billId: number) => ipcRenderer.invoke("get-split-payments", billId),
  deleteSplitPayment: (data: { billId: number; paymentId: number }) => ipcRenderer.invoke("delete-split-payment", data),

  // Customers
  getCustomers: () => ipcRenderer.invoke("get-customers"),
  addCustomer: (customer: any) => ipcRenderer.invoke("add-customer", customer),

  // Products
  getProducts: () => ipcRenderer.invoke("get-products"),
  getProduct: (id: number) => ipcRenderer.invoke("get-product", id),
  addProduct: (product: any) => ipcRenderer.invoke("add-product", product),
  updateProduct: (product: any) => ipcRenderer.invoke("update-product", product),
  deleteProduct: (id: number) => ipcRenderer.invoke("delete-product", id),
  saveProduct: (product: any) => {
    if (product.id) {
       return ipcRenderer.invoke("update-product", product);
    } else {
       return ipcRenderer.invoke("add-product", product);
    }
  },

  // Reports
  getReportStats: (params: { month: number; year: number }) => ipcRenderer.invoke("get-report-stats", params),
});
