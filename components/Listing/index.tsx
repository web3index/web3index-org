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
} from "@radix-ui/react-icons";
import registry from "../../registry.json";

const StyledImage = styled("img", {
  mr: "$3",
});

const feeTooltip = (
  <Box
    css={{
      " > div": {
        mb: "$3",
      },
    }}
  >
    <Box>Fees are generally categorized as explicit or implicit.</Box>

    <Box>
      An example of an explicit fee could be a single payment for work rendered
      by a protocol. Examples of this would be a payment to query indexed data
      on The Graph, or a payment to store data on Arweave.
    </Box>

    <Box>
      In certain protocols, user/developer stake represents an allotment of
      usage on the network. If this usage triggers inflation, then the cost to
      stake for demand side participants is quantified as being equivalent to
      the dilution of its stake incurred as work is rendered and is categorized
      as an implicit fee.
    </Box>

    <Box>
      Please note a user/developer stake in isolation does not count toward
      explicit fees unless the staked balance reduces as protocol services are
      rendered. In this case the spent/burned amount of the staked balance would
      constitute an explicit fee.
    </Box>
  </Box>
);

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
              return (
                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
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
                    }}
                  >
                    ({row.values.symbol})
                  </Box>
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
        Header: "Blockchain",
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
        tooltip: feeTooltip,
        columns: [
          {
            Header: "Explicit",
            minWidth: 50,
            width: 50,
            css: { fontSize: "11px", color: "$gray400" },
            accessor: "usage.revenue.thirtyDayTotal",
            Cell: ({ row }) => {
              if (!row.values.usage.revenue.thirtyDayTotal) {
                return (
                  <Box>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Box css={{ display: "flex", alignItems: "center" }}>
                          <Box>$0</Box>
                          <Box as={InfoCircledIcon} css={{ ml: "$2" }} />
                        </Box>
                      </TooltipTrigger>
                      <TooltipContent>
                        <TooltipArrow />
                        <Box>
                          The Pocket DAO is planning a shift from developers
                          paying via dilution, to developers paying via the
                          burning of their stake in proportion to their usage.
                          Once the DAO makes this change, burned staked tokens
                          will count towards explicit fees on the index.
                        </Box>
                      </TooltipContent>
                    </Tooltip>
                  </Box>
                );
              }
              return (
                <Box>
                  $
                  {Math.round(
                    row.values.usage.revenue.thirtyDayTotal
                  ).toLocaleString()}
                </Box>
              );
            },
          },
          {
            Header: "Implicit",
            accessor: "usage.dilution.thirtyDayTotal",
            css: { fontSize: "11px", color: "$gray400" },
            Cell: ({ row }) => {
              if (!row.values.usage.dilution.thirtyDayTotal) {
                return <Box>$0</Box>;
              }
              return (
                <Box>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Box css={{ display: "flex", alignItems: "center" }}>
                        <Box>
                          $
                          {Math.round(
                            row.values.usage.dilution.thirtyDayTotal
                          ).toLocaleString()}
                        </Box>
                        <Box as={InfoCircledIcon} css={{ ml: "$2" }} />
                      </Box>
                    </TooltipTrigger>
                    <TooltipContent>
                      <TooltipArrow />
                      <Box>
                        Pocket has a unique payment mechanism. Developers stake
                        POKT upfront to lock in a guaranteed amount of bandwidth
                        and pay through dilution as the protocol mints new POKT
                        and rewards node operators based directly on the amount
                        of usage of the network. The Web3 Index tracks
                        developers&apos; dilutionary payment activity as
                        implicit costs incurred by developers.
                      </Box>
                    </TooltipContent>
                  </Tooltip>
                </Box>
              );
            },
          },
        ],
      },

      {
        Header: "90d Fees",
        tooltip: feeTooltip,
        columns: [
          {
            Header: "Explicit",
            minWidth: 50,
            width: 50,
            accessor: "usage.revenue.ninetyDayTotal",
            css: { fontSize: "11px", color: "$gray400" },
            Cell: ({ row }) => {
              if (!row.values.usage.revenue.ninetyDayTotal) {
                return (
                  <Box>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Box css={{ display: "flex", alignItems: "center" }}>
                          <Box>$0</Box>
                          <Box as={InfoCircledIcon} css={{ ml: "$2" }} />
                        </Box>
                      </TooltipTrigger>
                      <TooltipContent>
                        <TooltipArrow />
                        <Box>
                          The Pocket DAO is planning a shift from developers
                          paying via dilution, to developers paying via the
                          burning of their stake in proportion to their usage.
                          Once the DAO makes this change, burned staked tokens
                          will count towards explicit fees on the index.
                        </Box>
                      </TooltipContent>
                    </Tooltip>
                  </Box>
                );
              }
              return (
                <Box>
                  $
                  {Math.round(
                    row.values.usage.revenue.ninetyDayTotal
                  ).toLocaleString()}
                </Box>
              );
            },
          },
          {
            Header: "Implicit",
            width: 40,
            minWidth: 40,
            accessor: "usage.dilution.ninetyDayTotal",
            css: { fontSize: "11px", color: "$gray400" },
            Cell: ({ row }) => {
              if (!row.values.usage.dilution.ninetyDayTotal) {
                return <Box>$0</Box>;
              }
              return (
                <Box>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Box css={{ display: "flex", alignItems: "center" }}>
                        <Box>
                          $
                          {Math.round(
                            row.values.usage.dilution.ninetyDayTotal
                          ).toLocaleString()}
                        </Box>
                        <Box as={InfoCircledIcon} css={{ ml: "$2" }} />
                      </Box>
                    </TooltipTrigger>
                    <TooltipContent>
                      <TooltipArrow />
                      <Box>
                        Pocket has a unique payment mechanism. Developers stake
                        POKT upfront to lock in a guaranteed amount of bandwidth
                        and pay through dilution as the protocol mints new POKT
                        and rewards node operators based directly on the amount
                        of usage of the network. The Web3 Index tracks
                        developers&apos; dilutionary payment activity as
                        implicit costs incurred by developers.
                      </Box>
                    </TooltipContent>
                  </Tooltip>
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
              const color =
                row.values.usage[paymentType].thirtyDayPercentChange > 0
                  ? defaultTheme.colors.green
                  : defaultTheme.colors.red;

              // Get last two periods excluding current day
              const lastTwoPeriods = row.values.usage.days
                .slice(-61)
                .slice(0, 60);

              return (
                <Box css={{ display: "flex" }}>
                  <LineGraph color={color} days={lastTwoPeriods} />
                  <RevenueChange
                    percentChange={Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 2,
                    }).format(
                      row.values.usage[paymentType].thirtyDayPercentChange
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
    []
  );

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
      useGroupBy,
      useSortBy
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
        {...getTableProps()}
      >
        <Thead>
          {headerGroups.map((headerGroup, i) => (
            <Tr key={i} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(
                (column, i) => (
                  console.log(column.css),
                  (
                    <Th
                      key={i}
                      className={column?.className}
                      css={{
                        backgroundColor: "$loContrast",
                        minWidth: column.minWidth,
                        width: column.width,
                        verticalAlign: "middle",
                        py: 0,
                        px: 0,
                        fontSize: 12,

                        // display: column.hideOnMobile ? "none" : "initial",
                        "@bp1": {
                          width: column.width ? column.width : "auto",
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
                          pt: "$2",
                          pb: "$2",
                          px: i === 1 ? "$3" : "$4",

                          "@bp1": {
                            px: "$4",
                            pr: 0,
                          },
                          ...column.css,
                        }}
                      >
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
                  )
                )
              )}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {firstPageRows.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <Tr
                key={rowIndex}
                {...row.getRowProps()}
                css={{
                  "&:last-child": {
                    Td: { borderBottom: 0 },
                  },
                }}
              >
                {row.cells.map((cell, i) => {
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
                      key={i}
                      {...cell.getCellProps()}
                    >
                      <Link href={`/${row.values.slug}`} passHref>
                        <Box
                          as="a"
                          css={{
                            display: "block",
                            color: "$hiContrast",
                            textDecoration: "none",
                            verticalAlign: "inherit",
                          }}
                          key={rowIndex}
                          {...row.getRowProps()}
                        >
                          {cell.render("Cell")}
                        </Box>
                      </Link>
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
