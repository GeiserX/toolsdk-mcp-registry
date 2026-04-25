import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PackageRepository } from "../../package/package-repository";
import { FederatedRegistryProvider } from "../providers/federated-registry-provider";
import { LocalRegistryProvider } from "../providers/local-registry-provider";
import { OfficialRegistryProvider } from "../providers/official-registry-provider";
import type { RegistryProviderType } from "../registry-factory";
import {
  getRegistryProvider,
  initRegistryFactory,
  resetRegistryFactory,
} from "../registry-factory";

describe("registry-factory", () => {
  let mockRepository: PackageRepository;

  beforeEach(() => {
    resetRegistryFactory();

    mockRepository = {
      getPackageConfig: vi.fn(),
      getAllPackages: vi.fn(),
      exists: vi.fn(),
    } as unknown as PackageRepository;
  });

  describe("initRegistryFactory", () => {
    it("should initialize the factory with a package repository", () => {
      initRegistryFactory(mockRepository);

      // Should not throw after initialization
      const provider = getRegistryProvider();
      expect(provider).toBeDefined();
    });

    it("should only initialize once (idempotent)", () => {
      initRegistryFactory(mockRepository);

      const provider1 = getRegistryProvider();

      // Second initialization with different repo should be ignored
      const anotherRepo = {
        getPackageConfig: vi.fn(),
        getAllPackages: vi.fn(),
        exists: vi.fn(),
      } as unknown as PackageRepository;

      initRegistryFactory(anotherRepo);

      const provider2 = getRegistryProvider();
      expect(provider1).toBe(provider2);
    });
  });

  describe("getRegistryProvider", () => {
    it("should throw when factory is not initialized", () => {
      expect(() => getRegistryProvider()).toThrow(
        "RegistryFactory not initialized. Call initRegistryFactory() first.",
      );
    });

    it("should return FederatedRegistryProvider by default", () => {
      initRegistryFactory(mockRepository);
      const provider = getRegistryProvider();
      expect(provider).toBeInstanceOf(FederatedRegistryProvider);
    });

    it("should return FederatedRegistryProvider for FEDERATED type", () => {
      initRegistryFactory(mockRepository);
      const provider = getRegistryProvider("FEDERATED");
      expect(provider).toBeInstanceOf(FederatedRegistryProvider);
    });

    it("should return LocalRegistryProvider for LOCAL type", () => {
      initRegistryFactory(mockRepository);
      const provider = getRegistryProvider("LOCAL");
      expect(provider).toBeInstanceOf(LocalRegistryProvider);
    });

    it("should return OfficialRegistryProvider for OFFICIAL type", () => {
      initRegistryFactory(mockRepository);
      const provider = getRegistryProvider("OFFICIAL");
      expect(provider).toBeInstanceOf(OfficialRegistryProvider);
    });

    it("should throw for unknown provider type", () => {
      initRegistryFactory(mockRepository);
      expect(() => getRegistryProvider("UNKNOWN" as RegistryProviderType)).toThrow(
        "Unknown provider type: UNKNOWN",
      );
    });
  });

  describe("resetRegistryFactory", () => {
    it("should reset the factory to uninitialized state", () => {
      initRegistryFactory(mockRepository);

      // Should work after init
      expect(() => getRegistryProvider()).not.toThrow();

      resetRegistryFactory();

      // Should throw after reset
      expect(() => getRegistryProvider()).toThrow("RegistryFactory not initialized");
    });

    it("should allow re-initialization after reset", () => {
      initRegistryFactory(mockRepository);
      resetRegistryFactory();
      initRegistryFactory(mockRepository);

      const provider = getRegistryProvider();
      expect(provider).toBeDefined();
    });
  });
});
