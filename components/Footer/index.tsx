import Box from "../Box";
import { TwitterLogoIcon, GitHubLogoIcon } from "@modulz/radix-icons";
import ThemeToggle from "../ThemeToggle";
import Link from "next/link";
import { ReaderIcon } from "@modulz/radix-icons";

const DiscordIcon = ({ ...props }) => {
  return (
    <Box
      as="svg"
      viewBox="0 0 58 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M39.3 37.1099C40.76 38.9399 42.51 40.9999 42.51 40.9999C53.25 40.6599 57.38 33.6999 57.38 33.6999C57.22 23.9539 54.8252 14.3746 50.38 5.69993C46.449 2.67553 41.6845 0.930232 36.73 0.699932L36.05 1.46993C44.31 3.96993 48.15 7.56993 48.15 7.56993C43.6195 5.10513 38.655 3.53973 33.53 2.95993C30.2675 2.60633 26.9746 2.63993 23.72 3.05993C23.441 3.06933 23.1633 3.10273 22.89 3.15993C19.0899 3.58303 15.3788 4.59513 11.89 6.15993C10.05 6.99993 9.00002 7.54993 9.00002 7.54993C9.00002 7.54993 13 3.75993 21.78 1.25993L21.29 0.679932C16.3355 0.910232 11.571 2.65553 7.64001 5.67993C3.19481 14.3546 0.800015 23.9339 0.640015 33.6799C0.640015 33.6799 4.72001 40.6799 15.46 40.9799C15.46 40.9799 17.26 38.8199 18.72 36.9799C12.55 35.1599 10.22 31.3199 10.22 31.3199C10.22 31.3199 10.71 31.6599 11.58 32.1399C11.6346 32.1975 11.6989 32.2449 11.77 32.2799C11.92 32.3799 12.06 32.4199 12.21 32.5199C13.3549 33.1434 14.541 33.688 15.76 34.1499C18.073 35.0505 20.4628 35.74 22.9 36.2099C27.0578 36.9821 31.3222 36.9821 35.48 36.2099C37.8837 35.79 40.232 35.099 42.48 34.1499C44.4436 33.4192 46.3187 32.4699 48.07 31.3199C48.07 31.3199 45.67 35.3399 39.3 37.1099ZM21.3 30.4199C18.6 30.4199 16.38 27.9499 16.38 24.9299C16.297 24.2352 16.3621 23.5308 16.5712 22.8632C16.7803 22.1955 17.1285 21.5797 17.5929 21.0565C18.0573 20.5332 18.6274 20.1143 19.2656 19.8275C19.9037 19.5406 20.5954 19.3923 21.295 19.3923C21.9947 19.3923 22.6863 19.5406 23.3245 19.8275C23.9626 20.1143 24.5327 20.5332 24.9971 21.0565C25.4615 21.5797 25.8098 22.1955 26.0188 22.8632C26.2279 23.5308 26.2931 24.2352 26.21 24.9299C26.2492 25.6152 26.1525 26.3014 25.9256 26.9491C25.6988 27.5969 25.3462 28.1934 24.8881 28.7045C24.43 29.2156 23.8754 29.6311 23.2562 29.9272C22.637 30.2233 21.9654 30.3942 21.28 30.4299L21.3 30.4199ZM38.89 30.4199C36.18 30.4299 34 27.9999 34 24.9399C34.1043 23.9896 34.4816 23.0899 35.0862 22.3493C35.6908 21.6088 36.4969 21.0592 37.4072 20.7669C38.3174 20.4747 39.2928 20.4522 40.2155 20.7023C41.1382 20.9525 41.9688 21.4644 42.6068 22.1764C43.2448 22.8883 43.663 23.7698 43.8109 24.7143C43.9588 25.6588 43.83 26.6259 43.4401 27.4988C43.0502 28.3717 42.4158 29.113 41.6137 29.6331C40.8116 30.1533 39.876 30.43 38.92 30.4299L38.89 30.4199Z"
        fill="currentColor"
      />
    </Box>
  );
};

const Footer = ({ logo = true, border = true, ...props }) => {
  return (
    <Box
      css={{
        borderTop: "1px solid",
        borderColor: border ? "$border" : "transparent",
        py: "$4",
        display: "grid",
        gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
        margin: "0 auto",
        fontSize: "$1",
        px: "$4",
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
        <Link href="/blog" passHref>
          <Box
            as="a"
            css={{
              textDecoration: "none",
              color: "$hiContrast",
              display: "flex",
              alignItems: "center",
              pr: "$3",
              fontWeight: 500,
            }}
          >
            <ReaderIcon />
            <Box css={{ ml: "$2" }}>Blog</Box>
          </Box>
        </Link>
        <Box
          as="a"
          href="https://twitter.com/web3index"
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            color: "$hiContrast",
            display: "flex",
            alignItems: "center",
            px: "$2",
            fontWeight: 500,
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
            color: "$hiContrast",
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
          href="https://discord.gg/XRBdtMeERw"
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            color: "$hiContrast",
            display: "flex",
            alignItems: "center",
            px: "$2",
            fontWeight: 500,
          }}
        >
          <DiscordIcon css={{ width: 16, height: 16, color: "$hiContrast" }} />
          <Box css={{ ml: "$2" }}>Discord</Box>
        </Box>
      </Box>
      <Box
        css={{
          opacity: logo ? 1 : 0,
          textAlign: "center",
          order: 3,
          fontFamily: "$heading",
          "@bp2": {
            order: 2,
          },
        }}
      >
        The Web3 Index
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
