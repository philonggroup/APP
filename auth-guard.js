// auth-guard.js - Firebase Auth Guard for CARDIY App
// Redirect to login.html if user is not authenticated

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAJq16mE_4I5NEDoHuHkPPQJjh1-FU4a3k",
    authDomain: "cardiy-6b27b.firebaseapp.com",
    projectId: "cardiy-6b27b",
    storageBucket: "cardiy-6b27b.firebasestorage.app",
    messagingSenderId: "1046867143898",
    appId: "1:1046867143898:web:a6dadc829d0c7f300b51f7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Monitor auth state - redirect to login if not authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
          // Not logged in - redirect to login page
      window.location.href = 'login.html';
    } else {
          // User is logged in
      const userName = user.displayName || user.email || 'Nguoi dung';
          const userEmail = user.email || '';

      // Update UI elements if they exist
      const userNameEl = document.getElementById('user-name');
          const userEmailEl = document.getElementById('user-email');
          const userAvatarEl = document.getElementById('user-avatar');

      if (userNameEl) userNameEl.textContent = userName;
          if (userEmailEl) userEmailEl.textContent = userEmail;
          if (userAvatarEl && user.photoURL) {
                  userAvatarEl.src = user.photoURL;
                  userAvatarEl.alt = userName;
          }

      // Store user info globally
      window.currentUser = {
              uid: user.uid,
              name: userName,
              email: userEmail,
              photoURL: user.photoURL,
              isLoggedIn: true
      };

      // Notify other scripts that auth is ready
      document.dispatchEvent(new CustomEvent('authReady', { detail: { user: window.currentUser } }));
          console.log('CARDIY: Logged in as', userName);
    }
});

// Global logout function
window.logoutUser = async () => {
    try {
          await signOut(auth);
          window.location.href = 'login.html';
    } catch (error) {
          console.error('Logout error:', error);
          alert('Loi dang xuat. Vui long thu lai.');
    }
};
