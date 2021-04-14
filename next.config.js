const withMDX = require("@next/mdx")({
  extension: /\.(md|mdx)$/,
});

const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

module.exports = withMDX(nextConfig);
