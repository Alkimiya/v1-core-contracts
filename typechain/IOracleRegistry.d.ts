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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface IOracleRegistryInterface extends ethers.utils.Interface {
  functions: {
    "getOracleAddress(address,uint16)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getOracleAddress",
    values: [string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "getOracleAddress",
    data: BytesLike
  ): Result;

  events: {
    "OracleRegistered(address,uint16,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OracleRegistered"): EventFragment;
}

export type OracleRegisteredEvent = TypedEvent<
  [string, number, string] & {
    token: string;
    oracleType: number;
    oracleAddr: string;
  }
>;

export class IOracleRegistry extends BaseContract {
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

  interface: IOracleRegistryInterface;

  functions: {
    getOracleAddress(
      _token: string,
      _oracleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;
  };

  getOracleAddress(
    _token: string,
    _oracleType: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    getOracleAddress(
      _token: string,
      _oracleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {
    "OracleRegistered(address,uint16,address)"(
      token?: null,
      oracleType?: null,
      oracleAddr?: null
    ): TypedEventFilter<
      [string, number, string],
      { token: string; oracleType: number; oracleAddr: string }
    >;

    OracleRegistered(
      token?: null,
      oracleType?: null,
      oracleAddr?: null
    ): TypedEventFilter<
      [string, number, string],
      { token: string; oracleType: number; oracleAddr: string }
    >;
  };

  estimateGas: {
    getOracleAddress(
      _token: string,
      _oracleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getOracleAddress(
      _token: string,
      _oracleType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
