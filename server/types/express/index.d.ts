declare global {
  namespace Express {
    interface Request {
      auth: {
        userId?: string;
        email?: string;
        imageUrl?: string;
        [key: string]: unknown;
      };
    }
  }
}

export {};
