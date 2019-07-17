import { NETWORK_NAME } from '../contracts/network-name'
import { fetchFileFromGoogleStorage } from './google-storage-utils'
import { Logger } from './logger'

// The bucket where we store static_nodes information for all the networks.
export const StaticNodesGoogleStorageBucketName = `static_nodes`

/**
 * Fetches the static nodes (as JSON data) from Google Storage.
 * If the network is not working, the method will reject the returned promise
 * along with the response data from Google api.
 * @param networkName Name of the network to fetch config for
 */
export async function getStaticNodesAsync(networkName: string): Promise<string> {
  if (networkName !== NETWORK_NAME) {
    Logger.error(
      'getStaticNodesAsync',
      `SDK was built for ${NETWORK_NAME} while the caller is requesting IP address of ${networkName}`
    )
  }
  const bucketName = StaticNodesGoogleStorageBucketName
  const fileName = networkName
  return fetchFileFromGoogleStorage(bucketName, fileName)
}
