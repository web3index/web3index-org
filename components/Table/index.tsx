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
        hiddenColumns: ["image", "usage", "slug"],
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
        as="table"
        css={{
          border: "1px solid",
          borderColor: "$border",
          borderRadius: "$4",
          width: "100%",
          backgroundColor: "$table",
        }}
        {...getTableProps()}
      >
        <thead>
          {headerGroups.map((headerGroup, i) => (
            <tr key={i} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, i) => (
                <th
                  key={i}
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
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {firstPageRows.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <Box as="tr" key={rowIndex} {...row.getRowProps()}>
                {row.cells.map((cell, i) => {
                  return (
                    <Box
                      css={{
                        px: "$4",
                        py: 20,
                        fontSize: "$2",
                        borderTop: rowIndex ? "1px solid" : 0,
                        borderColor: "$border",
                      }}
                      as="td"
                      key={i}
                      {...cell.getCellProps()}
                    >
                      {renderSwitch(cell)}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </tbody>
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
        <Link href={`/project/${cell.row.values.slug}`} passHref>
          <Box
            as="a"
            css={{
              color: "initial",
              textDecoration: "none",
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
          </Box>
        </Link>
      );
    default:
      return cell.render("Cell");
  }
}

export default Table;
