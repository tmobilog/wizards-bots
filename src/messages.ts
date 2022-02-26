const emoji = require('node-emoji')

export const getAuctionEndingMessage = () =>
  "The auction is ending soon! Get your bid in at https://wizardsdao.com";

const wizardEmoji = emoji.get('male_mage')
export const getAuctionClosingPriceMessage = (auctionNumber: number, wizStartId: number, bids: number[]) =>
  `AUCTION ${auctionNumber} FINAL RESULTS
  
  ${wizardEmoji} #${wizStartId}: ${bids[0]} ETH
  ${wizardEmoji} #${wizStartId + 1}: ${bids[1]} ETH
  ${wizardEmoji} #${wizStartId + 2}: ${bids[2]} ETH
  `