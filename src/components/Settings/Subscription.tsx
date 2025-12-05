"use client"

import { useState } from "react"
import { BadgeCheck, CheckCircle2 } from "lucide-react"
// import SubscriptionSkeleton from "@/skeleton/settings/SubscriptionSkeleton";

export default function Subscription() {
    const [activeTab, setActiveTab] = useState<"Monthly" | "Yearly">("Monthly");

    const handleTabClick = (tab: "Monthly" | "Yearly") => {
        setActiveTab(tab);
    };

    const plans = [
        {
            name: "Essentials",
            price: "$0",
            period: "per month",
            description: "CRM most powerful free tier.",
            color: "from-[#b6dbf9] via-white to-[#b6dbf9] dark:to-darkPrimaryBg",
            buttonColor: "border-gray-300 text-gray-700 cursor-pointer",
            features: [
                "All Templates",
                "Unlimited Clients & Projects",
                "Proposals & Contracts",
                "Invoicing & Payments",
                "CRM",
                "Client Portal",
                "Project Budgets",
            ],
        },
        {
            name: "Premium",
            price: "$59",
            period: "per month",
            description: "A plan that grows with your business.",
            color: "from-[#aae5c5] from-10% to-white dark:to-darkPrimaryBg to-80%",
            buttonColor: " bg-primary text-white cursor-pointer",
            features: [
                "Remove Clancy Branding",
                "Workflow Automations",
                "Custom Fields & Properties",
                "Project Insights",
                "Utilizations Tracking",
                "Project & Task Gantt View",
                "Profit & Productivity Reports",
            ],
        },
        {
            name: "Elite",
            price: "$199",
            period: "per month",
            description: "Self-serve, Elite discounts.",
            color: "from-[#e3dbfb] from-10% to-white dark:to-darkPrimaryBg to-80%",
            buttonColor: "border-gray-300 text-gray-700 cursor-pointer",
            features: [
                "Custom Permissions",
                "Resource Management",
                "Timesheet Locking",
                "Advanced Integrations",
                "Custom Data Import",
                "Dedicated Onboarding",
                "Premium Customer Support",
            ],
        },
    ]

    const currentSubscription = "Premium";

    return (
        <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-xl mb-1.5 font-medium text-headingTextColor dark:text-darkTextPrimary">Subscription</h2>
                    <p className="text-subTextColor mb-4 dark:text-darkTextSecondary">
                        Manage your billing and payment details
                    </p>
                </div>

                <div className="inline-flex mt-3 sm:mt-0 h-10 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg">
                    {["Monthly", "Yearly"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab as "Monthly" | "Yearly")}
                            className={`px-3 py-2 text-[13px] sm:text-sm font-medium transition-all cursor-pointer rounded-lg ${activeTab === tab
                                ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                                : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                } flex-shrink-0`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

            </div>
            <div className="mb-8 border rounded-lg p-4 bg-gradient-to-r from-[#f0f9ff] to-white flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-headingTextColor">
                        Current Plan: <span className="text-primary">{currentSubscription}</span>
                    </h3>
                    <p className="text-sm text-subTextColor">
                        Your subscription renews automatically every month. You can manage or upgrade your plan anytime.
                    </p>
                </div>
                <div className="flex items-center text-green-600 gap-2 font-medium">
                    <BadgeCheck className="h-5 w-5" />
                    Active
                </div>
            </div>
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`flex flex-col justify-between border rounded-lg shadow dark:border-darkBorder dark:shadow-2xl dark:shadow-white ${plan.color}`}
                    >
                        <div className={` rounded-lg bg-gradient-to-r ${plan.color} p-6`}>
                            <h3 className="text-xl font-medium mb-5 text-headingTextColor dark:text-darkTextPrimary">{plan.name}</h3>
                            <div className=" flex gap-2 items-end mb-5">
                                <p className="text-4xl  text-headingTextColor dark:text-darkTextPrimary">{plan.price}</p>
                                <p className="text-sm  text-headingTextColor dark:text-darkTextPrimary">/ {plan.period}</p>
                            </div>

                            <p className="text-sm text-subTextColor mb-6 dark:text-darkTextPrimary">{plan.description}</p>
                            <button
                                className={`w-full py-3 border dark:border-darkBorder rounded-md text-sm font-medium transition text-headingTextColor dark:text-darkTextPrimary ${plan.buttonColor}`}
                            >
                                Get Started
                            </button>
                        </div>

                        <ul className="mt-6 space-y-2 m-6 pt-6 border-t-2">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    <CheckCircle2 className="text-primary h-8 w-5" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            {/* <SubscriptionSkeleton></SubscriptionSkeleton> */}
        </div>
    )
}
