import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractPackageName } from "../validation-util";

// Only test the synchronous pure functions that don't require network/filesystem access
// isValidNpmPackage and getPythonDependencies require network/fs mocking that is complex
// and those are script-helpers, not core business logic

describe("validation-util", () => {
  describe("extractPackageName", () => {
    it("should extract package name before version specifier with ==", () => {
      const result = extractPackageName("requests==2.28.0");
      expect(result).toBe("requests");
    });

    it("should extract package name before >=", () => {
      const result = extractPackageName("numpy>=1.21.0");
      expect(result).toBe("numpy");
    });

    it("should extract package name before <=", () => {
      const result = extractPackageName("flask<=2.0.0");
      expect(result).toBe("flask");
    });

    it("should extract package name before !=", () => {
      const result = extractPackageName("django!=3.0.0");
      expect(result).toBe("django");
    });

    it("should extract package name before <", () => {
      const result = extractPackageName("pytest<7.0");
      expect(result).toBe("pytest");
    });

    it("should extract package name before >", () => {
      const result = extractPackageName("scipy>1.0");
      expect(result).toBe("scipy");
    });

    it("should return the full string when no version specifier", () => {
      const result = extractPackageName("simple-package");
      expect(result).toBe("simple-package");
    });

    it("should trim whitespace", () => {
      const result = extractPackageName("  package-name  >=1.0");
      expect(result).toBe("package-name");
    });

    it("should handle package with extras syntax", () => {
      // extras like [security] come before version specifiers
      const result = extractPackageName("requests[security]>=2.0");
      // split on = returns "requests[security]"
      expect(result).toBe("requests[security]");
    });
  });
});
