import axios from 'axios';

// פרטי החיבור ל-API של iCount
let icountConfig = {
  companyId: '',       // מזהה החברה ב-iCount
  username: '',        // שם משתמש ב-iCount
  userApiToken: '',    // מפתח API של המשתמש
  apiEndpoint: 'https://api.icount.co.il/api/v3.0',
};

/**
 * הגדרת פרטי החיבור ל-iCount API
 * @param {Object} config - אובייקט המכיל את פרטי החיבור
 */
export const setIcountConfig = (config) => {
  icountConfig = { ...icountConfig, ...config };
  localStorage.setItem('icountConfig', JSON.stringify(icountConfig));
};

/**
 * טעינת הגדרות ה-API מה-localStorage
 */
export const loadIcountConfig = () => {
  const savedConfig = localStorage.getItem('icountConfig');
  if (savedConfig) {
    try {
      icountConfig = { ...icountConfig, ...JSON.parse(savedConfig) };
      return true;
    } catch (error) {
      console.error('שגיאה בטעינת הגדרות iCount:', error);
      return false;
    }
  }
  return false;
};

/**
 * פונקציית עזר לביצוע בקשות דרך ה-proxy במקום ישירות ל-iCount
 * @param {string} method - סוג הבקשה (GET/POST)
 * @param {string} endpoint - נקודת הקצה ב-API
 * @param {Object} data - נתונים לשליחה (רק ב-POST)
 * @param {Object} params - פרמטרים לשאילתה
 */
const callViaProxy = async (method, endpoint, data = null, params = {}) => {
  // הסרת ה-slash מתחילת ה-endpoint אם קיים
  const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // הוספת פרמטרים בסיסיים ל-iCount
  const requestParams = {
    path, // חשוב - מעביר את ה-path כפרמטר
    cid: icountConfig.companyId,
    username: icountConfig.username,
    ...params // שאר הפרמטרים
  };

  // הכנת headers עם token אם יש
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (icountConfig.userApiToken) {
    headers['Authorization'] = `Bearer ${icountConfig.userApiToken}`;
  }

  try {
    let response;
    const apiUrl = `/api/icount`; // עכשיו ה-path עובר כפרמטר
    
    console.log(`שולח בקשת ${method} ל-iCount:`, {
      url: apiUrl,
      params: requestParams,
      headers,
      data: method === 'POST' ? data : undefined
    });
    
    if (method === 'GET') {
      response = await axios.get(apiUrl, { params: requestParams, headers });
    } else if (method === 'POST') {
      // עבור POST, שלח את הנתונים ב-body ואת הפרמטרים ב-query
      response = await axios.post(apiUrl, data, { params: requestParams, headers });
    }
    
    return response.data;
  } catch (error) {
    console.error(`שגיאה בבקשת ${method} ל-${endpoint}:`, error);
    
    // לוג מפורט יותר של השגיאה
    if (error.response) {
      console.error('פרטי השגיאה:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw error;
  }
};

/**
 * בדיקה האם החיבור ל-iCount מוגדר ועובד
 * @returns {Promise<boolean>} - מחזיר האם החיבור תקין
 */
export const testIcountConnection = async () => {
  try {
    // בדיקה שהפרטים קיימים
    if (!icountConfig.companyId || !icountConfig.username || !icountConfig.userApiToken) {
      return false;
    }

    // בדיקת חיבור על ידי קריאה לאחד ה-endpoints, למשל רשימת לקוחות
    const response = await callViaProxy('GET', 'client/list');
    return response && !response.error;
  } catch (error) {
    console.error('שגיאה בבדיקת חיבור ל-iCount:', error);
    return false;
  }
};

/**
 * חיפוש לקוחות ב-iCount
 * @param {string} searchTerm - מונח חיפוש (אימייל/טלפון)
 * @returns {Promise<Array>} - רשימת לקוחות שנמצאו
 */
const searchClients = async (searchTerm) => {
  if (!searchTerm) return [];
  
  try {
    const response = await callViaProxy('GET', 'client/list', null, { search: searchTerm });
    return response?.data || [];
  } catch (error) {
    console.error('שגיאה בחיפוש לקוחות ב-iCount:', error);
    return [];
  }
};

/**
 * יצירת לקוח חדש ב-iCount
 * @param {Object} customer - פרטי הלקוח
 * @returns {Promise<string>} - מזהה הלקוח החדש
 */
const createNewClient = async (customer) => {
  try {
    const clientData = {
      client_name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      active: 1
    };

    const response = await callViaProxy('POST', 'client/create', clientData);

    if (response?.status === 'success') {
      return response.data.id;
    } else {
      throw new Error('שגיאה ביצירת לקוח: ' + response?.message);
    }
  } catch (error) {
    console.error('שגיאה ביצירת לקוח ב-iCount:', error);
    throw error;
  }
};

/**
 * עדכון לקוח קיים ב-iCount
 * @param {string} clientId - מזהה הלקוח
 * @param {Object} customer - פרטי הלקוח
 */
const updateClient = async (clientId, customer) => {
  try {
    const clientData = {
      id: clientId,
      client_name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || ''
    };

    await callViaProxy('POST', 'client/update', clientData);
  } catch (error) {
    console.error('שגיאה בעדכון לקוח ב-iCount:', error);
    throw error;
  }
};

/**
 * חיפוש לקוח ב-iCount לפי אימייל/טלפון והוספה/עדכון במידת הצורך
 * @param {Object} customer - פרטי הלקוח
 * @returns {Promise<string>} - מזהה הלקוח ב-iCount
 */
export const createOrUpdateClient = async (customer) => {
  try {
    // חיפוש לקוח קיים לפי אימייל
    let clientId = null;
    if (customer.email) {
      const clients = await searchClients(customer.email);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }
    }
    
    // אם לא נמצא לפי אימייל, ננסה לפי טלפון
    if (!clientId && customer.phone) {
      const clients = await searchClients(customer.phone);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }
    }
    
    // אם הלקוח נמצא, נעדכן אותו
    if (clientId) {
      await updateClient(clientId, customer);
      return clientId;
    } 
    // אחרת ניצור לקוח חדש
    else {
      return await createNewClient(customer);
    }
  } catch (error) {
    console.error('שגיאה בחיפוש/יצירת לקוח ב-iCount:', error);
    throw error;
  }
};

