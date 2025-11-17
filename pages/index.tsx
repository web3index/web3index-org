import Layout from "../layouts";
import Listing from "../components/Listing";
import Section from "../components/Section";
import Container from "../components/Container";
import Header from "../components/Header";
import Faq from "../components/Faq";
import CallToAction from "../components/CallToAction";
import { getFaq } from "../lib/mdx";
import { getProjects } from "./api/projects";

const Home = ({ faq, revenue, projects }) => {
  return (
    <Layout data={{ projects }}>
      <Section>
        <Container size="4">
          <Header css={{ mb: "$4" }} revenue={revenue} />
          <Listing
            data={projects}
            css={{
              border: "1px solid",
              borderColor: "$border",
              borderRadius: "$4",
              pt: "$3",
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
  const sortedProjects = projects.sort((a, b) => {
    return b.usage.revenue.thirtyDayTotal - a.usage.revenue.thirtyDayTotal;
  });
  return {
    props: {
      faq,
      revenue,
      projects: sortedProjects,
    },
    revalidate: 30,
  };
}

export default Home;
