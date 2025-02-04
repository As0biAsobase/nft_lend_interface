import '~/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import type { AppProps } from 'next/app'
import * as React from 'react'
import { Inter } from '@next/font/google'
import { Hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DehydratedState } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { avalanche, avalancheFuji } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { configureChains, createClient, WagmiConfig } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { connectorsForWallets, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { injectedWallet, rainbowWallet, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { SafeConnector } from '@gnosis.pm/safe-apps-wagmi'
import { useDialogState } from 'ariakit'
import { Toaster } from 'react-hot-toast'
import TxSubmittedDialog from '~/components/TxSubmittedDialog'
import { CHAINS_CONFIGURATION } from '~/lib/constants'
import { TransactionsContext } from '~/contexts'

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] })

const { chains, provider } = configureChains(
	[avalanche, avalancheFuji],
	[publicProvider()]
)

const connectors = connectorsForWallets([
	{
		groupName: 'Popular',
		wallets: [
			injectedWallet({ chains }),
			metaMaskWallet({ chains }),
			rainbowWallet({ chains }),
			walletConnectWallet({ chains })
		]
	}
])

const wagmiClient = createClient({
	autoConnect: process.env.NEXT_PUBLIC_SAFE === 'true' ? false : true,
	connectors,
	provider
})

function MyApp({ Component, pageProps }: AppProps<{ dehydratedState: DehydratedState }>) {
	const [queryClient] = React.useState(() => new QueryClient())
	const [isMounted, setIsMounted] = React.useState(false)

	React.useEffect(() => setIsMounted(true), [])

	const dialog = useDialogState()
	const txHash = React.useRef<string | null>(null)

	return (
		<QueryClientProvider client={queryClient}>
			<Hydrate state={pageProps.dehydratedState}>
				<WagmiConfig client={wagmiClient}>
					<RainbowKitProvider
						theme={lightTheme({
							accentColor: '#3046fb',
							accentColorForeground: 'white',
							fontStack: 'system'
						})}
						chains={chains}
						initialChain={avalanche}
						showRecentTransactions={true}
						modalSize="compact"
					>
						<TransactionsContext.Provider value={{ dialog: dialog, hash: txHash }}>
							<style jsx global>{`
								:root {
									--font-inter: ${inter.style.fontFamily};
								}
							`}</style>
							{isMounted && <Component {...pageProps} />}
						</TransactionsContext.Provider>

						<TxSubmittedDialog dialog={dialog} transactionHash={txHash} />
						<Toaster position="top-right" reverseOrder={true} />
					</RainbowKitProvider>
				</WagmiConfig>
			</Hydrate>

			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	)
}

export default MyApp
