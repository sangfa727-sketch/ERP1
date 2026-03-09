import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '../../lib/supabase';
import { useDebounce } from 'use-debounce';
import { Skeleton } from 'shadcn/ui'; // assuming you have a Skeleton component available

const ProductGrid = ({ onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase.from('products').select('*');
      setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded"
      />
      <div className="grid grid-cols-3 gap-4 md:grid-cols-2">
        {loading ? ( 
          <> 
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded" />
            ))} 
          </> 
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className={`p-4 border rounded ${product.stock_qty === 0 ? 'opacity-50' : ''}`}> 
              <h2 className="font-bold">{product.name}</h2>
              <p>{product.stock_qty === 0 ? 'ကုန်ပြီ' : `${product.stock_qty} in stock`}</p>
              <p className="text-lg">K {new Intl.NumberFormat('en-US').format(product.selling_price)}</p>
              <button
                onClick={() => product.stock_qty > 0 && onAddToCart(product)}
                disabled={product.stock_qty === 0}
                className={`mt-2 p-2 bg-blue-600 text-white rounded ${product.stock_qty === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Add to Cart
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductGrid;