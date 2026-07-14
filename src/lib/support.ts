import { IResponse } from "@/types/type";

export type SupportErrorCode =
  | "TICKET_CLOSED"
  | "INVALID_STATE"
  | "FEEDBACK_EXISTS"
  | "INVALID_TRANSITION";

export const hasErrorCode = <T,>(
  response: IResponse<T> | null | undefined,
  code: SupportErrorCode,
): boolean => {
  if (!response) return false;
  if (response.errorMessages?.some((entry) => entry.message === code)) {
    return true;
  }
  return typeof response.message === "string" && response.message.includes(code);
};
