"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    saveBill: (data) => electron_1.ipcRenderer.invoke("save-bill", data),
    getBills: () => electron_1.ipcRenderer.invoke("get-bills"),
    getBillDetails: (id) => electron_1.ipcRenderer.invoke("get-bill-details", id),
    getCustomers: () => electron_1.ipcRenderer.invoke("get-customers"),
    addCustomer: (customer) => electron_1.ipcRenderer.invoke("add-customer", customer),
});
