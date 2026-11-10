const pages = ["bundles", "product", "checkout", "contact", "make-your-own-bundle", "our-story"];

/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  // The pages link to each other as "bundles.html", "index.html" etc. Keep those links working.
  async rewrites() {
    return [
      { source: "/index.html", destination: "/" },
      { source: "/admin.html", destination: "/admin" },
      ...pages.map(p => ({ source: `/${p}.html`, destination: `/${p}` })),
    ];
  },
};
