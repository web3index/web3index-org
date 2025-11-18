import Box from "../components/Box";
import Section from "../components/Section";
import Ticker from "../components/Ticker";
import Footer from "../components/Footer";

const Index = ({ data = null, children }) => {
  return (
    <Box
      css={{
        height: "100vh",
        color: "$hiContrast",
        background: "$loContrast",
        "::selection": {
          background: "$highlighter",
        },
        "::-moz-selection": {
          background: "$highlighter",
        },
      }}>
      {data?.projects && <Ticker projects={data.projects} />}
      {children}
      <Section>
        <Footer />
      </Section>
    </Box>
  );
};

export default Index;
