import { fetchFileFromGoogleStorage } from './google-storage-utils'

const TAG = 'genesis-block-utils'

export const GenesisBlocksGoogleStorageBucketName = 'genesis_blocks'

/**
 * Fetches the genesis block (as JSON data) from Google Storage.
 * If the network is not working, the method will reject the returned promise
 * along with the response data from Google api.
 * @param networkName Name of the network to fetch genesis block for
 */
export async function getGenesisBlockAsync(networkName: string): Promise<string> {
  console.debug(`${TAG} getGenesisBlockAsync("${networkName}") called`)
  return fetchFileFromGoogleStorage(GenesisBlocksGoogleStorageBucketName, networkName)
}

export function getChainIdFromGenesis(genesis: string): number {
  try {
    return JSON.parse(genesis).config.chainId
  } catch (error) {
    throw new Error(`Error extract config.chainId field from "${genesis}"`)
  }
}
