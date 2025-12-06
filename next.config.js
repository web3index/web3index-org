const withMDX = require("@next/mdx")({
  extension: /\.(md|mdx)$/,
});

const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Use Turbopack (Next 16 default). MDX options are kept serializable for it.
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/project/:slug",
        destination: "/:slug",
        permanent: false,
      },
    ];
  },
};

module.exports = withMDX(nextConfig);
