# Omega Quake

A modernized WebGL port of Quake built with Three.js, featuring Web3 integration on **Omega Network** and **Somnia**.

## Features

- **Wallet Integration**: Connect via MetaMask to track your progress and identity.
- **Multi-Network Support**: Choose between Omega or Somnia when connecting your wallet.
- **On-chain Leaderboard**: High scores (monster kills and frags) are submitted to the selected network via a smart contract.
- **Full Game Support**: Enhanced asset loading for both shareware and registered versions (`pak0.pak` and `pak1.pak`).
- **Enhanced Main Menu**: Integrated leaderboard viewing directly from the in-game menu.
- **WebXR (VR) Support**: Experience Quake in virtual reality directly in your browser.

## Getting Started

### Prerequisites
- MetaMask installed in your browser.
- A local web server (e.g., `http-server`) to host the files.

### Network Configuration
When connecting, users choose either:

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| **Omega** | 1313161916 | https://0x4e4542bc.rpc.aurora-cloud.dev | https://0x4e4542bc.explorer.aurora-cloud.dev |
| **Somnia** | 5031 | https://api.infra.mainnet.somnia.network | https://explorer.somnia.network |

## Smart Contract
The leaderboard uses the `OmegaLeaderboard` contract (`contracts/OmegaLeaderboard.sol`):
- **Omega**: `0x3b8FaC84F93bc0949aAC12eceEB91247bFdd2959`
- **Somnia**: Deploy the contract to Somnia mainnet, then set the address in `src/wallet.js` → `NETWORK_CONFIGS.somnia.contractAddress`

## Assets
- **Shareware**: `pak0.pak` is included (Episode 1: Doomed Dimension).
- **Full Version**: Place your registered `pak1.pak` in the root directory to unlock all Episodes (2-4) and additional maps.

## Development

Run the game locally:
```bash
npx http-server . -p 8080 -c-1
```

## Credits
- Original game by **id Software**.
- Three.js port by **@mrdoob** and **@claude**.
- Omega Network integration and enhancements by **Antigravity**.

## License
Code is licensed under **GPL v2**.
