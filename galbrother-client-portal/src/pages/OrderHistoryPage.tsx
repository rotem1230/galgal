import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { useClientAuth } from '../context/ClientAuthContext.tsx';
import { Download, Trash2, Calendar, Filter, X } from 'lucide-react'; // אייקונים

// ממשק משולב שיתמוך בשני הפורמטים של פריט הזמנה
interface OrderItem {
  // שדות מפורמט פורטל לקוחות
  productId?: string;
  productName?: string;
  variationName?: string;
  priceWithVat?: number;
  quantity: number;
  
  // שדות מפורמט פורטל ניהול
  product_id?: string;
  price_with_vat?: number;
  price_before_vat?: number;
  variation_index?: number;
}

// ממשק משולב שיתמוך בשני הפורמטים של הזמנה
interface Order {
  id: string;
  
  // שדות משותפים
  createdAt: any; // Firestore Timestamp
  items: OrderItem[];
  status: string;
  
  // שדות מפורמט פורטל לקוחות
  userId?: string;
  totalPrice?: number;
  userEmail?: string;
  userName?: string;
  orderDate?: string;
  
  // שדות מפורמט פורטל ניהול
  customer_id?: string;
  customer_name?: string;
  order_date?: string;
  total_before_vat?: number;
  total_with_vat?: number;
}

