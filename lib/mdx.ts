import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

const { readFileSync, readdirSync } = require("fs");

/**
 * Reads a content directory and returns MDX slugs without extensions.
 *
 * @param directory - Relative folder path inside the repo.
 */
export async function getSlugs(directory: string) {
  const files = await readdirSync(process.cwd() + "/" + directory);
  const slugs = files.map((file) => file.replace(/\.mdx/, ""));

  return slugs;
}

/**
 * Loads the raw MDX file contents for a given directory + slug.
 */
export async function getFile(directory: string, slug: string) {
  const file = await readFileSync(
    process.cwd() + `/${directory}/${slug}.mdx`,
    "utf8",
  );

  return file;
}

/** Extracts frontmatter metadata from an MDX file string. */
export const getFileData = (file: string) => {
  const { data } = matter(file);

  const fileData = {
    ...data,
  };

  return fileData;
};

const getFileContent = (file: string) => {
  const { content } = matter(file);

  return content;
};

/**
 * Serializes MDX content so it can be rendered with next-mdx-remote.
 */
export async function getContent(
  file: string,
  mdxOptions = {},
): Promise<MDXRemoteSerializeResult> {
  return serialize(getFileContent(file), {
    mdxOptions,
    parseFrontmatter: false,
  });
}

/** Loads FAQ entries (frontmatter + content) from the content/faq directory. */
export const getFaq = async () => {
  const slugs = await getSlugs("content/faq");

  const faq = await Promise.all(
    slugs.map(async (slug) => {
      const file = await getFile("content/faq", slug);
      const data = getFileData(file);
      const content = getFileContent(file);

      const faq = {
        data,
        content,
        slug,
      };

      return faq;
    }),
  );

  return faq;
};

/** Returns the list of blog posts (metadata only) for the blog index. */
export async function getPosts() {
  const slugs = await getSlugs("content/posts");

  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const file = await getFile("content/posts", slug);
      const data = getFileData(file);
      const post = {
        data,
        slug,
      };

      return post;
    }),
  );

  return posts;
}
