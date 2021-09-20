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
      <Box
        as="h2"
        css={{
          fontSize: "$7",
          mb: "$3",
          fontFamily: "$heading",
          "@bp2": {
            fontSize: "$9",
          },
        }}
      >
        Help Grow the Index
      </Box>
      <Button
        as="a"
        href="https://github.com/web3index/web3index-org#project-integration-instructions"
        target="_blank"
        rel="noopener noreferrer"
        css={{
          textDecoration: "none",
          mx: "auto",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        Submit a Protocol{" "}
        <StyledIcon css={{ width: 15, height: 15, color: "$lowContrast" }} />
      </Button>
    </Box>
  );
};

export default CallToAction;
