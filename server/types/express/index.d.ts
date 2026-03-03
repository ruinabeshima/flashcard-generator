declare global {
  namespace Express {
    interface Request {
      auth: {
        userId?: string;
        sessionId?: string;
        orgId?: string;
        [key: string]: unknown;
      };
    }
  }
}

export {};
