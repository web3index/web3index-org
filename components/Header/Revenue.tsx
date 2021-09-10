import Box from "../Box";
import RevenueChange from "../RevenueChange";

const Revenue = ({ revenue = 0, percentChange = 0 }) => {
  return (
    <Box
      css={{
        border: "1px solid",
        borderColor: "$border",
        borderRadius: "$round",
        py: "$3",
        px: "$4",
        width: "100%",
        display: "flex",
        alignItems: "center",
        flex: "1 0 auto",
        mb: "$3",
        fontSize: "$1",
        justifyContent: "center",
        "@bp2": {
          mb: 0,
          width: "auto",
        },
      }}
    >
      <Box css={{ color: "$gray600", mr: "$2" }}>Revenue (30d)</Box>
      <Box css={{ fontWeight: 600, mr: "$4" }}>
        $
        {Intl.NumberFormat("en-US", {
          maximumFractionDigits: 2,
        }).format(revenue)}
      </Box>
      <RevenueChange
        percentChange={Intl.NumberFormat("en-US", {
          maximumFractionDigits: 2,
        }).format(percentChange)}
      />
    </Box>
  );
};

export default Revenue;
