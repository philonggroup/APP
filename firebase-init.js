// ============================================================
// CARDIY - Firebase Configuration & Authentication
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, updateProfile } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAJq16mE_4I5NEDoHuHkPPQJjh1-FU4a3k",
    authDomain: "cardiy-6b27b.firebaseapp.com",
      projectId: "cardiy-6b27b",
        storageBucket: "cardiy-6b27b.firebasestorage.app",
          messagingSenderId: "875643200086",
            appId: "1:875643200086:web:a6dadc829d0c7f300b51f7",
              measurementId: "G-7JV07BPQBJ"
              };

              // Initialize Firebase
              const app = initializeApp(firebaseConfig);
              const db = getFirestore(app);
              const auth = getAuth(app);
              const googleProvider = new GoogleAuthProvider();

              // ============================================================
              // AUTH FUNCTIONS
              // ============================================================

              // Dang ky bang email/password
              export async function registerWithEmail(email, password, fullName, phone) {
                try {
                  // Tao tai khoan Firebase Auth
                  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                  const user = userCredential.user;
                  // Cap nhat display name (khong blocking neu loi)
                  updateProfile(user, { displayName: fullName }).catch(() => {});
                  // Luu thong tin user vao Firestore
                  await setDoc(doc(db, "users", user.uid), {
                    fullName: fullName || email.split('@')[0],
                    phone,
                    email,
                    role: "customer",
                    createdAt: new Date().toISOString(),
                    uid: user.uid
                  });
                  return { success: true, user };
                } catch (error) {
                  const code = error.code || '';
                  let msg = error.message;
                  if (code === 'auth/email-already-in-use') msg = 'Email nay da duoc su dung. Vui long dang nhap hoac dung email khac.';
                  else if (code === 'auth/weak-password') msg = 'Mat khau qua yeu. Vui long dung it nhat 6 ky tu.';
                  else if (code === 'auth/invalid-email') msg = 'Email khong hop le.';
                  else if (code === 'auth/network-request-failed') msg = 'Loi ket noi mang. Vui long kiem tra internet va thu lai.';
                  else if (code === 'permission-denied') msg = 'Loi quyen truy cap. Vui long lien he ho tro.';
                  return { success: false, error: msg, code };
                }
              }
                                                                                        export async function loginWithEmail(email, password) {
                                                                                          try {
                                                                                              const userCredential = await signInWithEmailAndPassword(auth, email, password);
                                                                                                  return { success: true, user: userCredential.user };
                                                                                                    } catch (error) {
                                                                                                        return { success: false, error: error.message };
                                                                                                          }
                                                                                                          }
                                                                                                          
                                                                                                          // Dang nhap bang Google
                                                                                                          export async function loginWithGoogle() {
                                                                                                            try {
                                                                                                                const result = await signInWithPopup(auth, googleProvider);
                                                                                                                    const user = result.user;
                                                                                                                        // Kiem tra neu user chua co trong Firestore
                                                                                                                            const userDoc = await getDoc(doc(db, "users", user.uid));
                                                                                                                                if (!userDoc.exists()) {
                                                                                                                                      await setDoc(doc(db, "users", user.uid), {
                                                                                                                                              fullName: user.displayName,
                                                                                                                                                      email: user.email,
                                                                                                                                                              phone: "",
                                                                                                                                                                      role: "customer",
                                                                                                                                                                              createdAt: new Date().toISOString(),
                                                                                                                                                                                      uid: user.uid,
                                                                                                                                                                                              photoURL: user.photoURL
                                                                                                                                                                                                    });
                                                                                                                                                                                                        }
                                                                                                                                                                                                            return { success: true, user };
                                                                                                                                                                                                              } catch (error) {
                                                                                                                                                                                                                  return { success: false, error: error.message };
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                    
                                                                                                                                                                                                                    // Dang xuat
                                                                                                                                                                                                                    export async function logout() {
                                                                                                                                                                                                                      await signOut(auth);
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                      
                                                                                                                                                                                                                      // Lang nghe trang thai dang nhap
                                                                                                                                                                                                                      export function onAuthChange(callback) {
                                                                                                                                                                                                                        return onAuthStateChanged(auth, callback);
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                        
                                                                                                                                                                                                                        // Lay thong tin user hien tai
                                                                                                                                                                                                                        export function getCurrentUser() {
                                                                                                                                                                                                                          return auth.currentUser;
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                          
                                                                                                                                                                                                                          // ============================================================
                                                                                                                                                                                                                          // FIRESTORE FUNCTIONS - BOOKINGS
                                                                                                                                                                                                                          // ============================================================
                                                                                                                                                                                                                          
                                                                                                                                                                                                                          // Tao booking moi
                                                                                                                                                                                                                          export async function createBooking(bookingData) {
                                                                                                                                                                                                                            try {
                                                                                                                                                                                                                                const user = auth.currentUser;
                                                                                                                                                                                                                                    if (!user) return { success: false, error: "Chua dang nhap" };
                                                                                                                                                                                                                                        const docRef = await addDoc(collection(db, "bookings"), {
                                                                                                                                                                                                                                              ...bookingData,
                                                                                                                                                                                                                                                    userId: user.uid,
                                                                                                                                                                                                                                                          status: "pending",
                                                                                                                                                                                                                                                                createdAt: new Date().toISOString()
                                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                                        return { success: true, id: docRef.id };
                                                                                                                                                                                                                                                                          } catch (error) {
                                                                                                                                                                                                                                                                              return { success: false, error: error.message };
                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                // Lay danh sach booking cua user
                                                                                                                                                                                                                                                                                export async function getUserBookings() {
                                                                                                                                                                                                                                                                                  try {
                                                                                                                                                                                                                                                                                      const user = auth.currentUser;
                                                                                                                                                                                                                                                                                          if (!user) return [];
                                                                                                                                                                                                                                                                                              const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
                                                                                                                                                                                                                                                                                                  const snapshot = await getDocs(q);
                                                                                                                                                                                                                                                                                                      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                                                                                                                                                                                                                                                                                        } catch (error) {
                                                                                                                                                                                                                                                                                                            console.error("Loi lay bookings:", error);
                                                                                                                                                                                                                                                                                                                return [];
                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                  // Lay danh sach dich vu
                                                                                                                                                                                                                                                                                                                  export async function getServices() {
                                                                                                                                                                                                                                                                                                                    try {
                                                                                                                                                                                                                                                                                                                        const snapshot = await getDocs(collection(db, "services"));
                                                                                                                                                                                                                                                                                                                            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                                                                                                                                                                                                                                                                                                              } catch (error) {
                                                                                                                                                                                                                                                                                                                                  console.error("Loi lay services:", error);
                                                                                                                                                                                                                                                                                                                                      return [];
                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                        // Lay thong tin xe cua user
                                                                                                                                                                                                                                                                                                                                        export async function getUserCars() {
                                                                                                                                                                                                                                                                                                                                          try {
                                                                                                                                                                                                                                                                                                                                              const user = auth.currentUser;
                                                                                                                                                                                                                                                                                                                                                  if (!user) return [];
                                                                                                                                                                                                                                                                                                                                                      const q = query(collection(db, "cars"), where("userId", "==", user.uid));
                                                                                                                                                                                                                                                                                                                                                          const snapshot = await getDocs(q);
                                                                                                                                                                                                                                                                                                                                                              return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                                                                                                                                                                                                                                                                                                                                                } catch (error) {
                                                                                                                                                                                                                                                                                                                                                                    console.error("Loi lay cars:", error);
                                                                                                                                                                                                                                                                                                                                                                        return [];
                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                          // ============================================================
                                                                                                                                                                                                                                                                                                                                                                          // EXPORT DB & AUTH INSTANCES
                                                                                                                                                                                                                                                                                                                                                                          // ============================================================
                                                                                                                                                                                                                                                                                                                                                                          export { db, auth };
                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                          // ============================================================
                                                                                                                                                                                                                                                                                                                                                                          // GLOBAL - de dung trong app.html
                                                                                                                                                                                                                                                                                                                                                                          // ============================================================
                                                                                                                                                                                                                                                                                                                                                                          window.CARDIY_FIREBASE = {
                                                                                                                                                                                                                                                                                                                                                                            registerWithEmail,
                                                                                                                                                                                                                                                                                                                                                                              loginWithEmail,
                                                                                                                                                                                                                                                                                                                                                                                loginWithGoogle,
                                                                                                                                                                                                                                                                                                                                                                                  logout,
                                                                                                                                                                                                                                                                                                                                                                                    onAuthChange,
                                                                                                                                                                                                                                                                                                                                                                                      getCurrentUser,
                                                                                                                                                                                                                                                                                                                                                                                        createBooking,
                                                                                                                                                                                                                                                                                                                                                                                          getUserBookings,
                                                                                                                                                                                                                                                                                                                                                                                            getServices,
                                                                                                                                                                                                                                                                                                                                                                                              getUserCars
                                                                                                                                                                                                                                                                                                                                                                                              };
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                              
// ============================================================
// FIRESTORE FUNCTIONS - USER PROFILE
// ============================================================

// Lay thong tin profile user tu Firestore
export async function getUserProfile() {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Chua dang nhap" };
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: true, data: { fullName: user.displayName || '', email: user.email || '', phone: '' } };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Cap nhat thong tin profile user len Firestore
export async function updateUserProfile(profileData) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Chua dang nhap" };
    await updateDoc(doc(db, "users", user.uid), {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    // Also update Firebase Auth displayName if fullName changed
    if (profileData.fullName) {
      updateProfile(user, { displayName: profileData.fullName }).catch(() => {});
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

console.log("Firebase CARDIY initialized successfully!");
