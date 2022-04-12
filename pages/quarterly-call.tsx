import Layout from "../layouts";
import Box from "../components/Box";
import Section from "../components/Section";
import Container from "../components/Container";
import { ListBulletIcon, ReaderIcon } from "@modulz/radix-icons";
import { styled } from "../stitches.config";
import Link from "next/link";
import Button from "../components/Button";
import { NextSeo } from "next-seo";
import seo from "../next-seo.config";
import { getProjects } from "./api/projects";

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

const Post = ({ projects }) => {
  const nextSeo = {
    ...seo,
    title: `The Web3 Index - Quarterly Call`,
    description: "The Web3 Index Quarterly Call",
    openGraph: {
      ...seo.openGraph,
      title: `The Web3 Index - Quarterly Call`,
      description: "The Web3 Index Quarterly Call",
      url: `https://web3index.org/quarterly-call`,
      images: [
        {
          url: "https://web3index.org/images/og/launch-image.jpg",
          alt: `The Web3 Index - Quarterly Call`,
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
              display: "flex",
              height: "calc(100vh - 300px)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              mt: "$3",
              mb: "$4",
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
                  fontSize: "$7",
                },
              }}
            >
              The Web3 Index Quarterly Call
            </Box>
            <Box css={{ fontSize: "$4", opacity: 0.7, mb: 40 }}>
              04.18.2022 @ 3pm ET
            </Box>
            <Button
              as="a"
              target="_blank"
              href="https://us02web.zoom.us/j/83592884324?pwd=cWN2NjRGdEQzODFLNVlVcUhEQ1pGQT09"
              css={{
                justifyContent: "center",
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              Attend Zoom Call
            </Button>
          </Box>
        </Container>
      </Section>
    </Layout>
  );
};

export async function getStaticProps() {
  const { projects } = await getProjects();

  return {
    props: {
      projects,
    },
    revalidate: 1,
  };
}

export default Post;
