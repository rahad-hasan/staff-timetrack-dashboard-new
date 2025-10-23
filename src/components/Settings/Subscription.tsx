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
            color: "from-[#b6dbf9] from-10% to-white to-80%",
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
            color: "from-[#aae5c5] from-10% to-white to-80%",
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
            color: "from-[#e3dbfb] from-10% to-white to-80%",
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
        <div className="border-2 border-borderColor rounded-lg p-3 sm:p-6 bg-white mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-xl mb-1.5 font-semibold">Subscription</h2>
                    <p className="text-gray-500 mb-4">
                        Manage your billing and payment details
                    </p>
                </div>

                <div className="flex items-center bg-[#f6f7f9] rounded-lg ">
                    {["Monthly", "Yearly"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab as "Monthly" | "Yearly")}
                            className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
                                ? "bg-white text-headingTextColor shadow-sm"
                                : "text-gray-600 hover:text-gray-800"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mb-8 border rounded-lg p-4 bg-gradient-to-r from-[#f0f9ff] to-white flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        Current Plan: <span className="text-primary">{currentSubscription}</span>
                    </h3>
                    <p className="text-sm text-gray-500">
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
                        className={`flex flex-col justify-between border rounded-lg shadow ${plan.color}`}
                    >
                        <div className={` rounded-lg bg-gradient-to-b ${plan.color} p-6`}>
                            <h3 className="text-xl font-semibold mb-5">{plan.name}</h3>
                            <div className=" flex gap-2 items-end mb-5">
                                <p className="text-4xl ">{plan.price}</p>
                                <p className="text-sm text-gray-600">/ {plan.period}</p>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                            <button
                                className={`w-full py-2 border rounded-md text-sm font-medium transition ${plan.buttonColor}`}
                            >
                                Get Started
                            </button>
                        </div>

                        <ul className="mt-6 space-y-2 m-6 pt-6 border-t-2">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="text-green-500 h-8 w-5" />
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
