import React, { useState } from 'react';
import ProductGrid from '../../components/pos/ProductGrid';
import Cart, { CartItem } from '../../components/pos/Cart';
import PaymentModal from '../../components/pos/PaymentModal';
import { createBrowserClient } from '../../lib/supabase';
import { toast } from 'react-toastify'; // Assuming you're using react-toastify for notifications

const PosPage = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const profileCompanyId = 'your_company_id'; // Replace with actual logic to get the company_id

  const handleAddToCart = (product: any) => {
    setCartItems((prev) => {
      const itemIndex = prev.findIndex(item => item.id === product.id);
      if (itemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[itemIndex].quantity += 1;
        return updatedItems;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (paymentData: { totalAmount: number; amountReceived: number; customerId?: string; paymentType: string; }) => {
    const supabase = createBrowserClient();
    const itemsToSend = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.selling_price,
      cost_at_sale: item.cost_price
    }));
    const requestId = crypto.randomUUID();

    const { error } = await supabase.rpc('rpc_post_pos_sale_from_draft', {
      p_company_id: profileCompanyId,
      p_items: itemsToSend,
      p_amount_paid: paymentData.amountReceived,
      p_customer_id: paymentData.customerId,
      p_request_id: requestId,
      p_draft: {} // Add necessary draft data if needed
    });

    if (error) {
      if (error.message.includes('Stock out')) {
        toast.error('ကုန်ပစ္စည်း မလုံလောက်ပါ');
      } else {
        toast.error('An error occurred during payment.');
      }
      return;
    }

    setCartItems([]); // Clear cart
    setShowPaymentModal(false); // Close modal
    // Add logic to store receipt data
    // Redirect to /pos/receipt if needed
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-2/3 p-4">
        <ProductGrid onAddToCart={handleAddToCart} />
      </div>
      <div className="w-full md:w-1/3 p-4">
        <Cart items={cartItems} onRemove={handleRemoveFromCart} onCheckout={handleCheckout} onUpdateQuantity={handleUpdateQuantity} />
      </div>
      {showPaymentModal && (
        <PaymentModal 
          totalAmount={cartItems.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0)} 
          onConfirm={handleConfirmPayment} 
        />
      )}
    </div>
  );
};

export default PosPage;
