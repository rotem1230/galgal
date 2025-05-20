// API proxy for iCount requests
// Solves CORS issues by relaying requests through the backend

const axios = require('axios');

module.exports = async (req, res) => {
  // הוספת לוגים לדיבוג
  console.log('iCount Proxy - קיבל בקשה:', { 
    method: req.method, 
    query: req.query, 
    headers: req.headers 
  });
  
  // Set CORS headers to allow requests from our frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Extract request details from query params
    const { path, ...queryParams } = req.query;
    if (!path) {
      return res.status(400).json({ error: true, message: 'Missing path parameter' });
    }
    
    const icountApiUrl = `https://api.icount.co.il/api/v3.0/${path}`;
    console.log('יעד הבקשה:', icountApiUrl);
    
    // קריאת ה-Authorization header (אם קיים)
    let authHeader = '';
    if (req.headers && req.headers.authorization) {
      authHeader = req.headers.authorization;
    }
    
    // הכנת headers לבקשה
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // שליחת הבקשה ל-API של iCount
    let response;
    
    if (req.method === 'GET') {
      console.log('שולח בקשת GET עם הפרמטרים:', queryParams);
      response = await axios.get(icountApiUrl, {
        headers,
        params: queryParams
      });
    } else if (req.method === 'POST') {
      console.log('שולח בקשת POST עם הפרמטרים ומידע:', queryParams, req.body);
      response = await axios.post(icountApiUrl, req.body, {
        headers,
        params: queryParams
      });
    }
    
    // החזרת התשובה מה-API
    console.log('התקבלה תשובה מ-iCount:', { 
      status: response.status,
      headers: response.headers,
      data: response.data 
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('שגיאה בבקשה ל-iCount:', error.message);
    if (error.response) {
      console.error('פרטי השגיאה מהשרת:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    // החזרת פרטי השגיאה
    if (error.response) {
      return res.status(error.response.status).json({
        error: true,
        message: error.message,
        details: error.response.data
      });
    } else {
      return res.status(500).json({
        error: true,
        message: error.message || 'Internal Server Error',
        details: error.stack
      });
    }
  }
}; 