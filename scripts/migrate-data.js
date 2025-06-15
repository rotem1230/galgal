import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// תצורת Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDurtEehM5IrQxeJmKAIyaucKqDyEy4nl0",
  authDomain: "galbrother-1baff.firebaseapp.com",
  projectId: "galbrother-1baff",
  storageBucket: "galbrother-1baff.appspot.com",
  messagingSenderId: "100731308038",
  appId: "1:100731308038:web:a005fd238a5d50d5bb5b87",
  measurementId: "G-1QL9EP8J5Y"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
    // התחברות עם משתמש מנהל
    console.log('מתחבר למערכת...');
    await signInWithEmailAndPassword(auth, 'rotemhaha321@gmail.com', process.env.ADMIN_PASSWORD);
    console.log('התחברות הצליחה');

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