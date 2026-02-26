"use client"
import { Add } from '@/assets/icons'
import Download from '@/assets/icons/Download'
import Button from '@/components/base/Button'
import Table from '@/components/layout/Table'
import { Customer } from '@/types'
import React, { useEffect, useState } from 'react'

const Customers = () => {
  const [customers,setCustomers] = useState<Customer[]>([]);
  const [loading,setLoading] = useState(true);

    useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await window.api.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <>
    <section className="w-full">
      <header className="w-full py-3 px-4 flex items-center justify-between bg-white border border-[#00000014]">
        <aside className="w-fit h-full">
          <div className="h-fit flex items-center gap-2">
          <h1 className="text-2xl">
            Customers 
          </h1>
          </div>
        </aside>
        <div className="w-fit flex items-center gap-2">
         <Button icon={<Download/>} variant='outline' >
            Export List
         </Button>
         <Button icon={<Add/>} variant='primary' >
          Add Customer
         </Button>
        </div>
      </header>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Th>
              Customer Name
            </Table.Th>
            <Table.Th>
              Contact
            </Table.Th>
            <Table.Th>
              Last Visit
            </Table.Th>
            <Table.Th>
              Total Spent
            </Table.Th>
          </Table.Row>
        </Table.Head>
        <tbody>
          {loading ? (
            <Table.Row>
              <Table.Cell>Loading...</Table.Cell>
            </Table.Row>
          ) : customers.length === 0 ? (
            <Table.Row>
              <Table.Cell>No customers found</Table.Cell>
            </Table.Row>
          ) : (
            customers.map((customer) => (
              <Table.Row key={customer.id}>
                <Table.Cell>{customer.name}</Table.Cell>
                <Table.Cell>{customer.phone}</Table.Cell>
                {/* <Table.Cell>
                  {new Date(customer.created_at).toLocaleDateString()}
                </Table.Cell> */}
                <Table.Cell>--</Table.Cell>
              </Table.Row>
            ))
          )}
        </tbody>
      </Table>
    </section>
    </>
  )
}

export default Customers