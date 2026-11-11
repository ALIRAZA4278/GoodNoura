import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("thank-you");
export default function Page() { return <LegacyPage name="thank-you" />; }
