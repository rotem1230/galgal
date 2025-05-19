import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase-config'; // הפעלת הייבוא
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"; // הפעלת הייבוא + הוספת query ו-orderBy
import { useCart } from '../context/CartContext.tsx'; // <-- ייבוא ה-Hook של העגלה
// import CartSummaryPopup from '../components/CartSummaryPopup.tsx'; // הסרת ייבוא הפופאפ

// הגדרת טיפוסים בהתאם לסכימה
interface Variation {
  name: string;
  price_before_vat: number;
  price_with_vat: number;
}

interface Product {
  id: string; // נוסיף את מזהה המסמך
  name: string;
  category_id?: string; // אופציונלי אם לא תמיד קיים
  image_url?: string;
  price_before_vat?: number; // מחיר בסיסי של המוצר (ללא מע"מ)
  price_with_vat?: number; // מחיר בסיסי של המוצר (כולל מע"מ)
  variations: Variation[];
}

// הוספת ממשק עבור קטגוריות
interface Category {
  id: string;
  name: string;
  image_url?: string;
  is_active?: boolean;
}

const ClientProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]); // שימוש בטיפוס שהגדרנו
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart(); // <-- קבלת הפונקציה addToCart מהקונטקסט
  // מצב לשמירת כמויות המוצרים
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // מצבים חדשים לסינון וחיפוש
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // טעינת קטגוריות
        const categoriesCollectionRef = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(query(categoriesCollectionRef));
        const categoriesData = categoriesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(cat => cat.is_active !== false) as Category[];
        setCategories(categoriesData);
        
        // טעינת מוצרים
        const productsCollectionRef = collection(db, 'products'); 
        let productsQuery = query(productsCollectionRef, orderBy("name"));
        
        // אם יש קטגוריה נבחרת, סנן לפיה
        if (selectedCategoryId) {
          productsQuery = query(
            productsCollectionRef, 
            where('category_id', '==', selectedCategoryId),
            orderBy("name")
          );
        }
        
        const querySnapshot = await getDocs(productsQuery);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[]; 
        
        console.log("Products fetched:", productsData);
        setProducts(productsData);

        // אתחול כמויות המוצרים ל-1
        const initialQuantities: Record<string, number> = {};
        productsData.forEach(product => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("שגיאה בטעינת נתונים.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategoryId]); // תלוי בקטגוריה הנבחרת

  // סינון מוצרים לפי חיפוש
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  if (loading) {
    return <div className="p-6">טוען מוצרים...</div>; // ריווח קל
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  // פונקציה לעדכון כמות המוצר
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return; // לא מאפשר כמות קטנה מ-1
    
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));
  };

  // פונקציית עזר להוספה לסל (תומכת גם במוצרים ללא וריאציות)
  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    
    // אם יש וריאציות, משתמשים בווריאציה הראשונה
    if (product.variations && product.variations.length > 0) {
      const firstVariation = product.variations[0];
      addToCart({
        productId: product.id,
        productName: product.name,
        variationName: firstVariation.name,
        priceWithVat: firstVariation.price_with_vat,
        imageUrl: product.image_url,
        quantity: quantity // מעבירים את הכמות שנבחרה
      });
      console.log(`Added ${quantity} units of ${product.name} (${firstVariation.name}) to cart.`);
    } 
    // אם אין וריאציות, משתמשים במחיר הבסיסי של המוצר
    else if (product.price_with_vat) {
      addToCart({
        productId: product.id,
        productName: product.name,
        priceWithVat: product.price_with_vat,
        imageUrl: product.image_url,
        quantity: quantity // מעבירים את הכמות שנבחרה
      });
      console.log(`Added ${quantity} units of ${product.name} to cart.`);
    } else {
      console.warn(`Product ${product.name} has no price information.`);
    }
    
    // איפוס הכמות ל-1 אחרי ההוספה לסל
    updateQuantity(product.id, 1);
  };

  // פונקציה לבדיקה האם אפשר להוסיף מוצר לסל
  const canAddToCart = (product: Product): boolean => {
    // אפשר להוסיף אם יש וריאציות או מחיר בסיסי
    return (
      (product.variations && product.variations.length > 0) ||
      (product.price_with_vat !== undefined && product.price_with_vat > 0)
    );
  };

  // פונקציה להצגת מחיר המוצר
  const getProductPrice = (product: Product): number | undefined => {
    if (product.variations && product.variations.length > 0) {
      return product.variations[0].price_with_vat;
    }
    return product.price_with_vat;
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">מוצרים</h2>
      
      {/* תיבת חיפוש */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="חיפוש מוצרים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        
        {/* תצוגה מקדימה של תוצאות החיפוש */}
        {searchQuery.trim() && (
          <div className="mt-2 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-center text-gray-500">לא נמצאו תוצאות</div>
            ) : (
              filteredProducts.slice(0, 5).map(product => (
                <div key={product.id} className="p-3 border-b hover:bg-gray-100 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      {getProductPrice(product) ? `${getProductPrice(product)?.toFixed(2)} ₪` : ''}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex border rounded mr-2">
                      <button 
                        className="px-2 py-1 bg-gray-100"
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) - 1)}
                      >-</button>
                      <span className="px-2 py-1">{quantities[product.id] || 1}</span>
                      <button 
                        className="px-2 py-1 bg-gray-100"
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) + 1)}
                      >+</button>
                    </div>
                    <button 
                      className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                      onClick={() => handleAddToCart(product)}
                      disabled={!canAddToCart(product)}
                    >
                      הוסף
                    </button>
                  </div>
                </div>
              ))
            )}
            {filteredProducts.length > 5 && (
              <div className="p-2 text-center text-sm text-gray-500 border-t">
                מציג 5 מתוך {filteredProducts.length} תוצאות
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* תפריט קטגוריות */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button 
          className={`px-3 py-1 rounded ${selectedCategoryId === null ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setSelectedCategoryId(null)}
        >
          הכל
        </button>
        {categories.map(category => (
          <button 
            key={category.id}
            className={`px-3 py-1 rounded ${selectedCategoryId === category.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {filteredProducts.length === 0 ? (
        <p>לא נמצאו מוצרים זמינים.</p>
      ) : (
        // שימוש ב-grid להצגה יפה יותר
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="border rounded-lg shadow-md overflow-hidden bg-white flex flex-col">
              {product.image_url && ( // הצגת תמונה אם קיימת
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-48 object-contain" 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image'; }} // תמונה חלופית אם יש שגיאה
                />
              )}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2 flex-grow">{product.name}</h3>
                {/* הסתרת מחיר המוצר - הורדת תצוגת המחיר */}
                
                {/* בורר כמות */}
                {canAddToCart(product) && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">כמות:</span>
                    <div className="flex items-center border rounded">
                      <button 
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-r"
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) - 1)}
                      >
                        -
                      </button>
                      <span className="px-3 py-1">{quantities[product.id] || 1}</span>
                      <button 
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-l"
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                
                {/* כפתור הוספה לסל */}
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="mt-auto w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50"
                  disabled={!canAddToCart(product)} // מניעת הוספה רק אם אין מחיר כלל
                >
                  הוסף לסל
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* <CartSummaryPopup 
        isOpen={isCartPopupOpen} 
        onClose={() => setIsCartPopupOpen(false)} 
      /> // הסרת רנדור הפופאפ */}
    </div>
  );
};

export default ClientProductsPage; 