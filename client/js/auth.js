// Login and signup logic.
/* =========================================
   GLOBETROTTER - AUTH LOGIC
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initSignup();
});

// --- Login Logic ---
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail');
        const password = document.getElementById('loginPassword');
        let isValid = true;

        // Reset errors
        clearError(email, 'loginEmailError');
        clearError(password, 'loginPasswordError');

        // Validate Email
        if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            showError(email, 'loginEmailError');
            isValid = false;
        } else {
            showSuccess(email);
        }

        // Validate Password
        if (!password.value.trim() || password.value.length < 6) {
            showError(password, 'loginPasswordError');
            isValid = false;
        } else {
            showSuccess(password);
        }

        if (isValid) {
            // TODO: Connect to your backend API (server/src/controllers/authController.js)
            console.log('Login Data:', { email: email.value, password: password.value });
            alert('Login successful! Redirecting to Dashboard...');
            // window.location.href = 'dashboard.html';
        }
    });
}

// --- Signup Logic ---
function initSignup() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    // Photo Upload Preview
    const photoUploadBtn = document.getElementById('photoUploadBtn');
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');

    if (photoUploadBtn && photoInput) {
        photoUploadBtn.addEventListener('click', () => photoInput.click());

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    photoPreview.src = event.target.result;
                    photoPreview.style.display = 'block';
                    photoUploadBtn.querySelector('svg').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Form Submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fields = ['firstName', 'lastName', 'email', 'phone', 'city', 'country'];
        let isValid = true;

        // Clear previous states
        fields.forEach(field => {
            clearError(document.getElementById(field), `${field}Error`);
        });

        // Validate required fields
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                showError(input, `${field}Error`);
                isValid = false;
            } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                showError(input, `${field}Error`);
                isValid = false;
            } else {
                showSuccess(input);
            }
        });

        if (isValid) {
            // TODO: Connect to your backend API
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                city: document.getElementById('city').value,
                country: document.getElementById('country').value,
                additionalInfo: document.getElementById('additionalInfo').value
            };
            console.log('Signup Data:', formData);
            alert('Registration successful! Please login.');
            // window.location.href = 'login.html';
        }
    });
}

// --- Helper Functions ---
function showError(input, errorId) {
    input.classList.add('error');
    input.classList.remove('success');
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.classList.add('show');
}

function showSuccess(input) {
    input.classList.remove('error');
    input.classList.add('success');
}

function clearError(input, errorId) {
    input.classList.remove('error', 'success');
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.classList.remove('show');
}