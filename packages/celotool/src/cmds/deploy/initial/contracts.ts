/* tslint:disable no-console */
import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { uploadArtifacts } from '@celo/celotool/src/lib/artifacts'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
import { envVar, execCmd, fetchEnv } from '@celo/celotool/src/lib/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import {
  AccountType,
  generateAccountAddressFromPrivateKey,
  generatePrivateKey,
  getValidatorsPrivateKeys,
} from 'src/lib/generate_utils'
import { OG_ACCOUNTS } from 'src/lib/genesis_constants'

export const command = 'contracts'

export const describe = 'deploy the celo smart contracts'

export const builder = {}

function minerForEnv() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return '0x' + OG_ACCOUNTS[0].address
  } else {
    return generateAccountAddressFromPrivateKey(
      generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.VALIDATOR, 0)
    )
  }
}
function add0x(msg: string) {
  return '0x' + msg
}

function getValidatorKeys() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return OG_ACCOUNTS.map((account) => account.privateKey).map(add0x)
  } else {
    return getValidatorsPrivateKeys(
      fetchEnv(envVar.MNEMONIC),
      parseInt(fetchEnv(envVar.VALIDATORS), 10)
    ).map(add0x)
  }
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()

  console.log(`Deploying smart contracts to ${argv.celoEnv}`)
  const cb = async () => {
    await execCmd(
      `yarn --cwd ../protocol run init-network -n ${
        argv.celoEnv
      } -c '{ "from" : "${minerForEnv()}" }' -k ${getValidatorKeys()}`
    )
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
    await uploadArtifacts(argv.celoEnv)
  } catch (error) {
    console.error(`Unable to deploy smart contracts to ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
