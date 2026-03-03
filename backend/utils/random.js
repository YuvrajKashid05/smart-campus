import crypto from "crypto";

export function randomToken(sizeBytes = 16) {
  return crypto.randomBytes(sizeBytes).toString("hex");
}