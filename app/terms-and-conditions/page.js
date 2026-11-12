import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("terms-and-conditions");
export default function Page() { return <LegacyPage name="terms-and-conditions" />; }
