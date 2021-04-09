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
          mt: 0,
          textAlign: "center",
          fontFamily: "$heading",
          fontSize: "12vw",
          fontWeight: 900,
          "@bp2": {
            lineHeight: "220px",
            letterSpacing: "-10px",
            mb: "-12px",
          },
        }}
      >
        The Web3 Index
      </Box>
      <Box
        css={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Revenue
          color={color}
          percentChange={revenue.oneWeekPercentChange}
          revenue={revenue.oneWeekTotal}
        />
        <Box
          css={{
            width: "100%",
            height: "1px",
            backgroundColor: "$border",
            mx: "$4",
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
