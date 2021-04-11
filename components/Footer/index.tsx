import Box from "../Box";
import { TwitterLogoIcon, GitHubLogoIcon } from "@modulz/radix-icons";
import ThemeToggle from "../ThemeToggle";

const Footer = ({ ...props }) => {
  return (
    <Box
      css={{
        borderTop: "1px solid",
        borderColor: "$border",
        py: "$4",
        display: "grid",
        gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
        margin: "0 auto",
        fontSize: "$1",
        "@bp2": {
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        },
      }}
      {...props}
    >
      <Box
        css={{
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: "$3",
          order: 1,
          "@bp2": {
            mb: 0,
            justifyContent: "flex-start",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        <Box
          as="a"
          href="https://twitter.com/web3index"
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            color: "initial",
            display: "flex",
            alignItems: "center",
            px: "$2",
            fontWeight: 500,
            order: 3,
            "@bp2": {
              order: 2,
            },
          }}
        >
          <TwitterLogoIcon />
          <Box css={{ ml: "$2" }}>Twitter</Box>
        </Box>
        <Box
          as="a"
          href="https://github.com/web3index"
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            color: "initial",
            display: "flex",
            alignItems: "center",
            px: "$2",
            fontWeight: 500,
          }}
        >
          <GitHubLogoIcon />
          <Box css={{ ml: "$2" }}>Github</Box>
        </Box>
        <Box
          as="a"
          href="https://discord.com/web3index"
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            color: "initial",
            display: "flex",
            alignItems: "center",
            px: "$2",
            fontWeight: 500,
          }}
        >
          <TwitterLogoIcon />
          <Box css={{ ml: "$2" }}>Discord</Box>
        </Box>
      </Box>
      <Box
        css={{
          textAlign: "center",
          order: 3,
          "@bp2": {
            order: 2,
          },
        }}
      >
        The Web3 Index™. All rights reserved
      </Box>
      <Box
        css={{
          display: "flex",
          justifyContent: "flex-end",
          order: 2,
          "@bp2": {
            order: 3,
          },
        }}
      >
        <ThemeToggle />
      </Box>
    </Box>
  );
};

export default Footer;
