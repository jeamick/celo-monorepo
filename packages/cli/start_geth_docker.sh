#!/usr/bin/env bash
set -euo pipefail

# TODO(ashishb): testing only
ls /usr/local/bin

# Usage: start_geth_docker.sh [geth binary location] [network name] [sync mode]
# Delete this
GETH_BINARY=${1:-"/usr/local/bin/geth"}
# Default to testing the integration network
NETWORK_NAME=${2:-"alfajores"}
# Default to testing the full sync mode
SYNCMODE=${3:-"ultralight"}
# Default to 1101
NETWORK_ID=${4:-1101}
GENESIS_FILE_PATH=${5:-"/celo/genesis.json"}
STATIC_NODES_FILE_PATH=${6:-"/celo/static-nodes.json"}

echo "This will start geth local node from ${GETH_BINARY} in '${SYNCMODE}' sync mode which will connect to network '${NETWORK_NAME}'..."

echo "Setting constants..."
DATA_DIR="/tmp/tmp1"
mkdir -p ${DATA_DIR}

echo "Initializing data dir..."
${GETH_BINARY} --datadir ${DATA_DIR} init ${GENESIS_FILE_PATH}
echo "Initializing static nodes..."
cp ${STATIC_NODES_FILE_PATH} ${DATA_DIR}/static-nodes.json

echo "Running geth..."
${GETH_BINARY} \
    --datadir ${DATA_DIR} \
    --syncmode ${SYNCMODE} \
    --rpc \
    --ws \
    --wsport=8546 \
    --wsorigins=* \
    --rpcapi=eth,net,web3,debug,admin,personal \
    --debug \
    --port=30303 \
    --rpcport=8545 \
    --rpcvhosts=* \
    --networkid=${NETWORK_ID} \
    --verbosity=5 \
    --consoleoutput=stdout \
    --consoleformat=term
