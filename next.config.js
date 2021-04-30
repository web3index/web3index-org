const withMDX = require("@next/mdx")({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [[require("remark-dropcap")]],
  },
});

const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

module.exports = withMDX(nextConfig);
