import { getAuctionClosingPriceMessage, getAuctionEndingMessage } from './messages';
import { getAuctionInfo, getClosingPrices } from './auctionHouseSubscriber';
import fs from 'fs';
import path from 'path';
import { format } from "date-fns";
import dotenv from 'dotenv';
import TwitterApi from 'twitter-api-v2';

dotenv.config();

const AUCTION_COUNT = 3;

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
})

const MILLISECONDS_IN_23_HOURS = (23 * 60 * 60 * 1000);
const CACHE_PATH = path.resolve(__dirname, "../store/cache.json");

async function botTick() {
  let cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));

  const { minutesLeft, newWizardIds } = await getAuctionInfo();
  console.log("minutesLeft: ", minutesLeft);
  console.log("wizardIds: ", newWizardIds);

  // Make sure this tweet hasn't already been sent for this auction (> 23hrs ago)
  const timeSinceLastAuctionEndingTweet = (new Date()).getTime() - cache.lastTimeSentAuctionEndingSoon;
  console.log("time since last auction ending tweet", timeSinceLastAuctionEndingTweet);

  if (minutesLeft <= 15 && timeSinceLastAuctionEndingTweet > MILLISECONDS_IN_23_HOURS) {
    console.log('tweeting auction ending soon');
    await twitterClient.v1.tweet(getAuctionEndingMessage());
    cache.lastTimeSentAuctionEndingSoon = (new Date()).getTime();
  }

  // If the wizardIds are different than what's in the cache, send out closing price tweet 
  if (JSON.stringify(newWizardIds) !== JSON.stringify(cache.wizardIds)) {
    console.log("new auction has started. sending out closing prices tweet");
    const { bidAmounts, oldWizardIds } = await getClosingPrices(3);
    
    // NEED TO FIX auctionNumber for 3 wizzies now 
    const auctionDate = format(new Date(), "MM/dd/yy")
    const closingPricesMsg = getAuctionClosingPriceMessage(auctionDate, oldWizardIds[0], bidAmounts);

    // Otherwise reply to existing message and save tweet ID 
    const closingPricesTweet = await twitterClient.v1.reply(closingPricesMsg, cache.closingPricesTweetID);
    cache.lastTimeSentClosingPrices = (new Date()).getTime();
    cache.wizardIds = newWizardIds;
  }


  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));

}

botTick();
setInterval(botTick, 300000); // five min tick