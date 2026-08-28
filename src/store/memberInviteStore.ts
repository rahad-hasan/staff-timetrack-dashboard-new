import { create } from "zustand";

/**
 * One-shot "open the Add Member dialog" intent.
 *
 * Raised from anywhere in the app (the profile menu's "Invite member to team")
 * and claimed by `MemberHeroSection` once the members page has mounted.
 *
 * A store rather than an `?invite=1` query param on purpose: the members list
 * is a server component rendered under a `Suspense` boundary keyed on its
 * search params, so putting the flag in the URL — and then stripping it again
 * so a refresh does not reopen the dialog — would refetch the table and flash
 * its skeleton twice for what is purely client-side UI state.
 */
type MemberInviteStore = {
  /** True between the menu click and the dialog actually opening. */
  isInvitePending: boolean;
  requestInvite: () => void;
  consumeInvite: () => void;
};

export const useMemberInviteStore = create<MemberInviteStore>((set) => ({
  isInvitePending: false,

  requestInvite: () => set({ isInvitePending: true }),

  consumeInvite: () => set({ isInvitePending: false }),
}));
