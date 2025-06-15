import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// תצורת Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "gal-brothers-inventory.firebaseapp.com",
  projectId: "gal-brothers-inventory",
  storageBucket: "gal-brothers-inventory.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// פונקציה להעברת נתונים למשתמש ספציפי
async function migrateDataToUser(email) {
  try {
    console.log(`מתחיל העברת נתונים למשתמש ${email}...`);

    // עדכון לקוחות
    const customersRef = collection(db, 'customers');
    const customersSnapshot = await getDocs(customersRef);
    let customerCount = 0;

    for (const customerDoc of customersSnapshot.docs) {
      const customerData = customerDoc.data();
      if (!customerData.managedBy) {
        await updateDoc(doc(db, 'customers', customerDoc.id), {
          managedBy: email
        });
        customerCount++;
      }
    }
    console.log(`עודכנו ${customerCount} לקוחות`);

    // עדכון הזמנות
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    let orderCount = 0;

    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      if (!orderData.managedBy) {
        await updateDoc(doc(db, 'orders', orderDoc.id), {
          managedBy: email
        });
        orderCount++;
      }
    }
    console.log(`עודכנו ${orderCount} הזמנות`);

    console.log(`סיום העברת נתונים למשתמש ${email}`);
  } catch (error) {
    console.error('שגיאה בהעברת נתונים:', error);
    throw error;
  }
}

// הרצת המיגרציה
async function runMigration() {
  try {
    // העבר את כל הנתונים הקיימים ל-rotemhaha321@gmail.com
    await migrateDataToUser('rotemhaha321@gmail.com');
    console.log('המיגרציה הושלמה בהצלחה');
    process.exit(0);
  } catch (error) {
    console.error('שגיאה במיגרציה:', error);
    process.exit(1);
  }
}

runMigration(); 