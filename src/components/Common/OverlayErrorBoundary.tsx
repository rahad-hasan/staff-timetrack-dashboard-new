"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface OverlayErrorBoundaryProps {
  /** Names the overlay in the console line. */
  label: string;
  /**
   * Called once, when the overlay fails. The owner must leave its state
   * consistent with "nothing renders here any more" — e.g. end a running tour
   * whose spotlight and tooltip just vanished.
   */
  onError?: (error: Error) => void;
  children: ReactNode;
}

interface OverlayErrorBoundaryState {
  failed: boolean;
}

/**
 * Keeps an onboarding overlay's failure inside the overlay.
 *
 * The overlays are loaded on demand, so they can fail in a way a static
 * import cannot: a tab opened before a deploy asks for a chunk the new build
 * no longer serves. They are mounted from the app-wide layout, where an
 * uncaught error replaces every page with the error screen — losing the guide
 * or the palette is the right failure instead.
 *
 * Fails closed until the layout remounts (the next full page load): a lazy
 * component remembers a failed load, so there is nothing to retry in place.
 */
export default class OverlayErrorBoundary extends Component<
  OverlayErrorBoundaryProps,
  OverlayErrorBoundaryState
> {
  state: OverlayErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): OverlayErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[${this.props.label}] disabled after an error`,
      error,
      info.componentStack,
    );
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
