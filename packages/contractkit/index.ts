import * as ContractUtils from './src/contract-utils-v2'
import * as GenesisBlockUtils from './src/genesis-block-utils'
import * as GoogleStorageUtils from './src/google-storage-utils'
import * as Logger from './src/logger'
import * as StaticNodeUtils from './src/static-node-utils'
import * as Web3Utils from './src/web3-utils'

export * from './contracts/index'
export {
  CeloFunctionCall,
  CeloLog,
  FunctionABICache,
  constructFunctionABICache,
  getFunctionSignatureFromInput,
  parseFunctionCall,
  parseLog,
} from './src/abi'
export { unlockAccount } from './src/account-utils'
export {
  ActionableAttestation,
  AttestationState,
  attestationMessageToSign,
  decodeAttestationCode,
  extractAttestationCodeFromMessage,
  findMatchingIssuer,
  getActionableAttestations,
  getAttestationFee,
  getAttestationState,
  getWalletAddress,
  lookupPhoneNumbers,
  makeApproveAttestationFeeTx,
  makeCompleteTx,
  makeRequestTx,
  makeRevealTx,
  makeSetWalletAddressTx,
  messageContainsAttestationCode,
  sanitizeBase64,
  validateAttestationCode,
} from './src/attestations'
export {
  CeloContract,
  Contracts,
  SendTransaction,
  SendTransactionLogEvent,
  SendTransactionLogEventType,
  TxLogger,
  TxPromises,
  awaitConfirmation,
  emptyTxLogger,
  getContracts,
  selectContractByAddress,
  sendTransaction,
  sendTransactionAsync,
} from './src/contract-utils'
export {
  getABEContract,
  getAttestationsContract,
  getEscrowContract,
  getExchangeContract,
  getGasPriceMinimumContract,
  getGoldTokenContract,
  getStableTokenContract,
} from './src/contracts'
export {
  CeloTokenType,
  allowance,
  approveToken,
  balanceOf,
  convertToContractDecimals,
  getErc20Balance,
  getGoldTokenAddress,
  parseFromContractDecimals,
  selectTokenContractByIdentifier,
  transferToken,
  transferTokenWithComment,
} from './src/erc20-utils'
export { ContractUtils }
export { GenesisBlockUtils }
export { GoogleStorageUtils }
export { Logger }
export { StaticNodeUtils }
export { Web3Utils }
