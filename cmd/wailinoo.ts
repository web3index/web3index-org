import prisma from "../lib/prisma";

const endpoint = "https://api.wailinoo.io/web3-index/revenue";
const conversionFactor = 1;
const axios = require("axios");

const coin = {
  name: "wailinoo",
  symbol: "WLO",
};

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const wailinooImport = async () => {
  console.log("Getting project id for ", coin.name);
  const project = await getProject(coin.name);

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

  console.log("Project id: ", project);
  const lastId = project.lastImportedId;
  const parsedId = parseInt(lastId, 10);
  if (isNaN(parsedId)) {
    throw new Error("unable to parse int.");
  }

  const toDate = new Date();
  toDate.setUTCHours(0, 0, 0, 0);

  console.log("Project: " + project.name + " - to date: " + toDate);

  const response = await axios.get(endpoint).catch(function (error) {
    console.log("Error getting data from endpoint ", endpoint, error);
  });

  console.log("response: ", response.data);
  console.log(response.data.days.length);
  console.log(response.data.days[0]);

  for (let index = 0; index < response.data.days.length - 1; index++) {
    const element = response.data.days[index];
    console.log(
      "Store day " +
        element.date +
        " to DB - value: " +
        element.revenue * conversionFactor
    );
    const fee = {
      date: element.date,
      fees: element.revenue * conversionFactor,
      blockHeight: element.date.toString(),
    };
    await storeDBData(fee, project.id);
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

console.log("import wailinoo");

wailinooImport()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
