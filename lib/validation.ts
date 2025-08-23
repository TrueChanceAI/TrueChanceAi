// Validation schemas for server-side input validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

// File upload validation
export const validateFileUpload = (file: File | null, maxSize: number = 10 * 1024 * 1024): ValidationResult => {
  const errors: string[] = [];

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  // Check file size (10MB default)
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }

  // Check file type
  const allowedTypes = ['application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only PDF files are allowed');
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    errors.push('File must have .pdf extension');
  }

  // Additional security checks
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? file : undefined
  };
};

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Length validation
  if (email.length > 254) {
    errors.push('Email is too long');
  }

  // Check for suspicious patterns
  if (email.includes('..') || email.includes('--')) {
    errors.push('Email contains invalid characters');
  }

  // Sanitize email
  const sanitizedEmail = email.trim().toLowerCase();

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedEmail
  };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name) {
    errors.push('Name is required');
    return { isValid: false, errors };
  }

  // Length validation
  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (name.length > 100) {
    errors.push('Name is too long');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name)) {
      errors.push('Name contains invalid characters');
      break;
    }
  }

  // Sanitize name
  const sanitizedName = name.trim().replace(/[<>\"'&]/g, '');

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedName
  };
};

// Language validation
export const validateLanguage = (language: string): ValidationResult => {
  const errors: string[] = [];
  const allowedLanguages = ['en', 'ar'];

  if (!language) {
    errors.push('Language is required');
    return { isValid: false, errors };
  }

  if (!allowedLanguages.includes(language)) {
    errors.push('Invalid language selection');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: language
  };
};

// Resume text validation
export const validateResumeText = (text: string): ValidationResult => {
  const errors: string[] = [];

  if (!text) {
    errors.push('Resume text is required');
    return { isValid: false, errors };
  }

  // Length validation - more lenient for development
  if (text.length < 10) {
    errors.push('Resume text is too short (minimum 10 characters)');
  }

  if (text.length > 50000) {
    errors.push('Resume text is too long');
  }

  // Check for suspicious content
  const suspiciousContent = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i
  ];

  for (const pattern of suspiciousContent) {
    if (pattern.test(text)) {
      errors.push('Resume text contains invalid content');
      break;
    }
  }

  // Sanitize text
  const sanitizedText = text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizedText
  };
};

// Interview token validation
export const validateInterviewToken = (token: string): ValidationResult => {
  const errors: string[] = [];

  if (!token) {
    errors.push('Interview token is required');
    return { isValid: false, errors };
  }

  // Token format validation (UUID or alphanumeric)
  const tokenRegex = /^[a-zA-Z0-9-]+$/;
  if (!tokenRegex.test(token)) {
    errors.push('Invalid token format');
  }

  // Length validation
  if (token.length < 10 || token.length > 100) {
    errors.push('Invalid token length');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: token
  };
};

// Rate limiting helper
export const createRateLimiter = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (identifier: string): boolean => {
    const now = Date.now();
    const userRequests = requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (userRequests.count >= maxRequests) {
      return false;
    }

    userRequests.count++;
    return true;
  };
};

// Comprehensive validation for resume upload
export const validateResumeUpload = (data: {
  file: File | null;
  email: string;
  language: string;
  acceptedTerms: boolean;
}): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Validate file
  const fileValidation = validateFileUpload(data.file);
  if (!fileValidation.isValid) {
    errors.push(...fileValidation.errors);
  } else {
    sanitizedData.file = fileValidation.sanitizedData;
  }

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  } else {
    sanitizedData.email = emailValidation.sanitizedData;
  }

  // Validate language
  const languageValidation = validateLanguage(data.language);
  if (!languageValidation.isValid) {
    errors.push(...languageValidation.errors);
  } else {
    sanitizedData.language = languageValidation.sanitizedData;
  }

  // Validate terms acceptance
  if (!data.acceptedTerms) {
    errors.push('Terms and conditions must be accepted');
  } else {
    sanitizedData.acceptedTerms = true;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
};
