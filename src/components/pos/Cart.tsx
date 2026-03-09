import React from 'react';

// Define CartItem type
export type CartItem = { 
  id: string;
  name: string;
  quantity: number;
  selling_price: number;
  stock_qty: number;
};

interface CartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onRemove, onUpdateQuantity, onCheckout }) => {
  const totalAmount = items.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Cart</h2>
      {items.length === 0 ? (
        <div className="text-gray-500">Cart is empty.</div>
      ) : (
        <div>
          {items.map((item) => {
            const subtotal = item.selling_price * item.quantity;
            return (
              <div key={item.id} className="flex justify-between items-center mb-4 p-2 border rounded">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <div className="flex items-center">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="mr-2 p-1 border rounded"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="ml-2 p-1 border rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-lg">K {new Intl.NumberFormat('en-US').format(subtotal)}</p>
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="ml-4 text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          <div className="mt-4 font-bold">Total Amount: K {new Intl.NumberFormat('en-US').format(totalAmount)}</div>
          <button 
            onClick={onCheckout} 
            className="mt-4 w-full bg-blue-600 text-white p-2 rounded"
          >
            ငွေရှင်းမည်
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;