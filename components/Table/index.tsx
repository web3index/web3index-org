import { useTable, useSortBy } from "react-table";
import Box from "../Box";
import Section from "../Section";
import RevenueChange from "../RevenueChange";
import LineGraph from "../LineGraph";
import { ChevronDownIcon, ChevronUpIcon } from "@modulz/radix-icons";
import { defaultTheme, styled } from "../../stitches.config";
import Link from "next/link";

const Table = ({ columns, data, ...props }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        hiddenColumns: ["image", "symbol", "usage", "slug"],
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
          minWidth: "960px",
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
                  css={{
                    width: i === 0 ? "100px" : "auto",
                    display: "table-cell",
                    verticalAlign: "middle",
                  }}
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                >
                  <Box
                    css={{
                      display: "flex",
                      alignItems: "center",
                      px: "$4",
                      pt: "24px",
                      pb: "$3",
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
              <Link
                key={rowIndex}
                href={`/project/${row.values.slug}`}
                passHref
              >
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
                        css={{
                          px: "$4",
                          py: 20,
                          fontSize: "$2",
                          borderTop: rowIndex ? "1px solid" : 0,
                          borderColor: "$border",
                          display: "table-cell",
                          verticalAlign: "middle",
                          width: "auto",
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

function renderSwitch(cell) {
  switch (cell.column.id) {
    case "revenue": {
      return `$${Math.round(
        cell.row.values.usage.revenue.oneWeekTotal
      ).toLocaleString()}`;
    }
    case "percentChange": {
      const color =
        cell.row.values.usage.revenue.oneWeekPercentChange > 0
          ? defaultTheme.colors.green
          : defaultTheme.colors.red;
      return (
        <Box css={{ display: "flex" }}>
          <LineGraph color={color} days={cell.row.values.usage.days} />
          <RevenueChange
            percentChange={Intl.NumberFormat("en-US", {
              maximumFractionDigits: 2,
            }).format(cell.row.values.usage.revenue.oneWeekPercentChange)}
            css={{ ml: "$2" }}
          />
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
          <StyledImage
            width={32}
            height={32}
            alt="Livepeer"
            src={cell.row.values.image}
          />
          {cell.render("Cell")}
          <Box css={{ ml: "$2", color: "$gray500" }}>
            ({cell.row.values.symbol})
          </Box>
        </Box>
      );
    default:
      return cell.render("Cell");
  }
}

export default Table;
