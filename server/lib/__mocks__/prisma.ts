export const prisma = {
  application: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    upsert: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  resume: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  tailoredResume: {
    findMany: jest.fn(),
  },
  resumeFeedback: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};
