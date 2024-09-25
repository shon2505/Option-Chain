// Validation for Login and Signup Forms

// Function to show error messages
function showError(element, message) {
    const errorElement = document.getElementById(element + 'Error');
    errorElement.innerText = message;
    errorElement.style.display = 'block';
}

// Function to hide error messages
function hideError(element) {
    const errorElement = document.getElementById(element + 'Error');
    errorElement.style.display = 'none';
}

// Validate email using regex
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate mobile number using regex (10 digits)
function validateMobile(mobile) {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
}

// Validation for Login Form
function validateLoginForm(e) {
    let valid = true;

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Reset error visibility
    hideError('username');
    hideError('password');

    // Validate username
    if (!username) {
        showError('username', 'Username is required');
        valid = false;
    }

    // Validate password
    if (!password) {
        showError('password', 'Password is required');
        valid = false;
    } else if (password.length < 6) {
        showError('password', 'Password must be at least 6 characters');
        valid = false;
    }

    // Prevent form submission if invalid
    if (!valid) {
        e.preventDefault();
    }
}

// Validation for Signup Form
function validateSignupForm(e) {
    let valid = true;

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const mobile = document.getElementById('mobile').value; // New mobile field
    const password = document.getElementById('password').value;

    // Reset error visibility
    hideError('username');
    hideError('email');
    hideError('mobile'); // Reset mobile error
    hideError('password');

    // Validate Username
    if (!username) {
        showError('username', 'Username is required');
        valid = false;
    } else if (username.length < 3 || username.length > 15) {
        showError('username', 'Username must be between 3 and 15 characters');
        valid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError('username', 'Username can only contain letters, numbers, and underscores');
        valid = false;
    }

    // Validate Email
    if (!email) {
        showError('email', 'Email is required');
        valid = false;
    } else if (!validateEmail(email)) {
        showError('email', 'Invalid email address');
        valid = false;
    }

    // Validate Mobile
    if (!mobile) {
        showError('mobile', 'Mobile number is required');
        valid = false;
    } else if (!validateMobile(mobile)) {
        showError('mobile', 'Invalid mobile number. It must be 10 digits.');
        valid = false;
    }

    // Validate Password
    if (!password) {
        showError('password', 'Password is required');
        valid = false;
    } else if (password.length < 6) {
        showError('password', 'Password must be at least 6 characters');
        valid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
        showError('password', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        valid = false;
    }

    // Prevent form submission if invalid
    if (!valid) {
        e.preventDefault();
    }
}

// Attach event listeners to forms
document.getElementById('loginForm')?.addEventListener('submit', validateLoginForm);
document.getElementById('signupForm')?.addEventListener('submit', validateSignupForm);

// Dynamic validation for signup form
document.getElementById('username')?.addEventListener('input', () => {
    hideError('username');
});
document.getElementById('email')?.addEventListener('input', () => {
    hideError('email');
});
document.getElementById('mobile')?.addEventListener('input', () => {  // Mobile input event
    hideError('mobile');
});
document.getElementById('password')?.addEventListener('input', () => {
    hideError('password');
});

// Dynamic validation for login form
document.getElementById('username')?.addEventListener('input', () => {
    hideError('username');
});
document.getElementById('password')?.addEventListener('input', () => {
    hideError('password');
});
