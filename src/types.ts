
export interface IAuction {
  wizardId: number,
  aId: number,
  startTime: number,
  endTime: number,
  oneOfOne: boolean,
  isWhitelistDay: boolean
}


// TODO: these types aren't correct 
export interface ISettledAuction {
  wizardId: number,
  aId: number,
  winner: string,
  amount: number
}