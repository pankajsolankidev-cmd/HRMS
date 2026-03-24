import { describe, it, expect, vi } from "vitest";
import { createUserTx } from "../../modules/users/user.service";

describe("Users Module - user.service", () => {
  describe("createUserTx", () => {
    it("should successfully insert a user and return it", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
      };

      const mockTx: any = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUser]),
      };

      const result = await createUserTx(mockTx, {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toEqual(mockUser);
    });
  });
});
