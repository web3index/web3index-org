import prisma from "../lib/prisma";

const axios = require("axios");
const cmcAPIKey = process.env.CMC_API_KEY;
const poktscanAPIKey = process.env.POKTSCAN_API_KEY;

// POKT Pricing & Network Data Endpoints
const cmcAPIEndpoint =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical";
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

    const { price: currentDayPrice } = pocketPrices.find(
      (x) => x.date === dayISO
    );

    revenue = totalBurned * currentDayPrice;

    console.log(
      `${project.name} estimated revenue on ${dayISO}: ${revenue.toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        }
      )} USD.`
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
  projectId: number
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
  try {
    const monthDiff = (d1, d2) => {
      let months;
      months = (d2.getFullYear() - d1.getFullYear()) * 12;
      months -= d1.getMonth();
      months += d2.getMonth();
      return months <= 0 ? 0 : months;
    };

    const totalMonths = monthDiff(dateFrom, dateTo);

    const addMonth = (date, months) => {
      const d1 = new Date(date.toString());
      const d2 = d1.getDate();
      d1.setMonth(new Date(date.toString()).getMonth() + +months);
      if (new Date(date.toString()).getDate() != d2) {
        d1.setDate(0);
      }
      return d1.toISOString();
    };

    const dateFromISO = formatDate(dateFrom);
    const dateFromISOArr = [dateFromISO];

    for (let i = 0; i < totalMonths; i++) {
      const newMonth = addMonth(dateFromISOArr[i], 1);
      dateFromISOArr.push(newMonth);
    }

    // Can only request one month of items at a time from cmc
    for (const d1 of dateFromISOArr) {
      if (new Date(d1).getTime() < new Date().getTime()) {
        const d2 = addMonth(d1, 1);
        const { data: response }: { data: Response } = await axios.get(
          `${cmcAPIEndpoint}?symbol=POKT&time_start=${d1}&time_end=${d2}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-CMC_PRO_API_KEY": cmcAPIKey,
            },
          }
        );

        if (!response) {
          throw new Error("No data returned by the price API.");
        }

        const uniqueDates = new Set<string>();
        const dateQuotes: { [date: string]: number[] } = {};

        response.data.quotes.forEach((quote) => {
          const date = quote.timestamp.slice(0, 10);
          uniqueDates.add(date);
          if (!dateQuotes[date]) {
            dateQuotes[date] = [];
          }
          if (quote?.quote?.USD.price) {
            dateQuotes[date].push(quote?.quote?.USD.price);
          }
        });

        const averagePrices: { [date: string]: number } = {};

        Array.from(uniqueDates).forEach((date) => {
          const prices = dateQuotes[date];
          const sum = prices.reduce((acc, price) => acc + price, 0);
          const average = sum / prices.length;
          averagePrices[date] = average;
        });

        for (const [date, price] of Object.entries(averagePrices)) {
          dayPrices.push({ date, price });
        }
      }
    }

    return dayPrices;
  } catch (e) {
    throw new Error(e);
  }
};

const getPOKTNetworkData = async (date: Date) => {
  try {
    const ISODate = formatDate(date);
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
                value: ISODate,
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
      totalBurned,
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

type Quote = {
  timestamp: string;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      market_cap: number;
      total_supply: number;
      circulating_supply: number;
      timestamp: string;
    };
  };
};

type Response = {
  status: {
    timestamp: string;
    error_code: number;
    error_message: null | string;
    elapsed: number;
    credit_count: number;
    notice: null | string;
  };
  data: {
    quotes: Quote[];
    id: number;
    name: string;
    symbol: string;
    is_active: number;
    is_fiat: number;
  };
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
