import { ISearchParamsProps } from "@/types/type";
import Configuration from "@/components/Settings/Configuration";
import Profile from "@/components/Settings/Profile";
// import Subscription from "@/components/Settings/Subscription";
import { getCompanyInfo } from "@/actions/settings/action";
import ChangePassword from "./ChangePassword";

const SettingServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams
    const activeTab = params.tab ?? "Profile";
    const result = await getCompanyInfo();

    return (
        <div>
            {
                activeTab === "Profile" &&
                <Profile></Profile>
            }
            {
                activeTab === "Configuration" &&
                <Configuration data={result?.data}></Configuration>
            }
            {
                activeTab === "Change Password" &&
                <ChangePassword></ChangePassword>
            }
            {/* {
                activeTab === "Subscription Management" &&
                <Subscription></Subscription>
            } */}
            {/* {
                activeTab === "Subscription Management" &&
                <SubscriptionSkeleton></SubscriptionSkeleton>
            } */}
        </div>
    );
};

export default SettingServer;