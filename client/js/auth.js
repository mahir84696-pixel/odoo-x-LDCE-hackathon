document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initLogin();
  initSignup();
  initForgotPassword();
});

function initPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';
    });
  });
}

function initLogin() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');
    const submit = loginForm.querySelector('button[type="submit"]');
    let isValid = true;

    clearError(email, 'loginEmailError');
    clearError(password, 'loginPasswordError');

    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showError(email, 'loginEmailError');
      isValid = false;
    } else {
      showSuccess(email);
    }

    if (!password.value.trim() || password.value.length < 6) {
      showError(password, 'loginPasswordError');
      isValid = false;
    } else {
      showSuccess(password);
    }

    if (!isValid) return;

    submit.disabled = true;
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value
        })
      });
      setSession(data.token, data.user);
      showToast('Welcome back. Redirecting...', 'success');
      window.location.href = 'dashboard.html';
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

function initSignup() {
  const signupForm = document.getElementById('signupForm');
  if (!signupForm) return;

  const photoUploadBtn = document.getElementById('photoUploadBtn');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  let photoData = null;

  if (photoUploadBtn && photoInput) {
    photoUploadBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
        showToast('Please choose a JPG, PNG, or WEBP image.', 'error');
        photoInput.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('Photo must be 2 MB or smaller.', 'error');
        photoInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        photoData = event.target.result;
        photoPreview.src = photoData;
        photoUploadBtn.classList.add('has-photo');
      };
      reader.readAsDataURL(file);
    });
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields = ['firstName', 'lastName', 'email', 'phone', 'city', 'country', 'password'];
    const submit = signupForm.querySelector('button[type="submit"]');
    let isValid = true;

    fields.forEach((field) => {
      clearError(document.getElementById(field), `${field}Error`);
    });
    clearError(document.getElementById('confirmPassword'), 'confirmPasswordError');

    fields.forEach((field) => {
      const input = document.getElementById(field);
      if (!input.value.trim()) {
        showError(input, `${field}Error`);
        isValid = false;
      } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        showError(input, `${field}Error`);
        isValid = false;
      } else if (field === 'password' && input.value.length < 6) {
        showError(input, `${field}Error`);
        isValid = false;
      } else {
        showSuccess(input);
      }
    });

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    if (password.value !== confirmPassword.value) {
      showError(confirmPassword, 'confirmPasswordError');
      isValid = false;
    } else if (confirmPassword.value) {
      showSuccess(confirmPassword);
    }

    if (!isValid) return;

    submit.disabled = true;
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: document.getElementById('firstName').value.trim(),
          lastName: document.getElementById('lastName').value.trim(),
          email: document.getElementById('email').value.trim(),
          phone: document.getElementById('phone').value.trim(),
          city: document.getElementById('city').value.trim(),
          country: document.getElementById('country').value.trim(),
          additionalInfo: document.getElementById('additionalInfo').value.trim(),
          password: password.value,
          photo: photoData
        })
      });
      showToast('Account created. Redirecting to login...', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 700);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

function initForgotPassword() {
  const link = document.getElementById('forgotPasswordLink');
  const modal = document.getElementById('forgotModal');
  const form = document.getElementById('forgotForm');
  const close = document.getElementById('closeForgot');
  if (!link || !modal || !form) return;

  link.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('show');
  });
  close?.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    try {
      const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      modal.classList.remove('show');
      showToast(data.message, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function showToast(message, type) {
  const toast = document.getElementById('authToast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
}

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
  if (!input) return;
  input.classList.remove('error', 'success');
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.classList.remove('show');
}
