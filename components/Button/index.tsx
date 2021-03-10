import { styled } from "../../stitches.config";

const StyledButton = styled("button", {
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
});

const Button = ({ children, ...props }) => (
  <StyledButton {...props}>{children}</StyledButton>
);

export default Button;
