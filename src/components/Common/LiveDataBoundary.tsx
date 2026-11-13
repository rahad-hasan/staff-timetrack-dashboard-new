"use client";

import { Component, type ReactNode } from "react";
import { unstable_rethrow, useSearchParams } from "next/navigation";
import AutoRecoveringError from "@/components/Common/AutoRecoveringError";

interface LiveDataBoundaryProps {
  children: ReactNode;
  /** Draws the fallback compact, for a dialog's content rather than a page. */
  compact?: boolean;
  /** For a dashboard panel: the fallback takes the panel's frame and heading. */
  title?: string;
  /** Classes for the fallback's outermost element, such as the panel's margins. */
  className?: string;
}

/**
 * The error boundary for the live part of a page (its sheet, table, grid or
 * dashboard panel), placed below the filters that choose what it shows.
 *
 * A route's error.tsx replaces the whole page, filters included, so a failed
 * read left nothing to change but "Try again". Here it costs only the data:
 * the filters stay usable, and AutoRecoveringError heals the view once the API
 * answers again. A filter change is a new request, so it clears the failure;
 * Next's own boundaries only do that on a new pathname.
 */
export default function LiveDataBoundary(props: LiveDataBoundaryProps) {
  const query = useSearchParams().toString();

  return <Boundary {...props} query={query} />;
}

interface BoundaryProps extends LiveDataBoundaryProps {
  query: string;
}

interface BoundaryState {
  failed: boolean;
  /** The query the view was rendered for. */
  query: string;
  /** The content the view was rendered from. */
  children: ReactNode;
}

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {
    failed: false,
    query: this.props.query,
    children: this.props.children,
  };

  static getDerivedStateFromError(error: unknown): Partial<BoundaryState> {
    // redirect() and notFound() are for Next's own boundaries further up
    // (baseApi's redirect to /session-expired above all); Next's error
    // boundaries let them through the same way.
    unstable_rethrow(error);
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: BoundaryProps,
    state: BoundaryState,
  ): Partial<BoundaryState> | null {
    // Cleared by new content for a new query, not by the URL alone: Back or
    // Forward to a view the router holds commits the URL one render before
    // the restored content, and a reset then re-caught the old content's
    // error and kept the failure over the restored, healthy view.
    if (props.children === state.children) return null;
    if (props.query === state.query) return { children: props.children };
    return { failed: false, query: props.query, children: props.children };
  }

  reset = () => this.setState({ failed: false });

  render() {
    const { children, compact, title, className } = this.props;
    return this.state.failed ? (
      <AutoRecoveringError
        reset={this.reset}
        compact={compact}
        title={title}
        className={className}
      />
    ) : (
      children
    );
  }
}
