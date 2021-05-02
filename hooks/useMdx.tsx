import hydrate from "next-mdx-remote/hydrate";
import MDXComponents from "../components/MDXComponents";

export function useMDX(content: any) {
  const mdx = hydrate(content, {
    components: MDXComponents,
  });

  return mdx;
}
