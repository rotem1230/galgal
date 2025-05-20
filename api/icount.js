// API proxy for iCount requests
// Solves CORS issues by relaying requests through the backend

const https = require('https');
const url = require('url');

module.exports = async (req, res) => {
  // מגדיר CORS למניעת שגיאות
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // טיפול בבקשות preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // הדפסת מידע מלא לדיבוג
  console.log('==== התקבלה בקשה לפרוקסי iCount ====');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);
  
  try {
    // בדיקת פרמטרים הכרחיים
    const { cid, username, path } = req.query;
    
    if (!cid || !username || !path) {
      console.error('חסרים פרמטרים חובה:', { cid, username, path });
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters (cid, username, path)'
      });
    }
    
    // חילוץ authorization token אם קיים
    let authToken = null;
    if (req.headers.authorization) {
      // לוקח רק את החלק אחרי Bearer אם יש
      authToken = req.headers.authorization.startsWith('Bearer ') 
        ? req.headers.authorization.substring(7) 
        : req.headers.authorization;
    }
    
    // בניית URL לבקשה ל-iCount
    const icountBaseUrl = 'https://api.icount.co.il/api/v3.0';
    const endpoint = `${icountBaseUrl}/${path}`;
    
    // הכנת פרמטרים לבקשה
    const queryParams = new URLSearchParams();
    
    // הוספת פרמטרים בסיסיים
    queryParams.append('cid', cid);
    queryParams.append('username', username);
    
    // הוספת שאר הפרמטרים (למעט path)
    for (const key in req.query) {
      if (key !== 'path' && key !== 'cid' && key !== 'username') {
        queryParams.append(key, req.query[key]);
      }
    }
    
    // בניית URL סופי עם פרמטרים
    const requestUrl = `${endpoint}?${queryParams.toString()}`;
    console.log('URL מלא לבקשה:', requestUrl);
    
    // שליחת בקשה ל-iCount בצורה ידנית באמצעות https
    const icountPromise = new Promise((resolve, reject) => {
      // פרסור ה-URL
      const parsedUrl = url.parse(requestUrl);
      
      // הכנת אפשרויות בקשה
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      // הוספת ה-Authorization אם יש
      if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      console.log('אפשרויות בקשה:', options);
      
      // יצירת הבקשה
      const icountReq = https.request(options, (icountRes) => {
        console.log('קוד תשובה מ-iCount:', icountRes.statusCode);
        console.log('כותרות תשובה:', icountRes.headers);
        
        let responseData = '';
        
        // טיפול במידע מהתשובה
        icountRes.on('data', (chunk) => {
          responseData += chunk;
        });
        
        // סיום התשובה
        icountRes.on('end', () => {
          try {
            // ניסיון לפרסר JSON
            const jsonResponse = responseData.trim() ? JSON.parse(responseData) : {};
            console.log('תשובה מ-iCount (JSON):', jsonResponse);
            
            // החזרת התשובה למקורי
            resolve({
              statusCode: icountRes.statusCode,
              headers: icountRes.headers,
              data: jsonResponse
            });
          } catch (error) {
            console.error('שגיאה בפרסור תשובה:', error);
            console.log('תשובה גולמית:', responseData);
            
            // החזרת התשובה הגולמית
            resolve({
              statusCode: icountRes.statusCode,
              headers: icountRes.headers,
              data: { raw: responseData }
            });
          }
        });
      });
      
      // טיפול בשגיאות של הבקשה עצמה
      icountReq.on('error', (error) => {
        console.error('שגיאה בבקשה ל-iCount:', error);
        reject(error);
      });
      
      // טיפול ב-body ב-POST
      if (req.method === 'POST' && req.body) {
        const bodyData = JSON.stringify(req.body);
        console.log('שולח גוף POST:', bodyData);
        icountReq.write(bodyData);
      }
      
      // סיום הבקשה
      icountReq.end();
    });
    
    // המתנה לתוצאות
    const response = await icountPromise;
    
    // החזרת התשובה ללקוח
    return res.status(response.statusCode).json(response.data);
    
  } catch (error) {
    console.error('שגיאה קריטית בפרוקסי:', error);
    
    return res.status(500).json({
      error: true,
      message: error.message || 'Internal Server Error',
      stack: error.stack
    });
  }
}; 