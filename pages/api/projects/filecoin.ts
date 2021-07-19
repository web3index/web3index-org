import { NextApiRequest, NextApiResponse } from "next";
import redstone from "redstone-api";

const ENDPOINT =
  "https://hub.textile.io/thread/bafkwblbznyqkmqx5l677z3kjsslhxo2vbbqh6wluunvvdbmqattrdya/buckets/bafzbeidhnns26omq6a3y4jdixo7nqvb27wn7otfowohei5zibupvh7d2hq/daily-totals.json";

interface Entry {
  window: {
    start: string;
    end: string;
  };
  "sum(lifetimeValue)": number;
}

interface Revenue {
  now: number;
  oneDayAgo: number;
  twoDaysAgo: number;
  oneWeekAgo: number;
  twoWeeksAgo: number;
}

export interface Day {
  date: number;
  revenue: number;
}

export interface Data {
  revenue: Revenue;
  days: Day[];
}

async function FILinUSDT(date: string): Promise<number> {
  const price = await redstone.getHistoricalPrice("FIL", {
    date,
  });

  return price.value;
}

const getPastUnixDate = (numberOfDaysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - numberOfDaysAgo);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime() / 1000;
};

const findDay = (days: Day[]) => (numberOfDaysAgo: number) => {
  const day = days.find((day) => day.date === getPastUnixDate(numberOfDaysAgo));
  return day ? day.revenue : undefined;
};

async function getData(): Promise<Data | null> {
  try {
    const response = await fetch(ENDPOINT);
    const data: Entry[] = await response.json();

    const days: Day[] = [];
    for (const entry of data) {
      const price = await FILinUSDT(entry.window.start);
      days.push({
        date: new Date(entry.window.start).getTime() / 1000,
        revenue: entry["sum(lifetimeValue)"] * price,
      });
    }

    const day = findDay(days);

    const revenue: Revenue = {
      now: day(0),
      oneDayAgo: day(1),
      twoDaysAgo: day(2),
      oneWeekAgo: day(7),
      twoWeeksAgo: day(14),
    };

    return { days, revenue };
  } catch (error) {
    console.error("Error getting Filecoin data:", error);
    return null;
  }
}

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const data = await getData();
  //   console.log(data);
  return res.json(data);
};
