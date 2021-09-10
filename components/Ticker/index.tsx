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
          <Project key={0} project={projects[0]} />
          <Project key={1} project={projects[1]} />
          <Project key={2} project={projects[2]} />
          <Project key={3} project={projects[3]} />
          <Project key={3} project={projects[4]} />
          <Project key={4} project={projects[0]} />
          <Project key={5} project={projects[1]} />
          <Project key={6} project={projects[2]} />
          <Project key={7} project={projects[3]} />
          <Project key={3} project={projects[4]} />
          <Project key={8} project={projects[0]} />
          <Project key={9} project={projects[1]} />
          <Project key={10} project={projects[2]} />
          <Project key={11} project={projects[3]} />
          <Project key={3} project={projects[4]} />
          <Project key={12} project={projects[0]} />
          <Project key={13} project={projects[1]} />
          <Project key={14} project={projects[2]} />
          <Project key={15} project={projects[3]} />
          <Project key={3} project={projects[4]} />
          <Project key={16} project={projects[0]} />
          <Project key={17} project={projects[1]} />
          {/* {projects.map((project, i) => (
          <Project key={i} project={projects} />
        ))} */}
        </Marquee>
      )}
    </Box>
  );
};

export default Ticker;
