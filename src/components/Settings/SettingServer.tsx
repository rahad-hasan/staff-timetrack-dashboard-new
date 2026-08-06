import { ISearchParamsProps } from "@/types/type";
import Configuration from "@/components/Settings/Configuration";
import Profile from "@/components/Settings/Profile";
// import Subscription from "@/components/Settings/Subscription";
import { getCompanyInfo } from "@/actions/settings/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import SlackConnectedApps from "@/components/Integrations/SlackConnectedApps";
import AppIntegrations from "./AppIntegrations";
import ChangePassword from "./ChangePassword";

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
                <>
                    <Profile></Profile>
                    {/* member-facing Slack surface — every role, incl. employee */}
                    <SlackConnectedApps></SlackConnectedApps>
                </>
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