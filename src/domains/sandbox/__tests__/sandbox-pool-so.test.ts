import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SandboxClient } from "../sandbox-types";

// Mock the SandboxFactory
vi.mock("../sandbox-factory", () => ({
  SandboxFactory: {
    create: vi.fn(),
  },
}));

import { SandboxFactory } from "../sandbox-factory";
import { SandboxPoolSO } from "../sandbox-pool-so";

function createMockSandboxClient(): SandboxClient {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    executeTool: vi.fn().mockResolvedValue({ success: true }),
    listTools: vi.fn().mockResolvedValue([]),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

describe("SandboxPoolSO", () => {
  let pool: SandboxPoolSO;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the static singleton instance to avoid test pollution
    // biome-ignore lint/suspicious/noExplicitAny: accessing private static for test reset
    (SandboxPoolSO as Record<string, unknown>).instance = undefined;
    pool = SandboxPoolSO.getInstance();
  });

  afterEach(async () => {
    await pool.cleanup();
  });

  describe("getInstance", () => {
    it("should return the same instance", () => {
      const instance1 = SandboxPoolSO.getInstance();
      const instance2 = SandboxPoolSO.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("acquire", () => {
    it("should create a new sandbox client", async () => {
      const mockClient = createMockSandboxClient();
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);

      const client = await pool.acquire("node", "SANDOCK");

      expect(SandboxFactory.create).toHaveBeenCalledWith("node", "SANDOCK");
      expect(client).toBe(mockClient);
    });

    it("should reuse existing sandbox for same runtime and provider", async () => {
      const mockClient = createMockSandboxClient();
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);

      const client1 = await pool.acquire("node", "SANDOCK");
      const client2 = await pool.acquire("node", "SANDOCK");

      expect(client1).toBe(client2);
      expect(SandboxFactory.create).toHaveBeenCalledTimes(1);
    });

    it("should create different clients for different runtimes", async () => {
      const nodeClient = createMockSandboxClient();
      const pythonClient = createMockSandboxClient();
      vi.mocked(SandboxFactory.create)
        .mockReturnValueOnce(nodeClient)
        .mockReturnValueOnce(pythonClient);

      const client1 = await pool.acquire("node", "SANDOCK");
      const client2 = await pool.acquire("python", "SANDOCK");

      expect(client1).toBe(nodeClient);
      expect(client2).toBe(pythonClient);
      expect(SandboxFactory.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("release", () => {
    it("should decrease ref count and destroy when zero", async () => {
      const mockClient = createMockSandboxClient();
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);

      await pool.acquire("node", "SANDOCK");
      await pool.release("node", "SANDOCK");

      expect(mockClient.destroy).toHaveBeenCalled();
    });

    it("should not destroy when ref count is still positive", async () => {
      const mockClient = createMockSandboxClient();
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);

      await pool.acquire("node", "SANDOCK");
      await pool.acquire("node", "SANDOCK"); // refCount = 2
      await pool.release("node", "SANDOCK"); // refCount = 1

      expect(mockClient.destroy).not.toHaveBeenCalled();
    });

    it("should handle release of non-existent sandbox gracefully", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await pool.release("node", "SANDOCK");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("not found in pool"));
      warnSpy.mockRestore();
    });

    it("should handle destroy error gracefully", async () => {
      const mockClient = createMockSandboxClient();
      mockClient.destroy.mockRejectedValue(new Error("Destroy failed"));
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await pool.acquire("node", "SANDOCK");
      await pool.release("node", "SANDOCK");

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("getPoolStatus", () => {
    it("should return empty status for empty pool", () => {
      const status = pool.getPoolStatus();
      expect(status).toEqual({});
    });

    it("should return status with active sandboxes", async () => {
      const mockClient = createMockSandboxClient();
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);

      await pool.acquire("node", "SANDOCK");
      const status = pool.getPoolStatus();

      expect(status["sandbox-SANDOCK-node"]).toBeDefined();
      expect(status["sandbox-SANDOCK-node"].refCount).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should destroy all sandbox clients", async () => {
      const mockClient1 = createMockSandboxClient();
      const mockClient2 = createMockSandboxClient();
      vi.mocked(SandboxFactory.create)
        .mockReturnValueOnce(mockClient1)
        .mockReturnValueOnce(mockClient2);

      await pool.acquire("node", "SANDOCK");
      await pool.acquire("python", "SANDOCK");

      await pool.cleanup();

      expect(mockClient1.destroy).toHaveBeenCalled();
      expect(mockClient2.destroy).toHaveBeenCalled();
    });

    it("should handle cleanup errors gracefully", async () => {
      const mockClient = createMockSandboxClient();
      mockClient.destroy.mockRejectedValue(new Error("Cleanup failed"));
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await pool.acquire("node", "SANDOCK");
      await pool.cleanup();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("should clear pool after cleanup", async () => {
      const mockClient = createMockSandboxClient();
      vi.mocked(SandboxFactory.create).mockReturnValue(mockClient);

      await pool.acquire("node", "SANDOCK");
      await pool.cleanup();

      const status = pool.getPoolStatus();
      expect(Object.keys(status)).toHaveLength(0);
    });
  });
});
