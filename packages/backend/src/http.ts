/**
 * HTTP/HTTPS probing logic
 * Uses caido:http module for making requests
 */

import { fetch } from "caido:http";
export type ProbeResult = {
  success: boolean;
  protocol: "http" | "https" | undefined;
  error: string | undefined;
};

/**
 * Probe a domain with both HTTP and HTTPS
 * Returns success if either protocol succeeds
 */
export async function probeDomain(
  domain: string,
  timeout: number,
): Promise<ProbeResult> {
  console.log(
    `[SURF - HTTP] probeDomain: Probing ${domain} with timeout=${timeout}ms`,
  );

  // Try HTTPS first (more common)
  const httpsResult = await probeURL(`https://${domain}`, timeout);
  if (httpsResult.success) {
    console.log(`[SURF - HTTP] probeDomain: ${domain} accessible via HTTPS`);
    return { ...httpsResult, protocol: "https" };
  }
  console.log(
    `[SURF - HTTP] probeDomain: ${domain} HTTPS failed: ${httpsResult.error}`,
  );

  // Try HTTP if HTTPS failed
  const httpResult = await probeURL(`http://${domain}`, timeout);
  if (httpResult.success) {
    console.log(`[SURF - HTTP] probeDomain: ${domain} accessible via HTTP`);
    return { ...httpResult, protocol: "http" };
  }
  console.log(
    `[SURF - HTTP] probeDomain: ${domain} HTTP failed: ${httpResult.error}`,
  );

  // Both failed, return the HTTPS error (or HTTP if that's more descriptive)
  console.log(
    `[SURF - HTTP] probeDomain: ${domain} both HTTP and HTTPS failed`,
  );
  return httpResult;
}

/**
 * Probe a specific URL
 */
async function probeURL(url: string, timeout: number): Promise<ProbeResult> {
  console.log(
    `[SURF - HTTP] probeURL: Attempting ${url} with timeout=${timeout}ms`,
  );

  try {
    // Get HTTP module
    console.log(`[SURF - HTTP] probeURL: HTTP module loaded for ${url}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[SURF - HTTP] probeURL: Timeout reached for ${url}`);
      controller.abort();
    }, timeout);

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Any response (even error codes) means the server is reachable
      if (response.status >= 100) {
        console.log(
          `[SURF - HTTP] probeURL: ${url} responded with status ${response.status} in ${duration}ms`,
        );
        return { success: true, protocol: undefined, error: undefined };
      }

      console.log(
        `[SURF - HTTP] probeURL: ${url} returned unexpected status ${response.status}`,
      );
      return {
        success: false,
        protocol: undefined,
        error: `HTTP ${response.status}`,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Check if it was aborted (timeout)
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.log(
          `[SURF - HTTP] probeURL: ${url} timed out after ${timeout}ms`,
        );
        return {
          success: false,
          protocol: undefined,
          error: "Timeout",
        };
      }

      // Connection refused, DNS failure, etc.
      const errorMsg =
        fetchError instanceof Error ? fetchError.message : "Unknown error";
      console.log(
        `[SURF - HTTP] probeURL: ${url} failed with error: ${errorMsg}`,
      );
      return {
        success: false,
        protocol: undefined,
        error: errorMsg,
      };
    }
  } catch (importError) {
    // If caido:http is not available, return error
    console.log(`[SURF - HTTP] probeURL: HTTP module not available for ${url}`);
    return {
      success: false,
      protocol: undefined,
      error: "HTTP module not available",
    };
  }
}
