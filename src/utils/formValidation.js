export const formValidation = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  validatePassword: (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const isValid = Object.values(requirements).every(req => req);
    return {
      isValid,
      requirements,
      message: isValid 
        ? 'Password meets all requirements'
        : 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
    };
  },

  validateKenyanPhoneNumber: (phone) => {
    if (!phone || !phone.trim()) return true;
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    return phoneRegex.test(phone.trim());
  },

  validateUsername: (username) => {
    if (!username.trim()) return false;
    return username.length >= 3 && username.length <= 30;
  },

  checkEmailProviderSupport: (email) => {
    const supportedProviders = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'mail.com',
      'protonmail.com',
      'tutanota.com',
      'co.ke',
      'ac.ke',
      'or.ke',
      'go.ke',
      'net.ke',
      'org.ke',
      'mobi.ke'
    ];

    const domain = email.toLowerCase().split('@')[1];
    return supportedProviders.some(provider => domain.endsWith(provider));
  },

  validateSignUpForm: (formData) => {
    const errors = {};

    if (!formData.username?.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      errors.username = 'Username must not exceed 30 characters';
    }

    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!formValidation.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (!formValidation.checkEmailProviderSupport(formData.email)) {
      errors.email = 'Email provider not supported. Please use a common email provider.';
    }

    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (formData.phoneNumber?.trim()) {
      if (!formValidation.validateKenyanPhoneNumber(formData.phoneNumber)) {
        errors.phoneNumber = 'Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)';
      }
    }

    if (!formData.password?.trim()) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = formValidation.validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
      }
    }

    if (!formData.confirmPassword?.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.acceptTerms === false) {
      errors.acceptTerms = 'You must accept the Terms and Conditions';
    }

    if (formData.acceptPrivacy === false) {
      errors.acceptPrivacy = 'You must accept the Privacy Policy';
    }

    return errors;
  },

  validateLoginForm: (email, password) => {
    const errors = {};

    if (!email?.trim()) {
      errors.email = 'Email is required';
    } else if (!formValidation.validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password?.trim()) {
      errors.password = 'Password is required';
    }

    return errors;
  },

  validateOrderForm: (formData) => {
    const errors = {};

    if (!formData.title?.trim()) {
      errors.title = 'Order title is required';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.pickupLocation?.trim()) {
      errors.pickupLocation = 'Pickup location is required';
    }

    if (formData.serviceType === 'Pickup & Delivery' && !formData.deliveryLocation?.trim()) {
      errors.deliveryLocation = 'Delivery location is required for this service type';
    }

    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      errors.budget = 'Budget must be a valid number';
    }

    return errors;
  },

  validatePaymentForm: (formData) => {
    const errors = {};

    if (!formData.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!formValidation.validateKenyanPhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid Kenyan phone number';
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      errors.amount = 'Please enter a valid amount';
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    return errors;
  },

  sanitizeInput: (input) => {
    if (!input) return '';
    return input.trim().replace(/[<>]/g, '');
  },

  formatPhoneNumber: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('0')) {
      return '+254' + cleaned.substring(1);
    }
    return '+254' + cleaned;
  }
};

export default formValidation;
