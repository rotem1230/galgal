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
    return customers;
  } catch (error) {
    console.error('שגיאה בקבלת רשימת לקוחות:', error);
    throw error;
  }
}; 