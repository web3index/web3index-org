import Box from "../Box";
import RevenueChange from "../RevenueChange";

const Revenue = ({ revenue = 0, percentChange = 0 }) => {
  return (
    <Box
      css={{
        fontSize: "$1",
        border: "1px solid",
        borderColor: "$border",
        borderRadius: "$round",
        py: "$3",
        px: "$4",
        width: "auto",
        display: "flex",
        alignItems: "center",
        flex: "1 0 auto",
      }}
    >
      <Box css={{ color: "$gray600", mr: "$2" }}>Revenue (7 day)</Box>
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
