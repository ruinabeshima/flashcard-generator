import { AuthObject } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      auth: {
        userId?: string;
        sessionId?: string;
        orgId?: string;
        [key: string]: any;
      };
    }
  }
}

export {};