"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const AllowOvertimeCheckbox = ({ overTime }: { overTime?: boolean }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isChecked = useMemo(() => {
        const param = searchParams.get("allow_overtime");

        if (param !== null) {
            return param === "true";
        }

        return overTime ?? false;
    }, [searchParams, overTime]);

    const updateQueryParam = useCallback((checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString());

        params.set("allow_overtime", checked ? "true" : "false");

        router.replace(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    return (
        <div className="flex gap-1.5 items-center">
            <Checkbox
                id="allow_overtime"
                className="cursor-pointer data-[state=checked]:bg-primary border-primary"
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