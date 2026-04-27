"use client"
import SearchBar from "@/components/Common/SearchBar";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import { Checkbox } from "@/components/ui/checkbox";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LeaveRequestHeroCart = ({canManageUsers, users}: {canManageUsers: boolean, users?: { id: string; label: string; avatar: string }[];}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isApproved = searchParams.get("approved") === "true";
  const isRejected = searchParams.get("rejected") === "true";

  const updateQueryParam = (key: string, value?: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "approved" || key === "rejected") {
      params.delete("approved");
      params.delete("rejected");
    }

    if (value === undefined || value === "" || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

    return (
      <div className="flex flex-col gap-4 rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Leave request queue
            </h2>
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Review pending leave requests and switch to approved or rejected views when needed.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canManageUsers ? (
              <SelectUserDropDown
                users={users!}
                defaultSelect={false}
                // resetPageOnChange
              />
            ) : null}
            <SearchBar onSearch={(query) => updateQueryParam("search", query)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="approved"
              className="border-primary cursor-pointer"
              checked={isApproved}
              onCheckedChange={(checked) => updateQueryParam("approved", checked === true)}
            />
            <label htmlFor="approved" className="cursor-pointer text-sm text-headingTextColor dark:text-darkTextPrimary">
              Approved
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rejected"
              className="border-primary cursor-pointer"
              checked={isRejected}
              onCheckedChange={(checked) => updateQueryParam("rejected", checked === true)}
            />
            <label htmlFor="rejected" className="cursor-pointer text-sm text-headingTextColor dark:text-darkTextPrimary">
              Rejected
            </label>
          </div>
          {!isApproved && !isRejected ? (
            <div className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-200">
              Pending requests are shown by default
            </div>
          ) : null}
        </div>
      </div>
    );
};

export default LeaveRequestHeroCart;