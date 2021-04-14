import { styled } from "../../stitches.config";

export const StyledButton = styled("button", {
  // Reset
  boxSizing: "border-box",
  border: 0,
  borderRadius: "$round",
  fontWeight: 700,
  fontSize: "$1",
  backgroundColor: "$hiContrast",
  color: "$loContrast",
  py: "$3",
  px: "$4",
  cursor: "pointer",
  outline: "none",
  // "&:focus": {
  //   $$shadowColor: "$colors$loContrast",
  //   boxShadow: "0 0 0 4px $$shadowColor",
  // },
});

export default StyledButton;
