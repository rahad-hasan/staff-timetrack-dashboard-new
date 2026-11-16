/**
 * Origins the browser fetches user content from directly, never through this
 * server.
 *
 * Screenshot URLs are signed by the API and arrive with the page's data, so
 * the browser only learns their host when the grid does. A page that is about
 * to show screenshots names the host up front (`preconnect`) and the DNS, TCP
 * and TLS handshakes run while the data is still on its way.
 *
 * The default is the production Spaces CDN, the same host `next.config.ts`
 * allows for images. A deployment on another bucket sets
 * NEXT_PUBLIC_SCREENSHOT_CDN_ORIGIN; a wrong value costs one unused
 * connection, nothing else.
 */
export const SCREENSHOT_CDN_ORIGIN =
  process.env.NEXT_PUBLIC_SCREENSHOT_CDN_ORIGIN ||
  "https://staff-time-tracker.sgp1.cdn.digitaloceanspaces.com";
