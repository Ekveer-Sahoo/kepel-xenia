import { redirect } from "next/navigation";
import { getMachineId } from "@/shared/utils/machine";
import { getSettings } from "@/lib/localDb";
import HomePageClient from "../dashboard/HomePageClient";
import BootstrapBanner from "../dashboard/BootstrapBanner";
import AnalyticsSummaryCard from "../dashboard/AnalyticsSummaryCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  if (!settings.setupComplete) {
    redirect("/dashboard/onboarding");
  }
  const machineId = await getMachineId();
  const isBootstrapped = process.env.XENIA_BOOTSTRAPPED === "true";
  return (
    <>
      {isBootstrapped && <BootstrapBanner />}
      <AnalyticsSummaryCard />
      <HomePageClient machineId={machineId} />
    </>
  );
}
