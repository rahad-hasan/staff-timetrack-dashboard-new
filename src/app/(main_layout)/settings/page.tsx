import GlobalColorPicker from "@/components/Common/GlobalColorPicker";
import HeadingComponent from "@/components/Common/HeadingComponent";
// import TimeTrackingIcon from "@/components/Icons/TimeTrackingIcon";
// import UserRoleIcon from "@/components/Icons/UserRoleIcon";
import SettingServer from "@/components/Settings/SettingServer";
import SettingsTabs from "@/components/Settings/SettingsTabs";
import { ISearchParamsProps } from "@/types/type";

const SettingsPage = async ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className=" flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-5">
                    <HeadingComponent heading="Settings" subHeading="All the teams and member are displayed here"></HeadingComponent>
                </div>
                <GlobalColorPicker></GlobalColorPicker>
            </div>
            <SettingsTabs></SettingsTabs>
            <SettingServer searchParams={searchParams}></SettingServer>
        </div>
    );
};

export default SettingsPage;