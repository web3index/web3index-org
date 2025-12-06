import prisma from "../lib/prisma";
import type { Day, Project } from "@prisma/client";

const axios = require("axios");

const coin = {
  name: "filecoin",
  symbol: "FIL",
};

// Spacescope gas endpoints allow <31 days per request, so chunk accordingly
const MAX_DAYS_PER_REQUEST = 31;

// Update Filecoin daily revenue data
// a cron job should hit this endpoint every hour
const filecoinImport = async () => {
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

  const { fromDate, toDate } = getImportWindow(project);
  console.log(
    `Starting ${project.name} import: fetching revenues from ${fromDate.toISOString()} to ${toDate.toISOString()}`,
  );

  const revenues = await getFilecoinSupplySideRevenue(fromDate, toDate);

  for (const revenue of revenues) {
    console.log(
      "Store day " +
        new Date(revenue.date * 1000) +
        " - " +
        revenue.date +
        " to DB - " +
        revenue.fees,
    );
    await storeDBData(revenue, project.id);
  }

  console.log("exit scrape function.");
};

type ProjectWithDays = Project & { days: Pick<Day, "date">[] };

const getProject = async (name: string): Promise<ProjectWithDays> => {
  const includeDays = {
    days: {
      select: { date: true },
      orderBy: { date: "asc" },
    },
  } as const;

  let project = await prisma.project.findFirst({
    where: { name },
    include: includeDays,
  });

  if (!project) {
    console.log("Project " + name + " doesn't exist. Create it");
    await prisma.project.create({
      data: {
        name,
        lastImportedId: "0",
      },
    });

    project = await prisma.project.findUnique({
      where: { name },
      include: includeDays,
    });
  }

  if (!project) {
    throw new Error(`Unable to create or fetch project with name ${name}`);
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

const getImportWindow = (project: ProjectWithDays) => {
  const days = project.days ?? [];
  let lastDate: Date;

  if (!days.length) {
    lastDate = new Date();
    lastDate.setUTCHours(0, 0, 0, 0);
    lastDate.setDate(lastDate.getDate() - 1);
  } else {
    lastDate = new Date(days[days.length - 1].date * 1000);
  }

  const fromDate = new Date(lastDate);
  fromDate.setUTCHours(0, 0, 0, 0);

  const toDate = new Date();
  toDate.setUTCHours(0, 0, 0, 0);

  return { fromDate, toDate };
};

type SpacescopeRecord = {
  stat_date?: string;
  date?: string;
  miner_fee?: number | string;
  miner_tip?: number | string;
};

type SpacescopeResponse =
  | {
      code: number;
      data: SpacescopeRecord[];
      message?: string;
      request_id?: string;
    }
  | {
      code: number;
      data: {
        records?: SpacescopeRecord[];
      };
      message?: string;
      request_id?: string;
    };

const formatDateParam = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const getFilecoinSupplySideRevenue = async (fromDate: Date, toDate: Date) => {
  const allRecords: SpacescopeRecord[] = [];
  const chunkStart = new Date(fromDate);
  chunkStart.setUTCHours(0, 0, 0, 0);
  const finalDate = new Date(toDate);
  finalDate.setUTCHours(0, 0, 0, 0);

  while (chunkStart <= finalDate) {
    const chunkEnd = new Date(chunkStart);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + MAX_DAYS_PER_REQUEST - 1);
    if (chunkEnd > finalDate) {
      chunkEnd.setTime(finalDate.getTime());
    }

    const chunkRecords = await fetchSpacescopeRecords(chunkStart, chunkEnd);
    allRecords.push(...chunkRecords);

    chunkStart.setUTCDate(chunkEnd.getUTCDate() + 1);
  }

  if (!allRecords.length) {
    throw new Error("No data returned by Spacescope API.");
  }

  return allRecords
    .map((record) => {
      const isoDate = record.stat_date ?? record.date;
      if (!isoDate) {
        return null;
      }

      const normalizedISO = isoDate.includes("T")
        ? isoDate
        : `${isoDate}T00:00:00Z`;
      const timestamp = new Date(normalizedISO).getTime() / 1000;
      const rawFee = record.miner_tip ?? record.miner_fee ?? 0;
      let minerFee =
        typeof rawFee === "string" ? parseFloat(rawFee) : (rawFee ?? 0);

      if (Number.isNaN(minerFee)) {
        minerFee = 0;
      }

      return {
        date: timestamp,
        fees: minerFee,
      };
    })
    .filter((record): record is { date: number; fees: number } => !!record)
    .sort((a, b) => a.date - b.date);
};

const extractRecords = (
  payload: SpacescopeResponse["data"],
): SpacescopeRecord[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.records)) {
    return payload.records;
  }

  return [];
};

const fetchSpacescopeRecords = async (
  startDate: Date,
  endDate: Date,
): Promise<SpacescopeRecord[]> => {
  const endpoint =
    "https://api.spacescope.io/v2/gas/daily_network_fee_breakdown";
  const params = new URLSearchParams({
    start_date: formatDateParam(startDate),
    end_date: formatDateParam(endDate),
  });

  try {
    const { data }: { data: SpacescopeResponse } = await axios.get(
      `${endpoint}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SPACESCOPE_API_KEY}`,
        },
      },
    );

    if (data?.code !== 0) {
      throw new Error(JSON.stringify(data));
    }

    return extractRecords(data?.data);
  } catch (err: any) {
    const status = err?.response?.status;
    const statusText = err?.response?.statusText;
    const errorBody = JSON.stringify(err?.response?.data ?? {});
    throw new Error(
      `Spacescope request failed (${status ?? "unknown"} ${
        statusText ?? ""
      }): ${errorBody}`,
    );
  }
};

filecoinImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
