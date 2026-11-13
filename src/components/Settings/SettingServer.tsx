import { ISearchParamsProps } from "@/types/type";
// import Subscription from "@/components/Settings/Subscription";
import { getCompanyInfo } from "@/actions/settings/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import {
    AppIntegrationsTab,
    ChangePasswordTab,
    ConfigurationTab,
    ProfileTab,
    SlackConnectedAppsPanel,
} from "./SettingsTabPanels";

/** The only tab that renders company data — so the only one that reads it. */
const CompanyConfiguration = async () => {
    const result = await getCompanyInfo();
    return <ConfigurationTab data={result?.data}></ConfigurationTab>;
};

const AdminAppIntegrations = async ({ app }: { app?: string }) => {
    const currentUser = await getDecodedUser();
    if (currentUser?.role !== "admin") return null;
    return <AppIntegrationsTab app={app}></AppIntegrationsTab>;
};

const SettingServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams
    const activeTab = params.tab ?? "Profile";

    return (
        <div>
            {
                activeTab === "Profile" &&
                <>
                    <ProfileTab></ProfileTab>
                    {/* member-facing Slack surface — every role, incl. employee */}
                    <SlackConnectedAppsPanel></SlackConnectedAppsPanel>
                </>
            }
            {
                activeTab === "Configuration" &&
                <CompanyConfiguration></CompanyConfiguration>
            }
            {
                activeTab === "App Integrations" &&
                <AdminAppIntegrations app={typeof params.app === "string" ? params.app : undefined}></AdminAppIntegrations>
            }
            {
                activeTab === "Change Password" &&
                <ChangePasswordTab></ChangePasswordTab>
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
