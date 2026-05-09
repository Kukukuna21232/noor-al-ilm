// ═════════════════════════════════════════════════════════════════════════════
// NOOR AL-ILM ERROR HANDLING SYSTEM
// Version: 1.0.0
// Description: Comprehensive error handling and logging system
// ═════════════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import winston from 'winston';
import { config } from '../config/environment';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
}

// Custom error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    code?: string,
    metadata?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.category = category;
    this.severity = severity;
    this.isOperational = isOperational;
    this.code = code;
    this.metadata = metadata;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  // Static factory methods for common errors
  static badRequest(message: string, metadata?: Record<string, any>): AppError {
    return new AppError(message, 400, ErrorCategory.VALIDATION, ErrorSeverity.LOW, true, 'BAD_REQUEST', metadata);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401, ErrorCategory.AUTHENTICATION, ErrorSeverity.MEDIUM, true, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, 403, ErrorCategory.AUTHORIZATION, ErrorSeverity.MEDIUM, true, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, 404, ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.LOW, true, 'NOT_FOUND');
  }

  static conflict(message: string, metadata?: Record<string, any>): AppError {
    return new AppError(message, 409, ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, true, 'CONFLICT', metadata);
  }

  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429, ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM, true, 'TOO_MANY_REQUESTS');
  }

  static internal(message: string, metadata?: Record<string, any>): AppError {
    return new AppError(message, 500, ErrorCategory.SYSTEM, ErrorSeverity.HIGH, false, 'INTERNAL_ERROR', metadata);
  }

  static serviceUnavailable(message: string = 'Service temporarily unavailable'): AppError {
    return new AppError(message, 503, ErrorCategory.SYSTEM, ErrorSeverity.HIGH, true, 'SERVICE_UNAVAILABLE');
  }
}

// Winston logger configuration
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: {
    service: 'noor-al-ilm-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: config.nodeEnv === 'development' ? 'debug' : 'info',
    }),
    
    // File transports for production
    ...(config.nodeEnv === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
    ] : []),
    
    // External logging service (Sentry, etc.)
    ...(config.sentryDsn ? [
      new winston.transports.Http({
        host: 'sentry.io',
        path: `/api/${config.sentryDsn.split('/').pop()}/store/`,
        level: 'error',
      }),
    ] : []),
  ],
});

// Error logging utility
export const logError = (error: Error, context?: Record<string, any>): void => {
  const logData = {
    message: error.message,
    stack: error.stack,
    ...(error instanceof AppError && {
      category: error.category,
      severity: error.severity,
      statusCode: error.statusCode,
      code: error.code,
      metadata: error.metadata,
    }),
    ...context,
  };

  if (error instanceof AppError && error.severity === ErrorSeverity.CRITICAL) {
    logger.error('Critical error occurred', logData);
  } else if (error instanceof AppError && error.severity === ErrorSeverity.HIGH) {
    logger.error('High severity error', logData);
  } else {
    logger.warn('Application error', logData);
  }
};

// Database error handler
export const handleDatabaseError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return AppError.conflict('Resource already exists', {
        field: error.meta?.target,
        value: error.meta?.target_value,
      });
    case 'P2025':
      return AppError.notFound('Record not found');
    case 'P2003':
      return AppError.badRequest('Foreign key constraint failed', {
        field: error.meta?.field_name,
      });
    case 'P2014':
      return AppError.badRequest('Invalid relation', {
        relation: error.meta?.relation_name,
      });
    default:
      return AppError.internal('Database operation failed', {
        prismaCode: error.code,
        prismaMessage: error.message,
      });
  }
};

// JWT error handler
export const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return AppError.unauthorized('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    return AppError.unauthorized('Token expired');
  } else if (error.name === 'NotBeforeError') {
    return AppError.unauthorized('Token not active');
  } else {
    return AppError.unauthorized('Authentication error');
  }
};

// Validation error handler
export const handleValidationError = (error: any): AppError => {
  const details = error.details?.map((detail: any) => ({
    field: detail.path?.join('.'),
    message: detail.message,
    value: detail.context?.value,
  }));

  return AppError.badRequest('Validation failed', {
    validationErrors: details,
  });
};

// External API error handler
export const handleExternalAPIError = (error: any): AppError => {
  const statusCode = error.response?.status || 500;
  const message = error.response?.data?.message || error.message || 'External API error';
  
  return new AppError(
    message,
    statusCode >= 400 && statusCode < 500 ? statusCode : 503,
    ErrorCategory.EXTERNAL_API,
    ErrorSeverity.MEDIUM,
    true,
    'EXTERNAL_API_ERROR',
    {
      service: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    }
  );
};

// Rate limiting error handler
export const handleRateLimitError = (error: any): AppError => {
  return AppError.tooManyRequests(error.message || 'Rate limit exceeded', {
    limit: error.limit,
    current: error.current,
    remaining: error.remaining,
    resetTime: error.resetTime,
  });
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handleDatabaseError(error);
  } else if (error.name?.includes('JsonWebToken') || error.name?.includes('Token')) {
    appError = handleJWTError(error);
  } else if (error.name === 'ValidationError') {
    appError = handleValidationError(error);
  } else if (error.response) {
    appError = handleExternalAPIError(error);
  } else if (error.status === 429) {
    appError = handleRateLimitError(error);
  } else {
    appError = AppError.internal('An unexpected error occurred', {
      originalError: error.message,
      stack: error.stack,
    });
  }

  // Log the error
  logError(appError, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    requestId: (req as any).requestId,
  });

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      category: appError.category,
      severity: appError.severity,
      ...(config.nodeEnv === 'development' && {
        stack: appError.stack,
        metadata: appError.metadata,
      }),
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    requestId: (req as any).requestId,
  };

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = AppError.notFound(`Route ${req.method} ${req.path} not found`);
  next(error);
};

// Performance monitoring
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
      requestId: (req as any).requestId,
    });
  });
  
  next();
};

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Error reporting utilities
export const reportError = async (error: AppError, context?: Record<string, any>): Promise<void> => {
  try {
    // Log to internal system
    logError(error, context);
    
    // Send to external monitoring (Sentry, etc.)
    if (config.sentryDsn && error.severity === ErrorSeverity.CRITICAL) {
      // Integration with external error reporting
      await fetch(`${config.sentryDsn}/api/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          category: error.category,
          severity: error.severity,
          metadata: { ...error.metadata, ...context },
          timestamp: new Date().toISOString(),
        }),
      });
    }
    
    // Send webhook for critical errors
    if (error.severity === ErrorSeverity.CRITICAL && config.errorWebhook) {
      await fetch(config.errorWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Error: ${error.message}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Category', value: error.category, short: true },
              { title: 'Code', value: error.code || 'N/A', short: true },
              { title: 'Severity', value: error.severity, short: true },
              { title: 'Environment', value: config.nodeEnv, short: true },
            ],
            timestamp: new Date().toISOString(),
          }],
        }),
      });
    }
  } catch (reportingError) {
    logger.error('Failed to report error', { reportingError, originalError: error });
  }
};

// Health check error handling
export const handleHealthCheckError = (error: Error): { status: string; error: string } => {
  return {
    status: 'unhealthy',
    error: error.message,
  };
};

export default {
  AppError,
  ErrorSeverity,
  ErrorCategory,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  performanceLogger,
  requestIdMiddleware,
  logError,
  reportError,
  handleDatabaseError,
  handleJWTError,
  handleValidationError,
  handleExternalAPIError,
  handleRateLimitError,
  handleHealthCheckError,
};
