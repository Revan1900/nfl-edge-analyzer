// Input validation utilities for edge functions

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Rate limiting storage (in-memory for edge functions)
const rateLimitStore = new Map<string, { attempts: number; resetAt: number }>();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.attempts >= maxAttempts) {
    return false;
  }

  record.attempts++;
  return true;
}

export function validateAuthInput(email: string, password: string): ValidationResult {
  // Sanitize and validate email
  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Invalid input' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid input' };
  }
  
  // Validate password
  if (password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8 || password.length > 128) {
    return { valid: false, error: 'Invalid input' };
  }
  
  return { valid: true };
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}
