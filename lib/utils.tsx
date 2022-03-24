import { request, gql } from "graphql-request";
import Numeral from "numeral";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import utc from "dayjs/plugin/utc";

export const getBlocksFromTimestamps = async (timestamps, network) => {
  const endpoints = {
    mainnet:
      "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks",
    "arbitrum-one":
      "https://api.thegraph.com/subgraphs/name/dolomite-exchange/arbitrum-one-blocks",
  };

  if (!timestamps?.length) {
    return [];
  }
  const blocks = [];
  for (const timestamp of timestamps) {
    const json = await request(
      endpoints[network],
      gql`
        query blocks($timestampFrom: Int!, $timestampTo: Int!) {
          blocks(
            first: 1
            orderBy: timestamp
            orderDirection: asc
            where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
          ) {
            id
            number
            timestamp
          }
        }
      `,
      { timestampFrom: timestamp, timestampTo: timestamp + 100 }
    );
    blocks.push(+json.blocks[0]?.number ? +json.blocks[0]?.number : 0);
  }

  return blocks;
};

/**
 * gets the amount difference plus the % change in change itself (second order change)
 * @param {*} valueNow
 * @param {*} valueAsOfPeriodOne
 * @param {*} valueAsOfPeriodTwo
 */
export const getTwoPeriodPercentChange = (
  valueNow: number,
  valueAsOfPeriodOne: number,
  valueAsOfPeriodTwo: number
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

export const toK = (num) => {
  return Numeral(num).format("0.[00]a");
};

export const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

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

export const formatDataForWeekly = (days) => {
  // format dayjs with the libraries that we need
  dayjs.extend(utc);
  dayjs.extend(weekOfYear);

  const weeklyData = [];
  const weeklySizedChunks = [...days].sort((a, b) =>
    parseInt(a.date) > parseInt(b.date) ? 1 : -1
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

// log the pageview with their URL
export const pageview = (url) => {
  window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS, {
    page_path: url,
  });
};

// log specific events happening.
export const event = ({ action, params }) => {
  window.gtag("event", action, params);
};

export const getSubgraph = (network) => {
  // if network is mainnet use decentralized network
  if (network === "mainnet") {
    return `https://gateway.thegraph.com/api/643e75af14ebedf13430c47ee045f07a/subgraphs/id/5WHJhK3TW4zAc3d3KaNXwmPjRAyRqibTqzFhiRrWVWWg`;
  }

  return `https://api.thegraph.com/subgraphs/name/web3index/${network}`;
};

const getRevenueByBlock = async (id, blockNumber, network) => {
  return await request(
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
    }
  );
};

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

  const [
    oneDayBlock,
    twoDayBlock,
    oneWeekBlock,
    twoWeekBlock,
    thirtyDayBlock,
    sixtyDayBlock,
    ninetyDayBlock,
  ] = await getBlocksFromTimestamps(timestamps, network);

  const oneDayResult = await getRevenueByBlock(id, oneDayBlock, network);
  const twoDayResult = await getRevenueByBlock(id, twoDayBlock, network);
  const oneWeekResult = await getRevenueByBlock(id, oneWeekBlock, network);
  const twoWeekResult = await getRevenueByBlock(id, twoWeekBlock, network);
  const thirtyDayResult = await getRevenueByBlock(id, thirtyDayBlock, network);
  const sixtyDayResult = await getRevenueByBlock(id, sixtyDayBlock, network);
  const ninetyDayResult = await getRevenueByBlock(id, ninetyDayBlock, network);

  return [
    oneDayResult.protocol?.revenueUSD ? +oneDayResult.protocol.revenueUSD : 0,
    twoDayResult.protocol?.revenueUSD ? +twoDayResult.protocol.revenueUSD : 0,
    oneWeekResult.protocol?.revenueUSD ? +oneWeekResult.protocol.revenueUSD : 0,
    twoWeekResult.protocol?.revenueUSD ? +twoWeekResult.protocol.revenueUSD : 0,
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
};

export function sumArrays(...arrays) {
  const n = arrays.reduce((max, xs) => Math.max(max, xs.length), 0);
  const result = Array.from({ length: n });
  return result.map((_, i) =>
    arrays.map((xs) => xs[i] || 0).reduce((sum, x) => sum + x, 0)
  );
}
