export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: EXACTLY 8 chars, uppercase, lowercase, number
 *
 * Changed from "min 8 chars" to "exactly 8 chars" to match the segmented
 * 8-box password input UI in Auth.tsx — the UI physically cannot accept
 * more than 8 characters, so validation must match exactly or a password
 * that's valid by this rule could be impossible to type, or vice versa.
 */
export const validatePassword = (password: string): ValidationResult => {
  if (password.length !== 8) {
    return {
      valid: false,
      message: 'Password must be exactly 8 characters long',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number',
    };
  }

  return {
    valid: true,
    message: 'Password is strong',
  };
};

/**
 * Validate card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Check if it's all digits and has valid length
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate expiry date (MM/YY format, not in past)
 */
export const validateExpiryDate = (expiry: string): boolean => {
  // Check format MM/YY
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!expiryRegex.test(expiry)) {
    return false;
  }

  const [month, year] = expiry.split('/');
  const expiryDate = new Date(2000 + parseInt(year, 10), parseInt(month, 10), 0);
  const today = new Date();

  return expiryDate >= today;
};

/**
 * Validate CVV (3-4 digits)
 */
export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

/**
 * Validate name (min 2 chars)
 */
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

/**
 * Validate ZIP code (US format: 5 digits or 5+4 digits)
 */
export const validateZipCode = (zipCode: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
};

/**
 * Validate phone number (US format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return /^\d{10}$/.test(cleaned);
};

/**
 * Validate required field
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};