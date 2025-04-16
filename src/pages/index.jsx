import Layout from "./Layout.jsx";

import Categories from "./Categories";

import Products from "./Products";

import Orders from "./Orders";

import Customers from "./Customers";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Categories: Categories,
    
    Products: Products,
    
    Orders: Orders,
    
    Customers: Customers,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Categories />} />
                
                
                <Route path="/Categories" element={<Categories />} />
                
                <Route path="/Products" element={<Products />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/Customers" element={<Customers />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}