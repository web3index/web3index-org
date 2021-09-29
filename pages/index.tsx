import Layout from "../layouts";
import { useMemo } from "react";
import Box from "../components/Box";
import Table from "../components/Table";
import Section from "../components/Section";
import Container from "../components/Container";
import Header from "../components/Header";
import Faq from "../components/Faq";
import CallToAction from "../components/CallToAction";
import { getFaq } from "../lib/mdx";
import { getProjects } from "./api/projects";

const Rank = ({ row }) => (
  <Box css={{ display: "flex", alignItems: "center" }}>
    {/* <Box css={{ mr: "$2" }}>{trophies[+row.id]}</Box> */}
    {+row.id + 1}
  </Box>
);

const Home = ({ faq, revenue, projects }) => {
  const columns = useMemo(
    () => [
      {
        Header: "#",
        accessor: "rank",
        Cell: Rank,
        className: "sticky",
        hideOnMobile: true,
      },
      {
        Header: "Name",
        accessor: "name",
        className: "sticky",
      },
      {
        Header: "Symbol",
        accessor: "symbol",
      },
      {
        Header: "Image",
        accessor: "image",
      },
      {
        Header: "Slug",
        accessor: "slug",
      },
      {
        Header: "Blockchain",
        accessor: "blockchain",
        hideOnMobile: true,
      },
      {
        Header: "30d Revenue",
        accessor: "usage.revenue.thirtyDayTotal",
        tooltip:
          "Total demand side revenue accrued by the protocol over the last 30 days.",
      },
      {
        Header: "90d Revenue",
        accessor: "usage.revenue.ninetyDayTotal",
        tooltip:
          "Total demand side revenue accrued by the protocol over the last 90 days.",
      },
      {
        Header: "30d Trend",
        accessor: "usage.revenue.thirtyDayPercentChange",
        tooltip:
          "Trend is the increase, or decrease, in the protocol's revenue between two periods. It's calculated by subtracting the previous 30d revenue from the current 30d revenue, and then dividing that number by the previous 30d revenue.",
      },
      {
        Header: "Usage",
        accessor: "usage",
      },
    ],
    []
  );

  return (
    <Layout data={{ projects }}>
      <Section>
        <Container size="4">
          <Header css={{ mb: "$4" }} revenue={revenue} />
          <Table
            columns={columns}
            data={projects}
            css={{
              border: "1px solid",
              borderColor: "$border",
              borderRadius: "$4",
              mb: "$5",
              width: "100%",
              overflow: "scroll",
              WebkitOverflowScrolling: "touch",
            }}
          />
          <Faq items={faq} css={{ mb: "$6" }} />
          <CallToAction
            css={{
              maxWidth: 800,
              mx: "auto",
              pb: "$7",
              textAlign: "center",
            }}
          />
        </Container>
      </Section>
    </Layout>
  );
};

export async function getStaticProps() {
  const { projects, revenue } = await getProjects();
  const faq = await getFaq();
  return {
    props: {
      faq,
      revenue,
      projects: projects.sort((a, b) => {
        return b.usage.revenue.thirtyDayTotal - a.usage.revenue.thirtyDayTotal;
      }),
    },
    revalidate: 1,
  };
}

export default Home;
