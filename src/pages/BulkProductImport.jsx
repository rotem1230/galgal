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
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
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
            const { file_url } = await UploadFile({ file });
            return {
              file_name: file.name,
              image_url: file_url,
              status: "uploaded", // 'uploaded', 'processed', 'failed'
              product_name: "",
              extracted_text: "",
              is_selected: true,
            };
          } catch (error) {
            console.error(`שגיאה בהעלאת קובץ ${file.name}:`, error);
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

      // עיבוד קבצים בקבוצות של 10 בכל פעם
      const BATCH_SIZE = 10;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const fileBatch = files.slice(i, i + BATCH_SIZE);
        await processFilesBatch(fileBatch, i);
        
        // עדכון המצב בכל קבוצה
        setUploadedImages([...newImages]);
      }

    } catch (error) {
      console.error("שגיאה בהעלאת קבצים:", error);
      setErrorMessage(`שגיאה בהעלאת קבצים: ${error.message}`);
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

  const extractTextFromImages = async () => {
    if (!uploadedImages.length) {
      setErrorMessage("אנא העלה תמונות קודם");
      return;
    }

    if (!selectedCategoryId) {
      setErrorMessage("אנא בחר קטגוריה");
      return;
    }

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
    
    // עיבוד תמונות בקבוצות של 5 בכל פעם
    const BATCH_SIZE = 5;
    
    for (let batchStart = 0; batchStart < totalSelectedImages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalSelectedImages);
      const batch = selectedImages.slice(batchStart, batchEnd);
      
      // עיבוד מקבילי של קבוצת תמונות
      const batchPromises = batch.map(async (image) => {
        const index = updatedImages.findIndex(img => img.image_url === image.image_url);
        if (index === -1) return null;
        
        try {
          // חילוץ טקסט מהתמונה באמצעות OCR
          const extractionResult = await ExtractDataFromUploadedFile({
            file_url: image.image_url,
            extraction_type: "text",
            json_schema: {
              type: "object",
              required: ["extracted_text"],
              properties: {
                extracted_text: { 
                  type: "string",
                  description: "The extracted text from the image"
                }
              }
            }
          });

          if (extractionResult && extractionResult.extracted_text) {
            const extractedText = extractionResult.extracted_text;
            
            // עיבוד הטקסט - הסרת שם הלוגו והתמקדות בשם המוצר
            let productName = processExtractedText(extractedText, companyLogoText);
            
            return {
              index,
              status: "processed",
              product_name: productName,
              extracted_text: extractedText,
              success: true
            };
          } else {
            // במקרה של כישלון, ננסה לחלץ שם מקובץ
            const backupName = extractProductNameFromFilename(image.file_name);
            
            return {
              index,
              status: "processed", // נשנה ל-processed כדי לאפשר יצירת מוצר עם שם מהקובץ
              product_name: backupName,
              extracted_text: "השתמשנו בשם הקובץ כיוון שלא ניתן היה לחלץ טקסט",
              success: true
            };
          }
        } catch (error) {
          console.error(`שגיאה בעיבוד תמונה ${index + 1}:`, error);
          
          // ניסיון לחלץ שם מוצר משם הקובץ במקרה של כישלון OCR
          const backupName = extractProductNameFromFilename(image.file_name);
          
          return {
            index,
            status: "processed", // נשנה ל-processed כדי לאפשר יצירת מוצר עם שם מהקובץ
            product_name: backupName,
            extracted_text: `שגיאה בזיהוי טקסט. השתמשנו בשם הקובץ במקום.`,
            success: true
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // עדכון התמונות עם תוצאות העיבוד
      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value) {
          const { index, status, product_name, extracted_text, success } = result.value;
          
          updatedImages[index] = {
            ...updatedImages[index],
            status,
            product_name,
            extracted_text
          };
          
          if (success) {
            successCounter++;
          } else {
            failureCounter++;
          }
        } else if (result.status === "rejected") {
          failureCounter++;
        }
      }
      
      // עדכון התקדמות ותוצאות
      setUploadedImages([...updatedImages]);
      setSuccessCount(successCounter);
      setFailureCount(failureCounter);
      setProcessingProgress(Math.round(((batchEnd) / totalSelectedImages) * 100));
    }

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
    let importedCount = 0;
    let totalToImport = uploadedImages.filter(img => img.is_selected && img.status === "processed").length;
    
    try {
      // עיבוד מוצרים בקבוצות של 10 בכל פעם
      const BATCH_SIZE = 10;
      const selectedProducts = uploadedImages.filter(img => img.is_selected && img.status === "processed");
      
      for (let batchStart = 0; batchStart < selectedProducts.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, selectedProducts.length);
        const batch = selectedProducts.slice(batchStart, batchEnd);
        
        const batchPromises = batch.map(async (image) => {
          try {
            // יצירת מוצר חדש
            await Product.create({
              name: image.product_name || `מוצר מתמונה ${importedCount + 1}`,
              category_id: selectedCategoryId,
              price_with_vat: 1, // מחיר 1 לכל המוצרים כפי שביקשת
              price_before_vat: 0.85, // מחיר ללא מע"מ מחושב לפי 18% מע"מ
              image_url: image.image_url,
              variations: []
            });
            return true;
          } catch (error) {
            console.error(`שגיאה ביבוא מוצר: ${image.product_name}`, error);
            return false;
          }
        });
        
        const results = await Promise.allSettled(batchPromises);
        const successfulImports = results.filter(r => r.status === "fulfilled" && r.value === true).length;
        importedCount += successfulImports;
        
        // עדכון התקדמות
        setUploadProgress(Math.round(((batchEnd) / totalToImport) * 100));
      }

      // איפוס המסך לאחר היבוא המוצלח
      setUploadedImages([]);
      setProcessingComplete(false);
      setSuccessCount(0);
      setFailureCount(0);
      setShowImportDialog(false);
      
      // הצגת הודעת הצלחה
      setErrorMessage(`יובאו ${importedCount} מוצרים בהצלחה!`);
    } catch (error) {
      console.error("שגיאה ביבוא מוצרים:", error);
      setErrorMessage(`שגיאה ביבוא מוצרים: ${error.message}`);
    } finally {
      setIsProcessing(false);
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

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">הגדרות העלאה</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">קטגוריה</label>
              <Select 
                value={selectedCategoryId} 
                onValueChange={setSelectedCategoryId}
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
              <label className="block text-sm font-medium mb-1">טקסט הלוגו לסינון (שם החברה)</label>
              <Input
                value={companyLogoText}
                onChange={(e) => setCompanyLogoText(e.target.value)}
                placeholder="הזן את שם הלוגו שיש לסנן"
              />
              <p className="text-xs text-gray-500 mt-1">
                טקסט זה יוסר משמות המוצרים המחולצים מהתמונות
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="file"
              id="bulk-file-upload"
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleFilesUpload}
              disabled={isUploading || isProcessing}
            />
            <label htmlFor="bulk-file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-gray-400 mb-4" />
                <p className="font-medium">לחץ להעלאת תמונות או גרור לכאן</p>
                <p className="text-sm text-gray-500 mt-1">
                  ניתן להעלות מאות תמונות בו-זמנית - אין הגבלה על הכמות
                </p>
              </div>
            </label>
          </div>

          {isUploading && (
            <div className="mt-4">
              <p className="text-sm mb-2">מעלה תמונות... {uploadProgress}%</p>
              <Progress value={uploadProgress} />
            </div>
          )}

          {isProcessing && (
            <div className="mt-4">
              <p className="text-sm mb-2">מעבד תמונות... {processingProgress}%</p>
              <Progress value={processingProgress} />
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    תמונות שהועלו ({uploadedImages.length})
                  </h3>
                  <div className="flex space-x-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => toggleAllSelection(true)}>
                      סמן הכל
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAllSelection(false)}>
                      הסר סימון מהכל
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={extractTextFromImages}
                  disabled={isProcessing || isUploading || !selectedCategoryId}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      מעבד...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      חלץ שמות מוצרים
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <Card 
                    key={index} 
                    className={`overflow-hidden ${image.is_selected ? 'ring-2 ring-blue-500' : 'opacity-70'}`}
                  >
                    <div className="relative h-40">
                      <img 
                        src={image.image_url} 
                        alt={image.file_name}
                        className="w-full h-full object-cover" 
                      />
                      <div 
                        className="absolute top-2 right-2 cursor-pointer"
                        onClick={() => toggleImageSelection(index)}
                      >
                        <div className={`h-6 w-6 rounded-full ${image.is_selected ? 'bg-blue-500' : 'bg-gray-300'} flex items-center justify-center`}>
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      {image.status === "processed" && (
                        <div className="absolute bottom-0 right-0 bg-green-500 text-white px-2 py-1 text-xs">
                          {image.extracted_text.includes("שגיאה") || image.extracted_text.includes("השתמשנו בשם הקובץ") ? 
                            "שם מהקובץ" : "עובד בהצלחה"}
                        </div>
                      )}
                      {image.status === "failed" && (
                        <div className="absolute bottom-0 right-0 bg-red-500 text-white px-2 py-1 text-xs">
                          נכשל
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium truncate mb-1">
                        {image.file_name}
                      </div>
                      
                      {image.status === "processed" && (
                        <Input
                          value={image.product_name}
                          onChange={(e) => updateProductName(index, e.target.value)}
                          placeholder="שם המוצר"
                          className="text-sm mt-2"
                        />
                      )}
                      
                      {image.status === "failed" && (
                        <p className="text-sm text-red-500 mt-2">
                          לא ניתן לחלץ טקסט
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent aria-describedby="import-dialog-description">
          <AlertDialogHeader>
            <AlertDialogTitle>יבוא מוצרים</AlertDialogTitle>
            <AlertDialogDescription id="import-dialog-description">
              חילוץ הטקסט מהתמונות הושלם.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-2">
            <div>סה"כ תמונות שעובדו בהצלחה: {successCount}</div>
            <div>סה"כ תמונות שנכשלו: {failureCount}</div>
            <div className="mt-4">האם ברצונך ליצור מוצרים חדשים מהתמונות שעובדו?</div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>בטל</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportProducts} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  מייבא...
                </>
              ) : "צור מוצרים"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 