import Layout from "../layouts";
import { useMemo } from "react";
import Box from "../components/Box";
import Table from "../components/Table";
import Section from "../components/Section";
import Container from "../components/Container";
import Header from "../components/Header";
import Faq from "../components/Faq";
import CallToAction from "../components/CallToAction";
import { trophies } from "../lib/utils";
import { getFaq } from "../lib/mdx";
import { getProjects } from "./api/projects";

const Rank = ({ row }) => (
  <Box css={{ display: "flex", alignItems: "center" }}>
    <Box css={{ mr: "$2" }}>{trophies[+row.id]}</Box> {+row.id + 1}
  </Box>
);

const Home = ({ faq, revenue, projects }) => {
  const columns = useMemo(
    () => [
      {
        Header: "#",
        accessor: "rank",
        Cell: Rank,
      },
      {
        Header: "Name",
        accessor: "name",
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
        Header: "Blockchain",
        accessor: "blockchain",
        hideOnMobile: true,
      },
      {
        Header: "Slug",
        accessor: "slug",
      },
      {
        Header: "30d Revenue",
        accessor: "usage.revenue.thirtyDayTotal",
      },
      {
        Header: "90d Revenue",
        accessor: "usage.revenue.ninetyDayTotal",
      },
      {
        Header: "30d Trend",
        accessor: "usage.revenue.thirtyDayPercentChange",
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
