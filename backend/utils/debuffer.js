export function deBuffer(value) {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (Array.isArray(value)) return value.map(deBuffer);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = deBuffer(value[k]);
    }
    return out;
  }
  return value;
}