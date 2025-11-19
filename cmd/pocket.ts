/**
 * @file This script retrieves Pocket transaction fee data via the PoktScan GraphQL API.
 * I however haven't found a reliable way to use this endpoint without running into
 * timeout problems. As a result I disabled tracking of pocket right now. If you have a
 * solution please open an issue or PR.
 */
import prisma from "../lib/prisma";
import {
  fetchCryptoCompareDailyPrices,
  fetchCryptoComparePrice,
} from "./utils/cryptoCompare";

const axios = require("axios");
const poktscanAPIKey = process.env.POKTSCAN_API_KEY;

// POKT Pricing & Network Data Endpoints
const poktscanAPIEndpoint = "https://api.poktscan.com/poktscan/api/graphql";
const TX_FEES_BY_DATE_QUERY = `
  query TxFeesByDate($start: Datetime!, $end: Datetime!, $after: Cursor) {
    transactions(
      first: 50
      after: $after
      filter: {
        block: {
          timestamp: { greaterThanOrEqualTo: $start, lessThan: $end }
        }
      }
    ) {
      totalCount
      nodes {
        fees
        block {
          timestamp
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const coin = {
  name: "pocket",
  symbol: "POKT",
};

// Update Pocket Network daily revenue data
// a cron job should hit this endpoint every hour
const pocketImport = async () => {
  let revenue = 0;

  const project = await getProject(coin.name);

  // Delete project if delete: true
  const deleteProject = project.delete;
  if (deleteProject) {
    await prisma.project.update({
      where: {
        name: coin.name,
      },
      data: {
        delete: false,
        lastImportedId: "0",
      },
    });
  }

  const lastId = project.lastImportedId;
  const parsedId = parseInt(lastId);

  if (isNaN(parsedId)) {
    throw new Error("Unable to parse int.");
  }

  const fromDate = new Date(parsedId * 1000);
  const toDate = new Date();

  const days = dateRangeToList(fromDate, toDate);

  console.log(
    `Starting ${project.name} import: fetching POKT daily prices between ${fromDate.toISOString()} and ${toDate.toISOString()}`,
  );
  const pocketPrices = await getPOKTDayPrices(fromDate, toDate);

  for (const day of days) {
    const dayISO = formatDate(day); // YYYY-MM-DDTHH:mm:ss.SSSZ
    const dateUnixTimestamp = day.getTime() / 1000;

    const { totalFees } = await getPOKTNetworkData(day);

    console.log(day, totalFees);

    const currentDayPrice = pocketPrices.find(
      (x) => x.date === dayISO.slice(0, 10),
    );

    if (!currentDayPrice) {
      console.warn("No price found for", dayISO);
      continue;
    }

    console.log("totalFees", totalFees);
    console.log("currentDayPrice.price", currentDayPrice.price);

    revenue = totalFees * currentDayPrice.price;

    console.log(
      `${project.name} estimated revenue on ${dayISO}: ${revenue.toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        },
      )} USD.`,
    );

    const fee = {
      date: dateUnixTimestamp,
      fees: revenue,
    };

    await storeDBData(fee, project.id);
  }

  console.log("Finished updating pocket revenue...");

  return;
};

const getProject = async (name: string) => {
  let project = await prisma.project.findFirst({
    where: {
      name: name,
    },
  });

  if (project == null) {
    console.log(`Project ${name} doesn't exist. Create it`);
    await prisma.project.create({
      data: {
        name: name,
        lastImportedId: "1684195200", // May 16th, 2023
      },
    });

    project = await prisma.project.findUnique({
      where: {
        name: name,
      },
    });
  }

  return project;
};

const storeDBData = async (
  dayData: {
    date: number;
    fees: number;
  },
  projectId: number,
) => {
  const day = await prisma.day.findFirst({
    where: {
      date: dayData.date,
      projectId: projectId,
    },
  });

  if (day != null) {
    await prisma.day.update({
      where: {
        id: day.id,
      },
      data: {
        revenue: dayData.fees,
      },
    });
  } else {
    await prisma.day.create({
      data: {
        date: dayData.date,
        revenue: dayData.fees,
        projectId: projectId,
      },
    });
  }

  // update project's last updated date
  await prisma.project.updateMany({
    where: {
      name: coin.name,
    },
    data: {
      lastImportedId: dayData.date.toString(),
    },
  });

  return;
};

