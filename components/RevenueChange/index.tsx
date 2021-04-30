import Box from "../Box";
import { defaultTheme } from "../../stitches.config";

const RevenueChange = ({ percentChange, css = {}, ...props }) => {
  const color =
    percentChange > 0 ? defaultTheme.colors.green : defaultTheme.colors.red;

  return (
    <Box css={{ display: "flex", alignItems: "center", ...css }} {...props}>
      <Box
        css={{
          fontSize: "$1",
          width: "0",
          height: "0",
          borderStyle: "solid",
          borderWidth: "0 4px 6px 4px",
          borderColor: `transparent transparent ${color} transparent`,
          mr: "$1",
          transform: percentChange > 0 ? "rotate(0)" : "rotate(180deg)",
        }}
      />
      <Box css={{ color }}>{percentChange}%</Box>
    </Box>
  );
};

export default RevenueChange;
