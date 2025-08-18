// PATH: frontend/src/components/scanner/__tests__/BarcodeScanner.spec.tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import BarcodeScanner from "../../scanner/BarcodeScanner";

vi.mock("quagga2", () => import("../../../__mocks__/quagga2"));

describe("BarcodeScanner", () => {
  it("déclenche onDetected quand Quagga détecte un code", async () => {
    const onDetected = vi.fn();
    render(<BarcodeScanner onDetected={onDetected} />);
    const handler = (globalThis as any).__quaggaHandler;
    handler?.({ codeResult: { code: "3017620425035" } });
    expect(onDetected).toHaveBeenCalledWith("3017620425035");
  });
});
