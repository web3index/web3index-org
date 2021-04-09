import Box from "../components/Box";
import Section from "../components/Section";
import Container from "../components/Container";
import Ticker from "../components/Ticker";
import Footer from "../components/Footer";

const Index = ({ data, children }) => {
  const { projects } = data;

  return (
    <Box
      css={{
        height: "100vh",
        color: "$hiContrast",
        background: "$loContrast",
      }}
    >
      <Ticker projects={projects} />
      {children}
      <Section>
        <Container size="4">
          <Footer />
        </Container>
      </Section>
    </Box>
  );
};

export default Index;
