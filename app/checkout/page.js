import LegacyPage, { pageMeta } from "@/lib/LegacyPage";

export const dynamic = "force-static";
export const generateMetadata = () => pageMeta("checkout");
export default function Page() { return <LegacyPage name="checkout" />; }
