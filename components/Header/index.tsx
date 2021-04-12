import Box from "../Box";
import Revenue from "./Revenue";
import SubmitButton from "../SubmitButton";
import { defaultTheme } from "../../stitches.config";

const Header = ({ revenue, ...props }) => {
  const color =
    revenue.oneWeekPercentChange > 0
      ? defaultTheme.colors.green
      : defaultTheme.colors.red;

  return (
    <Box {...props}>
      <Box
        as="h1"
        css={{
          mt: "$4",
          mb: "$4",
          textAlign: "center",
          fontFamily: "$heading",
          fontSize: "12vw",
          fontWeight: 900,
          lineHeight: "64px",
          "@bp2": {
            mt: 0,
            lineHeight: "220px",
            letterSpacing: "-10px",
            mb: "-12px",
          },
          "@bp4": {
            fontSize: "180px",
          },
        }}
      >
        The Web3 Index
      </Box>
      <Box
        css={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          "@bp2": {
            flexDirection: "row",
          },
        }}
      >
        <Revenue
          percentChange={revenue.oneWeekPercentChange}
          revenue={revenue.oneWeekTotal}
        />
        <Box
          css={{
            width: "100%",
            height: "1px",
            backgroundColor: "$border",
            mx: "$4",
            display: "none",
            "@bp2": {
              display: "block",
            },
          }}
        />
        <SubmitButton
          css={{
            flex: "1 0 auto",
            backgroundColor: "$loContrast",
            color: "$hiContrast",
            border: "1px solid",
            borderColor: "$border",
            textDecoration: "none",
            width: "100%",
            justifyContent: "center",
            "@bp2": {
              width: "auto",
            },
          }}
          as="a"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/web3index/web3index-org/issues/new"
        />
      </Box>
    </Box>
  );
};

export default Header;
