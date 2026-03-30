export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(message: string, options?: { code?: string; statusCode?: number; details?: unknown }) {
    super(message);
    this.name = new.target.name;
    this.code = options?.code ?? "APP_ERROR";
    this.statusCode = options?.statusCode ?? 500;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "VALIDATION_ERROR", statusCode: 400, details });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, { code: "AUTHENTICATION_ERROR", statusCode: 401 });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You are not allowed to perform this action.") {
    super(message, { code: "AUTHORIZATION_ERROR", statusCode: 403 });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Record not found.") {
    super(message, { code: "NOT_FOUND", statusCode: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "CONFLICT", statusCode: 409, details });
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error) return error.message;
  return fallback;
}
