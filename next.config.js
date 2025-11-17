const withMDX = require("@next/mdx")({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [[require("remark-dropcap")]],
  },
});

const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Turbopack is the default dev bundler starting in Next 16; this
  // empty config opts us in while still allowing MDX via @next/mdx.
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
