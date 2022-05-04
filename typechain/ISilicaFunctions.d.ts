/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface ISilicaFunctionsInterface extends ethers.utils.Interface {
  functions: {
    "amountDueAtContractEnd()": FunctionFragment;
    "amountLocked()": FunctionFragment;
    "amountOwedNextUpdate()": FunctionFragment;
    "defaultContract(uint32,uint256,uint256)": FunctionFragment;
    "fulfillUpdate(uint256,uint256)": FunctionFragment;
    "initialize(address,uint256,uint256,uint256,address,uint256)": FunctionFragment;
    "tryToCompleteContract(uint32,uint256)": FunctionFragment;
    "tryToExpireContract(uint32)": FunctionFragment;
    "tryToStartContract(uint32,uint256,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "amountDueAtContractEnd",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "amountLocked",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "amountOwedNextUpdate",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "defaultContract",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "fulfillUpdate",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      string,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "tryToCompleteContract",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "tryToExpireContract",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "tryToStartContract",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "amountDueAtContractEnd",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "amountLocked",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "amountOwedNextUpdate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "defaultContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "fulfillUpdate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "tryToCompleteContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tryToExpireContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tryToStartContract",
    data: BytesLike
  ): Result;

  events: {};
}

export class ISilicaFunctions extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: ISilicaFunctionsInterface;

  functions: {
    amountDueAtContractEnd(overrides?: CallOverrides): Promise<[BigNumber]>;

    amountLocked(overrides?: CallOverrides): Promise<[BigNumber]>;

    amountOwedNextUpdate(overrides?: CallOverrides): Promise<[BigNumber]>;

    defaultContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    fulfillUpdate(
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    initialize(
      _paymentToken: string,
      _hashrate: BigNumberish,
      _contractPeriod: BigNumberish,
      _reservedPrice: BigNumberish,
      _seller: string,
      _costToCreateContract: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    tryToCompleteContract(
      day: BigNumberish,
      remainingBalance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    tryToExpireContract(
      day: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    tryToStartContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  amountDueAtContractEnd(overrides?: CallOverrides): Promise<BigNumber>;

  amountLocked(overrides?: CallOverrides): Promise<BigNumber>;

  amountOwedNextUpdate(overrides?: CallOverrides): Promise<BigNumber>;

  defaultContract(
    day: BigNumberish,
    _networkHashrate: BigNumberish,
    _networkReward: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  fulfillUpdate(
    _networkHashrate: BigNumberish,
    _networkReward: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  initialize(
    _paymentToken: string,
    _hashrate: BigNumberish,
    _contractPeriod: BigNumberish,
    _reservedPrice: BigNumberish,
    _seller: string,
    _costToCreateContract: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  tryToCompleteContract(
    day: BigNumberish,
    remainingBalance: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  tryToExpireContract(
    day: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  tryToStartContract(
    day: BigNumberish,
    _networkHashrate: BigNumberish,
    _networkReward: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    amountDueAtContractEnd(overrides?: CallOverrides): Promise<BigNumber>;

    amountLocked(overrides?: CallOverrides): Promise<BigNumber>;

    amountOwedNextUpdate(overrides?: CallOverrides): Promise<BigNumber>;

    defaultContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    fulfillUpdate(
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialize(
      _paymentToken: string,
      _hashrate: BigNumberish,
      _contractPeriod: BigNumberish,
      _reservedPrice: BigNumberish,
      _seller: string,
      _costToCreateContract: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    tryToCompleteContract(
      day: BigNumberish,
      remainingBalance: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean, BigNumber]>;

    tryToExpireContract(
      day: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean, BigNumber]>;

    tryToStartContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean, BigNumber]>;
  };

  filters: {};

  estimateGas: {
    amountDueAtContractEnd(overrides?: CallOverrides): Promise<BigNumber>;

    amountLocked(overrides?: CallOverrides): Promise<BigNumber>;

    amountOwedNextUpdate(overrides?: CallOverrides): Promise<BigNumber>;

    defaultContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    fulfillUpdate(
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    initialize(
      _paymentToken: string,
      _hashrate: BigNumberish,
      _contractPeriod: BigNumberish,
      _reservedPrice: BigNumberish,
      _seller: string,
      _costToCreateContract: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    tryToCompleteContract(
      day: BigNumberish,
      remainingBalance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    tryToExpireContract(
      day: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    tryToStartContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    amountDueAtContractEnd(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    amountLocked(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    amountOwedNextUpdate(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    defaultContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    fulfillUpdate(
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    initialize(
      _paymentToken: string,
      _hashrate: BigNumberish,
      _contractPeriod: BigNumberish,
      _reservedPrice: BigNumberish,
      _seller: string,
      _costToCreateContract: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    tryToCompleteContract(
      day: BigNumberish,
      remainingBalance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    tryToExpireContract(
      day: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    tryToStartContract(
      day: BigNumberish,
      _networkHashrate: BigNumberish,
      _networkReward: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}