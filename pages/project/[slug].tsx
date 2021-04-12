import Ajv from "ajv";
import schema from "../../schema.json";
import registry from "../../registry.json";
import { getProjects } from "../../lib/utils";
import Layout from "../../layouts";
import ProjectHeader from "../../components/ProjectHeader";
import Box from "../../components/Box";
import Section from "../../components/Section";
import Container from "../../components/Container";
import LineAndBarGraph from "../../components/LineAndBarGraph";
import { ResponsiveContainer } from "recharts";
import { useEffect, useRef, useState } from "react";
import { request, gql } from "graphql-request";
import { styled } from "../../stitches.config";
import Button from "../../components/Button";
import {
  TwitterLogoIcon,
  GitHubLogoIcon,
  Link1Icon,
  ExternalLinkIcon,
} from "@modulz/radix-icons";
import { NextSeo } from "next-seo";
import seo from "../../next-seo.config";
import { useRouter } from "next/router";

const trophies = ["🏆", "🥈", "🥉"];

const SocialButton = ({ icon, children, ...props }) => {
  const SocialButton = styled(Button, {
    border: "1px solid",
    borderColor: "$border",
    backgroundColor: "$loContrast",
    color: "$hiContrast",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    mb: "$3",
    py: 18,
    fontSize: "$2",
  });
  return (
    <SocialButton {...props}>
      <Box css={{ display: "flex", alignItems: "center" }}>
        <Box css={{ mr: "$2" }}>{icon}</Box>
        {children}
      </Box>
      <ExternalLinkIcon />
    </SocialButton>
  );
};

const Everest = ({ ...props }) => {
  return (
    <Box
      as="svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.9446 23.9418L0.0372314 12.0343L6.56058 5.51074L18.4682 17.4183L11.9446 23.9418Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.0371094 12.0343L11.9445 0.126709L23.8523 12.0343H0.0371094Z"
        fill="currentColor"
      />
      <path
        opacity="0.5"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.0372314 12.0343L6.56058 5.51074L13 11.9999L0.0372314 12.0343Z"
        fill="currentColor"
      />
    </Box>
  );
};

const Project = ({ index, projects, project }) => {
  const { isFallback } = useRouter();
  const ref = useRef(null);
  const isClient = typeof window === "object";
  const [width, setWidth] = useState(ref?.current?.container?.clientWidth);

  useEffect(() => {
    if (!isClient) {
      return;
    }
    function handleResize() {
      setWidth(ref?.current?.container?.clientWidth ?? width);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient, width]);

  if (isFallback) {
    return (
      <Layout key={index} data={{ projects }}>
        Loading
      </Layout>
    );
  }

  return (
    <Layout key={index} data={{ projects }}>
      <NextSeo
        {...seo}
        title={`The Web3 Index - ${project.name}`}
        description={project.description}
      />
      <ProjectHeader
        rank={index}
        first={projects[0].slug}
        next={projects[index + 1]?.slug}
        prev={projects[index - 1]?.slug}
        color={project.color}
      />
      <Section css={{ mb: "$6" }}>
        <Container size="4">
          <Box
            css={{
              display: "grid",
              gridTemplateColumns: "100%",
              gap: 0,
              "@bp2": {
                gap: 100,
                gridTemplateColumns: "33.334% calc(66.667% - 100px)",
              },
            }}
          >
            <Box css={{ mt: "$5" }}>
              <Box css={{ fontSize: "$5", mb: "$3" }}>
                <span role="img" aria-label="#1">
                  {trophies[index]}
                </span>{" "}
                #{index + 1}
              </Box>
              <Box
                css={{
                  mb: "$3",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box
                  as="img"
                  alt={project.name}
                  src={project.image}
                  css={{ mr: "$3", width: 44, height: 44 }}
                />
                <Box
                  as="h1"
                  css={{
                    letterSpacing: -1,
                    m: 0,
                    fontSize: 56,
                    fontWeight: 800,
                  }}
                >
                  {project.name}
                </Box>
              </Box>
              <Box as="p" css={{ mt: 0, lineHeight: "24px", mb: "$4" }}>
                {project.description}
              </Box>
              <Box css={{ mb: "$4" }}>
                <Box
                  css={{
                    fontSize: "$2",
                    mb: "$3",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box css={{ fontWeight: 600, mr: "$3" }}>Category:</Box>
                  {project.category}
                </Box>
                <Box
                  css={{
                    fontSize: "$2",
                    mb: "$3",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box css={{ fontWeight: 600, mr: "$3" }}>Subcategory:</Box>
                  {project.subcategory}
                </Box>
                <Box
                  css={{
                    fontSize: "$2",
                    mb: "$3",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box css={{ fontWeight: 600, mr: "$3" }}>Stack:</Box>
                  {project.stack}
                </Box>
                <Box
                  css={{
                    fontSize: "$2",
                    mb: "$3",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box css={{ fontWeight: 700, mr: "$3" }}>Blockchain:</Box>
                  {project.blockchain}
                </Box>
              </Box>
              <Box css={{ width: 300 }}>
                <SocialButton
                  href={`https://twitter.com/${project.twitter}`}
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<TwitterLogoIcon />}
                >
                  Twitter
                </SocialButton>
                <SocialButton
                  href={`https://github.com/${project.twitter}`}
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<GitHubLogoIcon />}
                >
                  Github
                </SocialButton>
                <SocialButton
                  href={project.website}
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<Link1Icon />}
                >
                  Website
                </SocialButton>
                <SocialButton
                  href={project.website}
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={
                    <Everest
                      css={{ width: 14, height: 14, color: "$hiContrast" }}
                    />
                  }
                >
                  Everest
                </SocialButton>
              </Box>
            </Box>
            <Box
              css={{
                mt: "$4",
                borderTop: "1px solid",
                borderColor: "$border",
                pt: "$4",
                "@bp2": {
                  mt: "$5",
                  borderTop: 0,
                  pt: 0,
                },
              }}
            >
              <ResponsiveContainer height={400} ref={ref}>
                <LineAndBarGraph
                  base={project.usage.revenue.oneWeekTotal}
                  baseChange={project.usage.revenue.oneWeekPercentChange}
                  color={project.color}
                  days={project.usage.days}
                  height={420}
                  width={width}
                  useWeekly={true}
                />
              </ResponsiveContainer>
            </Box>
          </Box>
        </Container>
      </Section>
    </Layout>
  );
};

export async function getStaticPaths() {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const paths = [];

  for (const project in registry) {
    let data;
    if (registry[project].includes("web3index.org")) {
      const { getProject } = await import(`../api/${project}`);
      data = await getProject();
    } else {
      const res = await fetch(registry[project]);
      data = await res.json();
    }

    const valid = validate(data);

    if (valid) {
      paths.push({
        params: {
          slug: project,
        },
      });
    }
  }
  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { projects } = await getProjects();
  const project = projects.filter((project) => project.slug === params.slug)[0];
  projects.sort((a, b) => {
    return b.usage.revenue.oneWeekTotal - a.usage.revenue.oneWeekTotal;
  });
  const index = projects.findIndex((p) => p.slug === params.slug);
  const {
    project: { description, website, github, twitter },
  } = await request(
    "https://api.thegraph.com/subgraphs/name/graphprotocol/everest",
    gql`
      query project($id: String!) {
        project(id: $id) {
          website
          github
          twitter
          description
        }
      }
    `,
    { id: project.everestID }
  );
  return {
    props: {
      index,
      project: { ...project, description, website, github, twitter },
      projects,
    },
    revalidate: 1,
  };
}

export default Project;
