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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Upload, Image, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function BulkProductImportPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [companyLogoText, setCompanyLogoText] = useState("האחים גל"); // שם הלוגו של החברה שיש לסנן
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await Category.list();
      setCategories(categoriesData);
    } catch (error) {
      console.error("שגיאה בטעינת קטגוריות:", error);
      setErrorMessage(`שגיאה בטעינת קטגוריות: ${error.message}`);
    }
  };

  // פונקציה חדשה להמרת קובץ ל-Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFilesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage("");
    setUploadedImages([]);

    try {
      const newImages = [];
      let processedFiles = 0;
      const totalFiles = files.length;

      // הגדרת פונקציה לעיבוד קבוצת קבצים
      const processFilesBatch = async (fileBatch, startIndex) => {
        const batchPromises = fileBatch.map(async (file) => {
          try {
            // המרת הקובץ ל-Base64 במקום העלאה ל-Firebase
            const base64Data = await convertFileToBase64(file);
            return {
              file_name: file.name,
              image_url: base64Data, // שמירת תוכן התמונה כ-Base64
              status: "uploaded", // 'uploaded', 'processed', 'failed'
              product_name: extractProductNameFromFilename(file.name), // מיד מחלץ שם מהקובץ
              extracted_text: "",
              is_selected: true,
            };
          } catch (error) {
            console.error(`שגיאה בהמרת קובץ ${file.name}:`, error);
            return null;
          }
        });

        const results = await Promise.allSettled(batchPromises);
        
        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            newImages.push(result.value);
          }
          
          processedFiles++;
          setUploadProgress(Math.round((processedFiles / totalFiles) * 100));
        }
      };

      // עיבוד קבצים בקבוצות של 3 בכל פעם (הורדנו ל-3 כי קידוד Base64 יכול להיות כבד יותר)
      const BATCH_SIZE = 3;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const fileBatch = files.slice(i, i + BATCH_SIZE);
        await processFilesBatch(fileBatch, i);
        
        // עדכון המצב בכל קבוצה
        setUploadedImages([...newImages]);
      }

    } catch (error) {
      console.error("שגיאה בהמרת קבצים:", error);
      setErrorMessage(`שגיאה בהמרת קבצים: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // פונקציה לחילוץ שם מוצר אפשרי משם הקובץ במקרה שה-OCR נכשל
  const extractProductNameFromFilename = (filename) => {
    // הסר סיומת הקובץ
    let name = filename.replace(/\.[^/.]+$/, "");
    
    // הסר תווים מיוחדים ומספרים מיותרים
    name = name.replace(/[_\-\d]+/g, " ");
    
    // הסר את שם הלוגו אם קיים
    if (companyLogoText) {
      name = name.replace(new RegExp(companyLogoText, "gi"), "");
    }
    
    // הסר רווחים מיותרים ותווים אחרים
    name = name.replace(/\s+/g, " ").trim();
    
    // אם השם ריק, החזר ערך ברירת מחדל
    return name || "מוצר חדש";
  };

  // פונקציה פשוטה לעיבוד טקסט שלא מסתמכת על OCR
  const extractTextFromImages = async () => {
    if (!uploadedImages.length) {
      setErrorMessage("אנא העלה תמונות קודם");
      return;
    }

    if (!selectedCategoryId) {
      setErrorMessage("אנא בחר קטגוריה לפני עיבוד התמונות");
      return;
    }
    
    // וידוא שהקטגוריה קיימת במערכת
    const categoryExists = categories.some(cat => cat.id === selectedCategoryId);
    if (!categoryExists) {
      setErrorMessage("הקטגוריה שנבחרה אינה קיימת במערכת. אנא בחר קטגוריה תקינה.");
      return;
    }

    // שמירת הקטגוריה הנבחרת בתצוגה
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    console.log(`עיבוד תמונות לקטגוריה: ${selectedCategory.name} (${selectedCategoryId})`);

    setIsProcessing(true);
    setProcessingComplete(false);
    setSuccessCount(0);
    setFailureCount(0);
    setErrorMessage("");
    setProcessingProgress(0);

    const updatedImages = [...uploadedImages];
    let successCounter = 0;
    let failureCounter = 0;
    
    // לקחת רק תמונות שסומנו
    const selectedImages = updatedImages.filter(img => img.is_selected);
    const totalSelectedImages = selectedImages.length;
    
    if (totalSelectedImages === 0) {
      setErrorMessage("לא נבחרו תמונות לעיבוד");
      setIsProcessing(false);
      return;
    }
    
    // מכיוון שאנו משתמשים בשמות מהקבצים, אנחנו לא צריכים OCR
    // פשוט נעדכן את הסטטוס של כל התמונות ל-processed
    for (let i = 0; i < totalSelectedImages; i++) {
      const image = selectedImages[i];
      const index = updatedImages.findIndex(img => img.image_url === image.image_url);
      
      if (index !== -1) {
        // עדכון פרטי התמונה
        updatedImages[index] = {
          ...updatedImages[index],
          status: "processed",
          // נשתמש בשם שכבר חילצנו בזמן ההעלאה
          product_name: updatedImages[index].product_name || extractProductNameFromFilename(updatedImages[index].file_name),
          extracted_text: "שם מחולץ משם הקובץ"
        };
        
        successCounter++;
      } else {
        failureCounter++;
      }
      
      // עדכון התקדמות
      setProcessingProgress(Math.round(((i + 1) / totalSelectedImages) * 100));
      
      // עדכון התמונות בכל 10 תמונות כדי לשמור על ביצועים
      if (i % 10 === 0 || i === totalSelectedImages - 1) {
        setUploadedImages([...updatedImages]);
        setSuccessCount(successCounter);
        setFailureCount(failureCounter);
      }
    }

    // סיום העיבוד
    setUploadedImages([...updatedImages]);
    setSuccessCount(successCounter);
    setFailureCount(failureCounter);
    setIsProcessing(false);
    setProcessingComplete(true);
    setShowImportDialog(true);
  };

  // פונקציה לעיבוד הטקסט המחולץ והסרת שם הלוגו
  const processExtractedText = (text, logoName) => {
    if (!text) return "";
    
    // פיצול הטקסט לשורות ומילים
    const lines = text.split(/\r?\n/);
    const filteredLines = lines.filter(line => 
      line.trim() && !line.includes(logoName) && !line.toLowerCase().includes(logoName.toLowerCase())
    );
    
    // אם יש שורות שנשארו לאחר הסינון, בחר את השורה הארוכה ביותר או הראשונה
    if (filteredLines.length > 0) {
      // מיון השורות לפי אורך ולקיחת השורה הארוכה ביותר
      return filteredLines.sort((a, b) => b.length - a.length)[0].trim();
    }
    
    return "";
  };

  const handleImportProducts = async () => {
    setIsProcessing(true);
    setErrorMessage("");
    
    // בדיקה אם נבחרה קטגוריה
    if (!selectedCategoryId) {
      setErrorMessage("יש לבחור קטגוריה לפני יבוא המוצרים");
      setIsProcessing(false);
      return;
    }
    
    // וידוא שהקטגוריה קיימת במערכת
    const categoryExists = categories.some(cat => cat.id === selectedCategoryId);
    if (!categoryExists) {
      setErrorMessage("הקטגוריה שנבחרה אינה קיימת במערכת");
      setIsProcessing(false);
      return;
    }
    
    let importedCount = 0;
    let failedCount = 0;
    let totalToImport = uploadedImages.filter(img => img.is_selected && img.status === "processed").length;
    
    if (totalToImport === 0) {
      setErrorMessage("אין מוצרים מוכנים ליבוא. אנא עבד תמונות קודם.");
      setIsProcessing(false);
      return;
    }
    
    setProcessingProgress(0);
    
    try {
      // קבל את שם הקטגוריה הנבחרת
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      console.log(`יוצר מוצרים בקטגוריה: ${selectedCategory.name} (${selectedCategoryId})`);
      
      // יצירת מוצר עבור כל תמונה מעובדת שנבחרה
      for (const image of uploadedImages.filter(img => img.is_selected && img.status === "processed")) {
        try {
          // יצירת אובייקט מוצר חדש
          const newProduct = {
            name: image.product_name,
            category_id: selectedCategoryId,
            category_name: selectedCategory.name, // שמירת שם הקטגוריה מפורשות
            image_url: image.image_url,
            price_before_vat: 0, // ברירת מחדל, יש לעדכן ידנית
            price_with_vat: 0,   // ברירת מחדל, יש לעדכן ידנית
            variations: [],      // ללא וריאציות כברירת מחדל
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // יצירת המוצר בפיירבייס
          await Product.create(newProduct);
          importedCount++;
          
          // עדכון התקדמות
          setProcessingProgress(Math.round((importedCount / totalToImport) * 100));
        } catch (error) {
          console.error(`שגיאה ביצירת מוצר ${image.product_name}:`, error);
          failedCount++;
        }
      }
      
      // הצגת הודעת סיכום
      if (importedCount > 0) {
        setErrorMessage(`הייבוא הושלם! יובאו ${importedCount} מוצרים בהצלחה${failedCount > 0 ? `, נכשלו ${failedCount} מוצרים` : ''}.`);
      } else {
        setErrorMessage(`הייבוא נכשל. לא יובאו מוצרים.`);
      }
      
    } catch (error) {
      console.error("שגיאה בתהליך היבוא:", error);
      setErrorMessage(`שגיאה בתהליך היבוא: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setShowImportDialog(false);
    }
  };

  const toggleImageSelection = (index) => {
    const updatedImages = [...uploadedImages];
    updatedImages[index].is_selected = !updatedImages[index].is_selected;
    setUploadedImages(updatedImages);
  };

  const updateProductName = (index, newName) => {
    const updatedImages = [...uploadedImages];
    updatedImages[index].product_name = newName;
    setUploadedImages(updatedImages);
  };

  // פונקציה לסימון/הסרת סימון מכל התמונות
  const toggleAllSelection = (selectAll) => {
    const updatedImages = uploadedImages.map(img => ({
      ...img,
      is_selected: selectAll
    }));
    setUploadedImages(updatedImages);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">העלאת מוצרים מתמונות</h1>
      </div>

      <Card className="p-6 border-2 border-blue-200 bg-blue-50">
        <div className="flex items-start space-x-3 rtl:space-x-reverse">
          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-700">מצב מקומי מוגבר פעיל</h3>
            <p className="text-sm text-blue-600">
              המערכת כעת משתמשת באחסון מקומי (Base64) ללא תלות בשירותי ענן חיצוניים.
              שים לב: תמונות גדולות עלולות להשפיע על ביצועי המערכת.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">הגדרות העלאה</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                קטגוריה 
                <span className="text-red-500">*</span>
                <span className="text-sm font-normal text-gray-500 mr-1">(חובה)</span>
              </label>
              <Select 
                value={selectedCategoryId} 
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger className={`w-full ${!selectedCategoryId ? 'border-red-300 bg-red-50' : ''}`}>
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
              {!selectedCategoryId && (
                <p className="text-sm text-red-500 mt-1">יש לבחור קטגוריה לפני העלאת תמונות</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">לוגו החברה בתמונות (לסינון)</label>
              <Input 
                placeholder="שם החברה המופיע בתמונות" 
                value={companyLogoText}
                onChange={(e) => setCompanyLogoText(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">טקסט זה יסונן מהמוצרים בעת יצירתם</p>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              העלאת תמונות
              <span className="text-sm font-normal text-gray-500 mr-1">(בחר קבצי תמונה)</span>
            </label>
            <div className="mt-2">
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer relative bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
              >
                <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <span>העלה תמונות מוצרים</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFilesUpload} 
                        disabled={isUploading}
                      />
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF עד 10MB</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>מעלה תמונות... {uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="mt-2" />
            </div>
          )}
          
          {uploadedImages.length > 0 && !isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">תמונות שהועלו ({uploadedImages.length})</h3>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setUploadedImages([])}
                    disabled={isProcessing}
                  >
                    נקה הכל
                  </Button>
                  <Button 
                    onClick={extractTextFromImages}
                    disabled={isProcessing || !selectedCategoryId}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        מעבד תמונות...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        עבד תמונות ליצירת מוצרים
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isProcessing && (
                <div className="mt-4">
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>מעבד תמונות ליצירת מוצרים... {processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="mt-2" />
                </div>
              )}
              
              {processingComplete && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-green-800">עיבוד תמונות הושלם</h4>
                      <p className="text-sm text-green-600">
                        {successCount} תמונות עובדו בהצלחה, {failureCount} נכשלו.
                        סמן את המוצרים הרצויים וייבא אותם למערכת.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <div className="flex-shrink-0">
                        <Image className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.file_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {image.status === "uploaded" && "הועלה, ממתין לעיבוד"}
                          {image.status === "processing" && "בתהליך עיבוד..."}
                          {image.status === "processed" && "עובד - מוכן לייבוא"}
                          {image.status === "failed" && "נכשל בעיבוד"}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={image.is_selected}
                          onChange={() => {
                            const updatedImages = [...uploadedImages];
                            updatedImages[index].is_selected = !updatedImages[index].is_selected;
                            setUploadedImages(updatedImages);
                          }}
                          className="h-4 w-4 text-primary rounded"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <img 
                        src={image.image_url} 
                        alt={image.file_name}
                        className="h-36 w-full object-contain rounded border bg-gray-50"
                      />
                    </div>
                    
                    {image.status === "processed" && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          שם המוצר
                        </label>
                        <Input
                          value={image.product_name}
                          onChange={(e) => {
                            const updatedImages = [...uploadedImages];
                            updatedImages[index].product_name = e.target.value;
                            setUploadedImages(updatedImages);
                          }}
                          className="text-sm"
                          placeholder="שם המוצר"
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              
              {uploadedImages.filter(img => img.status === "processed").length > 0 && (
                <div className="mt-6">
                  <Button 
                    onClick={() => setShowImportDialog(true)}
                    disabled={isProcessing || !selectedCategoryId}
                    className="w-full"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    ייבא מוצרים למערכת
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex">
            <div className="py-1">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            </div>
            <div>
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>יבוא מוצרים למערכת</AlertDialogTitle>
            <AlertDialogDescription>
              <p>האם אתה בטוח שברצונך לייבא {uploadedImages.filter(img => img.is_selected && img.status === "processed").length} מוצרים למערכת?</p>
              <p className="mt-2">המוצרים ייווצרו בקטגוריה: <strong>{categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId}</strong></p>
              <p className="mt-2 text-amber-600 font-semibold">שים לב: פעולה זו אינה ניתנת לביטול.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportProducts}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  מייבא...
                </>
              ) : (
                "אישור וייבוא"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 