import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  discoverAuthServerMetadata,
  discoverProtectedResourceMetadata,
  exchangeCodeForTokens,
  refreshAccessToken,
  registerClient,
} from "../oauth-utils";

describe("oauth-utils async functions", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("discoverProtectedResourceMetadata", () => {
    it("should discover metadata via 401 WWW-Authenticate header", async () => {
      const resourceMetadata = {
        resource: "https://mcp.example.com/server",
        authorization_servers: ["https://auth.example.com"],
      };

      // First call: probe returns 401 with WWW-Authenticate
      mockFetch.mockResolvedValueOnce({
        status: 401,
        headers: {
          get: (name: string) => {
            if (name === "www-authenticate") {
              return 'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"';
            }
            return null;
          },
        },
      });

      // Second call: fetch the metadata URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => resourceMetadata,
      });

      const result = await discoverProtectedResourceMetadata("https://mcp.example.com/server");
      expect(result).toEqual(resourceMetadata);
    });

    it("should use Headers.get for www-authenticate header", async () => {
      const resourceMetadata = {
        resource: "https://mcp.example.com/server",
        authorization_servers: ["https://auth.example.com"],
      };

      // Probe returns 401 with proper Headers object
      mockFetch.mockResolvedValueOnce({
        status: 401,
        headers: {
          get: (name: string) => {
            if (name === "www-authenticate") {
              return 'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"';
            }
            return null;
          },
        },
      });

      // Metadata fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => resourceMetadata,
      });

      const result = await discoverProtectedResourceMetadata("https://mcp.example.com/server");
      expect(result).toEqual(resourceMetadata);
    });

    it("should fall back to well-known URI when probe returns non-401", async () => {
      const resourceMetadata = {
        resource: "https://mcp.example.com/server",
        authorization_servers: ["https://auth.example.com"],
      };

      // Probe returns 200 (not 401)
      mockFetch.mockResolvedValueOnce({ status: 200 });

      // Well-known path-specific
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => resourceMetadata,
      });

      const result = await discoverProtectedResourceMetadata("https://mcp.example.com/server");
      expect(result).toEqual(resourceMetadata);
    });

    it("should try root well-known URI when path-specific fails", async () => {
      const resourceMetadata = {
        resource: "https://mcp.example.com",
        authorization_servers: ["https://auth.example.com"],
      };

      // Probe returns 200
      mockFetch.mockResolvedValueOnce({ status: 200 });

      // Path-specific well-known fails
      mockFetch.mockResolvedValueOnce({ ok: false });

      // Root well-known succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => resourceMetadata,
      });

      const result = await discoverProtectedResourceMetadata("https://mcp.example.com/server");
      expect(result).toEqual(resourceMetadata);
    });

    it("should throw when all discovery methods fail", async () => {
      // Probe returns 200
      mockFetch.mockResolvedValueOnce({ status: 200 });

      // All well-known paths fail
      mockFetch.mockResolvedValueOnce({ ok: false });
      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(
        discoverProtectedResourceMetadata("https://mcp.example.com/server"),
      ).rejects.toThrow("Could not discover protected resource metadata");
    });

    it("should handle 401 without www-authenticate header", async () => {
      const resourceMetadata = {
        resource: "https://mcp.example.com",
        authorization_servers: ["https://auth.example.com"],
      };

      // Probe returns 401 but no www-authenticate header
      mockFetch.mockResolvedValueOnce({
        status: 401,
        headers: { get: () => null },
      });

      // Falls back to well-known
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => resourceMetadata,
      });

      const result = await discoverProtectedResourceMetadata("https://mcp.example.com/server");
      expect(result).toEqual(resourceMetadata);
    });

    it("should handle well-known fetch throwing an error", async () => {
      // Probe returns 200
      mockFetch.mockResolvedValueOnce({ status: 200 });

      // Well-known paths throw errors
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        discoverProtectedResourceMetadata("https://mcp.example.com/server"),
      ).rejects.toThrow("Could not discover protected resource metadata");
    });
  });

  describe("discoverAuthServerMetadata", () => {
    it("should discover metadata from oauth-authorization-server endpoint", async () => {
      const oauthMetadata = {
        issuer: "https://auth.example.com",
        authorization_endpoint: "https://auth.example.com/authorize",
        token_endpoint: "https://auth.example.com/token",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => oauthMetadata,
      });

      const result = await discoverAuthServerMetadata("https://auth.example.com");
      expect(result).toEqual(oauthMetadata);
    });

    it("should try openid-configuration when oauth-authorization-server fails", async () => {
      const oauthMetadata = {
        issuer: "https://auth.example.com",
        authorization_endpoint: "https://auth.example.com/authorize",
        token_endpoint: "https://auth.example.com/token",
      };

      // oauth-authorization-server fails
      mockFetch.mockResolvedValueOnce({ ok: false });

      // openid-configuration succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => oauthMetadata,
      });

      const result = await discoverAuthServerMetadata("https://auth.example.com");
      expect(result).toEqual(oauthMetadata);
    });

    it("should handle auth server with path components", async () => {
      const oauthMetadata = {
        issuer: "https://auth.example.com/tenant1",
        authorization_endpoint: "https://auth.example.com/tenant1/authorize",
        token_endpoint: "https://auth.example.com/tenant1/token",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => oauthMetadata,
      });

      const result = await discoverAuthServerMetadata("https://auth.example.com/tenant1");
      expect(result).toEqual(oauthMetadata);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://auth.example.com/.well-known/oauth-authorization-server/tenant1",
      );
    });

    it("should throw when all discovery methods fail", async () => {
      // All attempts fail
      mockFetch.mockResolvedValueOnce({ ok: false });
      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(discoverAuthServerMetadata("https://auth.example.com")).rejects.toThrow(
        "Could not discover authorization server metadata",
      );
    });

    it("should handle fetch errors gracefully and try next URL", async () => {
      const oauthMetadata = {
        issuer: "https://auth.example.com",
        authorization_endpoint: "https://auth.example.com/authorize",
        token_endpoint: "https://auth.example.com/token",
      };

      // First URL throws
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Second URL succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => oauthMetadata,
      });

      const result = await discoverAuthServerMetadata("https://auth.example.com");
      expect(result).toEqual(oauthMetadata);
    });

    it("should try all three URLs for auth server with path", async () => {
      // All three fail
      mockFetch.mockResolvedValueOnce({ ok: false });
      mockFetch.mockResolvedValueOnce({ ok: false });
      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(discoverAuthServerMetadata("https://auth.example.com/tenant1")).rejects.toThrow(
        "Could not discover authorization server metadata",
      );

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("registerClient", () => {
    it("should register client successfully", async () => {
      const clientInfo = {
        client_id: "registered-client-id",
        client_secret: "registered-secret",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => clientInfo,
      });

      const result = await registerClient("https://auth.example.com/register", {
        redirect_uris: ["http://localhost:3003/callback"],
        client_name: "MCP Registry",
      });

      expect(result).toEqual(clientInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://auth.example.com/register",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("should throw when registration fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });

      await expect(
        registerClient("https://auth.example.com/register", {
          redirect_uris: ["http://localhost:3003/callback"],
        }),
      ).rejects.toThrow("Client registration failed: 400 Bad request");
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("should exchange code for tokens successfully", async () => {
      const tokens = {
        access_token: "test-access-token",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "test-refresh-token",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      const result = await exchangeCodeForTokens({
        tokenEndpoint: "https://auth.example.com/token",
        code: "auth-code",
        redirectUri: "http://localhost:3003/callback",
        clientId: "test-client-id",
        codeVerifier: "test-code-verifier",
      });

      expect(result).toEqual(tokens);
    });

    it("should include client_secret when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      });

      await exchangeCodeForTokens({
        tokenEndpoint: "https://auth.example.com/token",
        code: "auth-code",
        redirectUri: "http://localhost:3003/callback",
        clientId: "test-client-id",
        clientSecret: "test-secret",
        codeVerifier: "test-code-verifier",
      });

      const fetchBody = mockFetch.mock.calls[0][1].body;
      expect(fetchBody).toContain("client_secret=test-secret");
    });

    it("should include resource when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      });

      await exchangeCodeForTokens({
        tokenEndpoint: "https://auth.example.com/token",
        code: "auth-code",
        redirectUri: "http://localhost:3003/callback",
        clientId: "test-client-id",
        codeVerifier: "test-code-verifier",
        resource: "https://mcp.example.com/server",
      });

      const fetchBody = mockFetch.mock.calls[0][1].body;
      expect(fetchBody).toContain("resource=");
    });

    it("should throw when token exchange fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Invalid grant",
      });

      await expect(
        exchangeCodeForTokens({
          tokenEndpoint: "https://auth.example.com/token",
          code: "invalid-code",
          redirectUri: "http://localhost:3003/callback",
          clientId: "test-client-id",
          codeVerifier: "test-code-verifier",
        }),
      ).rejects.toThrow("Token exchange failed: 400 Invalid grant");
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh token successfully", async () => {
      const tokens = {
        access_token: "new-access-token",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "new-refresh-token",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokens,
      });

      const result = await refreshAccessToken({
        tokenEndpoint: "https://auth.example.com/token",
        refreshToken: "old-refresh-token",
        clientId: "test-client-id",
      });

      expect(result).toEqual(tokens);
    });

    it("should include client_secret when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      });

      await refreshAccessToken({
        tokenEndpoint: "https://auth.example.com/token",
        refreshToken: "old-refresh-token",
        clientId: "test-client-id",
        clientSecret: "test-secret",
      });

      const fetchBody = mockFetch.mock.calls[0][1].body;
      expect(fetchBody).toContain("client_secret=test-secret");
    });

    it("should include resource when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      });

      await refreshAccessToken({
        tokenEndpoint: "https://auth.example.com/token",
        refreshToken: "old-refresh-token",
        clientId: "test-client-id",
        resource: "https://mcp.example.com/server",
      });

      const fetchBody = mockFetch.mock.calls[0][1].body;
      expect(fetchBody).toContain("resource=");
    });

    it("should throw when refresh fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Invalid refresh token",
      });

      await expect(
        refreshAccessToken({
          tokenEndpoint: "https://auth.example.com/token",
          refreshToken: "invalid-token",
          clientId: "test-client-id",
        }),
      ).rejects.toThrow("Token refresh failed: 400 Invalid refresh token");
    });
  });
});
