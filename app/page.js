import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("index");
export default function Page() { return <LegacyPage name="index" />; }
