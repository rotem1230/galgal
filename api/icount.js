// API proxy for iCount requests
// Solves CORS issues by relaying requests through the backend

const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers to allow requests from our frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Extract request details
    const { path } = req.query;
    const icountApiUrl = `https://api.icount.co.il/api/v3.0/${path || ''}`;
    
    // Forward request to iCount API
    let response;
    
    if (req.method === 'GET') {
      response = await axios.get(icountApiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        },
        params: req.query
      });
    } else if (req.method === 'POST') {
      response = await axios.post(icountApiUrl, req.body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        }
      });
    }
    
    // Return the response from iCount
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('שגיאה בבקשה ל-iCount:', error);
    
    // Return error details
    return res.status(error.response?.status || 500).json({
      error: true,
      message: error.message,
      details: error.response?.data
    });
  }
}; 