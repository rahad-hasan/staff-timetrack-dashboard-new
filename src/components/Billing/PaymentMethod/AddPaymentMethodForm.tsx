"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertTriangle, Globe, RefreshCw, User } from "lucide-react";
import { z } from "zod";

import { createSetupIntent } from "@/actions/billing/action";
import ComboboxField from "@/components/Common/ComboboxField";
import StripeElementsProvider from "@/components/Billing/Checkout/StripeElementsProvider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BILLING_URL, mapSetupFailure, PaymentFailureCopy } from "@/lib/billing";
import { countryOptions, detectBillingCountry } from "@/lib/countryOptions";
import { isStripeConfigured } from "@/lib/stripeClient";

const addCardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the name printed on the card")
    .max(60, "Name must not exceed 60 characters"),
  country: z.string().trim().min(2, "Select your billing country"),
});

type AddCardValues = z.infer<typeof addCardSchema>;

/**
 * What this form reports to whoever owns it.
 *
 * It exists because the owner draws the ONLY submit button (the design has one
 * button at the end of the drawer, not one per section), and a button outside
 * the form cannot otherwise know whether there is anything in here to save.
 *
 * `empty` is `<PaymentElement>`'s own flag, not a guess: the card fields live
 * in Stripe's cross-origin iframe, so nothing on our side of it can read them,
 * and the change event is the only honest answer to "has the admin started
 * typing a card?".
 */
export interface AddPaymentMethodFormState {
  /** No card details entered yet. */
  empty: boolean;
  /** Stripe.js and the card iframes are mounted — `submit()` can do work. */
  ready: boolean;
  /** A `confirmSetup` is in flight. */
  submitting: boolean;
}

export interface AddPaymentMethodFormHandle {
  /**
   * Validates our own fields, then confirms the SetupIntent.
   *
   * Resolves the id of the payment method Stripe just attached, and null on
   * every failure — each of which has already rendered itself where the user
   * is looking (a field message, or the decline panel), so the caller must not
   * toast over it. The same id is handed to `onSaved`, and THAT is the channel
   * the owner acts on: it fires for an Enter keypress inside a field too,
   * which is what makes Enter end exactly where the owner's button does.
   */
  submit: () => Promise<string | null>;
  /**
   * Empties the card fields (and the name), and drops any decline panel.
   *
   * The owner needs this because "there is something in the card fields" is
   * what puts its drawer into add-a-card mode — the saved-card rows stop being
   * a live choice there. Without a way to empty the fields from out there, one
   * stray keystroke would strand the admin in that mode with no route back to
   * the card they actually wanted to pick.
   */
  clear: () => void;
  /**
   * Mints a fresh SetupIntent, and with it a fresh Elements group.
   *
   * A SetupIntent is single-use: once `submit()` has confirmed one, the fields
   * on screen are bound to a spent intent and the next card typed into them
   * would be refused with "already succeeded". Only the owner knows whether
   * the panel is still in use after a save — one minted for a drawer that is
   * closing is an intent nobody will ever confirm — so the owner asks.
   */
  refreshIntent: () => void;
}

/**
 * What the inner, Elements-bound form can do for itself. The SetupIntent
 * belongs to the wrapper below, which is why `refreshIntent` is not in here.
 */
type SetupCardFormHandle = Pick<AddPaymentMethodFormHandle, "submit" | "clear">;

/** Nothing typed, nothing mounted — what the owner should assume by default. */
const IDLE_STATE: AddPaymentMethodFormState = {
  empty: true,
  ready: false,
  submitting: false,
};

/**
 * The card fields themselves. Must live INSIDE `<StripeElementsProvider>` —
 * `useStripe` / `useElements` read the Elements context, and `confirmSetup` is
 * a browser call by design: the card number never exists outside Stripe's
 * iframes, so no server action, `baseApi` call or zod schema in this repo can
 * ever see it.
 */
