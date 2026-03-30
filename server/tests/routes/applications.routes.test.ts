import request from "supertest";
import createApp from "../../app";
import { prisma } from "../../lib/prisma";

// Mock prisma client and auditing 
jest.mock("../../lib/prisma");
const mockPrisma = jest.mocked(prisma);
jest.mock("../../lib/monitoring/audit");

const app = createApp();

describe("/GET applications", () => {
  it("returns 401 when no user is authenticated", async () => {
    const res = await request(app).get("/applications");
    expect(res.status).toBe(401);
  });
});
