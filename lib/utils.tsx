import { request, gql } from "graphql-request";
import Numeral from "numeral";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import utc from "dayjs/plugin/utc";
import { Project } from "../types";

type BlocksResponse = {
  blocks: { id: string; number: string; timestamp: string }[];
};

type ProtocolRevenueResponse = {
  protocol: {
    revenueUSD: string;
    days?: { date: number; revenueUSD: string }[];
  } | null;
};

/** Resolves block numbers near the provided timestamps using the block subgraph. */
const getBlocksFromTimestamps = async (timestamps, network) => {
  if (!timestamps?.length) {
    return [];
  }

  const endpoint = getBlockSubgraph(network);
  const blocks = [];
  for (const timestamp of timestamps) {
    try {
      const json = await request<BlocksResponse>(
        endpoint,
        gql`
          query blocks($timestampFrom: Int!, $timestampTo: Int!) {
            blocks(
              first: 1
              orderBy: timestamp
              orderDirection: asc
              where: {
                timestamp_gt: $timestampFrom
                timestamp_lt: $timestampTo
              }
            ) {
              id
              number
              timestamp
            }
          }
        `,
        { timestampFrom: timestamp, timestampTo: timestamp + 100 },
      );
      blocks.push(+json.blocks[0]?.number ? +json.blocks[0]?.number : 0);
    } catch (error) {
      console.warn("Failed to fetch block data from The Graph", {
        network,
        timestamp,
        error,
      });
      blocks.push(0);
    }
  }

  return blocks;
};

/**
 * gets the amount difference plus the % change in change itself (second order change)
 * @param valueNow - current value
 * @param valueAsOfPeriodOne - value as of period one
 * @param valueAsOfPeriodTwo - value as of period two
 */
export const getTwoPeriodPercentChange = (
  valueNow: number,
  valueAsOfPeriodOne: number,
  valueAsOfPeriodTwo: number,
) => {
  // get volume info for both periods
  const currentChange = valueNow - valueAsOfPeriodOne;
  const previousChange = valueAsOfPeriodOne - valueAsOfPeriodTwo;

  const adjustedPercentChange =
    ((currentChange - previousChange) / previousChange) * 100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0];
  }
  return [currentChange, adjustedPercentChange];
};

/** Formats a numeric value using Numeral’s abbreviated notation (e.g., 1.2k). */
const toK = (num) => {
  return Numeral(num).format("0.[00]a");
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/**
 * Formats a numeric value into a human-readable string for USD or raw units.
 * @param number - Value to format; accepts numeric strings.
 * @param unit - Set to "usd" for currency formatting; pass anything else for raw.
 */
export const formattedNum = (number, unit = "usd") => {
  if (isNaN(number) || number === "" || number === undefined) {
    return unit === "usd" ? "$0" : 0;
  }
  const num = parseFloat(number);

  if (num > 500000000) {
    return `${(unit === "usd" ? "$" : "") + toK(num.toFixed(0))}`;
  }

  if (num === 0) {
    if (unit === "usd") {
      return "$0";
    }
    return 0;
  }

  if (num < 0.0001 && num > 0) {
    if (unit === "usd") {
      return "< $0.0001";
    }
    return "< 0.0001";
  }

  if (num > 1000) {
    if (unit === "usd") {
      return "$" + Number(num.toFixed(0)).toLocaleString();
    }
    return Number(num.toFixed(0)).toLocaleString();
  }

  if (unit === "usd") {
    if (num < 0.1) {
      return "$" + Number(num.toFixed(4));
    } else {
      const usdString = priceFormatter.format(num);
      return "$" + usdString.slice(1, usdString.length);
    }
  }
  return Number(num.toFixed(5));
};

// format weekly data for weekly sized chunks

/**
 * Groups daily revenue data into weekly buckets for graphing.
 * @param days - Array of { date, revenue } objects sorted arbitrarily.
 */
export const formatDataForWeekly = (days) => {
  // format dayjs with the libraries that we need
  dayjs.extend(utc);
  dayjs.extend(weekOfYear);

  const weeklyData = [];
  const weeklySizedChunks = [...days].sort((a, b) =>
    parseInt(a.date) > parseInt(b.date) ? 1 : -1,
  );
  let startIndexWeekly = -1;
  let currentWeek = -1;

  for (const weeklySizedChunk of weeklySizedChunks) {
    const week = dayjs.utc(dayjs.unix(weeklySizedChunk.date)).week();
    if (week !== currentWeek) {
      currentWeek = week;
      startIndexWeekly++;
    }
    weeklyData[startIndexWeekly] = weeklyData[startIndexWeekly] || {};
    weeklyData[startIndexWeekly].date = weeklySizedChunk.date;
    weeklyData[startIndexWeekly].revenue =
      (weeklyData[startIndexWeekly].revenue ?? 0) + +weeklySizedChunk.revenue;
  }
  return weeklyData;
};

export const trophies = ["🏆", "🥈", "🥉"];

declare global {
  interface Window {
    gtag: any;
  }
}

/** Sends a pageview event to GA if the global gtag is available. */
export const pageview = (url) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return;
  const trackingId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;
  if (!trackingId) return;
  window.gtag("config", trackingId, {
    page_path: url,
  });
};

