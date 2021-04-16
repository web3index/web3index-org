import Box from "../Box";
import Button from "../Button";
import Link from "next/link";
import Container from "../Container";
import Section from "../Section";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ListBulletIcon,
} from "@modulz/radix-icons";
import { styled } from "../../stitches.config";

const StyledButton = styled(Button, {
  border: "1px solid",
  borderColor: "$border",
  backgroundColor: "$loContrast",
  color: "$hiContrast",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const ProjectHeader = ({ next, prev, color, ...props }) => {
  return (
    <Box
      css={{
        background: color,
        height: 150,
        width: "100%",
        display: "flex",
        alignItems: "flex-end",
      }}
      {...props}
    >
      <Section css={{ width: "100%", top: "24px", position: "relative" }}>
        <Container size="4">
          <Box
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link href="/" passHref>
              <StyledButton as="a">
                <ListBulletIcon /> <Box css={{ ml: "$2" }}>Index</Box>
              </StyledButton>
            </Link>
            <Box css={{ display: "flex", alignItems: "center" }}>
              <Link href={`/project/${prev}`} passHref>
                <StyledButton
                  css={{
                    padding: 0,
                    width: 49,
                    height: 49,
                    mr: "$2",
                    "@bp1": {
                      py: "$3",
                      px: "$4",
                      width: "initial",
                      height: "initial",
                    },
                  }}
                >
                  <ArrowLeftIcon />{" "}
                  <Box
                    css={{
                      ml: "$2",
                      display: "none",
                      "@bp1": {
                        display: "flex",
                      },
                    }}
                  >
                    Previous
                  </Box>
                </StyledButton>
              </Link>
              <Link href={`/project/${next}`} passHref>
                <StyledButton
                  css={{
                    padding: 0,
                    width: 49,
                    height: 49,
                    "@bp1": {
                      py: "$3",
                      px: "$4",
                      width: "initial",
                      height: "initial",
                    },
                  }}
                >
                  <Box
                    css={{
                      mr: "$2",
                      display: "none",
                      "@bp1": {
                        display: "flex",
                      },
                    }}
                  >
                    Next
                  </Box>
                  <ArrowRightIcon />
                </StyledButton>
              </Link>
            </Box>
          </Box>
        </Container>
      </Section>
    </Box>
  );
};

export default ProjectHeader;
