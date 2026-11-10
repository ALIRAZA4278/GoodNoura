import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("make-your-own-bundle");
export default function Page() { return <LegacyPage name="make-your-own-bundle" />; }
