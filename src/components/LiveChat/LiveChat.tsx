"use client";

import { preconnect } from "react-dom";
import { CRISP_WEBSITE_ID } from "@/lib/liveChat/config";
import { CRISP_ORIGIN } from "@/lib/liveChat/crisp";
import {
  useCrispSession,
  type LiveChatVisitor,
} from "@/lib/liveChat/useCrispSession";
import { useLogInUserStore } from "@/store/logInUserStore";
import LiveChatDock from "./LiveChatDock";
import LiveChatErrorBoundary from "./LiveChatErrorBoundary";

interface LiveChatProps {
  /**
   * From the session cookie (`getDecodedUser`) rather than `logInUserStore`.
   * That store is localStorage-backed and empty on a fresh browser, and the
   * id is what keeps one user's conversation away from the next.
   */
  user: { id?: number; email?: string; role?: string } | null;
  companyName?: string;
}

/**
 * Crisp live chat for the signed-in dashboard. Mount once, in the
 * authenticated layout. It renders nothing when `NEXT_PUBLIC_CRISP_WEBSITE_ID`
 * is unset, when there is no user id to bind the conversation to, until
 * Crisp has loaded, or after any error inside it.
 */
export default function LiveChat(props: LiveChatProps) {
  // Switched off: nothing mounts, subscribes or loads.
  if (!CRISP_WEBSITE_ID) return null;

  return (
    <LiveChatErrorBoundary>
      <LiveChatSession {...props} />
    </LiveChatErrorBoundary>
  );
}

function LiveChatSession({ user, companyName }: LiveChatProps) {
  // Only a label for the support inbox, so the persisted store is good
  // enough here. Crisp falls back to the email when it is empty.
  const name = useLogInUserStore(
    (state) => state.logInUserData?.name as string | undefined,
  );

  const visitor: LiveChatVisitor | null =
    typeof user?.id === "number" && Number.isFinite(user.id)
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
          name,
          company: companyName,
        }
      : null;

  useCrispSession(visitor);

  if (!visitor) return null;

  // Crisp's loader can only start after hydration. Rendered on the server,
  // this hint opens the connection while the page is still loading.
  preconnect(CRISP_ORIGIN);
  return <LiveChatDock />;
}
