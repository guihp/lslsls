import { describe, expect, it } from "vitest";
import {
  AVATAR_MAX_BYTES,
  extensionForType,
  formatBytes,
  scaleToFit,
  validateAvatarFile,
} from "@/lib/image";

describe("validateAvatarFile", () => {
  it("accepts a typical phone photo", () => {
    expect(
      validateAvatarFile({ type: "image/jpeg", size: 4 * 1024 * 1024 }),
    ).toBeNull();
  });

  it("rejects empty files", () => {
    expect(validateAvatarFile({ type: "image/png", size: 0 })).toMatch(
      /vazio/i,
    );
  });

  it("rejects unsupported formats", () => {
    expect(validateAvatarFile({ type: "application/pdf", size: 1000 })).toMatch(
      /não suportado/i,
    );
  });

  it("rejects files above the limit with the size in the message", () => {
    const error = validateAvatarFile({
      type: "image/jpeg",
      size: AVATAR_MAX_BYTES + 1,
    });
    expect(error).toContain("10MB");
  });
});

describe("scaleToFit", () => {
  it("keeps small images untouched", () => {
    expect(scaleToFit(300, 200, 512)).toEqual({ width: 300, height: 200 });
  });

  it("scales the largest side down while keeping the ratio", () => {
    expect(scaleToFit(4032, 3024, 512)).toEqual({ width: 512, height: 384 });
  });

  it("never returns a zero dimension", () => {
    expect(scaleToFit(5000, 2, 512).height).toBe(1);
  });
});

describe("extensionForType", () => {
  it("maps known image types", () => {
    expect(extensionForType("image/webp")).toBe("webp");
    expect(extensionForType("image/jpeg")).toBe("jpg");
  });

  it("falls back to jpg", () => {
    expect(extensionForType("image/heic")).toBe("jpg");
  });
});

describe("formatBytes", () => {
  it("formats megabytes", () => {
    expect(formatBytes(12 * 1024 * 1024)).toBe("12.0 MB");
  });
});
