
import React, { useState, useEffect } from "react";
import { Customer } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { CustomerPricing } from "@/api/entities";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomPricingOpen, setIsCustomPricingOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customerPricing, setCustomerPricing] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customSearchQuery, setCustomSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [customersData, productsData, categoriesData, pricingData] = await Promise.all([
        Customer.list(),
        Product.list(),
        Category.list(),
        CustomerPricing.list()
      ]);
      
      setCustomers(customersData);
      setProducts(productsData);
      setCategories(categoriesData);
      setCustomerPricing(pricingData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await Customer.list();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPricing = async (customer) => {
    setSelectedCustomer(customer);
    setIsCustomPricingOpen(true);
  };

  const saveCustomPrice = async (product, price, variationIndex = -1) => {
    try {
      const priceWithVat = parseFloat(price);
      if (isNaN(priceWithVat) || priceWithVat < 0) return;

      const priceBeforeVat = Math.round((priceWithVat / 1.18) * 100) / 100;
      
      const existingPricing = customerPricing.find(
        p => p.customer_id === selectedCustomer.id && 
            p.product_id === product.id && 
            p.variation_index === variationIndex
      );

      if (existingPricing) {
        await CustomerPricing.update(existingPricing.id, {
          price_before_vat: priceBeforeVat,
          price_with_vat: priceWithVat
        });
      } else {
        await CustomerPricing.create({
          customer_id: selectedCustomer.id,
          product_id: product.id,
          variation_index: variationIndex,
          price_before_vat: priceBeforeVat,
          price_with_vat: priceWithVat
        });
      }

      await loadData();
    } catch (error) {
      console.error("Error saving custom price:", error);
    }
  };

  const getCustomPrice = (productId, variationIndex = -1) => {
    return customerPricing.find(
      p => p.customer_id === selectedCustomer?.id && 
          p.product_id === productId &&
          p.variation_index === variationIndex
    );
  };

  const deleteCustomPrice = async (productId, variationIndex = -1) => {
    try {
      const pricing = customerPricing.find(
        p => p.customer_id === selectedCustomer.id && 
            p.product_id === productId &&
            p.variation_index === variationIndex
      );
      
      if (pricing) {
        await CustomerPricing.delete(pricing.id);
        await loadData();
      }
    } catch (error) {
      console.error("Error deleting custom price:", error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(customSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = async () => {
    try {
      if (editingCustomer) {
        await Customer.update(editingCustomer.id, newCustomer);
      } else {
        await Customer.create(newCustomer);
      }
      setIsAddOpen(false);
      setEditingCustomer(null);
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: ""
      });
      loadCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer(customer);
    setIsAddOpen(true);
  };

  const handleDelete = async (customerId) => {
    try {
      await Customer.delete(customerId);
      loadCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          לקוח חדש
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="חיפוש לקוח..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{customer.name}</h3>
                  {customer.phone && (
                    <p className="flex items-center text-gray-600 mt-2">
                      <Phone className="w-4 h-4 ml-2" />
                      {customer.phone}
                    </p>
                  )}
                  {customer.email && (
                    <p className="flex items-center text-gray-600 mt-1">
                      <Mail className="w-4 h-4 ml-2" />
                      {customer.email}
                    </p>
                  )}
                  {customer.address && (
                    <p className="flex items-center text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 ml-2" />
                      {customer.address}
                    </p>
                  )}
                  {customer.notes && (
                    <p className="mt-2 text-gray-600 text-sm">{customer.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCustomPricing(customer)}
                  >
                    מחירים מותאמים
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(customer)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "עריכת לקוח" : "הוספת לקוח חדש"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">שם</label>
              <Input
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                placeholder="הכנס שם"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">טלפון</label>
              <Input
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                placeholder="הכנס מספר טלפון"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">אימייל</label>
              <Input
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
                placeholder="הכנס כתובת אימייל"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">כתובת</label>
              <Input
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
                placeholder="הכנס כתובת"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <Textarea
                value={newCustomer.notes}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, notes: e.target.value })
                }
                placeholder="הכנס הערות"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!newCustomer.name}>
              {editingCustomer ? "שמור שינויים" : "צור לקוח"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomPricingOpen} onOpenChange={setIsCustomPricingOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>מחירים מותאמים ללקוח - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="חיפוש מוצרים..."
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="כל הקטגוריות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מוצר</TableHead>
                    <TableHead>קטגוריה</TableHead>
                    <TableHead>מחיר רגיל</TableHead>
                    <TableHead>מחיר מותאם</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.category_id);
                    const baseCustomPrice = getCustomPrice(product.id);
                    
                    return (
                      <React.Fragment key={product.id}>
                        <TableRow>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{category?.name}</TableCell>
                          <TableCell>₪{product.price_with_vat}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="הזן מחיר כולל מע״מ"
                              defaultValue={baseCustomPrice?.price_with_vat || ""}
                              onChange={(e) => saveCustomPrice(product, e.target.value)}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            {baseCustomPrice && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCustomPrice(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {product.variations?.map((variation, index) => (
                          <TableRow key={`${product.id}-${index}`} className="bg-gray-50">
                            <TableCell className="pl-8">
                              {variation.name}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell>₪{variation.price_with_vat}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="הזן מחיר כולל מע״מ"
                                defaultValue={getCustomPrice(product.id, index)?.price_with_vat || ""}
                                onChange={(e) => saveCustomPrice(product, e.target.value, index)}
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              {getCustomPrice(product.id, index) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCustomPrice(product.id, index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
