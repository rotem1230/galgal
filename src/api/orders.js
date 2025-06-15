export const createOrder = async (orderData) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('משתמש לא מחובר');

    const orderWithMetadata = {
      ...orderData,
      managedBy: currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending'
    };

    const docRef = await addDoc(collection(db, 'orders'), orderWithMetadata);
    console.log('הזמנה נוצרה בהצלחה עם ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('שגיאה ביצירת הזמנה:', error);
    throw error;
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('משתמש לא מחובר');

    const orderWithMetadata = {
      ...orderData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(orderRef, orderWithMetadata);
    console.log('הזמנה עודכנה בהצלחה');
  } catch (error) {
    console.error('שגיאה בעדכון הזמנה:', error);
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('משתמש לא מחובר');

    const ordersQuery = query(
      collection(db, 'orders'),
      where('managedBy', '==', currentUser.email),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error('שגיאה בקבלת רשימת הזמנות:', error);
    throw error;
  }
}; 