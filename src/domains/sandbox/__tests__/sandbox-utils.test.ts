import { describe, expect, it } from "vitest";
import type { MCPServerPackageConfig } from "../../package/package-types";
import { generateEnvVariables, generateMCPTestCode } from "../sandbox-utils";

describe("sandbox-utils", () => {
  describe("generateEnvVariables", () => {
    it("should return empty string when env is undefined", () => {
      const result = generateEnvVariables(undefined);
      expect(result).toBe("");
    });

    it("should return empty string when env is null", () => {
      const result = generateEnvVariables(undefined);
      expect(result).toBe("");
    });

    it("should generate mock values when no real envs provided", () => {
      const env: MCPServerPackageConfig["env"] = {
        API_KEY: { description: "API key", required: true },
        SECRET: { description: "Secret", required: false },
      };

      const result = generateEnvVariables(env);
      expect(result).toContain('"API_KEY": "mock_value"');
      expect(result).toContain('"SECRET": "mock_value"');
    });

    it("should use real env values when provided", () => {
      const env: MCPServerPackageConfig["env"] = {
        API_KEY: { description: "API key", required: true },
        SECRET: { description: "Secret", required: false },
      };
      const realEnvs = {
        API_KEY: "real-api-key",
      };

      const result = generateEnvVariables(env, realEnvs);
      expect(result).toContain('"API_KEY": "real-api-key"');
      expect(result).toContain('"SECRET": "mock_value"');
    });

    it("should use real env values for all keys when all provided", () => {
      const env: MCPServerPackageConfig["env"] = {
        KEY1: { description: "Key 1", required: true },
        KEY2: { description: "Key 2", required: true },
      };
      const realEnvs = {
        KEY1: "value1",
        KEY2: "value2",
      };

      const result = generateEnvVariables(env, realEnvs);
      expect(result).toContain('"KEY1": "value1"');
      expect(result).toContain('"KEY2": "value2"');
      expect(result).not.toContain("mock_value");
    });

    it("should handle empty env object", () => {
      const result = generateEnvVariables({});
      expect(result).toBe("");
    });
  });

  describe("generateMCPTestCode", () => {
    const baseMcpConfig: MCPServerPackageConfig = {
      type: "mcp-server",
      runtime: "node",
      packageName: "@test/package",
      name: "Test Package",
      description: "A test package",
    };

    it("should generate listTools code", () => {
      const code = generateMCPTestCode(baseMcpConfig, "listTools");

      expect(code).toContain("listTools");
      expect(code).toContain("@test/package");
      expect(code).toContain("StdioClientTransport");
      expect(code).toContain("Client");
      expect(code).toContain("process.stdout.write(JSON.stringify(result))");
    });

    it("should generate executeTool code", () => {
      const code = generateMCPTestCode(baseMcpConfig, "executeTool", "read_file", {
        path: "/tmp/test.txt",
      });

      expect(code).toContain("callTool");
      expect(code).toContain("read_file");
      expect(code).toContain("/tmp/test.txt");
    });

    it("should include env variables in generated code", () => {
      const configWithEnv: MCPServerPackageConfig = {
        ...baseMcpConfig,
        env: {
          API_KEY: { description: "API key", required: true },
        },
      };

      const code = generateMCPTestCode(configWithEnv, "listTools");
      expect(code).toContain("API_KEY");
    });

    it("should include real env values when provided", () => {
      const configWithEnv: MCPServerPackageConfig = {
        ...baseMcpConfig,
        env: {
          API_KEY: { description: "API key", required: true },
        },
      };

      const code = generateMCPTestCode(configWithEnv, "listTools", undefined, undefined, {
        API_KEY: "real-key",
      });
      expect(code).toContain("real-key");
    });

    it("should generate code with error handling for listTools", () => {
      const code = generateMCPTestCode(baseMcpConfig, "listTools");
      expect(code).toContain("catch (error)");
      expect(code).toContain("Error in MCP test");
      expect(code).toContain("finally");
      expect(code).toContain("client.close()");
      expect(code).toContain("transport.close()");
    });

    it("should generate code with error handling for executeTool", () => {
      const code = generateMCPTestCode(baseMcpConfig, "executeTool", "test_tool", {});
      expect(code).toContain("catch (error)");
      expect(code).toContain("isError: true");
      expect(code).toContain("finally");
    });

    it("should handle undefined arguments for executeTool", () => {
      const code = generateMCPTestCode(baseMcpConfig, "executeTool", "test_tool");
      expect(code).toContain("callTool");
      expect(code).toContain("test_tool");
    });
  });
});
