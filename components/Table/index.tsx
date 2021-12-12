import { useTable, useSortBy } from "react-table";
import Box from "../Box";
import Section from "../Section";
import RevenueChange from "../RevenueChange";
import LineGraph from "../LineGraph";
import {
  Tooltip,
  TooltipTrigger,
  TooltipArrow,
  TooltipContent,
} from "../Tooltip";
import { defaultTheme, styled } from "../../stitches.config";
import Link from "next/link";
import {
  InfoCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import registry from "../../registry.json";

const Table = ({ columns, data, ...props }) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        initialState: {
          sortBy: [
            {
              id: "usage.revenue.thirtyDayTotal",
              desc: true,
            },
          ],
          hiddenColumns: [
            "revenue",
            "image",
            "symbol",
            "usage",
            "slug",
            "untracked",
          ],
        },
      },
      useSortBy
    );

  // We don't want to render all 2000 rows for this example, so cap
  // it at 20 for this use case
  const firstPageRows = rows.slice(0, 20);

  return (
    <Section {...props}>
      <Box
        css={{
          width: "100%",
          backgroundColor: "$table",
          display: "table",
          tableLayout: "fixed",
          borderSpacing: "0",
          borderCollapse: "collapse",
          minWidth: "920px",
          "@bp1": {
            minWidth: "1260px",
          },
          ".sticky": {
            position: "sticky",
            left: "0",
            top: "0",
            zIndex: 10000,
          },
        }}
        {...getTableProps()}
      >
        <Box css={{ display: "table-header-group" }}>
          {headerGroups.map((headerGroup, i) => (
            <Box
              css={{ display: "table-row" }}
              key={i}
              {...headerGroup.getHeaderGroupProps()}
            >
              {headerGroup.headers.map((column, i) => (
                <Box
                  key={i}
                  className={column?.className}
                  css={{
                    backgroundColor: "$loContrast",
                    width: i === 0 ? "90px" : i === 1 ? "150px" : "auto",
                    verticalAlign: "middle",
                    display: column.hideOnMobile ? "none" : "table-cell",
                    "@bp1": {
                      display: "table-cell",
                      width: i === 0 ? "90px" : i === 1 ? "230px" : "auto",
                      position: "relative !important",
                    },
                  }}
                  {...column.getHeaderProps(
                    column.getSortByToggleProps({ title: undefined })
                  )}
                >
                  <Box
                    css={{
                      display: "flex",
                      alignItems: "center",
                      pt: "24px",
                      pb: "$3",
                      px: i === 1 ? "$3" : "$4",
                      "@bp1": {
                        px: "$4",
                      },
                    }}
                  >
                    <Box css={{ fontSize: 12, fontWeight: 600 }}>
                      {column.render("Header")}
                    </Box>
                    {/* Add a sort direction indicator */}
                    <Box css={{ minWidth: 20 }}>
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <ChevronDownIcon />
                        ) : (
                          <ChevronUpIcon />
                        )
                      ) : (
                        ""
                      )}
                    </Box>
                    {column.tooltip && (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger>
                          <InfoCircledIcon />
                        </TooltipTrigger>
                        <TooltipContent>
                          <TooltipArrow />
                          {column.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
        <Box css={{ display: "table-row-group" }} {...getTableBodyProps()}>
          {firstPageRows.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <Link key={rowIndex} href={`/${row.values.slug}`} passHref>
                <Box
                  as="a"
                  css={{
                    display: "table-row",
                    color: "$hiContrast",
                    textDecoration: "none",
                    verticalAlign: "inherit",
                  }}
                  key={rowIndex}
                  {...row.getRowProps()}
                >
                  {row.cells.map((cell, i) => {
                    return (
                      <Box
                        className={cell.column?.className}
                        css={{
                          backgroundColor: "$loContrast",
                          px: i === 1 ? "$3" : "$4",
                          py: 20,
                          fontSize: "$2",
                          borderTop: rowIndex ? "1px solid" : 0,
                          borderColor: "$border",
                          verticalAlign: "middle",
                          width: "auto",
                          borderTopStyle: cell.row.values.untracked
                            ? "dashed"
                            : "solid",
                          display: cell.column.hideOnMobile
                            ? "none"
                            : "table-cell",
                          "@bp1": {
                            px: "$4",
                            display: "table-cell",
                            position: "relative !important",
                          },
                        }}
                        key={i}
                        {...cell.getCellProps()}
                      >
                        {renderSwitch(cell)}
                      </Box>
                    );
                  })}
                </Box>
              </Link>
            );
          })}
        </Box>
      </Box>
    </Section>
  );
};

const StyledImage = styled("img", {
  mr: "$3",
});

const poktDisclaimer = (
  <>
    <Box css={{ mb: "$2" }}>
      Pocket has a unique payment mechanism. Developers stake POKT upfront to
      lock in a guaranteed amount of bandwidth and pay through dilution as the
      protocol mints new POKT and rewards node operators based directly on the
      amount of usage of the network.
    </Box>
    <Box>
      The Web3 Index tracks developers&apos; dilutionary payment activity, but
      does not count it towards fees to avoid confusing apples with oranges
      (implicit vs direct costs). The Pocket DAO is planning a shift from
      developers paying via dilution, to developers paying via the burning of
      their stake in proportion to their usage. Once the DAO makes this change,
      burned staked tokens will count towards fees on the index.
    </Box>
  </>
);

function renderSwitch(cell) {
  const paymentType =
    registry[cell.row.values.name.toLowerCase()]?.paymentType === "dilution"
      ? "dilution"
      : "revenue";

  switch (cell.column.id) {
    case "usage.revenue.oneWeekTotal": {
      return `$${Math.round(
        cell.row.values.usage.revenue.oneWeekTotal
      ).toLocaleString()}`;
    }
    case "usage.revenue.thirtyDayTotal": {
      if (cell.row.values.untracked) return "--";
      return paymentType === "dilution" ? (
        <Box>
          <Box css={{ mb: "$2" }}>$0.00</Box>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Box css={{ display: "flex", alignItems: "center" }}>
                <Box css={{ fontSize: "$1", color: "$gray500" }}>
                  ($
                  {Math.round(
                    cell.row.values.usage.dilution.thirtyDayTotal
                  ).toLocaleString()}{" "}
                  diluted)
                </Box>{" "}
                <Box
                  as={InfoCircledIcon}
                  css={{ ml: "$2", color: "$gray500" }}
                />
              </Box>
            </TooltipTrigger>
            <TooltipContent>
              <TooltipArrow />
              {poktDisclaimer}
            </TooltipContent>
          </Tooltip>
        </Box>
      ) : (
        <Box>
          $
          {Math.round(
            cell.row.values.usage.revenue.thirtyDayTotal
          ).toLocaleString()}
        </Box>
      );
    }
    case "usage.revenue.ninetyDayTotal": {
      if (cell.row.values.untracked) return "--";
      return paymentType === "dilution" ? (
        <Box>
          <Box css={{ mb: "$2" }}>$0.00</Box>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Box css={{ display: "flex", alignItems: "center" }}>
                <Box css={{ fontSize: "$1", color: "$gray500" }}>
                  ($
                  {Math.round(
                    cell.row.values.usage.dilution.ninetyDayTotal
                  ).toLocaleString()}{" "}
                  diluted)
                </Box>{" "}
                <Box
                  as={InfoCircledIcon}
                  css={{ ml: "$2", color: "$gray500" }}
                />
              </Box>
            </TooltipTrigger>
            <TooltipContent>
              <TooltipArrow />
              {poktDisclaimer}
            </TooltipContent>
          </Tooltip>
        </Box>
      ) : (
        <Box>
          $
          {Math.round(
            cell.row.values.usage.revenue.ninetyDayTotal
          ).toLocaleString()}
        </Box>
      );
    }
    case "totalRevenue": {
      return `$${Math.round(
        cell.row.values.usage.revenue.now
      ).toLocaleString()}`;
    }
    case "usage.revenue.oneWeekPercentChange": {
      return (
        <Box css={{ display: "flex" }}>
          <RevenueChange
            percentChange={Intl.NumberFormat("en-US", {
              maximumFractionDigits: 2,
            }).format(cell.row.values.usage.revenue.oneWeekPercentChange)}
            css={{ ml: "$2" }}
          />
        </Box>
      );
    }
    case "usage.revenue.thirtyDayPercentChange": {
      if (cell.row.values.untracked) return "--";
      const color =
        cell.row.values.usage[paymentType].thirtyDayPercentChange > 0
          ? defaultTheme.colors.green
          : defaultTheme.colors.red;

      // Get last two periods excluding current day
      const lastTwoPeriods = cell.row.values.usage.days.slice(-61).slice(0, 60);

      return (
        <Box css={{ display: "flex" }}>
          <LineGraph color={color} days={lastTwoPeriods} />
          <RevenueChange
            percentChange={Intl.NumberFormat("en-US", {
              maximumFractionDigits: 2,
            }).format(
              cell.row.values.usage[paymentType].thirtyDayPercentChange
            )}
            css={{ ml: "$2" }}
          />
        </Box>
      );
    }
    case "lastThirtyDays": {
      if (cell.row.values.untracked) return "--";
      const color =
        cell.row.values.usage[paymentType].thirtyDayPercentChange > 0
          ? defaultTheme.colors.green
          : defaultTheme.colors.red;

      // Get last 60 days excluding current day
      const lastSixtyDays = cell.row.values.usage.days.slice(-61).slice(0, 60);

      return (
        <Box css={{ display: "flex" }}>
          <LineGraph color={color} days={lastSixtyDays} />
        </Box>
      );
    }
    case "name":
      return (
        <Box
          css={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <StyledImage width={32} height={32} src={cell.row.values.image} />
          {cell.render("Cell")}
          <Box
            css={{
              ml: "$2",
              color: "$gray500",
              display: "none",
              "@bp1": {
                display: "block",
              },
            }}
          >
            ({cell.row.values.symbol})
          </Box>
        </Box>
      );
    default:
      return cell.render("Cell");
  }
}

export default Table;
