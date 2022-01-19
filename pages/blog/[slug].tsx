import Layout from "../../layouts";
import Box from "../../components/Box";
import Section from "../../components/Section";
import Container from "../../components/Container";
import Markdown from "../../components/Markdown";
import { ListBulletIcon, ReaderIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";
import Link from "next/link";
import Button from "../../components/Button";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import seo from "../../next-seo.config";
import { getContent, getFile, getFileData, getSlugs } from "../../lib/mdx";
import hydrate from "next-mdx-remote/hydrate";
import MDXComponents from "../../components/MDXComponents";
import { getProjects } from "../api/projects";

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

const Post = ({ slug, content, data, projects }) => {
  const router = useRouter();
  const { isFallback } = router;

  if (isFallback) {
    return <Layout data={{ projects }}>Loading</Layout>;
  }

  const mdx = hydrate(content, {
    components: MDXComponents,
  });

  const nextSeo = {
    ...seo,
    title: `The Web3 Index - ${data.seoTitle}`,
    description: data.abstract,
    openGraph: {
      ...seo.openGraph,
      title: `The Web3 Index - ${data.seoTitle}`,
      description: data.abstract,
      url: `https://web3index.org/blog/${slug}`,
      images: [
        {
          url: data.shareImage
            ? data.shareImage
            : "https://web3index.org/images/og/launch-image.jpg",
          alt: data.seoTitle,
          width: 1200,
          height: 630,
        },
      ],
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
              {data.title}
            </Box>
            <Box css={{ fontSize: "$2", opacity: 0.7, mb: 40 }}>
              {new Date(data.publishedOn).toLocaleDateString("en-US", {
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
              {data?.avatar && (
                <Box
                  as="img"
                  css={{
                    width: "30",
                    height: 30,
                    borderRadius: "$round",
                    objectFit: "contain",
                    mr: "$3",
                  }}
                  src={data.avatar}
                />
              )}
              <Box css={{ fontSize: "$1" }}>
                <Box css={{ mb: "$1" }}>{data.author}</Box>
                {data?.twitter && (
                  <Box
                    as="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://twitter.com/${data.twitter}`}
                    css={{ color: "$blue", textDecoration: "none" }}
                  >
                    @{data.twitter}
                  </Box>
                )}
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
                img: {
                  width: "100%",
                },
              }}
            >
              {mdx}
            </Box>
          </Markdown>
        </Container>
      </Section>
    </Layout>
  );
};

export async function getStaticPaths() {
  const slugs = await getSlugs("content/posts");

  return {
    paths: slugs.map((slug) => {
      return {
        params: {
          slug,
        },
      };
    }),
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { projects } = await getProjects();
  const slug = params?.slug ? params?.slug.toString() : "";
  const file = await getFile("content/posts", slug);
  const content = await getContent(file, {
    remarkPlugins: [[require("remark-dropcap")]],
  });
  const data = getFileData(file);

  return {
    props: {
      data,
      content,
      slug,
      projects,
    },
    revalidate: 1,
  };
}

export default Post;
