import React, { createContext, useState, useContext, ReactNode } from 'react';

// הגדרת טיפוסים עבור פריט בעגלה
// נצטרך להרחיב את זה כדי לכלול פרטי וריאציה ספציפיים
interface CartItem {
  productId: string; 
  productName: string; // לנוחות תצוגה
  variationName?: string; // אם יש וריאציות
  priceWithVat: number; // מחיר ליחידה
  quantity: number;
  imageUrl?: string; // אופציונלי
}

// טיפוס עזר לפריט להוספה לסל, עם כמות אופציונלית
interface CartItemToAdd {
  productId: string;
  productName: string;
  variationName?: string;
  priceWithVat: number;
  imageUrl?: string;
  quantity?: number; // כמות אופציונלית - אם לא צוינה, יתווסף פריט אחד
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItemToAdd) => void; // מקבל פריט עם כמות אופציונלית
  removeFromCart: (productId: string, variationName?: string) => void; // <-- נוסף
  updateQuantity: (productId: string, variationName: string | undefined, newQuantity: number) => void; // <-- נוסף
  clearCart: () => void; // <-- נוסף
  getItemCount: () => number; // מחזיר את סך כל היחידות בעגלה
  getTotalPrice: () => number; // <-- נוסף
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (itemToAdd: CartItemToAdd) => {
    setCartItems(prevItems => {
      // בדוק אם הפריט (עם אותה וריאציה) כבר קיים בעגלה
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === itemToAdd.productId && item.variationName === itemToAdd.variationName
      );

      if (existingItemIndex > -1) {
        // אם קיים, הגדל את הכמות
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += itemToAdd.quantity || 1;
        return updatedItems;
      } else {
        // אם לא קיים, הוסף אותו עם הכמות המבוקשת או 1 כברירת מחדל
        return [...prevItems, { ...itemToAdd, quantity: itemToAdd.quantity || 1 }];
      }
    });
    console.log("Item added to cart:", itemToAdd, "Current cart:", cartItems);
  };

  const removeFromCart = (productId: string, variationName?: string) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        !(item.productId === productId && item.variationName === variationName)
      )
    );
  };

  const updateQuantity = (productId: string, variationName: string | undefined, newQuantity: number) => {
    setCartItems(prevItems => {
      // ודא שהכמות לא קטנה מ-1, אם כן - הסר את הפריט
      if (newQuantity < 1) {
        return prevItems.filter(item => 
          !(item.productId === productId && item.variationName === variationName)
        );
      }
      // אחרת, עדכן את הכמות
      return prevItems.map(item => 
        item.productId === productId && item.variationName === variationName
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.priceWithVat * item.quantity, 0);
  };

  // הדפסת העגלה לקונסול בכל שינוי (לצורכי דיבאגינג)
  React.useEffect(() => {
    console.log("Cart updated:", cartItems);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, // <-- הוספה ל-value
      updateQuantity, // <-- הוספה ל-value
      clearCart,      // <-- הוספה ל-value
      getItemCount, 
      getTotalPrice   // <-- הוספה ל-value
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook לשימוש בקונטקסט
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 