const getPOKTDayPrices = async (dateFrom: Date, dateTo: Date) => {
  const startTimestamp = Math.floor(dateFrom.getTime() / 1000);
  const endTimestamp = Math.floor(dateTo.getTime() / 1000);
  const priceMap = await fetchCryptoCompareDailyPrices(
    coin.symbol,
    startTimestamp,
    endTimestamp,
  );

  const dayPrices: DayPrice[] = [];
  for (
    let cursor = new Date(dateFrom);
    cursor <= dateTo;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const normalized = Math.floor(cursor.getTime() / 1000 / 86400) * 86400;
    let price = priceMap.get(normalized);
    if (price === undefined) {
      price = await fetchCryptoComparePrice(coin.symbol, normalized);
    }

    dayPrices.push({ date: cursor.toISOString().slice(0, 10), price });
  }
  return dayPrices;
};

const getPOKTNetworkData = async (date: Date) => {
  try {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    console.log("ISODateFrom", start.toISOString());
    console.log("ISODateTo", end.toISOString());

    const totalFees = await fetchTotalFeesForRange(
      start.toISOString(),
      end.toISOString(),
    );

    return {
      totalFees,
    };
  } catch (e) {
    throw new Error(e);
  }
};

const dateRangeToList = (fromDate: Date, toDate: Date): Date[] => {
  const dayList: Date[] = [];

  for (
    let dt = new Date(fromDate);
    dt <= toDate;
    dt.setDate(dt.getDate() + 1)
  ) {
    dayList.push(new Date(dt));
  }

  return dayList;
};

const formatDate = (date: Date) => {
  return date.toISOString();
};

type DayPrice = {
  date: string;
  price: number;
};

type PoktScanResponse = {
  data?: {
    transactions?: {
      nodes?: { fees?: number | string | null }[];
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
    };
  };
  errors?: { message?: string }[];
};

const ensurePoktScanHeaders = () => {
  if (!poktscanAPIKey) {
    throw new Error("POKTSCAN_API_KEY environment variable is not set.");
  }
  return {
    Authorization: poktscanAPIKey,
    "Content-Type": "application/json",
  };
};

const fetchTotalFeesForRange = async (startISO: string, endISO: string) => {
  let cursor: string | null = null;
  let hasNextPage = true;
  let totalFees = 0;

  while (hasNextPage) {
    const payload = {
      query: TX_FEES_BY_DATE_QUERY,
      variables: {
        start: startISO,
        end: endISO,
        after: cursor,
      },
    };

    let data;
    try {
      ({ data } = await axios.post(
        poktscanAPIEndpoint,
        JSON.stringify(payload),
        {
          headers: ensurePoktScanHeaders(),
        },
      ));
    } catch (error: any) {
      const status = error?.response?.status;
      const statusText = error?.response?.statusText;
      const body = error?.response?.data;
      console.error(
        `PoktScan request failed (${status ?? "unknown"} ${
          statusText ?? ""
        }) body: ${JSON.stringify(body)}`,
      );
      throw error;
    }

    const response: PoktScanResponse = data;

    if (response.errors?.length) {
      throw new Error(
        `PoktScan GraphQL error: ${JSON.stringify(response.errors)}`,
      );
    }

    const transactions = response.data?.transactions;
    if (!transactions) {
      throw new Error("PoktScan GraphQL response missing transactions data.");
    }

    const nodes = transactions.nodes ?? [];
    totalFees += nodes.reduce((sum, node) => {
      const feeValue = normalizeNumber(node.fees);
      return sum + feeValue;
    }, 0);

    hasNextPage = Boolean(transactions.pageInfo?.hasNextPage);
    cursor = hasNextPage ? (transactions.pageInfo?.endCursor ?? null) : null;
  }

  return totalFees;
};

const normalizeNumber = (value: string | number | null | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

pocketImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
