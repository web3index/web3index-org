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
});

const ProjectHeader = ({ next, prev, first, color, ...props }) => {
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
              {prev && (
                <Link href={`/project/${prev}`} passHref>
                  <StyledButton css={{ mr: "$2" }}>
                    <ArrowLeftIcon /> <Box css={{ ml: "$2" }}>Previous</Box>
                  </StyledButton>
                </Link>
              )}
              <Link
                href={!next ? `/project/${first}` : `/project/${next}`}
                passHref
              >
                <StyledButton>
                  <Box css={{ mr: "$2" }}>Next</Box>
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
