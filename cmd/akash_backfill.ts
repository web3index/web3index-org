import axios from "axios";
import prisma from "../lib/prisma";

const DEFILLAMA_ENDPOINT =
  "https://api.llama.fi/summary/fees/akash?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true";

const coin = {
  name: "akash",
  symbol: "AKT",
};

type LlamaResponse = {
  totalDataChart?: [number, number][];
};

const akashBackfill = async () => {
  const project = await getProjectWithDays(coin.name);
  const existingDates = new Set(project.days.map((day) => day.date));

  console.log(
    `Found ${existingDates.size} existing Akash day entries. Fetching DeFiLlama data...`,
  );

  const llamaData = await fetchDefiLlamaData();
  if (!llamaData.length) {
    console.log("No DeFiLlama data returned. Exiting.");
    return;
  }

  const missingRecords = llamaData.filter(
    ({ date }) => !existingDates.has(date),
  );

  if (!missingRecords.length) {
    console.log("No gaps found between local data and DeFiLlama feed.");
    return;
  }

  console.log(
    `Filling ${missingRecords.length} missing days from DeFiLlama...`,
  );

  for (const record of missingRecords) {
    await storeDBData(record, project.id);
  }

  const allDates = [
    ...project.days.map((d) => d.date),
    ...missingRecords.map((r) => r.date),
  ];
  if (allDates.length) {
    const maxDate = Math.max(...allDates);
    await prisma.project.update({
      where: { id: project.id },
      data: { lastImportedId: maxDate.toString() },
    });
  }

  console.log("Backfill complete.");
};

const fetchDefiLlamaData = async () => {
  try {
    const { data } = await axios.get<LlamaResponse>(DEFILLAMA_ENDPOINT);
    const chart = data.totalDataChart ?? [];
    return chart.map(([timestamp, fees]) => ({
      date: timestamp,
      fees: fees ?? 0,
    }));
  } catch (error) {
    console.log("Failed to fetch DeFiLlama data", error);
    return [];
  }
};

const getProjectWithDays = async (name: string) => {
  const project = await prisma.project.findFirst({
    where: { name },
    include: {
      days: {
        select: { date: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${name} not found.`);
  }

  return project;
};

const storeDBData = async (
  dayData: { date: number; fees: number },
  projectId: number,
) => {
  console.log(
    "Store day " +
      new Date(dayData.date * 1000) +
      " - " +
      dayData.date +
      " to DB - " +
      dayData.fees,
  );
  const day = await prisma.day.findFirst({
    where: {
      date: dayData.date,
      projectId,
    },
  });

  if (day) {
    await prisma.day.update({
      where: { id: day.id },
      data: {
        revenue: dayData.fees,
      },
    });
  } else {
    await prisma.day.create({
      data: {
        date: dayData.date,
        revenue: dayData.fees,
        projectId,
      },
    });
  }
};

akashBackfill()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
