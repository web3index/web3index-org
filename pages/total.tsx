import Layout from "../layouts";
import Box from "../components/Box";
import Section from "../components/Section";
import Container from "../components/Container";
import LineAndBarGraph from "../components/LineAndBarGraph";
import { ResponsiveContainer } from "recharts";
import { useEffect, useRef, useState } from "react";
import RevenueChange from "../components/RevenueChange";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { getProjects } from "./api/projects";

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
      }}
    >
      <Box css={{ mr: "$3" }}>{label}</Box>
      <Box>{value}</Box>
    </Box>
  );
};

const Project = ({ projects, days, revenue }) => {
  const router = useRouter();
  const { isFallback } = router;
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
    return <Layout data={{ projects }}>Loading</Layout>;
  }

  return (
    <Layout data={{ projects }}>
      <NextSeo title={`The Web3 Index - Total Fees Paid`} />

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
            }}
          >
            <Box css={{ mt: "$5" }}>
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
                }}
              >
                <Box>
                  <Metric
                    label="30d Fees"
                    value={
                      <Box css={{ display: "flex", alignItems: "center" }}>
                        <Box css={{ mr: "$1" }}>
                          \$
                          {Math.round(revenue.thirtyDayTotal).toLocaleString()}
                        </Box>
                      </Box>
                    }
                  />

                  <Metric
                    label="Total Fees"
                    value={`$${Math.round(
                      revenue.totalParticipantRevenueNow
                    ).toLocaleString()}`}
                  />
                  <Metric
                    label="30d Trend"
                    value={
                      <Box css={{ display: "flex", alignItems: "center" }}>
                        <Box css={{ mr: "$1" }}>
                          <RevenueChange
                            percentChange={Intl.NumberFormat("en-US", {
                              maximumFractionDigits: 2,
                            }).format(revenue.thirtyDayPercentChange)}
                          />
                        </Box>
                      </Box>
                    }
                  />
                </Box>
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
              <ResponsiveContainer key="totalFeesPaid" height={400} ref={ref}>
                <LineAndBarGraph
                  base={revenue.oneWeekTotal}
                  baseChange={revenue.oneWeekPercentChange}
                  color="#52a9ff"
                  days={days}
                  height={420}
                  width={width}
                  useWeekly={true}
                  title="Demand-side Protocol Fees"
                />
              </ResponsiveContainer>
            </Box>
          </Box>
        </Container>
      </Section>
    </Layout>
  );
};

export async function getStaticProps() {
  const { projects, revenue, days }: any = await getProjects();
  console.log(projects);
  projects.sort((a, b) => {
    return b.usage.revenue.thirtyDayTotal - a.usage.revenue.thirtyDayTotal;
  });

  return {
    props: {
      projects,
      revenue,
      days,
    },
    revalidate: 1,
  };
}

export default Project;
