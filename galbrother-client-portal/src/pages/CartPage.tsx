import React from 'react';
import { useCart } from '../context/CartContext.tsx';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';

const CartPage: React.FC = () => {
  const { 
    cartItems, 
    getItemCount, 
    getTotalPrice, 
    removeFromCart,
    updateQuantity,
    clearCart
  } = useCart();
  
  const totalItems = getItemCount();
  const totalPrice = getTotalPrice();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">עגלת הקניות ({totalItems} פריטים)</h2>
        {cartItems.length > 0 && (
           <button 
             onClick={clearCart}
             className="text-sm text-red-600 hover:text-red-800 flex items-center"
           >
             <Trash2 className="w-4 h-4 mr-1" /> רוקן עגלה
           </button>
        )}
      </div>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-600 mb-4">עגלת הקניות שלך ריקה.</p>
          <Link 
            to="/"
            className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            המשך לקנות
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מוצר</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">כמות</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">הסר</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cartItems.map(item => (
                <tr key={`${item.productId}-${item.variationName || 'default'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img 
                          className="h-12 w-12 rounded-md object-contain" 
                          src={item.imageUrl || 'https://via.placeholder.com/50?text=N/A'} 
                          alt={item.productName} 
                        />
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        {item.variationName && <div className="text-xs text-gray-500">({item.variationName})</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.variationName, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.variationName, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button 
                      onClick={() => removeFromCart(item.productId, item.variationName)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-6 p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="flex justify-end items-center">
                <div className="text-lg font-semibold mr-4">
                  סיכום הזמנה
                </div>
                <div className="text-xl font-bold">
                  {totalItems} פריטים
                </div>
            </div>
             <div className="text-left mt-4">
               <Link 
                 to="/new-order" 
                 className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 transition duration-150 ease-in-out shadow-sm"
               >
                 המשך להזמנה
               </Link>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage; 