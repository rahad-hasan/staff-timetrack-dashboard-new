"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Lock, RefreshCw, ShieldCheck } from "lucide-react";

import { getCheckoutQuote, getPaymentMethods } from "@/actions/billing/action";
import { Button } from "@/components/ui/button";
import type {
  BillingCycle,
  IBillingPlan,
  ICheckoutQuote,
  IPaymentMethod,
} from "@/types/billing";

import CardInformationPanel from "./CardInformationPanel";
import DiscountCodeExpander from "./DiscountCodeExpander";
import NeedHelpPanel from "./NeedHelpPanel";
import OrderSummaryPanel from "./OrderSummaryPanel";
import PaymentFailureAlert from "./PaymentFailureAlert";
import SavedPaymentMethodPanel from "./SavedPaymentMethodPanel";
import ShopWithConfidencePanel from "./ShopWithConfidencePanel";
import StripeElementsProvider from "./StripeElementsProvider";
import { useCheckoutPayment } from "./useCheckoutPayment";


/**
 * The legal pages live on the marketing site, not in this app — there is no
 * `/terms` route here, and linking to one produced a 404 on the single screen
 * where the user is being asked to agree to it. Configure the real URLs and
 * the sentence becomes links; leave them unset and it stays honest plain text
 * rather than promising a page that does not exist.
 */
const TERMS_URL = process.env.NEXT_PUBLIC_TERMS_URL ?? "";
const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL ?? "";

const LegalLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) =>
  href ? (
    <a
      href={href}
      // A new tab on purpose: navigating away and back would remount the
      // Elements group and discard the card the user has already typed.
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ) : (
    <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
      {children}
    </span>
  );

interface CheckoutPageClientProps {
  plans: IBillingPlan[];
  planId: number;
  initialCycle: BillingCycle;
  initialSeats: number;
  initialQuote: ICheckoutQuote | null;
  /** Why the server refused to price this order, when it did. */
  initialQuoteError?: string | null;
}

interface CheckoutInnerProps extends CheckoutPageClientProps {
  /**
   * Reports the live total up to the Elements provider. Stripe uses the amount
   * to decide which payment methods to offer, so a re-quote that only updated
   * the summary would leave the card panel priced against the order the user
   * has already moved away from.
   */
  onQuoteChange: (quote: ICheckoutQuote | null) => void;
}

/**
 * The custom checkout page.
 *
 * Split in two on purpose: this component owns the ORDER (quote, cycle,
 * discount, which card) while `useCheckoutPayment` owns the PAYMENT (intent
 * lifecycle, retries, Stripe confirmation). Keeping the retry-critical state in
 * a hook stops an innocent re-render up here from dropping the client secret a
 * retry depends on.
 *
 * The Elements group is mounted ONCE around the whole page in deferred mode.
 * Re-quoting updates its `amount` in place, so switching cycle or applying a
 * discount never disturbs a part-typed card.
 */
