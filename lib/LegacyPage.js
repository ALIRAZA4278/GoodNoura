import Script from "next/script";
import { loadPage } from "./legacy";

const PIXEL_ID = "2372380243521354";

export const pageMeta = name => {
  const { title, robots } = loadPage(name);
  return { title, ...(robots ? { robots: { index: false, follow: false } } : {}) };
};

// Meta Pixel (base code). Shop pages only; the admin is not tracked.
function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}

// display: contents keeps the wrapper out of the layout, so the original CSS behaves exactly as before.
export default function LegacyPage({ name }) {
  const { markup } = loadPage(name);
  return (
    <>
      <div style={{ display: "contents" }} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: markup }} />
      {name !== "admin" && <MetaPixel />}
    </>
  );
}
