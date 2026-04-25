import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDaytonaConfig,
  getE2BConfig,
  getMeiliSearchConfig,
  getRegistryBaseUrl,
  getSandboxProvider,
  getSandockConfig,
  getServerPort,
  isSearchEnabled,
} from "../environment";

describe("environment", () => {
  beforeEach(() => {
    vi.stubEnv("MCP_SANDBOX_PROVIDER", "");
    vi.stubEnv("DAYTONA_API_KEY", "");
    vi.stubEnv("DAYTONA_API_URL", "");
    vi.stubEnv("SANDOCK_API_KEY", "");
    vi.stubEnv("SANDOCK_API_URL", "");
    vi.stubEnv("E2B_API_KEY", "");
    vi.stubEnv("MEILI_HTTP_ADDR", "");
    vi.stubEnv("MEILI_MASTER_KEY", "");
    vi.stubEnv("PORT", "");
    vi.stubEnv("MCP_SERVER_PORT", "");
    vi.stubEnv("REGISTRY_BASE_URL", "");
    vi.stubEnv("ENABLE_SEARCH", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getSandboxProvider", () => {
    it("should return LOCAL as default", () => {
      vi.stubEnv("MCP_SANDBOX_PROVIDER", "");
      const result = getSandboxProvider();
      expect(result).toBe("LOCAL");
    });

    it("should return DAYTONA when set", () => {
      vi.stubEnv("MCP_SANDBOX_PROVIDER", "daytona");
      const result = getSandboxProvider();
      expect(result).toBe("DAYTONA");
    });

    it("should return E2B when set", () => {
      vi.stubEnv("MCP_SANDBOX_PROVIDER", "e2b");
      const result = getSandboxProvider();
      expect(result).toBe("E2B");
    });

    it("should return SANDOCK when set", () => {
      vi.stubEnv("MCP_SANDBOX_PROVIDER", "sandock");
      const result = getSandboxProvider();
      expect(result).toBe("SANDOCK");
    });

    it("should return LOCAL for unsupported provider value", () => {
      vi.stubEnv("MCP_SANDBOX_PROVIDER", "unknown");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = getSandboxProvider();
      expect(result).toBe("LOCAL");
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("should be case-insensitive", () => {
      vi.stubEnv("MCP_SANDBOX_PROVIDER", "Local");
      const result = getSandboxProvider();
      expect(result).toBe("LOCAL");
    });
  });

  describe("getDaytonaConfig", () => {
    it("should return default empty config", () => {
      delete process.env.DAYTONA_API_KEY;
      delete process.env.DAYTONA_API_URL;
      const config = getDaytonaConfig();
      expect(config.apiKey).toBe("");
      expect(config.apiUrl).toBeUndefined();
    });

    it("should return config from env vars", () => {
      vi.stubEnv("DAYTONA_API_KEY", "test-key");
      vi.stubEnv("DAYTONA_API_URL", "https://daytona.test");
      const config = getDaytonaConfig();
      expect(config.apiKey).toBe("test-key");
      expect(config.apiUrl).toBe("https://daytona.test");
    });
  });

  describe("getSandockConfig", () => {
    it("should return defaults when env not set", () => {
      const config = getSandockConfig();
      expect(config.apiKey).toBe("");
      expect(config.apiUrl).toBe("https://sandock.ai");
    });

    it("should return config from env vars", () => {
      vi.stubEnv("SANDOCK_API_KEY", "sandock-key");
      vi.stubEnv("SANDOCK_API_URL", "https://custom-sandock.ai");
      const config = getSandockConfig();
      expect(config.apiKey).toBe("sandock-key");
      expect(config.apiUrl).toBe("https://custom-sandock.ai");
    });
  });

  describe("getE2BConfig", () => {
    it("should return default empty config", () => {
      const config = getE2BConfig();
      expect(config.apiKey).toBe("");
    });

    it("should return config from env vars", () => {
      vi.stubEnv("E2B_API_KEY", "e2b-key");
      const config = getE2BConfig();
      expect(config.apiKey).toBe("e2b-key");
    });
  });

  describe("getMeiliSearchConfig", () => {
    it("should return defaults when env not set", () => {
      const config = getMeiliSearchConfig();
      expect(config.host).toBe("http://localhost:7700");
      expect(config.apiKey).toBeNull();
    });

    it("should return config from env vars", () => {
      vi.stubEnv("MEILI_HTTP_ADDR", "http://meili:7700");
      vi.stubEnv("MEILI_MASTER_KEY", "master-key");
      const config = getMeiliSearchConfig();
      expect(config.host).toBe("http://meili:7700");
      expect(config.apiKey).toBe("master-key");
    });
  });

  describe("getServerPort", () => {
    it("should return default port 3003", () => {
      const port = getServerPort();
      expect(port).toBe(3003);
    });

    it("should return PORT from env", () => {
      vi.stubEnv("PORT", "4000");
      const port = getServerPort();
      expect(port).toBe(4000);
    });

    it("should return MCP_SERVER_PORT from env", () => {
      vi.stubEnv("MCP_SERVER_PORT", "5000");
      const port = getServerPort();
      expect(port).toBe(5000);
    });

    it("should prefer PORT over MCP_SERVER_PORT", () => {
      vi.stubEnv("PORT", "4000");
      vi.stubEnv("MCP_SERVER_PORT", "5000");
      const port = getServerPort();
      expect(port).toBe(4000);
    });
  });

  describe("getRegistryBaseUrl", () => {
    it("should return default localhost URL", () => {
      const url = getRegistryBaseUrl();
      expect(url).toBe("http://localhost:3003");
    });

    it("should return REGISTRY_BASE_URL from env", () => {
      vi.stubEnv("REGISTRY_BASE_URL", "https://registry.example.com");
      const url = getRegistryBaseUrl();
      expect(url).toBe("https://registry.example.com");
    });

    it("should strip trailing slash from REGISTRY_BASE_URL", () => {
      vi.stubEnv("REGISTRY_BASE_URL", "https://registry.example.com/");
      const url = getRegistryBaseUrl();
      expect(url).toBe("https://registry.example.com");
    });

    it("should use PORT env for default URL", () => {
      vi.stubEnv("PORT", "8080");
      const url = getRegistryBaseUrl();
      expect(url).toBe("http://localhost:8080");
    });
  });

  describe("isSearchEnabled", () => {
    it("should return false by default", () => {
      expect(isSearchEnabled()).toBe(false);
    });

    it("should return true when ENABLE_SEARCH is true", () => {
      vi.stubEnv("ENABLE_SEARCH", "true");
      expect(isSearchEnabled()).toBe(true);
    });

    it("should return false for other values", () => {
      vi.stubEnv("ENABLE_SEARCH", "false");
      expect(isSearchEnabled()).toBe(false);
    });

    it("should return false for 1", () => {
      vi.stubEnv("ENABLE_SEARCH", "1");
      expect(isSearchEnabled()).toBe(false);
    });
  });
});
