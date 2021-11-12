import Box from "../Box";
import RevenueChange from "../RevenueChange";
import Marquee from "react-fast-marquee";
import { useTheme } from "next-themes";
import LineGraph from "../LineGraph";
import { defaultTheme } from "../../stitches.config";

const Project = ({ project }) => {
  const color =
    project.usage.revenue.thirtyDayPercentChange > 0
      ? defaultTheme.colors.green
      : defaultTheme.colors.red;

  // Get last two weeks excluding current day
  const lastTwoPeriods = project.usage.days.slice(-61).slice(0, 60);

  return (
    <Box
      css={{
        display: "flex",
        width: 250,
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        px: "20px",
        "&:after": {
          content: '""',
          position: "absolute",
          right: 0,
          width: "1px",
          height: 26,
          backgroundColor: "$gray100",
        },
      }}
    >
      <Box css={{ flex: "1 0 auto" }}>
        <Box css={{ color: "$hiContrast", mb: "$1" }}>{project.symbol}</Box>
        <Box css={{ color: "$gray400" }}>{project.name}</Box>
      </Box>
      <Box css={{ display: "flex", alignItems: "center" }}>
        <LineGraph color={color} days={lastTwoPeriods} />
        <RevenueChange
          percentChange={Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2,
          }).format(project.usage.revenue.thirtyDayPercentChange)}
          css={{ ml: "$2" }}
        />
      </Box>
    </Box>
  );
};

const Ticker = ({ projects }) => {
  const { resolvedTheme } = useTheme();

  return (
    <Box
      css={{
        borderBottom: "1px solid",
        borderColor: "$border",
        display: "flex",
        alignItems: "center",
        py: 10,
        fontSize: "$1",
        height: 55,
      }}
    >
      {projects?.length && (
        <Marquee
          gradientColor={resolvedTheme === "dark" ? [0, 0, 0] : [255, 255, 255]}
        >
          {projects.map(
            (project, i) =>
              !project.delisted && <Project key={i} project={project} />
          )}
        </Marquee>
      )}
    </Box>
  );
};

export default Ticker;
