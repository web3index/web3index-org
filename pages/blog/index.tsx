import Layout from "../../layouts";
import Section from "../../components/Section";
import Box from "../../components/Box";
import { getProjects } from "../../lib/utils";
import matter from "gray-matter";
import path from "path";
import fs from "fs";
import { ListBulletIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";
import Link from "next/link";
import Button from "../../components/Button";
import BlogCard from "../../components/BlogCard";
import { NextSeo } from "next-seo";
import seo from "../../next-seo.config";

const StyledButton = styled(Button, {
  border: "1px solid",
  borderColor: "$border",
  backgroundColor: "$loContrast",
  color: "$hiContrast",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  px: "$3",
  py: "10px",
});

const nextSeo = {
  ...seo,
  title: "The Web3 Index - Blog",
  description: "Welcome to The Web3 Index Blog",
  openGraph: {
    ...seo.openGraph,
    title: `The Web3 Index - Blog`,
    description: "Welcome to The Web3 Index Blog",
  },
};

const Index = ({ posts, projects }) => {
  return (
    <Layout data={{ projects }}>
      <NextSeo {...nextSeo} />
      <Box
        css={{
          display: "flex",
          alignItems: "center",
          position: "sticky",
          py: 16,
          top: 0,
          width: "100%",
          px: "$4",
          backgroundColor: "$blur",
          backdropFilter: "saturate(180%) blur(5px)",
        }}
      >
        <Link href="/" passHref>
          <StyledButton as="a" css={{ mr: "$2" }}>
            <ListBulletIcon /> <Box css={{ ml: "$2" }}>Index</Box>
          </StyledButton>
        </Link>
      </Box>
      <Box
        css={{
          mb: "$5",
          borderBottom: "1px solid",
          borderColor: "$border",
          textAlign: "center",
          pb: "$4",
        }}
      >
        <Box as="h1" css={{ mt: 0, fontSize: "$7", mb: 24 }}>
          Blog
        </Box>
        <Box
          as="h2"
          css={{
            fontWeight: "normal",
            mt: 0,
            fontSize: "$4",
            opacity: 0.5,
            mb: 40,
          }}
        >
          Welcome to The Web3 Index Blog
        </Box>
      </Box>
      <Section css={{ pb: "$6" }}>
        {posts.map((post, i) => (
          <BlogCard
            key={i}
            title={post.data.title}
            date={new Date(post.data.publishedOn).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            abstract={post.data.abstract}
            slug={post.slug}
          />
        ))}
      </Section>
    </Layout>
  );
};

export async function getStaticProps() {
  const { projects } = await getProjects();
  const posts = [];
  const postsDirectory = path.join(process.cwd(), "posts");
  const fileNames = fs.readdirSync(postsDirectory);

  for (const fileName of fileNames) {
    const fullPath = path.join("./posts", `${fileName}`);
    const postContent = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(postContent);

    posts.push({
      data,
      slug: fileName.replace(".mdx", ""),
      content,
    });
  }

  return {
    props: {
      posts: posts.sort((a, b) => {
        return +new Date(b.data.publishedOn) - +new Date(a.data.publishedOn);
      }),
      projects: projects.sort((a, b) => {
        return b.usage.revenue.oneWeekTotal - a.usage.revenue.oneWeekTotal;
      }),
    },
    revalidate: 1,
  };
}

export default Index;
