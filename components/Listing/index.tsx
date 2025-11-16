import { useMemo } from "react";
import { useTable, useSortBy, useGroupBy } from "react-table";
import Box from "../Box";
import Section from "../Section";
import RevenueChange from "../RevenueChange";
import LineGraph from "../LineGraph";
import { Table, Td, Tr, Th, Tbody, Thead } from "../Table";
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
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import registry from "../../registry.json";

const StyledImage = styled("img", {
  mr: "$3",
});
const StyledLink = styled(Link, {
  display: "block",
  color: "$hiContrast",
  textDecoration: "none",
  verticalAlign: "inherit",
});
const WarningDot = styled("span", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 16,
  height: 16,
  borderRadius: "50%",
  backgroundColor: "rgba(245, 165, 36, 0.2)",
  color: "#f5a524",
  ml: "$2",
});
const WarningPlaceholder = () => {
  return (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        color: "$gray500",
        fontSize: "11px",
      }}>
      --
    </Box>
  );
};

const Listing = ({ data, ...props }) => {
  const columns = useMemo(
    () => [
      {
        Header: "#",
        columns: [
          {
            Header: "",
            id: "rank",
            width: "90px",
            accessor: (_row: any, i: number) => i + 1,
            className: "sticky",
            hideOnMobile: true,
          },
        ],
      },
      {
        Header: "Network",
        columns: [
          {
            accessor: "name",
            className: "sticky",
            Cell: ({ row }) => {
              const warning = row.original?.usage?.warning;
              return (
                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                  }}>
                  <StyledImage width={32} height={32} src={row.values.image} />
                  {row.values.name}
                  <Box
                    css={{
                      ml: "$2",
                      color: "$gray500",
                      display: "none",
                      "@bp1": {
                        display: "block",
                      },
                    }}>
                    ({row.values.symbol})
                  </Box>
                  {warning ? (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <WarningDot>
                          <ExclamationTriangleIcon width={13} height={13} />
                        </WarningDot>
                      </TooltipTrigger>
                      <TooltipContent>
                        {warning}
                        <TooltipArrow />
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </Box>
              );
            },
          },
        ],
      },
      {
        Header: "Symbol",
        accessor: "symbol",
      },
      {
        Header: "Image",
        accessor: "image",
      },
      {
        Header: "Slug",
        accessor: "slug",
      },
      {
        Header: "Chain",
        width: 140,
        columns: [
          {
            accessor: "blockchain",
            hideOnMobile: true,
          },
        ],
      },
      {
        Header: "30d Fees",
        columns: [
          {
            minWidth: 50,
            width: 50,
            css: { fontSize: "11px", color: "$gray400" },
            accessor: "usage.revenue.thirtyDayTotal",
            Cell: ({ row }) => {
              const warning = row.original?.usage?.warning;
              if (warning) {
                return <WarningPlaceholder />;
              }
              if (!row.values.usage.revenue.thirtyDayTotal) {
                return <Box>$0</Box>;
              }
              return (
                <Box>
                  $
                  {Math.round(
                    row.values.usage.revenue.thirtyDayTotal,
                  ).toLocaleString()}
                </Box>
              );
            },
          },
        ],
      },

      {
        Header: "90d Fees",
        columns: [
          {
            minWidth: 50,
            width: 50,
            accessor: "usage.revenue.ninetyDayTotal",
            css: { fontSize: "11px", color: "$gray400" },
            Cell: ({ row }) => {
              const warning = row.original?.usage?.warning;
              if (warning) {
                return <WarningPlaceholder />;
              }
              if (!row.values.usage.revenue.ninetyDayTotal) {
                return <Box>$0</Box>;
              }
              return (
                <Box>
                  $
                  {Math.round(
                    row.values.usage.revenue.ninetyDayTotal,
                  ).toLocaleString()}
                </Box>
              );
            },
          },
        ],
      },
      {
        Header: "30d Trend",
        tooltip:
          "Trend is the increase, or decrease, in the protocol's demand-side fees between two periods. It's calculated by subtracting the previous 30d fees from the current 30d fees, and then dividing that number by the previous 30d fees.",
        columns: [
          {
            accessor: "usage.revenue.thirtyDayPercentChange",
            Cell: ({ row }) => {
              const paymentType =
                registry[row.values.name.toLowerCase()]?.paymentType ===
                "dilution"
                  ? "dilution"
                  : "revenue";
              if (row.values.untracked) return "--";
              if (row.original?.usage?.warning) {
                return <WarningPlaceholder />;
              }
              const color =
                row.values.usage[paymentType].thirtyDayPercentChange >= 0
                  ? defaultTheme.colors.green
                  : defaultTheme.colors.red;

              // Get last two periods excluding current day
              const usageDays = Array.isArray(row.values.usage.days)
                ? row.values.usage.days
                : [];
              const lastTwoPeriods = usageDays.slice(-61).slice(0, 60);

              return (
                <Box css={{ display: "flex" }}>
                  <LineGraph color={color} days={lastTwoPeriods} />
                  <RevenueChange
                    percentChange={Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 2,
                    }).format(
                      row.values.usage[paymentType].thirtyDayPercentChange,
                    )}
                    css={{ ml: "$2" }}
                  />
                </Box>
              );
            },
          },
        ],
      },
      {
        Header: "Usage",
        accessor: "usage",
      },
      {
        Header: "Untracked",
        accessor: "untracked",
      },
    ],
    [],
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        initialState: {
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
      useGroupBy,
      useSortBy,
    );

  // We don't want to render all 2000 rows for this example, so cap
  // it at 20 for this use case
  const firstPageRows = rows.slice(0, 20);

  return (
    <Section {...props}>
      <Table
        css={{
          // width: "100%",
          // backgroundColor: "$table",
          // display: "table",
          tableLayout: "auto",
          // borderSpacing: "0",
          // borderCollapse: "collapse",
          // minWidth: "920px",
          // "@bp1": {
          //   minWidth: "1260px",
          // },
          ".sticky": {
            position: "sticky",
            left: "0",
            top: "0",
            zIndex: 10000,
          },
        }}
        {...getTableProps()}>
        <Thead>
          {headerGroups.map((headerGroup, i) => {
            const headerGroupProps = headerGroup.getHeaderGroupProps();
            const { key, ...restHeaderGroupProps } = headerGroupProps;
            return (
              <Tr key={key ?? i} {...restHeaderGroupProps}>
                {headerGroup.headers.map((column, i) => {
                  const headerProps = column.getHeaderProps(
                    column.getSortByToggleProps({ title: undefined }),
                  );
                  const { key: headerKey, ...restHeaderProps } = headerProps;
                  return (
                    <Th
                      key={headerKey ?? i}
                      className={column?.className}
                      css={{
                        backgroundColor: "$loContrast",
                        minWidth: column.minWidth,
                        width: column.width,
                        verticalAlign: "middle",
                        py: 0,
                        px: 0,
                        fontSize: 12,
                        "@bp1": {
                          width: column.width ? column.width : "auto",
                          position: "relative !important",
                        },
                      }}
                      {...restHeaderProps}>
                      <Box
                        css={{
                          display: "flex",
                          alignItems: "center",
                          pt: "$2",
                          pb: "$2",
                          px: i === 1 ? "$3" : "$4",
                          "@bp1": {
                            px: "$4",
                            pr: 0,
                          },
                          ...column.css,
                        }}>
                        <Box css={{ fontWeight: 600 }}>
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
                    </Th>
                  );
                })}
              </Tr>
            );
          })}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {firstPageRows.map((row, rowIndex) => {
            prepareRow(row);
            const rowProps = row.getRowProps();
            const { key: rowKey, ...restRowProps } = rowProps;
            return (
              <Tr
                key={rowKey ?? rowIndex}
                {...restRowProps}
                css={{
                  "&:last-child": {
                    Td: { borderBottom: 0 },
                  },
                }}>
                {row.cells.map((cell, i) => {
                  const cellProps = cell.getCellProps();
                  const { key: cellKey, ...restCellProps } = cellProps;
                  return (
                    <Td
                      className={cell.column?.className}
                      css={{
                        backgroundColor: "$loContrast",
                        px: i === 1 ? "$3" : "$4",
                        py: 16,
                        fontSize: "$2",
                        borderBottom: "1px solid",
                        borderColor: "$border",
                        pr: 0,
                        width: "auto",
                        "@bp1": {
                          pr: 0,
                          position: "relative !important",
                        },
                      }}
                      key={cellKey ?? i}
                      {...restCellProps}>
                      <StyledLink href={`/${row.values.slug}`}>
                        {cell.render("Cell")}
                      </StyledLink>
                    </Td>
                  );
                })}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Section>
  );
};

export default Listing;
