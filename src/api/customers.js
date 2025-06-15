import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase-config';

export const createCustomer = async (customerData) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('משתמש לא מחובר');

    const customerWithMetadata = {
      ...customerData,
      managedBy: currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'customers'), customerWithMetadata);
    console.log('לקוח נוצר בהצלחה עם ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('שגיאה ביצירת לקוח:', error);
    throw error;
  }
};

export const updateCustomer = async (customerId, customerData) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('משתמש לא מחובר');

    const customerDoc = await getDocs(customerRef);
    if (!customerDoc.exists() || customerDoc.data().managedBy !== currentUser.email) {
      throw new Error('אין הרשאה לעדכן לקוח זה');
    }

    const customerWithMetadata = {
      ...customerData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(customerRef, customerWithMetadata);
    console.log('לקוח עודכן בהצלחה');
  } catch (error) {
    console.error('שגיאה בעדכון לקוח:', error);
    throw error;
  }
};

export const getCustomers = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('משתמש לא מחובר');

    console.log(`מביא לקוחות עבור המשתמש: ${currentUser.email}`);

    const customersQuery = query(
      collection(db, 'customers'),
      where('managedBy', '==', currentUser.email),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(customersQuery);
    const customers = [];
    querySnapshot.forEach((doc) => {
      customers.push({ id: doc.id, ...doc.data() });
    });

    console.log(`נמצאו ${customers.length} לקוחות למשתמש ${currentUser.email}`);
    return customers;
  } catch (error) {
    console.error('שגיאה בקבלת רשימת לקוחות:', error);
    throw error;
  }
}; 