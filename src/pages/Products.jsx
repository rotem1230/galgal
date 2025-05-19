import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

const VAT_RATE = 0.18;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price_before_vat: 0,
    price_with_vat: 0,
    image_url: "",
    category_id: "",
    variations: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    category_id: "",
    price_with_vat: "",
    price_before_vat: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isLoading) setIsLoading(true);
    try {
      const productsData = await Product.list();
      const categoriesData = await Category.list();
      
      setProducts(productsData);
      setCategories(categoriesData);
      setDeleteError(""); 
    } catch (error) {
      console.error("Error loading data:", error);
      if (error.response?.status === 429) {
        setDeleteError("נתקלנו במגבלת קצב בקשות. אנא המתן מעט וטען את הדף מחדש.");
      } else {
        setDeleteError(`שגיאה בטעינת נתונים: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createRollingPapersProducts = async () => {
    try {
      setIsLoading(true);
      setDeleteError("");
      
      const categoriesData = await Category.list();
      const rollingPapersCategory = categoriesData.find(cat => cat.name === "ניירות גלגול");
      
      if (!rollingPapersCategory) {
        setDeleteError("קטגוריית 'ניירות גלגול' לא נמצאה. אנא צור קטגוריה זו תחילה.");
        setIsLoading(false);
        return;
      }

      const productsWithVariations = [
        {
          name: "נייר גיזה",
          variations: ["אדום", "כחול", "ירוק"]
        },
        {
          name: "נייר ביסטה",
          variations: ["אדום", "כחול", "ירוק בהיר", "ירוק כהה"]
        },
        {
          name: "ריזה",
          variations: ["כחול", "אדום", "אפור"]
        },
        {
          name: "נייר גיזה מגנט",
          variations: ["ירוק", "אדום", "כחול"]
        }
      ];

      const products = [
        "גיזה גדול לבן",
        "גיזה גדול חום",
        "גיזה מדיום",
        "נייר ביסטה גדול",
        "נייר ביסטה מדיום",
        "אוסיבי גדול",
        "אוסיבי גדול חום",
        "אוסיבי מדיום",
        "אוסיבי מדיום חום",
        "אוסיבי שמאל",
        "אוסיבי מדיום ללא",
        "אוסיבי שמאל ללא",
        "אסאמקיי גדול",
        "אסאמקיי בינוני",
        "אסאמקיי שמאל",
        "סמוקינג בראון",
        "סמוקינג מאסטר",
        "ריליף גדול לבן",
        "ריליף גדול חום",
        "ריליף מדיום לבן",
        "ריליף מדיום חום",
        "ריליף שמאל לבן",
        "ריליף שמאל חום",
        "פאי פאי גדול",
        "פאי פאי גדול ללא",
        "פאי פאי מדיום",
        "רואו שמאל",
        "רואו מדיום",
        "רואו קינג סייז",
        "רואו שמאל ללא",
        "רואו מדיום ללא",
        "רואו קינג סייז ללא",
        "פילטר רחב רואו",
        "פילטר צר רואו",
        "פילטר צר שחור רואו",
        "פילטר 100 פחיות רואו",
        "פילטר 200 בשקית רואו",
        "פילטר 5.3 רואו",
        "פילטר רואו פרפקטו",
        "פילטר רואו מאסטרו",
        "רואו שחור מדיום",
        "רואו ארטסנו אורגני",
        "רואו ארטסנו קלאסיק",
        "רואו מגירה גדול",
        "נייר גיזה ירוק קובייה",
        "אלמנטס גדול",
        "אלמנטס מדיום",
        "אלמנטס פילטר רחב",
        "אלמנטס שמאל ללא",
        "אלמנטס גדול ללא",
        "אלמנטס ורוד גדול ללא",
        "אלמנטס ירוק גדול",
        "אלמנטס ירוק גדול ללא",
        "אלמנטס מאסטרו",
        "אלמנטס פרפקטו",
        "קומבי גדול ללא",
        "קומבי גדול לבן",
        "קומבי גדול חום",
        "קומבי מדיום חום",
        "קומבי מדיום לבן",
        "פילטרים רחבים קומבי",
        "סנייל ורוד",
        "סנייל כחול"
      ];
      
      for (const productName of products) {
        const randomPriceWithVat = Math.floor(Math.random() * 45) + 5;
        const priceBeforeVat = Math.round((randomPriceWithVat / 1.18) * 100) / 100;
        
        await Product.create({
          name: productName,
          category_id: rollingPapersCategory.id,
          price_with_vat: randomPriceWithVat,
          price_before_vat: priceBeforeVat,
          variations: []
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      for (const product of productsWithVariations) {
        const baseRandomPriceWithVat = Math.floor(Math.random() * 45) + 5;
        const baseBeforeVat = Math.round((baseRandomPriceWithVat / 1.18) * 100) / 100;
        
        const variations = product.variations.map(varName => {
          const varPriceWithVat = baseRandomPriceWithVat + Math.floor(Math.random() * 5);
          const varPriceBeforeVat = Math.round((varPriceWithVat / 1.18) * 100) / 100;
          
          return {
            name: varName,
            price_with_vat: varPriceWithVat,
            price_before_vat: varPriceBeforeVat
          };
        });
        
        await Product.create({
          name: product.name,
          category_id: rollingPapersCategory.id,
          price_with_vat: baseRandomPriceWithVat,
          price_before_vat: baseBeforeVat,
          variations: variations
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await loadData();
      
    } catch (error) {
      console.error("Error creating rolling papers products:", error);
      if (error.response?.status === 429) {
        setDeleteError("נתקלנו במגבלת קצב בקשות. אנא המתן מעט ונסה שוב.");
      } else {
        setDeleteError(`שגיאה ביצירת מוצרים: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setNewProduct({ ...newProduct, image_url: file_url });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsUploading(false);
  };

  const handlePriceChange = (priceWithVAT) => {
    const price = parseFloat(priceWithVAT) || 0;
    const priceBeforeVAT = Math.round((price / (1 + VAT_RATE)) * 100) / 100;
    setNewProduct({
      ...newProduct,
      price_before_vat: priceBeforeVAT,
      price_with_vat: price
    });
  };

  const handleAddVariation = () => {
    setNewProduct({
      ...newProduct,
      variations: [
        ...newProduct.variations,
        { name: "", price_before_vat: 0, price_with_vat: 0 }
      ]
    });
  };

  const handleVariationChange = (index, field, value) => {
    const variations = [...newProduct.variations];
    if (field === "price_with_vat") {
      const price = parseFloat(value) || 0;
      const priceBeforeVAT = Math.round((price / (1 + VAT_RATE)) * 100) / 100;
      variations[index] = {
        ...variations[index],
        price_before_vat: priceBeforeVAT,
        price_with_vat: price
      };
    } else {
      variations[index] = {
        ...variations[index],
        [field]: value
      };
    }
    setNewProduct({ ...newProduct, variations });
  };

  const removeVariation = (index) => {
    const variations = newProduct.variations.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, variations });
  };

  const handleSubmit = async () => {
    if (editingProduct) {
      await Product.update(editingProduct.id, newProduct);
    } else {
      await Product.create(newProduct);
    }
    setIsAddOpen(false);
    setEditingProduct(null);
    setNewProduct({
      name: "",
      price_before_vat: 0,
      price_with_vat: 0,
      image_url: "",
      category_id: "",
      variations: []
    });
    loadData();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price_before_vat: product.price_before_vat,
      price_with_vat: product.price_with_vat,
      image_url: product.image_url,
      category_id: product.category_id,
      variations: product.variations || []
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (productId) => {
    try {
      await Product.delete(productId);
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      await loadData();
    }
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    const allIds = filteredProducts.map(product => product.id);
    setSelectedProducts(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  const handleBulkEdit = async () => {
    setIsBulkEditing(true);
    try {
      for (const productId of selectedProducts) {
        const updateData = {};
        if (bulkEditData.category_id) {
          updateData.category_id = bulkEditData.category_id;
        }
        if (bulkEditData.price_with_vat) {
          const priceWithVat = parseFloat(bulkEditData.price_with_vat);
          updateData.price_with_vat = priceWithVat;
          updateData.price_before_vat = Math.round((priceWithVat / 1.18) * 100) / 100;
        }

        await Product.update(productId, updateData);
      }
      setSelectedProducts(new Set());
      setBulkEditData({
        category_id: "",
        price_with_vat: "",
        price_before_vat: ""
      });
      await loadData();
    } catch (error) {
      console.error("Error updating products:", error);
      setDeleteError(`שגיאה בעדכון מוצרים: ${error.message}`);
    } finally {
      setIsBulkEditing(false);
    }
  };

  const filteredProducts = products
    .filter(p => selectedCategory === "all" || p.category_id === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">מוצרים</h1>
          <div className="flex gap-2">
            {selectedProducts.size > 0 && (
              <Button 
                variant="outline"
                onClick={() => setIsBulkEditing(true)}
                disabled={isBulkEditing}
              >
                <Pencil className="w-4 h-4 ml-2" />
                ערוך {selectedProducts.size} מוצרים
              </Button>
            )}
            <Link to="/BulkProductImport">
              <Button variant="outline" className="flex items-center">
                <Upload className="w-4 h-4 ml-2" />
                <span>העלאת מוצרים מתמונות</span>
              </Button>
            </Link>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              מוצר חדש
            </Button>
          </div>
        </div>

        {deleteError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {deleteError}
            {deleteError.includes("מגבלת קצב") && (
              <Button 
                variant="link" 
                onClick={() => window.location.reload()}
                className="mr-2"
              >
                טען מחדש
              </Button>
            )}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p>טוען נתונים...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="חפש מוצר..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="בחר קטגוריה" />
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
              {filteredProducts.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    בחר הכל
                  </Button>
                  {selectedProducts.size > 0 && (
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      נקה בחירה
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                  </div>
                  <div className="aspect-square relative">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {categories.find(c => c.id === product.category_id)?.name}
                        </p>
                        <p className="mt-2 font-medium">
                          ₪{product.price_with_vat} כולל מע"מ
                        </p>
                        {product.variations?.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            {product.variations.length} וריאציות
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-xl" aria-describedby="product-dialog-description">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "עריכת מוצר" : "הוספת מוצר חדש"}
              </DialogTitle>
              <p id="product-dialog-description" className="text-sm text-gray-500">
                הזן את פרטי המוצר בטופס זה
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">שם המוצר</label>
                <Input
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="הכנס שם מוצר"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">קטגוריה</label>
                <Select
                  value={newProduct.category_id}
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">מחיר כולל מע"מ</label>
                <Input
                  type="number"
                  value={newProduct.price_with_vat}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="הכנס מחיר"
                />
                <p className="text-sm text-gray-500 mt-1">
                  מחיר לפני מע"מ: ₪{newProduct.price_before_vat}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">תמונה</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">וריאציות</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariation}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף וריאציה
                  </Button>
                </div>
                <div className="space-y-3">
                  {newProduct.variations.map((variation, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <Input
                        value={variation.name}
                        onChange={(e) =>
                          handleVariationChange(index, "name", e.target.value)
                        }
                        placeholder="שם הוריאציה"
                      />
                      <Input
                        type="number"
                        value={variation.price_with_vat}
                        onChange={(e) =>
                          handleVariationChange(index, "price_with_vat", e.target.value)
                        }
                        placeholder="מחיר כולל מע״מ"
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariation(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={!newProduct.name || !newProduct.category_id || isUploading}
              >
                {editingProduct ? "שמור שינויים" : "צור מוצר"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkEditing} onOpenChange={setIsBulkEditing}>
          <DialogContent className="max-w-xl" aria-describedby="bulk-edit-dialog-description">
            <DialogHeader>
              <DialogTitle>עריכת {selectedProducts.size} מוצרים</DialogTitle>
              <p id="bulk-edit-dialog-description" className="text-sm text-gray-500">
                עריכה גורפת של מספר מוצרים במקביל
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">קטגוריה</label>
                <Select
                  value={bulkEditData.category_id}
                  onValueChange={(value) =>
                    setBulkEditData({ ...bulkEditData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">השאר ריק אם אינך רוצה לשנות את הקטגוריה</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">מחיר כולל מע"מ</label>
                <Input
                  type="number"
                  value={bulkEditData.price_with_vat}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, price_with_vat: e.target.value })
                  }
                  placeholder="הכנס מחיר"
                />
                <p className="text-sm text-gray-500 mt-1">השאר ריק אם אינך רוצה לשנות את המחיר</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleBulkEdit}
                disabled={!bulkEditData.category_id && !bulkEditData.price_with_vat}
              >
                עדכן מוצרים
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
