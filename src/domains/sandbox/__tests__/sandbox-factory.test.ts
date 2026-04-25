import { describe, expect, it, vi } from "vitest";
import type { MCPSandboxProvider } from "../sandbox-types";

// Mock the sandbox clients to avoid external dependencies
vi.mock("../clients/daytona-client", () => ({
  DaytonaSandboxClient: vi.fn().mockImplementation((runtime: string) => ({
    runtime,
    provider: "DAYTONA",
    initialize: vi.fn(),
    executeTool: vi.fn(),
    listTools: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("../clients/e2b-client", () => ({
  E2BSandboxClient: vi.fn().mockImplementation((runtime: string) => ({
    runtime,
    provider: "E2B",
    initialize: vi.fn(),
    executeTool: vi.fn(),
    listTools: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("../clients/sandock-client", () => ({
  SandockSandboxClient: vi.fn().mockImplementation((runtime: string) => ({
    runtime,
    provider: "SANDOCK",
    initialize: vi.fn(),
    executeTool: vi.fn(),
    listTools: vi.fn(),
    destroy: vi.fn(),
  })),
}));

import { SandboxFactory } from "../sandbox-factory";

describe("SandboxFactory", () => {
  describe("create", () => {
    it("should create a SandockSandboxClient for SANDOCK provider", () => {
      const client = SandboxFactory.create("node", "SANDOCK");
      expect(client).toBeDefined();
      expect((client as unknown as { provider: string }).provider).toBe("SANDOCK");
    });

    it("should create a DaytonaSandboxClient for DAYTONA provider", () => {
      const client = SandboxFactory.create("node", "DAYTONA");
      expect(client).toBeDefined();
      expect((client as unknown as { provider: string }).provider).toBe("DAYTONA");
    });

    it("should create an E2BSandboxClient for E2B provider", () => {
      const client = SandboxFactory.create("node", "E2B");
      expect(client).toBeDefined();
      expect((client as unknown as { provider: string }).provider).toBe("E2B");
    });

    it("should throw an error for LOCAL provider", () => {
      expect(() => SandboxFactory.create("node", "LOCAL")).toThrow(
        "LOCAL provider should not use sandbox client",
      );
    });

    it("should throw an error for unknown provider", () => {
      expect(() => SandboxFactory.create("node", "UNKNOWN" as MCPSandboxProvider)).toThrow(
        "Unknown sandbox provider: UNKNOWN",
      );
    });

    it("should pass runtime to the sandbox client", () => {
      const client = SandboxFactory.create("python", "SANDOCK");
      expect((client as unknown as { runtime: string }).runtime).toBe("python");
    });
  });
});
