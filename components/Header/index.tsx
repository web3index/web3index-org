import { ComponentProps } from "react";
import Box from "../Box";
import Revenue from "./Revenue";
import SubmitButton from "../SubmitButton";
import Button from "../Button";

type RevenueSummary = {
  thirtyDayTotal: number;
  thirtyDayPercentChange: number;
};
type HeaderProps = ComponentProps<typeof Box> & {
  revenue: RevenueSummary;
};

const Header = ({ revenue, ...props }: HeaderProps) => {
  return (
    <Box {...props}>
      <Box
        as="h1"
        css={{
          mt: "$4",
          mb: "$4",
          textAlign: "center",
          fontFamily: "$heading",
          fontSize: "42px",
          fontWeight: 900,
          lineHeight: "44px",
          "@bp1": {
            fontSize: "56px",
            lineHeight: "68px",
          },
          "@bp2": {
            fontSize: "12vw",
            mt: 0,
            lineHeight: "220px",
            letterSpacing: "-10px",
            mb: "-12px",
          },
          "@bp4": {
            fontSize: "180px",
          },
        }}>
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
        }}>
        <Revenue
          percentChange={revenue.thirtyDayPercentChange}
          revenue={revenue.thirtyDayTotal}
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
        <Button
          as="a"
          href="https://discord.gg/GsYEGuns9y"
          target="_blank"
          rel="noreferrer"
          css={{
            flex: "1 0 auto",
            textAlign: "center",
            backgroundColor: "$loContrast",
            color: "$hiContrast",
            border: "1px solid",
            borderColor: "$border",
            textDecoration: "none",
            justifyContent: "center",
            width: "100%",
            mb: "$3",
            "@bp2": {
              mr: "$3",
              mb: 0,
              width: "auto",
            },
          }}>
          Chat on Discord
        </Button>

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
          href="https://github.com/web3index/web3index-org#project-integration-instructions"
        />
      </Box>
    </Box>
  );
};

export default Header;