/** Emits a custom GA event if gtag is available in the browser. */
export const event = ({ action, params }) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return;
  window.gtag("event", action, params);
};

const getEnvValue = (key: string) => {
  const value = process.env[key as keyof NodeJS.ProcessEnv];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

/** Builds a subgraph URL using either overrides or a scoped GRAPH_API_KEY. */
const buildSubgraphUrl = (network: string, prefix: string) => {
  const networkSuffix = network.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const endpointEnvKey = `${prefix}_ENDPOINT_${networkSuffix}`;
  const overrideEndpoint = getEnvValue(endpointEnvKey);
  if (overrideEndpoint) {
    return overrideEndpoint;
  }

  const apiKey = getEnvValue("GRAPH_API_KEY");
  if (!apiKey) {
    throw new Error(
      `GRAPH_API_KEY env var is required unless an override endpoint ` +
        `is provided for ${network}`,
    );
  }
  const subgraphIdEnvKey = `${prefix}_${networkSuffix}_ID`;
  const scopedSubgraphId = getEnvValue(subgraphIdEnvKey);
  if (scopedSubgraphId) {
    return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${scopedSubgraphId}`;
  }

  throw new Error(
    `Set ${subgraphIdEnvKey} env var (or override endpoint) for ${network}`,
  );
};

/** Returns the Web3 Index subgraph endpoint for a network. */
export const getSubgraph = (network: string) => {
  return buildSubgraphUrl(network, "GRAPH_WEB3INDEX");
};

/** Returns the Everest metadata subgraph endpoint. */
export const getEverestSubgraph = () => {
  return buildSubgraphUrl("mainnet", "GRAPH_EVEREST");
};

const getBlockSubgraph = (network: string) => {
  return buildSubgraphUrl(network, "GRAPH_BLOCKS");
};

/** Reads cumulative revenue at a specific block height from a network subgraph. */
const getRevenueByBlock = async (id, blockNumber, network) => {
  return await request<ProtocolRevenueResponse>(
    getSubgraph(network),
    gql`
      query ($id: String!, $block: Block_height) {
        protocol(id: $id, block: $block) {
          revenueUSD
        }
      }
    `,
    {
      id,
      block: { number: blockNumber },
    },
  );
};

/**
 * Fetches historical cumulative revenue snapshots (1d/2d/1w/etc.) for a protocol.
 *
 * Falls back to zero arrays if block lookups or revenue queries fail.
 */
export const getSnapshots = async (id, network) => {
  const utcCurrentTime = dayjs();
  const utcOneDayBack = utcCurrentTime.subtract(1, "day").unix();
  const utcTwoDaysBack = utcCurrentTime.subtract(2, "day").unix();
  const utcOneWeekBack = utcCurrentTime.subtract(1, "week").unix();
  const utcTwoWeeksBack = utcCurrentTime.subtract(2, "week").unix();
  const utcThirtyDaysBack = utcCurrentTime.subtract(30, "day").unix();
  const utcSixtyDaysBack = utcCurrentTime.subtract(60, "day").unix();
  const utcNinetyDaysBack = utcCurrentTime.subtract(90, "day").unix();

  const timestamps = [
    utcOneDayBack,
    utcTwoDaysBack,
    utcOneWeekBack,
    utcTwoWeeksBack,
    utcThirtyDaysBack,
    utcSixtyDaysBack,
    utcNinetyDaysBack,
  ];

  const blockResults = await getBlocksFromTimestamps(timestamps, network);

  if (blockResults.length < 7 || blockResults.every((block) => block === 0)) {
    console.warn("Falling back to zeroed snapshots; unable to fetch blocks", {
      network,
    });
    return Array(7).fill(0);
  }

  const [
    oneDayBlock,
    twoDayBlock,
    oneWeekBlock,
    twoWeekBlock,
    thirtyDayBlock,
    sixtyDayBlock,
    ninetyDayBlock,
  ] = blockResults;

  try {
    const [
      oneDayResult,
      twoDayResult,
      oneWeekResult,
      twoWeekResult,
      thirtyDayResult,
      sixtyDayResult,
      ninetyDayResult,
    ] = await Promise.all([
      getRevenueByBlock(id, oneDayBlock, network),
      getRevenueByBlock(id, twoDayBlock, network),
      getRevenueByBlock(id, oneWeekBlock, network),
      getRevenueByBlock(id, twoWeekBlock, network),
      getRevenueByBlock(id, thirtyDayBlock, network),
      getRevenueByBlock(id, sixtyDayBlock, network),
      getRevenueByBlock(id, ninetyDayBlock, network),
    ]);

    return [
      oneDayResult.protocol?.revenueUSD ? +oneDayResult.protocol.revenueUSD : 0,
      twoDayResult.protocol?.revenueUSD ? +twoDayResult.protocol.revenueUSD : 0,
      oneWeekResult.protocol?.revenueUSD
        ? +oneWeekResult.protocol.revenueUSD
        : 0,
      twoWeekResult.protocol?.revenueUSD
        ? +twoWeekResult.protocol.revenueUSD
        : 0,
      thirtyDayResult.protocol?.revenueUSD
        ? +thirtyDayResult.protocol.revenueUSD
        : 0,
      sixtyDayResult.protocol?.revenueUSD
        ? +sixtyDayResult.protocol.revenueUSD
        : 0,
      ninetyDayResult.protocol?.revenueUSD
        ? +ninetyDayResult.protocol.revenueUSD
        : 0,
    ];
  } catch (error) {
    console.warn("Falling back to zeroed snapshots; unable to fetch revenue", {
      id,
      network,
      error,
    });
    return Array(7).fill(0);
  }
};

/** Adds arrays element-wise (treats missing entries as zero). */
export function sumArrays(...arrays) {
  const n = arrays.reduce((max, xs) => Math.max(max, xs.length), 0);
  const result = Array.from({ length: n });
  return result.map((_, i) =>
    arrays.map((xs) => xs[i] || 0).reduce((sum, x) => sum + x, 0),
  );
}

type RankableProject = Pick<Project, "slug" | "usage"> & {
  rank?: number | null;
};

/**
 * Normalizes a value for sorting; missing/invalid becomes -Infinity.
 * @param value - Numeric value to normalize.
 * @returns Normalized numeric value or -Infinity.
 */
export const normalizeNumericMetric = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : -Infinity;
};

/**
 * Normalizes a project's 30-day total using the generic helper above.
 * @param project - Project whose 30-day total to normalize.
 * @returns Normalized 30-day total or -Infinity.
 */
export const normalizeThirtyDayTotal = (project?: RankableProject) => {
  return normalizeNumericMetric(project?.usage?.revenue?.thirtyDayTotal);
};

/**
 * Sorts projects by 30d total (desc) and assigns rank; warnings get null rank.
 * @param projects - Array of projects to sort and rank.
 * @returns New array of projects sorted by 30d total with rank assigned.
 */
export const sortProjectsByThirtyDayTotal = <T extends RankableProject>(
  projects: T[],
) => {
  const indexed = projects.map((project, index) => ({ project, index }));
  indexed.sort((a, b) => {
    const diff =
      normalizeThirtyDayTotal(b.project) - normalizeThirtyDayTotal(a.project);
    if (diff !== 0) {
      return diff;
    }
    return a.index - b.index;
  });

  indexed.forEach(({ project }, rankIndex) => {
    project.rank = project?.usage?.warning ? null : rankIndex + 1;
  });

  return indexed.map(({ project }) => project);
};
