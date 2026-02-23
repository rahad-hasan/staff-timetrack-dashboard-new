"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const AllowOvertimeCheckbox = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const isChecked = searchParams.get("allow_overtime") === "true";

    const updateQueryParam = useCallback((checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString());

        if (checked) {
            params.set("allow_overtime", "true");
        } else {
            params.delete("allow_overtime");
        }

        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    return (
        <div className="flex gap-1.5 items-center">
            <Checkbox
                id="allow_overtime"
                className="cursor-pointer data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary border-primary data-[state=checked]:border-primary"
                checked={isChecked}
                onCheckedChange={(checked) => updateQueryParam(checked as boolean)}
            />
            <label htmlFor="allow_overtime" className="cursor-pointer text-sm mt-0.5">
                Allow Overtime
            </label>
        </div>
    );
};

export default AllowOvertimeCheckbox;