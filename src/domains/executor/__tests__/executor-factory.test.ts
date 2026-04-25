import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPSandboxProvider } from "../../sandbox/sandbox-types";

// Mock the environment module
vi.mock("../../../shared/config/environment", () => ({
  getSandboxProvider: vi.fn(() => "LOCAL"),
}));

// Mock LocalExecutor and SandboxExecutor to avoid filesystem dependencies
vi.mock("../local-executor", () => ({
  LocalExecutor: vi.fn().mockImplementation(() => ({
    executeTool: vi.fn(),
    listTools: vi.fn(),
  })),
}));

vi.mock("../sandbox-executor", () => ({
  SandboxExecutor: vi.fn().mockImplementation((provider: string) => ({
    executeTool: vi.fn(),
    listTools: vi.fn(),
    provider,
  })),
}));

import { getSandboxProvider } from "../../../shared/config/environment";
import { ExecutorFactory } from "../executor-factory";
import { LocalExecutor } from "../local-executor";
import { SandboxExecutor } from "../sandbox-executor";

describe("ExecutorFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("should create LocalExecutor when provider is LOCAL", () => {
      vi.mocked(getSandboxProvider).mockReturnValue("LOCAL");
      ExecutorFactory.create();

      expect(LocalExecutor).toHaveBeenCalled();
    });

    it("should create SandboxExecutor when provider is DAYTONA", () => {
      vi.mocked(getSandboxProvider).mockReturnValue("DAYTONA");
      ExecutorFactory.create();

      expect(SandboxExecutor).toHaveBeenCalledWith("DAYTONA");
    });

    it("should create SandboxExecutor when provider is SANDOCK", () => {
      vi.mocked(getSandboxProvider).mockReturnValue("SANDOCK");
      ExecutorFactory.create();

      expect(SandboxExecutor).toHaveBeenCalledWith("SANDOCK");
    });

    it("should create SandboxExecutor when provider is E2B", () => {
      vi.mocked(getSandboxProvider).mockReturnValue("E2B");
      ExecutorFactory.create();

      expect(SandboxExecutor).toHaveBeenCalledWith("E2B");
    });

    it("should use override provider when valid", () => {
      vi.mocked(getSandboxProvider).mockReturnValue("LOCAL");
      ExecutorFactory.create("DAYTONA");

      expect(SandboxExecutor).toHaveBeenCalledWith("DAYTONA");
      expect(getSandboxProvider).not.toHaveBeenCalled();
    });

    it("should fall back to env provider when override is invalid", () => {
      vi.mocked(getSandboxProvider).mockReturnValue("LOCAL");
      ExecutorFactory.create("INVALID" as MCPSandboxProvider);

      expect(getSandboxProvider).toHaveBeenCalled();
      expect(LocalExecutor).toHaveBeenCalled();
    });

    it("should use override LOCAL provider", () => {
      vi.mocked(getSandboxProvider).mockReturnValue("DAYTONA");
      ExecutorFactory.create("LOCAL");

      expect(LocalExecutor).toHaveBeenCalled();
    });
  });
});
