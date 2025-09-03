// PATH: frontend/src/services/__tests__/analysisService.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "../../services/apiClient";
import { analyzeByBarcode, analyzeManual } from "../analysisService";

beforeEach(() => {
  vi.restoreAllMocks();
});

it("analyzeByBarcode via GET", async () => {
  vi.spyOn(api, "get").mockResolvedValue({ success: true, data: { product: { name: "Test" }, score: {} } });
  const res = await analyzeByBarcode("1234567890123");
  expect(res.product.name).toBe("Test");
});

it("analyzeByBarcode fallback POST", async () => {
  vi.spyOn(api, "get").mockRejectedValue(new Error("404"));
  vi.spyOn(api, "post").mockResolvedValue({ success: true, data: { product: { name: "Test2" }, score: {} } });
  const res = await analyzeByBarcode("123");
  expect(res.product.name).toBe("Test2");
});

it("analyzeManual POST", async () => {
  vi.spyOn(api, "post").mockResolvedValue({ success: true, data: { product: { name: "Manual" }, score: {} } });
  const res = await analyzeManual({ name: "Manual", category: "food", ingredients: ["lait"] });
  expect(res.product.name).toBe("Manual");
});
