import Box from "../Box";
import Revenue from "./Revenue";
import SubmitButton from "../SubmitButton";
import { styled } from "../../stitches.config";

const StyledSubmitButton = styled(SubmitButton, {
  flex: "1 0 auto",
  backgroundColor: "$loContrast",
  color: "$hiContrast",
  border: "1px solid",
  borderColor: "$border",
});

const Header = ({ revenue, ...props }) => {
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
        <StyledSubmitButton />
      </Box>
    </Box>
  );
};

export default Header;