function CheckoutInner({
  plans,
  planId,
  initialCycle,
  initialSeats,
  initialQuote,
  initialQuoteError,
  onQuoteChange,
}: CheckoutInnerProps) {
  const router = useRouter();

  const [quote, setQuote] = useState<ICheckoutQuote | null>(initialQuote);
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const [quoting, setQuoting] = useState(false);

  const [discountCode, setDiscountCode] = useState<string | null>(
    initialQuote?.discount?.code ?? null,
  );
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [methods, setMethods] = useState<IPaymentMethod[]>([]);
  const [methodsLoaded, setMethodsLoaded] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  /** Explicitly chose to type a new card even though saved ones exist. */
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveCard, setSaveCard] = useState(true);

  const [cardName, setCardName] = useState("");
  const [country, setCountry] = useState("");
  const [showCardErrors, setShowCardErrors] = useState(false);
  /** True once Stripe's card iframes are interactive — see CardInformationPanel. */
  const [cardElementReady, setCardElementReady] = useState(false);
  /** A pricing failure with no field to attach to — rendered above the CTA. */
  const [quoteError, setQuoteError] = useState<string | null>(
    initialQuote
      ? null
      : (initialQuoteError ?? "We could not price this order. Please try again."),
  );

  /**
   * How many people the plan is being bought for.
   *
   * This is a real choice, not a derived number: a company signing up with one
   * admin routinely buys for the twenty people it is about to invite, and
   * pinning seats to the current head count (as this page first did) left them
   * owning one seat and hitting the cap on their first invite.
   *
   * The server still owns the FLOOR — you cannot buy fewer seats than you have
   * active members — and it clamps the quote up if a stale value is sent, so
   * `quote.seats` is always the number actually priced.
   */
  const [seats, setSeats] = useState<number>(
    initialQuote?.seats ?? initialSeats,
  );

  /**
   * True while the seat count on screen has not been priced yet. The CTA is
   * disabled through it, which is what guarantees the amount confirmed is the
   * amount displayed — never a total from the seat count before last.
   */
  const seatsAwaitingQuote = Boolean(quote) && quote?.seats !== seats;

  const payment = useCheckoutPayment({
    planId,
    cycle,
    // The PRICED count, never the in-flight one — the purchase must match the
    // summary the user is looking at.
    seats: quote?.seats ?? initialSeats,
    discountCode: discountCode ?? undefined,
    onSucceeded: (subscriptionId) =>
      router.replace(
        `/billing/success?subscription_id=${encodeURIComponent(subscriptionId)}`,
      ),
  });

  const { clearPending } = payment;

  /**
   * Monotonic quote counter. Seat changes, cycle switches and discount applies
   * can overlap, and responses are not guaranteed to return in order — without
   * this, a slower earlier quote landing last would leave a price on screen
   * that belongs to an order the user has already moved away from. On a screen
   * whose whole job is showing what someone is about to be charged, that is
   * not an acceptable race.
   */
  const latestQuote = useRef(0);

  /**
   * Re-price the order. Any change here invalidates a PaymentIntent from an
   * earlier attempt — a different total is a different charge — so the pending
   * intent is dropped and the next submit creates a fresh one.
   */
  const requote = useCallback(
    async (next: { cycle: BillingCycle; code: string | null; seats: number }) => {
      const requestId = latestQuote.current + 1;
      latestQuote.current = requestId;

      setQuoting(true);
      setDiscountError(null);

      let res;
      try {
        res = await getCheckoutQuote({
          plan_id: planId,
          seats: next.seats,
          cycle: next.cycle,
          ...(next.code ? { discount_code: next.code } : {}),
        });
      } catch {
        // `baseApi`'s own try/catch runs on the SERVER, so a transport failure
        // (connection dropped, deployment skew, a 500 from the action
        // endpoint) REJECTS here instead of resolving to a `{success:false}`
        // envelope. Without this branch `quoting` stayed true forever and the
        // CTA was permanently dead with nothing on screen explaining why.
        if (latestQuote.current !== requestId) return false;
        setQuoting(false);
        const message = "We could not price this order. Please try again.";
        if (next.code) setDiscountError(message);
        else setQuoteError(message);
        return false;
      }

      // A superseded response must not touch any state — not the spinner, not
      // the error, and least of all the price.
      if (latestQuote.current !== requestId) return false;

      setQuoting(false);

      if (!res?.success || !res.data) {
        const message = res?.message || "We could not price this order.";
        // A rejected code belongs against the code field; anything else (a
        // failed cycle switch, a 500) has no field to attach to and would be
        // completely silent there — the saved-card panel does not even render
        // the discount row. Surface it beside the order summary instead.
        if (next.code) setDiscountError(message);
        else setQuoteError(message);
        return false;
      }

      setQuoteError(null);

      clearPending();
      setQuote(res.data);
      onQuoteChange(res.data);
      setCycle(next.cycle);
      setDiscountCode(next.code);
      // The server clamps up to the billable floor. Adopting what it actually
      // priced keeps the stepper honest (it visibly snaps back to the minimum)
      // and settles `seatsAwaitingQuote`, so this converges in one extra pass
      // rather than re-requesting forever.
      setSeats(res.data.seats);
      return true;
    },
    [planId, clearPending, onQuoteChange],
  );

  /**
   * Re-price after the seat stepper settles.
   *
   * Debounced because holding "+" would otherwise fire a quote per click; the
   * number updates instantly on screen while only the resting value is priced.
   * Guarded on `quote.seats` so the quote this effect produces cannot retrigger
   * it.
   */
  useEffect(() => {
    if (!quote || quote.seats === seats) return;

    const timer = setTimeout(() => {
      void requote({ cycle, code: discountCode, seats });
    }, 450);

    return () => clearTimeout(timer);
  }, [seats, quote, cycle, discountCode, requote]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await getPaymentMethods();
      if (cancelled) return;

      const list = res?.success ? (res.data?.payment_methods ?? []) : [];
      setMethods(list);
      setSelectedMethodId(
        list.find((method) => method.is_default)?.id ?? list[0]?.id ?? null,
      );
      setMethodsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasSavedCards = methods.length > 0;
  const payingWithSavedCard = hasSavedCards && !useNewCard;

  const handleSubmit = () => {
    // Stripe's own name AND country fields are suppressed in the card panel, so
    // these two inputs are the only source of `billing_details.name` and
    // `address.country` — and `fields: "never"` obliges us to supply both at
    // confirm time, so missing either is a last-step IntegrationError that the
    // failure panel would dress up as a card decline. Catching them here turns
    // that into ordinary field errors.
    if (!payingWithSavedCard && (!cardName.trim() || !country)) {
      setShowCardErrors(true);
      return;
    }

    void payment.submit({
      ...(payingWithSavedCard && selectedMethodId
        ? { paymentMethodId: selectedMethodId }
        : {}),
      savePaymentMethod: saveCard,
      billingName: cardName.trim() || undefined,
      billingCountry: country || undefined,
    });
  };

  const failed = payment.phase === "failed";
  const ctaLabel = failed ? "Try Payment Again" : "Activate Subscription";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* ---------------- left: payment ---------------- */}
      <section className="rounded-xl border border-borderColor bg-bgPrimary p-5 dark:border-darkBorder dark:bg-darkPrimaryBg sm:p-6">
        <h2 className="mb-5 text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
          {payingWithSavedCard ? "Payment Method" : "Card Information"}
        </h2>

        {payment.failure && (
          <div className="mb-5">
            <PaymentFailureAlert
              failure={payment.failure}
              onDismiss={payment.dismissFailure}
            />
          </div>
        )}

        {!methodsLoaded ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-10 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700" />
            <div className="h-10 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700" />
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700" />
          </div>
        ) : payingWithSavedCard ? (
          <SavedPaymentMethodPanel
            methods={methods}
            selectedId={selectedMethodId}
            onSelect={setSelectedMethodId}
            saveCard={saveCard}
            onSaveCardChange={setSaveCard}
            onUseNewCard={() => setUseNewCard(true)}
            disabled={payment.busy}
          />
        ) : (
          <>
            <CardInformationPanel
              name={cardName}
              onNameChange={(value) => {
                setCardName(value);
                if (value.trim()) setShowCardErrors(false);
              }}
              country={country}
              onCountryChange={setCountry}
              showErrors={showCardErrors}
              onReady={() => setCardElementReady(true)}
              disabled={payment.busy}
            />

            {hasSavedCards && (
              <button
                type="button"
                onClick={() => setUseNewCard(false)}
                className="mt-3 cursor-pointer text-sm font-medium text-primary hover:opacity-80"
              >
                Use a saved card instead
              </button>
            )}

          </>
        )}

        {/* Rendered for BOTH payment panels, gated ONLY on whether this
            purchase is a switch.

            It used to sit inside the new-card branch, which silently coupled
            "has a saved card" to "may not use a discount": a trialing company
            that had saved a card through Change Card has NO subscription — so
            a code is perfectly valid, and the server accepts it — yet the
            field was unreachable unless they abandoned their saved card.

            The real rule is the one below: a company that already has a
            subscription is switching plans, the prorated switch carries no
            coupon, and offering the field would promise a saving the charge
            never applies. The server refuses such a code too. */}
        {methodsLoaded && !quote?.has_billing_subscription && (
          <>
            <div className="my-5 border-t border-borderColor dark:border-darkBorder" />

            <DiscountCodeExpander
              appliedCode={discountCode}
              applying={quoting}
              error={discountError}
              onApply={(code) => void requote({ cycle, code, seats })}
              onRemove={() => void requote({ cycle, code: null, seats })}
              disabled={payment.busy}
            />
          </>
        )}

        <div className="my-5 border-t border-borderColor dark:border-darkBorder" />

        <div className="space-y-3">
          {/* A pricing failure would otherwise leave a fully drawn checkout
              with em-dashes and a permanently dead button and no explanation. */}
          {quoteError && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <span>{quoteError}</span>
              <Button
                type="button"
                variant="outline2"
                size="sm"
                disabled={quoting}
                onClick={() => void requote({ cycle, code: discountCode, seats })}
              >
                {quoting && <Loader2 className="size-3.5 animate-spin" />}
                Retry
              </Button>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            // `methodsLoaded` matters: until the saved-card list resolves we do
            // not know whether to confirm with a saved `pm_` or with a mounted
            // Element, and submitting early surfaces a raw Stripe
            // IntegrationError dressed up as a card decline.
            disabled={
              payment.busy ||
              quoting ||
              !payment.ready ||
              !quote ||
              !methodsLoaded ||
              // The seat count on screen has not been priced yet — confirming
              // now would charge the previous total.
              seatsAwaitingQuote ||
              // Only the typed-card path waits on the iframes; a saved card is
              // confirmed by id and needs no mounted Element.
              (!payingWithSavedCard && !cardElementReady) ||
              payment.phase === "succeeded"
            }
            className="h-12 w-full text-[15px]"
          >
            {payment.busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : failed ? (
              <RefreshCw className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}
            {payment.busy ? "Processing…" : ctaLabel}
          </Button>

          {/* Only after a decline — the design's second button. Swapping the
              panel is the fastest route out of a card the bank refused. */}
          {failed && payingWithSavedCard && (
            <Button
              type="button"
              variant="outline2"
              onClick={() => {
                setUseNewCard(true);
                payment.dismissFailure();
              }}
              className="h-12 w-full text-[15px]"
            >
              <CreditCard className="size-4" />
              Change Payment Method
            </Button>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-subTextColor dark:text-darkTextSecondary">
          <ShieldCheck className="size-3.5" />
          Secure 256-bit SSL encrypted payment
        </p>
        <p className="mt-2 text-center text-xs text-subTextColor dark:text-darkTextSecondary">
          By completing your purchase, you agree to our{" "}
          <LegalLink href={TERMS_URL}>Terms of Service</LegalLink> and{" "}
          <LegalLink href={PRIVACY_URL}>Privacy Policy</LegalLink>.
        </p>
      </section>

      {/* ---------------- right: order + reassurance ---------------- */}
      <aside className="space-y-6">
        <OrderSummaryPanel
          quote={quote}
          plans={plans}
          cycle={cycle}
          onCycleChange={(next) =>
            void requote({ cycle: next, code: discountCode, seats })
          }
          seats={seats}
          onSeatsChange={setSeats}
          loading={quoting}
          // Frozen while a charge is in flight. This panel was the ONE control
          // still live during confirmation, and both of its inputs re-quote —
          // which calls `clearPending()` and destroys the PaymentIntent the
          // "Try Payment Again" path has to reuse, so the retry would mint a
          // second subscription instead of re-confirming this one.
          disabled={payment.busy}
        />
        {/* The reassurance panel becomes troubleshooting once a payment has
            failed — at that point "Cancel anytime" is not what they need. */}
        {failed ? <NeedHelpPanel /> : <ShopWithConfidencePanel />}
      </aside>
    </div>
  );
}

export default function CheckoutPageClient(props: CheckoutPageClientProps) {
  /**
   * Only the priced total lives up here, mirrored from the inner component's
   * quote. The Elements group is mounted in deferred mode for the life of the
   * page — the intent is created on submit, after `elements.submit()` has
   * validated the card — and Stripe reads this amount to choose which payment
   * methods to offer. Updating it re-configures the mounted group in place, so
   * a cycle switch or a discount never disturbs a part-typed card.
   */
  const [priced, setPriced] = useState<{ amount?: number; currency: string }>({
    amount: props.initialQuote?.total_cents,
    currency: props.initialQuote?.currency ?? "usd",
  });

  const handleQuoteChange = useCallback((quote: ICheckoutQuote | null) => {
    setPriced({
      amount: quote?.total_cents,
      currency: quote?.currency ?? "usd",
    });
  }, []);

  return (
    <StripeElementsProvider
      mode="subscription"
      amount={priced.amount}
      currency={priced.currency}
    >
      <CheckoutInner {...props} onQuoteChange={handleQuoteChange} />
    </StripeElementsProvider>
  );
}
