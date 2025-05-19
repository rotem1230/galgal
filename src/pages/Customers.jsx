import React, { useState, useEffect } from "react";
import { Customer } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, AlertCircle } from "lucide-react";
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase-config";
import { toast } from "sonner";

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
  const [newUserPassword, setNewUserPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
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
      toast.error("שגיאה בטעינת הנתונים");
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
      toast.error("שגיאה בטעינת הלקוחות");
    } finally {
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
      toast.success("המחיר המותאם נשמר בהצלחה");
    } catch (error) {
      console.error("Error saving custom price:", error);
      toast.error("שגיאה בשמירת המחיר המותאם");
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
        toast.success("המחיר המותאם נמחק");
      }
    } catch (error) {
      console.error("Error deleting custom price:", error);
      toast.error("שגיאה במחיקת המחיר המותאם");
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

  const resetFormAndCloseDialog = () => {
    setIsAddOpen(false);
    setEditingCustomer(null);
    setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" });
    setNewUserPassword("");
    setFormError(null);
    setIsSaving(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);
    let customerAuthUid = null;

    try {
      if (!editingCustomer && newCustomer.email && newUserPassword) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, newCustomer.email, newUserPassword);
          customerAuthUid = userCredential.user.uid;
          console.log("Firebase user created with UID:", customerAuthUid);
          toast.info(`משתמש Firebase נוצר עבור ${newCustomer.email}`);
        } catch (error) {
          console.error("Firebase user creation failed:", error);
          let firebaseErrorMsg = "שגיאה ביצירת משתמש התחברות.";
          if (error.code === 'auth/email-already-in-use') {
            firebaseErrorMsg = "כתובת האימייל כבר קיימת במערכת ההתחברות.";
          } else if (error.code === 'auth/invalid-email') {
            firebaseErrorMsg = "כתובת האימייל אינה תקינה.";
          } else if (error.code === 'auth/weak-password') {
            firebaseErrorMsg = "הסיסמה חלשה מדי. נדרשים לפחות 6 תווים.";
          }
          setFormError(firebaseErrorMsg + " הלקוח לא נשמר.");
          setIsSaving(false);
          return;
        }
      }

      const customerDataToSave = { ...newCustomer };
      if (customerAuthUid) { customerDataToSave.authUid = customerAuthUid; }
      
      if (editingCustomer) {
        await Customer.update(editingCustomer.id, customerDataToSave);
        toast.success(`לקוח '${customerDataToSave.name}' עודכן בהצלחה!`);
      } else {
        await Customer.create(customerDataToSave);
         toast.success(`לקוח '${customerDataToSave.name}' נוצר בהצלחה!`);
      }

      resetFormAndCloseDialog();
      await loadCustomers();

    } catch (error) {
      console.error("Error saving customer:", error);
      setFormError("שגיאה בשמירת הלקוח. בדוק את הקונסול לפרטים.");
      toast.error("שגיאה בשמירת הלקוח");
      setIsSaving(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({ 
      name: customer.name || "", 
      phone: customer.phone || "", 
      email: customer.email || "", 
      address: customer.address || "", 
      notes: customer.notes || ""
    });
    setNewUserPassword("");
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleDelete = async (customerId, customerName) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הלקוח '${customerName}'?`)) {
        return;
    }
    try {
      await Customer.delete(customerId);
      toast.success(`לקוח '${customerName}' נמחק בהצלחה`);
      await loadCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("שגיאה במחיקת הלקוח");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <Button onClick={() => {
          setEditingCustomer(null);
          setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" });
          setNewUserPassword("");
          setFormError(null);
          setIsAddOpen(true);
        }}>
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
            <Card key={customer.id} className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{customer.name}</h3>
                    {customer.phone && (
                      <p className="flex items-center text-gray-600 mt-2">
                        <Phone className="w-4 h-4 ml-2" /> {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="flex items-center text-gray-600 mt-1">
                        <Mail className="w-4 h-4 ml-2" /> {customer.email}
                      </p>
                    )}
                    {customer.address && (
                      <p className="flex items-center text-gray-600 mt-1">
                        <MapPin className="w-4 h-4 ml-2" /> {customer.address}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(customer)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(customer.id, customer.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {customer.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">הערות:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
              </div>
              <Button 
                variant="secondary" 
                className="w-full mt-auto" 
                onClick={() => handleCustomPricing(customer)}
              >
                תמחור מותאם אישית
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={resetFormAndCloseDialog}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "עריכת לקוח" : "הוספת לקוח חדש"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right col-span-1">שם</Label>
                <Input 
                  id="name" 
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="col-span-3" 
                  required 
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right col-span-1">טלפון</Label>
                <Input 
                  id="phone" 
                  value={newCustomer.phone} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="col-span-3" 
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right col-span-1">אימייל</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} 
                  className="col-span-3" 
                  disabled={isSaving}
                />
              </div>
              {!editingCustomer && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right col-span-1">סיסמה</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="(אופציונלי ליצירת התחברות)"
                    value={newUserPassword} 
                    onChange={(e) => setNewUserPassword(e.target.value)} 
                    className="col-span-3" 
                    disabled={isSaving}
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right col-span-1">כתובת</Label>
                <Input 
                  id="address" 
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                  className="col-span-3" 
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right col-span-1">הערות</Label>
                <Textarea 
                  id="notes" 
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} 
                  className="col-span-3" 
                  disabled={isSaving}
                />
              </div>
              {formError && (
                <div className="col-span-4 flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4 ml-2 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetFormAndCloseDialog} disabled={isSaving}>ביטול</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "שומר..." : (editingCustomer ? "שמור שינויים" : "צור לקוח")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomPricingOpen} onOpenChange={setIsCustomPricingOpen}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>תמחור מותאם אישית עבור: {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="חיפוש מוצר..."
              value={customSearchQuery}
              onChange={(e) => setCustomSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <ScrollArea className="h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead>מחיר רגיל (כולל מע"מ)</TableHead>
                  <TableHead>מחיר מותאם (כולל מע"מ)</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.flatMap(product => 
                   product.variations && product.variations.length > 0
                   ? product.variations.map((variation, index) => ({ ...product, variation, index }))
                   : [{ ...product, variation: null, index: -1 }]
                 ).map(item => {
                   const customPriceInfo = getCustomPrice(item.id, item.index);
                   const displayName = item.variation ? `${item.name} - ${item.variation.name}` : item.name;
                   const basePrice = item.variation ? item.variation.price_with_vat : item.price_with_vat;
                   return (
                     <TableRow key={`${item.id}-${item.index}`}>
                       <TableCell>{displayName}</TableCell>
                       <TableCell>{basePrice?.toFixed(2)} ₪</TableCell>
                       <TableCell>
                         <Input 
                           type="number" 
                           step="0.01"
                           defaultValue={customPriceInfo?.price_with_vat?.toFixed(2)}
                           placeholder="הזן מחיר"
                           className="w-32"
                           onBlur={(e) => saveCustomPrice(item, e.target.value, item.index)}
                         />
                       </TableCell>
                       <TableCell>
                         {customPriceInfo && (
                           <Button variant="destructive" size="sm" onClick={() => deleteCustomPrice(item.id, item.index)}>
                             מחק התאמה
                           </Button>
                         )}
                       </TableCell>
                     </TableRow>
                   );
                 })
                }
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsCustomPricingOpen(false)}>סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
