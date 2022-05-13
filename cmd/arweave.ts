import prisma from "../lib/prisma";

const params = new URLSearchParams({
  interval: "daily",
  daily_granularity: "project",
});
const endpoint = "https://api.tokenterminal.com/v1/projects/arweave/metrics";
const axios = require("axios");

const coin = {
  name: "arweave",
  symbol: "AR",
};

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

// Update arweave daily revenue data
// a cron job should hit this endpoint every half hour or so (can use github actions for cron)
const arweaveImport = async () => {
  // Use the updatedAt field in the Day model and compare it with the
  // timestamp associated with the fee, if it's less than the timestamp
  // then update the day's revenue

  // Get last imported id: we will start importing from there
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

  const response = await axios
    .get(endpoint, {
      params: params,
      headers: { Authorization: "Bearer " + process.env.TOKENTERMINAL_API_KEY },
    })
    .catch(function (error) {
      console.log(error);
    });

  const days = project.days;
  let lastDate: any;

  if (isNaN(days)) {
    lastDate = new Date(
      response.data[response.data.length - 1].datetime.split("+")[0]
    );
  } else {
    lastDate = new Date(days[-1].date);
  }

  const fromDate = lastDate;
  fromDate.setUTCHours(0, 0, 0, 0);

  console.log("Project: " + project.name + ", from date: " + fromDate);

  const toDate = new Date();
  toDate.setUTCHours(0, 0, 0, 0);

  const difference = dateDiffInDays(fromDate, toDate);

  for (let index = difference; index >= 0; index--) {
    const element = response.data.filter((obj) => {
      const objDate = new Date(obj.datetime.split("+")[0]);
      objDate.setUTCHours(0, 0, 0, 0);
      return objDate.getTime() === fromDate.getTime();
    })[0];

    if (element === undefined) {
      console.log("In continue");
      fromDate.setDate(fromDate.getDate() + 1);
      continue;
    }

    const fee = {
      date: fromDate.getTime() / 1000,
      fees: element.revenue,
    };

    console.log(
      "Store day " +
        fromDate +
        " - " +
        fromDate.getTime() / 1000 +
        "to DB - " +
        fee.fees
    );
    await storeDBData(fee, project.id);
    fromDate.setDate(fromDate.getDate() + 1);
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
        lastImportedId: "0",
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

const dateDiffInDays = (a: Date, b: Date) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utc2 = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

arweaveImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
