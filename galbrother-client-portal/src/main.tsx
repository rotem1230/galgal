import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // נייבא את App.tsx
// import './index.css'; // נייבא דרך index.html לבדיקה

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
); 