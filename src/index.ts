import { getAuctionClosingPriceMessage, getAuctionEndingMessage } from './messages';
import { getAuctionInfo, getClosingPrices } from './auctionHouseSubscriber';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import TwitterApi from 'twitter-api-v2';

dotenv.config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
})

const MILLISECONDS_IN_23_HOURS = (23 * 60 * 60 * 1000);
const CACHE_PATH = path.resolve(__dirname, "../store/cache.json");



async function botTick() {
  console.log("bot awakens")

  let cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));

  const { minutesLeft, newWizardIds } = await getAuctionInfo();
  console.log("minutesLeft: ", minutesLeft);
  console.log("wizardIds: ", newWizardIds);

  // Make sure this tweet hasn't already been sent for this auction (> 23hrs ago)
  const timeSinceLastAuctionEndingTweet = (new Date()).getTime() - cache.lastTimeSentAuctionEndingSoon;
  console.log("time since last auction ending tweet", timeSinceLastAuctionEndingTweet);

  if (minutesLeft <= 15 && timeSinceLastAuctionEndingTweet > MILLISECONDS_IN_23_HOURS) {
    console.log('Tweeting auction ending soon');
    // DEV: uncomment 
    await twitterClient.v1.tweet(getAuctionEndingMessage());

    // Update the last time this tweet was sent 
    cache.lastTimeSentAuctionEndingSoon = (new Date()).getTime();
    console.log(cache);
  }

  // If the wizardIds are different than what's in the cache, send out closing price tweet 
  if (JSON.stringify(newWizardIds.sort()) !== JSON.stringify(cache.wizardIds.sort())) {
    console.log("new auction has started. sending out closing prices tweet");

    const { bidAmounts, oldWizardIds } = await getClosingPrices();
    console.log("closing prices: ", bidAmounts);
    console.log("settled wizards: ", oldWizardIds);
    // NEED TO FIX auctionNumber for 3 wizzies now 
    const auctionNumber = ((oldWizardIds[0]-1)/6) + 1; 
    console.log("auction number: ", auctionNumber); 

    const closingPricesMsg = getAuctionClosingPriceMessage(auctionNumber, oldWizardIds[0], bidAmounts);

    // If no closing prices tweet ID, tweet the message directly 
    // NOTE: I feel like this isn't break-proof. If we have to tweet it manually once, it will break the thread since the bot will reply to the previous tweet 
    if(cache.closingPricesTweetID === "") {
      // Save tweet ID
      console.log("creating tweet thread"); 
      // DEV: uncomment 
      const closingPricesTweet = await twitterClient.v1.tweet(closingPricesMsg, cache.closingPricesTweetID);
      // commenting out updates to closingPriceTweetID, it's hardcoded now
      // cache.closingPricesTweetID = closingPricesTweet.id_str; 
    } else {
      console.log("replying to tweet thread"); 
      // Otherwise reply to existing message and save tweet ID 
      const closingPricesTweet = await twitterClient.v1.reply(closingPricesMsg, cache.closingPricesTweetID);
      // commenting out updates to closingPriceTweetID, it's hardcoded now
      // cache.closingPricesTweetID = closingPricesTweet.id_str; 
    }

    cache.lastTimeSentClosingPrices = (new Date()).getTime();
    cache.wizardIds = newWizardIds;
  }


  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));

}

botTick();

// DEV: uncomment 
setInterval(async () => botTick(), 300000);
