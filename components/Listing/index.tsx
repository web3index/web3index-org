import { useMemo, useState } from "react";
import {
  ColumnDef,
  SortingFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import { normalizeNumericMetric } from "../../lib/utils";

const StyledImage = styled("img", {
  mr: "$3",
});
const StyledLink = styled(Link, {
  display: "block",
  color: "$hiContrast",
  textDecoration: "none",
  verticalAlign: "inherit",
});
const WarningIcon = styled(ExclamationTriangleIcon, {
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

type ColumnMeta = {
  className?: string;
  hideOnMobile?: boolean;
  css?: Record<string, any>;
  tooltip?: string;
  width?: number;
  minWidth?: number;
};

const createSortingFn =
  (selector: (project: any) => number | null | undefined): SortingFn<any> =>
  (rowA, rowB) =>
    normalizeNumericMetric(selector(rowA.original)) -
    normalizeNumericMetric(selector(rowB.original));

const Listing = ({ data, ...props }) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "usage.revenue.thirtyDayTotal", desc: true },
  ]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "#",
        columns: [
          {
            id: "rank",
            header: "",
            enableSorting: false,
            cell: ({ row }) =>
              row.original?.usage?.warning
                ? "--"
                : (row.original?.rank ?? row.index + 1),
            meta: { className: "sticky", hideOnMobile: true, width: 90 },
          },
        ],
      },
      {
        header: "Network",
        columns: [
          {
            id: "name",
            accessorKey: "name",
            header: "",
            cell: ({ row }) => {
              const warning = row.original?.usage?.warning;
              return (
                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                  }}>
                  <StyledImage
                    width={32}
                    height={32}
                    src={row.original.image}
                  />
                  {row.original.name}
                  <Box
                    css={{
                      ml: "$2",
                      color: "$gray500",
                      display: "none",
                      "@bp1": {
                        display: "block",
                      },
                    }}>
                    ({row.original.symbol})
                  </Box>
                  {warning ? (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <WarningIcon width={13} height={13} />
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
            meta: { className: "sticky" },
          },
        ],
      },
      {
        header: "Chain",
        columns: [
          {
            id: "blockchain",
            accessorKey: "blockchain",
            header: "",
          },
        ],
      },
      {
        header: "30d Fees",
        columns: [
          {
            id: "usage.revenue.thirtyDayTotal",
            header: "",
            accessorFn: (row) => row?.usage?.revenue?.thirtyDayTotal ?? 0,
            sortingFn: createSortingFn(
              (project) => project?.usage?.revenue?.thirtyDayTotal,
            ),
            meta: {
              css: { fontSize: "11px", color: "$gray400" },
              minWidth: 50,
              width: 50,
            },
            cell: ({ row }) => {
              const warning = row.original?.usage?.warning;
              const total = row.original?.usage?.revenue?.thirtyDayTotal;
              if (warning) {
                return <WarningPlaceholder />;
              }
              if (!total) {
                return <Box>$0</Box>;
              }
              return <Box>${Math.round(total).toLocaleString()}</Box>;
            },
          },
        ],
      },
      {
        header: "90d Fees",
        columns: [
          {
            id: "usage.revenue.ninetyDayTotal",
            header: "",
            accessorFn: (row) => row?.usage?.revenue?.ninetyDayTotal ?? 0,
            sortingFn: createSortingFn(
              (project) => project?.usage?.revenue?.ninetyDayTotal,
            ),
            meta: {
              css: { fontSize: "11px", color: "$gray400" },
              minWidth: 50,
              width: 50,
            },
            cell: ({ row }) => {
              const warning = row.original?.usage?.warning;
              const total = row.original?.usage?.revenue?.ninetyDayTotal;
              if (warning) {
                return <WarningPlaceholder />;
              }
              if (!total) {
                return <Box>$0</Box>;
              }
              return <Box>${Math.round(total).toLocaleString()}</Box>;
            },
          },
        ],
      },
      {
        header: "Total Fees",
        columns: [
          {
            id: "usage.totalFees",
            header: "",
            accessorFn: (row) => {
              const nameKey = row?.name?.toLowerCase?.();
              const paymentType =
                registry[nameKey]?.paymentType === "dilution"
                  ? "dilution"
                  : "revenue";
              return row?.usage?.[paymentType]?.now ?? 0;
            },
            meta: {
              css: { fontSize: "11px", color: "$gray400" },
              minWidth: 65,
              width: 65,
            },
            cell: ({ row }) => {
              const warning = row.original?.usage?.warning;
              if (warning) {
                return <WarningPlaceholder />;
              }
              const nameKey = row.original?.name?.toLowerCase();
              const paymentType =
                registry[nameKey]?.paymentType === "dilution"
                  ? "dilution"
                  : "revenue";
              const total = row.original?.usage?.[paymentType]?.now ?? 0;
              if (!total) {
                return <Box>$0</Box>;
              }
              return <Box>${Math.round(total).toLocaleString()}</Box>;
            },
          },
        ],
      },
      {
        header: "30d Trend",
        meta: {
          tooltip:
            "Trend is the increase, or decrease, in the protocol's demand-side fees between two periods. It's calculated by subtracting the previous 30d fees from the current 30d fees, and then dividing that number by the previous 30d fees.",
        },
        columns: [
          {
            id: "usage.revenue.thirtyDayPercentChange",
            header: "",
            enableSorting: false,
            accessorFn: (row) =>
              row?.usage?.revenue?.thirtyDayPercentChange ?? 0,
            cell: ({ row }) => {
              const nameKey = row.original?.name?.toLowerCase();
              const paymentType =
                registry[nameKey]?.paymentType === "dilution"
                  ? "dilution"
                  : "revenue";
              if (row.original?.untracked) return "--";
              if (row.original?.usage?.warning) {
                return <WarningPlaceholder />;
              }
              const percent =
                row.original?.usage?.[paymentType]?.thirtyDayPercentChange ?? 0;
              const color =
                percent >= 0
                  ? defaultTheme.colors.green
                  : defaultTheme.colors.red;

              const usageDays = Array.isArray(row.original?.usage?.days)
                ? row.original.usage.days
                : [];
              const lastTwoPeriods = usageDays.slice(-61).slice(0, 60);

              return (
                <Box css={{ display: "flex" }}>
                  <LineGraph color={color} days={lastTwoPeriods} />
                  <RevenueChange
                    percentChange={Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 2,
                    }).format(percent)}
                    css={{ ml: "$2" }}
                  />
                </Box>
              );
            },
          },
        ],
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  });

  const firstPageRows = table.getRowModel().rows.slice(0, 20);

  return (
    <Section {...props}>
      <Table
        css={{
          tableLayout: "auto",
          ".sticky": {
            position: "sticky",
            left: "0",
            top: "0",
            zIndex: 10000,
          },
        }}>
        <Thead>
          {table.getHeaderGroups().map((headerGroup, i) => (
            <Tr key={headerGroup.id ?? i}>
              {headerGroup.headers.map((header, j) => {
                const meta = header.column.columnDef.meta as
                  | ColumnMeta
                  | undefined;
                if (header.isPlaceholder) {
                  return <Th key={`${header.id}-placeholder`} />;
                }
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <Th
                    key={header.id ?? j}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={meta?.className}
                    css={{
                      backgroundColor: "$loContrast",
                      minWidth: meta?.minWidth,
                      width: meta?.width,
                      verticalAlign: "middle",
                      py: 0,
                      px: 0,
                      fontSize: 12,
                      cursor: canSort ? "pointer" : "default",
                      "@bp1": {
                        width: meta?.width ? meta.width : "auto",
                        position: "relative !important",
                      },
                    }}>
                    <Box
                      css={{
                        display: "flex",
                        alignItems: "center",
                        pt: "$2",
                        pb: "$2",
                        px: j === 1 ? "$3" : "$4",
                        "@bp1": {
                          px: "$4",
                          pr: 0,
                        },
                        ...meta?.css,
                      }}>
                      <Box css={{ fontWeight: 600 }}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </Box>
                      <Box css={{ minWidth: 20 }}>
                        {sorted ? (
                          sorted === "desc" ? (
                            <ChevronDownIcon />
                          ) : (
                            <ChevronUpIcon />
                          )
                        ) : (
                          ""
                        )}
                      </Box>
                      {meta?.tooltip && (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger>
                            <InfoCircledIcon />
                          </TooltipTrigger>
                          <TooltipContent>
                            <TooltipArrow />
                            {meta.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </Box>
                  </Th>
                );
              })}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {firstPageRows.map((row, rowIndex) => (
            <Tr
              key={row.id ?? rowIndex}
              css={{
                "&:last-child": {
                  Td: { borderBottom: 0 },
                },
              }}>
              {row.getVisibleCells().map((cell, i) => {
                const meta = cell.column.columnDef.meta as
                  | ColumnMeta
                  | undefined;
                return (
                  <Td
                    key={cell.id ?? i}
                    className={meta?.className}
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
                    }}>
                    <StyledLink href={`/${row.original.slug}`}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </StyledLink>
                  </Td>
                );
              })}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Section>
  );
};

export default Listing;
