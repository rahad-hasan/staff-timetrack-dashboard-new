/**
 * Class strings shared by the live chat controls, so the teaser's button, its
 * close icon and the launcher stay in step.
 */

export const LIVE_CHAT_FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-live-chat-from";

/**
 * Every control that opens the chat. The gradient is set per control
 * (`bg-live-chat-action` or `bg-live-chat-fab`, see globals.css) because the
 * marketing design angles it differently on the pill and on the circle.
 */
export const LIVE_CHAT_ACTION = `cursor-pointer text-white transition-[filter] duration-150 hover:brightness-110 ${LIVE_CHAT_FOCUS_RING}`;
