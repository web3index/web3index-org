import Layout from "../layouts";
import { useMemo } from "react";
import Table from "../components/Table";
import Section from "../components/Section";
import Container from "../components/Container";
import Header from "../components/Header";
import Faq from "../components/Faq";
import CallToAction from "../components/CallToAction";
import { getProjects } from "../lib/utils";

const Home = ({ revenue, projects }) => {
  const columns = useMemo(
    () => [
      {
        Header: "#",
        accessor: "rank",
        Cell: ({ row }) => +row.id + 1,
      },
      {
        Header: "Name",
        accessor: "name",
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
        Header: "Revenue (7 day)",
        accessor: "revenue",
      },
      {
        Header: "Usage",
        accessor: "usage",
      },
      {
        Header: "7 day change",
        accessor: "percentChange",
      },
    ],
    []
  );

  return (
    <Layout key={0} data={{ projects }}>
      <Section>
        <Container size="4">
          <Header css={{ mb: "$4" }} revenue={revenue} />
          <Table
            columns={columns}
            data={projects}
            css={{ mb: "$5", overflow: "scroll" }}
          />
          <Faq css={{ mb: "$6" }} />
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
