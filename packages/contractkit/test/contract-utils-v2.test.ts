import { CURRENCY_ENUM as Tokens } from '@celo/utils'
import { BigNumber } from 'bignumber.js'
import sleep from 'sleep-promise'
import { TransactionReceipt } from 'web3/types'
import { NETWORK_NAME } from '../contracts/network-name'
import {
  getDollarBalance,
  getExchangeRate,
  getGasPrice,
  getGoldBalance,
  getTotalGoldSupply,
  performExchange,
  sendDollar,
  sendGold,
} from '../src/contract-utils-v2'
import { Logger, LogLevel } from '../src/logger'
import {
  getGasFeeRecipient,
  getMiner0AccountAddress,
  getMiner0PrivateKey,
  getMiner1AccountAddress,
  getWeb3ForTesting,
  getWeb3WithSigningAbilityForTesting,
} from './utils'

beforeAll(() => {
  Logger.setLogLevel(LogLevel.VERBOSE)
})

describe('Contract Utils V2', () => {
  describe('#getErc20Balance', () => {
    it('should be able to get Gold balance', async () => {
      const web3 = await getWeb3ForTesting()
      Logger.debug(
        'getErc20Balance Test',
        `Testing using Account: ${getMiner0AccountAddress(NETWORK_NAME)}`
      )
      const goldBalanceInWei = new BigNumber(
        await web3.eth.getBalance(getMiner0AccountAddress(NETWORK_NAME))
      )
      Logger.info('getErc20Balance Test', `Gold balance (directly fetched) is ${goldBalanceInWei}`)
      const goldBalanceInEther = await getGoldBalance(web3, getMiner0AccountAddress(NETWORK_NAME))
      Logger.info('getErc20Balance Test', `cGLD balance: ${goldBalanceInEther} in ethers`)
    })
    it('should be able to get Dollar balance', async () => {
      const web3 = await getWeb3ForTesting()
      Logger.debug(
        'getErc20Balance Test',
        `Testing using Account: ${getMiner0AccountAddress(NETWORK_NAME)}`
      )
      const dollarBalance = await getDollarBalance(web3, getMiner0AccountAddress(NETWORK_NAME))
      Logger.info('getErc20Balance Test', `cUSD balance: ${dollarBalance} in ethers`)
    })
    it('should be able to get Total Gold supply', async () => {
      const web3 = await getWeb3ForTesting()
      const totalGoldSupply = await getTotalGoldSupply(web3)
      Logger.info('getErc20Balance Test', `gold supply: ${totalGoldSupply}`)
    })
  })
  describe('#transferTests', () => {
    it('sendCeloGoldWithGasInCeloDollar', async () => {
      // Skipped for now, till we redeploy `appintegration` to contain the new Geth which supports the new
      // signin mechanism.
      // https://github.com/celo-org/celo-monorepo/issues/3899
      // @ts-ignore
      if (NETWORK_NAME === 'appintegration') {
        return
      }
      jest.setTimeout(30 * 1000)
      const web3Miner0 = await getWeb3WithSigningAbilityForTesting(
        getMiner0PrivateKey(NETWORK_NAME)
      )
      const from = getMiner0AccountAddress(NETWORK_NAME)
      const to = getMiner1AccountAddress(NETWORK_NAME)
      const amountInEther = 1
      const gasPriceInCeloDollar: BigNumber = await getGasPrice(web3Miner0, Tokens.DOLLAR)
      Logger.debug('Send celo gold test', `Gas price in Celo Dollar is ${gasPriceInCeloDollar}`)
      const gasFees = new BigNumber(250 * 1000)
      await transferGold(
        web3Miner0,
        from,
        to,
        amountInEther,
        gasFees,
        gasPriceInCeloDollar,
        Tokens.DOLLAR
      )
    })
    // TODO(ashishb): This ends up as a pending transaction. If I reverse to and from then it goes through.
    // Figure out why this is failing.
    // Reverse the transfer to minimize the impact of the test.
    it('sendCeloGoldWithGasInCeloGold', async () => {
      // Skipped for now, till we redeploy `appintegration` to contain the new Geth which supports the new
      // signin mechanism.
      // https://github.com/celo-org/celo-monorepo/issues/3899
      // @ts-ignore
      if (NETWORK_NAME === 'appintegration') {
        return
      }
      jest.setTimeout(30 * 1000)
      const web3Miner0 = await getWeb3WithSigningAbilityForTesting(
        getMiner0PrivateKey(NETWORK_NAME)
      )
      const from = getMiner0AccountAddress(NETWORK_NAME)
      const to = getMiner1AccountAddress(NETWORK_NAME)
      const amountInEther = 1
      const gasPriceInCeloGold: BigNumber = (await getGasPrice(
        web3Miner0,
        Tokens.GOLD
      )).multipliedBy(5)
      Logger.debug('Send celo gold test', `Gas price in Celo Gold is ${gasPriceInCeloGold}`)
      const gasFees = new BigNumber(250 * 1000)
      await transferGold(
        web3Miner0,
        from,
        to,
        amountInEther,
        gasFees,
        gasPriceInCeloGold,
        Tokens.GOLD
      )
    })
    it('sendCeloDollarWithGasInCeloDollar', async () => {
      // Skipped for now, till we redeploy `appintegration` to contain the new Geth which supports the new
      // signin mechanism.
      // https://github.com/celo-org/celo-monorepo/issues/3899
      // @ts-ignore
      if (NETWORK_NAME === 'appintegration') {
        return
      }
      jest.setTimeout(30 * 1000)
      const web3Miner0 = await getWeb3WithSigningAbilityForTesting(
        getMiner0PrivateKey(NETWORK_NAME)
      )
      const from = getMiner0AccountAddress(NETWORK_NAME)
      const to = getMiner1AccountAddress(NETWORK_NAME)
      const amountInEther = 1
      const gasPriceInCeloDollar: BigNumber = await getGasPrice(web3Miner0, Tokens.DOLLAR)
      Logger.debug('Send celo dollar test', `Gas price in Celo Dollar is ${gasPriceInCeloDollar}`)
      const gasFees = new BigNumber(250 * 1000)
      await transferDollar(
        web3Miner0,
        from,
        to,
        amountInEther,
        gasFees,
        gasPriceInCeloDollar,
        Tokens.DOLLAR
      )
    })
    it('sendCeloDollarWithGasInCeloGold', async () => {
      // Skipped for now, till we redeploy `appintegration` to contain the new Geth which supports the new
      // signin mechanism.
      // https://github.com/celo-org/celo-monorepo/issues/3899
      // @ts-ignore
      if (NETWORK_NAME === 'appintegration') {
        return
      }
      jest.setTimeout(30 * 1000)
      const web3Miner0 = await getWeb3WithSigningAbilityForTesting(
        getMiner0PrivateKey(NETWORK_NAME)
      )
      const from = getMiner0AccountAddress(NETWORK_NAME)
      const to = getMiner1AccountAddress(NETWORK_NAME)
      const amountInEther = 1
      const gasPriceInCeloGold: BigNumber = await getGasPrice(web3Miner0, Tokens.GOLD)
      Logger.debug('Send celo dollar test', `Gas price in Celo Dollar is ${gasPriceInCeloGold}`)
      const gasFees = new BigNumber(250 * 1000)
      await transferDollar(
        web3Miner0,
        from,
        to,
        amountInEther,
        gasFees,
        gasPriceInCeloGold,
        Tokens.GOLD
      )
    })
  })

  describe('#getGasPrice', () => {
    it('should return a nonzero gas price', async () => {
      // Skipped for now, till we redeploy `appintegration` to contain the new GasPriceMinimum contract.
      // @ts-ignore
      if (NETWORK_NAME === 'appintegration') {
        return
      }
      const web3 = await getWeb3ForTesting()
      const gasPrice = await getGasPrice(web3)
      console.debug(`Gas Price: ${gasPrice}`)
    })
  })

  describe('#performExchange', () => {
    // Skipping until appintegration has exchange contract
    it.skip('should be able to exchange celo gold', async () => {
      jest.setTimeout(20 * 1000)
      const web3 = await getWeb3WithSigningAbilityForTesting(getMiner0PrivateKey(NETWORK_NAME))
      Logger.debug(
        'Exchange celo gold test',
        `Testing using Account: ${getMiner0AccountAddress(NETWORK_NAME)}`
      )
      // Note: As of now "await web3.eth.getGasPrice()" returns an incorrect value.
      const gasPrice: BigNumber = await getGasPrice(web3)
      Logger.debug('Exchange celo gold test', `Gas price is ${gasPrice}`)
      const from = getMiner0AccountAddress(NETWORK_NAME)
      const amountInWei = new BigNumber(1e18)
      const gasFees = new BigNumber(1000 * 1000)
      const minAmount = new BigNumber(0)
      const result = await performExchange(web3, from, amountInWei, Tokens.GOLD, minAmount, gasFees)
      Logger.info('Send exchange gold test', `Result of exchange is ${result}`)
    })
  })
  describe('#getExchangeRate()', () => {
    it('should get a rate in dollars', async () => {
      const web3 = await getWeb3ForTesting()
      const rate = await getExchangeRate(web3, Tokens.GOLD)
      console.info(`rate in dollars: ${rate}`)
      expect(rate.isGreaterThan(0)).toBe(true) // Rate in dollars should be positive
    })
    it('should return a gas price when specifying Gold as the currency', async () => {
      // Skipped for now, till we redeploy `appintegration` to contain the new GasPriceMinimum contract.
      // @ts-ignore
      if (NETWORK_NAME === 'appintegration') {
        return
      }
      const web3 = await getWeb3ForTesting()
      const rate = await getExchangeRate(web3, Tokens.DOLLAR)
      console.info(`rate in gold: ${rate}`)
      expect(rate.isGreaterThan(0)).toBe(true) // Rate in gold should be positive
    })
    it('should return a gas price when specifying Celo Dollars as the currency', async () => {
      // Skipped for now, till we redeploy `appintegration` to contain the new GasPriceMinimum contract.
      // @ts-ignore
      if (NETWORK_NAME === 'appintegration') {
        return
      }
      const web3 = await getWeb3ForTesting()
      const rateInDollars = await getExchangeRate(web3, Tokens.DOLLAR)
      const rateInGold = await getExchangeRate(web3, Tokens.GOLD)
      console.info(`multiplied rates: ${rateInDollars.multipliedBy(rateInGold)}`)
      expect(
        rateInDollars
          .multipliedBy(rateInGold)
          .decimalPlaces(1)
          .isEqualTo(1)
      ).toBe(true) // Multiplied rates should be approximately 1
    })
  })

  describe('#getGasPrice', () => {
    it('should return a nonzero gas price', async () => {
      const web3 = await getWeb3ForTesting()
      const gasPrice = await getGasPrice(web3)
      console.debug(`Gas Price: ${gasPrice}`)

      expect(gasPrice.toNumber()).toBeGreaterThan(0)
    })
    it('should return a gas price when specifying Gold as the currency', async () => {
      const web3 = await getWeb3ForTesting()
      const gasPrice = await getGasPrice(web3, Tokens.GOLD)
      console.debug(`Gas Price: ${gasPrice}`)

      expect(gasPrice.toNumber()).toBeGreaterThan(0)
    })
    it('should return a gas price when specifying Celo Dollars as the currency', async () => {
      const web3 = await getWeb3ForTesting()
      const gasPrice = await getGasPrice(web3, Tokens.DOLLAR)
      console.debug(`Gas Price: ${gasPrice}`)

      expect(gasPrice.toNumber()).toBeGreaterThan(0)
    })
    // TODO: (yerdua)
    // write tests that verify that the GasPriceMinimum method was called with the specified currency
  })
})

