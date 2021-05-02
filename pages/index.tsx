import Layout from "../layouts";
import { useMemo } from "react";
import Box from "../components/Box";
import Table from "../components/Table";
import Section from "../components/Section";
import Container from "../components/Container";
import Header from "../components/Header";
import CallToAction from "../components/CallToAction";
import { getProjects, trophies } from "../lib/utils";

const Rank = ({ row }) => (
  <Box css={{ display: "flex", alignItems: "center" }}>
    <Box css={{ mr: "$2" }}>{trophies[+row.id]}</Box> {+row.id + 1}
  </Box>
);

const Home = ({ revenue, projects }) => {
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
        Header: "Slug",
        accessor: "slug",
      },
      {
        Header: "Category",
        accessor: "subcategory",
      },
      {
        Header: "Blockchain",
        accessor: "blockchain",
      },
      {
        Header: "7 Day Revenue",
        accessor: "revenue",
      },
      {
        Header: "Total Revenue",
        accessor: "totalRevenue",
      },
      {
        Header: "7 Day Change",
        accessor: "percentChange",
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

  return {
    props: {
      revenue,
      projects: projects.sort((a, b) => {
        return b.usage.revenue.oneWeekTotal - a.usage.revenue.oneWeekTotal;
      }),
    },
    revalidate: 1,
  };
}

export default Home;
