// Error Handling Service
// Centralized error handling and logging

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

class ErrorHandlingService {
  private errors: AppError[] = [];
  private maxErrors = 100;

  logError(
    code: string,
    message: string,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>,
    originalError?: Error
  ): AppError {
    const error: AppError = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code,
      message,
      severity,
      timestamp: new Date().toISOString(),
      context,
      stack: originalError?.stack,
    };

    this.errors.unshift(error);

    // Keep only last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${severity.toUpperCase()}] ${code}: ${message}`, context);
      if (originalError) {
        console.error(originalError);
      }
    }

    // For critical errors, could send to monitoring service
    if (severity === 'critical') {
      this.reportCriticalError(error);
    }

    return error;
  }

  private reportCriticalError(error: AppError): void {
    // In production, this would send to Sentry, LogRocket, etc.
    console.error('CRITICAL ERROR:', error);
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  getErrorsByCode(code: string): AppError[] {
    return this.errors.filter(e => e.code === code);
  }

  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export const errorHandler = new ErrorHandlingService();

// Error codes
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_SESSION_EXPIRED: 'AUTH_002',
  AUTH_UNAUTHORIZED: 'AUTH_003',

  // API errors
  API_NETWORK_ERROR: 'API_001',
  API_TIMEOUT: 'API_002',
  API_SERVER_ERROR: 'API_003',
  API_RATE_LIMITED: 'API_004',

  // Data errors
  DATA_NOT_FOUND: 'DATA_001',
  DATA_VALIDATION_FAILED: 'DATA_002',
  DATA_PARSE_ERROR: 'DATA_003',

  // Trading errors
  TRADE_INVALID_PARAMS: 'TRADE_001',
  TRADE_RISK_EXCEEDED: 'TRADE_002',
  TRADE_MARKET_CLOSED: 'TRADE_003',

  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_001',
  STORAGE_READ_ERROR: 'STORAGE_002',
  STORAGE_WRITE_ERROR: 'STORAGE_003',

  // General
  UNKNOWN_ERROR: 'UNKNOWN_001',
} as const;

// Helper functions
export const handleApiError = (error: any, context?: Record<string, any>): AppError => {
  if (error.message?.includes('network')) {
    return errorHandler.logError(
      ERROR_CODES.API_NETWORK_ERROR,
      'Network connection failed. Please check your internet connection.',
      'medium',
      context,
      error
    );
  }

  if (error.status === 401) {
    return errorHandler.logError(
      ERROR_CODES.AUTH_UNAUTHORIZED,
      'Your session has expired. Please log in again.',
      'medium',
      context,
      error
    );
  }

  if (error.status === 429) {
    return errorHandler.logError(
      ERROR_CODES.API_RATE_LIMITED,
      'Too many requests. Please wait a moment and try again.',
      'low',
      context,
      error
    );
  }

  if (error.status >= 500) {
    return errorHandler.logError(
      ERROR_CODES.API_SERVER_ERROR,
      'Server error. Please try again later.',
      'high',
      context,
      error
    );
  }

  return errorHandler.logError(
    ERROR_CODES.UNKNOWN_ERROR,
    error.message || 'An unexpected error occurred.',
    'medium',
    context,
    error
  );
};

export const handleTradeError = (error: any, tradeData?: any): AppError => {
  return errorHandler.logError(
    ERROR_CODES.TRADE_INVALID_PARAMS,
    error.message || 'Trade operation failed.',
    'high',
    { trade: tradeData },
    error
  );
};
