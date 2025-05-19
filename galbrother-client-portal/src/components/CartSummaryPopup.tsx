import React from 'react';
import { useCart } from '../context/CartContext.tsx';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface CartSummaryPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSummaryPopup: React.FC<CartSummaryPopupProps> = ({ isOpen, onClose }) => {
  const { cartItems, getItemCount, getTotalPrice } = useCart();
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const totalItems = getItemCount();
  const totalPrice = getTotalPrice();

  const handleNavigateToCart = () => {
    onClose(); // Close popup before navigating
    navigate('/cart');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close when clicking outside the modal content
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="סגור חלון קופץ"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-center text-blue-600">הסל עודכן!</h2>
        
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-600">עגלת הקניות שלך ריקה.</p>
        ) : (
          <>
            <p className="text-center text-gray-700 mb-4">
              יש לך כעת <strong>{totalItems}</strong> פריט{totalItems !== 1 ? 'ים' : ''} בסל.
            </p>
            <div className="max-h-60 overflow-y-auto mb-4 border-t border-b divide-y">
              {cartItems.map(item => (
                <div key={`${item.productId}-${item.variationName || 'default'}`} className="py-2 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{item.productName}</span>
                    {item.variationName && <span className="text-xs text-gray-500 ml-1">({item.variationName})</span>}
                  </div>
                  <span className="text-gray-600">{item.quantity} יח'</span>
                </div>
              ))}
            </div>
            <div className="text-lg font-semibold text-right mb-6">
              סה"כ לתשלום: {totalPrice.toFixed(2)} ₪
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition duration-150"
              >
                המשך בקניה
              </button>
              <button
                onClick={handleNavigateToCart}
                className="w-full sm:w-auto bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-150"
              >
                מעבר לסל ({totalItems})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSummaryPopup; 