import axios from "axios";
import prisma from "../lib/prisma";

const endpoint = "https://console-api.akash.network/v1/dashboard-data";

type DashboardPoint = {
  date: string;
  dailyUUsdSpent: number;
};

type DashboardResponse = {
  now: DashboardPoint;
  compare?: DashboardPoint;
};

const coin = {
  name: "akash",
  symbol: "AKT",
};

// Update akash daily revenue data
// a cron job should hit this endpoint every half hour or so (can use github actions for cron)
const akashImport = async () => {
  // Use the updatedAt field in the Day model and compare it with the
  // timestamp associated with the fee, if it's less than the timestamp
  // then update the day's revenue

  // Get last imported id: we will start importing from there
  console.log("Getting project id for ", coin.name);
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

  console.log("Project id: ", project);
  const lastId = parseInt(project.lastImportedId, 10);
  if (Number.isNaN(lastId)) {
    throw new Error("unable to parse int.");
  }

  console.log("Project: " + project.name + " - last imported: " + lastId);

  let responseData: DashboardResponse;
  try {
    const response = await axios.get<DashboardResponse>(endpoint);
    responseData = response.data;
  } catch (error) {
    console.log("Error getting data from endpoint ", endpoint, error);
    return;
  }

  const points = [responseData.now, responseData.compare].filter(
    (p): p is DashboardPoint =>
      !!p?.date && typeof p.dailyUUsdSpent === "number",
  );

  const orderedPoints = points.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (const point of orderedPoints) {
    const timestamp = getMidnightUnixTimestamp(point.date);
    if (timestamp <= lastId) {
      continue;
    }

    const usdValue = point.dailyUUsdSpent / 1_000_000; // convert uUSD -> USD
    console.log(
      "Store day " +
        point.date +
        " to DB - value: " +
        usdValue.toLocaleString(),
    );

    const fee = {
      date: timestamp,
      fees: usdValue,
    };
    await storeDBData(fee, project.id);
  }
  console.log("exit scrape function.");
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

const getMidnightUnixTimestamp = (dateInput: string | number | Date) => {
  const date = new Date(dateInput);
  date.setUTCHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

console.log("import akash");

akashImport()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
