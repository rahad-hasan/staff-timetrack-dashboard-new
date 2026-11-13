// import GlobalColorPicker from "@/components/Common/GlobalColorPicker";
import HeadingComponent from "@/components/Common/HeadingComponent";
// import TimeTrackingIcon from "@/components/Icons/TimeTrackingIcon";
// import UserRoleIcon from "@/components/Icons/UserRoleIcon";
import SettingServer from "@/components/Settings/SettingServer";
import SettingsPanelSkeleton from "@/components/Settings/SettingsPanelSkeleton";
import SettingsTabs from "@/components/Settings/SettingsTabs";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Staff Time Tracker Settings",
    description: "Staff Time Tracker Settings",
};
const SettingsPage = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;

    return (
        <div>
            <div className=" flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-5">
                    <HeadingComponent heading="Settings" subHeading="All the teams and member are displayed here"></HeadingComponent>
                </div>
                {/* <GlobalColorPicker></GlobalColorPicker> */}
            </div>
            <Suspense fallback={null}>
                <SettingsTabs></SettingsTabs>
            </Suspense>
            {/* A tab's reads (the company record, the session) happen inside
                the boundary: opening a tab (a new key) shows the placeholder
                at once instead of holding the previous tab. */}
            <Suspense key={JSON.stringify(params.tab ?? "Profile")} fallback={<SettingsPanelSkeleton />}>
                <SettingServer searchParams={searchParams}></SettingServer>
            </Suspense>
        </div>
    );
};

export default SettingsPage;
