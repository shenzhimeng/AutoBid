module.exports = Object.freeze({
     // mainnet or rinkeby，如果想在测试网上测试，填 rinkeby
     NETWORK: "mainnet",
     // NFT 合约地址
     NFT_CONTRACT_ADDRESS: "", 
     // 开始 bid 的 token id，如果不设置，默认为 1
     TOKEN_ID_START: "1",
     // 截止 bid 的 token id，如果不设置，默认 bid 全部
     TOKEN_ID_END: "",
     // 出价金额, 单位默认 weth，请自己计算好钱包中 weth 余额
     OFFER_PRICE: "0.01",
     //  过期时间, 以小时为单位，比如 12 个小时后过期，就填 12
     EXPIRATION_TIME: "12",
})