/**
 * יצירת חשבונית עסקה ב-iCount
 * @param {Object} order - פרטי ההזמנה
 * @param {string} clientId - מזהה הלקוח ב-iCount
 * @returns {Promise<Object>} - מידע על החשבונית שנוצרה
 */
export const createInvoice = async (order, clientId) => {
  try {
    const invoiceData = {
      client_id: clientId,
      doc_type: 'invoice', // או 'receipt' לקבלה
      items: order.items.map(item => ({
        description: item.productName + (item.variationName ? ` (${item.variationName})` : ''),
        price: item.priceWithVat,
        quantity: item.quantity,
        vatType: 'INC', // מחיר כולל מע"מ
      })),
      discount: 0,
      comments: `הזמנה מספר: ${order.id}`,
      payment_type: order.paymentMethod || 'CREDIT',
    };

    const response = await callViaProxy('POST', 'doc/create', invoiceData);

    if (response?.status === 'success') {
      return {
        invoiceId: response.data.id,
        invoiceNumber: response.data.doc_number,
        invoiceUrl: response.data.doc_url
      };
    } else {
      throw new Error('שגיאה ביצירת חשבונית: ' + response?.message);
    }
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית ב-iCount:', error);
    throw error;
  }
};

// טעינת קונפיגורציה בהפעלה ראשונה של המודול
loadIcountConfig();

export default {
  setIcountConfig,
  loadIcountConfig,
  testIcountConnection,
  createOrUpdateClient,
  createInvoice
}; 