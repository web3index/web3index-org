import Layout from "../../layouts";
import Section from "../../components/Section";
import Box from "../../components/Box";
import { ListBulletIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";
import Link from "next/link";
import Button from "../../components/Button";
import BlogCard from "../../components/BlogCard";
import { NextSeo } from "next-seo";
import seo from "../../next-seo.config";
import { getPosts } from "../../lib/mdx";
import { getProjects } from "../api/projects";
import Container from "../../components/Container";

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
    url: `https://web3index.org/blog/`,
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
        }}>
        <StyledButton as={Link} href="/" css={{ mr: "$2" }}>
          <ListBulletIcon /> <Box css={{ ml: "$2" }}>Index</Box>
        </StyledButton>
      </Box>
      <Box
        css={{
          mb: "$5",
          borderBottom: "1px solid",
          borderColor: "$border",
          textAlign: "center",
          pb: "$4",
        }}>
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
          }}>
          Welcome to The Web3 Index Blog
        </Box>
      </Box>
      <Section css={{ pb: "$6" }}>
        <Container size="3">
          {posts.map((post, i) => (
            <BlogCard
              key={i}
              title={post.data.title}
              date={new Date(post.data.publishedOn).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
              abstract={post.data.abstract}
              slug={post.slug}
            />
          ))}
        </Container>
      </Section>
    </Layout>
  );
};

export async function getStaticProps() {
  const { projects } = await getProjects();
  const posts: any = await getPosts();

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
