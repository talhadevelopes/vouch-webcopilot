import type { Context } from "hono";

export type ApiSuccess<T> = {
  status: "success";
  message: string;
  data: T;
};

export type ApiError = {
  status: "error";
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
};

export class ApiResponse {
  static success<T>(c: Context, message: string, data: T, httpStatus = 200) {
    const payload: ApiSuccess<T> = {
      status: "success",
      message,
      data,
    };
    return c.json(payload, httpStatus as any);
  }

  static error(
    c: Context,
    message: string,
    code = "BAD_REQUEST",
    httpStatus = 400,
    details?: unknown,
  ) {
    const payload: ApiError = {
      status: "error",
      message,
      error: {
        code,
        ...(details !== undefined ? { details } : {}),
      },
    };
    return c.json(payload, httpStatus as any);
  }
}
