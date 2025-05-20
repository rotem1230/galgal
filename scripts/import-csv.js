// סקריפט להעלאת קבצי CSV של מוצרים וקטגוריות לפיירבייס
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');

// טען משתני סביבה אם קיימים
dotenv.config();

// תצורת Firebase 
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBLXdB0O222ZnIVmQs_kPE0dMxOj7xUxn4",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gal-brothers-inventory.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "gal-brothers-inventory",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gal-brothers-inventory.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "453575442207",
  appId: process.env.FIREBASE_APP_ID || "1:453575442207:web:1a67dd58659ba4c1d0458c"
};

// אתחול אפליקציית Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ספריית ברירת מחדל לקבצי CSV
const DATA_DIR = './data';

// פונקציה לקריאת קובץ CSV
function readCsvFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // קריאת ה-CSV עם תמיכה בכותרות
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    return records;
  } catch (error) {
    console.error(`שגיאה בקריאת קובץ ${filePath}:`, error.message);
    return [];
  }
}

// פונקציה לחיפוש קובץ במספר מיקומים
function findFile(fileName) {
  // מיקומים אפשריים לחיפוש הקובץ
  const possibleLocations = [
    fileName,                              // בספריית השורש
    path.join(DATA_DIR, fileName),         // בתיקיית DATA_DIR
    path.join('..', fileName),             // תיקייה אחת למעלה
    path.join('..', DATA_DIR, fileName)    // תיקיית DATA_DIR בתיקייה למעלה
  ];
  
  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      console.log(`מצאתי את הקובץ ${fileName} במיקום: ${location}`);
      return location;
    }
  }
  
  return null;
}

// פונקציה להעלאת קטגוריות
async function importCategories(filePath) {
  console.log('מתחיל להעלות קטגוריות...');
  
  try {
    // קרא את קובץ ה-CSV
    const categories = readCsvFile(filePath);
    if (categories.length === 0) {
      console.log('לא נמצאו קטגוריות בקובץ');
      return;
    }
    
    console.log(`נמצאו ${categories.length} קטגוריות בקובץ`);
    
    // קבל את הקטגוריות הקיימות
    const categoriesRef = collection(db, 'categories');
    const existingCategoriesSnapshot = await getDocs(categoriesRef);
    const existingCategoriesMap = new Map();
    
    existingCategoriesSnapshot.forEach(doc => {
      const data = doc.data();
      existingCategoriesMap.set(data.name, { id: doc.id, ...data });
    });
    
    console.log(`נמצאו ${existingCategoriesMap.size} קטגוריות קיימות במערכת`);
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    // עבור על כל הקטגוריות בקובץ
    for (const category of categories) {
      // וודא שיש שם לקטגוריה
      if (!category.name) {
        console.log('דילוג על קטגוריה ללא שם');
        skippedCount++;
        continue;
      }
      
      // קטגוריה קיימת כבר?
      const existingCategory = existingCategoriesMap.get(category.name);
      
      // המר שדה is_active לבוליאני לפי סכימת פיירבייס
      let isActive = true; // ברירת מחדל פעיל
      if (category.is_active !== undefined) {
        isActive = category.is_active === "true" || category.is_active === true;
      }
      
      // הכן את האובייקט שיישמר בפיירבייס
      const categoryData = {
        name: category.name,
        image_url: category.image_url || '',
        is_active: isActive
      };
      
      if (existingCategory) {
        console.log(`דילוג על קטגוריה קיימת: ${category.name}`);
        skippedCount++;
      } else {
        // הוסף קטגוריה חדשה
        await addDoc(categoriesRef, categoryData);
        console.log(`נוספה קטגוריה: ${category.name}`);
        addedCount++;
      }
    }
    
    console.log('\nסיכום העלאת קטגוריות:');
    console.log(`נוספו: ${addedCount}`);
    console.log(`דולגו: ${skippedCount}`);
    
  } catch (error) {
    console.error('שגיאה בהעלאת קטגוריות:', error);
  }
}

// פונקציה לעיבוד וריאציות מוצר
function processProductVariations(product) {
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
    console.error(`שגיאה בעיבוד וריאציות למוצר ${product.name}:`, e.message);
  }
  
  return variations;
}

