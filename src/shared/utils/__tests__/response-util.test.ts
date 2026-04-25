import { describe, expect, it } from "vitest";
import { createErrorResponse, createResponse, createRouteResponses } from "../response-util";

describe("response-util", () => {
  describe("createResponse", () => {
    it("should create a success response with default options", () => {
      const data = { key: "value" };
      const result = createResponse(data);

      expect(result).toEqual({
        success: true,
        code: 200,
        message: "Success",
        data: { key: "value" },
      });
    });

    it("should create a response with custom options", () => {
      const data = { key: "value" };
      const result = createResponse(data, {
        success: false,
        code: 201,
        message: "Created",
      });

      expect(result).toEqual({
        success: false,
        code: 201,
        message: "Created",
        data: { key: "value" },
      });
    });

    it("should handle null data", () => {
      const result = createResponse(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it("should handle undefined options", () => {
      const result = createResponse("test");

      expect(result.success).toBe(true);
      expect(result.code).toBe(200);
      expect(result.message).toBe("Success");
    });

    it("should handle partial options", () => {
      const result = createResponse("test", { code: 201 });

      expect(result.success).toBe(true);
      expect(result.code).toBe(201);
      expect(result.message).toBe("Success");
    });

    it("should handle array data", () => {
      const data = [1, 2, 3];
      const result = createResponse(data);

      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe("createErrorResponse", () => {
    it("should create an error response with default code", () => {
      const result = createErrorResponse("Something went wrong");

      expect(result).toEqual({
        success: false,
        code: 400,
        message: "Something went wrong",
      });
    });

    it("should create an error response with custom code", () => {
      const result = createErrorResponse("Not found", 404);

      expect(result).toEqual({
        success: false,
        code: 404,
        message: "Not found",
      });
    });

    it("should create a 500 error response", () => {
      const result = createErrorResponse("Internal error", 500);

      expect(result.success).toBe(false);
      expect(result.code).toBe(500);
      expect(result.message).toBe("Internal error");
    });
  });

  describe("createRouteResponses", () => {
    it("should create route responses with only success response by default", () => {
      // Use a simple zod-like schema mock
      const mockSchema = { _type: "string" } as any;
      const result = createRouteResponses(mockSchema);

      expect(result[200]).toBeDefined();
      expect(result[200].description).toBe("Success");
      expect(result[200].content["application/json"].schema).toBe(mockSchema);
      expect(result[400]).toBeUndefined();
      expect(result[404]).toBeUndefined();
      expect(result[500]).toBeUndefined();
    });

    it("should include error responses when includeErrorResponses is true", () => {
      const mockSchema = { _type: "string" } as any;
      const result = createRouteResponses(mockSchema, {
        includeErrorResponses: true,
      });

      expect(result[200]).toBeDefined();
      expect(result[400]).toBeDefined();
      expect(result[400].description).toBe("Bad Request");
      expect(result[404]).toBeDefined();
      expect(result[404].description).toBe("Not Found");
      expect(result[500]).toBeDefined();
      expect(result[500].description).toBe("Internal Server Error");
    });

    it("should use custom success description", () => {
      const mockSchema = { _type: "string" } as any;
      const result = createRouteResponses(mockSchema, {
        successDescription: "Custom Success",
      });

      expect(result[200].description).toBe("Custom Success");
    });

    it("should use default options when none provided", () => {
      const mockSchema = { _type: "string" } as any;
      const result = createRouteResponses(mockSchema);

      expect(result[200].description).toBe("Success");
    });
  });
});
