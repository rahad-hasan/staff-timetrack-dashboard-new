export const dynamic = "force-dynamic";

import { getBillingStatus, getPlans } from "@/actions/billing/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import BillingPageClient from "@/components/Billing/BillingPageClient";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Package,
  Receipt,
  CreditCard,
} from "lucide-react";
import Calender2Icon from "@/components/Icons/Calender2Icon";
import { cn } from "@/lib/utils";
import CardInfo from "@/components/Settings/CardInfo";
import CardIcon from "@/components/Icons/PlanIcons/CardIcon";
import InvoiceIcon from "@/components/Icons/PlanIcons/InvoiceIcon";
import PlanIcon from "@/components/Icons/PlanIcons/PlanIcon";

export const metadata: Metadata = {
  title: "Billing & Plans",
  description: "Manage your subscription, seats and invoices",
};

/**
 * `/settings/billing` — the page every `block.webBillingUrl` and 402 redirect
 * lands on. Billing reads are allowed for admin / manager / hr (guide §0);
 * everyone else goes back to Settings. Mutation buttons are additionally
 * admin-gated inside the components.
 */
const BillingPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const role = currentUser?.role ?? "";

  if (!["admin", "manager", "hr"].includes(role)) {
    redirect("/settings");
  }

  const [statusRes, plansRes] = await Promise.all([
    getBillingStatus(),
    getPlans(),
  ]);

  // Billable head count comes from billing/status itself — same rule the
  // seat gate enforces, and no member-list payload on this page.
  const activeUserCount = statusRes?.data?.active_user_count ?? 0;
  const billingTabs = [
    { name: "My Plan", value: "plan", icon: <PlanIcon size={20}/> },
    { name: "Invoice", value: "invoice", icon: <InvoiceIcon size={20}/> },
    { name: "Change Card", value: "card", icon: <CardIcon size={20}/> },
  ];
  const activeTab = typeof params.tab === "string" ? params.tab : "plan";
  console.log(activeTab);
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-8">
        {/* <HeadingComponent
                    heading="Billing & Plans"
                    subHeading="Manage your subscription, seats, invoices and payment status"
                ></HeadingComponent> */}

        <div className=" flex justify-center">
          <div className="inline-flex h-12 rounded-lg bg-white p-1 outline-1 outline-borderColor/50 dark:bg-darkPrimaryBg dark:outline-darkBorder">
            {billingTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={`/settings/billing?tab=${tab.value}`}
                  aria-pressed={isActive}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-md px-4 py-2 text-[13px] flex gap-2 items-center font-medium transition-all sm:text-sm",
                    isActive
                      ? "bg-primary text-white shadow"
                      : "text-subTextColor hover:text-gray-800 dark:text-darkTextPrimary",
                  )}
                >
                  {Icon}
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 mt-3 sm:mt-0 text-sm text-subTextColor hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
        >
          <ChevronLeft size={16} />
          Back to Settings
        </Link>
      </div>

      {activeTab === "plan" && (
        <BillingPageClient
          initialStatus={statusRes?.success ? statusRes.data : null}
          plans={
            plansRes?.success && Array.isArray(plansRes.data)
              ? plansRes.data
              : []
          }
          activeUserCount={activeUserCount}
          role={role}
          blockedMessage={
            typeof params.blocked === "string" ? params.blocked : undefined
          }
        ></BillingPageClient>
      )}

      {activeTab === "card" && <CardInfo></CardInfo>}

    </div>
  );
};

export default BillingPage;
