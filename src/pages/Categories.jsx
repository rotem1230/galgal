import React, { useState, useEffect } from "react";
import { Category } from "@/api/entities";
import { Product } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Package, ImageIcon, ArrowDownUp, Upload, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UploadFile } from "@/api/integrations";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { parse } from 'papaparse';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsCount, setProductsCount] = useState({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", image_url: "", is_active: true });
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [currentGeneratingCategory, setCurrentGeneratingCategory] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStatus, setImportStatus] = useState({ total: 0, added: 0, skipped: 0, inProgress: false });
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isLoading) setIsLoading(true);
    try {
      const cats = await Category.list();
      setCategories(cats);
      
      const prods = await Product.list();
      setProducts(prods);
      
      const counts = {};
      prods.forEach(product => {
        counts[product.category_id] = (counts[product.category_id] || 0) + 1;
      });
      setProductsCount(counts);
      
      setGenerationError(""); 
    } catch (error) {
      console.error("Error loading data:", error);
      if (error.response?.status === 429) {
        setGenerationError("נתקלנו במגבלת קצב בקשות. אנא המתן מעט וטען את הדף מחדש.");
      } else {
        setGenerationError(`שגיאה בטעינת נתונים: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateExistingCategoryImages = async () => {
    setIsLoading(true);
    try {
      const categoryImages = {
        "מכונות גלגול": "https://images.unsplash.com/photo-1571160240724-2911474ca6d0?q=80&w=600&auto=format&fit=crop",
        "מאפרות": "https://images.unsplash.com/photo-1519420573924-65fcd45245f8?q=80&w=600&auto=format&fit=crop",
        "אגרטלים": "https://images.unsplash.com/photo-1572635196243-4dd75fbdbd7f?q=80&w=600&auto=format&fit=crop",
        "ציוד נלווה": "https://images.unsplash.com/photo-1531071222688-3cf5355bb1b6?q=80&w=600&auto=format&fit=crop",
        "גריינדרים": "https://images.unsplash.com/photo-1578996953841-b187dbe4bc8a?q=80&w=600&auto=format&fit=crop",
        "פילטרים": "https://images.unsplash.com/photo-1559825481-12a05cc00344?q=80&w=600&auto=format&fit=crop",
        "ספוג": "https://images.unsplash.com/photo-1543163914-11c241038d6a?q=80&w=600&auto=format&fit=crop",
        "מוצרי סלולר": "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=600&auto=format&fit=crop",
        "אקססוריז": "https://images.unsplash.com/photo-1625917656283-ea3fae3186a8?q=80&w=600&auto=format&fit=crop",
        "אמצעי מניעה": "https://images.unsplash.com/photo-1578167732217-2c789caa8dcf?q=80&w=600&auto=format&fit=crop"
      };

      for (const category of categories) {
        if (categoryImages[category.name]) {
          await Category.update(category.id, {
            image_url: categoryImages[category.name]
          });
        }
      }
      
      await loadData();
      
    } catch (error) {
      console.error("Error updating category images:", error);
      setGenerationError(`שגיאה בעדכון תמונות: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) return;
    
    setIsBulkDeleting(true);
    try {
      for (const categoryId of selectedCategories) {
        await Category.delete(categoryId);
      }
      setSelectedCategories(new Set());
      await loadData();
    } catch (error) {
      console.error("Error deleting categories:", error);
      setGenerationError(`שגיאה במחיקת קטגוריות: ${error.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleCategorySelection = (categoryId) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const selectAll = () => {
    const allIds = filteredCategories.map(cat => cat.id);
    setSelectedCategories(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedCategories(new Set());
  };

  const handleDelete = async (categoryId) => {
    try {
      await Category.delete(categoryId);
      await loadData();
    } catch (error) {
      console.error("Error deleting category:", error);
      setGenerationError(`שגיאה במחיקת קטגוריה: ${error.message}`);
    }
  };

  const handleActivate = async (categoryId) => {
    try {
      await Category.update(categoryId, { is_active: true });
      await loadData();
    } catch (error) {
      console.error("Error activating category:", error);
      setGenerationError(`שגיאה בהפעלת קטגוריה: ${error.message}`);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (showInactive || category.is_active !== false)
  );

  const getCategoryProducts = (categoryId) => {
    return products.filter(product => product.category_id === categoryId);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      image_url: category.image_url,
      is_active: category.is_active !== false
    });
    setIsAddOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setNewCategory({ ...newCategory, image_url: base64String });
        setIsUploading(false);
      };
      reader.onerror = (error) => {
        console.error("שגיאה בקריאת הקובץ:", error);
        setGenerationError(`שגיאה בהעלאת קובץ: ${error.message || 'שגיאה לא ידועה'}`);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("שגיאה בהעלאת קובץ:", error);
      setGenerationError(`שגיאה בהעלאת קובץ: ${error.message || 'שגיאה לא ידועה'}`);
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await Category.update(editingCategory.id, {
          name: newCategory.name,
          image_url: newCategory.image_url || editingCategory.image_url || "",
          is_active: newCategory.is_active
        });
      } else {
        await Category.create({
          name: newCategory.name,
          image_url: newCategory.image_url || "",
          is_active: true
        });
      }
      
      setIsAddOpen(false);
      setEditingCategory(null);
      setNewCategory({ name: "", image_url: "", is_active: true });
      
      await loadData();
    } catch (error) {
      console.error("Error saving category:", error);
      setGenerationError(`שגיאה בשמירת קטגוריה: ${error.message}`);
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const importCategoriesFromCsv = async () => {
    if (!csvFile) {
      setGenerationError('בחר קובץ CSV תחילה');
      return;
    }

    setImportStatus(prev => ({ ...prev, inProgress: true }));
    setGenerationError('');

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
          setGenerationError(`שגיאה בפענוח הקובץ: ${errors[0].message}`);
          setImportStatus(prev => ({ ...prev, inProgress: false }));
          return;
        }

        // קבל את הקטגוריות הקיימות
        const existingCategoriesSnapshot = await Category.list();
        const existingCategoriesMap = new Map();
        
        existingCategoriesSnapshot.forEach(cat => {
          existingCategoriesMap.set(cat.name, cat);
        });
        
        let addedCount = 0;
        let skippedCount = 0;
        
        // עבור על כל הקטגוריות בקובץ
        for (const categoryData of data) {
          // וודא שיש שם לקטגוריה
          if (!categoryData.name) {
            skippedCount++;
            continue;
          }
          
          // קטגוריה קיימת כבר?
          const existingCategory = existingCategoriesMap.get(categoryData.name);
          
          // המר שדה is_active לבוליאני
          let isActive = true; // ברירת מחדל פעיל
          if (categoryData.is_active !== undefined) {
            isActive = categoryData.is_active === "true" || categoryData.is_active === true;
          }
          
          // הכן את אובייקט הקטגוריה
          const categoryToSave = {
            name: categoryData.name,
            image_url: categoryData.image_url || '',
            is_active: isActive
          };
          
          if (existingCategory) {
            skippedCount++;
          } else {
            // הוסף קטגוריה חדשה
            await Category.create(categoryToSave);
            addedCount++;
          }
        }
        
        // עדכן את מצב הייבוא
        setImportStatus({
          total: data.length,
          added: addedCount,
          skipped: skippedCount,
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
      console.error("שגיאה בייבוא קטגוריות:", error);
      setGenerationError(`שגיאה בייבוא קטגוריות: ${error.message}`);
      setImportStatus(prev => ({ ...prev, inProgress: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">קטגוריות</h1>
        <div className="flex gap-2">
          {selectedCategories.size > 0 && (
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
                  מחק {selectedCategories.size} קטגוריות
                </>
              )}
            </Button>
          )}
          <Button onClick={() => setIsImportOpen(true)} variant="outline">
            <Upload className="w-4 h-4 ml-2" />
            ייבוא קטגוריות
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            קטגוריה חדשה
          </Button>
        </div>
      </div>

      {generationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {generationError}
          {generationError.includes("מגבלת קצב") && (
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
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1">
              <Input
                placeholder="חפש קטגוריה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            {filteredCategories.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  בחר הכל
                </Button>
                {selectedCategories.size > 0 && (
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    נקה בחירה
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCategories.map((category) => (
              <Card 
                key={category.id} 
                className={`overflow-hidden ${category.is_active === false ? 'opacity-60' : ''} relative`}
              >
                <div className="absolute top-2 right-2 z-10">
                  <Checkbox
                    checked={selectedCategories.has(category.id)}
                    onCheckedChange={() => toggleCategorySelection(category.id)}
                  />
                </div>
                <div 
                  className="aspect-video relative cursor-pointer"
                  onClick={() => setSelectedCategory(selectedCategory?.id === category.id ? null : category)}
                >
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.backgroundColor = '#3b82f6';
                        const textDiv = document.createElement('div');
                        textDiv.className = 'w-full h-full flex items-center justify-center text-white text-xl font-bold';
                        textDiv.innerText = category.name;
                        e.target.parentNode.appendChild(textDiv);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {category.name}
                    </div>
                  )}
                  {category.is_active === false && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">לא פעיל</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{category.name}</h3>
                      <p className="text-sm text-gray-600">
                        {productsCount[category.id] || 0} מוצרים
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {category.is_active !== false ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(category.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivate(category.id);
                          }}
                        >
                          <ArrowDownUp className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {selectedCategory && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  מוצרים בקטגוריית {selectedCategory.name}
                </h2>
                <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                  סגור
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {getCategoryProducts(selectedCategory.id).map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="mt-2 font-medium">
                        ₪{product.price_with_vat} כולל מע"מ
                      </p>
                      {product.variations?.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {product.variations.length} וריאציות
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "עריכת קטגוריה" : "הוספת קטגוריה חדשה"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">שם הקטגוריה</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    placeholder="הכנס שם קטגוריה"
                  />
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
                {newCategory.image_url && (
                  <img
                    src={newCategory.image_url}
                    alt="תצוגה מקדימה"
                    className="w-full h-40 object-cover rounded"
                  />
                )}
                {editingCategory && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category-active"
                      checked={newCategory.is_active}
                      onCheckedChange={(isActive) =>
                        setNewCategory({ ...newCategory, is_active: isActive })
                      }
                    />
                    <Label htmlFor="category-active">קטגוריה פעילה</Label>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSubmit}
                  disabled={!newCategory.name || isUploading}
                >
                  {editingCategory ? "שמור שינויים" : "צור קטגוריה"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ייבוא קטגוריות מקובץ CSV</DialogTitle>
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
                    הקובץ צריך להכיל את העמודות: name, image_url, is_active
                  </p>
                </div>
                
                {generationError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {generationError}
                  </div>
                )}
                
                {!importStatus.inProgress && importStatus.total > 0 && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <p>הייבוא הושלם בהצלחה!</p>
                    <p>סה"כ: {importStatus.total}</p>
                    <p>נוספו: {importStatus.added}</p>
                    <p>דולגו: {importStatus.skipped}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={importCategoriesFromCsv}
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
        </>
      )}
    </div>
  );
}
