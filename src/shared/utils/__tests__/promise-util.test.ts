import { describe, expect, it } from "vitest";
import { withTimeout } from "../promise-util";

describe("promise-util", () => {
  describe("withTimeout", () => {
    it("should resolve when the promise resolves before timeout", async () => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("success"), 10);
      });

      const result = await withTimeout(1000, promise);
      expect(result).toBe("success");
    });

    it("should reject with timeout error when promise takes too long", async () => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("too late"), 5000);
      });

      await expect(withTimeout(50, promise)).rejects.toThrow("Operation timed out after 50ms");
    });

    it("should reject when the promise rejects before timeout", async () => {
      const promise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("promise error")), 10);
      });

      await expect(withTimeout(1000, promise)).rejects.toThrow("promise error");
    });

    it("should resolve immediately when promise is already resolved", async () => {
      const promise = Promise.resolve(42);
      const result = await withTimeout(1000, promise);
      expect(result).toBe(42);
    });

    it("should reject immediately when promise is already rejected", async () => {
      const promise = Promise.reject(new Error("already failed"));
      await expect(withTimeout(1000, promise)).rejects.toThrow("already failed");
    });

    it("should handle non-string resolved values", async () => {
      const obj = { key: "value" };
      const promise = Promise.resolve(obj);
      const result = await withTimeout(1000, promise);
      expect(result).toEqual(obj);
    });

    it("should handle null resolved value", async () => {
      const promise = Promise.resolve(null);
      const result = await withTimeout(1000, promise);
      expect(result).toBeNull();
    });
  });
});
