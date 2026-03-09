import { Response } from 'express';
import { ApiResponse, PaginationResponse } from '../types/index.js';

export function sendSuccess<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
}

export function sendPaginationResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode: number = 200
) {
  const pages = Math.ceil(total / limit);
  const response: PaginationResponse<T> = {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages,
    },
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  message?: string
) {
  res.status(statusCode).json({
    success: false,
    error,
    message: message || error,
    statusCode,
  });
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function createApiError(message: string, statusCode: number = 500): AppError {
  return new AppError(message, statusCode);
}
