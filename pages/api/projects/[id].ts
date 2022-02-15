import { NextApiRequest, NextApiResponse } from "next";
import { request, gql } from "graphql-request";
import registry from "../../../registry.json";
import dayjs from "dayjs";
import { getBlocksFromTimestamps } from "../../../lib/utils";
import prisma from "../../../lib/prisma";

const utcCurrentTime = dayjs();
const utcOneDayBack = utcCurrentTime.subtract(1, "day").unix();
const utcTwoDaysBack = utcCurrentTime.subtract(2, "day").unix();
const utcOneWeekBack = utcCurrentTime.subtract(1, "week").unix();
const utcTwoWeeksBack = utcCurrentTime.subtract(2, "week").unix();
const utcThirtyDaysBack = utcCurrentTime.subtract(30, "day").unix();
const utcSixtyDaysBack = utcCurrentTime.subtract(60, "day").unix();
const utcNinetyDaysBack = utcCurrentTime.subtract(90, "day").unix();

const EMPTY = {
  now: 0,
  oneDayAgo: 0,
  twoDaysAgo: 0,
  oneWeekAgo: 0,
  twoWeeksAgo: 0,
  thirtyDaysAgo: 0,
  sixtyDaysAgo: 0,
  ninetyDaysAgo: 0,
};

const getUsageFromDB = async (name) => {
  const project = await prisma.project.findFirst({
    where: {
      name: name,
    },
  });

  const now = await prisma.day.aggregate({
    where: {
      projectId: project.id,
    },
    sum: {
      revenue: true,
    },
  });

  const days = await prisma.day.findMany({
    select: {
      date: true,
      revenue: true,
    },
    where: {
      projectId: project.id,
    },
    take: 1000,
  });

  const revenue = {
    now: now.sum.revenue, // total revenue as of now
    oneDayAgo: await getRevenueFromDB(project.id, utcOneDayBack, prisma), // total revenue as of 1 day ago
    twoDaysAgo: await getRevenueFromDB(project.id, utcTwoDaysBack, prisma), // total revenue as of two days ago
    oneWeekAgo: await getRevenueFromDB(project.id, utcOneWeekBack, prisma), // total revenue as of one week ago
    twoWeeksAgo: await getRevenueFromDB(project.id, utcTwoWeeksBack, prisma), // total revenue as of two weeks ago
    thirtyDaysAgo: await getRevenueFromDB(
      project.id,
      utcThirtyDaysBack,
      prisma
    ), // total revenue as of thirty days ago
    sixtyDaysAgo: await getRevenueFromDB(project.id, utcSixtyDaysBack, prisma), // total revenue as of sixty days ago
    ninetyDaysAgo: await getRevenueFromDB(
      project.id,
      utcNinetyDaysBack,
      prisma
    ), // total revenue as of ninety days ago
  };
  const tmp = {
    revenue: registry[name].paymentType === "dilution" ? EMPTY : revenue,
    dilution: registry[name].paymentType === "dilution" ? revenue : EMPTY,
    days: days,
  };

  return tmp;
};

const getRevenueFromDB = async (projectId, date, prisma) => {
  const rev = await prisma.day.aggregate({
    where: {
      projectId: projectId,
      date: {
        lte: date,
      },
    },
    sum: {
      revenue: true,
    },
  });

  if (rev.sum.revenue == null) {
    return 0;
  }

  return rev.sum.revenue;
};

const getRevenueByBlock = async (id, blockNumber) => {
  return await request(
    process.env.NEXT_PUBLIC_SUBGRAPH,
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

const getUsageFromSubgraph = async (id) => {
  const data = await request(
    process.env.NEXT_PUBLIC_SUBGRAPH,
    gql`
      query ($id: String!) {
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

  const [
    oneDayBlock,
    twoDayBlock,
    oneWeekBlock,
    twoWeekBlock,
    thirtyDayBlock,
    sixtyDayBlock,
    ninetyDayBlock,
  ] = await getBlocksFromTimestamps([
    utcOneDayBack,
    utcTwoDaysBack,
    utcOneWeekBack,
    utcTwoWeeksBack,
    utcThirtyDaysBack,
    utcSixtyDaysBack,
    utcNinetyDaysBack,
  ]);

  const oneDayResult = await getRevenueByBlock(id, oneDayBlock);
  const twoDayResult = await getRevenueByBlock(id, twoDayBlock);
  const oneWeekResult = await getRevenueByBlock(id, oneWeekBlock);
  const twoWeekResult = await getRevenueByBlock(id, twoWeekBlock);
  const thirtyDayResult = await getRevenueByBlock(id, thirtyDayBlock);
  const sixtyDayResult = await getRevenueByBlock(id, sixtyDayBlock);
  const ninetyDayResult = await getRevenueByBlock(id, ninetyDayBlock);

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

  const revenue = {
    now: +data.protocol.revenueUSD,
    oneDayAgo: +oneDayResult.protocol.revenueUSD,
    twoDaysAgo: +twoDayResult.protocol.revenueUSD,
    oneWeekAgo: +oneWeekResult.protocol.revenueUSD,
    twoWeeksAgo: +twoWeekResult.protocol.revenueUSD,
    thirtyDaysAgo: +thirtyDayResult.protocol.revenueUSD,
    sixtyDaysAgo: +sixtyDayResult.protocol.revenueUSD,
    ninetyDaysAgo: +ninetyDayResult.protocol.revenueUSD,
  };
  return {
    revenue,
    dilution: registry[id].paymentType === "dilution" ? revenue : EMPTY,
    days,
  };
};

export const getMarketDataFromCoingecko = async (id) => {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
  const data = await res.json();
  return {
    price: data.market_data.current_price.usd,
    marketCap: data.market_data.market_cap.usd,
    circulatingSupply: data.market_data.circulating_supply,
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

    // make sure days in endpoint provided are sorted ascending
    usage.days.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1));
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
