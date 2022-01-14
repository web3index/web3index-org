import prisma from "../lib/prisma";

// POKT Price API
const axios = require("axios");
const priceEndpoint =
  "http://ec2-35-177-209-25.eu-west-2.compute.amazonaws.com/prices/pokt";
const poktNetworkDataEndpoint = "https://poktscan.com/api/pokt-network/summary";

// .01 relays/pokt * 89% validator allocation
const relayToPOKTRatio = 0.01 * 0.89;

const coin = {
  name: "pocket",
  symbol: "POKT",
};

// Update Pocket Network daily revenue data
// a cron job should hit this endpoint every hour
const pocketImport = async () => {
  // This will fetch successfuly relays on the network for blockchains with revenue
  // and sum up the fees for the day, on an hourly basis; totalling to the day's revenue.
  let revenue = 0;
  let successfulRelays = 0;

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
  const dateDiff = dateDiffInDays(fromDate, toDate);

  const pocketPrices = await getPOKTDayPrices(
    formatDate(fromDate),
    formatDate(toDate)
  );

  let timeUnitMsg = "on day";

  for (const day of days) {
    const dayISO = formatDate(day); // YYYY-MM-DD
    const dateUnixTimestamp = day.getTime() / 1000;

    const { totalAppStakes, totalPOKTsupply, totalRelays1d, totalRelays1hr } =
      await getPOKTNetworkData(day);

    if (dateDiff >= 1) {
      // If data was last updated was more than a day ago,
      // we need to fetch all relays for the past days.
      successfulRelays = totalRelays1d;
    } else {
      // If data was last updated less than a day ago,
      // we will only update with data from the past hour.
      successfulRelays = totalRelays1hr;
      timeUnitMsg = "in the last hour of day";
    }

    console.log(
      `Successful relays ${timeUnitMsg} ${dayISO}: ${numberWithCommas(
        successfulRelays
      )}.`
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

    const blocks = data.blocks as BlockData[];

    const latestBlock: BlockData = filterLastBlock(blocks);
    const lastFourBlocks: BlockData[] = filterLastFourBlocks(blocks);

    const totalRelays1d = data.total_relays_completed;
    const totalRelays1hr = lastFourBlocks.reduce(
      (sum, block) => sum + block.total_relays_completed,
      0
    );

    return {
      totalAppStakes: latestBlock.apps_staked_tokens,
      totalPOKTsupply: latestBlock.total_supply,
      totalRelays1d,
      totalRelays1hr,
    };
  } catch (e) {
    throw new Error(e);
  }
};

const filterLastBlock = (blocksData: BlockData[]) => {
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

const filterLastFourBlocks = (blocksData: BlockData[]) => {
  let blockNumbers = [];
  const latestBlocks = [];

  blocksData.forEach(function (obj: BlockData) {
    blockNumbers.push(obj.height);
  });

  blockNumbers = blockNumbers
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .slice(0, 4);

  blocksData.forEach(function (obj: BlockData) {
    if (blockNumbers.includes(obj.height)) {
      latestBlocks.push(obj);
    }
  });

  return latestBlocks;
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

type DayPrice = {
  date: string;
  price: number;
};

type BlockData = {
  time: string;
  height: number;
  total_supply: number;
  apps_staked_tokens: number;
  total_relays_completed: number;
};

pocketImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
