import { request, gql } from "graphql-request";
import { getBlocksFromTimestamps } from "../../lib/utils";
import dayjs from "dayjs";
import { NextApiRequest, NextApiResponse } from "next";

const getRevenueByBlock = async (blockNumber) => {
  return await request(
    "https://api.thegraph.com/subgraphs/name/web3index/the-web3-index",
    gql`
      query($id: String!, $block: Block_height) {
        protocol(id: $id, block: $block) {
          revenueUSD
        }
      }
    `,
    {
      id: "thegraph",
      block: { number: blockNumber },
    }
  );
};

export const getProject = async () => {
  const data = await request(
    "https://api.thegraph.com/subgraphs/name/web3index/the-web3-index",
    gql`
      query($id: String!) {
        protocol(id: $id) {
          revenueUSD
          days(first: 1000) {
            date
            revenueUSD
          }
        }
      }
    `,
    { id: "thegraph" }
  );
  const utcCurrentTime = dayjs();
  const utcOneDayBack = utcCurrentTime.subtract(1, "day").unix();
  const utcTwoDaysBack = utcCurrentTime.subtract(2, "day").unix();
  const utcOneWeekBack = utcCurrentTime.subtract(1, "week").unix();
  const utcTwoWeeksBack = utcCurrentTime.subtract(2, "week").unix();

  const [
    oneDayBlock,
    twoDayBlock,
    oneWeekBlock,
    twoWeekBlock,
  ] = await getBlocksFromTimestamps([
    utcOneDayBack,
    utcTwoDaysBack,
    utcOneWeekBack,
    utcTwoWeeksBack,
  ]);

  const oneDayResult = await getRevenueByBlock(oneDayBlock);
  const twoDayResult = await getRevenueByBlock(twoDayBlock);
  const oneWeekResult = await getRevenueByBlock(oneWeekBlock);
  const twoWeekResult = await getRevenueByBlock(twoWeekBlock);

  const dayIndexSet = new Set();
  const oneDay = 24 * 60 * 60;

  let days = [];
  data.protocol.days.forEach((day) => {
    dayIndexSet.add((day.date / oneDay).toFixed(0));
    days.push({
      date: day.date,
      revenue: +day.revenueUSD,
    });
  });

  let timestamp = days[0].date;
  while (timestamp < Math.floor(+new Date() / 1000) - oneDay) {
    const nextDay = timestamp + oneDay;
    const currentDayIndex = (nextDay / oneDay).toFixed(0);

    if (!dayIndexSet.has(currentDayIndex)) {
      days.push({
        date: nextDay,
        revenue: 0,
      });
    }
    timestamp = nextDay;
  }

  days = days.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1));

  return {
    name: "The Graph",
    category: "Work Protocol",
    subcategory: "Indexing, Bandwidth",
    blockchain: "Ethereum",
    symbol: "GRT",
    everestID: "0xda80bd825c1272de7b99d0b0a5e8a6d3df129165",
    image: "https://cryptologos.cc/logos/the-graph-grt-logo.svg",
    usage: {
      revenue: {
        now: +data.protocol.revenueUSD,
        oneDayAgo: +oneDayResult.protocol.revenueUSD,
        twoDaysAgo: +twoDayResult.protocol.revenueUSD,
        oneWeekAgo: +oneWeekResult.protocol.revenueUSD,
        twoWeeksAgo: +twoWeekResult.protocol.revenueUSD,
      },
      days,
    },
  };
};

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProject();
  res.json(project);
};

export default handler;
