// auth-guard.js - Firebase Auth Guard for CARDIY App
// Redirect to login.html if user is not authenticated
// FIX: import tu firebase-init.js de tranh xung dot instance

import { onAuthChange } from './firebase-init.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

// Monitor auth state - redirect to login if not authenticated
onAuthChange((user) => {
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
                    const auth = getAuth();
                    await signOut(auth);
                    window.location.href = 'login.html';
        } catch (error) {
                    console.error('Logout error:', error);
                    alert('Loi dang xuat. Vui long thu lai.');
        }
};
