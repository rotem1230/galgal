import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase-config'; // הפעלת הייבוא
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"; // הפעלת הייבוא + הוספת query ו-orderBy
import { useCart } from '../context/CartContext.tsx'; // <-- ייבוא ה-Hook של העגלה
import { ChevronDown } from 'lucide-react'; // ייבוא אייקון לדרופדאון
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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

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

  // פונקציה לבדיקה אם תמונה תקפה
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    if (url.trim() === '') return false;
    // בדיקה בסיסית שזה URL תקין
    return url.startsWith('http://') || url.startsWith('https://');
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
      
      {/* תפריט קטגוריות - דרופדאון */}
      <div className="mb-6 relative">
        <button 
          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
          className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-right"
        >
          <span>
            {selectedCategoryId === null 
              ? 'כל הקטגוריות' 
              : categories.find(cat => cat.id === selectedCategoryId)?.name || 'בחר קטגוריה'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
        
        {isCategoryDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full md:w-64 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
            <button 
              className={`w-full px-4 py-2 text-right hover:bg-gray-100 ${selectedCategoryId === null ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
              onClick={() => {
                setSelectedCategoryId(null);
                setIsCategoryDropdownOpen(false);
              }}
            >
              כל הקטגוריות
            </button>
            {categories.map(category => (
              <button 
                key={category.id}
                className={`w-full px-4 py-2 text-right hover:bg-gray-100 ${selectedCategoryId === category.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setIsCategoryDropdownOpen(false);
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {filteredProducts.length === 0 ? (
        <p>לא נמצאו מוצרים זמינים.</p>
      ) : (
        // שימוש ב-grid להצגה יפה יותר עם גבהים קבועים לכל המרכיבים
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            // כרטיס מוצר עם גובה קבוע מוחלט
            <div key={product.id} className="border rounded-lg shadow-md overflow-hidden bg-white flex flex-col" style={{ height: '480px' }}>
              {/* קונטיינר תמונה עם גובה קבוע מוחלט */}
              <div className="w-full overflow-hidden bg-gray-100 flex items-center justify-center" style={{ height: '220px', minHeight: '220px', maxHeight: '220px' }}>
                {isValidImageUrl(product.image_url) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="max-w-full max-h-full object-contain" 
                      onError={(e) => { 
                        // כאשר יש שגיאה בטעינת התמונה, אנחנו:
                        // 1. מונעים ניסיונות טעינה מחדש על ידי ריקון מקור התמונה
                        // 2. מחליפים לתמונת placeholder קבועה
                        const target = e.target as HTMLImageElement;
                        // הוספת בדיקה שהתמונה לא כבר שונתה לתמונת placeholder כדי למנוע לולאה אינסופית
                        if (!target.src.includes('placeholder')) {
                          target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          target.onerror = null; // מבטל את אירוע השגיאה למניעת לולאה אינסופית
                        }
                      }}
                    />
                  </div>
                ) : (
                  // תצוגת placeholder קבועה למוצרים ללא תמונה
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-gray-500 mt-2 text-center px-2 line-clamp-1">{product.name}</span>
                  </div>
                )}
              </div>
              
              {/* אזור תוכן עם גבהים וריווחים קבועים */}
              <div className="p-4 flex flex-col flex-1">
                {/* כותרת עם גובה קבוע */}
                <div className="mb-2" style={{ height: '48px', minHeight: '48px', maxHeight: '48px' }}>
                  <h3 className="text-lg font-semibold line-clamp-2 overflow-hidden">{product.name}</h3>
                </div>
                
                {/* מחיר המוצר */}
                <div className="mb-2" style={{ height: '24px', minHeight: '24px', maxHeight: '24px' }}>
                  {getProductPrice(product) ? (
                    <p className="text-md font-medium text-blue-700">{getProductPrice(product)?.toFixed(2)} ₪</p>
                  ) : (
                    <p className="text-md font-medium text-gray-400">ללא מחיר</p>
                  )}
                </div>
                
                {/* מרווח גמיש */}
                <div className="flex-grow min-h-[30px]"></div>
                
                {/* אזור הכפתורים - גובה קבוע */}
                <div className="" style={{ height: '100px', minHeight: '100px', maxHeight: '100px' }}>
                  {/* בורר כמות */}
                  {canAddToCart(product) && (
                    <div className="flex items-center justify-between mb-4">
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
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50 font-semibold"
                    disabled={!canAddToCart(product)}
                  >
                    הוסף לסל
                  </button>
                </div>
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