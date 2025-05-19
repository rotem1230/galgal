import React, { useState } from 'react';
import { useCart } from '../context/CartContext.tsx';
import { useClientAuth } from '../context/ClientAuthContext.tsx';
import { db } from '../../firebase-config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const NewOrderPage: React.FC = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { currentUser } = useClientAuth();
  const totalPrice = getTotalPrice();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (!currentUser || cartItems.length === 0) {
      setError('שגיאה: לא ניתן לבצע הזמנה ללא משתמש מחובר או עגלה ריקה.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setOrderSuccess(false);
      setOrderId(null);
      
      console.log("Starting order process...");
      console.log("Current user:", currentUser);
      console.log("Cart items count:", cartItems.length);

      // עיבוד ובדיקת תקינות פריטי ההזמנה
      const orderItems = cartItems.map(item => {
        // מחשב מחיר ללא מע"מ - נניח שמע"מ הוא 18%
        const VAT_RATE = 0.18;
        const priceBeforeVat = Math.round((item.priceWithVat / (1 + VAT_RATE)) * 100) / 100;
        
        // בנייה של אובייקט פריט תואם לפורמט המשמש בפורטל הניהול
        const orderItem: any = {
          // שדות לפורטל הלקוחות
          productId: item.productId,
          productName: item.productName,
          priceWithVat: item.priceWithVat,
          quantity: item.quantity,
          
          // שדות נוספים לפורטל הניהול
          product_id: item.productId, // שדה מקביל ל-productId בפורטל הניהול
          price_with_vat: item.priceWithVat, // שדה מקביל לפורטל הניהול
          price_before_vat: priceBeforeVat, // חישוב מחיר ללא מע"מ
          variation_index: -1, // ברירת מחדל למוצרים ללא וריאציה
        };

        // הוסף את שדה variationName רק אם הוא קיים ומוגדר
        if (item.variationName) {
          orderItem.variationName = item.variationName;
          // נסיון להתאים את variation_index - במערכת הניהול זה מבוסס על אינדקס מערך
          // ומכיוון שאין לנו גישה למערך, נשים ערך חיובי שמציין שיש וריאציה
          orderItem.variation_index = 0; // נשתמש ב-0 כערך ברירת מחדל לוריאציה הראשונה
        }

        return orderItem;
      });

      // חישוב סך מחיר ללא מע"מ
      const totalBeforeVat = orderItems.reduce((sum, item) => 
        sum + (item.price_before_vat * item.quantity), 0
      );

      // הכנת מבנה נתונים להזמנה שתואם הן את פורטל הלקוחות והן את פורטל הניהול
      const orderData = {
        // שדות לפורטל הלקוחות
        userId: currentUser.uid,
        status: 'pending',
        items: orderItems,
        totalPrice: totalPrice,
        userEmail: currentUser.email || 'לא צוין',
        userName: currentUser.displayName || 'לא צוין',
        
        // שדות נוספים לפורטל הניהול
        createdAt: Timestamp.now(),
        order_date: new Date().toISOString().split('T')[0], // רק התאריך ללא זמן
        customer_name: currentUser.displayName || currentUser.email || 'לקוח מהפורטל',
        customer_id: currentUser.uid,
        total_before_vat: totalBeforeVat,
        total_with_vat: totalPrice,
      };

      console.log("Prepared order data:", JSON.stringify(orderData));
      console.log("Submitting order to Firestore...");
      
      // שמירת ההזמנה ב-Firestore
      const docRef = await addDoc(collection(db, "orders"), orderData);
      const newOrderId = docRef.id;
      
      console.log("Order submitted successfully with ID:", newOrderId);
      
      // עדכון מצב הצלחה והצגת מזהה ההזמנה למשתמש
      setOrderId(newOrderId);
      setOrderSuccess(true);
      
      // רוקן עגלה לאחר הצלחה
      clearCart();
      
      // נמתין 3 שניות לפני שנעביר את המשתמש לדף ההיסטוריה
      setTimeout(() => {
        navigate('/history');
      }, 3000);
      
    } catch (err) {
      console.error("Error placing order:", err);
      setError(`אירעה שגיאה בביצוע ההזמנה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // אם ההזמנה הצליחה, הצג הודעת אישור
  if (orderSuccess && orderId) {
    return (
      <div className="p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-green-700 mb-4">ההזמנה התקבלה בהצלחה!</h2>
          <p className="mb-2">מספר הזמנה: <span className="font-bold">{orderId}</span></p>
          <p className="mb-6">אנא שמור את מספר ההזמנה למעקב.</p>
          <p className="text-sm text-gray-600">מועבר לדף היסטוריית ההזמנות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">סיכום וביצוע הזמנה</h2>
      
      {cartItems.length === 0 ? (
        <p>עגלת הקניות ריקה. לא ניתן לבצע הזמנה.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">פרטי ההזמנה:</h3>
          <ul className="divide-y divide-gray-200 mb-6">
            {cartItems.map(item => (
              <li key={`${item.productId}-${item.variationName || 'default'}`} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.productName}</span>
                  {item.variationName && <span className="text-sm text-gray-500"> ({item.variationName})</span>}
                </div>
                <span className="text-gray-700">{item.quantity} יח'</span>
              </li>
            ))}
          </ul>
          
          <div className="border-t pt-4 mb-6">
            <p className="text-xl font-bold text-right">
              סה"כ פריטים: {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>

          {error && <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-700 text-sm mb-4">{error}</div>}

          <div className="text-left">
            <button 
              onClick={handlePlaceOrder}
              disabled={isLoading}
              className="bg-green-600 text-white py-2 px-8 rounded hover:bg-green-700 transition duration-150 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'שולח הזמנה...' : 'שלח הזמנה'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrderPage; 