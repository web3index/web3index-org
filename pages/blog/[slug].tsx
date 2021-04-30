import Layout from "../../layouts";
import Box from "../../components/Box";
import Section from "../../components/Section";
import Container from "../../components/Container";
import Markdown from "../../components/Markdown";
import { getProjects } from "../../lib/utils";
import matter from "gray-matter";
import path from "path";
import fs from "fs";
import { ListBulletIcon, ReaderIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";
import Link from "next/link";
import Button from "../../components/Button";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import seo from "../../next-seo.config";
import renderToString from "next-mdx-remote/render-to-string";

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

const Post = ({ slug, source, frontMatter, projects }) => {
  const router = useRouter();
  const { isFallback } = router;

  if (isFallback) {
    return <Layout data={{ projects }}>Loading</Layout>;
  }

  const nextSeo = {
    ...seo,
    title: `The Web3 Index - ${frontMatter.seoTitle}`,
    description: frontMatter.abstract,
    openGraph: {
      ...seo.openGraph,
      title: `The Web3 Index - ${frontMatter.seoTitle}`,
      description: frontMatter.abstract,
      url: `https://beta.web3index.org/blog/${slug}`,
    },
  };

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
        <Link href="/blog" passHref>
          <StyledButton as="a">
            <ReaderIcon /> <Box css={{ ml: "$2" }}>Blog</Box>
          </StyledButton>
        </Link>
      </Box>
      <Section>
        <Container size="2">
          <Box
            css={{
              mt: "$3",
              mb: "$4",
              borderBottom: "1px solid",
              borderColor: "$border",
              textAlign: "center",
              pb: "$4",
              maxWidth: 800,
              mx: "auto",
              "@bp2": {
                pb: "$5",
                mb: "$5",
              },
            }}
          >
            <Box
              as="h1"
              css={{
                mt: 0,
                fontSize: "$5",
                mb: 24,
                "@bp2": {
                  fontSize: "$6",
                },
              }}
            >
              {frontMatter.title}
            </Box>
            <Box css={{ fontSize: "$2", opacity: 0.7, mb: 40 }}>
              {new Date(frontMatter.publishedOn).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Box>
            <Box
              css={{
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                as="img"
                css={{
                  width: "30",
                  height: 30,
                  borderRadius: "$round",
                  objectFit: "contain",
                  mr: "$3",
                }}
                src={frontMatter.avatar}
              />
              <Box css={{ fontSize: "$1" }}>
                <Box css={{ mb: "$1" }}>{frontMatter.author}</Box>
                <Box
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://twitter.com/${frontMatter.twitter}`}
                  css={{ color: "$blue", textDecoration: "none" }}
                >
                  @{frontMatter.twitter}
                </Box>
              </Box>
            </Box>
          </Box>
          <Markdown>
            <Box
              css={{
                px: "$3",
                pb: "$5",
                maxWidth: 700,
                mx: "auto",
                "@bp2": {
                  px: 20,
                },
              }}
              dangerouslySetInnerHTML={{ __html: source }}
            />
          </Markdown>
        </Container>
      </Section>
    </Layout>
  );
};

export async function getStaticPaths() {
  const paths = [];
  const postsDirectory = path.join(process.cwd(), "posts");
  const fileNames = fs.readdirSync(postsDirectory);

  for (const fileName of fileNames) {
    paths.push({
      params: {
        slug: fileName.replace(".mdx", ""),
      },
    });
  }

  return {
    paths,
    fallback: true,
  };
}

const A = ({ children, href }) => {
  return (
    <Link href={href} passHref>
      <Box as="a">{children}</Box>
    </Link>
  );
};

const components = {
  a: A,
};

export async function getStaticProps({ params }) {
  const fullPath = path.join("./posts", `${params.slug}.mdx`);
  const postContent = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(postContent);
  const { projects } = await getProjects();

  const { renderedOutput } = await renderToString(content, {
    components,
    mdxOptions: {
      remarkPlugins: [[require("remark-dropcap")]],
    },
  });

  return {
    props: {
      slug: params.slug,
      projects,
      source: renderedOutput,
      frontMatter: data,
    },
  };
}

export default Post;