// פונקציה להעלאת מוצרים
async function importProducts(filePath) {
  console.log('\nמתחיל להעלות מוצרים...');
  
  try {
    // קרא את קובץ ה-CSV
    const products = readCsvFile(filePath);
    if (products.length === 0) {
      console.log('לא נמצאו מוצרים בקובץ');
      return;
    }
    
    console.log(`נמצאו ${products.length} מוצרים בקובץ`);
    
    // קבל את המוצרים הקיימים
    const productsRef = collection(db, 'products');
    const existingProductsSnapshot = await getDocs(productsRef);
    const existingProductsMap = new Map();
    
    existingProductsSnapshot.forEach(doc => {
      const data = doc.data();
      existingProductsMap.set(data.name, { id: doc.id, ...data });
    });
    
    console.log(`נמצאו ${existingProductsMap.size} מוצרים קיימים במערכת`);
    
    // קבל את הקטגוריות הקיימות לצורך מיפוי שמות לID
    const categoriesRef = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesRef);
    const categoriesMap = new Map();
    
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categoriesMap.set(data.name, doc.id);
    });
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let categoryMismatchCount = 0;
    
    // עבור על כל המוצרים בקובץ
    for (const product of products) {
      // וודא שיש שם למוצר
      if (!product.name) {
        console.log('דילוג על מוצר ללא שם');
        skippedCount++;
        continue;
      }
      
      // מוצר קיים כבר?
      const existingProduct = existingProductsMap.get(product.name);
      
      // טיפול בקטגוריה - תן עדיפות ל-ID אם קיים, אחרת חפש לפי שם
      let categoryId = null;
          
      // אם יש category_id ישיר
      if (product.category_id) {
        // אם ה-ID מסופק ישירות, השתמש בו
        categoryId = product.category_id;
      } 
      // אם אין ID אבל יש שם קטגוריה, נסה למצוא לפי שם
      else if (product.category_name) {
        categoryId = categoriesMap.get(product.category_name);
        if (!categoryId) {
          console.log(`אזהרה: קטגוריה '${product.category_name}' למוצר '${product.name}' לא נמצאה`);
          categoryMismatchCount++;
        }
      }
      // תמיכה לאחורה בפורמט הישן שהשתמש ב-'category' 
      else if (product.category) {
        categoryId = categoriesMap.get(product.category);
        if (!categoryId) {
          console.log(`אזהרה: קטגוריה '${product.category}' למוצר '${product.name}' לא נמצאה`);
          categoryMismatchCount++;
        }
      }
      
      // טיפול בוריאציות עם הפונקציה המעודכנת
      const variations = processProductVariations(product);
      
      // הכן את האובייקט שיישמר בפיירבייס
      const productData = {
        name: product.name,
        category_id: categoryId,
        image_url: product.image_url || '',
        price_before_vat: parseFloat(product.price_before_vat) || 0,
        price_with_vat: parseFloat(product.price_with_vat) || 0,
        variations: variations
      };
      
      if (existingProduct) {
        console.log(`דילוג על מוצר קיים: ${product.name}`);
        skippedCount++;
      } else {
        // הוסף מוצר חדש
        await addDoc(productsRef, productData);
        console.log(`נוסף מוצר: ${product.name}`);
        addedCount++;
      }
    }
    
    console.log('\nסיכום העלאת מוצרים:');
    console.log(`נוספו: ${addedCount}`);
    console.log(`דולגו: ${skippedCount}`);
    console.log(`שגיאות קטגוריה: ${categoryMismatchCount}`);
    
  } catch (error) {
    console.error('שגיאה בהעלאת מוצרים:', error);
  }
}

// וודא שתיקיית data קיימת
function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`יוצר תיקיית נתונים: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// פונקציה ראשית להפעלת תהליך ההעלאה
async function importData() {
  try {
    // וודא שתיקיית הנתונים קיימת
    ensureDataDirExists();
    
    // שמות הקבצים
    const categoriesFileName = 'categories.csv';
    const productsFileName = 'products.csv';
    
    // חפש את הקבצים
    const categoriesFilePath = findFile(categoriesFileName);
    const productsFilePath = findFile(productsFileName);
    
    if (categoriesFilePath) {
      await importCategories(categoriesFilePath);
    } else {
      console.log(`קובץ ${categoriesFileName} לא נמצא. נא להכניס את הקובץ לתיקיית ${DATA_DIR}.`);
    }
    
    if (productsFilePath) {
      await importProducts(productsFilePath);
    } else {
      console.log(`קובץ ${productsFileName} לא נמצא. נא להכניס את הקובץ לתיקיית ${DATA_DIR}.`);
    }
    
    console.log('\nתהליך ההעלאה הסתיים!');
    console.log(`כדי להעלות קבצים, הנח אותם בתיקיית ${DATA_DIR} וקרא להם:`);
    console.log(`- ${categoriesFileName}: לקטגוריות`);
    console.log(`- ${productsFileName}: למוצרים`);
    
  } catch (error) {
    console.error('שגיאה בתהליך ההעלאה:', error);
  }
}

// הרץ את תהליך ההעלאה
importData(); 