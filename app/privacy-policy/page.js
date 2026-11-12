import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("privacy-policy");
export default function Page() { return <LegacyPage name="privacy-policy" />; }
