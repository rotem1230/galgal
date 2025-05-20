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
import { Package, Plus, Pencil, Trash2, X, Upload, AlertTriangle } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { parse } from 'papaparse';

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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStatus, setImportStatus] = useState({ total: 0, added: 0, skipped: 0, categoryMismatch: 0, inProgress: false });
  const [csvFile, setCsvFile] = useState(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const processProductVariations = (product) => {
    const variations = [];
    
    // אם אין וריאציות בכלל
    if (!product.variations) {
      return variations;
    }
    
    try {
      // אם יש וריאציות בפורמט טקסט מופרד בפסיקים
      if (typeof product.variations === 'string') {
        const variationNames = product.variations.split(',')
          .map(v => v.trim())
          .filter(v => v);
          
        // עבור כל וריאציה, יצור אובייקט מלא
        variationNames.forEach(name => {
          // חפש שדות עם פורמט שם_וריאציה_price_before_vat או שם_וריאציה_price_with_vat
          // אם לא קיימים, השתמש במחירי המוצר הראשי
          const variationPriceBeforeVat = 
            product[`${name}_price_before_vat`] !== undefined
            ? parseFloat(product[`${name}_price_before_vat`])
            : parseFloat(product.price_before_vat) || 0;
            
          const variationPriceWithVat = 
            product[`${name}_price_with_vat`] !== undefined
            ? parseFloat(product[`${name}_price_with_vat`])
            : parseFloat(product.price_with_vat) || 0;
            
          variations.push({
            name: name,
            price_before_vat: variationPriceBeforeVat,
            price_with_vat: variationPriceWithVat
          });
        });
      }
      // אם הוריאציות הן כבר במבנה מערך (לא סביר מ-CSV אבל למקרה שהן מגיעות כך)
      else if (Array.isArray(product.variations)) {
        product.variations.forEach(variation => {
          // וודא שהוריאציה היא אובייקט ויש לה שם
          if (typeof variation === 'object' && variation.name) {
            variations.push({
              name: variation.name,
              price_before_vat: parseFloat(variation.price_before_vat) || 0,
              price_with_vat: parseFloat(variation.price_with_vat) || 0
            });
          } else if (typeof variation === 'string') {
            // אם הוריאציה היא מחרוזת בלבד, הוסף אותה עם המחירים של המוצר הראשי
            variations.push({
              name: variation,
              price_before_vat: parseFloat(product.price_before_vat) || 0,
              price_with_vat: parseFloat(product.price_with_vat) || 0
            });
          }
        });
      }
    } catch (e) {
      console.error(`שגיאה בעיבוד וריאציות למוצר:`, e.message);
    }
    
    return variations;
  };

  const deleteAllProducts = async () => {
    setIsDeletingAll(true);
    try {
      // קבל את כל המוצרים
      const productsData = await Product.list();
      
      // מחק כל מוצר ברשימה
      for (const product of productsData) {
        await Product.delete(product.id);
      }
      
      // רענן את הדף
      await loadData();
      
      // סגור את דיאלוג האישור
      setIsDeleteAllOpen(false);
    } catch (error) {
      console.error("שגיאה במחיקת כל המוצרים:", error);
      setDeleteError(`שגיאה במחיקת כל המוצרים: ${error.message}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const importProductsFromCsv = async () => {
    if (!csvFile) {
      setDeleteError('בחר קובץ CSV תחילה');
      return;
    }

    setImportStatus(prev => ({ ...prev, inProgress: true }));
    setDeleteError('');

    try {
      // קרא את תוכן הקובץ
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        const csvText = event.target.result;
        
        // פרסר את תוכן ה-CSV
        const { data, errors } = parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        if (errors.length > 0) {
          setDeleteError(`שגיאה בפענוח הקובץ: ${errors[0].message}`);
          setImportStatus(prev => ({ ...prev, inProgress: false }));
          return;
        }

        // קבל את המוצרים הקיימים
        const existingProductsSnapshot = await Product.list();
        const existingProductsMap = new Map();
        
        existingProductsSnapshot.forEach(product => {
          existingProductsMap.set(product.name, product);
        });
        
        // קבל את הקטגוריות הקיימות לצורך מיפוי שמות לID
        const categoriesSnapshot = await Category.list();
        const categoriesMap = new Map();
        
        categoriesSnapshot.forEach(category => {
          categoriesMap.set(category.name, category.id);
        });
        
        let addedCount = 0;
        let skippedCount = 0;
        let categoryMismatchCount = 0;
        
        // עבור על כל המוצרים בקובץ
        for (const productData of data) {
          // וודא שיש שם למוצר
          if (!productData.name) {
            skippedCount++;
            continue;
          }
          
          // מוצר קיים כבר?
          const existingProduct = existingProductsMap.get(productData.name);
          
          // טיפול בקטגוריה - תן עדיפות ל-ID אם קיים, אחרת חפש לפי שם
          let categoryId = null;
          
          // אם יש category_id ישיר
          if (productData.category_id) {
            // בדוק אם ה-ID קיים במערכת
            const categoryExists = Array.from(categoriesMap.values()).includes(productData.category_id);
            if (categoryExists) {
              categoryId = productData.category_id;
            } else {
              console.log(`אזהרה: קטגוריה עם ID '${productData.category_id}' למוצר '${productData.name}' לא נמצאה`);
              categoryMismatchCount++;
            }
          } 
          // אם אין ID תקף אבל יש שם קטגוריה, נסה למצוא לפי שם
          else if (productData.category_name) {
            categoryId = categoriesMap.get(productData.category_name);
            if (!categoryId) {
              console.log(`אזהרה: קטגוריה '${productData.category_name}' למוצר '${productData.name}' לא נמצאה`);
              categoryMismatchCount++;
            }
          }
          // תמיכה לאחורה בפורמט הישן שהשתמש ב-'category' 
          else if (productData.category) {
            categoryId = categoriesMap.get(productData.category);
            if (!categoryId) {
              console.log(`אזהרה: קטגוריה '${productData.category}' למוצר '${productData.name}' לא נמצאה`);
              categoryMismatchCount++;
            }
          }
          
          // טיפול בוריאציות
          const variations = processProductVariations(productData);
          
          // הכן את אובייקט המוצר לשמירה
          const productToSave = {
            name: productData.name,
            category_id: categoryId,
            image_url: productData.image_url || '',
            price_before_vat: parseFloat(productData.price_before_vat) || 0,
            price_with_vat: parseFloat(productData.price_with_vat) || 0,
            variations: variations
          };
          
          if (existingProduct) {
            skippedCount++;
          } else {
            // הוסף מוצר חדש
            await Product.create(productToSave);
            addedCount++;
          }
        }
        
        // עדכן את מצב הייבוא
        setImportStatus({
          total: data.length,
          added: addedCount,
          skipped: skippedCount,
          categoryMismatch: categoryMismatchCount,
          inProgress: false
        });
        
        // רענן את הנתונים
        await loadData();
        
        // סגור את החלון לאחר 3 שניות אם הייבוא הצליח
        setTimeout(() => {
          if (addedCount > 0) {
            setIsImportOpen(false);
          }
        }, 3000);
        
      };
      
      fileReader.readAsText(csvFile);
      
    } catch (error) {
      console.error("שגיאה בייבוא מוצרים:", error);
      setDeleteError(`שגיאה בייבוא מוצרים: ${error.message}`);
      setImportStatus(prev => ({ ...prev, inProgress: false }));
    }
  };

  // סינון המוצרים לפי קטגוריה וחיפוש
  const filteredProducts = products
    .filter(p => selectedCategory === "all" || p.category_id === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    // מיון המוצרים כך שמוצרים עם תמונות יופיעו ראשונים
    .sort((a, b) => {
      // בדיקה האם יש למוצר תמונה תקינה
      const aHasImage = !!a.image_url;
      const bHasImage = !!b.image_url;
      
      // מיון - מוצרים עם תמונות קודם, ואז מוצרים ללא תמונות
      if (aHasImage && !bHasImage) return -1;  // a יוצג קודם
      if (!aHasImage && bHasImage) return 1;   // b יוצג קודם
      
      // אם לשניהם יש או אין תמונה, שמור על הסדר הרגיל
      return 0;
    });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">מוצרים</h1>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteAllOpen(true)}
              title="מחק את כל המוצרים"
            >
              <AlertTriangle className="w-4 h-4 ml-2" />
              מחק הכל
            </Button>
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
            <Button onClick={() => setIsImportOpen(true)} variant="outline">
              <Upload className="w-4 h-4 ml-2" />
              ייבוא מוצרים
            </Button>
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
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.style.backgroundColor = '#f9fafb';
                          const textDiv = document.createElement('div');
                          textDiv.className = 'w-full h-full flex items-center justify-center';
                          
                          const packageIcon = document.createElement('div');
                          packageIcon.className = 'flex flex-col items-center';
                          
                          const iconDiv = document.createElement('div');
                          iconDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>';
                          
                          const titleDiv = document.createElement('div');
                          titleDiv.className = 'text-gray-500 font-medium text-sm mt-2';
                          titleDiv.innerText = product.name;
                          
                          packageIcon.appendChild(iconDiv);
                          packageIcon.appendChild(titleDiv);
                          textDiv.appendChild(packageIcon);
                          e.target.parentNode.appendChild(textDiv);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <Package className="w-12 h-12 text-gray-300" />
                          <span className="text-gray-500 font-medium text-sm mt-2">{product.name}</span>
                        </div>
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

        {/* דיאלוג אישור מחיקת כל המוצרים */}
        <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את כל המוצרים?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את כל המוצרים במערכת ואינה ניתנת לביטול.
                מומלץ לגבות את הנתונים לפני ביצוע פעולה זו.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction 
                onClick={deleteAllProducts} 
                className="bg-red-500 hover:bg-red-600"
                disabled={isDeletingAll}
              >
                {isDeletingAll ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-b-transparent rounded-full ml-2"></div>
                    מוחק...
                  </div>
                ) : "מחק את כל המוצרים"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ייבוא מוצרים מקובץ CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">קובץ CSV</label>
                <Input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvFileChange}
                  disabled={importStatus.inProgress}
                />
                <p className="text-sm text-gray-500 mt-2">
                  הקובץ צריך להכיל את העמודות: name, category_id, category_name, image_url, price_before_vat, price_with_vat, variations
                </p>
              </div>
              
              {deleteError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {deleteError}
                </div>
              )}
              
              {!importStatus.inProgress && importStatus.total > 0 && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  <p>הייבוא הושלם בהצלחה!</p>
                  <p>סה"כ: {importStatus.total}</p>
                  <p>נוספו: {importStatus.added}</p>
                  <p>דולגו: {importStatus.skipped}</p>
                  {importStatus.categoryMismatch > 0 && (
                    <p>שגיאות קטגוריה: {importStatus.categoryMismatch}</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={importProductsFromCsv}
                disabled={!csvFile || importStatus.inProgress}
              >
                {importStatus.inProgress ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-b-transparent rounded-full ml-2"></div>
                    מייבא...
                  </div>
                ) : "התחל ייבוא"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
