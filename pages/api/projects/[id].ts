import { NextApiRequest, NextApiResponse } from "next";
import { request, gql } from "graphql-request";
import registry from "../../../registry.json";
import dayjs from "dayjs";
import { getSnapshots, getSubgraph, sumArrays } from "../../../lib/utils";
import prisma from "../../../lib/prisma";
import { Project } from "../../../types";

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

/** Returns a warning usage payload with null metrics. */
export const getEmptyUsageResponse = (warning?: string) => ({
  revenue: { ...EMPTY },
  dilution: { ...EMPTY },
  days: [],
  warning,
});

/** Creates a fallback project payload with warning metadata. */
export const buildFallbackProject = (
  project: string,
  warning: string,
): Project => {
  const base = registry[project] ?? {};
  return {
    ...base,
    slug: project,
    untracked: Boolean(base.untracked),
    usage: getEmptyUsageResponse(warning),
  } as Project;
};

/** Fetches historical usage from the Prisma database for legacy protocols. */
const getUsageFromDB = async (name) => {
  const project = await prisma.project.findFirst({
    where: {
      name: name,
    },
  });

  if (!project) {
    throw new Error("Project not found in database");
  }

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

  if (!days.length) {
    throw new Error("No revenue day data found in database");
  }

  const totalRevenue = now._sum.revenue ?? 0;
  const revenue = {
    now: totalRevenue, // total revenue as of now
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
  return {
    revenue: registry[name].paymentType === "dilution" ? EMPTY : revenue,
    dilution: registry[name].paymentType === "dilution" ? revenue : EMPTY,
    days: days,
  };
};

/** Aggregates total revenue up to a given timestamp for a project. */
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

/**
 * Fetches usage data from the Web3 Index subgraphs across multiple networks.
 * Returns a merged time series and revenue snapshots.
 */
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
    ).catch((error) => {
      console.warn("Failed to fetch subgraph usage data", {
        id,
        network: n,
        error,
      });
      return null;
    });
    dayDataPromises.push(data);
    snapshotPromises.push(
      getSnapshots(id, n).catch((error) => {
        console.warn("Failed to fetch snapshot data", {
          id,
          network: n,
          error,
        });
        return Array(7).fill(0);
      }),
    );
  });

  const dayDataResults = await Promise.all(dayDataPromises);
  const snapshotResults = await Promise.all(snapshotPromises);

  // Keep protocol responses in sync with snapshot arrays so we only sum valid networks.
  const dayData = [];
  const snapshotData = [];
  dayDataResults.forEach((result, index) => {
    if (result?.protocol) {
      dayData.push(result);
      const snapshotEntry = snapshotResults[index];
      snapshotData.push(
        Array.isArray(snapshotEntry) ? snapshotEntry : Array(7).fill(0),
      );
    }
  });

  if (!dayData.length) {
    throw new Error("No usage data available from subgraph");
  }

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

  if (days.length) {
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
  }

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

/**
 * Loads a project definition plus its usage data (subgraph/custom endpoint/DB).
 */
export const getProject = async (id) => {
  try {
    let usage;

    // if project is part of the web3 index subgraph get it from the subgraph
    if (registry[id].subgraphs) {
      usage = await getUsageFromSubgraph(id, registry[id].subgraphs);
    }
    // if project is providing its own usage endpoint, fetch it
    else if (registry[id].usage) {
      const res = await fetch(registry[id].usage);
      if (!res.ok) {
        throw new Error(`Usage endpoint returned status ${res.status}`);
      }
      usage = await res.json();

      // make sure days in endpoint provided are sorted ascending
      usage.days.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1));

      // Remove negative usage.
      let clamped = false;
      usage.days = usage.days.map((day) => {
        const original = +day.revenue;
        const revenue = Math.max(original, 0);
        clamped = clamped || revenue !== original;
        return { ...day, revenue };
      });
      if (clamped) {
        console.warn("Clamped negative revenue values from custom endpoint", {
          id,
          endpoint: registry[id].usage,
        });
      }
    }
    // else get usage from the Web3 Index DB
    else {
      usage = await getUsageFromDB(id);
    }

    return {
      ...registry[id],
      slug: id,
      untracked: Boolean(registry[id]?.untracked),
      usage,
    };
  } catch (error) {
    const warning =
      error instanceof Error && error.message
        ? error.message
        : "Could not fetch usage data for this project.";
    console.warn("Falling back to empty usage payload for project", {
      id,
      warning,
      error,
    });
    return buildFallbackProject(id, warning);
  }
};

/** Next.js API route handler that returns a single project payload. */
const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProject(_req.query.id);
  res.json(project);
};

export default handler;
