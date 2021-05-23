import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient } from 'graphql-request'
import { request, gql } from 'graphql-request'
import { PrismaClient } from '@prisma/client'
import limestone from 'limestone-api';

const endpoint = 'https://arweave.net/graphql';
const gqlclient = new GraphQLClient(endpoint);

const queryGetTranasctions = gql`
    query GetTransactions($minblock: Int!, $cursor: String){
      transactions (first: 100, sort: HEIGHT_ASC, block: {min: $minblock}, after: $cursor){
        pageInfo {
          hasNextPage
        }
        edges {
          cursor
          node{
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
`

const queryGetBlock = gql`
query GetBlocl($blockid: Int!){
  blocks(height: {min: $blockid, max: $blockid}){
    edges {
      node {
        id
        height
        timestamp
      }
    }
  }
}
`

const coin = {
  name: "arweave",
  symbol: "AR",
}

const prisma = new PrismaClient()


var today = new Date();
today.setHours(0,0,0,0);

// Update Arweave daily revenue data
// a cron job should hit this endpoint every half hour or so (can use github actions for cron)
export default async (_req: NextApiRequest, res: NextApiResponse) => {
  // Use the updatedAt field in the Day model and compare it with the
  // timestamp associated with the fee, if it's less than the timestamp
  // then update the day's revenue
  
  let project = await getProject(coin.name); 
  let lastId = project.lastImportedId
  const parsedId = parseInt(lastId, 10);
  if (isNaN(parsedId)) { 
    res.status(500).json({
      error: "unable to parse int.",
      value: lastId,
    });
    return;
  }
  
  let previousBlockHeight;
  try{
    previousBlockHeight = await getBlockHeight(parsedId);
  }
  catch(e){ 
    res.status(500).json({
      error: "unable to get block height from blockchain.",
      value: e,
    });
    return;
  }
  console.log(previousBlockHeight);


  let variables = {
    minblock: parsedId,
    cursor: "",
  }
  let cursor;
  let dayData = {
    date: 0,
    fees: 0,
    blockHeight: "",
  }
  let ARinUSDT = 0;
  let exit = false;

  while (true) {
    let data;
    try {
      data = await gqlclient.request(queryGetTranasctions, variables)
    }
    catch(e){
      res.status(500).json({
        error: "Error executing gql query GetTransactions.",
        value: e,
      });
      return;
    }
    
    for (let index = 0; index < data.transactions.edges.length; index++) {
      let element = data.transactions.edges[index];
      
      // If block is null store data in DB and exit
      if (element.node.block == null){
        exit = true
        break;
      }
      
      // Is it the first element?
      if (dayData.date == 0) {
        const parsedUnixTimestamp = parseInt(element.node.block.timestamp, 10);
        if (isNaN(parsedUnixTimestamp)) { 
          res.status(500).json({
            error: "unable to parse int.",
            value: element.node.block.timestamp,
          });
          return;
        }
        dayData.date = getMidnightUnixTimestamp(parsedUnixTimestamp)
        console.log("Data was empty. Start parsing from date: " + dayData.date);
      }

      const blockUnixTimestamp = parseInt(element.node.block.timestamp, 10);
      if (isNaN(blockUnixTimestamp)) { 
        res.status(500).json({
          error: "unable to parse int.",
          value: element.node.block.timestamp,
        });
        return;
      }

      // if new block update AR/USDT price
      if (dayData.blockHeight != element.node.block.height){
        //console.log("Get AR historical data...");
        ARinUSDT = await getHistoricalData(coin.symbol, blockUnixTimestamp)
        console.log("Value: " + ARinUSDT);
        console.log("Block ID: " + element.node.block.id);
        dayData.blockHeight = element.node.block.height;
      }
      
      // New day. Store information in DB
      if (!isSameDate(dayData.date, blockUnixTimestamp)){
        console.log("New day: store info in DB.")
        console.log(JSON.stringify(dayData) + " - " + blockUnixTimestamp)
        
        await storeDBData(dayData, project.id);
        dayData.fees = 0;
        dayData.date = getMidnightUnixTimestamp(blockUnixTimestamp);
      } 

      const transactionFee = parseFloat(element.node.fee.ar);
      if (isNaN(transactionFee)) { 
        res.status(500).json({
          error: "unable to parse int.",
          value: element.node.fee.ar,
        });
        return;
      }
      dayData.fees += transactionFee * ARinUSDT;
      cursor = data.transactions.edges[index].cursor
    }
    if (data.transactions.pageInfo.hasNextPage && !exit){
      variables = {
        minblock: parsedId,
        cursor: cursor,
      }
    }
    else {
      console.log("Exiting loop...")
      console.log("New day: store info in DB.")
      console.log(JSON.stringify(dayData))
      await storeDBData(dayData, project.id);
      break;
    }
  }

  res.status(200).json({
    result: "OK"
  });
};

const getHistoricalData = async (symbol: string, date: number) => {
  let dt = new Date(date * 1000);
  const price = await limestone.getHistoricalPrice(symbol, {
    date: dt.toISOString(),
  });

  return price.value;
}

const getProject = async (name: string) => {
  var project = await prisma.project.findFirst({
    'where': {
      name: name,
    }
  });

  if (project == null) {
    console.log("Project arweave doesn't exist. Create it")
    await prisma.project.create({
      data: {
        name: name,
        lastImportedId: "0",
      },
    },);

    project =  await prisma.project.findUnique({
      'where': {
        name: name,
      }
    });

  }

  return project
}

const getBlockHeight = async (blockId: number) => {
  let variables = {
    blockid: blockId,
  };
  let data;
  try{
    data = await gqlclient.request(queryGetBlock, variables);
  }
  catch (e){
    throw new Error("Error getting block height from blockchain: " + e)
  }
  
  return data.blocks.edges[0].node.height
}

const storeDBData = async (dayData: { date: any; fees: any; blockHeight?: string; }, projectId: number) => {
  let day = await prisma.day.findFirst({
    where: {
      date: dayData.date,
    }
  });

  if (day != null){
    await prisma.day.update({
      where: {
        id: day.id
      },
      data: {
        revenue: dayData.fees + day.revenue,
      }
    })
  }
  else{
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
      lastImportedId: dayData.blockHeight.toString(),
    }
  });
  
  return;
}

function getMidnightUnixTimestamp(unixTimestamp: number){
  let date = new Date(unixTimestamp * 1000);
  date.setUTCHours(0,0,0,0);

  return date.getTime() / 1000
}

function isSameDate(firstDate: number, secondDate: number){
  return getMidnightUnixTimestamp(firstDate) == getMidnightUnixTimestamp(secondDate)
}