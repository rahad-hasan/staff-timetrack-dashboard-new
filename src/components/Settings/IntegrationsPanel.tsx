import GoogleStatusCard from "@/components/Integrations/GoogleStatusCard";
import GoogleCalendarBrowser from "@/components/Integrations/GoogleCalendarBrowser";

const IntegrationsPanel = () => {
    return (
        <div className="space-y-5 mt-4">
            <GoogleStatusCard />
            <GoogleCalendarBrowser />
        </div>
    );
};

export default IntegrationsPanel;
