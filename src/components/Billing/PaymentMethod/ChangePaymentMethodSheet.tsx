"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  describePaymentMethod,
  formatCardExpiry,
  hasExpiry,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

import AddPaymentMethodForm, {
  type AddPaymentMethodFormHandle,
  type AddPaymentMethodFormState,
} from "./AddPaymentMethodForm";
import { PaymentMethodMark } from "./SavedCardVisual";
import type { PaymentMethodsState } from "./usePaymentMethods";

/**
 * "Change Payment Method" — the right-hand sheet behind the Change Card button.
 *
 * It takes the `usePaymentMethods` state rather than calling the hook itself:
 * the tab already holds one, and a second instance would mean two reads of the
 * same list, two independent `mutating` flags, and a card visual that disagrees
 * with the radio list the moment either one wrote.
 *
 * There is exactly ONE button, and the drawer is always in one of two MODES
 * that say what a press means — adding the card in the fields below, or making
 * a saved card the one the subscription renews on. The mode is what the drawer
 * is already showing (see `isAddingCard`), never a guess made at press time,
 * so the button can never act on something other than what the admin is
 * looking at. See `mode` and `handleUpdate`.
 */
export default function ChangePaymentMethodSheet({
  open,
  onOpenChange,
  payments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: PaymentMethodsState;
}) {
  const { methods, defaultId, loading, mutating, setDefault, detach, refresh } =
    payments;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /**
   * A card that Stripe has ATTACHED but that we failed to promote — the retry
   * target, remembered rather than merely selected.
   *
   * The selection alone cannot keep the button alive on that path: promoting
   * runs a `refresh()` (the list goes back to loading) and a `refreshIntent()`
   * (the card fields unmount while a new SetupIntent is minted), so for a first
   * card both of the things `canSubmit` normally leans on are gone at exactly
   * the moment the message tells the admin to press the button again.
   */
  const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(null);

  /**
   * The add-card form reports itself up here because the button that submits
   * it lives out here. `addForm.empty` is Stripe's own flag for "nothing typed
   * into the card fields yet" — the cross-origin iframe means nothing else
   * could tell us.
   */
  const addFormRef = useRef<AddPaymentMethodFormHandle | null>(null);
  const [addForm, setAddForm] = useState<AddPaymentMethodFormState>({
    empty: true,
    ready: false,
    submitting: false,
  });

  /**
   * Something is typed into the card fields ⇒ the drawer is adding a card.
   *
   * This is a MODE, not a prediction: from the first keystroke the saved-card
   * rows below go muted and their radios dead, so there is no selected radio
   * left for the button to ignore. `clearNewCard` is the way back out.
   */
  const isAddingCard = addForm.ready && !addForm.empty;

  /**
   * Is the drawer on screen RIGHT NOW?
   *
   * Read from callbacks that outlive the render which started them — a
   * `confirmSetup` runs for seconds and the admin can close the drawer while
   * it does, at which point the `open` prop captured in that closure is a lie.
   * Also doubles as the closed→open edge detector for the reset below.
   */
  const openRef = useRef(false);

  /**
   * RESET ON OPEN. The `<Sheet>` root is mounted with the tab and simply
   * toggles `open`, so every piece of state in here outlives a close — without
   * this, the next admin to open it is greeted by the decline message from the
   * previous attempt and a selection they never made.
   *
   * Guarded on the closed→open transition (not on `open` alone) so a background
   * refetch that moves `defaultId` cannot yank the radio out from under someone
   * mid-decision.
   *
   * `addForm` is deliberately NOT reset here: it is a mirror of whatever form
   * is currently mounted, and the form re-reports itself from scratch (Radix
   * unmounts the sheet's content on close). Clearing it here could only ever
   * make the mirror disagree with the fields the admin can actually see.
   */
  useEffect(() => {
    if (open && !openRef.current) {
      setSelectedId(defaultId ?? methods[0]?.id ?? null);
      setError(null);
      setRemovingId(null);
      setSaving(false);
      setPendingDefaultId(null);
    }
    openRef.current = open;
  }, [open, defaultId, methods]);

  /**
   * Adopt a selection whenever nothing is selected — the list arriving after
   * the drawer opened, a first card being saved from the form below, or the
   * selected card being removed. Guarded on `selectedId === null` so it can
   * never override a live choice.
   *
   * It falls back to the FIRST card, not just to the server default, because
   * `defaultId` is legitimately null while a card exists: promotion happens in
   * the `setup_intent.succeeded` webhook and only when the customer has no
   * default yet, so a first card reads back with no default at all until that
   * webhook lands. Leaving the selection null there would hand the button
   * below nothing to write — which is exactly the state the admin opened this
   * drawer to fix.
   */
  useEffect(() => {
    if (!open || selectedId !== null) return;
    const fallback = defaultId ?? methods[0]?.id ?? null;
    if (fallback) setSelectedId(fallback);
  }, [open, selectedId, defaultId, methods]);

  /**
   * A write of OUR own is in flight — promoting a card or removing one.
   *
   * Handed to the form below, whose fields stay focusable while our button is
   * disabled: Enter inside one of them was the one remaining way to start a
   * `confirmSetup` alongside a promote, with whichever landed last deciding
   * the renewal card.
   */
  const ownerBusy = saving || mutating;
  /** Either path's write is in flight — the single button spins for both. */
  const submitting = saving || addForm.submitting;
  const busy = submitting || mutating;

  /**
   * `methods` starts as `[]` and stays that way until the first read lands, so
   * an empty list is only MEANINGFUL once we have loaded at least once. Rows in
   * hand also count: a background `refresh()` flips `loading` back on without
   * ever making the list unknown again.
   */
  const listKnown = !loading || methods.length > 0;

  /**
   * The card a promote would write. The selection wins whenever there is one —
   * it is the admin's own choice — and the remembered card carries the retry
   * path while the list reloads underneath it.
   */
  const promoteTarget = selectedId ?? pendingDefaultId;

  /**
   * What the single button is FOR right now.
   *
   * "unknown" is the first list read: with the rows still in flight this drawer
   * cannot yet tell "add your first card" from "change which card renews", and
   * a button that names the wrong one of those — then renames itself a moment
   * later — is worse than a button that waits. The tab loads this list on
   * mount, so the window is only ever the odd drawer opened mid-fetch.
   */
  const mode: "add" | "promote" | "unknown" = isAddingCard
    ? "add"
    : pendingDefaultId || (listKnown && methods.length > 0)
      ? "promote"
      : listKnown
        ? "add"
        : "unknown";

  /**
   * Promoting needs nothing but a target, and has one by definition of the
   * mode. Adding asks only that the form be mounted — NOT that Stripe has
   * already seen a keystroke, because an incomplete card is something Stripe
   * reports under the very field it is missing, which a disabled button never
   * could.
   */
  const canSubmit =
    mode === "promote" ? true : mode === "add" ? addForm.ready : false;

  /** The label names the job; in "unknown" there is no job to name yet. */
  const actionLabel = mode === "promote" ? "Update Card" : "Add Card";

  /** Rows worth muting — during the first load there is nothing on screen. */
  const showSavedCards = !loading && methods.length > 0;

  const handleRemove = async (id: string) => {
    setError(null);
    setRemovingId(id);
    const result = await detach(id);
    setRemovingId(null);

    if (!result.ok) {
      // Usually the deliberate "this is the last card behind a live
      // subscription" refusal. Show it where the trash icon is — swallowing it
      // would leave the admin clicking a button that silently does nothing.
      setError(result.message);
      return;
    }

    toast.success("Payment method removed.");
    // The removed card may have been the selection; fall back to whatever the
    // server now reports as default.
    setSelectedId((current) => (current === id ? null : current));
    setPendingDefaultId((current) => (current === id ? null : current));
  };

  /**
   * Abandon a half-typed card and hand the drawer back to the saved-card list.
   *
   * This is the ONLY way out of add-a-card mode: the fields live in Stripe's
   * iframe, so nothing out here can empty them — only the form's `clear()`
   * can, and it reports the fields empty again, which is what flips the mode
   * back and wakes the radios.
   */
  const clearNewCard = () => {
    setError(null);
    addFormRef.current?.clear();
  };

  /**
   * Everything that happens once a card has been attached — reached from the
   * button below AND from an Enter press inside one of the form's fields, so
   * both end in the same place.
   *
   * The new card is promoted EXPLICITLY, and that is the whole point of this
   * function. Stripe's `setup_intent.succeeded` webhook does promote a newly
   * attached card, but only when the customer has no default yet (the handler
   * bails out on an existing default unless the intent carries `set_as_default`
   * metadata, and nothing in this stack sets it), it writes only the CUSTOMER's
   * default — never the subscription's — and it lands whenever the webhook
   * lands, which is after we would have refreshed. Left to the webhook, an
   * admin swapping card A for card B gets B attached as a spare and keeps
   * renewing on A.
   */
  const handleCardSaved = async (paymentMethodId: string | null) => {
    if (!paymentMethodId) {
      // Belt and braces: a confirmed SetupIntent always names its payment
      // method. With no id there is nothing to promote, so just show the list.
      // No fresh intent on this path — the drawer is closing, and one minted
      // for a panel that is unmounting is an intent nobody will ever confirm.
      refresh();
      onOpenChange(false);
      return;
    }

    const promoted = await setDefault(paymentMethodId);
    // The card is attached either way, and only a re-read shows it in the list
    // below — including on the failure path, where the admin needs to see it
    // to retry.
    refresh();

    if (promoted.ok) {
      toast.success(
        "Payment method saved — your subscription now renews on it.",
      );
      onOpenChange(false);
      return;
    }

    /**
     * The card IS saved. Saying "we could not save your card" here would send
     * the admin off to re-enter a card Stripe already holds, so name the half
     * that actually failed.
     *
     * When the drawer has already gone — `confirmSetup` takes seconds and 3D
     * Secure takes longer, and the admin is free to close it in the meantime —
     * there is no panel left to render into: Radix has unmounted this whole
     * subtree, and the reset-on-open above would wipe the message before it
     * could ever be read. A toast is the only surface left, and this failure
     * is far too consequential to drop on the floor: their card is attached
     * and is NOT the one the subscription renews on.
     */
    const detail = [
      "Your payment method was saved, but we could not make it the one your subscription renews on.",
      promoted.message,
    ]
      .filter(Boolean)
      .join(" ");

    if (!openRef.current) {
      toast.error(
        `${detail} Reopen Change Payment Method and select it to try again.`,
        // Longer than the default four seconds: unlike every other toast here
        // this one asks for something to be done later, and it is the admin's
        // only notice that their renewal card did not move.
        { duration: 10_000 },
      );
      return;
    }

    // Selected so the button retries the promotion ALONE — no second card, no
    // second SetupIntent — and remembered so that retry stays pressable while
    // the list and the intent below both reload. See `pendingDefaultId`.
    setPendingDefaultId(paymentMethodId);
    setSelectedId(paymentMethodId);
    setError(
      `${detail} It is selected below — press the button again to retry.`,
    );

    // A SetupIntent is single-use and the confirm above just spent this one.
    // The drawer stays open here, so those fields are still in play: without a
    // fresh intent the next card typed into them is refused with "already
    // succeeded", which reads as a second, inexplicable failure.
    addFormRef.current?.refreshIntent();
  };

  /**
   * The one button, and the two things a press can mean.
   *
   * Whichever mode the drawer is in, it is the mode the admin can SEE, and the
   * press cannot silently do the other one. The promote branch always writes:
   * `selectedId === defaultId` is NOT evidence that the subscription renews on
   * that card, because the list reports the CUSTOMER's default and falls back
   * to the subscription's only when the customer has none — so a subscription
   * created with an explicit `default_payment_method` can still be charging an
   * older card while the list flags the new one "Default". The endpoint writes
   * both levels and is idempotent, which makes re-running it on an
   * already-default card the repair for exactly that mismatch. Closing without
   * writing would leave the admin believing they had fixed it.
   */
  const handleUpdate = async () => {
    setError(null);

    if (isAddingCard) {
      // Nothing to do with the resolved id out here: failures have already
      // rendered themselves inside the form (a field message, or the decline
      // panel next to the fields), and success runs through the form's
      // `onSaved` — `handleCardSaved` above — which promotes, refreshes and
      // closes.
      await addFormRef.current?.submit();
      return;
    }

    if (promoteTarget) {
      // `defaultId` may well be null here: a first card whose promotion webhook
      // has not landed lists with no default at all, and promoting it is
      // precisely what this press is asking for.
      setSaving(true);
      const result = await setDefault(promoteTarget);
      setSaving(false);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPendingDefaultId(null);
      toast.success(
        promoteTarget === defaultId
          ? // It already read as Default, so "updated" would sound like a
            // no-op. It was not one: both the customer-level and the
            // subscription-level default have just been written.
            "Confirmed — your subscription renews on this card."
          : "Default payment method updated.",
      );
      onOpenChange(false);
      return;
    }

    // Nothing saved to promote, and nothing typed: the press can only be about
    // the empty form. Hand it over — Stripe answers an incomplete card with a
    // message under the field it is missing, which beats closing the drawer as
    // though something had happened.
    if (addForm.ready) {
      await addFormRef.current?.submit();
      return;
    }

    setError("Add a card below to continue.");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto bg-bgPrimary sm:max-w-xl dark:bg-darkPrimaryBg dark:border-darkBorder"
      >
        {/* `pr-12` clears the sheet's built-in close button, which is
            absolutely positioned in this same corner. No rule under the
            header — the design runs the drawer as one uninterrupted column. */}
        <SheetHeader className="pr-12">
          <SheetTitle className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
            Change Payment Method
          </SheetTitle>
          <SheetDescription className="text-subTextColor dark:text-darkTextSecondary">
            Choose a different payment method for your subscription.
          </SheetDescription>
        </SheetHeader>

        {/* Not `flex-1`: `SheetContent` is a full-height flex column, so a
            growing body would stretch to the viewport and strand the button at
            the bottom edge with dead space above it. Sized to its content, the
            column simply ends under the button, and the sheet itself scrolls
            (`overflow-y-auto` above) when the content outgrows a short
            viewport. */}
        <div className="space-y-5 p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Says out loud what the muted rows below are already showing, and
              carries the only way back to them. Only worth drawing when there
              ARE saved cards: with none, adding is the drawer's only job and
              nothing has been taken away. */}
          {isAddingCard && showSavedCards && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="min-w-0 flex-1 text-sm text-headingTextColor dark:text-darkTextPrimary">
                Adding a new card — it becomes the card your subscription
                renews on. Your saved cards are paused.
              </p>
              <Button
                type="button"
                variant="outline2"
                size="sm"
                disabled={busy}
                onClick={clearNewCard}
                className="shrink-0"
              >
                Clear
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2" aria-busy>
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="h-16 w-full animate-pulse rounded-xl bg-gray-300 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : methods.length === 0 ? (
            <p className="rounded-xl border border-dashed border-borderColor p-4 text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
              No payment methods saved yet. Add one below and it becomes the
              method your subscription renews on.
            </p>
          ) : (
            // Muted as a block while a new card is being typed: these rows are
            // not a choice the button will act on, and a live-looking list
            // beside a card form is how an admin ends up believing they picked
            // one thing and saved another.
            <div className={cn("space-y-3", isAddingCard && "opacity-60")}>
              {methods.map((method) => {
                const isDefault = method.id === defaultId;
                // No selection ring in add-a-card mode, for the same reason the
                // radios go dead: the admin must never see a row flagged as
                // chosen while the button is aimed somewhere else.
                const isSelected = !isAddingCard && selectedId === method.id;
                const isRemoving = removingId === method.id;

                return (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                      isSelected
                        ? // The extra weight is a ring rather than `border-2`:
                          // a thicker border would reflow the row by a pixel
                          // every time the selection moved.
                          "border-primary bg-primary/5 ring-1 ring-primary/25"
                        : "border-borderColor dark:border-darkBorder",
                    )}
                  >
                    {/* The trash button sits OUTSIDE the label: nested inside
                        it, every click to remove a card would first select it. */}
                    <label
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3",
                        isAddingCard ? "cursor-not-allowed" : "cursor-pointer",
                      )}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        checked={isSelected}
                        onChange={() => setSelectedId(method.id)}
                        disabled={busy || isAddingCard}
                        className="size-5 shrink-0 accent-primary"
                      />
                      {/* Plated: the wordmarks inherit `currentColor`, and the
                          row's text is near-white in dark mode. The plate owns
                          its own dark ink and sizing — nothing to add here.
                          `type` is what picks the mark: a Link wallet arrives
                          with an EMPTY brand, and brand alone would plate it as
                          a generic card. */}
                      <PaymentMethodMark
                        type={method.type}
                        brand={method.brand}
                        plate
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            {describePaymentMethod(method)}
                          </span>
                          {isDefault && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
                              Default
                            </span>
                          )}
                        </span>
                        {/* A non-card method has no expiry at all (0/0 on
                            the wire), so "Expires —" under a Link wallet is the
                            same lie as calling it a card. The line still
                            renders — every row keeps one height down the list —
                            but it says what is true of THIS method. */}
                        <span className="mt-0.5 block text-xs text-subTextColor dark:text-darkTextSecondary">
                          {hasExpiry(method)
                            ? `Expires ${formatCardExpiry(
                                method.exp_month,
                                method.exp_year,
                              )}`
                            : "No expiry date"}
                        </span>
                      </span>
                    </label>

                    {!isDefault && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${describePaymentMethod(method)}`}
                        // Paused with the rest of the row while a new card is
                        // being typed — removing a card is a write, and this
                        // list is not the thing being acted on right now.
                        disabled={busy || isRemoving || isAddingCard}
                        onClick={() => void handleRemove(method.id)}
                        className="shrink-0 text-subTextColor hover:text-red-600 dark:text-darkTextSecondary dark:hover:text-red-400"
                      >
                        {isRemoving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-borderColor dark:bg-darkBorder" />
            <span className="text-xs font-medium text-subTextColor dark:text-darkTextSecondary">
              Or add a new payment method
            </span>
            <span className="h-px flex-1 bg-borderColor dark:bg-darkBorder" />
          </div>

          <AddPaymentMethodForm
            ref={addFormRef}
            busy={ownerBusy}
            onStateChange={setAddForm}
            onSaved={handleCardSaved}
          />

          {/* Inline under the form's "Select Country" field, where the design
              puts it — no rule above it: the design ends the column with the
              button rather than pinning a footer bar under a divider. */}
          <div className="space-y-3">
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={busy || !canSubmit}
              // The skeleton below leaves nothing to read out, so name the
              // wait instead of handing a screen reader an unlabelled button.
              aria-label={
                mode === "unknown" ? "Loading your saved cards" : undefined
              }
              onClick={() => void handleUpdate()}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "unknown" ? (
                <span
                  aria-hidden
                  className="h-4 w-24 animate-pulse rounded bg-white/40"
                />
              ) : (
                actionLabel
              )}
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-subTextColor dark:text-darkTextSecondary">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="size-3.5" />
              </span>
              Your payment information is fully secure.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
