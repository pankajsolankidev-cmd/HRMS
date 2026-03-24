import { describe, it, expect } from "vitest";
import {
  generateResetKey,
  hashResetToken,
  compareResetToken,
} from "../../auth/password-reset.service";

describe("Password Reset Service", () => {
  it("should generate a reset key", () => {
    const key = generateResetKey();

    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(5);
  });

  it("should generate unique keys", () => {
    const key1 = generateResetKey();
    const key2 = generateResetKey();

    expect(key1).not.toBe(key2);
  });

  it("should hash reset token", async () => {
    const hash = await hashResetToken("token123");

    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
  });

  it("should compare reset token correctly", async () => {
    const token = "token123";
    const hash = await hashResetToken(token);

    const isValid = await compareResetToken(token, hash);

    expect(isValid).toBe(true);
  });

  it("should return false for invalid token comparison", async () => {
    const hash = await hashResetToken("token123");

    const isValid = await compareResetToken("wrong", hash);

    expect(isValid).toBe(false);
  });
});
