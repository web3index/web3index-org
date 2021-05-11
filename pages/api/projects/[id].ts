import { NextApiRequest, NextApiResponse } from "next";
import { request, gql } from "graphql-request";
import registry from "../../../registry.json";
import dayjs from "dayjs";
import { getBlocksFromTimestamps } from "../../../lib/utils";

const getUsageFromDB = async (name) => {
  // TODO: query project by name and return usage using Prisma's aggregation feature
  // https://www.prisma.io/docs/concepts/components/prisma-client/aggregation-grouping-summarizing

  // replace the following dummy object with data returned from DB
  return {
    revenue: {
      now: 61779.07, // total revenue as of now
      oneDayAgo: 60579.17, // total revenue as of 1 day ago
      twoDaysAgo: 60390.5, // total revenue as of two days ago
      oneWeekAgo: 58620.2, // total revenue as of one week ago
      twoWeeksAgo: 53635.26, // total revenue as of two weeks ago
    },
    days: [
      {
        date: 1578960000, // timestamp representing start of day at 12:00 am UTC
        revenue: 843.22, // total revenue accrued during this day
      },
      // provide as many days available, up to 1,000 until pagination is supported.
    ],
  };
};

const getRevenueByBlock = async (id, blockNumber) => {
  return await request(
    "https://api.thegraph.com/subgraphs/name/web3index/the-web3-index",
    gql`
      query($id: String!, $block: Block_height) {
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

const getUsageFromSubgraph = async (id) => {
  const data = await request(
    "https://api.thegraph.com/subgraphs/name/web3index/the-web3-index",
    gql`
      query($id: String!) {
        protocol(id: $id) {
          revenueUSD
          days(first: 1000) {
            date
            revenueUSD
          }
        }
      }
    `,
    { id }
  );

  const utcCurrentTime = dayjs();
  const utcOneDayBack = utcCurrentTime.subtract(1, "day").unix();
  const utcTwoDaysBack = utcCurrentTime.subtract(2, "day").unix();
  const utcOneWeekBack = utcCurrentTime.subtract(1, "week").unix();
  const utcTwoWeeksBack = utcCurrentTime.subtract(2, "week").unix();

  const [
    oneDayBlock,
    twoDayBlock,
    oneWeekBlock,
    twoWeekBlock,
  ] = await getBlocksFromTimestamps([
    utcOneDayBack,
    utcTwoDaysBack,
    utcOneWeekBack,
    utcTwoWeeksBack,
  ]);

  const oneDayResult = await getRevenueByBlock(id, oneDayBlock);
  const twoDayResult = await getRevenueByBlock(id, twoDayBlock);
  const oneWeekResult = await getRevenueByBlock(id, oneWeekBlock);
  const twoWeekResult = await getRevenueByBlock(id, twoWeekBlock);

  const dayIndexSet = new Set();
  const oneDay = 24 * 60 * 60;

  let days = [];
  data.protocol.days.forEach((day) => {
    dayIndexSet.add((day.date / oneDay).toFixed(0));
    days.push({
      date: day.date,
      revenue: +day.revenueUSD,
    });
  });

  let timestamp = days[0].date;
  while (timestamp < Math.floor(+new Date() / 1000) - oneDay) {
    const nextDay = timestamp + oneDay;
    const currentDayIndex = (nextDay / oneDay).toFixed(0);

    if (!dayIndexSet.has(currentDayIndex)) {
      days.push({
        date: nextDay,
        revenue: 0,
        empty: true,
      });
    }
    timestamp = nextDay;
  }

  days = days.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1));

  return {
    revenue: {
      now: +data.protocol.revenueUSD,
      oneDayAgo: +oneDayResult.protocol.revenueUSD,
      twoDaysAgo: +twoDayResult.protocol.revenueUSD,
      oneWeekAgo: +oneWeekResult.protocol.revenueUSD,
      twoWeeksAgo: +twoWeekResult.protocol.revenueUSD,
    },
    days,
  };
};

export const getProject = async (id) => {
  let usage;

  // if project is part of the web3 index subgraph get it from the subgraph
  if (registry[id].subgraph) {
    usage = await getUsageFromSubgraph(id);
  }
  // if project is providing its own usage endpoint, fetch it
  else if (registry[id].usage) {
    const res = await fetch(registry[id].usage);
    usage = await res.json();
  }
  // else get usage from the Web3 Index DB
  else {
    usage = await getUsageFromDB(id);
  }

  return {
    ...registry[id],
    usage,
  };
};

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProject(_req.query.id);
  res.json(project);
};
