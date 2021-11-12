import Box from "../Box";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { styled } from "../../stitches.config";

const StyledExclamationTriangleIcon = styled(ExclamationTriangleIcon, {
  color: "#ffa726",
  mr: "$3",
  minWidth: 20,
  minHeight: 20,
});

const Alert = ({ children }) => {
  return (
    <Box
      css={{
        fontSize: "$2",
        color: "rgb(255, 226, 183)",
        display: "flex",
        alignItems: "center",
        backgroundColor: "#191207",
        px: "$3",
        py: "$3",
        borderRadius: "10px",
      }}
    >
      <StyledExclamationTriangleIcon />
      <Box>{children}</Box>
    </Box>
  );
};

export default Alert;
