import { ethers } from "ethers";
import { IAuction, ISettledAuction } from "./types"

const auctionHouseJSON = require('../abi/AuctionHouse.json')
const auctionHouseABI = auctionHouseJSON.abi;
const auctionHouseAddress = '0x418CbB82f7472B321c2C5Ccf76b8d9b6dF47Daba';
const BLOCKS_PER_DAY = 8_000;


export async function getAuctionInfo(): Promise<{ minutesLeft: number, newWizardIds: number[] }> {

  const connectionURL = process.env.MAINNET_RPC_URI;
  console.log("url: ", connectionURL);

  const provider = new ethers.providers.JsonRpcProvider(connectionURL);
  const auctionHouseContract = new ethers.Contract(auctionHouseAddress, auctionHouseABI, provider);

  // Track when auction was created to check if time to notify 
  const createdFilter = auctionHouseContract.filters.AuctionCreated(
    null,
    null,
    null,
    null,
    null,
    null
  );

  const createdAuctionEvents = await auctionHouseContract.queryFilter(
    createdFilter,
    0 - BLOCKS_PER_DAY
  );

  // TODO: only need the most recent auction tbh 
  // QUESTION: is there ever the case that we would be in between creating auctions? 
  const latestCreatedAuctions: IAuction[] = createdAuctionEvents.slice(-5).map((e) => {
    return {
      wizardId: e?.args?.wizardId,
      aId: e?.args?.aId,
      startTime: e?.args?.startTime,
      endTime: e?.args?.endTime,
      oneOfOne: e?.args?.oneOfOne,
      isWhitelistDay: e?.args?.isWhitelistDay
    }
  })

  // console.log(latestCreatedAuctions);

  const endTime = parseFloat(
    ethers.utils.formatUnits(latestCreatedAuctions[0].endTime)
  ) * (10 ** 18);

  const endDatetime = new Date(endTime * 1000);

  const timeLeft = endDatetime.getTime() - (new Date()).getTime();
  const minutesLeft = timeLeft / (1000 * 60);

  const newWizardIds = latestCreatedAuctions.map((auction) =>
    Math.floor(parseFloat(ethers.utils.formatUnits(auction.wizardId)) * (10 ** 18)));

  return { minutesLeft, newWizardIds };


}



export async function getClosingPrices(): Promise<{ bidAmounts: number[], oldWizardIds: number[] }> {

  const connectionURL = process.env.MAINNET_RPC_URI;
  // console.log("url: ", connectionURL);

  const provider = new ethers.providers.JsonRpcProvider(connectionURL);
  const auctionHouseContract = new ethers.Contract(auctionHouseAddress, auctionHouseABI, provider);

  const settledFilter = auctionHouseContract.filters.AuctionSettled(
    null,
    null,
    null,
    null
  );

  const settledAuctionEvents = await auctionHouseContract.queryFilter(
    settledFilter,
    0 - BLOCKS_PER_DAY
  );

  const latestSettledAuctions: ISettledAuction[] = settledAuctionEvents.slice(-5).map((e) => {
    return {
      wizardId: Math.floor(parseFloat(ethers.utils.formatUnits(e?.args?.wizardId)) * (10 ** 18)),
      aId: parseFloat(ethers.utils.formatUnits(e?.args?.aId)) * (10 ** 18),
      winner: e?.args?.winner as string,
      amount: parseFloat(ethers.utils.formatUnits(e?.args?.amount)),
    } as ISettledAuction
  }).sort((a: ISettledAuction, b: ISettledAuction) => a.wizardId - b.wizardId);

  console.log(latestSettledAuctions);

  const bidAmounts = latestSettledAuctions.map((a) => a.amount);
  const oldWizardIds = latestSettledAuctions.map((a) => a.wizardId);
  return { bidAmounts, oldWizardIds };

}