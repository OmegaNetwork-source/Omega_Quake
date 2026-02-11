export class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.isConnected = false;
    }

    async connect() {
        if (typeof window.ethereum === 'undefined') {
            console.error('MetaMask is not installed!');
            alert('Please install MetaMask to use this feature.');
            return false;
        }

        try {
            // First, check/switch to Omega Network
            await this.checkNetwork();

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Initialize provider (using the global ethers object from the script tag)
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.address = accounts[0];
            this.isConnected = true;

            console.log('Wallet connected:', this.address);
            this.updateUI();

            // Auto-fetch leaderboard on connect
            this.fetchLeaderboard();

            return true;
        } catch (error) {
            console.error('User denied account access or error occurred:', error);
            return false;
        }
    }

    async checkNetwork() {
        const chainId = '0x4e4542bc'; // 1313161916 in hex
        const networkParams = {
            chainId: chainId,
            chainName: 'Omega Network',
            nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH', // Often ETH on Aurora chains, change if different
                decimals: 18
            },
            rpcUrls: ['https://0x4e4542bc.rpc.aurora-cloud.dev'],
            blockExplorerUrls: ['https://0x4e4542bc.explorer.aurora-cloud.dev']
        };

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainId }],
            });
        } catch (switchError) {
            // This error code 4902 indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkParams],
                    });
                } catch (addError) {
                    console.error('Failed to add Omega Network:', addError);
                    alert('Could not add Omega Network to MetaMask. Please add it manually.');
                }
            } else {
                console.error('Failed to switch to Omega Network:', switchError);
                // Allow proceeding if already on correct network or user manually switches
            }
        }
    }

    updateUI() {
        const walletBtn = document.getElementById('wallet-connect-btn');
        if (walletBtn) {
            if (this.isConnected) {
                const shortAddress = `${this.address.substring(0, 6)}...${this.address.substring(38)}`;
                walletBtn.textContent = shortAddress;
                walletBtn.classList.add('connected');
            } else {
                walletBtn.textContent = 'Connect Wallet';
                walletBtn.classList.remove('connected');
            }
        }
    }

    async submitScore(score) {
        if (!this.isConnected) {
            console.error('Wallet not connected');
            return;
        }

        // Contract Address - REPLACE WITH YOUR DEPLOYED CONTRACT ADDRESS
        const contractAddress = "0x3b8FaC84F93bc0949aAC12eceEB91247bFdd2959";

        // Simple ABI for the submitScore function and events
        const abi = [
            "function submitScore(uint256 _score) external",
            "event NewHighScore(address indexed player, uint256 score)",
            "event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)"
        ];

        try {
            // Check if contract address is valid
            if (!ethers.isAddress(contractAddress) || contractAddress === "YOUR_CONTRACT_ADDRESS_HERE") {
                console.warn("Contract address not set or invalid. Saving locally/simulating.");
                alert(`Contract not configured correctly.\n\nSimulating score submission: ${score}`);
                return;
            }

            const contract = new ethers.Contract(contractAddress, abi, this.signer);

            console.log(`Submitting score: ${score} to contract at ${contractAddress}`);
            const tx = await contract.submitScore(score);
            console.log('Transaction sent:', tx.hash);

            alert(`Score ${score} submitted! Transaction Hash: ${tx.hash.substring(0, 20)}...`);

            // Wait for confirmation
            await tx.wait();
            console.log('Transaction confirmed');

            // Refresh leaderboard
            this.fetchLeaderboard();

            return tx;
        } catch (error) {
            console.error('Error submitting score to contract:', error);
            alert(`Failed to submit score: ${error.message}`);
        }
    }

    async fetchLeaderboard() {
        if (!this.isConnected || !this.provider) return;

        const contractAddress = "0x3b8FaC84F93bc0949aAC12eceEB91247bFdd2959";
        const abi = [
            "event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)"
        ];

        try {
            const contract = new ethers.Contract(contractAddress, abi, this.provider);

            // Query all ScoreSubmitted events
            // Note: In production, you might want to limit the block range
            const filter = contract.filters.ScoreSubmitted();
            const events = await contract.queryFilter(filter);

            // Process events to find high scores per player
            const highScores = {};

            events.forEach(event => {
                const player = event.args[0];
                const score = Number(event.args[1]); // Ensure number

                if (!highScores[player] || score > highScores[player]) {
                    highScores[player] = score;
                }
            });

            // Convert to array and sort
            const sortedScores = Object.entries(highScores)
                .map(([player, score]) => ({ player, score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10); // Top 10

            // Update UI
            const list = document.getElementById('scores-list');
            if (list) {
                list.innerHTML = ''; // Clear loading/dummy

                if (sortedScores.length === 0) {
                    list.innerHTML = '<div class="score-entry"><span>No scores yet</span></div>';
                }

                sortedScores.forEach((entry, index) => {
                    const shortAddr = `${entry.player.substring(0, 6)}...${entry.player.substring(38)}`;
                    const div = document.createElement('div');
                    div.className = 'score-entry';
                    // Highlight current player
                    if (entry.player.toLowerCase() === this.address.toLowerCase()) {
                        div.style.color = '#fff';
                        div.style.textShadow = '0 0 5px #d8a956';
                    }
                    div.innerHTML = `<span>${index + 1}. ${shortAddr}</span><span>${entry.score}</span>`;
                    list.appendChild(div);
                });
            }

            // Show modal if hidden
            const modal = document.getElementById('leaderboard-modal');
            if (modal) modal.style.display = 'block';

        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        }
    }
}

export const walletManager = new WalletManager();
