import prisma from "../lib/prisma";

// POKT Price API
const axios = require("axios");
const priceEndpoint =
  "http://ec2-35-177-209-25.eu-west-2.compute.amazonaws.com/prices/pokt";
const poktNetworkDataEndpoint = "https://poktscan.com/api/pokt-network/summary";

// Pocket Network Metrics
const { InfluxDB } = require("@influxdata/influxdb-client");
const influxURL = "https://influx.portal.pokt.network:8086";
const influxToken = process.env.POCKET_INFLUX_TOKEN;
const influxOrg = "pocket";
const influxClient = new InfluxDB({
  url: influxURL,
  token: influxToken,
  timeout: 600000,
});

// .01 relays/pokt * 89% validator allocation
const relayToPOKTRatio = 0.01 * 0.89;

const queryApi = influxClient.getQueryApi(influxOrg);

const coin = {
  name: "pocket",
  symbol: "POKT",
};

// Update Pocket Network daily revenue data
// a cron job should hit this endpoint every hour
const pocketImport = async () => {
  // This will fetch successfuly relays on the network for blockchains with revenue
  // and sum up the fees for the day, on an hourly basis; totalling to the day's revenue.
  let results: any[] = [];
  let successfulRelays = 0;
  let revenue = 0;
  let fluxQuery = "";

  const revenueBlockchains = `["0001","0003","0004","0005","000A","0006","0007","0009","000B","0010","0021","0022","0023","0024","0025","0026","0027","000C","0028", "0040"]`;

  const project = await getProject(coin.name);
  const lastId = project.lastImportedId;
  const parsedId = parseInt(lastId);

  if (isNaN(parsedId)) {
    throw new Error("Unable to parse int.");
  }

  const fromDate = new Date(parsedId * 1000);
  fromDate.setUTCHours(0, 0, 0, 0);
  const toDate = new Date();
  toDate.setUTCHours(0, 0, 0, 0);

  const days = dateRangeToList(fromDate, toDate);
  const dateDiff = dateDiffInDays(fromDate, toDate);

  const pocketPrices = await getPOKTDayPrices(
    formatDate(fromDate),
    formatDate(toDate)
  );

  for (const day of days) {
    const dayISO = formatDate(day); // YYYY-MM-DD

    const { totalAppStakes, totalPOKTsupply } = await getPOKTNetworkData(day);

    if (dateDiff >= 1) {
      // If data was last updated was more than a day ago,
      // we need to fetch all relays for the past days.
      fluxQuery = `
        from(bucket: "mainnetRelayApp1d")
        |> range(start: ${dayISO}T00:00:00Z, stop: ${dayISO}T23:59:59Z)
          |> filter(fn: (r) =>
            r._measurement == "relay" and
            r._field == "count" and
            (r.method != "synccheck" and r.method != "chaincheck") and
            contains(value: r["blockchain"], set: ${revenueBlockchains}) and
            r.result == "200" and
            r.nodePublicKey == "network"
          )
        `;
    } else {
      // If data was last updated less than a day ago,
      // we will only update with data from the past hour.
      fluxQuery = `
        from(bucket: "mainnetRelayApp60m")
          |> range(start: -1h)
          |> filter(fn: (r) =>
            r._measurement == "relay" and
            r._field == "count" and
            (r.method != "synccheck" and r.method != "chaincheck") and
            contains(value: r["blockchain"], set: ${revenueBlockchains}) and
            r.result == "200" and
            r.nodePublicKey == "network"
          )
        `;
    }

    results = (await queryApi.collectRows(fluxQuery)) as any[];

    if (results.length > 0) {
      successfulRelays = countRelays(results);
    }
    console.log(
      `Successful relays on ${dayISO}: ${numberWithCommas(successfulRelays)}.`
    );

    const { price: currentDayPrice } = pocketPrices.find(
      (x) => x.date === dayISO
    );

    if (successfulRelays > 0 && currentDayPrice > 0) {
      revenue =
        (totalAppStakes / totalPOKTsupply) *
        (successfulRelays * relayToPOKTRatio * currentDayPrice);
    }

    console.log(
      `${project.name} estimated revenue on ${dayISO}: ${revenue.toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        }
      )} USD.`
    );

    const dateUnixTimestamp = day.getTime() / 1000;

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
        lastImportedId: "1625112000", // July 1st 2021
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
    date: any;
    fees: any;
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
    const accruedRevenue = day.revenue + dayData.fees;

    await prisma.day.update({
      where: {
        id: day.id,
      },
      data: {
        revenue: accruedRevenue,
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

const getPOKTDayPrices = async (dateFrom: string, dateTo: string) => {
  const dayPrices: DayPrice[] = [];
  try {
    const { data: response } = await axios.get(
      `${priceEndpoint}?date_from=${dateFrom}&date_to=${dateTo}`
    );

    if (!response) {
      throw new Error("No data returned by the price API.");
    }

    for (const entry of response.data) {
      const price = parseFloat(entry.price);
      const date = String(entry.created_date);

      dayPrices.push({ price, date } as DayPrice);
    }

    return dayPrices;
  } catch (e) {
    throw new Error(e);
  }
};

const getPOKTNetworkData = async (date: Date) => {
  const dateFrom = date;
  const ISODateFrom = formatDate(dateFrom);

  const dateTo = new Date(dateFrom.setUTCDate(dateFrom.getUTCDate() + 1));
  const ISODateTo = formatDate(dateTo);

  // TODO: Make use of hourly data instead of days
  const payload = { from: ISODateFrom, to: ISODateTo, debug: true };

  try {
    const { data: response } = await axios.post(
      poktNetworkDataEndpoint,
      payload
    );

    if (!response) {
      throw new Error("No data returned by the poktscan API.");
    }

    const [data] = response;

    const entry: BlockData = pickEntry(data.blocks);

    return {
      totalAppStakes: entry.apps_staked_tokens,
      totalPOKTsupply: entry.total_supply,
    };
  } catch (e) {
    throw new Error(e);
  }
};

const pickEntry = (blocksData: BlockData[]) => {
  let maxid = 0;
  let maxObj: BlockData;

  blocksData.forEach(function (obj: BlockData) {
    if (obj.height > maxid) {
      maxObj = obj;
      maxid = maxObj.height;
    }
  });

  return maxObj as BlockData;
};

const dateDiffInDays = (fromDate: Date, toDate: Date): number => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(
    fromDate.getUTCFullYear(),
    fromDate.getUTCMonth(),
    fromDate.getUTCDate()
  );
  const utc2 = Date.UTC(
    toDate.getUTCFullYear(),
    toDate.getUTCMonth(),
    toDate.getUTCDate()
  );

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
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
  return date.toISOString().slice(0, 10);
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const countRelays = (influxResponse: any): number => {
  let counter = 0;

  for (const relayObject of influxResponse) {
    counter += relayObject._value;
  }

  return counter;
};

type DayPrice = {
  date: string;
  price: number;
};

type BlockData = {
  height: number;
  time: string;
  apps_staked_tokens: number;
  total_supply: number;
};

pocketImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