async function transferGold(
  web3: any,
  from: string,
  to: string,
  amountInEther: number,
  gasFees: BigNumber,
  gasPrice: BigNumber,
  gasCurrency: Tokens
) {
  const amountInWei = new BigNumber(amountInEther * 1e18)
  Logger.debug(
    'Send celo gold test',
    `Testing using account: ${from} -> ${to}, gasCurrency: ${gasCurrency}`
  )
  const fromGoldBalanceBefore: BigNumber = await getGoldBalance(web3, from)
  const fromDollarBalanceBefore: BigNumber = await getDollarBalance(web3, from)
  const toGoldBalanceBefore: BigNumber = await getGoldBalance(web3, to)
  const gasFeeRecipient: string = await getGasFeeRecipient(NETWORK_NAME)
  try {
    // This will go through but subscribing to notifications will fail.
    // "Failed to subscribe to new newBlockHeaders to confirm the transaction receipts."
    // Most likely cause: https://github.com/ethereum/web3.js/issues/951#issuecomment-352010348
    const result: TransactionReceipt = await sendGold(
      web3,
      from,
      to,
      amountInWei,
      gasFees,
      gasPrice,
      gasFeeRecipient,
      gasCurrency
    )
    Logger.info('Send celo gold test', `Result of sendGold is ${result}`)
  } catch (error) {
    Logger.error(
      'Send celo gold test',
      `sendGold failed with error ${error}: ${JSON.stringify(error)}`
    )
  }
  await sleep(20 * 1000)
  const fromGoldBalanceAfter: BigNumber = await getGoldBalance(web3, from)
  const fromDollarBalanceAfter: BigNumber = await getDollarBalance(web3, from)
  const toGoldBalanceAfter: BigNumber = await getGoldBalance(web3, to)
  Logger.debug(
    'Send celo gold test',
    `Sender Gold balance ${fromGoldBalanceBefore} -> ${fromGoldBalanceAfter}`
  )
  Logger.debug(
    'Send celo gold test',
    `Receiver Gold balance ${toGoldBalanceBefore} -> ${toGoldBalanceAfter}`
  )
  const senderBalanceLoss = fromGoldBalanceBefore.minus(fromGoldBalanceAfter).toNumber()
  if (gasCurrency === Tokens.GOLD) {
    expect(senderBalanceLoss > amountInEther).toBe(true)
  } else if (gasCurrency === Tokens.DOLLAR) {
    Logger.debug(
      'Send celo gold test',
      `Sender Dollar balance ${fromDollarBalanceBefore} -> ${fromDollarBalanceAfter}`
    )
    const gasCostInCeloDollar = fromDollarBalanceBefore.minus(fromDollarBalanceAfter).toNumber()
    Logger.debug('Send celo gold test', `Gas cost in Celo Dollars ${gasCostInCeloDollar}`)
    expect(fromDollarBalanceBefore.minus(fromDollarBalanceAfter).toNumber() > 0).toBe(true)
  } else {
    fail(new Error(`unexpected gas currency ${gasCurrency}`))
  }
  expect(senderBalanceLoss < amountInEther + 0.01).toBe(true)
  expect(toGoldBalanceAfter.minus(toGoldBalanceBefore).toNumber()).toBe(amountInEther)
}

