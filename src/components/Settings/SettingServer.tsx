import { ISearchParamsProps } from "@/types/type";
import Configuration from "@/components/Settings/Configuration";
import Profile from "@/components/Settings/Profile";
import { getCompanyInfo } from "@/actions/settings/action";
import ChangePassword from "./ChangePassword";
import IntegrationsPanel from "./IntegrationsPanel";

const SettingServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const activeTab = params.tab ?? "Profile";
    const result = await getCompanyInfo();

    return (
        <div>
            {activeTab === "Profile" && <Profile />}
            {activeTab === "Configuration" && (
                <Configuration data={result?.data} />
            )}
            {activeTab === "Change Password" && <ChangePassword />}
            {activeTab === "Integrations" && <IntegrationsPanel />}
        </div>
    );
};

export default SettingServer;
