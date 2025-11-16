import Ajv from "ajv";
import schema from "../schema.json";
import registry from "../registry.json";
import Layout from "../layouts";
import ProjectHeader from "../components/ProjectHeader";
import Box from "../components/Box";
import Section from "../components/Section";
import Container from "../components/Container";
import LineAndBarGraph from "../components/LineAndBarGraph";
import { ResponsiveContainer } from "recharts";
import { useEffect, useRef, useState } from "react";
import { styled } from "../stitches.config";
import Button from "../components/Button";
import RevenueChange from "../components/RevenueChange";
import {
  Tooltip,
  TooltipTrigger,
  TooltipArrow,
  TooltipContent,
} from "../components/Tooltip";
import {
  TwitterLogoIcon,
  GitHubLogoIcon,
  Link1Icon,
  ExternalLinkIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { NextSeo } from "next-seo";
import seo from "../next-seo.config";
import { useRouter } from "next/router";
import { getProject } from "./api/projects/[id]";
import { getProjects } from "./api/projects";
import { request, gql } from "graphql-request";
import { getEverestSubgraph } from "../lib/utils";
import Alert from "../components/Alert";
import type { GetStaticPaths, GetStaticProps } from "next";

type EverestProjectQuery = {
  project: {
    description?: string | null;
    website?: string | null;
    github?: string | null;
    twitter?: string | null;
  } | null;
};

const SocialButton = ({ icon, children, ...props }) => {
  const SocialButton = styled(Button, {
    borderRadius: 10,
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
    boxShadow: "rgb(0 0 0 / 5%) 0px 10px 20px",
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
      {...props}>
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

const Metric = ({ label, value }) => {
  return (
    <Box
      css={{
        fontSize: "$1",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid $colors$border",
        py: "$3",
        justifyContent: "space-between",
        "&:last-child": {
          borderBottom: 0,
        },
      }}>
      <Box css={{ mr: "$3" }}>{label}</Box>
      <Box>{value}</Box>
    </Box>
  );
};

const Project = ({ slug, index, projects, project }) => {
  const router = useRouter();
  const { query, isFallback } = router;
  const ref = useRef(null);
  const isClient = typeof window === "object";
  const [width, setWidth] = useState(ref?.current?.container?.clientWidth);
  const paymentType =
    registry[slug]?.paymentType === "dilution" ? "dilution" : "revenue";

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

  // Add event listeners
  useEffect(() => {
    function downHandler({ key }) {
      const index = projects.findIndex((x) => x.slug === query.slug);
      if (key === "ArrowLeft") {
        const prev =
          index === 0
            ? projects[projects.length - 1]?.slug
            : projects[index - 1]?.slug;
        router.push(`/${prev}`);
      }
      if (key === "ArrowRight") {
        const next =
          index === projects.length - 1
            ? projects[0]?.slug
            : projects[index + 1]?.slug;
        router.push(`/${next}`);
      }
    }
    window.addEventListener("keydown", downHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [query.slug, projects, router]);

  if (isFallback) {
    return <Layout data={{ projects }}>Loading</Layout>;
  }

  const nextSeo = {
    ...seo,
    title: `The Web3 Index - ${project.name}`,
    description: project.description,
    openGraph: {
      ...seo.openGraph,
      title: `The Web3 Index - ${project.name}`,
      description: project.description,
      url: `https://web3index.org/project/${slug}`,
    },
  };

  return (
    <Layout data={{ projects }}>
      <NextSeo
        {...nextSeo}
        title={`The Web3 Index - ${project.name}`}
        description={project.description}
      />
      <ProjectHeader
        rank={index}
        first={projects[0].slug}
        next={
          index === projects.length - 1
            ? projects[0]?.slug
            : projects[index + 1]?.slug
        }
        prev={
          index === 0
            ? projects[projects.length - 1]?.slug
            : projects[index - 1]?.slug
        }
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
                gridTemplateColumns: "38% calc(62% - 100px)",
              },
            }}>
            <Box css={{ mt: "$5" }}>
              {!project.untracked && (
                <Box css={{ fontSize: "$5", mb: "$3" }}>
                  {/* <span role="img" aria-label="#1">
                  {trophies[index]}
                </span>{" "} */}
                  #{index + 1}
                </Box>
              )}
              <Box
                css={{
                  mb: "$3",
                  display: "flex",
                  alignItems: "center",
                }}>
                <Box
                  css={{
                    mr: "$3",
                    width: 44,
                    height: 44,
                  }}
                  as="img"
                  alt={project.name}
                  src={project.image}
                />
                <Box
                  as="h1"
                  css={{
                    letterSpacing: -1,
                    m: 0,
                    fontSize: 56,
                    fontWeight: 800,
                  }}>
                  {project.name}
                </Box>
              </Box>
              <Box as="p" css={{ mt: 0, lineHeight: "24px", mb: "$4" }}>
                {project.description}
              </Box>
              {!project.untracked && (
                <Box
                  css={{
                    mb: "$4",
                    display: "grid",
                    gap: 30,
                    gridTemplateColumns: "repeat(1, 1fr)",
                    "@bp2": {
                      gap: 30,
                      gridTemplateColumns: "repeat(2, 1fr)",
                    },
                  }}>
                  <Box>
                    <Metric label="Category" value={project.category} />
                    <Metric label="Subcategory" value={project.subcategory} />
                    <Metric label="Chain" value={project.blockchain} />
                    <Metric label="Genesis Date" value={project.genesisDate} />
                  </Box>
                  <Box>
                    <Metric
                      label={
                        paymentType === "dilution" ? "30d Dilution" : "30d Fees"
                      }
                      value={
                        <Box>
                          <Tooltip delayDuration={0}>
                            <Box
                              css={{ display: "flex", alignItems: "center" }}>
                              <Box css={{ mr: "$1" }}>
                                $
                                {Math.round(
                                  project.usage[paymentType].thirtyDayTotal,
                                ).toLocaleString()}
                              </Box>
                              <TooltipTrigger>
                                <InfoCircledIcon />
                              </TooltipTrigger>
                            </Box>
                            <TooltipContent>
                              <TooltipArrow />
                              {paymentType === "dilution"
                                ? "Total dilution incurred by the demand-side of the protocol over the last 30 days."
                                : "Total demand-side fees accrued by the protocol over the last 30 days."}
                            </TooltipContent>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <Metric
                      label={
                        paymentType === "dilution" ? "90d Dilution" : "90d Fees"
                      }
                      value={
                        <Box>
                          <Tooltip delayDuration={0}>
                            <Box
                              css={{ display: "flex", alignItems: "center" }}>
                              <Box css={{ mr: "$1" }}>
                                $
                                {Math.round(
                                  project.usage[paymentType].ninetyDayTotal,
                                ).toLocaleString()}
                              </Box>
                              <TooltipTrigger>
                                <InfoCircledIcon />
                              </TooltipTrigger>
                            </Box>
                            <TooltipContent>
                              <TooltipArrow />
                              {paymentType === "dilution"
                                ? "Total dilution incurred by the demand-side of the protocol over the last 30 days."
                                : "Total demand-side fees accrued by the protocol over the last 30 days."}
                            </TooltipContent>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <Metric
                      label={
                        paymentType === "dilution"
                          ? "Total Dilution"
                          : "Total Fees"
                      }
                      value={`$${Math.round(
                        project.name == "The Graph"
                          ? project.usage[paymentType].now - 71840.14 // remove fees from day the graph migrated to arbitrum
                          : project.usage[paymentType].now,
                      ).toLocaleString()}`}
                    />
                    <Metric
                      label="30d Trend"
                      value={
                        <Box>
                          <Tooltip delayDuration={0}>
                            <Box
                              css={{ display: "flex", alignItems: "center" }}>
                              <Box css={{ mr: "$1" }}>
                                <RevenueChange
                                  percentChange={Intl.NumberFormat("en-US", {
                                    maximumFractionDigits: 2,
                                  }).format(
                                    project.usage[paymentType]
                                      .thirtyDayPercentChange,
                                  )}
                                />
                              </Box>
                              <TooltipTrigger>
                                <InfoCircledIcon />
                              </TooltipTrigger>
                            </Box>
                            <TooltipContent>
                              <TooltipArrow />
                              {paymentType === "dilution" ? (
                                <Box>
                                  Trend is the increase or decrease in the
                                  protocol&apos;s dilutionary activity between
                                  two periods. It&apos;s calculated by
                                  subtracting the previous 30d dilution from the
                                  current 30d dilution, and then dividing that
                                  number by the previous 30d dilution.
                                </Box>
                              ) : (
                                <Box>
                                  Trend is the increase or decrease in the
                                  protocol&apos;s demand-side fees between two
                                  periods. It&apos;s calculated by subtracting
                                  the previous 30d fees from the current 30d
                                  fees, and then dividing that number by the
                                  previous 30d fees.
                                </Box>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Box>
                </Box>
              )}
              <Box>
                <SocialButton
                  href={`https://twitter.com/${
                    registry[slug].twitter
                      ? registry[slug].twitter
                      : project.twitter
                  }`}
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<TwitterLogoIcon />}>
                  Twitter
                </SocialButton>
                <SocialButton
                  href={`https://github.com/${
                    registry[slug].github
                      ? registry[slug].github
                      : project.github
                  }`}
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<GitHubLogoIcon />}>
                  Github
                </SocialButton>
                <SocialButton
                  href={
                    registry[slug].website
                      ? registry[slug].website
                      : project.website.includes("https")
                        ? project.website
                        : `https://${project.website}`
                  }
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<Link1Icon />}>
                  Website
                </SocialButton>
                <SocialButton
                  href={`https://everest.link/project/${project.everestID}`}
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={
                    <Everest
                      css={{ width: 14, height: 14, color: "$hiContrast" }}
                    />
                  }>
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
              }}>
              {project.usage.warning ? (
                <Box css={{ mb: "$4" }}>
                  <Alert>{project.usage.warning}</Alert>
                </Box>
              ) : null}
              {project.untracked ? (
                <Box css={{ mb: "$4" }}>
                  <Alert>
                    It&apos;s been reported that the demand-side fees being
                    reported for {project.name} are inaccurate. We have
                    temporarily de-listed {project.name} from the index and will
                    re-list the project when the correct data is available.
                  </Alert>
                </Box>
              ) : (
                <ResponsiveContainer key={project.slug} height={400} ref={ref}>
                  <LineAndBarGraph
                    base={project.usage[paymentType].oneWeekTotal}
                    baseChange={project.usage[paymentType].oneWeekPercentChange}
                    color={project.color}
                    days={project.usage.days}
                    height={420}
                    width={width}
                    useWeekly={true}
                    title={
                      paymentType === "dilution"
                        ? "Demand-side Protocol Dilution"
                        : "Demand-side Protocol Fees"
                    }
                  />
                </ResponsiveContainer>
              )}
            </Box>
          </Box>
        </Container>
      </Section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const paths = [];

  for (const project in registry) {
    const data = await getProject(project);
    const valid = validate(data);

    if (valid && !registry[project].hide) {
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
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug?.toString();
  if (!slug) {
    return { notFound: true };
  }

  const { projects } = await getProjects();
  const project = projects.find((project) => project.slug === slug);

  if (!project) {
    return { notFound: true };
  }

  projects.sort((a, b) => {
    return b.usage.revenue.thirtyDayTotal - a.usage.revenue.thirtyDayTotal;
  });

  const index = projects.findIndex((p) => p.slug === slug);
  let remoteProject: EverestProjectQuery["project"] | null = null;
  try {
    const response = await request<EverestProjectQuery>(
      getEverestSubgraph(),
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
      { id: project.everestID },
    );
    remoteProject = response.project;
  } catch (error) {
    console.warn(
      "Everest project metadata unavailable; continuing without it",
      { slug, everestID: project.everestID, error },
    );
  }

  return {
    props: {
      index,
      slug,
      project: {
        ...project,
        description: project.description
          ? project.description
          : remoteProject?.description,
        website: remoteProject?.website
          ? remoteProject?.website
          : project.website,
        github: remoteProject?.github ? remoteProject?.github : project.github,
        twitter: remoteProject?.twitter
          ? remoteProject?.twitter
          : project.twitter,
      },
      projects,
    },
    revalidate: 30,
  };
};

export default Project;
