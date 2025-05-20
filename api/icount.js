// API proxy for iCount - with express approach
// Solves CORS issues by relaying requests through the backend

const axios = require('axios');

module.exports = async (req, res) => {
  // הגדרת CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // טיפול בבקשות preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log('iCount Proxy Request:', {
    method: req.method,
    query: req.query,
    url: req.url
  });
  
  try {
    // בדיקת פרמטרים חובה
    const { cid, username, path } = req.query;
    
    if (!cid || !username || !path) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameters (cid, username, path)'
        }
      });
    }
    
    // הכנת URL ל-iCount API
    const icountBaseUrl = 'https://api.icount.co.il/api/v3.0';
    const endpoint = `${icountBaseUrl}/${path}`;
    
    // הכנת פרמטרים לשאילתה
    const params = { ...req.query };
    delete params.path; // לא צריך לשלוח את ה-path כפרמטר
    
    // הכנת אפשרויות הבקשה
    const options = {
      method: req.method,
      url: endpoint,
      params: params,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // הוספת Authorization אם יש
    if (req.headers.authorization) {
      options.headers.Authorization = req.headers.authorization;
    }
    
    // אם זה POST, מוסיפים את הבאדי
    if (req.method === 'POST' && req.body) {
      options.data = req.body;
    }
    
    console.log('Sending request to iCount:', {
      url: options.url,
      method: options.method,
      params: options.params
    });
    
    // שליחת הבקשה באמצעות axios
    const response = await axios(options);
    
    // החזרת התשובה
    return res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('iCount Proxy Error:', error.message);
    
    // משיכת מידע שגיאה אם קיים
    const status = error.response?.status || 500;
    const errorData = {
      error: {
        message: error.message,
        details: error.response?.data || error.stack
      }
    };
    
    console.error('Error details:', errorData);
    
    return res.status(status).json(errorData);
  }
}; 