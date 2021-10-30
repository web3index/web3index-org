import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { ChainId, Token, WETH, Fetcher, Route } from "@uniswap/sdk";
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime";

const endpoint =
  "https://api.subquery.network/sq/Phala-Network/khala-chainbridge";
const gqlclient = new GraphQLClient(endpoint, { timeout: 300000 });

const coin = {
  name: "phala",
  symbol: "PHA",
};

// const today = new Date();
// today.setHours(0, 0, 0, 0);

// Update Phala Network daily revenue data
// a cron job should hit this endpoint every half hour or so (can use github actions for cron)
const phalaImport = async () => {
  // Use the updatedAt field in the Day model and compare it with the
  // timestamp associated with the fee, if it's less than the timestamp
  // then update the day's revenue

  // Get last imported id: we will start importing from there
  const project = await getProject(coin.name);

  const days = project.days;
  let lastUpdateDate: any;

  const latestBlockInfo = await getLatestBlockInfo();
  const latestBlockDate = new Date(latestBlockInfo.timestamp);
  if (isNaN(days)) {
    // set to latest block time
    lastUpdateDate = latestBlockDate;
    console.log(
      `no revenue data exist, set lastUpdateDate to: ${lastUpdateDate}`
    );
    await storeDBData(
      {
        fees: await pha2Usdt(await getRevenueAtBlock(latestBlockInfo.height)),
        date: latestBlockInfo.timestamp,
      },
      project.id
    );
  } else {
    lastUpdateDate = new Date(days[-1].date);
    console.log(
      `has revenue data exist, set lastUpdateDate to: ${lastUpdateDate}`
    );
  }

  console.log(
    "Project: " +
      project.name +
      ", last update date: " +
      lastUpdateDate.toString()
  );

  // New day. Store information in DB
  if (!isSameDate(lastUpdateDate.getTime(), latestBlockDate.getTime())) {
    const revenue = await getRevenueAtBlock(latestBlockInfo.height);
    const dayData = {
      fees: await pha2Usdt((revenue - days[-1].revenue).toString()),
      date: latestBlockDate,
    };

    console.log("New day: store info in DB.");
    console.log(JSON.stringify(dayData) + " - " + latestBlockDate);

    await storeDBData(dayData, project.id);
  }

  console.log("exit scrape function.");
  return;
};

const getLatestBlockInfo = async () => {
  let data;
  try {
    data = await gqlclient.request(gql`
      {
        blocks(last: 1, orderBy: BLOCK_HEIGHT_ASC) {
          nodes {
            blockHeight
            timestamp
          }
        }
      }
    `);
  } catch (e) {
    throw new Error(
      "Error getting last block id from blockchain: " +
        JSON.stringify(e) +
        JSON.stringify(data)
    );
  }

  return {
    height: data.blocks.nodes[0].blockHeight,
    timestamp: data.blocks.nodes[0].timestamp,
  };
};

const getRevenueAtBlock = async (blockHeight: string) => {
  let data;
  try {
    data = await gqlclient.request(gql`
    {
      revenues (filter: {blockHeight: {equalTo: \"${blockHeight}\"}}) {
        nodes {
            id
            blockHeight
            amount
        }
      }
    }
    `);
  } catch (e) {
    throw new Error(
      "Error getting revenue from blockchain: " +
        JSON.stringify(e) +
        JSON.stringify(data)
    );
  }

  return data.revenues.nodes[0].amount;
};

const pha2Usdt = async (amount: string) => {
  const USDT = new Token(
    ChainId.MAINNET,
    "0xdac17f958d2ee523a2206206994597c13d831ec7",
    6
  );
  const PHA = new Token(
    ChainId.MAINNET,
    "0x6c5bA91642F10282b576d91922Ae6448C9d52f4E",
    18
  );

  const WETHUSDTPair = await Fetcher.fetchPairData(WETH[ChainId.MAINNET], USDT);
  const PHAWETHPair = await Fetcher.fetchPairData(PHA, WETH[ChainId.MAINNET]);

  const route = new Route([PHAWETHPair, WETHUSDTPair], PHA);
  const price = route.midPrice.toSignificant(6);
  console.log(`PHA - USDT: ${price}`);

  return new Decimal(amount)
    .div(new Decimal("1000000000000.0").mul(new Decimal(price)))
    .toFixed(6);
};

const getProject = async (name: string) => {
  let project = await prisma.project.findFirst({
    where: {
      name: name,
    },
  });

  if (project == null) {
    console.log("Project phala doesn't exist. Create it");
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
  dayData: { date: any; fees: any },
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

const getMidnightUnixTimestamp = (unixTimestamp: number) => {
  const date = new Date(unixTimestamp * 1000);
  date.setUTCHours(0, 0, 0, 0);

  return date.getTime() / 1000;
};

const isSameDate = (firstDate: number, secondDate: number) => {
  return (
    getMidnightUnixTimestamp(firstDate) == getMidnightUnixTimestamp(secondDate)
  );
};

phalaImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
