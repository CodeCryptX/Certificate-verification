import Web3 from 'web3';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import fs from 'fs';
import path from 'path';
import { Certificate } from '@shared/schema';
import { log } from './vite';

// Contract ABI - this would be generated when compiling the Solidity contract
// For now we'll create a simplified ABI with just the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "certificates",
    "outputs": [
      {
        "internalType": "string",
        "name": "studentId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_StudentId",
        "type": "string"
      }
    ],
    "name": "storeHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      }
    ],
    "name": "verifyHash",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// IPFS configuration
// To use Infura's IPFS service, you'd need authentication
// For demonstration, we'll set up a fallback approach if not configured
const getIpfsClient = () => {
  try {
    // Check if we have IPFS project ID and secret
    const projectId = process.env.IPFS_PROJECT_ID;
    const projectSecret = process.env.IPFS_PROJECT_SECRET;
    
    if (projectId && projectSecret) {
      const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
      return ipfsHttpClient({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: auth
        }
      });
    } else {
      // Fallback to public gateway for read-only operations
      log('IPFS project credentials not found. Operating in read-only mode.', 'blockchain');
      return null;
    }
  } catch (error) {
    log(`Error initializing IPFS client: ${error}`, 'blockchain');
    return null;
  }
};

// Web3 configuration
const getWeb3Instance = () => {
  try {
    const provider = process.env.ETHEREUM_PROVIDER || 'http://localhost:8545';
    return new Web3(provider);
  } catch (error) {
    log(`Error initializing Web3: ${error}`, 'blockchain');
    return null;
  }
};

// Contract configuration
const getContractInstance = (web3Instance: Web3) => {
  try {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      log('Contract address not found in environment variables', 'blockchain');
      return null;
    }
    
    return new web3Instance.eth.Contract(CONTRACT_ABI as any, contractAddress);
  } catch (error) {
    log(`Error initializing contract: ${error}`, 'blockchain');
    return null;
  }
};

export class BlockchainService {
  private ipfs: any;
  private web3: Web3 | null;
  private contract: any;
  private accountAddress: string | null = null;

  constructor() {
    this.ipfs = getIpfsClient();
    this.web3 = getWeb3Instance();
    
    if (this.web3) {
      this.contract = getContractInstance(this.web3);
      
      // Use the account from environment, or default to the first account
      const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
      if (privateKey && this.web3) {
        const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        this.web3.eth.accounts.wallet.add(account);
        this.accountAddress = account.address;
      } else if (this.web3) {
        // Fallback: try to get accounts from the connected provider
        this.web3.eth.getAccounts()
          .then(accounts => {
            if (accounts && accounts.length > 0) {
              this.accountAddress = accounts[0];
            } else {
              log('No Ethereum accounts available', 'blockchain');
            }
          })
          .catch(err => {
            log(`Error getting Ethereum accounts: ${err}`, 'blockchain');
          });
      }
    }
  }

  /**
   * Check if blockchain services are properly configured
   */
  isConfigured(): boolean {
    return !!(this.ipfs && this.web3 && this.contract && this.accountAddress);
  }

  /**
   * Store a certificate on IPFS and record its hash on the blockchain
   */
  async storeCertificate(certificate: Certificate): Promise<{ cid: string, txHash: string } | null> {
    if (!this.isConfigured()) {
      log('Blockchain services not properly configured', 'blockchain');
      return null;
    }

    try {
      // 1. Store certificate data on IPFS
      const certificateData = Buffer.from(JSON.stringify(certificate));
      const result = await this.ipfs.add(certificateData);
      const cid = result.path;

      // 2. Store the CID and hash on the blockchain
      const tx = await this.contract.methods.storeHash(
        cid, 
        certificate.certificateHash,
        certificate.studentId.toString()
      ).send({ 
        from: this.accountAddress,
        gas: 500000
      });

      log(`Certificate stored on IPFS with CID: ${cid}`, 'blockchain');
      log(`Transaction hash: ${tx.transactionHash}`, 'blockchain');

      return {
        cid,
        txHash: tx.transactionHash
      };
    } catch (error) {
      log(`Error storing certificate: ${error}`, 'blockchain');
      return null;
    }
  }

  /**
   * Verify a certificate using its CID by checking the hash on the blockchain
   */
  async verifyCertificate(cid: string, providedHash: string): Promise<boolean | null> {
    if (!this.web3 || !this.contract) {
      log('Blockchain verification services not properly configured', 'blockchain');
      return null;
    }

    try {
      // Get the hash from the blockchain
      const storedHash = await this.contract.methods.verifyHash(cid).call();
      
      // Compare the hashes
      return storedHash === providedHash;
    } catch (error) {
      log(`Error verifying certificate: ${error}`, 'blockchain');
      return null;
    }
  }

  /**
   * Retrieve a certificate from IPFS using its CID
   */
  async retrieveCertificate(cid: string): Promise<Certificate | null> {
    if (!this.ipfs) {
      log('IPFS client not properly configured', 'blockchain');
      return null;
    }

    try {
      // Get data from IPFS
      const stream = this.ipfs.cat(cid);
      let data = '';
      
      for await (const chunk of stream) {
        data += chunk.toString();
      }
      
      return JSON.parse(data);
    } catch (error) {
      log(`Error retrieving certificate from IPFS: ${error}`, 'blockchain');
      return null;
    }
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();