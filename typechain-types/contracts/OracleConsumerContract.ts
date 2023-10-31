/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export declare namespace MetaTxReceiver {
  export type ForwardRequestStruct = {
    from: PromiseOrValue<string>;
    nonce: PromiseOrValue<BigNumberish>;
    data: PromiseOrValue<BytesLike>;
  };

  export type ForwardRequestStructOutput = [string, BigNumber, string] & {
    from: string;
    nonce: BigNumber;
    data: string;
  };
}

export interface OracleConsumerContractInterface extends utils.Interface {
  functions: {
    "ATTESTOR_ROLE()": FunctionFragment;
    "DEFAULT_ADMIN_ROLE()": FunctionFragment;
    "eip712Domain()": FunctionFragment;
    "getCurrent()": FunctionFragment;
    "getHeadIndex()": FunctionFragment;
    "getHeadStorageKey()": FunctionFragment;
    "getRoleAdmin(bytes32)": FunctionFragment;
    "getStorage(bytes)": FunctionFragment;
    "getTailIndex()": FunctionFragment;
    "getTailStorageKey()": FunctionFragment;
    "grantRole(bytes32,address)": FunctionFragment;
    "hasRole(bytes32,address)": FunctionFragment;
    "malformedRequest(bytes)": FunctionFragment;
    "metaTxGetNonce(address)": FunctionFragment;
    "metaTxPrepare(address,bytes)": FunctionFragment;
    "metaTxPrepareWithNonce(address,bytes,uint256)": FunctionFragment;
    "metaTxRollupU256CondEq((address,uint256,bytes),bytes)": FunctionFragment;
    "metaTxVerify((address,uint256,bytes),bytes)": FunctionFragment;
    "owner()": FunctionFragment;
    "queueGetBytes(bytes)": FunctionFragment;
    "queueGetPrefix()": FunctionFragment;
    "queueGetUint(bytes)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "renounceRole(bytes32,address)": FunctionFragment;
    "request(string)": FunctionFragment;
    "revokeRole(bytes32,address)": FunctionFragment;
    "rollupU256CondEq(bytes[],bytes[],bytes[],bytes[],bytes[])": FunctionFragment;
    "setAttestor(address)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
    "toUint32Strict(bytes)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "ATTESTOR_ROLE"
      | "DEFAULT_ADMIN_ROLE"
      | "eip712Domain"
      | "getCurrent"
      | "getHeadIndex"
      | "getHeadStorageKey"
      | "getRoleAdmin"
      | "getStorage"
      | "getTailIndex"
      | "getTailStorageKey"
      | "grantRole"
      | "hasRole"
      | "malformedRequest"
      | "metaTxGetNonce"
      | "metaTxPrepare"
      | "metaTxPrepareWithNonce"
      | "metaTxRollupU256CondEq"
      | "metaTxVerify"
      | "owner"
      | "queueGetBytes"
      | "queueGetPrefix"
      | "queueGetUint"
      | "renounceOwnership"
      | "renounceRole"
      | "request"
      | "revokeRole"
      | "rollupU256CondEq"
      | "setAttestor"
      | "supportsInterface"
      | "toUint32Strict"
      | "transferOwnership"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "ATTESTOR_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "eip712Domain",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getCurrent",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getHeadIndex",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getHeadStorageKey",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "getStorage",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "getTailIndex",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getTailStorageKey",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "malformedRequest",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "metaTxGetNonce",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "metaTxPrepare",
    values: [PromiseOrValue<string>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "metaTxPrepareWithNonce",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "metaTxRollupU256CondEq",
    values: [MetaTxReceiver.ForwardRequestStruct, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "metaTxVerify",
    values: [MetaTxReceiver.ForwardRequestStruct, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "queueGetBytes",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "queueGetPrefix",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "queueGetUint",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "request",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "rollupU256CondEq",
    values: [
      PromiseOrValue<BytesLike>[],
      PromiseOrValue<BytesLike>[],
      PromiseOrValue<BytesLike>[],
      PromiseOrValue<BytesLike>[],
      PromiseOrValue<BytesLike>[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setAttestor",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "toUint32Strict",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "ATTESTOR_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "eip712Domain",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getCurrent", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getHeadIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getHeadStorageKey",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getStorage", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getTailIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTailStorageKey",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "malformedRequest",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "metaTxGetNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "metaTxPrepare",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "metaTxPrepareWithNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "metaTxRollupU256CondEq",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "metaTxVerify",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "queueGetBytes",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "queueGetPrefix",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "queueGetUint",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "request", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "rollupU256CondEq",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAttestor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "toUint32Strict",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "EIP712DomainChanged()": EventFragment;
    "ErrorReceived(uint256,string,uint256)": EventFragment;
    "MessageProcessedTo(uint256)": EventFragment;
    "MessageQueued(uint256,bytes)": EventFragment;
    "MetaTxDecoded()": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "ResponseReceived(uint256,string,uint256)": EventFragment;
    "RoleAdminChanged(bytes32,bytes32,bytes32)": EventFragment;
    "RoleGranted(bytes32,address,address)": EventFragment;
    "RoleRevoked(bytes32,address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "EIP712DomainChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ErrorReceived"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MessageProcessedTo"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MessageQueued"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MetaTxDecoded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ResponseReceived"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
}

export interface EIP712DomainChangedEventObject {}
export type EIP712DomainChangedEvent = TypedEvent<
  [],
  EIP712DomainChangedEventObject
>;

export type EIP712DomainChangedEventFilter =
  TypedEventFilter<EIP712DomainChangedEvent>;

export interface ErrorReceivedEventObject {
  reqId: BigNumber;
  reqData: string;
  errno: BigNumber;
}
export type ErrorReceivedEvent = TypedEvent<
  [BigNumber, string, BigNumber],
  ErrorReceivedEventObject
>;

export type ErrorReceivedEventFilter = TypedEventFilter<ErrorReceivedEvent>;

export interface MessageProcessedToEventObject {
  arg0: BigNumber;
}
export type MessageProcessedToEvent = TypedEvent<
  [BigNumber],
  MessageProcessedToEventObject
>;

export type MessageProcessedToEventFilter =
  TypedEventFilter<MessageProcessedToEvent>;

export interface MessageQueuedEventObject {
  idx: BigNumber;
  data: string;
}
export type MessageQueuedEvent = TypedEvent<
  [BigNumber, string],
  MessageQueuedEventObject
>;

export type MessageQueuedEventFilter = TypedEventFilter<MessageQueuedEvent>;

export interface MetaTxDecodedEventObject {}
export type MetaTxDecodedEvent = TypedEvent<[], MetaTxDecodedEventObject>;

export type MetaTxDecodedEventFilter = TypedEventFilter<MetaTxDecodedEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface ResponseReceivedEventObject {
  reqId: BigNumber;
  reqData: string;
  value: BigNumber;
}
export type ResponseReceivedEvent = TypedEvent<
  [BigNumber, string, BigNumber],
  ResponseReceivedEventObject
>;

export type ResponseReceivedEventFilter =
  TypedEventFilter<ResponseReceivedEvent>;

export interface RoleAdminChangedEventObject {
  role: string;
  previousAdminRole: string;
  newAdminRole: string;
}
export type RoleAdminChangedEvent = TypedEvent<
  [string, string, string],
  RoleAdminChangedEventObject
>;

export type RoleAdminChangedEventFilter =
  TypedEventFilter<RoleAdminChangedEvent>;

export interface RoleGrantedEventObject {
  role: string;
  account: string;
  sender: string;
}
export type RoleGrantedEvent = TypedEvent<
  [string, string, string],
  RoleGrantedEventObject
>;

export type RoleGrantedEventFilter = TypedEventFilter<RoleGrantedEvent>;

export interface RoleRevokedEventObject {
  role: string;
  account: string;
  sender: string;
}
export type RoleRevokedEvent = TypedEvent<
  [string, string, string],
  RoleRevokedEventObject
>;

export type RoleRevokedEventFilter = TypedEventFilter<RoleRevokedEvent>;

export interface OracleConsumerContract extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: OracleConsumerContractInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    ATTESTOR_ROLE(overrides?: CallOverrides): Promise<[string]>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<[string]>;

    eip712Domain(
      overrides?: CallOverrides
    ): Promise<
      [string, string, string, BigNumber, string, string, BigNumber[]] & {
        fields: string;
        name: string;
        version: string;
        chainId: BigNumber;
        verifyingContract: string;
        salt: string;
        extensions: BigNumber[];
      }
    >;

    getCurrent(overrides?: CallOverrides): Promise<[string]>;

    getHeadIndex(overrides?: CallOverrides): Promise<[number]>;

    getHeadStorageKey(overrides?: CallOverrides): Promise<[string]>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getStorage(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getTailIndex(overrides?: CallOverrides): Promise<[number]>;

    getTailStorageKey(overrides?: CallOverrides): Promise<[string]>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    malformedRequest(
      malformedData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    metaTxGetNonce(
      from: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    metaTxPrepare(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[MetaTxReceiver.ForwardRequestStructOutput, string]>;

    metaTxPrepareWithNonce(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[MetaTxReceiver.ForwardRequestStructOutput, string]>;

    metaTxRollupU256CondEq(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    metaTxVerify(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    queueGetBytes(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    queueGetPrefix(overrides?: CallOverrides): Promise<[string]>;

    queueGetUint(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[number]>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    request(
      reqData: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    rollupU256CondEq(
      condKeys: PromiseOrValue<BytesLike>[],
      condValues: PromiseOrValue<BytesLike>[],
      updateKeys: PromiseOrValue<BytesLike>[],
      updateValues: PromiseOrValue<BytesLike>[],
      actions: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setAttestor(
      phatAttestor: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    toUint32Strict(
      _bytes: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[number]>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  ATTESTOR_ROLE(overrides?: CallOverrides): Promise<string>;

  DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

  eip712Domain(
    overrides?: CallOverrides
  ): Promise<
    [string, string, string, BigNumber, string, string, BigNumber[]] & {
      fields: string;
      name: string;
      version: string;
      chainId: BigNumber;
      verifyingContract: string;
      salt: string;
      extensions: BigNumber[];
    }
  >;

  getCurrent(overrides?: CallOverrides): Promise<string>;

  getHeadIndex(overrides?: CallOverrides): Promise<number>;

  getHeadStorageKey(overrides?: CallOverrides): Promise<string>;

  getRoleAdmin(
    role: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  getStorage(
    key: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  getTailIndex(overrides?: CallOverrides): Promise<number>;

  getTailStorageKey(overrides?: CallOverrides): Promise<string>;

  grantRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  hasRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  malformedRequest(
    malformedData: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  metaTxGetNonce(
    from: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  metaTxPrepare(
    from: PromiseOrValue<string>,
    data: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<[MetaTxReceiver.ForwardRequestStructOutput, string]>;

  metaTxPrepareWithNonce(
    from: PromiseOrValue<string>,
    data: PromiseOrValue<BytesLike>,
    nonce: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[MetaTxReceiver.ForwardRequestStructOutput, string]>;

  metaTxRollupU256CondEq(
    req: MetaTxReceiver.ForwardRequestStruct,
    signature: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  metaTxVerify(
    req: MetaTxReceiver.ForwardRequestStruct,
    signature: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  owner(overrides?: CallOverrides): Promise<string>;

  queueGetBytes(
    key: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  queueGetPrefix(overrides?: CallOverrides): Promise<string>;

  queueGetUint(
    key: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<number>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  renounceRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  request(
    reqData: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revokeRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  rollupU256CondEq(
    condKeys: PromiseOrValue<BytesLike>[],
    condValues: PromiseOrValue<BytesLike>[],
    updateKeys: PromiseOrValue<BytesLike>[],
    updateValues: PromiseOrValue<BytesLike>[],
    actions: PromiseOrValue<BytesLike>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setAttestor(
    phatAttestor: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  toUint32Strict(
    _bytes: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<number>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    ATTESTOR_ROLE(overrides?: CallOverrides): Promise<string>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

    eip712Domain(
      overrides?: CallOverrides
    ): Promise<
      [string, string, string, BigNumber, string, string, BigNumber[]] & {
        fields: string;
        name: string;
        version: string;
        chainId: BigNumber;
        verifyingContract: string;
        salt: string;
        extensions: BigNumber[];
      }
    >;

    getCurrent(overrides?: CallOverrides): Promise<string>;

    getHeadIndex(overrides?: CallOverrides): Promise<number>;

    getHeadStorageKey(overrides?: CallOverrides): Promise<string>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    getStorage(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    getTailIndex(overrides?: CallOverrides): Promise<number>;

    getTailStorageKey(overrides?: CallOverrides): Promise<string>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    malformedRequest(
      malformedData: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    metaTxGetNonce(
      from: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    metaTxPrepare(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[MetaTxReceiver.ForwardRequestStructOutput, string]>;

    metaTxPrepareWithNonce(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[MetaTxReceiver.ForwardRequestStructOutput, string]>;

    metaTxRollupU256CondEq(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    metaTxVerify(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    owner(overrides?: CallOverrides): Promise<string>;

    queueGetBytes(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    queueGetPrefix(overrides?: CallOverrides): Promise<string>;

    queueGetUint(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<number>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    request(
      reqData: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    rollupU256CondEq(
      condKeys: PromiseOrValue<BytesLike>[],
      condValues: PromiseOrValue<BytesLike>[],
      updateKeys: PromiseOrValue<BytesLike>[],
      updateValues: PromiseOrValue<BytesLike>[],
      actions: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<boolean>;

    setAttestor(
      phatAttestor: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    toUint32Strict(
      _bytes: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<number>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "EIP712DomainChanged()"(): EIP712DomainChangedEventFilter;
    EIP712DomainChanged(): EIP712DomainChangedEventFilter;

    "ErrorReceived(uint256,string,uint256)"(
      reqId?: null,
      reqData?: null,
      errno?: null
    ): ErrorReceivedEventFilter;
    ErrorReceived(
      reqId?: null,
      reqData?: null,
      errno?: null
    ): ErrorReceivedEventFilter;

    "MessageProcessedTo(uint256)"(arg0?: null): MessageProcessedToEventFilter;
    MessageProcessedTo(arg0?: null): MessageProcessedToEventFilter;

    "MessageQueued(uint256,bytes)"(
      idx?: null,
      data?: null
    ): MessageQueuedEventFilter;
    MessageQueued(idx?: null, data?: null): MessageQueuedEventFilter;

    "MetaTxDecoded()"(): MetaTxDecodedEventFilter;
    MetaTxDecoded(): MetaTxDecodedEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;

    "ResponseReceived(uint256,string,uint256)"(
      reqId?: null,
      reqData?: null,
      value?: null
    ): ResponseReceivedEventFilter;
    ResponseReceived(
      reqId?: null,
      reqData?: null,
      value?: null
    ): ResponseReceivedEventFilter;

    "RoleAdminChanged(bytes32,bytes32,bytes32)"(
      role?: PromiseOrValue<BytesLike> | null,
      previousAdminRole?: PromiseOrValue<BytesLike> | null,
      newAdminRole?: PromiseOrValue<BytesLike> | null
    ): RoleAdminChangedEventFilter;
    RoleAdminChanged(
      role?: PromiseOrValue<BytesLike> | null,
      previousAdminRole?: PromiseOrValue<BytesLike> | null,
      newAdminRole?: PromiseOrValue<BytesLike> | null
    ): RoleAdminChangedEventFilter;

    "RoleGranted(bytes32,address,address)"(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleGrantedEventFilter;
    RoleGranted(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleGrantedEventFilter;

    "RoleRevoked(bytes32,address,address)"(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleRevokedEventFilter;
    RoleRevoked(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleRevokedEventFilter;
  };

  estimateGas: {
    ATTESTOR_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    eip712Domain(overrides?: CallOverrides): Promise<BigNumber>;

    getCurrent(overrides?: CallOverrides): Promise<BigNumber>;

    getHeadIndex(overrides?: CallOverrides): Promise<BigNumber>;

    getHeadStorageKey(overrides?: CallOverrides): Promise<BigNumber>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getStorage(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTailIndex(overrides?: CallOverrides): Promise<BigNumber>;

    getTailStorageKey(overrides?: CallOverrides): Promise<BigNumber>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    malformedRequest(
      malformedData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    metaTxGetNonce(
      from: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    metaTxPrepare(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    metaTxPrepareWithNonce(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    metaTxRollupU256CondEq(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    metaTxVerify(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    queueGetBytes(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    queueGetPrefix(overrides?: CallOverrides): Promise<BigNumber>;

    queueGetUint(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    request(
      reqData: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    rollupU256CondEq(
      condKeys: PromiseOrValue<BytesLike>[],
      condValues: PromiseOrValue<BytesLike>[],
      updateKeys: PromiseOrValue<BytesLike>[],
      updateValues: PromiseOrValue<BytesLike>[],
      actions: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setAttestor(
      phatAttestor: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    toUint32Strict(
      _bytes: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    ATTESTOR_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    DEFAULT_ADMIN_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    eip712Domain(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getCurrent(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getHeadIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getHeadStorageKey(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getStorage(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTailIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getTailStorageKey(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    malformedRequest(
      malformedData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    metaTxGetNonce(
      from: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    metaTxPrepare(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    metaTxPrepareWithNonce(
      from: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    metaTxRollupU256CondEq(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    metaTxVerify(
      req: MetaTxReceiver.ForwardRequestStruct,
      signature: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    queueGetBytes(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    queueGetPrefix(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    queueGetUint(
      key: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    request(
      reqData: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    rollupU256CondEq(
      condKeys: PromiseOrValue<BytesLike>[],
      condValues: PromiseOrValue<BytesLike>[],
      updateKeys: PromiseOrValue<BytesLike>[],
      updateValues: PromiseOrValue<BytesLike>[],
      actions: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setAttestor(
      phatAttestor: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    toUint32Strict(
      _bytes: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}