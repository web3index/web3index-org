import { promises as fs } from "fs";
import matter from "gray-matter";
import renderToString from "next-mdx-remote/render-to-string";
import A from "../components/MDXComponents/A";

export async function getSlugs(directory: string) {
  const files = await fs.readdir(process.cwd() + "/" + directory);
  const slugs = files.map((file) => file.replace(/\.mdx/, ""));

  return slugs;
}

export async function getFile(directory: string, slug: string) {
  const file = await fs.readFile(
    process.cwd() + `/${directory}/${slug}.mdx`,
    "utf8"
  );

  return file;
}

export const getFileData = (file: string) => {
  const { data } = matter(file);

  const fileData = {
    ...data,
  };

  return fileData;
};

export const getFileContent = (file: string) => {
  const { content } = matter(file);

  return content;
};

export async function getContent(file: string, mdxOptions = {}) {
  const content = await renderToString(getFileContent(file), {
    components: { a: A },
    mdxOptions,
  });

  return content;
}

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
    })
  );

  return faq;
};

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
    })
  );

  return posts;
}
