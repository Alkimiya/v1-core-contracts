/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  ISilicaAvaxFunctions,
  ISilicaAvaxFunctionsInterface,
} from "../ISilicaAvaxFunctions";

const _abi = [
  {
    inputs: [],
    name: "amountDueAtContractEnd",
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
    name: "amountLocked",
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
    name: "amountOwedNextUpdate",
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
        internalType: "uint32",
        name: "day",
        type: "uint32",
      },
      {
        internalType: "uint256",
        name: "_currentSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_supplyCap",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxStakingDuration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxConsumptionRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_minConsumptionRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_mintingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_scale",
        type: "uint256",
      },
    ],
    name: "defaultContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_nextUpdateDay",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_currentSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_supplyCap",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxStakingDuration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxConsumptionRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_minConsumptionRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_mintingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_scale",
        type: "uint256",
      },
    ],
    name: "fulfillUpdate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_paymentToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_seller",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_stakedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_contractPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_amountLockedOnCreate",
        type: "uint256",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "day",
        type: "uint32",
      },
      {
        internalType: "uint256",
        name: "remainingBalance",
        type: "uint256",
      },
    ],
    name: "tryToCompleteContract",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "day",
        type: "uint32",
      },
    ],
    name: "tryToExpireContract",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "day",
        type: "uint32",
      },
      {
        internalType: "uint256",
        name: "_currentSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_supplyCap",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxStakingDuration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxConsumptionRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_minConsumptionRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_mintingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_scale",
        type: "uint256",
      },
    ],
    name: "tryToStartContract",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class ISilicaAvaxFunctions__factory {
  static readonly abi = _abi;
  static createInterface(): ISilicaAvaxFunctionsInterface {
    return new utils.Interface(_abi) as ISilicaAvaxFunctionsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ISilicaAvaxFunctions {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as ISilicaAvaxFunctions;
  }
}
