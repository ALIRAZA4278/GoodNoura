const pages = ["bundles", "product", "checkout", "contact", "make-your-own-bundle", "our-story", "thank-you"];

/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  // The shop used to have "bundles.html" style addresses. Send old links, bookmarks and search results to the clean address
  // (the query part, like ?p=almond-butter, is kept).
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/admin.html", destination: "/admin", permanent: true },
      ...pages.map(p => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ];
  },
};
