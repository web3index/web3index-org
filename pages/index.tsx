import Layout from "../layouts";
import { useMemo } from "react";
import Box from "../components/Box";
import Table from "../components/Table";
import Section from "../components/Section";
import Container from "../components/Container";
import Header from "../components/Header";
import Faq from "../components/Faq";
import CallToAction from "../components/CallToAction";
import { getProjects, trophies } from "../lib/utils";
import matter from "gray-matter";
import path from "path";
import fs from "fs";

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
    <Layout data={{ projects }}>
      <Section>
        <Container size="4">
          <Header css={{ mb: "$4" }} revenue={revenue} />
          <Table
            columns={columns}
            data={projects}
            css={{ mb: "$5", overflow: "scroll" }}
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
  const faq = [];
  const { projects, revenue } = await getProjects();
  const faqDirectory = path.join(process.cwd(), "faq");
  const fileNames = fs.readdirSync(faqDirectory);

  for (const fileName of fileNames) {
    const source = fs.readFileSync(
      path.join(process.cwd(), `./faq/${fileName}`)
    );
    const { content, data } = matter(source);
    faq.push({ content, data });
  }

  return {
    props: {
      faq,
      revenue,
      projects: projects.sort((a, b) => {
        return b.usage.revenue.oneWeekTotal - a.usage.revenue.oneWeekTotal;
      }),
    },
    revalidate: 1,
  };
}

export default Home;
