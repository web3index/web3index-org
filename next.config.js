const withMDX = require("@next/mdx")({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [[require("remark-dropcap")]],
  },
});

const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
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
