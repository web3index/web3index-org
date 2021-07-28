import prisma from "../lib/prisma";

const endpoint = "https://api.helium.io/v1/dc_burns/sum";
const conversionFactor = 0.00001;
const bucket = "day";
const batchSize = 30;
const axios = require("axios");

const coin = {
  name: "helium",
  symbol: "HNT",
};

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

// Update Helium daily revenue data
// a cron job should hit this endpoint every half hour or so (can use github actions for cron)
const heliumImport = async () => {
  // Use the updatedAt field in the Day model and compare it with the
  // timestamp associated with the fee, if it's less than the timestamp
  // then update the day's revenue

  // Get last imported id: we will start importing from there
  const project = await getProject(coin.name);
  const lastId = project.lastImportedId;
  const parsedId = parseInt(lastId, 10);
  if (isNaN(parsedId)) {
    throw new Error("unable to parse int.");
  }

  let fromDate = new Date(parsedId * 1000);
  fromDate.setUTCHours(0, 0, 0, 0);
  let toDate = new Date();
  toDate.setUTCHours(0, 0, 0, 0);
  let exitLoop = false;

  while (!exitLoop) {
    if (dateDiffInDays(fromDate, toDate) > batchSize) {
      console.log("Batch size too big: setting it to " + batchSize);
      toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDate() + batchSize);
    } else {
      exitLoop = true;
    }

    console.log(
      "Project: " +
        project.name +
        ", from date: " +
        fromDate +
        " - to date: " +
        toDate
    );

    const response = await axios
      .get(endpoint, {
        params: {
          min_time: parseISODate(fromDate),
          max_time: parseISODate(toDate),
          bucket: bucket,
        },
      })
      .catch(function (error) {
        console.log(error);
      });

    const date = fromDate;
    for (let index = response.data.data.length - 1; index >= 0; index--) {
      const element = response.data.data[index];
      console.log(
        "Store day " +
          date +
          " - " +
          date.getTime() / 1000 +
          " to DB - value: " +
          element.state_channel * conversionFactor
      );
      const fee = {
        date: date.getTime() / 1000,
        fees: element.state_channel * conversionFactor,
        blockHeight: (date.getTime() / 1000).toString(),
      };
      await storeDBData(fee, project.id);
      date.setDate(date.getDate() + 1);
    }

    fromDate = toDate;
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate = new Date();
    toDate.setUTCHours(0, 0, 0, 0);
  }
  console.log("exit scrape function.");

  return;
};

const getProject = async (name: string) => {
  let project = await prisma.project.findFirst({
    where: {
      name: name,
    },
  });

  if (project == null) {
    console.log("Project " + name + " doesn't exist. Create it");
    await prisma.project.create({
      data: {
        name: name,
        lastImportedId: "1593561600",
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
  dayData: { date: any; fees: any; blockHeight?: string },
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

  // update lastBlockID
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

const padNumber = (n: number, width: number) => {
  const pad = "0";
  const retString = n + "";
  return retString.length >= width
    ? retString
    : new Array(width - retString.length + 1).join(pad) + retString;
};

const parseISODate = (date: Date) => {
  return (
    padNumber(date.getUTCFullYear(), 4) +
    "-" +
    padNumber(date.getUTCMonth() + 1, 2) +
    "-" +
    padNumber(date.getUTCDate(), 2) +
    "T" +
    padNumber(date.getUTCHours(), 2) +
    ":" +
    padNumber(date.getUTCMinutes(), 2) +
    ":" +
    padNumber(date.getUTCSeconds(), 2) +
    "Z"
  );
};

const dateDiffInDays = (a: Date, b: Date) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utc2 = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

heliumImport().then(() => {
  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(1)
});

