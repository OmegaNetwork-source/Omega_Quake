# Omega Quake

A modernized WebGL port of Quake built with Three.js, featuring Web3 integration on the Omega Network.

## Features

- **Wallet Integration**: Connect via MetaMask to track your progress and identity.
- **On-chain Leaderboard**: High scores (monster kills and frags) are automatically submitted to the Omega Network via a smart contract.
- **Full Game Support**: Enhanced asset loading for both shareware and registered versions (`pak0.pak` and `pak1.pak`).
- **Enhanced Main Menu**: Integrated leaderboard viewing directly from the in-game menu.
- **WebXR (VR) Support**: Experience Quake in virtual reality directly in your browser.

## Getting Started

### Prerequisites
- MetaMask installed in your browser.
- A local web server (e.g., `http-server`) to host the files.

### Network Configuration
Omega Quake runs on the **Omega Network**:
- **Chain ID**: 1313161916
- **RPC**: https://0x4e4542bc.rpc.aurora-cloud.dev
- **Explorer**: https://0x4e4542bc.explorer.aurora-cloud.dev

## Smart Contract
The leaderboard is managed by the `OmegaLeaderboard` smart contract:
- **Address**: `0x3b8FaC84F93bc0949aAC12eceEB91247bFdd2959`
- **Source**: Available in the `contracts/` directory.

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
