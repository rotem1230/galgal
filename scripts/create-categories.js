// סקריפט ליצירת קטגוריות מוצרים עבור "האחים גל"
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
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

// הקטגוריות שנרצה ליצור
const categories = [
  {
    name: "מכשירים רב פעמיים",
    image_url: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "נרגילות",
    image_url: "https://images.unsplash.com/photo-1595183241165-526c3118db6e?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מצתים",
    image_url: "https://images.unsplash.com/photo-1576866209830-589e1bfbaa4d?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "אקססוריז לנרגילות",
    image_url: "https://images.unsplash.com/photo-1507833013424-310d42be0aa0?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "ניירות גלגול",
    image_url: "https://images.pexels.com/photos/7666214/pexels-photo-7666214.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "פילטרים",
    image_url: "https://images.pexels.com/photos/10386203/pexels-photo-10386203.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "גריינדרים",
    image_url: "https://images.unsplash.com/photo-1635600321903-88ba8052cd24?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "פייפים",
    image_url: "https://images.pexels.com/photos/6589085/pexels-photo-6589085.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "טבק",
    image_url: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "סיגריות",
    image_url: "https://images.pexels.com/photos/2519183/pexels-photo-2519183.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "אקססוריז למעשנים",
    image_url: "https://images.pexels.com/photos/4195217/pexels-photo-4195217.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "בונגים",
    image_url: "https://images.pexels.com/photos/7585607/pexels-photo-7585607.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "וייפים",
    image_url: "https://images.unsplash.com/photo-1560706395-e6dbfc14b731?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "נוזלים לסיגריה אלקטרונית",
    image_url: "https://images.pexels.com/photos/188475/pexels-photo-188475.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "תרמילים וארנקים",
    image_url: "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מאפרות",
    image_url: "https://images.unsplash.com/photo-1614373782642-fbd4574d3a5d?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מוצרי CBD",
    image_url: "https://images.unsplash.com/photo-1626107162656-0495943700f8?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "כלים לניקוי",
    image_url: "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=500&dpr=1",
    is_active: true
  },
  {
    name: "מאזניים",
    image_url: "https://images.unsplash.com/photo-1520452112805-01a9b4c5e1a6?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "נרות ריחניים",
    image_url: "https://images.unsplash.com/photo-1608181831718-c9ffd8728e95?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מחזיקי מפתחות",
    image_url: "https://images.unsplash.com/photo-1589707961088-a897126ab021?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "פוסטרים וקישוטי קיר",
    image_url: "https://images.unsplash.com/photo-1552248524-10d9a7e4841c?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "חולצות וביגוד",
    image_url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "כובעים וכיסויי ראש",
    image_url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "משקפי שמש",
    image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "תכשיטים",
    image_url: "https://images.unsplash.com/photo-1599643474231-481f04a9f2c3?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מגזינים וספרים",
    image_url: "https://images.unsplash.com/photo-1529473814998-077b4fec6770?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מוצרי נייר",
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "קופסאות אחסון",
    image_url: "https://images.unsplash.com/photo-1588663936282-82555be9c8fa?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מתנות ומזכרות",
    image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop",
    is_active: true
  },
  {
    name: "מוצרים שונים",
    image_url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=500&auto=format&fit=crop",
    is_active: true
  }
];

async function createCategories() {
  try {
    console.log('מתחיל ביצירת קטגוריות...');
    
    // בדוק אם כבר יש קטגוריות במערכת
    const categoriesRef = collection(db, 'categories');
    const existingCategoriesSnapshot = await getDocs(categoriesRef);
    
    if (!existingCategoriesSnapshot.empty) {
      console.log(`נמצאו ${existingCategoriesSnapshot.size} קטגוריות קיימות.`);
      console.log('בודק קטגוריות חדשות להוספה...');
    }
    
    let addedCount = 0;
    let skippedCount = 0;
    
    // עבור על כל הקטגוריות שאנחנו רוצים להוסיף
    for (const category of categories) {
      // בדוק אם הקטגוריה כבר קיימת לפי שם
      const existingCatQuery = query(categoriesRef, where('name', '==', category.name));
      const existingCatSnapshot = await getDocs(existingCatQuery);
      
      if (existingCatSnapshot.empty) {
        // הקטגוריה לא קיימת, אפשר להוסיף
        await addDoc(categoriesRef, category);
        console.log(`נוספה קטגוריה: ${category.name}`);
        addedCount++;
      } else {
        // הקטגוריה כבר קיימת
        console.log(`דילוג על קטגוריה קיימת: ${category.name}`);
        skippedCount++;
      }
    }
    
    console.log(`\nסיכום:`);
    console.log(`נוספו ${addedCount} קטגוריות חדשות`);
    console.log(`דילוג על ${skippedCount} קטגוריות קיימות`);
    console.log('הפעולה הושלמה בהצלחה');
    
  } catch (error) {
    console.error('שגיאה ביצירת קטגוריות:', error);
  }
}

// הרץ את הפונקציה
createCategories(); 