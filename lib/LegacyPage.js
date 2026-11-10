import { loadPage } from "./legacy";

export const pageMeta = name => {
  const { title, robots } = loadPage(name);
  return { title, ...(robots ? { robots: { index: false, follow: false } } : {}) };
};

// display: contents keeps the wrapper out of the layout, so the original CSS behaves exactly as before.
export default function LegacyPage({ name }) {
  const { markup } = loadPage(name);
  return <div style={{ display: "contents" }} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: markup }} />;
}
