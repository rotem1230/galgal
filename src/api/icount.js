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
    const response = await axios.get(`${icountConfig.apiEndpoint}/client/list`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${icountConfig.userApiToken}`
      },
      params: {
        'cid': icountConfig.companyId,
        'username': icountConfig.username
      }
    });

    return response.status === 200;
  } catch (error) {
    console.error('שגיאה בבדיקת חיבור ל-iCount:', error);
    return false;
  }
};

/**
 * יצירת לקוח חדש ב-iCount (אם לא קיים)
 * @param {Object} customer - פרטי הלקוח
 * @returns {Promise<string>} - מזהה הלקוח ב-iCount
 */
export const createOrUpdateClient = async (customer) => {
  try {
    // בדיקת קיום לקוח לפי מייל או טלפון
    const existingClients = await searchClients(customer.email || customer.phone);
    
    if (existingClients && existingClients.length > 0) {
      // עדכון לקוח קיים
      const clientId = existingClients[0].id;
      await updateClient(clientId, customer);
      return clientId;
    } else {
      // יצירת לקוח חדש
      return await createNewClient(customer);
    }
  } catch (error) {
    console.error('שגיאה בעדכון/יצירת לקוח ב-iCount:', error);
    throw error;
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
    const response = await axios.get(`${icountConfig.apiEndpoint}/client/list`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${icountConfig.userApiToken}`
      },
      params: {
        'cid': icountConfig.companyId,
        'username': icountConfig.username,
        'search': searchTerm
      }
    });

    return response.data?.data || [];
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
      cid: icountConfig.companyId,
      username: icountConfig.username,
      client_name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      active: 1
    };

    const response = await axios.post(`${icountConfig.apiEndpoint}/client/create`, clientData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${icountConfig.userApiToken}`
      }
    });

    if (response.data?.status === 'success') {
      return response.data.data.id;
    } else {
      throw new Error('שגיאה ביצירת לקוח: ' + response.data?.message);
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
      cid: icountConfig.companyId,
      username: icountConfig.username,
      id: clientId,
      client_name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || ''
    };

    await axios.post(`${icountConfig.apiEndpoint}/client/update`, clientData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${icountConfig.userApiToken}`
      }
    });
  } catch (error) {
    console.error('שגיאה בעדכון לקוח ב-iCount:', error);
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
      cid: icountConfig.companyId,
      username: icountConfig.username,
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

    const response = await axios.post(`${icountConfig.apiEndpoint}/doc/create`, invoiceData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${icountConfig.userApiToken}`
      }
    });

    if (response.data?.status === 'success') {
      return {
        invoiceId: response.data.data.id,
        invoiceNumber: response.data.data.doc_number,
        invoiceUrl: response.data.data.doc_url
      };
    } else {
      throw new Error('שגיאה ביצירת חשבונית: ' + response.data?.message);
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