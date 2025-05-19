import { base44 } from './base44Client';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, // To record creation/update times
    query, 
    orderBy, // Optional: To order categories by name or creation time
    where, // Import where for querying
    limit, // Import limit to get only one doc when checking existence
    getDoc // To get a single document by ID
} from "firebase/firestore";
import { db } from "../firebase-config"; // Import the initialized db

// Define the collection reference
const categoriesCollectionRef = collection(db, "categories");

export class Category {
    // Method to list all categories
    static async list() {
        try {
            // Optional: Order by name
            const q = query(categoriesCollectionRef, orderBy("name")); 
            const data = await getDocs(q);
            return data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (error) {
            console.error("Error fetching categories:", error);
            throw error; // Re-throw the error to be handled by the caller
        }
    }

    // Method to create a new category
    static async create(categoryData) {
        try {
            const docRef = await addDoc(categoriesCollectionRef, {
                ...categoryData,
                createdAt: serverTimestamp() // Add creation timestamp
            });
            return { ...categoryData, id: docRef.id, createdAt: new Date() }; // Return optimistic data
        } catch (error) {
            console.error("Error creating category:", error);
            throw error;
        }
    }

    // Method to update an existing category
    static async update(id, updatedData) {
        try {
            const categoryDoc = doc(db, "categories", id);
            await updateDoc(categoryDoc, {
                ...updatedData,
                updatedAt: serverTimestamp() // Add update timestamp
            });
        } catch (error) {
            console.error(`Error updating category ${id}:`, error);
            throw error;
        }
    }

    // Method to delete a category
    static async delete(id) {
        try {
            const categoryDoc = doc(db, "categories", id);
            await deleteDoc(categoryDoc);
        } catch (error) {
            console.error(`Error deleting category ${id}:`, error);
            throw error;
        }
    }
}

// Define the products collection reference
const productsCollectionRef = collection(db, "products");

export class Product {
    // Method to list all products
    static async list() {
        try {
             // Optional: Order by name
            const q = query(productsCollectionRef, orderBy("name"));
            const data = await getDocs(q);
            return data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    }

    // Method to create a new product
    static async create(productData) {
        try {
            const docRef = await addDoc(productsCollectionRef, {
                ...productData,
                createdAt: serverTimestamp()
            });
             // Return optimistic data including the generated ID
            return { ...productData, id: docRef.id, createdAt: new Date() };
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    }

    // Method to update an existing product
    static async update(id, updatedData) {
        try {
            const productDoc = doc(db, "products", id);
            await updateDoc(productDoc, {
                ...updatedData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error updating product ${id}:`, error);
            throw error;
        }
    }

    // Method to delete a product
    static async delete(id) {
        try {
            const productDoc = doc(db, "products", id);
            await deleteDoc(productDoc);
        } catch (error) {
            console.error(`Error deleting product ${id}:`, error);
            throw error;
        }
    }
}

// Define the customers collection reference
const customersCollectionRef = collection(db, "customers");

export class Customer {
    // Method to list all customers
    static async list() {
        try {
            // Optional: Order by name
            const q = query(customersCollectionRef, orderBy("name")); 
            const data = await getDocs(q);
            return data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (error) {
            console.error("Error fetching customers:", error);
            throw error;
        }
    }

    // Method to create a new customer
    static async create(customerData) {
        // The customerData might include 'authUid' from CustomersPage
        try {
            const dataToSave = {
                ...customerData,
                createdAt: serverTimestamp()
            };
            // Remove password if it accidentally got passed along
            // (Shouldn't happen with current CustomersPage logic, but good practice)
            delete dataToSave.password; 
            
            const docRef = await addDoc(customersCollectionRef, dataToSave);
            return { ...dataToSave, id: docRef.id, createdAt: new Date() };
        } catch (error) {
            console.error("Error creating customer:", error);
            throw error;
        }
    }

    // Method to update an existing customer
    static async update(id, updatedData) {
        try {
            const customerDoc = doc(db, "customers", id);
            const dataToUpdate = {
                ...updatedData,
                updatedAt: serverTimestamp()
            };
             // Ensure we don't try to save undefined fields potentially left from the form state
            Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
            // Remove password if it exists
            delete dataToUpdate.password; 
            // We generally don't update authUid here, it's set on creation
            delete dataToUpdate.authUid; 

            await updateDoc(customerDoc, dataToUpdate);
        } catch (error) {
            console.error(`Error updating customer ${id}:`, error);
            throw error;
        }
    }

    // Method to delete a customer
    static async delete(id) {
         // ** Important Reminder: Deleting the customer here ONLY removes them from Firestore. **
         // ** You MUST implement a separate mechanism (e.g., a Firebase Function) **
         // ** to delete the corresponding user from Firebase Authentication. **
         // ** Otherwise, the user can still log in but won't have associated customer data. **
        try {
            const customerDoc = doc(db, "customers", id);
            await deleteDoc(customerDoc);
        } catch (error) {
            console.error(`Error deleting customer ${id}:`, error);
            throw error;
        }
    }
}

// Define the orders collection reference
const ordersCollectionRef = collection(db, "orders");

export class Order {
    // Method to list all orders
    static async list() {
        try {
            // Order by creation date, newest first
            const q = query(ordersCollectionRef, orderBy("createdAt", "desc")); 
            const data = await getDocs(q);
            // Convert Firestore Timestamps to JS Date objects for easier use in the UI
            return data.docs.map(doc => { 
                const orderData = doc.data();
                return {
                     ...orderData, 
                     id: doc.id,
                     // Convert timestamp fields if they exist
                     createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : null,
                     updatedAt: orderData.updatedAt?.toDate ? orderData.updatedAt.toDate() : null
                };
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw error;
        }
    }

    // Method to create a new order
    // This will likely be used more by the client app, but good to have
    static async create(orderData) {
        // Expects orderData to include customerId, customerName, items array, totalAmount, etc.
        // May also include `clientAuthUid` if created by a logged-in client.
        try {
            const docRef = await addDoc(ordersCollectionRef, {
                ...orderData,
                status: orderData.status || 'new', // Default status
                createdAt: serverTimestamp()
            });
            return { ...orderData, id: docRef.id, createdAt: new Date(), status: orderData.status || 'new' };
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    }

    // Method to update an existing order (e.g., change status)
    static async update(id, updatedData) {
        try {
            const orderDoc = doc(db, "orders", id);
            await updateDoc(orderDoc, {
                ...updatedData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error updating order ${id}:`, error);
            throw error;
        }
    }

    // Method to delete an order
    static async delete(id) {
        try {
            const orderDoc = doc(db, "orders", id);
            await deleteDoc(orderDoc);
        } catch (error) {
            console.error(`Error deleting order ${id}:`, error);
            throw error;
        }
    }
    
    // Method to get a single order by ID (potentially useful)
    static async get(id) {
        try {
            const orderDoc = doc(db, "orders", id);
            const docSnap = await getDoc(orderDoc);
            if (docSnap.exists()) {
                 const orderData = docSnap.data();
                 return {
                    ...orderData,
                    id: docSnap.id,
                    createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : null,
                    updatedAt: orderData.updatedAt?.toDate ? orderData.updatedAt.toDate() : null
                 };
            } else {
                console.log("No such order document!");
                return null;
            }
        } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            throw error;
        }
    }
}

// Define the customer_pricing collection reference
const customerPricingCollectionRef = collection(db, "customer_pricing");

export class CustomerPricing {
    // Method to list all pricing rules (potentially useful for admin overview, but usually queried by customer/product)
    static async list() {
        try {
            const data = await getDocs(customerPricingCollectionRef);
            return data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (error) {
            console.error("Error fetching customer pricing:", error);
            throw error;
        }
    }

    // Method to find a specific pricing rule
    static async find(customerId, productId, variationIndex = -1) {
        try {
            const q = query(
                customerPricingCollectionRef,
                where("customer_id", "==", customerId),
                where("product_id", "==", productId),
                where("variation_index", "==", variationIndex),
                limit(1) // We only expect one or zero matching rules
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { ...doc.data(), id: doc.id };
            } else {
                return null; // No specific pricing found
            }
        } catch (error) {
            console.error("Error finding customer price:", error);
            throw error;
        }
    }

    // Method to create a new pricing rule
    static async create(pricingData) {
         // pricingData should contain customer_id, product_id, variation_index, price_before_vat, price_with_vat
        try {
            // Check if a rule already exists before creating
            const existing = await this.find(pricingData.customer_id, pricingData.product_id, pricingData.variation_index);
            if (existing) {
                console.warn("Pricing rule already exists, updating instead.");
                return this.update(existing.id, pricingData); 
            }
            
            const docRef = await addDoc(customerPricingCollectionRef, {
                ...pricingData,
                createdAt: serverTimestamp()
            });
            return { ...pricingData, id: docRef.id, createdAt: new Date() };
        } catch (error) {
            console.error("Error creating customer price:", error);
            throw error;
        }
    }

    // Method to update an existing pricing rule by its Firestore ID
    static async update(id, updatedData) {
        try {
            const pricingDoc = doc(db, "customer_pricing", id);
            await updateDoc(pricingDoc, {
                ...updatedData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error updating customer price ${id}:`, error);
            throw error;
        }
    }

    // Method to delete a pricing rule by its Firestore ID
    static async delete(id) {
        try {
            const pricingDoc = doc(db, "customer_pricing", id);
            await deleteDoc(pricingDoc);
        } catch (error) {
            console.error(`Error deleting customer price ${id}:`, error);
            throw error;
        }
    }
}

// auth sdk:
// export const User = base44.auth;