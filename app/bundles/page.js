import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("bundles");
export default function Page() { return <LegacyPage name="bundles" />; }
