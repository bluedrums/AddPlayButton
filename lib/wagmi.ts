import { http, createConfig } from 'wagmi'
import { base, mainnet, optimism } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, base, optimism],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http('https://mainnet.base.org'),
    [optimism.id]: http('https://mainnet.optimism.io'),
  },
}) 