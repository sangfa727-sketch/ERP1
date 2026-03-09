import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '../../lib/supabase';

interface PaymentModalProps {
  totalAmount: number;
  onConfirm: (paymentData: { totalAmount: number; amountReceived: number; customerId?: string; paymentType: string }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ totalAmount, onConfirm }) => {
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [customerId, setCustomerId] = useState<string | undefined>('');
  const [paymentType, setPaymentType] = useState<'Cash' | 'Credit'>('Cash');
  const [contacts, setContacts] = useState<{ id: string; contact_name: string }[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.from('contacts').select('id, contact_name');
      setContacts(data || []);
    };

    fetchContacts();
  }, []);

  const handleConfirm = () => {
    if (paymentType === 'Credit' && !customerId) {
      return alert('Please select a customer for Credit payment.');
    }
    onConfirm({ totalAmount, amountReceived, customerId, paymentType });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountReceived(value ? Number(value) : '');
  };

  const changeAmount = amountReceived ? amountReceived - totalAmount : 0;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Payment</h2>
      <div className="mb-4">
        <label className="block mb-1">Total Amount</label>
        <span className="text-lg font-semibold">K {new Intl.NumberFormat('en-US').format(totalAmount)}</span>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Cash Received</label>
        <input
          type="number"
          value={amountReceived}
          onChange={handleAmountChange}
          className="border border-gray-300 rounded p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <p>Change: K {new Intl.NumberFormat('en-US').format(changeAmount)}</p>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Payment Type</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as 'Cash' | 'Credit')}
          className="border border-gray-300 rounded p-2 w-full"
        >
          <option value="Cash">Cash</option>
          <option value="Credit">Credit</option>
        </select>
      </div>
      {paymentType === 'Credit' && (
        <div className="mb-4">
          <label className="block mb-1">Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="border border-gray-300 rounded p-2 w-full"
          >
            <option value="">Select a customer</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>{contact.contact_name}</option>
            ))}
          </select>
        </div>
      )}
      <button
        onClick={handleConfirm}
        className="bg-blue-600 text-white p-2 rounded w-full"
      >
        ငွေရှင်းမည်
      </button>
    </div>
  );
};

export default PaymentModal;