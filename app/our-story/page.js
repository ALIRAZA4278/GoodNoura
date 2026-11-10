import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("our-story");
export default function Page() { return <LegacyPage name="our-story" />; }
