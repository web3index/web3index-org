import { GraphQLClient, gql } from "graphql-request";
import prisma from "../lib/prisma";
import type { Project } from "@prisma/client";
import { fetchCryptoComparePrice } from "./utils/cryptoCompare";

const endpoint = "https://arweave.net/graphql";
const gqlclient = new GraphQLClient(endpoint);
const MAX_BLOCKS_PER_RUN = 1_000;
const START_BLOCK_HEIGHT = 422250;

const queryGetTransactions = gql`
  query GetTransactions($minblock: Int!, $maxblock: Int!, $cursor: String) {
    transactions(
      first: 100
      sort: HEIGHT_ASC
      block: { min: $minblock, max: $maxblock }
      after: $cursor
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          block {
            id
            timestamp
            height
          }
          fee {
            winston
            ar
          }
        }
      }
    }
  }
`;

const queryGetLastBlock = gql`
  query queryGetLastBlock {
    block {
      height
    }
  }
`;

const coin = {
  name: "arweave",
  symbol: "AR",
  cryptoCompareSymbol: "AR",
};

type DayAccumulator = {
  date: number;
  fees: number;
  lastBlockHeight: number;
};

type TransactionEdge = {
  cursor: string;
  node: {
    block: {
      id: string;
      timestamp: string;
      height: number;
    } | null;
    fee: {
      ar: string;
    };
  };
};

type TransactionsResponse = {
  transactions: {
    edges: TransactionEdge[];
    pageInfo: {
      hasNextPage: boolean;
    };
  };
};

const arweaveImport = async () => {
  const project = await getProject(coin.name);

  if (project.delete) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        delete: false,
        lastImportedId: START_BLOCK_HEIGHT.toString(),
      },
    });
  }

  const lastId = parseInt(project.lastImportedId, 10);
  if (Number.isNaN(lastId)) {
    throw new Error("Unable to parse lastImportedId for Arweave.");
  }

  const latestChainHeight = await getLastBlockId();
  const maxBlockHeight = Math.min(
    latestChainHeight,
    lastId + MAX_BLOCKS_PER_RUN,
  );

  console.log(
    `Project: ${project.name}, from block ${lastId} to ${maxBlockHeight}`,
  );

  if (maxBlockHeight <= lastId) {
    console.log("Nothing new to import.");
    return;
  }

  let cursor: string | undefined;
  let exit = false;
  let dayData: DayAccumulator | null = null;
  let cachedPriceBlock = -1;
  let cachedPriceUsd = 0;
  let lastProcessedBlock = lastId;

  while (!exit) {
    const data = await gqlclient.request<TransactionsResponse>(
      queryGetTransactions,
      {
        minblock: lastId,
        maxblock: maxBlockHeight,
        cursor,
      },
    );

    if (!data.transactions.edges.length) {
      console.log("No transactions returned for this range.");
      break;
    }

    for (const edge of data.transactions.edges) {
      if (!edge.node.block) {
        exit = true;
        break;
      }

      const blockUnixTimestamp = parseInt(edge.node.block.timestamp, 10);
      const blockHeight = Number(edge.node.block.height);
      if (
        Number.isNaN(blockUnixTimestamp) ||
        Number.isNaN(blockHeight) ||
        blockUnixTimestamp <= 0
      ) {
        continue;
      }

      lastProcessedBlock = blockHeight;

      if (!dayData) {
        dayData = {
          date: getMidnightUnixTimestamp(blockUnixTimestamp),
          fees: 0,
          lastBlockHeight: blockHeight,
        };
      }

      if (!isSameDate(dayData.date, blockUnixTimestamp)) {
        await storeDBData(dayData, project.id);
        dayData = {
          date: getMidnightUnixTimestamp(blockUnixTimestamp),
          fees: 0,
          lastBlockHeight: blockHeight,
        };
      }

      if (cachedPriceBlock !== blockHeight) {
        cachedPriceUsd = await getHistoricalData(blockUnixTimestamp);
        cachedPriceBlock = blockHeight;
      }

      const transactionFee = parseFloat(edge.node.fee?.ar ?? "0");
      if (!Number.isFinite(transactionFee)) {
        continue;
      }

      dayData.fees += transactionFee * cachedPriceUsd;
      dayData.lastBlockHeight = blockHeight;
      cursor = edge.cursor;
    }

    if (data.transactions.pageInfo.hasNextPage && !exit) {
      continue;
    }

    break;
  }

  if (dayData && dayData.fees > 0) {
    await storeDBData(dayData, project.id);
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      lastImportedId: Math.max(lastProcessedBlock, maxBlockHeight).toString(),
    },
  });

  console.log("exit scrape function.");
};

const getHistoricalData = async (blockTimestamp: number) => {
  return fetchCryptoComparePrice(coin.cryptoCompareSymbol, blockTimestamp);
};

const getProject = async (name: string): Promise<Project> => {
  let project = await prisma.project.findFirst({
    where: { name },
  });

  if (!project) {
    console.log(`Project ${name} doesn't exist. Creating it`);
    await prisma.project.create({
      data: {
        name,
        lastImportedId: START_BLOCK_HEIGHT.toString(),
      },
    });

    project = await prisma.project.findUnique({
      where: { name },
    });
  }

  if (!project) {
    throw new Error(`Unable to initialize project ${name}`);
  }

  return project;
};

const getLastBlockId = async () => {
  const data = await gqlclient.request<{ block: { height: number } }>(
    queryGetLastBlock,
  );

  return data.block.height;
};

const storeDBData = async (dayData: DayAccumulator, projectId: number) => {
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

  await prisma.project.update({
    where: { id: projectId },
    data: {
      lastImportedId: dayData.lastBlockHeight.toString(),
    },
  });
};

const getMidnightUnixTimestamp = (unixTimestamp: number) => {
  const date = new Date(unixTimestamp * 1000);
  date.setUTCHours(0, 0, 0, 0);

  return Math.floor(date.getTime() / 1000);
};

const isSameDate = (firstDate: number, secondDate: number) => {
  return (
    getMidnightUnixTimestamp(firstDate) === getMidnightUnixTimestamp(secondDate)
  );
};

arweaveImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
