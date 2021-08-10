import prisma from "../lib/prisma";
import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";

const endpoint = "subgraph.mainnet.oceanprotocol.com";
const gqlclient = new GraphQLClient(endpoint, { timeout: 300000 });

const coin = {
  name: "ocean",
  symbol: "OCEAN",
};

const today = new Date();
today.setHours(0, 0, 0, 0);

// Update Ocean daily revenue data
// a cron job should hit this endpoint every half hour or so (can use github actions for cron)
const oceanImport = async () => {
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

}

const getProject = async (name: string) => {
  let project = await prisma.project.findFirst({
    where: {
      name: name,
    },
  });

  if (project == null) {
    console.log("Project ocean doesn't exist. Create it");
    await prisma.project.create({
      data: {
        name: name,
        lastImportedId: "100042",
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

