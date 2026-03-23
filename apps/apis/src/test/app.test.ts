import { describe, it, expect, beforeAll, afterAll } from "vitest";
import app from "..";
import request from "supertest";

describe("Initial Health Check", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 200 for a basic route", async () => {
    const response = await request(app.server).get("/");

    expect(response.status).toBeDefined();
  });
});
