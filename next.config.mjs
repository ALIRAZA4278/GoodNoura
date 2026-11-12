const pages = ["bundles", "product", "checkout", "contact", "make-your-own-bundle", "our-story", "thank-you", "privacy-policy", "terms-and-conditions"];

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
      // Addresses from the old Shopify store that people may still have bookmarked or find on Google
      { source: "/pages/privacy-policy", destination: "/privacy-policy", permanent: true },
      { source: "/pages/terms-and-conditions", destination: "/terms-and-conditions", permanent: true },
      { source: "/pages/contact", destination: "/contact", permanent: true },
      { source: "/pages/contact-us", destination: "/contact", permanent: true },
      { source: "/pages/our-story", destination: "/our-story", permanent: true },
      { source: "/collections", destination: "/bundles", permanent: true },
      { source: "/collections/:handle*", destination: "/bundles", permanent: true },
      { source: "/cart", destination: "/checkout", permanent: true },
      { source: "/products/:handle", destination: "/product?p=:handle", permanent: true },
    ];
  },
};
