'use client';
import { useState } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TrialCart = () => {
    const [visible, setVisible] = useState(true);
    const totalDays = 30;
    const currentDay = 22;
    const progress = (currentDay / totalDays) * 100;

    if (!visible) return null;
    return (
        <div className=" my-8  mx-4">
            <div className="bg-bgPrimary dark:bg-darkPrimaryBg shadow-sm rounded-2xl border border-gray-200 dark:border-none dark:shadow-textPrimaryBg p-5 relative">
                <button
                    onClick={() => setVisible(false)}
                    className="absolute top-3 right-3 text-subTextColor hover:text-gray-600 cursor-pointer"
                >
                    <X size={18} className=" text-headingTextColor dark:text-darkTextPrimary" />
                </button>

                <Button className="" size={'sm'}>
                    <span className="text-primary"><Zap size={20} className=" text-white" /></span> Trial
                </Button>

                <h2 className="text-lg font-semibold mt-3 text-headingTextColor dark:text-darkTextPrimary">Basic</h2>

                <p className="text-subTextColor dark:text-darkTextSecondary text-sm mt-1">Trial expire reminder</p>

                <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-2 bg-primary rounded-full relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full"></div>
                        </div>
                    </div>
                    <p className="text-sm text-subTextColor dark:text-darkTextSecondary mt-2">
                        Day {currentDay} of {totalDays}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TrialCart;