const SetupCardForm = ({
  onSaved,
  onStateChange,
  handleRef,
  busy = false,
}: {
  /** Receives the id of the card Stripe just attached — see `onSaved` below. */
  onSaved: (paymentMethodId: string | null) => void | Promise<void>;
  onStateChange?: (state: AddPaymentMethodFormState) => void;
  handleRef?: Ref<SetupCardFormHandle>;
  /**
   * The OWNER has a write of its own in flight — promoting a card, removing
   * one. Nothing in here could otherwise know that, and Enter inside a field
   * would start a `confirmSetup` alongside it: two writes aimed at the same
   * subscription, with whichever lands last deciding the renewal card.
   */
  busy?: boolean;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  /**
   * The same latch as `submitting`, one render earlier.
   *
   * `setSubmitting` only takes effect on the next render, so two clicks in the
   * same tick both read the state as false and both reach `confirmSetup` —
   * attaching two cards and spending two SetupIntents for one press. A ref
   * flips synchronously, and guarding here rather than in `submit()` covers
   * the Enter-key path through the `<form>` as well.
   */
  const submittingRef = useRef(false);
  const [failure, setFailure] = useState<PaymentFailureCopy | null>(null);
  /** Stripe's iframes mount asynchronously; submitting before that no-ops. */
  const [elementReady, setElementReady] = useState(false);
  /** Mirrors `<PaymentElement>`'s `empty` — see `AddPaymentMethodFormState`. */
  const [cardEmpty, setCardEmpty] = useState(true);

  const form = useForm<AddCardValues>({
    resolver: zodResolver(addCardSchema),
    mode: "onTouched",
    defaultValues: { name: "", country: "" },
  });

  /**
   * The billing-country guess reads the browser's time zone, which the server
   * does not have — resolving it during render would emit a different default
   * on the server than in the browser and blow up hydration. Post-mount only,
   * and only when the user has not already chosen.
   */
  useEffect(() => {
    const detected = detectBillingCountry();
    if (detected && !form.getValues("country")) {
      form.setValue("country", detected);
    }
  }, [form]);

  const ready = Boolean(stripe && elements && elementReady);

  // Reported from an effect rather than during render: the owner keeps this in
  // state, and telling it mid-render would be a setState on another component
  // while this one is rendering.
  useEffect(() => {
    onStateChange?.({ empty: cardEmpty, ready, submitting });
  }, [onStateChange, cardEmpty, ready, submitting]);

  const confirmCard = async (
    values: AddCardValues,
  ): Promise<string | null> => {
    // Stripe.js may still be loading, or the Element may not have mounted yet.
    if (!stripe || !elements || !elementReady || submittingRef.current) {
      return null;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFailure(null);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          // Only used when the customer picks a redirect-based method; cards
          // resolve in place because of `redirect: "if_required"` below.
          return_url: `${window.location.origin}${BILLING_URL}?tab=change-card`,
          payment_method_data: {
            billing_details: {
              name: values.name.trim(),
              address: { country: values.country || undefined },
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        // A declined or malformed card is a FIELD-level failure: it belongs
        // next to the form the user is still looking at, not in a toast that
        // slides away while they are re-reading their card.
        //
        // `mapSetupFailure`, not `mapPaymentFailure`: nothing was charged here.
        // The payment copy says "Payment unsuccessful" and talks about the
        // purchase, which on this drawer would tell an admin their card was
        // billed for something they never bought.
        setFailure(
          mapSetupFailure(error.code, error.decline_code, error.message),
        );
        return null;
      }

      if (setupIntent?.status === "succeeded") {
        /**
         * The id of the card Stripe just attached, and the ONLY synchronous
         * evidence of which card that was: the customer's default is moved by
         * the `setup_intent.succeeded` webhook, which is asynchronous and in
         * any case declines to move a default that already exists — so the
         * owner has to promote this id itself, and cannot get it by re-reading
         * the list.
         *
         * A confirmed intent answers with the id as a string; the object form
         * only comes back from an expanded server-side read. Narrow anyway
         * rather than hand the owner "[object Object]" as a payment-method id.
         */
        const paymentMethodId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : (setupIntent.payment_method?.id ?? null);

        // No success toast here: only the owner knows whether the card also
        // became the one that renews the subscription, and "Card saved."
        // sitting next to its "we could not make it your renewal card" panel
        // reads as a contradiction.
        //
        // Keep the resolved country — the next card is almost always billed to
        // the same place — but clear the name and the Element itself.
        //
        // Guarded because this runs on a promise that outlives the drawer: an
        // admin who closed it mid-confirm leaves a destroyed Element behind,
        // and a throw here would skip `onSaved` — a card attached at Stripe
        // that nobody promotes and nobody is told about.
        try {
          form.reset({ name: "", country: values.country });
          elements.getElement("payment")?.clear();
        } catch {
          // The fields are already gone; there is nothing left to reset.
        }
        await onSaved(paymentMethodId);
        return paymentMethodId;
      }

      setFailure(
        mapSetupFailure(
          null,
          null,
          "We could not confirm that card. Please try again.",
        ),
      );
      return null;
    } catch {
      setFailure(
        mapSetupFailure(
          null,
          null,
          "Something went wrong while saving your card. Please try again.",
        ),
      );
      return null;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const submit = async (): Promise<string | null> => {
    let savedId: string | null = null;
    // Routed through `handleSubmit` so OUR two fields are validated first: a
    // missing name has to surface under the name, not as a Stripe error about
    // billing details the user never saw a prompt for.
    await form.handleSubmit(async (values) => {
      savedId = await confirmCard(values);
    })();
    return savedId;
  };

  /**
   * Back out of a half-typed card — the route out of the owner's add-a-card
   * mode, so it has to leave the Element genuinely empty.
   *
   * `setCardEmpty(true)` is not redundant with the change event `clear()`
   * fires: an Element that has already been destroyed fires nothing at all,
   * and "there is nothing in the fields" is the honest report either way. The
   * decline panel goes too — it describes a card that is no longer on screen.
   */
  const clear = () => {
    setFailure(null);
    try {
      // Keep the resolved country, as after a successful save: the admin
      // chose it, and it is not what they are backing out of.
      form.reset({ name: "", country: form.getValues("country") });
      elements?.getElement("payment")?.clear();
    } catch {
      // Already unmounted — the state below is all that still matters.
    }
    setCardEmpty(true);
  };

  // Deliberately without a dependency array: the handle closes over `stripe`,
  // `elements` and `submitting`, and a handle frozen at mount would confirm
  // against an Elements group that has since been rebuilt.
  useImperativeHandle(handleRef, () => ({ submit, clear }));

  return (
    <Form {...form}>
      {/* No submit button of its own — the owner draws the single one. The
          form element stays so Enter still submits, and so RHF keeps the
          native validation/label wiring it expects. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          /**
           * Two latches, because there are two ways to end up with two writes
           * in the air at once:
           *
           * - `submittingRef` — a second Enter on top of our own confirm,
           *   which would attach two cards for one intent.
           * - `busy` — the OWNER is already writing (promoting a saved card,
           *   removing one). Its button is disabled for the duration, but the
           *   name and country fields in here stay focusable, so Enter was
           *   the one way left to start a `confirmSetup` beside a promote.
           *   Whichever of the two landed last would silently decide which
           *   card the subscription renews on.
           *
           * Checked before `handleSubmit` so a blocked Enter does not also
           * light up validation messages for fields nobody is submitting.
           */
          if (busy || submittingRef.current) return;
          void form.handleSubmit(async (values) => {
            await confirmCard(values);
          })();
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Name on card</FormLabel>
              {/* The relative wrapper sits OUTSIDE `FormControl`: that slot
                  hands the id and aria-describedby to its single child, so
                  wrapping it round the div instead would strip the input of
                  its label and error wiring. */}
              <div className="relative">
                <User
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary"
                />
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="cc-name"
                    placeholder="Full name as it appears on card"
                    // `busy` as well as our own submit: while the owner is
                    // promoting or removing a card, nothing typed in here can
                    // be submitted (see the form's `onSubmit`), and an input
                    // that accepts text it will not act on is a lie.
                    disabled={submitting || busy}
                    className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stripe's own iframes. The name and country above are OURS because
            neither is PCI-sensitive; everything in here is not ours to see. */}
        <PaymentElement
          onReady={() => setElementReady(true)}
          onChange={(event) => setCardEmpty(event.empty)}
          options={{
            // The design shows bare card fields with no payment-method picker
            // above them. An accordion with neither radios nor item spacing
            // renders a lone method flat; `layout: "tabs"` would still draw a
            // one-tab strip. (`radios` takes the enum, not a boolean, as of
            // @stripe/stripe-js v9 — "never" is the old `false`.) The labels
            // and icons inside the fields are Stripe's own and cannot be
            // restyled from out here: the number, expiry and CVC must stay in
            // the iframe.
            layout: {
              type: "accordion",
              defaultCollapsed: false,
              radios: "never",
              spacedAccordionItems: false,
            },
            // We collect these two ourselves, so tell the Element not to ask
            // again — duplicated fields are how a user ends up with a card
            // billed to a country they never chose.
            fields: {
              billingDetails: { name: "never", address: { country: "never" } },
            },
          }}
        />

        <ComboboxField
          control={form.control}
          name="country"
          label="Select Country"
          options={countryOptions}
          icon={Globe}
          placeholder="Select country"
          searchPlaceholder="Search country..."
          emptyMessage="No country found."
          required
          disabled={submitting || busy}
        />

        {failure && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {failure.title}
              </p>
              <p className="mt-0.5 text-sm text-red-700/90 dark:text-red-300/90">
                {failure.description}
              </p>
              <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                Error code: {failure.code}
              </p>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

/**
 * "Add a new payment method" — saves a card with NO charge, via a SetupIntent.
 *
 * The intent is created on mount so the fields are usable the moment the panel
 * appears; `ensureStripeCustomer` runs server-side first, which is what lets a
 * company that has never paid still attach a card.
 *
 * Attaching is ALL this form does. It does not decide which card renews the
 * subscription: the backend only promotes a newly attached card when the
 * customer has no default yet, and it does that from the
 * `setup_intent.succeeded` webhook, so nothing here can wait on it. That is
 * why the saved card's id is handed to `onSaved` — the owner promotes it.
 *
 * It draws no submit button: the owner renders one button for the whole drawer
 * and drives this form through the handle — `submit()` to save, `clear()` to
 * abandon a half-typed card, `refreshIntent()` to arm the fields for another
 * one — steered by `onStateChange`.
 */
export default function AddPaymentMethodForm({
  onSaved,
  onStateChange,
  busy = false,
  ref,
}: {
  /**
   * Fires once a card is attached, with the id Stripe assigned it (null only
   * if Stripe confirmed without naming one). The owner announces the outcome —
   * this form deliberately stays quiet on success.
   */
  onSaved: (paymentMethodId: string | null) => void | Promise<void>;
  onStateChange?: (state: AddPaymentMethodFormState) => void;
  /** The owner has a write of its own in flight — see `SetupCardForm`. */
  busy?: boolean;
  ref?: Ref<AddPaymentMethodFormHandle>;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const cardFormRef = useRef<SetupCardFormHandle | null>(null);

  /**
   * The handle is assembled here rather than forwarded straight to the card
   * form, because one of its three parts is not the card form's to give: the
   * SetupIntent belongs to this wrapper.
   *
   * No dependency array, for the same reason as the inner one — the closure
   * has to reach the CURRENT card form, which is replaced wholesale every time
   * a new client secret arrives.
   */
  useImperativeHandle(ref, () => ({
    submit: async () => (await cardFormRef.current?.submit()) ?? null,
    clear: () => cardFormRef.current?.clear(),
    refreshIntent: () => setReloadToken((token) => token + 1),
  }));

  /**
   * Monotonic request id — Retry can fire a second create while the first is
   * still in flight, and the loser must not overwrite the winner's secret with
   * an intent nobody is confirming.
   */
  const latestRequest = useRef(0);

  useEffect(() => {
    // No publishable key means the provider below renders its "payments
    // unavailable" panel; minting a SetupIntent nobody can confirm would only
    // leave orphans in Stripe.
    if (!isStripeConfigured()) {
      setLoading(false);
      return;
    }

    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const response = await createSetupIntent();
        if (latestRequest.current !== requestId) return;
        if (response?.success && response.data?.client_secret) {
          setClientSecret(response.data.client_secret);
        } else {
          setError(
            response?.message ||
              "Could not start a secure card session. Please try again.",
          );
        }
      } catch {
        if (latestRequest.current === requestId) {
          setError("Could not reach our payment provider. Please try again.");
        }
      } finally {
        if (latestRequest.current === requestId) setLoading(false);
      }
    };

    void load();
  }, [reloadToken]);

  const formMounted = !loading && !error && Boolean(clientSecret);

  /**
   * While the intent is being minted — or after it failed, or when Stripe is
   * not configured — `SetupCardForm` is not mounted and cannot speak for
   * itself. Say so, or the owner's button would sit waiting on a form that can
   * never report `ready`.
   */
  useEffect(() => {
    if (!formMounted) onStateChange?.(IDLE_STATE);
  }, [formMounted, onStateChange]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy>
        <div className="h-10 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
        <div className="h-24 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
        <span>{error}</span>
        <Button
          type="button"
          variant="outline2"
          size="sm"
          onClick={() => setReloadToken((token) => token + 1)}
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    // Keyed on the secret itself: Stripe treats `options.clientSecret` as
    // immutable for the life of an Elements group and ignores a changed one
    // (with a console warning), so a fresh SetupIntent has to arrive as a fresh
    // group. Safe to do here precisely because this form has nothing worth
    // preserving across that swap — the checkout page, which does, never passes
    // a secret at all and stays mounted throughout.
    <StripeElementsProvider
      key={clientSecret ?? "pending"}
      clientSecret={clientSecret}
    >
      {/* A SetupIntent is single-use, so the one just confirmed leaves these
          fields bound to a spent intent — but minting the replacement HERE,
          off the back of every save, spends a Stripe object for nothing: the
          owner closes this drawer on the happy path, and the fresh intent is
          created milliseconds later for a panel that is already unmounting,
          never to be confirmed. The owner asks for one through
          `refreshIntent()` on the paths where the panel actually stays open. */}
      <SetupCardForm
        handleRef={cardFormRef}
        busy={busy}
        onStateChange={onStateChange}
        onSaved={onSaved}
      />
    </StripeElementsProvider>
  );
}
