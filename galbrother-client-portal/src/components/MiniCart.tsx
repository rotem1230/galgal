import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.tsx';
import { ShoppingCart } from 'lucide-react';

const MiniCart: React.FC = () => {
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const totalItems = getItemCount();

  const handleNavigateToCart = () => {
    navigate('/cart');
  };

  return (
    <button
      onClick={handleNavigateToCart}
      className="fixed top-4 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-50 flex items-center space-x-2 rtl:space-x-reverse"
      aria-label={`עבור לדף עגלת הקניות, ${totalItems} פריטים בסל`}
    >
      <ShoppingCart className="text-blue-600" size={24} />
      {totalItems > 0 && (
        <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          {totalItems}
        </span>
      )}
    </button>
  );
};

export default MiniCart; 