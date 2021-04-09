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

const Project = ({ projects, project }) => {
  // update the width on a window resize
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

  return (
    <Layout data={{ projects }}>
      <ProjectHeader color={project.color} />
      <Section css={{ mb: "$6" }}>
        <Container size="4">
          <Box
            css={{
              display: "grid",
              gridTemplateColumns: "33.334% calc(66.667% - 100px)",
              gap: 100,
            }}
          >
            <Box css={{ mt: "$5" }}>
              <Box css={{ fontSize: "$5", mb: "$3" }}>
                <span role="img" aria-label="#1">
                  🏆
                </span>{" "}
                #1
              </Box>
              <Box
                css={{
                  mb: "$4",
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
              <Box as="p" css={{ mb: "$4" }}>
                A decentralized video streaming and transcording protocol.
              </Box>
              <Box
                css={{
                  fontSize: "$2",
                  mb: "$3",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box css={{ fontWeight: 600, mr: "$3" }}>Category:</Box>
                Compute
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
                Ethereum
              </Box>
            </Box>
            <Box css={{ mt: "$5" }}>
              <ResponsiveContainer aspect={60 / 28} ref={ref}>
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
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { projects } = await getProjects();
  const project = projects.filter((project) => project.slug === params.slug)[0];

  return {
    props: {
      project,
      projects,
    },
  };
}

export default Project;
