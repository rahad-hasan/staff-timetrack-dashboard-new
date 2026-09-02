/**
 * Where the Quick Setup tutorial clips live.
 *
 * They used to ship inside `public/videos/` — ~53MB of MP4 in the repo, in the
 * Docker image and in the `output: "standalone"` bundle, all served by the
 * Node server on the same origin (and the same connection) as the dashboard's
 * own API traffic. They now come from a public DigitalOcean Spaces bucket
 * behind its CDN edge, which is what actually makes them play smoothly:
 * requests terminate at a nearby PoP, `Range` requests are answered with 206
 * so the browser can stream rather than download-then-play, and a 17MB clip no
 * longer competes with the dashboard's own requests for origin bandwidth.
 *
 * The origin is overridable so a self-hosted or air-gapped deploy can point at
 * its own bucket without a code change:
 *
 *   NEXT_PUBLIC_TUTORIAL_VIDEO_ORIGIN=https://cdn.example.com/tutorials
 *
 * `NEXT_PUBLIC_*` is inlined at build time, so this module is safe to import
 * from a server component and from the browser alike.
 *
 * NOTE for whoever re-uploads these: keep every object **public-read** and
 * keep the `Content-Type: video/mp4` metadata. A private object or a
 * `binary/octet-stream` content type both fail the same way — the element
 * errors and `TutorialVideo` falls back to its poster panel, silently.
 */

const DEFAULT_ORIGIN =
  "https://time-tracker-tutorial-videos.sgp1.cdn.digitaloceanspaces.com";

/**
 * Trailing slashes are stripped so the env value can be written either way;
 * `clip()` supplies exactly one separator.
 */
export const TUTORIAL_VIDEO_ORIGIN = (
  process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_ORIGIN || DEFAULT_ORIGIN
).replace(/\/+$/, "");

const clip = (file: string) => `${TUTORIAL_VIDEO_ORIGIN}/${file}`;

/**
 * Filenames are the version. There is no content hash, so a re-recorded clip
 * uploaded under the same name is only picked up once the CDN edge and the
 * browser both expire it — publish `add-client-tutorial-v2.mp4` and change the
 * value here instead of overwriting in place.
 */
export const TUTORIAL_VIDEOS = {
  addClient: clip("add-client-tutorial.mp4"),
  addProject: clip("add-project-tutorial.mp4"),
  addMember: clip("add-member-tutorial.mp4"),
  downloadApp: clip("download-app-tutorial.mp4"),
  /**
   * Uploaded and live, but not wired to anything yet: there is no
   * `TASK_CREATED` milestone, so no checklist row can point at it. Listed here
   * so the bucket's contents and this file stay in step.
   */
  addTask: clip("add-task-tutorial.mp4"),
} as const;
