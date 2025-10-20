"use client";
import { Switch } from "@/components/ui/switch"
import { Separator } from "@radix-ui/react-select";

const Notification = () => {
    const sections = [
        {
            title: "Project Notifications",
            items: [
                { name: "Project Budget alerts", inApp: true, email: false },
                { name: "Project Messages", inApp: false, email: true },
                { name: "Project activity", inApp: true, email: false },
            ],
        },
        {
            title: "Task Notifications",
            items: [
                { name: "Task Activity", inApp: true, email: false },
                { name: "Task comments and mentions", inApp: false, email: true },
            ],
        },
        {
            title: "Finance Notifications",
            items: [
                { name: "Invoice activity", inApp: true, email: true },
                { name: "Banking activity", inApp: false, email: true },
            ],
        },
    ];

    return (
        <div className="rounded-lg border border-borderColor p-4 mt-4 bg-white">
            <h2 className="text-lg font-semibold mb-6 text-textGray">Notifications Preferences</h2>

            {sections.map((section, idx) => (
                <div
                    key={section.title}
                    className={`rounded-md border border-borderColor p-4 ${idx < sections.length - 1 ? "mb-4" : ""
                        }`}
                >

                    <h3 className="font-medium mb-4 text-gray-900">
                        {section.title}
                    </h3>

                    <div className="flex justify-between items-center text-sm font-semibold text-gray-500 mb-2">
                        <span>Notification</span>
                        <div className="flex gap-8">
                            <span>IN-APP</span>
                            <span>EMAIL</span>
                        </div>
                    </div>

                    <Separator className="mb-3" />

                    <div className="space-y-3">
                        {section.items.map((item) => (
                            <div
                                key={item.name}
                                className="flex justify-between items-center text-sm text-gray-800"
                            >
                                <span className="flex-1">{item.name}</span>
                                <div className="flex items-center gap-8">
                                    <Switch defaultChecked={item.inApp} />
                                    <Switch defaultChecked={item.email} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Notification;