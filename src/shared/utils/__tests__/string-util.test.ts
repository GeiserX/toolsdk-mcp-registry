import { describe, expect, it } from "vitest";
import { extractLastOuterJSON } from "../string-util";

describe("string-util", () => {
  describe("extractLastOuterJSON", () => {
    it("should extract a simple JSON object from a string", () => {
      const input = 'some text {"key": "value"} more text';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"key": "value"}');
    });

    it("should extract the last JSON object when multiple exist", () => {
      const input = '{"first": 1} some text {"second": 2}';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"second": 2}');
    });

    it("should handle nested JSON objects", () => {
      const input = 'prefix {"outer": {"inner": "value"}} suffix';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"outer": {"inner": "value"}}');
    });

    it("should handle deeply nested JSON objects", () => {
      const input = '{"a": {"b": {"c": "d"}}}';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"a": {"b": {"c": "d"}}}');
    });

    it("should throw an error when no valid JSON is found", () => {
      const input = "no json here";
      expect(() => extractLastOuterJSON(input)).toThrow("No valid JSON found in string");
    });

    it("should throw an error for empty string", () => {
      expect(() => extractLastOuterJSON("")).toThrow("No valid JSON found in string");
    });

    it("should handle string with only opening brace", () => {
      expect(() => extractLastOuterJSON("{")).toThrow("No valid JSON found in string");
    });

    it("should handle string with only closing brace", () => {
      expect(() => extractLastOuterJSON("}")).toThrow("No valid JSON found in string");
    });

    it("should handle JSON at the very end of the string", () => {
      const input = 'text before {"end": true}';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"end": true}');
    });

    it("should handle JSON at the very beginning of the string", () => {
      const input = '{"start": true} text after';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"start": true}');
    });

    it("should handle JSON that is the entire string", () => {
      const input = '{"only": "json"}';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"only": "json"}');
    });

    it("should handle unbalanced braces and extract last valid JSON", () => {
      const input = '{ broken {"valid": true}';
      const result = extractLastOuterJSON(input);
      expect(result).toBe('{"valid": true}');
    });
  });
});
