import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Counter } from '../typechain-types'
import { cofhejs, FheTypes } from 'cofhejs/node'
import { cofhejs_initializeWithHardhatSigner } from 'cofhe-hardhat-plugin'
import { getDeployment } from './utils'

// Task to increment the counter
task('increment-counter', 'Increment the counter on the deployed contract').setAction(async (_, hre: HardhatRuntimeEnvironment) => {
	const { ethers, network } = hre

	// Get the Counter contract address
	const counterAddress = getDeployment(network.name, 'Counter')
	if (!counterAddress) {
		console.error(`No Counter deployment found for network ${network.name}`)
		console.error(`Please deploy first using: npx hardhat deploy-counter --network ${network.name}`)
		return
	}

	console.log(`Using Counter at ${counterAddress} on ${network.name}`)

	// Get the signer
	const [signer] = await ethers.getSigners()
	console.log(`Using account: ${signer.address}`)
	await cofhejs.initializeWithEthers({
		ethersProvider: ethers.provider,
		ethersSigner: signer,
		environment: "TESTNET",
	  });

	// Get the contract instance with proper typing
	const Counter = await ethers.getContractFactory('Counter')
	const counter = Counter.attach(counterAddress) as unknown as Counter

	// Get current count
	const currentCount = await counter.count()
	console.log(`Current count: ${currentCount}`)

	// Increment the counter
	console.log('Incrementing counter...')
	const tx = await counter.increment()
	await tx.wait()
	console.log(`Transaction hash: ${tx.hash}`)

	// Get new count
	const newCount = await counter.count()
	console.log(`New count: ${newCount}`)
	console.log('Unsealing new count...')
	const unsealedCount = await cofhejs.unseal(newCount, FheTypes.Uint32)
	console.log(unsealedCount)
})
