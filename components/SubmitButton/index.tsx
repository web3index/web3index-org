import Button from "../Button";
import { PlusCircledIcon } from "@modulz/radix-icons";
import { styled } from "../../stitches.config";
import { filterCssFromProps } from "../../lib/utils";

const StyledIcon = styled(PlusCircledIcon, {
  ml: "$2",
});

const SubmitButton = ({ ...props }) => {
  const p = filterCssFromProps(props);
  return (
    <Button
      css={{ mx: "auto", display: "flex", alignItems: "center", ...props?.css }}
      {...p}
    >
      Submit a Project{" "}
      <StyledIcon css={{ width: 15, height: 15, color: "$lowContrast" }} />
    </Button>
  );
};

export default SubmitButton;