const OrderHistoryPage: React.FC = () => {
  const { currentUser } = useClientAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  
  // מצבים לסינון תאריכים
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  
  // מצב לטעינת PDF
  const [exportingOrderId, setExportingOrderId] = useState<string | null>(null);
  
  // מצב לאישור מחיקה
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const fetchOrders = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIndexError(null);
      
      // שליפת הזמנות עם שאילתות פשוטות יותר, בלי orderBy שדורש אינדקסים מיוחדים
      const ordersRef = collection(db, 'orders');
      
      // שאילתה לפי userId (פורמט ישן)
      const userOrdersQuery1 = query(
        ordersRef,
        where('userId', '==', currentUser.uid)
      );
      
      // שאילתה לפי customer_id (פורמט חדש)
      const userOrdersQuery2 = query(
        ordersRef,
        where('customer_id', '==', currentUser.uid)
      );
      
      // ביצוע שתי השאילתות
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(userOrdersQuery1),
        getDocs(userOrdersQuery2)
      ]);
      
      // יצירת סט ייחודי של מזהי הזמנות כדי למנוע כפילויות
      const uniqueOrderIds = new Set<string>();
      const ordersData: Order[] = [];
      
      // עיבוד תוצאות מהשאילתה הראשונה
      snapshot1.docs.forEach(doc => {
        const id = doc.id;
        if (!uniqueOrderIds.has(id)) {
          uniqueOrderIds.add(id);
          const data = doc.data();
          ordersData.push({
            id,
            ...data,
            createdAt: data.createdAt
          } as Order);
        }
      });
      
      // עיבוד תוצאות מהשאילתה השנייה
      snapshot2.docs.forEach(doc => {
        const id = doc.id;
        if (!uniqueOrderIds.has(id)) {
          uniqueOrderIds.add(id);
          const data = doc.data();
          ordersData.push({
            id,
            ...data,
            createdAt: data.createdAt
          } as Order);
        }
      });
      
      // מיון ידני של ההזמנות לפי תאריך יצירה (מהחדש לישן)
      ordersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setOrders(ordersData);
      console.log('Orders fetched:', ordersData.length);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      
      // בדיקה אם השגיאה קשורה לאינדקס חסר
      if (err.message && err.message.includes('index')) {
        setIndexError(err.message);
        setError('נדרשת הגדרת אינדקס בפיירבייס. פנה למנהל המערכת.');
      } else {
        setError('אירעה שגיאה בטעינת ההזמנות. אנא נסה שוב מאוחר יותר.');
      }
    } finally {
      setLoading(false);
    }
  };

  // פונקציות עזר למיפוי נתונים בין פורמטים
  
  // פונקציה שמחזירה את שם המוצר מפריט ההזמנה, תומכת בשני הפורמטים
  const getProductName = (item: OrderItem): string => {
    return item.productName || 'מוצר ללא שם';
  };

  // פונקציה שמחזירה את שם הווריאציה מפריט ההזמנה, תומכת בשני הפורמטים
  const getVariationName = (item: OrderItem): string | undefined => {
    return item.variationName;
  };

  // פונקציה לקבלת מחיר פריט - מוחלפת עם פונקציה ריקה להסתרת מחירים
  const getItemPrice = (_item: OrderItem): number => {
    return 0; // החזרת אפס במקום המחיר האמיתי
  };

  // פונקציה לקבלת סך הכל מחיר הזמנה - מוחלפת להחזרת אפס
  const getOrderTotal = (_order: Order): number => {
    return 0; // החזרת אפס במקום החישוב
  };

  // המרת Timestamp לפורמט תאריך קריא
  const formatDate = (timestamp: any, includeTime: boolean = true): string => {
    if (!timestamp) return 'לא צוין תאריך';
    
    try {
      // אם זה Timestamp של Firestore
      if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleDateString('he-IL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
        });
      }
      
      // אם זה תאריך בפורמט ISO string
      return new Date(timestamp).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'פורמט תאריך שגוי';
    }
  };

  // המרת Date לפורמט ISO ללא שעה (YYYY-MM-DD)
  const formatDateToISO = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // המרת תאריך ISO לאובייקט Date
  const parseISODate = (isoDate: string): Date => {
    return new Date(isoDate);
  };

  // המרת סטטוס הזמנה לעברית
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'ממתין לאישור';
      case 'processing':
        return 'בטיפול';
      case 'shipped':
        return 'נשלח';
      case 'completed':
        return 'הושלם';
      case 'cancelled':
        return 'בוטל';
      case 'new':
        return 'חדש';
      default:
        return status;
    }
  };

  // צבע רקע בהתאם לסטטוס
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // פונקציה לסינון הזמנות לפי תאריכים
  const filterOrdersByDate = () => {
    if (!startDate && !endDate) {
      setIsFiltered(false);
      return orders;
    }
    
    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      
      if (startDate && !endDate) {
        // סינון לפי תאריך התחלה בלבד
        return orderDate >= parseISODate(startDate);
      }
      
      if (!startDate && endDate) {
        // סינון לפי תאריך סיום בלבד
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        return orderDate <= endDateTime;
      }
      
      // סינון לפי טווח תאריכים
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      return orderDate >= parseISODate(startDate) && orderDate <= endDateTime;
    });
  };

  // פונקציה להחלת הסינון
  const applyFilter = () => {
    setIsFiltered(true);
    setFilterOpen(false);
  };

  // פונקציה לאיפוס הסינון
  const resetFilter = () => {
    setStartDate("");
    setEndDate("");
    setIsFiltered(false);
    setFilterOpen(false);
  };

  // פונקציה לעדכון סטטוס ההזמנה
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      
      // עדכון המצב המקומי
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      ));
      
      alert(`סטטוס ההזמנה עודכן ל-${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('אירעה שגיאה בעדכון סטטוס ההזמנה');
    }
  };

  // פונקציה למחיקת הזמנה
  const deleteOrder = async (orderId: string) => {
    try {
      setDeletingOrder(orderId);
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      
      // עדכון המצב המקומי - להסרת ההזמנה ממערך ההזמנות
      setOrders(orders.filter(order => order.id !== orderId));
      
      alert('ההזמנה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('אירעה שגיאה במחיקת ההזמנה');
    } finally {
      setDeletingOrder(null);
    }
  };

  // יצירת PDF ללקוח
  const downloadPDFForCustomer = async (order: Order) => {
    try {
      setExportingOrderId(order.id);
      
      // יצירת התוכן של ה-PDF בפורמט HTML
      let htmlContent = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>הזמנה - ${order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');
          
          body {
            font-family: 'Heebo', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #fff;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          
          .logo-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #333;
          }
          
          .invoice-details {
            text-align: left;
          }
          
          .invoice-details h3 {
            margin: 0;
            font-size: 14px;
            color: #888;
          }
          
          .invoice-details p {
            margin: 5px 0;
            font-size: 16px;
            font-weight: bold;
          }
          
          .customer-details {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          
          .customer-details h2 {
            margin-top: 0;
            font-size: 18px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            color: #555;
          }
          
          .invoice-title {
            text-align: center;
            font-size: 22px;
            margin: 20px 0;
            color: #333;
            font-weight: bold;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background-color: #f0f0f0;
            padding: 10px;
            text-align: right;
            font-weight: bold;
            color: #555;
            border-bottom: 2px solid #ddd;
          }
          
          td {
            padding: 10px;
            text-align: right;
            border-bottom: 1px solid #eee;
          }
          
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 14px;
            color: #888;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .container {
              width: 100%;
              max-width: 100%;
              padding: 10px;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <h1 class="company-name">האחים גל</h1>
            </div>
            <div class="invoice-details">
              <h3>מספר הזמנה</h3>
              <p>${order.id}</p>
              <h3>תאריך</h3>
              <p>${formatDate(order.createdAt, false)}</p>
            </div>
          </div>
          
          <div class="customer-details">
            <h2>פרטי לקוח</h2>
            <p><strong>שם:</strong> ${order.userName || order.customer_name || 'לא צוין'}</p>
          </div>
          
          <h2 class="invoice-title">פירוט הזמנה</h2>
          
          <table>
            <thead>
              <tr>
                <th>מוצר</th>
                <th>כמות</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const productName = getProductName(item);
                const variationName = getVariationName(item);
                return `
                  <tr>
                    <td>${productName}${variationName ? ` - ${variationName}` : ''}</td>
                    <td>${item.quantity}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="text-align: left; margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="font-size: 18px; font-weight: bold;">
              סה"כ פריטים: ${order.items.reduce((sum, item) => sum + item.quantity, 0)} יח'</p>
          </div>
          
          <div class="footer">
            <p>האחים גל</p>
            <p>תודה שקנית אצלנו!</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      // יצירת בלוב מהתוכן והורדת הקובץ
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `הזמנה-${order.id}-ללקוח.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error("Error generating customer PDF:", error);
      alert("שגיאה ביצירת המסמך");
    } finally {
      setExportingOrderId(null);
    }
  };

  // קבלת הזמנות אחרי סינון
  const displayedOrders = isFiltered ? filterOrdersByDate() : orders;

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6">היסטוריית הזמנות</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4">טוען היסטוריית הזמנות...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6">היסטוריית הזמנות</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          {indexError && (
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="font-medium mb-2">הודעת שגיאה למפתח:</p>
              <div className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                <code>{indexError}</code>
              </div>
              <p className="mt-4 text-sm">
                כדי לפתור את הבעיה, יש ליצור אינדקסים בפיירבייס לפי הקישורים שמופיעים בשגיאה.
                <br />
                לאחר יצירת האינדקסים יש להמתין מספר דקות עד שהם יתעדכנו בבסיס הנתונים.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">היסטוריית הזמנות</h2>
        
        {/* כפתור סינון */}
        <button 
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Filter className="w-4 h-4" />
          סנן לפי תאריך
        </button>
      </div>
      
      {/* תיבת סינון תאריכים */}
      {filterOpen && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">סינון לפי תאריך</h3>
            <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">מתאריך</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">עד תאריך</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              onClick={resetFilter}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              איפוס
            </button>
            <button 
              onClick={applyFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!startDate && !endDate}
            >
              החל סינון
            </button>
          </div>
        </div>
      )}
      
      {/* הודעה על סינון פעיל */}
      {isFiltered && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>
              מציג הזמנות מתאריך 
              {startDate && <strong> {new Date(startDate).toLocaleDateString('he-IL')} </strong>}
              {startDate && endDate && 'עד '}
              {endDate && <strong> {new Date(endDate).toLocaleDateString('he-IL')} </strong>}
            </span>
          </div>
          <button 
            onClick={resetFilter} 
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            הסר סינון
          </button>
        </div>
      )}
      
      {displayedOrders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {isFiltered ? 'לא נמצאו הזמנות בטווח התאריכים שנבחר' : 'לא נמצאו הזמנות קודמות.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map(order => (
            <div key={order.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">מס' הזמנה: <span className="font-medium">{order.id}</span></p>
                  <p className="text-sm text-gray-500">תאריך: {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-2">פריטים בהזמנה:</h3>
                <ul className="divide-y">
                  {order.items.map((item, index) => (
                    <li key={index} className="py-3 flex justify-between">
                      <div>
                        <span className="font-medium">{getProductName(item)}</span>
                        {getVariationName(item) && (
                          <span className="text-sm text-gray-600"> ({getVariationName(item)})</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{item.quantity} × {getItemPrice(item).toFixed(2)} ₪</div>
                        <div>{(item.quantity * getItemPrice(item)).toFixed(2)} ₪</div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="flex justify-between font-bold">
                    <span>סה"כ פריטים:</span>
                    <span className="mr-2">{order.items.reduce((sum, item) => sum + item.quantity, 0)} יח'</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* כפתור מחיקת הזמנה */}
                    <button
                      onClick={() => {
                        if (window.confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
                          deleteOrder(order.id);
                        }
                      }}
                      disabled={!!deletingOrder}
                      className="flex items-center gap-1 px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingOrder === order.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>מחק</span>
                    </button>
                    
                    {/* כפתור הורדת PDF */}
                    <button
                      onClick={() => downloadPDFForCustomer(order)}
                      disabled={!!exportingOrderId}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {exportingOrderId === order.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>הורד PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage; 