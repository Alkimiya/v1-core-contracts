/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Signer,
  utils,
  BigNumberish,
  Contract,
  ContractFactory,
  Overrides,
} from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { TesterToken, TesterTokenInterface } from "../TesterToken";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_decimals",
        type: "uint8",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "customDecimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b506040516200182138038062001821833981810160405281019062000037919062000375565b6040518060400160405280600b81526020017f546573746572546f6b656e0000000000000000000000000000000000000000008152506040518060400160405280600b81526020017f546573746572546f6b656e0000000000000000000000000000000000000000008152508160039080519060200190620000bb929190620002ae565b508060049080519060200190620000d4929190620002ae565b50505062000109337fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6200012b60201b60201c565b80600560006101000a81548160ff021916908360ff1602179055505062000574565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156200019e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016200019590620003d9565b60405180910390fd5b620001b260008383620002a460201b60201c565b8060026000828254620001c6919062000429565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546200021d919062000429565b925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051620002849190620003fb565b60405180910390a3620002a060008383620002a960201b60201c565b5050565b505050565b505050565b828054620002bc906200049d565b90600052602060002090601f016020900481019282620002e057600085556200032c565b82601f10620002fb57805160ff19168380011785556200032c565b828001600101855582156200032c579182015b828111156200032b5782518255916020019190600101906200030e565b5b5090506200033b91906200033f565b5090565b5b808211156200035a57600081600090555060010162000340565b5090565b6000815190506200036f816200055a565b92915050565b6000602082840312156200038857600080fd5b600062000398848285016200035e565b91505092915050565b6000620003b0601f8362000418565b9150620003bd8262000531565b602082019050919050565b620003d38162000486565b82525050565b60006020820190508181036000830152620003f481620003a1565b9050919050565b6000602082019050620004126000830184620003c8565b92915050565b600082825260208201905092915050565b6000620004368262000486565b9150620004438362000486565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156200047b576200047a620004d3565b5b828201905092915050565b6000819050919050565b600060ff82169050919050565b60006002820490506001821680620004b657607f821691505b60208210811415620004cd57620004cc62000502565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b620005658162000490565b81146200057157600080fd5b50565b61129d80620005846000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c806370a082311161007157806370a08231146101a357806395d89b41146101d3578063a457c2d7146101f1578063a9059cbb14610221578063ace28fa514610251578063dd62ed3e1461026f576100b4565b806306fdde03146100b9578063095ea7b3146100d757806318160ddd1461010757806323b872dd14610125578063313ce567146101555780633950935114610173575b600080fd5b6100c161029f565b6040516100ce9190610d63565b60405180910390f35b6100f160048036038101906100ec9190610bb1565b610331565b6040516100fe9190610d48565b60405180910390f35b61010f610354565b60405161011c9190610e65565b60405180910390f35b61013f600480360381019061013a9190610b62565b61035e565b60405161014c9190610d48565b60405180910390f35b61015d61038d565b60405161016a9190610e80565b60405180910390f35b61018d60048036038101906101889190610bb1565b6103a4565b60405161019a9190610d48565b60405180910390f35b6101bd60048036038101906101b89190610afd565b6103db565b6040516101ca9190610e65565b60405180910390f35b6101db610423565b6040516101e89190610d63565b60405180910390f35b61020b60048036038101906102069190610bb1565b6104b5565b6040516102189190610d48565b60405180910390f35b61023b60048036038101906102369190610bb1565b61052c565b6040516102489190610d48565b60405180910390f35b61025961054f565b6040516102669190610e80565b60405180910390f35b61028960048036038101906102849190610b26565b610562565b6040516102969190610e65565b60405180910390f35b6060600380546102ae90610f95565b80601f01602080910402602001604051908101604052809291908181526020018280546102da90610f95565b80156103275780601f106102fc57610100808354040283529160200191610327565b820191906000526020600020905b81548152906001019060200180831161030a57829003601f168201915b5050505050905090565b60008061033c6105e9565b90506103498185856105f1565b600191505092915050565b6000600254905090565b6000806103696105e9565b90506103768582856107bc565b610381858585610848565b60019150509392505050565b6000600560009054906101000a900460ff16905090565b6000806103af6105e9565b90506103d08185856103c18589610562565b6103cb9190610eb7565b6105f1565b600191505092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606004805461043290610f95565b80601f016020809104026020016040519081016040528092919081815260200182805461045e90610f95565b80156104ab5780601f10610480576101008083540402835291602001916104ab565b820191906000526020600020905b81548152906001019060200180831161048e57829003601f168201915b5050505050905090565b6000806104c06105e9565b905060006104ce8286610562565b905083811015610513576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161050a90610e45565b60405180910390fd5b61052082868684036105f1565b60019250505092915050565b6000806105376105e9565b9050610544818585610848565b600191505092915050565b600560009054906101000a900460ff1681565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610661576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161065890610e25565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156106d1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106c890610da5565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040516107af9190610e65565b60405180910390a3505050565b60006107c88484610562565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146108425781811015610834576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161082b90610dc5565b60405180910390fd5b61084184848484036105f1565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156108b8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108af90610e05565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610928576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161091f90610d85565b60405180910390fd5b610933838383610ac9565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050818110156109b9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109b090610de5565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610a4c9190610eb7565b925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610ab09190610e65565b60405180910390a3610ac3848484610ace565b50505050565b505050565b505050565b600081359050610ae281611239565b92915050565b600081359050610af781611250565b92915050565b600060208284031215610b0f57600080fd5b6000610b1d84828501610ad3565b91505092915050565b60008060408385031215610b3957600080fd5b6000610b4785828601610ad3565b9250506020610b5885828601610ad3565b9150509250929050565b600080600060608486031215610b7757600080fd5b6000610b8586828701610ad3565b9350506020610b9686828701610ad3565b9250506040610ba786828701610ae8565b9150509250925092565b60008060408385031215610bc457600080fd5b6000610bd285828601610ad3565b9250506020610be385828601610ae8565b9150509250929050565b610bf681610f1f565b82525050565b6000610c0782610e9b565b610c118185610ea6565b9350610c21818560208601610f62565b610c2a81611025565b840191505092915050565b6000610c42602383610ea6565b9150610c4d82611036565b604082019050919050565b6000610c65602283610ea6565b9150610c7082611085565b604082019050919050565b6000610c88601d83610ea6565b9150610c93826110d4565b602082019050919050565b6000610cab602683610ea6565b9150610cb6826110fd565b604082019050919050565b6000610cce602583610ea6565b9150610cd98261114c565b604082019050919050565b6000610cf1602483610ea6565b9150610cfc8261119b565b604082019050919050565b6000610d14602583610ea6565b9150610d1f826111ea565b604082019050919050565b610d3381610f4b565b82525050565b610d4281610f55565b82525050565b6000602082019050610d5d6000830184610bed565b92915050565b60006020820190508181036000830152610d7d8184610bfc565b905092915050565b60006020820190508181036000830152610d9e81610c35565b9050919050565b60006020820190508181036000830152610dbe81610c58565b9050919050565b60006020820190508181036000830152610dde81610c7b565b9050919050565b60006020820190508181036000830152610dfe81610c9e565b9050919050565b60006020820190508181036000830152610e1e81610cc1565b9050919050565b60006020820190508181036000830152610e3e81610ce4565b9050919050565b60006020820190508181036000830152610e5e81610d07565b9050919050565b6000602082019050610e7a6000830184610d2a565b92915050565b6000602082019050610e956000830184610d39565b92915050565b600081519050919050565b600082825260208201905092915050565b6000610ec282610f4b565b9150610ecd83610f4b565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115610f0257610f01610fc7565b5b828201905092915050565b6000610f1882610f2b565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b600060ff82169050919050565b60005b83811015610f80578082015181840152602081019050610f65565b83811115610f8f576000848401525b50505050565b60006002820490506001821680610fad57607f821691505b60208210811415610fc157610fc0610ff6565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000601f19601f8301169050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000600082015250565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b7f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760008201527f207a65726f000000000000000000000000000000000000000000000000000000602082015250565b61124281610f0d565b811461124d57600080fd5b50565b61125981610f4b565b811461126457600080fd5b5056fea26469706673582212203a7c3e35e021c1da11506082ff8ca4c607c98910e6f2824dfd5c04d9dcd2672264736f6c63430008040033";

export class TesterToken__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    _decimals: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<TesterToken> {
    return super.deploy(_decimals, overrides || {}) as Promise<TesterToken>;
  }
  getDeployTransaction(
    _decimals: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_decimals, overrides || {});
  }
  attach(address: string): TesterToken {
    return super.attach(address) as TesterToken;
  }
  connect(signer: Signer): TesterToken__factory {
    return super.connect(signer) as TesterToken__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TesterTokenInterface {
    return new utils.Interface(_abi) as TesterTokenInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TesterToken {
    return new Contract(address, _abi, signerOrProvider) as TesterToken;
  }
}