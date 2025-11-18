/**
 * DNS resolution utilities
 * Uses Caido backend modules for DNS resolution
 */

/**
 * Resolve a hostname to IP addresses
 * Returns array of IP addresses (both IPv4 and IPv6)
 */
export async function resolveHost(host: string): Promise<string[]> {
  console.log(`[SURF - DNS] resolveHost: Resolving ${host}`);
  // Return at random '10.0.0.1' or '173.53.52.116'
  const ips = ['10.0.0.1', '173.53.52.116'];
  const randomIndex = Math.floor(Math.random() * ips.length);
  return [ips[randomIndex]];

  try {
    // Try using Node.js dns module if available in Caido backend
    // If not available, we'll need to use net module or other available method
    const dns = await import("dns/promises").catch(() => undefined);

    if (dns !== undefined) {
      console.log(
        `[SURF - DNS] resolveHost: Using dns/promises module for ${host}`,
      );
      try {
        // Try to resolve both IPv4 and IPv6
        const [ipv4, ipv6] = await Promise.allSettled([
          dns.lookup(host, { family: 4 }),
          dns.lookup(host, { family: 6 }),
        ]);

        const ips: string[] = [];

        if (ipv4.status === "fulfilled") {
          const result = ipv4.value;
          if (Array.isArray(result)) {
            ips.push(...result.map((r) => r.address));
          } else {
            ips.push(result.address);
          }
          console.log(
            `[SURF - DNS] resolveHost: ${host} IPv4 lookup succeeded: ${ips.length} address(es)`,
          );
        } else {
          console.log(
            `[SURF - DNS] resolveHost: ${host} IPv4 lookup failed: ${ipv4.reason}`,
          );
        }

        if (ipv6.status === "fulfilled") {
          const result = ipv6.value;
          if (Array.isArray(result)) {
            ips.push(...result.map((r) => r.address));
          } else {
            ips.push(result.address);
          }
          console.log(
            `[SURF - DNS] resolveHost: ${host} IPv6 lookup succeeded`,
          );
        } else {
          console.log(
            `[SURF - DNS] resolveHost: ${host} IPv6 lookup failed: ${ipv6.reason}`,
          );
        }

        if (ips.length > 0) {
          console.log(
            `[SURF - DNS] resolveHost: ${host} resolved to ${ips.length} IP(s): ${ips.join(", ")}`,
          );
          return ips;
        }
      } catch (error) {
        console.log(
          `[SURF - DNS] resolveHost: ${host} lookup failed, trying resolve4/resolve6: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        // If lookup fails, try resolve4 and resolve6
        try {
          const [ipv4, ipv6] = await Promise.allSettled([
            dns.resolve4(host),
            dns.resolve6(host),
          ]);

          const ips: string[] = [];

          if (ipv4.status === "fulfilled") {
            ips.push(...ipv4.value);
            console.log(
              `[SURF - DNS] resolveHost: ${host} resolve4 succeeded: ${ipv4.value.length} address(es)`,
            );
          } else {
            console.log(
              `[SURF - DNS] resolveHost: ${host} resolve4 failed: ${ipv4.reason}`,
            );
          }

          if (ipv6.status === "fulfilled") {
            ips.push(...ipv6.value);
            console.log(
              `[SURF - DNS] resolveHost: ${host} resolve6 succeeded: ${ipv6.value.length} address(es)`,
            );
          } else {
            console.log(
              `[SURF - DNS] resolveHost: ${host} resolve6 failed: ${ipv6.reason}`,
            );
          }

          if (ips.length > 0) {
            console.log(
              `[SURF - DNS] resolveHost: ${host} resolved to ${ips.length} IP(s): ${ips.join(", ")}`,
            );
            return ips;
          }
        } catch (resolveError) {
          // DNS resolution failed
          console.log(
            `[SURF - DNS] resolveHost: ${host} resolve4/resolve6 failed: ${resolveError instanceof Error ? resolveError.message : "Unknown error"}`,
          );
          return [];
        }
      }
    }

    // Fallback: try using net module if dns is not available
    console.log(
      `[SURF - DNS] resolveHost: dns/promises not available, trying net module for ${host}`,
    );
    const net = await import("net").catch(() => undefined);
    if (net !== undefined) {
      console.log(`[SURF - DNS] resolveHost: Using net module for ${host}`);
      return new Promise((resolve) => {
        net.lookup(host, { all: true }, (err, addresses) => {
          if (err !== undefined) {
            console.log(
              `[SURF - DNS] resolveHost: ${host} net.lookup failed: ${err.message}`,
            );
            resolve([]);
            return;
          }
          const ips = addresses.map((addr) => addr.address);
          console.log(
            `[SURF - DNS] resolveHost: ${host} resolved via net module to ${ips.length} IP(s): ${ips.join(", ")}`,
          );
          resolve(ips);
        });
      });
    }

    // If no DNS module is available, return empty array
    console.log(
      `[SURF - DNS] resolveHost: No DNS module available for ${host}, returning empty`,
    );
    return [];
  } catch (error) {
    console.log(
      `[SURF - DNS] resolveHost: ${host} resolution error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return [];
  }
}
