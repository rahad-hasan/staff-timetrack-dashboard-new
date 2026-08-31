import SampleDataBanner from "@/components/Dashboard/SampleDataBanner";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";

export default async function Dashboard() {
  const sampleMode = await getSampleDataMode();

  if (!sampleMode) {
    return null;
  }

  return <SampleDataBanner />;
}
