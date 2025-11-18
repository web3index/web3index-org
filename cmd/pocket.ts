import prisma from "../lib/prisma";
import { fetchCryptoComparePrice } from "./utils/cryptoCompare";

const axios = require("axios");
const poktscanAPIKey = process.env.POKTSCAN_API_KEY;

// POKT Pricing & Network Data Endpoints
const poktscanAPIEndpoint = "https://api.poktscan.com/poktscan/api/graphql";

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

  const pocketPrices = await getPOKTDayPrices(fromDate, toDate);

  for (const day of days) {
    const dayISO = formatDate(day); // YYYY-MM-DDTHH:mm:ss.SSSZ
    const dateUnixTimestamp = day.getTime() / 1000;

    const { totalBurned } = await getPOKTNetworkData(day);

    console.log(day, totalBurned);

    const currentDayPrice = pocketPrices.find(
      (x) => x.date === dayISO.slice(0, 10),
    );

    if (!currentDayPrice) {
      console.warn("No price found for", dayISO);
      continue;
    }

    console.log("totalBurned", totalBurned);
    console.log("currentDayPrice.price", currentDayPrice.price);

    revenue = totalBurned * currentDayPrice.price;

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
  const dayPrices: DayPrice[] = [];
  for (
    let cursor = new Date(dateFrom);
    cursor <= dateTo;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const timestamp = Math.floor(cursor.getTime() / 1000);
    const price = await fetchCryptoComparePrice(coin.symbol, timestamp);
    dayPrices.push({ date: cursor.toISOString().slice(0, 10), price });
  }
  return dayPrices;
};

const getPOKTNetworkData = async (date: Date) => {
  try {
    const ISODateFrom = formatDate(date);
    const ISODateTo = new Date(
      new Date(date.toString()).setDate(date.getDate() + 1),
    ).toISOString();

    console.log("ISODateFrom", ISODateFrom);
    console.log("ISODateTo", ISODateTo);

    const data = JSON.stringify({
      query: `query ($pagination: ListInput!) {
        ListPoktTransaction(pagination: $pagination) {
          items {
            amount
            block_time
            result_code
          }
        }
      }`,
      // TODO: Make use of hourly data instead of days
      variables: {
        pagination: {
          limit: 10,
          filter: {
            operator: "AND",
            properties: [
              {
                operator: "EQ",
                type: "STRING",
                property: "type",
                value: "dao_tranfer",
              },
              {
                operator: "EQ",
                type: "STRING",
                property: "action",
                value: "dao_burn",
              },
              {
                operator: "GTE",
                type: "DATE",
                property: "block_time",
                value: ISODateFrom,
              },
              {
                operator: "LT",
                type: "DATE",
                property: "block_time",
                value: ISODateTo,
              },
            ],
          },
        },
      },
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: poktscanAPIEndpoint,
      headers: {
        Authorization: poktscanAPIKey,
        "Content-Type": "application/json",
      },
      data,
    };

    const response: PoktScanResponse = await axios.request(config);

    if (!response || !response.data) {
      throw new Error("No data returned by the PoktScan API.");
    }

    // This is the total burned for a single day
    const totalBurned = response.data.data.ListPoktTransaction.items
      .filter((burnTx) => burnTx.result_code === 0)
      .reduce((sum, burnTx) => sum + burnTx.amount, 0);

    return {
      totalBurned: totalBurned / 1000000, // uPOKT to POKT
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

type PoktScanTransaction = {
  amount: number;
  block_time: string;
  result_code: number;
};

type PoktScanTransactionList = {
  items: PoktScanTransaction[];
};

type PoktScanResponse = {
  data: {
    data: {
      ListPoktTransaction: PoktScanTransactionList;
    };
  };
};

pocketImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
