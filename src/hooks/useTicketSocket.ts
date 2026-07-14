"use client";

import { useEffect, useRef } from "react";
import { socket } from "@/socket/socket";
import {
  TicketAssignedEvent,
  TicketMessageEvent,
  TicketStatusChangedEvent,
} from "@/types/support";

// SPEC-ADAPTED: spec suggests a separate NEXT_PUBLIC_SOCKET_URL; this codebase
// already shares a single socket instance authed via NEXT_PUBLIC_API_URL, so
// we reuse it and just attach room-level listeners here.

interface TicketRoomHandlers {
  onMessage?: (event: TicketMessageEvent) => void;
  onStatusChanged?: (event: TicketStatusChangedEvent) => void;
  onAssigned?: (event: TicketAssignedEvent) => void;
  onReconnect?: () => void;
}

interface JoinAck {
  ok: boolean;
  error?: "not_found" | "invalid_ticket_id" | "server_error";
}

export function useTicketRoomSocket(
  ticketId: number | null | undefined,
  handlers: TicketRoomHandlers,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!ticketId) return;
    const numericId = Number(ticketId);
    if (!Number.isFinite(numericId)) return;

    const joinRoom = () => {
      socket.emit("join:ticket", { ticket_id: numericId }, (ack?: JoinAck) => {
        if (!ack?.ok && ack?.error) {
          console.warn(
            `join:ticket failed for ${numericId}:`,
            ack.error,
          );
        }
      });
    };

    const handleMessage = (event: TicketMessageEvent) => {
      if (event.ticket_id && event.ticket_id !== numericId) return;
      handlersRef.current.onMessage?.(event);
    };

    const handleStatus = (event: TicketStatusChangedEvent) => {
      if (event.ticket_id !== numericId) return;
      handlersRef.current.onStatusChanged?.(event);
    };

    const handleAssigned = (event: TicketAssignedEvent) => {
      if (event.ticket_id !== numericId) return;
      handlersRef.current.onAssigned?.(event);
    };

    const handleConnect = () => {
      joinRoom();
      handlersRef.current.onReconnect?.();
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", handleConnect);
    socket.on("ticket:message", handleMessage);
    socket.on("ticket:status_changed", handleStatus);
    socket.on("ticket:assigned", handleAssigned);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("ticket:message", handleMessage);
      socket.off("ticket:status_changed", handleStatus);
      socket.off("ticket:assigned", handleAssigned);
      if (socket.connected) {
        socket.emit("leave:ticket", { ticket_id: numericId });
      }
    };
  }, [ticketId]);
}

interface GlobalHandlers {
  onMessage?: (event: TicketMessageEvent) => void;
  onStatusChanged?: (event: TicketStatusChangedEvent) => void;
}

export function useTicketGlobalSocket(
  handlers: GlobalHandlers,
  options?: { excludeTicketId?: number | null },
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const excludeRef = useRef(options?.excludeTicketId ?? null);
  excludeRef.current = options?.excludeTicketId ?? null;

  useEffect(() => {
    const handleMessage = (event: TicketMessageEvent) => {
      if (
        excludeRef.current &&
        event.ticket_id === excludeRef.current
      ) {
        return;
      }
      handlersRef.current.onMessage?.(event);
    };

    const handleStatus = (event: TicketStatusChangedEvent) => {
      handlersRef.current.onStatusChanged?.(event);
    };

    socket.on("ticket:message", handleMessage);
    socket.on("ticket:status_changed", handleStatus);

    return () => {
      socket.off("ticket:message", handleMessage);
      socket.off("ticket:status_changed", handleStatus);
    };
  }, []);
}
