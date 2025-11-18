/**
 * IP classification utilities
 * Determines if an IP address is private/internal or public/external
 */

/**
 * Check if an IP address is private/internal
 * Includes RFC 1918 ranges, loopback, link-local, etc.
 */
export function isPrivateIP(ip: string): boolean {
  // Remove IPv6 brackets if present
  const cleanIP = ip.replace(/^\[|\]$/g, "");

  // Check for IPv4
  if (isIPv4(cleanIP)) {
    return isPrivateIPv4(cleanIP);
  }

  // Check for IPv6
  if (isIPv6(cleanIP)) {
    return isPrivateIPv6(cleanIP);
  }

  return false;
}

/**
 * Check if string is a valid IPv4 address
 */
function isIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return false;
  }
  return parts.every(
    (part) =>
      /^\d+$/.test(part) &&
      parseInt(part, 10) >= 0 &&
      parseInt(part, 10) <= 255,
  );
}

/**
 * Check if string is a valid IPv6 address
 */
function isIPv6(ip: string): boolean {
  // Basic IPv6 validation - check for colons and valid hex
  if (!ip.includes(":")) {
    return false;
  }
  const parts = ip.split(":");
  return (
    parts.length <= 8 &&
    parts.every((part) => part === "" || /^[0-9a-fA-F]{1,4}$/.test(part))
  );
}

/**
 * Check if IPv4 address is private
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  const a = parts[0];
  const b = parts[1];

  if (a === undefined) {
    return false;
  }

  // Loopback: 127.0.0.0/8
  if (a === 127) {
    return true;
  }

  // Private: 10.0.0.0/8
  if (a === 10) {
    return true;
  }

  // Private: 172.16.0.0/12
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) {
    return true;
  }

  // Private: 192.168.0.0/16
  if (a === 192 && b === 168) {
    return true;
  }

  // Link-local: 169.254.0.0/16
  if (a === 169 && b === 254) {
    return true;
  }

  // Multicast: 224.0.0.0/4
  if (a >= 224 && a <= 239) {
    return true;
  }

  return false;
}

/**
 * Check if IPv6 address is private
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = normalizeIPv6(ip);

  // Loopback: ::1
  if (normalized === "0000:0000:0000:0000:0000:0000:0000:0001") {
    return true;
  }

  // Link-local: fe80::/10
  if (
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fe90:") ||
    normalized.startsWith("fea0:") ||
    normalized.startsWith("feb0:")
  ) {
    return true;
  }

  // Unique local: fc00::/7
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  // Multicast: ff00::/8
  if (normalized.startsWith("ff")) {
    return true;
  }

  return false;
}

/**
 * Normalize IPv6 address for comparison
 */
function normalizeIPv6(ip: string): string {
  // This is a simplified normalization
  // For full implementation, would need to expand compressed notation
  return ip.toLowerCase();
}
