import { ISearchParamsProps } from "@/types/type";
import Configuration from "@/app/(main_layout)/settings/_components/Configuration";
import Profile from "@/app/(main_layout)/settings/_components/Profile";
// import Subscription from "@/components/Settings/Subscription";
import { getCompanyInfo } from "@/actions/company/action";
import ChangePassword from "./ChangePassword";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import AppIntegrations from "./AppIntegrations";

const SettingServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams
    const activeTab = params.tab ?? "Profile";
    const result = await getCompanyInfo();
    const currentUser = await getDecodedUser();
    const isAdmin = currentUser?.role === "admin";


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
                activeTab === "App Integrations" && isAdmin &&
                <AppIntegrations app={typeof params.app === "string" ? params.app : undefined}></AppIntegrations>
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