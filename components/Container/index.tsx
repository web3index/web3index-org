import { styled } from "../../stitches.config";

const Container = styled("div", {
  // Reset
  boxSizing: "border-box",
  flexShrink: 0,

  // Custom
  mx: "auto",
  px: "$3",
  "@bp1": {
    px: "$4",
  },

  variants: {
    size: {
      "1": {
        maxWidth: "430px",
      },
      "2": {
        maxWidth: "960px",
      },
      "3": {
        maxWidth: "1145px",
      },
      "4": {
        maxWidth: "1400px",
      },
      "5": {
        maxWidth: "none",
      },
    },
  },
});

export default Container;
