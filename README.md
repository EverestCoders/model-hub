# Everest Model Hub

**Everest Model Hub** is a decentralized platform for sharing, discovering, and using AI models with verified provenance. The platform leverages **Filecoin** blockchain technology to provide secure storage and transparent AI model development.

---

## Overview

Everest Model Hub allows AI researchers and developers to:

- Upload AI models with proper versioning  
- Store models securely across a distributed network  
- Track changes and maintain version history  
- Verify model provenance and integrity  
- Share and monetize models with flexible licensing options  

The platform combines a user-friendly frontend interface with robust backend services and blockchain integration to create a comprehensive ecosystem for AI model management.

---

## Tech Stack

### Frontend

- `React 19`  
- `TypeScript`  
- `Vite`  
- `Tailwind CSS`  
- `shadcn/ui` components  
- `ethers.js` for blockchain interactions  

### Backend

- `Node.js` with `Express`  
- `TypeScript` 
- `Prisma` ORM with `SQLite` database  
- `JWT` authentication  
- `Multer` for file handling  

### Blockchain & Storage

- **Filecoin/FEVM** smart contracts  
- Lighthouse.storage for decentralized storage  
- **IPFS** for content addressing  

---

## Features

### Model Management

- Upload AI models with comprehensive metadata  
- Support for various model types (language, diffusion, audio, etc.)  
- Automatic versioning system  
- Model discovery with advanced filtering  

### Decentralized Storage

- Secure storage on Filecoin network  
- Content addressing via IPFS  
- Verification of storage deals  

### Blockchain Integration

- On-chain model registration  
- Provenance tracking  
- Licensing and access control  
- Payment processing for commercial models  

### User Authentication

- Wallet-based authentication (MetaMask, etc.)  
- Cryptographic signature verification  
- JWT-based sessions  

---

## Project Structure

### Backend (`/src`)

- `/controllers` - API request handlers  
- `/routes` - API endpoint definitions  
- `/services` - Business logic implementation  
- `/middleware` - Request processing middleware  
- `/interfaces` - TypeScript type definitions  
- `/config` - Application configuration  

### Frontend (`/frontend/src`)

- `/components` - UI components  
- `/services` - API client services  
- `/contexts` - React context providers  
- `/hooks` - Custom React hooks  

### Smart Contracts (`/contracts`)

- Model marketplace contract for registration and licensing  

---

## Getting Started

### Prerequisites

- Node.js (v18+)  
- `pnpm` package manager  
- MetaMask or compatible Ethereum wallet  

### Installation

**Clone the repository**

```bash
git clone https://github.com/EverestCoders/model-hub.git
cd model-hub
```

**Install dependencies**
```bash
pnpm install
```

**Create a .env file in the root directory with the following variables:**

```env
PORT=3002
JWT_SECRET=your_jwt_secret_key
LIGHTHOUSE_API_KEY=your_lighthouse_api_key
```
**Set up the database**

```bash
pnpm prisma:migrate
pnpm seed
```

**Start the development servers**

```bash
# Start backend server
pnpm dev

# In a separate terminal, start frontend
cd frontend
pnpm dev
```
**Open your browser to** http://localhost:5173 

## Usage

### Connecting Your Wallet

1. Click **"Connect Wallet"** on the homepage  
2. Approve the connection request in your wallet  
3. Sign the authentication message  

### Uploading a Model

1. Navigate to the **Upload** page  
2. Fill in model details (name, description, license, etc.)  
3. Select model files  
4. Submit and approve the blockchain transaction  

### Browsing Models

1. Go to the **Explore** page  
2. Use filters to find models by category, license, etc.  
3. Click on a model to view details and download files  

### Creating a New Version

1. Navigate to a model you own  
2. Click **"Add Version"**  
3. Upload new model files and provide a commit message  
4. Submit and approve the transaction  

## Development

### Running Tests

```bash
pnpm test
```
### Seeding the Database

```bash
pnpm seed
```
##  Smart Contract Integration

The platform interacts with the **ModelMarketplace** smart contract deployed on the **Filecoin Calibration Testnet**. Key contract functions include:

- `registerModel` – Register a new model on the blockchain  
- `updateModelDetails` – Update licensing and access information  
- `purchaseAccess` – Pay for access to commercial models  
- `getUserModels` – Retrieve models owned by a user  
- `getModelDetails` – Get detailed model information  
- `withdrawBalance` – Withdraw earnings from model sales  

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
- Fork the repository
- Create your feature branch

```bash
git checkout -b feature/amazing-feature
```
- Commit your changes

```bash
git commit -m 'Add some amazing feature'
```
- Push to the branch

```bash
git push origin feature/amazing-feature
```
- Open a Pull Request

## License

This project is licensed under the **MIT License**