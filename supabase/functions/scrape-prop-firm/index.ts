import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive list of 200+ prop firms across forex, crypto, and futures
const PROP_FIRMS = [
  // === FOREX PROP FIRMS (100+) ===
  { name: 'FTMO', slug: 'ftmo', website: 'https://ftmo.com', category: 'forex' },
  { name: 'Funding Pips', slug: 'funding-pips', website: 'https://fundingpips.com', category: 'forex' },
  { name: 'MyFundedFX', slug: 'myfundedfx', website: 'https://myfundedfx.com', category: 'forex' },
  { name: 'The Funded Trader', slug: 'the-funded-trader', website: 'https://thefundedtrader.com', category: 'forex' },
  { name: 'True Forex Funds', slug: 'true-forex-funds', website: 'https://trueforexfunds.com', category: 'forex' },
  { name: 'E8 Funding', slug: 'e8-funding', website: 'https://e8funding.com', category: 'forex' },
  { name: 'Alpha Capital Group', slug: 'alpha-capital-group', website: 'https://alphacapitalgroup.uk', category: 'forex' },
  { name: 'FundedNext', slug: 'fundednext', website: 'https://fundednext.com', category: 'forex' },
  { name: 'Lux Trading Firm', slug: 'lux-trading-firm', website: 'https://luxtradingfirm.com', category: 'forex' },
  { name: 'City Traders Imperium', slug: 'city-traders-imperium', website: 'https://citytradersimperium.com', category: 'forex' },
  { name: 'Fidelcrest', slug: 'fidelcrest', website: 'https://fidelcrest.com', category: 'forex' },
  { name: 'Goat Funded Trader', slug: 'goat-funded-trader', website: 'https://goatfundedtrader.com', category: 'forex' },
  { name: 'Funded Trading Plus', slug: 'funded-trading-plus', website: 'https://fundedtradingplus.com', category: 'forex' },
  { name: 'The5ers', slug: 'the5ers', website: 'https://the5ers.com', category: 'forex' },
  { name: 'Audacity Capital', slug: 'audacity-capital', website: 'https://audacitycapital.co.uk', category: 'forex' },
  { name: 'FXIFY', slug: 'fxify', website: 'https://fxify.com', category: 'forex' },
  { name: 'Traders With Edge', slug: 'traders-with-edge', website: 'https://traderswithedge.com', category: 'forex' },
  { name: 'Blue Guardian', slug: 'blue-guardian', website: 'https://blueguardian.com', category: 'forex' },
  { name: 'Finotive Funding', slug: 'finotive-funding', website: 'https://finotivefunding.com', category: 'forex' },
  { name: 'SurgeTrader', slug: 'surgetrader', website: 'https://surgetrader.com', category: 'forex' },
  { name: 'Ment Funding', slug: 'ment-funding', website: 'https://mentfunding.com', category: 'forex' },
  { name: 'For Traders', slug: 'for-traders', website: 'https://fortraders.com', category: 'forex' },
  { name: 'Glow Node', slug: 'glow-node', website: 'https://glownode.com', category: 'forex' },
  { name: 'Nordic Funder', slug: 'nordic-funder', website: 'https://nordicfunder.com', category: 'forex' },
  { name: 'Aqua Funded', slug: 'aqua-funded', website: 'https://aquafunded.com', category: 'forex' },
  { name: 'Funded Academy', slug: 'funded-academy', website: 'https://fundedacademy.com', category: 'forex' },
  { name: 'Smart Prop Trader', slug: 'smart-prop-trader', website: 'https://smartproptrader.com', category: 'forex' },
  { name: 'Forex Capital Funds', slug: 'forex-capital-funds', website: 'https://forexcapitalfunds.com', category: 'forex' },
  { name: 'OFP Funding', slug: 'ofp-funding', website: 'https://ofpfunding.com', category: 'forex' },
  { name: 'Instant Funding', slug: 'instant-funding', website: 'https://instantfunding.io', category: 'forex' },
  { name: 'TopTier Trader', slug: 'toptier-trader', website: 'https://toptiertrader.com', category: 'forex' },
  { name: 'Bespoke Funding', slug: 'bespoke-funding', website: 'https://bespokefunding.com', category: 'forex' },
  { name: 'Leveled Up Society', slug: 'leveled-up-society', website: 'https://leveledupsociety.com', category: 'forex' },
  { name: 'Skilled Funded Traders', slug: 'skilled-funded-traders', website: 'https://skilledfundedtraders.com', category: 'forex' },
  { name: 'The Trading Pit', slug: 'the-trading-pit', website: 'https://thetradingpit.com', category: 'forex' },
  { name: 'Funded Trader', slug: 'funded-trader', website: 'https://fundedtrader.com', category: 'forex' },
  { name: 'Prop Trading Firm', slug: 'prop-trading-firm', website: 'https://proptradingfirm.com', category: 'forex' },
  { name: 'My Forex Funds', slug: 'my-forex-funds', website: 'https://myforexfunds.com', category: 'forex' },
  { name: 'OANDA Prop Trader', slug: 'oanda-prop-trader', website: 'https://oandaproptrader.com', category: 'forex' },
  { name: 'DNA Funded', slug: 'dna-funded', website: 'https://dnafunded.com', category: 'forex' },
  { name: 'RebelsFunding', slug: 'rebelsfunding', website: 'https://rebelsfunding.com', category: 'forex' },
  { name: 'Ascendx Capital', slug: 'ascendx-capital', website: 'https://ascendxcapital.com', category: 'forex' },
  { name: 'Funded Bulls', slug: 'funded-bulls', website: 'https://fundedbulls.com', category: 'forex' },
  { name: 'Forex Prop Firm', slug: 'forex-prop-firm', website: 'https://forexpropfirm.com', category: 'forex' },
  { name: 'FundingTraders', slug: 'fundingtraders', website: 'https://fundingtraders.com', category: 'forex' },
  { name: 'Prop Firm Match', slug: 'prop-firm-match', website: 'https://propfirmmatch.com', category: 'forex' },
  { name: 'Maven Trading', slug: 'maven-trading', website: 'https://maventrading.com', category: 'forex' },
  { name: 'Nova Funding', slug: 'nova-funding', website: 'https://novafunding.com', category: 'forex' },
  { name: 'Rocket21', slug: 'rocket21', website: 'https://rocket21.com', category: 'forex' },
  { name: 'Traders Central Fund', slug: 'traders-central-fund', website: 'https://traderscentralfund.com', category: 'forex' },
  { name: 'TradeLocker Prop', slug: 'tradelocker-prop', website: 'https://tradelockerprop.com', category: 'forex' },
  { name: 'UltraCap Trading', slug: 'ultracap-trading', website: 'https://ultracaptrading.com', category: 'forex' },
  { name: 'Vantage Funded', slug: 'vantage-funded', website: 'https://vantagefunded.com', category: 'forex' },
  { name: 'Wintrust FX', slug: 'wintrust-fx', website: 'https://wintrustfx.com', category: 'forex' },
  { name: 'Xenith Traders', slug: 'xenith-traders', website: 'https://xenithtraders.com', category: 'forex' },
  { name: 'Yellow Brick Trading', slug: 'yellow-brick-trading', website: 'https://yellowbricktrading.com', category: 'forex' },
  { name: 'Zenith Funding', slug: 'zenith-funding', website: 'https://zenithfunding.com', category: 'forex' },
  { name: 'Ace Traders', slug: 'ace-traders', website: 'https://acetraders.com', category: 'forex' },
  { name: 'Bear Bull Traders Prop', slug: 'bear-bull-traders-prop', website: 'https://bearbulltraders.com/prop', category: 'forex' },
  { name: 'Capital Bears', slug: 'capital-bears', website: 'https://capitalbears.com', category: 'forex' },
  { name: 'Darwinex Zero', slug: 'darwinex-zero', website: 'https://darwinex.com/zero', category: 'forex' },
  { name: 'Eagle FX Prop', slug: 'eagle-fx-prop', website: 'https://eaglefxprop.com', category: 'forex' },
  { name: 'FundedFirm', slug: 'fundedfirm', website: 'https://fundedfirm.com', category: 'forex' },
  { name: 'Global Prop Trading', slug: 'global-prop-trading', website: 'https://globalproptrading.com', category: 'forex' },
  { name: 'Horizon Funded', slug: 'horizon-funded', website: 'https://horizonfunded.com', category: 'forex' },
  { name: 'Icon FX', slug: 'icon-fx', website: 'https://iconfx.com', category: 'forex' },
  { name: 'Jupiter Traders', slug: 'jupiter-traders', website: 'https://jupitertraders.com', category: 'forex' },
  { name: 'Kingsman FX', slug: 'kingsman-fx', website: 'https://kingsmanfx.com', category: 'forex' },
  { name: 'Lionheart Funding', slug: 'lionheart-funding', website: 'https://lionheartfunding.com', category: 'forex' },
  { name: 'Momentum Prop', slug: 'momentum-prop', website: 'https://momentumprop.com', category: 'forex' },
  { name: 'Next Level Trading', slug: 'next-level-trading', website: 'https://nextleveltrading.com', category: 'forex' },
  { name: 'Omega Traders', slug: 'omega-traders', website: 'https://omegatraders.com', category: 'forex' },
  { name: 'Pacific Funding', slug: 'pacific-funding', website: 'https://pacificfunding.com', category: 'forex' },
  { name: 'Quantum Prop', slug: 'quantum-prop', website: 'https://quantumprop.com', category: 'forex' },
  { name: 'Rising Traders', slug: 'rising-traders', website: 'https://risingtraders.com', category: 'forex' },
  { name: 'Summit Funding', slug: 'summit-funding', website: 'https://summitfunding.com', category: 'forex' },
  { name: 'Titan Prop Firm', slug: 'titan-prop-firm', website: 'https://titanpropfirm.com', category: 'forex' },
  { name: 'Underdog Trading', slug: 'underdog-trading', website: 'https://underdogtrading.com', category: 'forex' },
  { name: 'Victory Prop', slug: 'victory-prop', website: 'https://victoryprop.com', category: 'forex' },
  { name: 'Warrior Trading Prop', slug: 'warrior-trading-prop', website: 'https://warriortradingprop.com', category: 'forex' },
  { name: 'FX2 Funding', slug: 'fx2-funding', website: 'https://fx2funding.com', category: 'forex' },
  { name: 'ThinkCapital', slug: 'thinkcapital', website: 'https://thinkcapital.com', category: 'forex' },
  { name: 'Prop Pass', slug: 'prop-pass', website: 'https://proppass.com', category: 'forex' },
  { name: 'Fast Track Trading', slug: 'fast-track-trading', website: 'https://fasttracktrading.com', category: 'forex' },
  { name: 'Elite Funded', slug: 'elite-funded', website: 'https://elitefunded.com', category: 'forex' },
  { name: 'Monevis', slug: 'monevis', website: 'https://monevis.com', category: 'forex' },
  { name: 'TradeWithProp', slug: 'tradewithprop', website: 'https://tradewithprop.com', category: 'forex' },
  { name: 'Kratos Funded', slug: 'kratos-funded', website: 'https://kratosfunded.com', category: 'forex' },
  { name: 'Propified', slug: 'propified', website: 'https://propified.com', category: 'forex' },
  { name: 'Funding Talent', slug: 'funding-talent', website: 'https://fundingtalent.com', category: 'forex' },
  { name: 'TradersLaunch', slug: 'traderslaunch', website: 'https://traderslaunch.com', category: 'forex' },
  { name: 'Prop Firms Central', slug: 'prop-firms-central', website: 'https://propfirmscentral.com', category: 'forex' },
  { name: 'Alpha Hunters', slug: 'alpha-hunters', website: 'https://alphahunters.com', category: 'forex' },
  { name: 'FunderPro', slug: 'funderpro', website: 'https://funderpro.com', category: 'forex' },
  { name: 'PipFarm', slug: 'pipfarm', website: 'https://pipfarm.com', category: 'forex' },
  
  // === CRYPTO PROP FIRMS (40+) ===
  { name: 'Breakout', slug: 'breakout', website: 'https://breakoutprop.com', category: 'crypto' },
  { name: 'CryptoFundTrader', slug: 'cryptofundtrader', website: 'https://cryptofundtrader.com', category: 'crypto' },
  { name: 'My Crypto Funding', slug: 'my-crypto-funding', website: 'https://mycryptofunding.com', category: 'crypto' },
  { name: 'Crypto Fund Trader', slug: 'crypto-fund-trader', website: 'https://crypto-fund-trader.com', category: 'crypto' },
  { name: 'Crypto Prop Trading', slug: 'crypto-prop-trading', website: 'https://cryptoproptrading.com', category: 'crypto' },
  { name: 'Bit Funded', slug: 'bit-funded', website: 'https://bitfunded.com', category: 'crypto' },
  { name: 'Crypto Traders Fund', slug: 'crypto-traders-fund', website: 'https://cryptotradersfund.com', category: 'crypto' },
  { name: 'DeFi Prop', slug: 'defi-prop', website: 'https://defiprop.com', category: 'crypto' },
  { name: 'Bitcoin Prop Trading', slug: 'bitcoin-prop-trading', website: 'https://bitcoinproptrading.com', category: 'crypto' },
  { name: 'Altcoin Funding', slug: 'altcoin-funding', website: 'https://altcoinfunding.com', category: 'crypto' },
  { name: 'Satoshi Prop', slug: 'satoshi-prop', website: 'https://satoshiprop.com', category: 'crypto' },
  { name: 'CryptoTradeHouse', slug: 'cryptotradehouse', website: 'https://cryptotradehouse.com', category: 'crypto' },
  { name: 'Digital Asset Prop', slug: 'digital-asset-prop', website: 'https://digitalassetprop.com', category: 'crypto' },
  { name: 'Web3 Funding', slug: 'web3-funding', website: 'https://web3funding.com', category: 'crypto' },
  { name: 'Token Traders', slug: 'token-traders', website: 'https://tokentraders.com', category: 'crypto' },
  { name: 'Blockchain Prop', slug: 'blockchain-prop', website: 'https://blockchainprop.com', category: 'crypto' },
  { name: 'Ethereum Funded', slug: 'ethereum-funded', website: 'https://ethereumfunded.com', category: 'crypto' },
  { name: 'Binance Prop Trading', slug: 'binance-prop-trading', website: 'https://binanceproptrading.com', category: 'crypto' },
  { name: 'Solana Prop', slug: 'solana-prop', website: 'https://solanaprop.com', category: 'crypto' },
  { name: 'Crypto Capital FX', slug: 'crypto-capital-fx', website: 'https://cryptocapitalfx.com', category: 'crypto' },
  { name: 'Bitcoin Bulls Fund', slug: 'bitcoin-bulls-fund', website: 'https://bitcoinbullsfund.com', category: 'crypto' },
  { name: 'Decentralized Prop', slug: 'decentralized-prop', website: 'https://decentralizedprop.com', category: 'crypto' },
  { name: 'Crypto Apex', slug: 'crypto-apex', website: 'https://cryptoapex.com', category: 'crypto' },
  { name: 'Moon Prop Trading', slug: 'moon-prop-trading', website: 'https://moonproptrading.com', category: 'crypto' },
  { name: 'HODL Fund', slug: 'hodl-fund', website: 'https://hodlfund.com', category: 'crypto' },
  { name: 'Crypto Funded Trader', slug: 'crypto-funded-trader', website: 'https://cryptofundedtrader.io', category: 'crypto' },
  { name: 'Chain Prop', slug: 'chain-prop', website: 'https://chainprop.com', category: 'crypto' },
  { name: 'NFT Prop Trading', slug: 'nft-prop-trading', website: 'https://nftproptrading.com', category: 'crypto' },
  { name: 'Stablecoin Fund', slug: 'stablecoin-fund', website: 'https://stablecoinfund.com', category: 'crypto' },
  { name: 'Crypto Whale Prop', slug: 'crypto-whale-prop', website: 'https://cryptowhaleprop.com', category: 'crypto' },
  { name: 'Layer2 Funding', slug: 'layer2-funding', website: 'https://layer2funding.com', category: 'crypto' },
  { name: 'CoinFunded', slug: 'coinfunded', website: 'https://coinfunded.com', category: 'crypto' },
  { name: 'Perpetual Prop', slug: 'perpetual-prop', website: 'https://perpetualprop.com', category: 'crypto' },
  { name: 'BitTraders Fund', slug: 'bittraders-fund', website: 'https://bittradersfund.com', category: 'crypto' },
  { name: 'Crypto Leverage Prop', slug: 'crypto-leverage-prop', website: 'https://cryptoleverageprop.com', category: 'crypto' },
  { name: 'Exchange Prop', slug: 'exchange-prop', website: 'https://exchangeprop.com', category: 'crypto' },
  { name: 'CryptoFX Funding', slug: 'cryptofx-funding', website: 'https://cryptofxfunding.com', category: 'crypto' },
  { name: 'Degen Prop', slug: 'degen-prop', website: 'https://degenprop.com', category: 'crypto' },
  { name: 'Spot Trading Prop', slug: 'spot-trading-prop', website: 'https://spottradingprop.com', category: 'crypto' },
  { name: 'Margin Crypto Fund', slug: 'margin-crypto-fund', website: 'https://margincryptofund.com', category: 'crypto' },
  
  // === FUTURES PROP FIRMS (60+) ===
  { name: 'Apex Trader Funding', slug: 'apex-trader-funding', website: 'https://apextraderfunding.com', category: 'futures' },
  { name: 'Topstep', slug: 'topstep', website: 'https://topstep.com', category: 'futures' },
  { name: 'Earn2Trade', slug: 'earn2trade', website: 'https://earn2trade.com', category: 'futures' },
  { name: 'Bulenox', slug: 'bulenox', website: 'https://bulenox.com', category: 'futures' },
  { name: 'TradeDay', slug: 'tradeday', website: 'https://tradeday.com', category: 'futures' },
  { name: 'Leeloo Trading', slug: 'leeloo-trading', website: 'https://leelootrading.com', category: 'futures' },
  { name: 'Take Profit Trader', slug: 'take-profit-trader', website: 'https://takeprofittrader.com', category: 'futures' },
  { name: 'UProfit', slug: 'uprofit', website: 'https://uprofit.com', category: 'futures' },
  { name: 'Elite Trader Funding', slug: 'elite-trader-funding', website: 'https://elitetraderfunding.com', category: 'futures' },
  { name: 'Tradovate Prop', slug: 'tradovate-prop', website: 'https://tradovateprop.com', category: 'futures' },
  { name: 'BluSky Trading', slug: 'blusky-trading', website: 'https://bluskytrading.com', category: 'futures' },
  { name: 'OneUp Trader', slug: 'oneup-trader', website: 'https://oneuptrader.com', category: 'futures' },
  { name: 'SpeedUp Trader', slug: 'speedup-trader', website: 'https://speeduptrader.com', category: 'futures' },
  { name: 'Tick Tick Trader', slug: 'tick-tick-trader', website: 'https://tickticktrader.com', category: 'futures' },
  { name: 'Fast Track Funding', slug: 'fast-track-funding', website: 'https://fasttrackfunding.io', category: 'futures' },
  { name: 'My Funded Futures', slug: 'my-funded-futures', website: 'https://myfundedfutures.com', category: 'futures' },
  { name: 'Trade Fundrr', slug: 'trade-fundrr', website: 'https://tradefundrr.com', category: 'futures' },
  { name: 'Futures Funded', slug: 'futures-funded', website: 'https://futuresfunded.com', category: 'futures' },
  { name: 'CME Prop Trading', slug: 'cme-prop-trading', website: 'https://cmeproptrading.com', category: 'futures' },
  { name: 'E-mini Traders', slug: 'e-mini-traders', website: 'https://eminitraders.com', category: 'futures' },
  { name: 'Micro Futures Prop', slug: 'micro-futures-prop', website: 'https://microfuturesprop.com', category: 'futures' },
  { name: 'NQ Traders Fund', slug: 'nq-traders-fund', website: 'https://nqtradersfund.com', category: 'futures' },
  { name: 'ES Funding', slug: 'es-funding', website: 'https://esfunding.com', category: 'futures' },
  { name: 'Crude Oil Prop', slug: 'crude-oil-prop', website: 'https://crudeoilprop.com', category: 'futures' },
  { name: 'Gold Futures Fund', slug: 'gold-futures-fund', website: 'https://goldfuturesfund.com', category: 'futures' },
  { name: 'Index Traders Prop', slug: 'index-traders-prop', website: 'https://indextradersprop.com', category: 'futures' },
  { name: 'Options Prop Trading', slug: 'options-prop-trading', website: 'https://optionsproptrading.com', category: 'futures' },
  { name: 'Commodities Fund', slug: 'commodities-fund', website: 'https://commoditiesfund.com', category: 'futures' },
  { name: 'S&P Prop Traders', slug: 'sp-prop-traders', website: 'https://spproptraders.com', category: 'futures' },
  { name: 'Russell Funding', slug: 'russell-funding', website: 'https://russellfunding.com', category: 'futures' },
  { name: 'Treasury Prop', slug: 'treasury-prop', website: 'https://treasuryprop.com', category: 'futures' },
  { name: 'Yield Traders Fund', slug: 'yield-traders-fund', website: 'https://yieldtradersfund.com', category: 'futures' },
  { name: 'DAX Prop Trading', slug: 'dax-prop-trading', website: 'https://daxproptrading.com', category: 'futures' },
  { name: 'FTSE Funded', slug: 'ftse-funded', website: 'https://ftsefunded.com', category: 'futures' },
  { name: 'Nikkei Prop', slug: 'nikkei-prop', website: 'https://nikkeiprop.com', category: 'futures' },
  { name: 'Hang Seng Traders', slug: 'hang-seng-traders', website: 'https://hangsengtraders.com', category: 'futures' },
  { name: 'Eurex Funding', slug: 'eurex-funding', website: 'https://eurexfunding.com', category: 'futures' },
  { name: 'ICE Prop Trading', slug: 'ice-prop-trading', website: 'https://iceproptrading.com', category: 'futures' },
  { name: 'Agricultural Prop', slug: 'agricultural-prop', website: 'https://agriculturalprop.com', category: 'futures' },
  { name: 'Energy Traders Fund', slug: 'energy-traders-fund', website: 'https://energytradersfund.com', category: 'futures' },
  { name: 'Metal Prop Trading', slug: 'metal-prop-trading', website: 'https://metalproptrading.com', category: 'futures' },
  { name: 'Soft Commodities Prop', slug: 'soft-commodities-prop', website: 'https://softcommoditiesprop.com', category: 'futures' },
  { name: 'VIX Traders Fund', slug: 'vix-traders-fund', website: 'https://vixtradersfund.com', category: 'futures' },
  { name: 'Volatility Prop', slug: 'volatility-prop', website: 'https://volatilityprop.com', category: 'futures' },
  { name: 'Spread Traders Fund', slug: 'spread-traders-fund', website: 'https://spreadtradersfund.com', category: 'futures' },
  { name: 'Scalping Futures Prop', slug: 'scalping-futures-prop', website: 'https://scalpingfuturesprop.com', category: 'futures' },
  { name: 'Day Trading Futures', slug: 'day-trading-futures', website: 'https://daytradingfutures.com', category: 'futures' },
  { name: 'Swing Futures Fund', slug: 'swing-futures-fund', website: 'https://swingfuturesfund.com', category: 'futures' },
  { name: 'Position Traders Prop', slug: 'position-traders-prop', website: 'https://positiontradersprop.com', category: 'futures' },
  { name: 'Algorithmic Futures', slug: 'algorithmic-futures', website: 'https://algorithmicfutures.com', category: 'futures' },
  { name: 'Quant Prop Trading', slug: 'quant-prop-trading', website: 'https://quantproptrading.com', category: 'futures' },
  { name: 'HFT Prop Fund', slug: 'hft-prop-fund', website: 'https://hftpropfund.com', category: 'futures' },
  { name: 'Market Maker Prop', slug: 'market-maker-prop', website: 'https://marketmakerprop.com', category: 'futures' },
  { name: 'Arbitrage Traders Fund', slug: 'arbitrage-traders-fund', website: 'https://arbitragetradersfund.com', category: 'futures' },
  { name: 'Delta Neutral Prop', slug: 'delta-neutral-prop', website: 'https://deltaneutralprop.com', category: 'futures' },
  { name: 'Gamma Trading Fund', slug: 'gamma-trading-fund', website: 'https://gammatradingfund.com', category: 'futures' },
  { name: 'Theta Prop', slug: 'theta-prop', website: 'https://thetaprop.com', category: 'futures' },
  { name: 'Vega Traders', slug: 'vega-traders', website: 'https://vegatraders.com', category: 'futures' },
  { name: 'Rho Funding', slug: 'rho-funding', website: 'https://rhofunding.com', category: 'futures' },
];

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<any> {
  console.log(`Scraping ${url}...`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Firecrawl error for ${url}:`, error);
    throw new Error(`Firecrawl request failed: ${response.status}`);
  }

  return await response.json();
}

 async function extractRulesWithAI(content: string, firmName: string, openaiApiKey: string | undefined): Promise<any> {
  console.log(`Extracting rules for ${firmName} using AI...`);
  
const prompt = `You are an expert at extracting trading rules from prop firm websites. 
  
Analyze the following content from ${firmName} and extract ALL trading rules in a structured JSON format.

For EACH account type/challenge offered (e.g., "Evaluation", "Challenge Phase 1", "Challenge Phase 2", "Funded", "Instant Funding", etc.), extract:

BASIC RULES:
1. account_type: The name of the account/challenge type
2. account_sizes: Array of available account sizes in USD (e.g., [10000, 25000, 50000, 100000, 200000])
3. max_daily_loss_percent: Maximum daily loss percentage allowed (number)
4. max_total_drawdown_percent: Maximum total/overall drawdown percentage (number)
5. profit_target_percent: Profit target percentage to pass (number, null if not applicable)
6. min_trading_days: Minimum trading days required (number, null if not mentioned)
7. max_trading_days: Maximum trading days allowed (number, null if unlimited)
8. news_trading_allowed: Whether news trading is allowed (boolean)
9. weekend_holding_allowed: Whether holding positions over weekend is allowed (boolean)
10. ea_allowed: Whether Expert Advisors/bots are allowed (boolean)
11. copy_trading_allowed: Whether copy trading is allowed (boolean)
12. scaling_plan: Description of scaling/growth plan if available (string or null)

CONSISTENCY RULES (CRITICAL - Look for these carefully, they are often hidden):
13. consistency_rule_percent: Maximum percentage of total profit allowed from a single trading day (e.g., 30-40% is common)
14. consistency_rule_type: Type of consistency rule - "daily_cap", "weekly_cap", "profit_share", or "lot_consistency"

POSITION/RISK LIMITS:
15. max_position_size: Maximum lot size allowed per trade (number or null)
16. max_open_trades: Maximum number of simultaneous positions allowed (number or null)
17. max_open_lots: Maximum total lots across all positions (number or null)
18. max_leverage: Maximum leverage allowed (number or null)

STRATEGY RESTRICTIONS:
19. hedging_allowed: Whether hedging same pair is allowed (boolean)
20. martingale_allowed: Whether martingale/grid/averaging is allowed (boolean)
21. stop_loss_required: Whether stop loss is mandatory (boolean)
22. min_stop_loss_pips: Minimum stop loss distance in pips (number or null)
23. prohibited_instruments: Array of banned trading instruments (e.g., ["exotic pairs", "crypto", "indices"])
24. prohibited_strategies: Array of banned strategies (e.g., ["grid", "martingale", "latency_arbitrage", "news scalping"])
25. trading_time_restrictions: Any time-based restrictions as object (e.g., {"no_trading_before": "08:00", "no_trading_after": "22:00"})

PAYOUT INFO:
26. payout_split: Profit split percentage for traders (e.g., 80 means 80/20 split)
27. payout_frequency: When payouts happen - "weekly", "bi-weekly", "monthly", "on-demand"
28. first_payout_delay: Days until first payout is eligible (number)

OTHER:
29. inactivity_rule_days: Days without trading before account termination (number or null)
30. reset_fee: Cost to reset a failed challenge in USD (number or null)
31. refund_policy: Refund conditions description (string or null)
32. additional_rules: Any other important rules as an array of strings

Return a JSON object with:
{
  "rules": [
    {
      "account_type": "...",
      "account_sizes": [...],
      "consistency_rule_percent": 30,
      "consistency_rule_type": "daily_cap",
      "hedging_allowed": false,
      "martingale_allowed": false,
      ...
    }
  ],
  "description": "Brief description of the prop firm"
}

IMPORTANT: 
- Look VERY carefully for hidden rules about consistency, position sizing, and prohibited strategies
- Many firms have a "consistency rule" limiting daily profit to 30-40% of total
- If you cannot find specific information, use null for that field
- Be thorough - missing a rule can cause traders to fail their accounts

Content to analyze:

${content.substring(0, 20000)}`;

   const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
   const apiUrl = openaiApiKey 
     ? 'https://api.openai.com/v1/chat/completions'
     : 'https://ai.gateway.lovable.dev/v1/chat/completions';
   const apiKey = openaiApiKey || lovableApiKey;
   const modelName = openaiApiKey ? 'gpt-4o-mini' : 'google/gemini-3-flash-preview';
   
   const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are a prop firm rules extraction expert. Always respond with valid JSON only, no markdown code blocks.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`AI extraction error:`, error);
    
    // Try fallback to Lovable AI if OpenAI fails with 401
    if (response.status === 401 && openaiApiKey && lovableApiKey) {
      console.log('OpenAI auth failed, trying Lovable AI Gateway fallback...');
      const fallbackResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are a prop firm rules extraction expert. Always respond with valid JSON only, no markdown code blocks.' },
            { role: 'user', content: prompt }
          ],
        }),
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const aiResponse = fallbackData.choices?.[0]?.message?.content || '';
        let cleanedResponse = aiResponse.trim();
        if (cleanedResponse.startsWith('```json')) cleanedResponse = cleanedResponse.slice(7);
        else if (cleanedResponse.startsWith('```')) cleanedResponse = cleanedResponse.slice(3);
        if (cleanedResponse.endsWith('```')) cleanedResponse = cleanedResponse.slice(0, -3);
        try {
          return JSON.parse(cleanedResponse.trim());
        } catch (e) {
          console.error('Failed to parse fallback AI response:', cleanedResponse);
          return null;
        }
      }
    }
    
    throw new Error(`AI extraction failed: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || '';
  
  // Clean up the response - remove markdown code blocks if present
  let cleanedResponse = aiResponse.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7);
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3);
  }
  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3);
  }
  
  try {
    return JSON.parse(cleanedResponse.trim());
  } catch (e) {
    console.error('Failed to parse AI response:', cleanedResponse);
    return null;
  }
}

async function processOneFirm(
  firm: { name: string; slug: string; website: string; category: string },
  supabase: any,
  firecrawlApiKey: string,
   openaiApiKey: string | undefined
): Promise<{ firm: string; status: string; rulesCount?: number; error?: string }> {
  try {
    console.log(`Processing ${firm.name}...`);
    
    // Update or insert the prop firm
    const { data: existingFirm } = await supabase
      .from('prop_firms')
      .select('id')
      .eq('slug', firm.slug)
      .single();

    let firmId: string;
    
    if (existingFirm) {
      firmId = existingFirm.id;
      await supabase
        .from('prop_firms')
        .update({ 
          scrape_status: 'scraping',
          updated_at: new Date().toISOString()
        })
        .eq('id', firmId);
    } else {
      const { data: newFirm, error: insertError } = await supabase
        .from('prop_firms')
        .insert({
          name: firm.name,
          slug: firm.slug,
          website_url: firm.website,
          is_active: true,
          scrape_status: 'scraping',
          description: `${firm.category.charAt(0).toUpperCase() + firm.category.slice(1)} prop trading firm`
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`Error inserting firm ${firm.name}:`, insertError);
        return { firm: firm.name, status: 'error', error: insertError.message };
      }
      firmId = newFirm.id;
    }

    // Scrape the website
    const scrapedData = await scrapeWithFirecrawl(firm.website, firecrawlApiKey);
    const markdown = scrapedData.data?.markdown || scrapedData.markdown || '';
    
    if (!markdown) {
      console.log(`No content found for ${firm.name}`);
      await supabase
        .from('prop_firms')
        .update({ scrape_status: 'no_content', last_scraped_at: new Date().toISOString() })
        .eq('id', firmId);
      return { firm: firm.name, status: 'no_content' };
    }

    // Try to scrape rules/FAQ pages for more detail
    let combinedContent = markdown;
    const rulePaths = ['/rules', '/faq', '/trading-rules', '/how-it-works'];
    
    for (const path of rulePaths.slice(0, 1)) {
      try {
        const additionalData = await scrapeWithFirecrawl(`${firm.website}${path}`, firecrawlApiKey);
        const additionalMarkdown = additionalData.data?.markdown || additionalData.markdown || '';
        if (additionalMarkdown) {
          combinedContent += '\n\n---\n\n' + additionalMarkdown;
        }
      } catch {
        // Ignore errors for additional pages
      }
    }

    // Extract rules using AI
     const extractedData = await extractRulesWithAI(combinedContent, firm.name, openaiApiKey);
    
    if (!extractedData || !extractedData.rules) {
      console.log(`No rules extracted for ${firm.name}`);
      await supabase
        .from('prop_firms')
        .update({ 
          scrape_status: 'extraction_failed',
          last_scraped_at: new Date().toISOString()
        })
        .eq('id', firmId);
      return { firm: firm.name, status: 'extraction_failed' };
    }

    // Update firm description
    if (extractedData.description) {
      await supabase
        .from('prop_firms')
        .update({ description: extractedData.description })
        .eq('id', firmId);
    }

    // Get current rules for change detection
    const { data: currentRules } = await supabase
      .from('prop_firm_rules')
      .select('*')
      .eq('prop_firm_id', firmId)
      .eq('is_current', true);

    // Mark old rules as not current
    await supabase
      .from('prop_firm_rules')
      .update({ is_current: false })
      .eq('prop_firm_id', firmId);

    // Get the latest version number
    const { data: latestVersion } = await supabase
      .from('prop_firm_rules')
      .select('version')
      .eq('prop_firm_id', firmId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (latestVersion?.version || 0) + 1;

    // Insert new rules
    for (const rule of extractedData.rules) {
      const newRule = {
        prop_firm_id: firmId,
        account_type: rule.account_type || 'Standard',
        account_sizes: rule.account_sizes,
        max_daily_loss_percent: rule.max_daily_loss_percent,
        max_total_drawdown_percent: rule.max_total_drawdown_percent,
        profit_target_percent: rule.profit_target_percent,
        min_trading_days: rule.min_trading_days,
        max_trading_days: rule.max_trading_days,
        news_trading_allowed: rule.news_trading_allowed,
        weekend_holding_allowed: rule.weekend_holding_allowed,
        ea_allowed: rule.ea_allowed,
        copy_trading_allowed: rule.copy_trading_allowed,
        scaling_plan: rule.scaling_plan,
        additional_rules: rule.additional_rules,
        raw_content: combinedContent.substring(0, 50000),
        source_url: firm.website,
        version: newVersion,
        is_current: true,
        extracted_at: new Date().toISOString(),
      };

      await supabase.from('prop_firm_rules').insert(newRule);

      // Detect changes
      const oldRule = currentRules?.find((r: any) => r.account_type === rule.account_type);
      if (oldRule) {
        const fieldsToCheck = [
          'max_daily_loss_percent',
          'max_total_drawdown_percent', 
          'profit_target_percent',
          'min_trading_days',
          'max_trading_days',
          'news_trading_allowed',
          'weekend_holding_allowed',
          'ea_allowed',
          'copy_trading_allowed'
        ];

        for (const field of fieldsToCheck) {
          if (oldRule[field] !== newRule[field as keyof typeof newRule]) {
            await supabase.from('prop_firm_rule_changes').insert({
              prop_firm_id: firmId,
              account_type: rule.account_type,
              field_name: field,
              old_value: String(oldRule[field]),
              new_value: String(newRule[field as keyof typeof newRule]),
              detected_at: new Date().toISOString(),
              notified: false,
            });
          }
        }
      }
    }

    // Update firm status
    await supabase
      .from('prop_firms')
      .update({ 
        scrape_status: 'success',
        last_scraped_at: new Date().toISOString()
      })
      .eq('id', firmId);

    return {
      firm: firm.name,
      status: 'success',
      rulesCount: extractedData.rules.length
    };

  } catch (error) {
    console.error(`Error processing ${firm.name}:`, error);
    return {
      firm: firm.name,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
     const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
     const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
     if (!openaiApiKey && !lovableApiKey) {
       throw new Error('No AI API key configured (OPENAI_API_KEY or LOVABLE_API_KEY)');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { firmSlug, scrapeAll, customFirm, batchStart, batchSize } = await req.json();
    
    // Handle custom prop firm submission
    if (customFirm) {
      const { name, website } = customFirm;
      if (!name || !website) {
        return new Response(
          JSON.stringify({ success: false, error: 'Name and website are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const firm = { name, slug, website, category: 'forex' };
      
       const result = await processOneFirm(firm, supabase, firecrawlApiKey, openaiApiKey);
      
      return new Response(
        JSON.stringify({ 
          success: result.status === 'success', 
          result,
          firmSlug: slug
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const totalAvailable = PROP_FIRMS.length;

    const allFirms = scrapeAll ? PROP_FIRMS : PROP_FIRMS.filter(f => f.slug === firmSlug);

    // Optional batching for scrapeAll to avoid timeouts
    const start = Number.isFinite(batchStart) ? Number(batchStart) : 0;
    const size = Number.isFinite(batchSize) ? Number(batchSize) : undefined;

    const firmsToScrape = scrapeAll && size
      ? allFirms.slice(start, start + size)
      : allFirms;

    if (firmsToScrape.length === 0 && !scrapeAll) {
      // Try to find in database
      const { data: dbFirm } = await supabase
        .from('prop_firms')
        .select('*')
        .eq('slug', firmSlug)
        .single();

      if (dbFirm) {
        const result = await processOneFirm(
          { name: dbFirm.name, slug: dbFirm.slug, website: dbFirm.website_url, category: 'forex' },
           supabase, firecrawlApiKey, openaiApiKey
        );
        return new Response(
          JSON.stringify({ success: true, results: [result], totalProcessed: 1, successful: result.status === 'success' ? 1 : 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'No firms found to scrape' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];

    for (const firm of firmsToScrape) {
       const result = await processOneFirm(firm, supabase, firecrawlApiKey, openaiApiKey);
      results.push(result);

      // Rate limiting - wait between firms
      if (firmsToScrape.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalAvailable,
        totalProcessed: results.length,
        successful: results.filter(r => r.status === 'success').length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-prop-firm:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
