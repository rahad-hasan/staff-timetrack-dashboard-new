import { ISearchParamsProps } from '@/types/type';
import LeaveDataTable from './LeaveDataTable';
import { getLeaveDetails } from '@/actions/leaves/action';
import AppPagination from '@/components/Common/AppPagination';

const LeaveDetailsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const result = await getLeaveDetails({
        search: params.search,
        page: params.page,
    });

    return (
        <div>
            <div className="  mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 w-full 2xl:w-[70%]">
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#fff5db] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4 ">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">{result?.data?.details?.paid_leave}</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Yearly Paid Leave</div>
                </div>
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#eff7fe] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">{result?.data?.details?.sick_leave}</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Sick Leave</div>
                </div>
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#ede7ff] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">{result?.data?.details?.casual_leave}</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Yearly Casual Leave</div>
                </div>
                <div className=" h-[130px] 2xl:h-[150px] border border-borderColor dark:border-darkBorder rounded-xl w-full">
                    <div className="h-[90px] 2xl:h-[105px] bg-[#fee6eb] dark:bg-darkSecondaryBg border-b border-borderColor dark:border-darkBorder flex items-center justify-start rounded-t-xl px-4">
                        <h2 className=" text-3xl sm:text-4xl font-medium text-center rounded-t-xl text-headingTextColor dark:text-darkTextPrimary">{result?.data?.details?.maternity_leave}</h2>
                    </div>
                    <div className=" h-[40px] 2xl:h-[45px] text-sm sm:text-base flex items-center justify-start px-4 text-headingTextColor dark:text-darkTextPrimary">Maternity leave</div>
                </div>
            </div>
            <LeaveDataTable data={result?.data?.data}></LeaveDataTable>
            <AppPagination
                total={result?.meta?.total ?? 1}
                currentPage={params.page as number}
                limit={result?.meta?.limit ?? 10}
            />
        </div>
    );
};

export default LeaveDetailsServer;