async function transferDollar(
  web3: any,
  from: string,
  to: string,
  amountInEther: number,
  gasFees: BigNumber,
  gasPrice: BigNumber,
  gasCurrency: Tokens
) {
  const amountInWei = new BigNumber(amountInEther * 1e18)
  Logger.debug(
    'Send celo dollar test',
    `Testing using account: ${from} -> ${to}, gasCurrency: ${gasCurrency}`
  )
  const fromGoldBalanceBefore: BigNumber = await getGoldBalance(web3, from)
  const fromDollarBalanceBefore: BigNumber = await getDollarBalance(web3, from)
  const toDollarBalanceBefore: BigNumber = await getDollarBalance(web3, to)
  const gasFeeRecipient: string = await getGasFeeRecipient(NETWORK_NAME)
  try {
    // This will go through but subscribing to notifications will fail.
    // "Failed to subscribe to new newBlockHeaders to confirm the transaction receipts."
    // Most likely cause: https://github.com/ethereum/web3.js/issues/951#issuecomment-352010348
    const result: boolean = await sendDollar(
      web3,
      from,
      to,
      amountInWei,
      gasFees,
      gasPrice,
      gasFeeRecipient,
      gasCurrency
    )
    Logger.info('Send celo dollar test', `Result of sendDollar is ${result}`)
  } catch (error) {
    Logger.error(
      'Send celo dollar test',
      `sendDollar failed with error ${error}: ${JSON.stringify(error)}`
    )
  }
  await sleep(20 * 1000)
  const fromGoldBalanceAfter: BigNumber = await getGoldBalance(web3, from)
  const fromDollarBalanceAfter: BigNumber = await getDollarBalance(web3, from)
  const toDollarBalanceAfter: BigNumber = await getDollarBalance(web3, to)
  Logger.debug(
    'Send celo dollar test',
    `Sender Gold balance ${fromGoldBalanceBefore} -> ${fromGoldBalanceAfter}`
  )
  Logger.debug(
    'Send celo dollar test',
    `Receiver Dollar balance ${toDollarBalanceBefore} -> ${toDollarBalanceAfter}`
  )
  const senderGoldBalanceLoss = fromGoldBalanceBefore.minus(fromGoldBalanceAfter).toNumber()
  if (gasCurrency === Tokens.GOLD) {
    const gasCostInCeloGold = fromGoldBalanceBefore.minus(fromGoldBalanceAfter).toNumber()
    Logger.debug('Send celo dollar test', `Gas cost in Celo Gold ${gasCostInCeloGold}`)
    expect(gasCostInCeloGold > 0).toBe(true)
    expect(senderGoldBalanceLoss < amountInEther + 0.01).toBe(true)
  } else if (gasCurrency === Tokens.DOLLAR) {
    Logger.debug(
      'Send celo dollar test',
      `Sender Dollar balance ${fromDollarBalanceBefore} -> ${fromDollarBalanceAfter}`
    )
    const gasCostInCeloDollar = fromDollarBalanceBefore
      .minus(fromDollarBalanceAfter)
      .minus(amountInEther)
      .toNumber()
    Logger.debug('Send celo dollar test', `Gas cost in Celo Dollars ${gasCostInCeloDollar}`)
    expect(gasCostInCeloDollar > 0).toBe(true)
  } else {
    fail(new Error(`unexpected gas currency ${gasCurrency}`))
  }
  expect(toDollarBalanceAfter.minus(toDollarBalanceBefore).toNumber()).toBe(amountInEther)
}
