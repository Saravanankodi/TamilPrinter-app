"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    // Bills
    saveBill: (data) => electron_1.ipcRenderer.invoke("save-bill", data),
    updateBill: (data) => electron_1.ipcRenderer.invoke("update-bill", data),
    getBills: (filters) => electron_1.ipcRenderer.invoke("get-bills", filters),
    getBillDetails: (id) => electron_1.ipcRenderer.invoke("get-bill-details", id),
    exportBills: () => electron_1.ipcRenderer.invoke("export-bills"),
    // Bill Items
    getNextBillNumber: () => electron_1.ipcRenderer.invoke("get-next-bill-number"),
    updateBillItem: (item) => electron_1.ipcRenderer.invoke("update-bill-item", item),
    deleteBillItem: (itemId) => electron_1.ipcRenderer.invoke("delete-bill-item", itemId),
    updateBillPayment: (data) => electron_1.ipcRenderer.invoke("update-bill-payment", data),
    // Customers
    getCustomers: () => electron_1.ipcRenderer.invoke("get-customers"),
    addCustomer: (customer) => electron_1.ipcRenderer.invoke("add-customer", customer),
    // Products
    getProducts: () => electron_1.ipcRenderer.invoke("get-products"),
    getProduct: (id) => electron_1.ipcRenderer.invoke("get-product", id),
    addProduct: (product) => electron_1.ipcRenderer.invoke("add-product", product),
    updateProduct: (product) => electron_1.ipcRenderer.invoke("update-product", product),
    deleteProduct: (id) => electron_1.ipcRenderer.invoke("delete-product", id),
    saveProduct: (product) => {
        if (product.id) {
            return electron_1.ipcRenderer.invoke("update-product", product);
        }
        else {
            return electron_1.ipcRenderer.invoke("add-product", product);
        }
    },
    // Reports
    getReportStats: (params) => electron_1.ipcRenderer.invoke("get-report-stats", params),
});
