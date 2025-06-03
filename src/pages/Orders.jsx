import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Order } from "@/api/entities";
import { Category } from "@/api/entities";
import { Customer } from "@/api/entities";
import { CustomerPricing } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  FileText,
  X,
  Download,
  Search,
  Package,
  ShoppingCart,
  Minus,
  Users,
  User,
  Filter,
  CalendarRange,
  Trash2,
  Receipt,
  ExternalLink
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { InvokeLLM } from "@/api/integrations";
import { Checkbox } from "@/components/ui/checkbox";

const VAT_RATE = 0.18; 

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_id: "",
    order_date: new Date().toISOString().split("T")[0],
    items: [],
    total_before_vat: 0,
    total_with_vat: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(-1);
  
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [customerFilter, setCustomerFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [customerPricing, setCustomerPricing] = useState([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isLoading) setIsLoading(true);
    setLoadError("");
    try {
      const ordersData = await Order.list();
      const productsData = await Product.list();
      const categoriesData = await Category.list();
      const customersData = await Customer.list();
      const customerPricingData = await CustomerPricing.list();

      setOrders(ordersData);
      setProducts(productsData);
      setCategories(categoriesData);
      setCustomers(customersData);
      setCustomerPricing(customerPricingData);
    } catch (error) {
      console.error("Error loading data:", error);
      if (error.response?.status === 429) {
        setLoadError(
          "נתקלנו במגבלת קצב בקשות. אנא המתן מעט וטען את הדף מחדש."
        );
      } else {
        setLoadError(`שגיאה בטעינת נתונים: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableYears = () => {
    const years = new Set();
    orders.forEach(order => {
      const year = new Date(order.order_date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredCustomers = customerSearchQuery === ""
    ? customers
    : customers.filter((customer) =>
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (customer.phone && customer.phone.includes(customerSearchQuery))
      );

  const filteredOrders = orders.filter((order) => {
    if (orderIdQuery && !order.id.includes(orderIdQuery)) {
      return false;
    }
    
    if (selectedCustomerId && order.customer_id !== selectedCustomerId) {
      return false;
    }
    
    const orderDate = new Date(order.order_date);
    const orderMonth = orderDate.getMonth();
    const orderYear = orderDate.getFullYear();

    if (orderMonth !== selectedMonth || orderYear !== selectedYear) {
      return false;
    }

    if (dateRange.from && dateRange.to) {
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      
      if (orderDate < from || orderDate > to) {
        return false;
      }
    }
    
    if (customerFilter && !order.customer_name.toLowerCase().includes(customerFilter.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "";
  };

  const resetFilters = () => {
    setDateRange({ from: null, to: null });
    setCustomerFilter("");
    setOrderIdQuery("");
    setSelectedCustomerId("");
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setQuantityToAdd(1);
    setSelectedVariation(-1);
  };

  const getProductPrice = (productId, variationIndex = -1) => {
    if (!newOrder.customer_id) return null;
    
    const customPrice = customerPricing.find(
      p => p.customer_id === newOrder.customer_id && 
          p.product_id === productId &&
          p.variation_index === variationIndex
    );
    
    if (customPrice) {
      return {
        price_before_vat: customPrice.price_before_vat,
        price_with_vat: customPrice.price_with_vat
      };
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    
    if (variationIndex >= 0 && product.variations?.[variationIndex]) {
      return {
        price_before_vat: product.variations[variationIndex].price_before_vat,
        price_with_vat: product.variations[variationIndex].price_with_vat
      };
    }
    
    return {
      price_before_vat: product.price_before_vat,
      price_with_vat: product.price_with_vat
    };
  };

  const addProductToOrder = () => {
    if (!selectedProduct) return;

    const pricing = getProductPrice(selectedProduct.id, selectedVariation);
    if (!pricing) return;

    const newItem = {
      product_id: selectedProduct.id,
      variation_index: selectedVariation,
      quantity: quantityToAdd,
      price_before_vat: pricing.price_before_vat,
      price_with_vat: pricing.price_with_vat
    };

    const total_before_vat = newOrder.total_before_vat + pricing.price_before_vat * quantityToAdd;
    const total_with_vat = newOrder.total_with_vat + pricing.price_with_vat * quantityToAdd;

    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem],
      total_before_vat,
      total_with_vat,
    });

    setSelectedProduct(null);
    setQuantityToAdd(1);
    setSelectedVariation(-1);
    setIsProductDialogOpen(false);
  };

  const removeItem = (index) => {
    const items = [...newOrder.items];
    const itemToRemove = items[index];

    const total_before_vat =
      newOrder.total_before_vat - itemToRemove.price_before_vat * itemToRemove.quantity;
    const total_with_vat =
      newOrder.total_with_vat - itemToRemove.price_with_vat * itemToRemove.quantity;

    items.splice(index, 1);

    setNewOrder({
      ...newOrder,
      items,
      total_before_vat,
      total_with_vat,
    });
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;

    const items = [...newOrder.items];
    const oldQuantity = items[index].quantity;

    const pricing = getProductPrice(items[index].product_id, items[index].variation_index);
    if (!pricing) return;

    const quantityDiff = newQuantity - oldQuantity;
    const priceDiffBeforeVat = pricing.price_before_vat * quantityDiff;
    const priceDiffWithVat = pricing.price_with_vat * quantityDiff;

    items[index].quantity = newQuantity;

    setNewOrder({
      ...newOrder,
      items,
      total_before_vat: newOrder.total_before_vat + priceDiffBeforeVat,
      total_with_vat: newOrder.total_with_vat + priceDiffWithVat,
    });
  };

  const handleSubmit = async () => {
    try {
      const orderData = { ...newOrder };
      
      // יצירת ההזמנה במערכת
      const createdOrder = await Order.create(orderData);
      
      // יצירת חשבונית ב-iCount (אם הוגדר)
      try {
        // ייבוא מודול iCount API
        const iCountAPI = await import("@/api/icount");
        
        // בדיקה אם החיבור ל-iCount מוגדר
        const isConnected = await iCountAPI.testIcountConnection();
        
        if (isConnected) {
          // יצירת או עדכון הלקוח ב-iCount
          const customerData = {
            name: orderData.customer_name,
            email: orderData.customer_email || "",
            phone: orderData.customer_phone || "",
            address: orderData.customer_address || ""
          };
          
          const clientId = await iCountAPI.createOrUpdateClient(customerData);
          
          // יצירת החשבונית
          const invoiceData = await iCountAPI.createInvoice({
            id: createdOrder.id,
            items: orderData.items,
            paymentMethod: orderData.payment_method || "CREDIT"
          }, clientId);
          
          // עדכון ההזמנה עם פרטי החשבונית
          await Order.update(createdOrder.id, {
            icount_invoice_id: invoiceData.invoiceId,
            icount_invoice_number: invoiceData.invoiceNumber,
            icount_invoice_url: invoiceData.invoiceUrl
          });
          
          console.log(`חשבונית נוצרה בהצלחה ב-iCount, מספר: ${invoiceData.invoiceNumber}`);
        }
      } catch (icountError) {
        console.error("שגיאה ביצירת חשבונית ב-iCount:", icountError);
        // לא מחזירים שגיאה למשתמש - היצירה צריכה להצליח גם אם יצירת החשבונית נכשלה
      }
      
      setIsAddOpen(false);
      setNewOrder({
        customer_name: "",
        customer_id: "",
        order_date: new Date().toISOString().split("T")[0],
        items: [],
        total_before_vat: 0,
        total_with_vat: 0,
      });
      setSearchQuery("");
      setSelectedCategory("all");
      await loadData();
    } catch (error) {
      console.error("Error creating order:", error);
      setLoadError(`שגיאה ביצירת הזמנה: ${error.message}`);
    }
  };
  
  const selectCustomer = (customer) => {
    setNewOrder({
      ...newOrder,
      customer_id: customer.id,
      customer_name: customer.name
    });
    setCustomerSearchOpen(false);
  };

  const downloadPDFForWarehouse = async (order) => {
    try {
      setIsExporting(true);
      
      let htmlContent = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>הזמנה למחסן - ${order.id}</title>
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
          
          .logo {
            max-width: 150px;
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
          
          .totals {
            margin-top: 20px;
            margin-left: auto;
            width: 100%;
            max-width: 300px;
            text-align: left;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          
          .final-total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #eee;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .watermark {
            display: none;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 14px;
            color: #888;
          }
          
          @media (min-width: 600px) {
            .container {
              padding: 40px;
            }
            
            .header {
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .watermark {
              display: block;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              opacity: 0.07;
              color: #000;
              pointer-events: none;
              z-index: 0;
            }
          }
          
          @media print {
            .watermark {
              display: block;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              opacity: 0.07;
              color: #000;
            }
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
          <div class="watermark">למחסן</div>
          <div class="header">
            <div class="logo-container">
              <h1 class="company-name">האחים גל</h1>
            </div>
            <div class="invoice-details">
              <h3>מספר הזמנה</h3>
              <p>${order.id}</p>
              <h3>תאריך</h3>
              <p>${new Date(order.order_date).toLocaleDateString('he-IL')}</p>
            </div>
          </div>
          
          <div class="customer-details">
            <h2>פרטי לקוח</h2>
            <p><strong>שם:</strong> ${order.customer_name}</p>
          </div>
          
          <h2 class="invoice-title">פירוט הזמנה למחסן</h2>
          
          <table>
            <thead>
              <tr>
                <th>מוצר</th>
                <th>כמות</th>
                <th>מחיר ליח׳ ללא מע״מ</th>
                <th>מחיר ליח׳ כולל מע״מ</th>
                <th>סה״כ כולל מע״מ</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const product = products.find(p => p.id === item.product_id);
                const productName = product ? product.name : '';
                const variationName = item.variation_index >= 0 && product?.variations ? 
                  ` - ${product.variations[item.variation_index].name}` : '';
                return `
                  <tr>
                    <td>${productName}${variationName}</td>
                    <td>${item.quantity}</td>
                    <td>₪${item.price_before_vat.toFixed(2)}</td>
                    <td>₪${item.price_with_vat.toFixed(2)}</td>
                    <td>₪${(item.price_with_vat * item.quantity).toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>סה״כ ללא מע״מ:</span>
              <span>₪${order.total_before_vat.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>מע״מ (18%):</span>
              <span>₪${(order.total_with_vat - order.total_before_vat).toFixed(2)}</span>
            </div>
            <div class="total-row final-total">
              <span>סה״כ כולל מע״ם:</span>
              <span>₪${order.total_with_vat.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>האחים גל</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `הזמנה-${order.id}-למחסן.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('הקובץ נשמר בהצלחה. פתח אותו בדפדפן להדפסה.');
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error("Error generating warehouse PDF:", error);
      setLoadError("שגיאה ביצירת המסמך למחסן");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDFForCustomer = async (order) => {
    try {
      setIsExporting(true);
      
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
          
          .logo {
            max-width: 150px;
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
          
          @media (min-width: 600px) {
            .container {
              padding: 40px;
            }
            
            .header {
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
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
              <p>${new Date(order.order_date).toLocaleDateString('he-IL')}</p>
            </div>
          </div>
          
          <div class="customer-details">
            <h2>פרטי לקוח</h2>
            <p><strong>שם:</strong> ${order.customer_name}</p>
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
                const product = products.find(p => p.id === item.product_id);
                const productName = product ? product.name : '';
                const variationName = item.variation_index >= 0 && product?.variations ? 
                  ` - ${product.variations[item.variation_index].name}` : '';
                return `
                  <tr>
                    <td>${productName}${variationName}</td>
                    <td>${item.quantity}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>האחים גל</p>
            <p>תודה שקנית אצלנו!</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ההזמנה-${order.id}-ללקוח.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('הקובץ נשמר בהצלחה. פתח אותו בדפדפן להדפסה.');
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error("Error generating customer PDF:", error);
      setLoadError("שגיאה ביצירת המסמך ללקוח");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await Order.delete(orderId);
      await loadData();
    } catch (error) {
      console.error("Error deleting order:", error);
      setLoadError(`שגיאה במחיקת הזמנה: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return;
    
    setIsBulkDeleting(true);
    try {
      for (const orderId of selectedOrders) {
        await Order.delete(orderId);
      }
      setSelectedOrders(new Set());
      await loadData();
    } catch (error) {
      console.error("Error deleting orders:", error);
      setLoadError(`שגיאה במחיקת הזמנות: ${error.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getProductDisplay = (item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return 'מוצר לא קיים';
    
    let displayName = product.name;
    
    if (item.variation_index >= 0 && product.variations && product.variations[item.variation_index]) {
      displayName += ` - ${product.variations[item.variation_index].name}`;
    }
    
    return displayName;
  };

  const handleItemQuantityInput = (index, e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) return;
    updateItemQuantity(index, value);
  };

  const handleQuantityInput = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) return;
    setQuantityToAdd(value);
  };

  // פונקציה ליצירת חשבונית עבור הזמנה קיימת
  const createOrderInvoice = async (order) => {
    setIsCreatingInvoice(true);
    
    try {
      // ייבוא מודול iCount API
      const iCountAPI = await import("@/api/icount");
      
      // בדיקה אם החיבור ל-iCount מוגדר
      const isConnected = await iCountAPI.testIcountConnection();
      
      if (!isConnected) {
        alert("החיבור ל-iCount אינו מוגדר או אינו תקין. בדוק את ההגדרות בדף 'הגדרות iCount'.");
        return;
      }
      
      // יצירת או עדכון הלקוח ב-iCount
      const customerData = {
        name: order.customer_name,
        email: order.customer_email || "",
        phone: order.customer_phone || "",
        address: order.customer_address || ""
      };
      
      const clientId = await iCountAPI.createOrUpdateClient(customerData);
      
      // יצירת החשבונית
      const invoiceData = await iCountAPI.createInvoice({
        id: order.id,
        items: order.items,
        paymentMethod: order.payment_method || "CREDIT"
      }, clientId);
      
      // עדכון ההזמנה עם פרטי החשבונית
      await Order.update(order.id, {
        icount_invoice_id: invoiceData.invoiceId,
        icount_invoice_number: invoiceData.invoiceNumber,
        icount_invoice_url: invoiceData.invoiceUrl
      });
      
      // רענון הנתונים
      await loadData();
      
      alert(`חשבונית נוצרה בהצלחה ב-iCount, מספר: ${invoiceData.invoiceNumber}`);
      setInvoiceDialogOpen(false);
    } catch (error) {
      console.error("שגיאה ביצירת חשבונית:", error);
      alert(`שגיאה ביצירת חשבונית: ${error.message}`);
    } finally {
      setIsCreatingInvoice(false);
      setSelectedOrderForInvoice(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">הזמנות</h1>
        <div className="flex gap-2 flex-wrap">
          {selectedOrders.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-b-transparent rounded-full ml-2"></div>
                  מוחק...
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  מחק {selectedOrders.size} הזמנות
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 ml-2" />
            סינון הזמנות
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            הזמנה חדשה
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* חיפוש לפי מספר הזמנה */}
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="חפש לפי מספר הזמנה..."
            value={orderIdQuery}
            onChange={(e) => setOrderIdQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsFilterOpen(true)}
          className="ml-auto"
        >
          <Filter className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "הסתר סינון" : "הצג סינון מתקדם"}
        </Button>
        
        <Button variant="default" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          הזמנה חדשה
        </Button>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">חודש</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">ינואר</SelectItem>
                  <SelectItem value="1">פברואר</SelectItem>
                  <SelectItem value="2">מרץ</SelectItem>
                  <SelectItem value="3">אפריל</SelectItem>
                  <SelectItem value="4">מאי</SelectItem>
                  <SelectItem value="5">יוני</SelectItem>
                  <SelectItem value="6">יולי</SelectItem>
                  <SelectItem value="7">אוגוסט</SelectItem>
                  <SelectItem value="8">ספטמבר</SelectItem>
                  <SelectItem value="9">אוקטובר</SelectItem>
                  <SelectItem value="10">נובמבר</SelectItem>
                  <SelectItem value="11">דצמבר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">שנה</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableYears().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">לקוח</label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="כל הלקוחות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">כל הלקוחות</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={resetFilters} className="ml-2">איפוס</Button>
            <Button onClick={() => setShowFilters(false)}>סגור</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p>טעון נתונים...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center p-10 bg-gray-50 rounded-lg">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו הזמנות</h3>
                <p className="text-gray-500">
                  {showFilters ? 'נסה לשנות את פרמטרי הסינון' : 'ליצירת הזמנה חדשה, לחץ על הכפתור "הזמנה חדשה"'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="p-4 relative">
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                    />
                  </div>
                  <div className="flex justify-between items-start pt-6">
                    <div>
                      <h3 className="font-bold">{order.customer_name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.order_date).toLocaleDateString('he-IL')}
                      </p>
                      <div className="mt-2">
                        {order.items.map((item, index) => {
                          const product = products.find((p) => p.id === item.product_id);
                          return (
                            <p key={index} className="text-sm">
                              {getProductDisplay(item)}
                              {` (${item.quantity})`}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">₪{order.total_with_vat.toFixed(2)}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isExporting}>
                              {isExporting ? (
                                <>
                                  <div className="animate-spin w-4 h-4 border-2 border-b-transparent rounded-full ml-2"></div>
                                  מייצא...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 ml-2" />
                                  הורד PDF
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => downloadPDFForWarehouse(order)}
                              disabled={isExporting}
                            >
                              PDF למחסן
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => downloadPDFForCustomer(order)}
                              disabled={isExporting}
                            >
                              PDF ללקוח
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* כפתור צפייה/יצירת חשבונית */}
                        {order.icount_invoice_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(order.icount_invoice_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 ml-2" />
                            צפה בחשבונית
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrderForInvoice(order);
                              setInvoiceDialogOpen(true);
                            }}
                          >
                            <Receipt className="w-4 h-4 ml-2" />
                            צור חשבונית
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen} className="max-w-4xl">
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>הזמנה חדשה</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-6 overflow-hidden flex-grow">
                <div className="space-y-4 flex flex-col">
                  <div>
                    <label className="block text-sm font-medium mb-1">לקוח</label>
                    <div className="flex gap-2">
                      <Input
                        value={newOrder.customer_name}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, customer_name: e.target.value })
                        }
                        placeholder="הכנס שם לקוח"
                        className="flex-grow"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setCustomerSearchOpen(true)}
                        type="button"
                        className="shrink-0"
                      >
                        <Users className="h-4 w-4 ml-2" />
                        בחר לקוח
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">תאריך</label>
                    <Input
                      type="date"
                      value={newOrder.order_date}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, order_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex-grow flex flex-col">
                    <label className="block text-sm font-medium mb-1">פריטים בהזמנה</label>

                    <Button
                      onClick={() => setIsProductDialogOpen(true)}
                      className="mb-4"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף מוצר להזמנה
                    </Button>

                    <ScrollArea className="flex-grow border rounded-md p-2">
                      {newOrder.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                          <ShoppingCart className="h-12 w-12 mb-2" />
                          <p>טרם נוספו פריטים להזמנה</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {newOrder.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center border-b pb-2">
                              <div className="flex-1">
                                <p className="font-medium">{getProductDisplay(item)}</p>
                                <div className="flex items-center mt-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <div className="mx-1 w-16">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => handleItemQuantityInput(index, e)}
                                      className="h-6 text-center p-1"
                                    />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-left">
                                <p>₪{(item.price_with_vat * item.quantity).toFixed(2)}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                  className="h-6 w-6"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="mt-4 text-left border-t pt-4">
                      <p className="text-sm">סה״ג ללא מע״מ: ₪{newOrder.total_before_vat.toFixed(2)}</p>
                      <p className="text-sm">מע״מ (18%): ₪{(newOrder.total_with_vat - newOrder.total_before_vat).toFixed(2)}</p>
                      <p className="font-bold">סה״ג כולל מע״מ: ₪{newOrder.total_with_vat.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleSubmit}
                    disabled={!newOrder.customer_name || newOrder.items.length === 0}
                    className="ml-auto"
                  >
                    צור הזמנה
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>בחירת מוצר</DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col h-full max-h-[70vh]">
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="חפש מוצר..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-8"
                    />
                  </div>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="כל הקטגוריות" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-auto">
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct ? (
                  <div className="border p-4 rounded-lg bg-white">
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">{getCategoryName(selectedProduct.category_id)}</p>

                    {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">בחר סוג/וריאציה:</label>
                        <Select
                          value={selectedVariation.toString()}
                          onValueChange={(val) => setSelectedVariation(parseInt(val))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר וריאציה" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-auto">
                            <SelectItem value="-1">מוצר בסיסי - {selectedProduct.price_with_vat}₪</SelectItem>
                            {selectedProduct.variations.map((variation, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {variation.name} - {variation.price_with_vat}₪
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <label className="block text-sm font-medium">כמות:</label>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="mx-1 w-16">
                          <Input
                            type="number"
                            min="1"
                            value={quantityToAdd}
                            onChange={handleQuantityInput}
                            className="text-center"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>
                        ביטול
                      </Button>
                      <Button type="button" onClick={() => addProductToOrder()}>
                        הוסף להזמנה
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 h-[400px]">
                    <div className="grid grid-cols-1 gap-2 p-1">
                      {filteredProducts.length === 0 ? (
                        <div className="text-center p-6 text-gray-500">
                          לא נמצאו מוצרים מתאימים לחיפוש
                        </div>
                      ) : (
                        filteredProducts.map((product) => (
                          <Card
                            key={product.id}
                            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleProductSelect(product)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">
                                  {getCategoryName(product.category_id)}
                                  {product.variations?.length > 0 && (
                                    <Badge variant="outline" className="mr-2">
                                      {product.variations.length} וריאציות
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="font-medium">₪{product.price_with_vat}</div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <CommandDialog open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
            <CommandInput 
              placeholder="חפש לקוח לפי שם או טלפון..." 
              value={customerSearchQuery}
              onValueChange={setCustomerSearchQuery}
            />
            <CommandList>
              <CommandEmpty>לא נמצאו לקוחות</CommandEmpty>
              <CommandGroup heading="לקוחות">
                {filteredCustomers.map(customer => (
                  <CommandItem 
                    key={customer.id}
                    onSelect={() => selectCustomer(customer)}
                    className="flex items-center"
                  >
                    <User className="w-4 h-4 ml-2" />
                    <span>{customer.name}</span>
                    {customer.phone && <span className="text-gray-500 mr-2">({customer.phone})</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>

          {/* Dialog ליצירת חשבונית */}
          <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>יצירת חשבונית עבור הזמנה #{selectedOrderForInvoice?.id.slice(-8)}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {selectedOrderForInvoice && (
                  <>
                    <p className="mb-4">
                      האם ברצונך ליצור חשבונית עבור הזמנה #{selectedOrderForInvoice.id.slice(-8)}?
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      פרטים:
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1 mb-4">
                      <li>לקוח: {selectedOrderForInvoice.customer_name}</li>
                      <li>תאריך: {new Date(selectedOrderForInvoice.order_date).toLocaleDateString('he-IL')}</li>
                      <li>סכום: ₪{selectedOrderForInvoice.total_with_vat.toFixed(2)}</li>
                      <li>מס׳ פריטים: {selectedOrderForInvoice.items.length}</li>
                    </ul>
                    <p className="text-sm text-gray-500">
                      החשבונית תיווצר במערכת iCount ותקושר להזמנה זו.
                    </p>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>ביטול</Button>
                <Button 
                  onClick={() => createOrderInvoice(selectedOrderForInvoice)}
                  disabled={isCreatingInvoice || !selectedOrderForInvoice}
                >
                  {isCreatingInvoice ? 'יוצר חשבונית...' : 'צור חשבונית'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
