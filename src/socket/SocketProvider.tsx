"use client";

import { useEffect } from "react";
import { loadSocket } from "./loadSocket";

interface SocketProviderProps {
  children: React.ReactNode;
  /**
   * Names the session without being its credential: a digest of the session
   * cookie from the layout, absent when signed out. It changes exactly when
   * the cookie does (a sign-in, a password change that rotates it).
   */
  session?: string;
}

/**
 * Owns the app's one socket.io connection for the signed-in shell.
 *
 * The handshake presents a socket ticket (see socket.ts), fetched at every
 * connection attempt. The session's access token used to be a prop here,
 * which put it in every page's payload for any script to read.
 *
 * `session` only says WHEN to reconnect. A handshake is made once, when the
 * socket connects, so a session that changed needs a new one: the `/support`
 * namespace refuses a connection whose session predates a password change.
 *
 * The client itself is loaded from the effect (see loadSocket), so it is not
 * part of what the shell needs to hydrate.
 */
export default function SocketProvider({ children, session }: SocketProviderProps) {
  useEffect(() => {
    if (!session) return undefined;

    const onConnectError = (error: Error) => {
      console.error("Socket connection error:", error.message);
    };

    // Set when the client has loaded and this effect has connected it. An
    // effect cleaned up before that has nothing to undo, and must not connect
    // afterwards for a session that is already gone.
    let disconnect: (() => void) | undefined;
    let cancelled = false;

    loadSocket().then(
      ({ forgetSocketTicket, socket, ticketAuth }) => {
        if (cancelled) return;

        socket.on("connect_error", onConnectError);
        socket.auth = ticketAuth();
        socket.connect();

        disconnect = () => {
          socket.off("connect_error", onConnectError);
          socket.disconnect();
          socket.auth = {};
          forgetSocketTicket();
        };
      },
      (error: unknown) => {
        // The client could not be fetched (loadSocket has already retried).
        // The app works without it; realtime updates resume on the next load.
        console.error("Socket client failed to load:", error);
      },
    );

    // Runs before the next session connects and when the shell unmounts, so
    // there is only ever one connection, made for the current session. Only
    // this effect's own listener is removed: others subscribe to the same
    // socket.
    return () => {
      cancelled = true;
      disconnect?.();
    };
  }, [session]);

  return <>{children}</>;
}
