import Box from "../Box";
import Button from "../Button";
import { PlusCircledIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";

const StyledIcon = styled(PlusCircledIcon, {
  ml: "$2",
});

const CallToAction = ({ ...props }) => {
  return (
    <Box {...props}>
      <Box as="h2" css={{ fontSize: "$9", mb: "$3", fontFamily: "$heading" }}>
        Help Grow the Index
      </Box>
      <Button
        as="a"
        href="https://github.com/web3index"
        target="_blank"
        rel="noopener noreferrer"
        css={{
          textDecoration: "none",
          mx: "auto",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        Submit a Project{" "}
        <StyledIcon css={{ width: 15, height: 15, color: "$lowContrast" }} />
      </Button>
    </Box>
  );
};

export default CallToAction;
