const emoji = require('node-emoji')
const wizardEmoji = emoji.get('male_mage')

export const getAuctionEndingMessage = () =>
  "The auction is ending soon! Get your bid in at https://wizardsdao.com";

export const getAuctionClosingPriceMessage = (auctionDate: string, wizStartId: number, bids: number[]) =>
  `AUCTION ${auctionDate} FINAL RESULTS
  
  ${wizardEmoji} #${wizStartId}: ${bids[0]} ETH
  ${wizardEmoji} #${wizStartId + 1}: ${bids[1]} ETH
  ${wizardEmoji} #${wizStartId + 2}: ${bids[2]} ETH
  `