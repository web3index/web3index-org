import Box from "../Box";
import { defaultTheme } from "../../stitches.config";

const RevenueChange = ({ percentChange, css = {}, ...props }) => {
  const color =
    parseFloat(percentChange) >= 0
      ? defaultTheme.colors.green
      : defaultTheme.colors.red;

  // console.log(percentChange);
  return (
    <Box css={{ display: "flex", alignItems: "center", ...css }} {...props}>
      {parseFloat(percentChange) !== 0 && (
        <Box
          css={{
            fontSize: "$1",
            width: "0",
            height: "0",
            borderStyle: "solid",
            borderWidth: "0 4px 6px 4px",
            borderColor: `transparent transparent ${color} transparent`,
            mr: "$1",
            transform:
              parseFloat(percentChange) > 0 ? "rotate(0)" : "rotate(180deg)",
          }}
        />
      )}
      <Box css={{ color }}>{percentChange}%</Box>
    </Box>
  );
};

export default RevenueChange;
