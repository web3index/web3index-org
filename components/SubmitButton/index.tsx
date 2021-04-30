import Button from "../Button";
import { PlusCircledIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";

const StyledIcon = styled(PlusCircledIcon, {
  ml: "$2",
});

const SubmitButton = ({ css = {}, ...props }) => {
  return (
    <Button
      css={{ mx: "auto", display: "flex", alignItems: "center", ...css }}
      {...props}
    >
      Submit a Project{" "}
      <StyledIcon css={{ width: 15, height: 15, color: "$lowContrast" }} />
    </Button>
  );
};

export default SubmitButton;
