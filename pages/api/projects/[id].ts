import { NextApiRequest, NextApiResponse } from "next";
import { request, gql } from "graphql-request";
import registry from "../../../registry.json";
import dayjs from "dayjs";
import { getSnapshots, getSubgraph, sumArrays } from "../../../lib/utils";
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
    _sum: {
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
    take: 2000,
  });

  const revenue = {
    now: now._sum.revenue, // total revenue as of now
    oneDayAgo: await getRevenueFromDB(project.id, utcOneDayBack, prisma), // total revenue as of 1 day ago
    twoDaysAgo: await getRevenueFromDB(project.id, utcTwoDaysBack, prisma), // total revenue as of two days ago
    oneWeekAgo: await getRevenueFromDB(project.id, utcOneWeekBack, prisma), // total revenue as of one week ago
    twoWeeksAgo: await getRevenueFromDB(project.id, utcTwoWeeksBack, prisma), // total revenue as of two weeks ago
    thirtyDaysAgo: await getRevenueFromDB(
      project.id,
      utcThirtyDaysBack,
      prisma,
    ), // total revenue as of thirty days ago
    sixtyDaysAgo: await getRevenueFromDB(project.id, utcSixtyDaysBack, prisma), // total revenue as of sixty days ago
    ninetyDaysAgo: await getRevenueFromDB(
      project.id,
      utcNinetyDaysBack,
      prisma,
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
    _sum: {
      revenue: true,
    },
  });

  if (rev._sum.revenue == null) {
    return 0;
  }

  return rev._sum.revenue;
};

const getUsageFromSubgraph = async (id, networks) => {
  const dayDataPromises = [];
  const snapshotPromises = [];
  networks.map((n) => {
    const data = request(
      getSubgraph(n),
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
      { id },
    );
    dayDataPromises.push(data);
    snapshotPromises.push(getSnapshots(id, n));
  });

  const dayData = await Promise.all(dayDataPromises);
  const snapshotData = await Promise.all(snapshotPromises);

  let totalRevenue = 0;
  dayData.map((d) => {
    totalRevenue += +d.protocol.revenueUSD;
  });

  const [
    oneDayAgo,
    twoDaysAgo,
    oneWeekAgo,
    twoWeeksAgo,
    thirtyDaysAgo,
    sixtyDaysAgo,
    ninetyDaysAgo,
  ] = [...sumArrays(...snapshotData)];

  const dayIndexSet = new Set();
  const oneDay = 24 * 60 * 60;

  let daysRaw = [];
  dayData.map((d) => {
    daysRaw = [...daysRaw, ...d.protocol.days];
  });

  let days = [];
  daysRaw.forEach((day) => {
    dayIndexSet.add((day.date / oneDay).toFixed(0));
    days.push({
      date: day.date,
      // ignore revenue from day the graph migrated to arbitrum
      revenue: id == "thegraph" && day.date == 1670889600 ? 0 : +day.revenueUSD,
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
    // ignore revenue from day the graph migrated to arbitrum
    now: totalRevenue,
    oneDayAgo,
    twoDaysAgo,
    oneWeekAgo,
    twoWeeksAgo,
    thirtyDaysAgo,
    sixtyDaysAgo,
    ninetyDaysAgo,
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
  if (registry[id].subgraphs) {
    usage = await getUsageFromSubgraph(id, registry[id].subgraphs);
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

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProject(_req.query.id);
  res.json(project);
};

export default handler;
