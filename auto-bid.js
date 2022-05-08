
const opensea = require('opensea-js')
const { WyvernSchemaName } = require('opensea-js/lib/types');
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;

const MnemonicWalletSubprovider = require("@0x/subproviders").MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");

const config = require('./config.js')
// 主网 or 测试网
const NETWORK = config.NETWORK;
// NFT 合约地址
const NFT_CONTRACT_ADDRESS = config.NFT_CONTRACT_ADDRESS;
// 出价金额
const OFFER_PRICE = config.OFFER_PRICE;
// 过期时间, 如果没有设置，默认 12 个小时
const expirationTime = config.EXPIRATION_TIME ? config.EXPIRATION_TIME : 12;
const EXPIRATION_TIME = Math.round(Date.now()/ 1000 + 60 * 60* expirationTime);


const secret = require('./secret.js')
// 小狐狸母公司节点 key
const INFURA_KEY = secret.INFURA_KEY;
// OpenSea api key
const OS_API_KEY = secret.OS_API_KEY;

// 自己的钱包地址
const OWNER_ADDRESS = secret.OWNER_ADDRESS;
// 自己钱包地址的助记词
const MNEMONIC = secret.MNEMONIC;

if (!OS_API_KEY || !INFURA_KEY || !OWNER_ADDRESS || !MNEMONIC) {
    console.error("Please set a mnemonic, owner, Infura key, and OpenSea API key.");
    return
}

if(!OFFER_PRICE || !NFT_CONTRACT_ADDRESS ){
    console.error("Please set a offer price and nft contract address.");
    return
}

const BASE_DERIVATION_PATH = `44'/60'/0'/0`;
const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
  baseDerivationPath: BASE_DERIVATION_PATH,
});

const infuraRpcSubprovider = new RPCSubprovider({
  rpcUrl:  "https://" + NETWORK + ".infura.io/v3/" + INFURA_KEY,
});

const providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);
providerEngine.start();

const seaport = new OpenSeaPort(providerEngine,{
      networkName: NETWORK === "mainnet" ? Network.Main : Network.Rinkeby,
      apiKey: OS_API_KEY,
    }
);

// 出价一个
const bidOne = async (_contract, _tokenId) => {
    const offer = await seaport.createBuyOrder({
        asset:{
            tokenAddress: _contract,
            tokenId: _tokenId,
            schemaName: WyvernSchemaName.ERC721
        },
        accountAddress: OWNER_ADDRESS,
        startAmount: OFFER_PRICE,
        expirationTime: EXPIRATION_TIME
    }).then (() =>{
        let d = new Date()
        let dateLog = `[${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}]`
        console.log(`${dateLog} bid successful, price: ${OFFER_PRICE} tokenId : ${_tokenId}`)
    }).catch( err =>{
        let d = new Date()
        let dateLog = `[${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}]`
        console.error(`${dateLog} bid failed, tokenId : ${_tokenId}`)
        console.error(`${dateLog} error message :${err.message}`)
    })
}


// const sleep = function(ms){
//     return new Promise(resolve => setTimeout(resolve,ms))
// }

// 出价一堆
const bidBatch = async (contract, start, end) =>{
    if(end < start) {
        console.error("End must be greater than start")
        return
    }

    end = end+1;
    for (let i = start; i < end; i++){
        await bidOne(contract, i)
        // opensea api 请求速率有限制，如果网速很好, bid 过快建议加上 sleep 
        // await sleep(10)
    }
}

const bid = async() =>{
    let start = config.TOKEN_ID_START
    if(!start){
        start = 1
    }

    let  end = config.TOKEN_ID_END
    if (!end) {
        const asset = await seaport.api.getAsset({
            tokenAddress : NFT_CONTRACT_ADDRESS,
            tokenId : start
          })
          .then(data => {
            console.log( `total_supply : ${data.collection.stats.total_supply}`)
            end = data.collection.stats.total_supply
          })
          .catch(err => console.error(err.message) )
    }

    console.log(`\ntokenAddress: ${NFT_CONTRACT_ADDRESS} \nstart : ${start} \nend : ${end}\n \nstart offer\n`)
    bidBatch(NFT_CONTRACT_ADDRESS, parseInt(start), parseInt(end))
        .then( ()=>{
            console.log(`\nComplete offer\n`)
            process.exit(1)
        })
        .catch(err => {
            console.error(err.message)
            process.exit(1)
        })
}

bid()