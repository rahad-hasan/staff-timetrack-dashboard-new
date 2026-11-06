"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface LiveChatErrorBoundaryProps {
  children: ReactNode;
}

interface LiveChatErrorBoundaryState {
  failed: boolean;
}

/**
 * Keeps a live chat failure inside the live chat. The chat is mounted in the
 * authenticated layout, so without this one bad render or effect would blank
 * the whole dashboard.
 *
 * It fails closed. Rendering nothing unmounts the subtree, and that runs
 * `useCrispSession`'s cleanup, which hides Crisp's UI and unbinds the user.
 * It stays off until the layout remounts (the next full page load).
 */
export default class LiveChatErrorBoundary extends Component<
  LiveChatErrorBoundaryProps,
  LiveChatErrorBoundaryState
> {
  state: LiveChatErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): LiveChatErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[live-chat] disabled after an error", error, info.componentStack);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
