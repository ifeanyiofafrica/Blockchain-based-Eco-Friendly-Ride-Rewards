import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, uintCV, principalCV, noneCV, someCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_DISTANCE = 101;
const ERR_INVALID_VEHICLE_TYPE = 102;
const ERR_INVALID_RIDE_ID = 103;
const ERR_RIDE_NOT_VERIFIED = 104;
const ERR_INVALID_REWARD_RATE = 105;
const ERR_AUTHORITY_NOT_SET = 109;
const ERR_INVALID_MULTIPLIER = 110;
const ERR_INVALID_EMISSION_FACTOR = 107;

interface RideReward {
  user: string;
  distance: number;
  vehicleType: string;
  rewardAmount: number;
  timestamp: number;
  emissionSaved: number;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class RewardCalculationMock {
  state: {
    admin: string;
    tokenContract: string;
    verificationContract: string;
    baseRewardRate: number;
    bikeBonus: number;
    maxDistance: number;
    minDistance: number;
    rewardMultipliers: Map<string, { multiplier: number }>;
    rideRewards: Map<number, RideReward>;
    emissionFactors: Map<string, { co2PerKm: number }>;
  } = {
    admin: "ST1TEST",
    tokenContract: "SP000000000000000000002Q6VF78",
    verificationContract: "SP000000000000000000002Q6VF78",
    baseRewardRate: 10,
    bikeBonus: 5,
    maxDistance: 1000,
    minDistance: 1,
    rewardMultipliers: new Map(),
    rideRewards: new Map(),
    emissionFactors: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  mintedTokens: Array<{ amount: number; to: string }> = [];

  reset() {
    this.state = {
      admin: "ST1TEST",
      tokenContract: "SP000000000000000000002Q6VF78",
      verificationContract: "SP000000000000000000002Q6VF78",
      baseRewardRate: 10,
      bikeBonus: 5,
      maxDistance: 1000,
      minDistance: 1,
      rewardMultipliers: new Map(),
      rideRewards: new Map(),
      emissionFactors: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.mintedTokens = [];
  }

  setTokenContract(contract: string): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (contract === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.tokenContract = contract;
    return { ok: true, value: true };
  }

  setVerificationContract(contract: string): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (contract === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.verificationContract = contract;
    return { ok: true, value: true };
  }

  setBaseRewardRate(rate: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (rate <= 0) return { ok: false, value: ERR_INVALID_REWARD_RATE };
    this.state.baseRewardRate = rate;
    return { ok: true, value: true };
  }

  setBikeBonus(bonus: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (bonus <= 0) return { ok: false, value: ERR_INVALID_REWARD_RATE };
    this.state.bikeBonus = bonus;
    return { ok: true, value: true };
  }

  setMultiplier(vehicleType: string, multiplier: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!["electric", "bike", "public"].includes(vehicleType)) return { ok: false, value: ERR_INVALID_VEHICLE_TYPE };
    if (multiplier <= 0 || multiplier > 1000) return { ok: false, value: ERR_INVALID_MULTIPLIER };
    this.state.rewardMultipliers.set(vehicleType, { multiplier });
    return { ok: true, value: true };
  }

  setEmissionFactor(vehicleType: string, factor: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!["electric", "bike", "public"].includes(vehicleType)) return { ok: false, value: ERR_INVALID_VEHICLE_TYPE };
    if (factor <= 0) return { ok: false, value: ERR_INVALID_EMISSION_FACTOR };
    this.state.emissionFactors.set(vehicleType, { co2PerKm: factor });
    return { ok: true, value: true };
  }

  calculateReward(rideId: number, user: string, distance: number, vehicleType: string, timestamp: number): Result<number> {
    if (this.state.verificationContract === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_AUTHORITY_NOT_SET };
    if (distance < this.state.minDistance || distance > this.state.maxDistance) return { ok: false, value: ERR_INVALID_DISTANCE };
    if (!["electric", "bike", "public"].includes(vehicleType)) return { ok: false, value: ERR_INVALID_VEHICLE_TYPE };
    if (timestamp < this.blockHeight) return { ok: false, value: ERR_INVALID_TIMESTAMP };
    if (!this.state.rideRewards.has(rideId)) return { ok: false, value: ERR_RIDE_NOT_VERIFIED };
    const multiplier = this.state.rewardMultipliers.get(vehicleType)?.multiplier ?? 100;
    const bonus = vehicleType === "bike" ? this.state.bikeBonus : 0;
    const rewardAmount = distance * this.state.baseRewardRate * multiplier + bonus;
    const emissionFactor = this.state.emissionFactors.get(vehicleType)?.co2PerKm ?? 0;
    const emissionSaved = distance * emissionFactor;
    this.state.rideRewards.set(rideId, { user, distance, vehicleType, rewardAmount, timestamp, emissionSaved });
    this.mintedTokens.push({ amount: rewardAmount, to: user });
    return { ok: true, value: rewardAmount };
  }

  getTotalEmissionsSaved(rideId: number): Result<number> {
    const reward = this.state.rideRewards.get(rideId);
    if (!reward) return { ok: false, value: ERR_INVALID_RIDE_ID };
    return { ok: true, value: reward.emissionSaved };
  }
}

describe("RewardCalculation", () => {
  let contract: RewardCalculationMock;

  beforeEach(() => {
    contract = new RewardCalculationMock();
    contract.reset();
  });

  it("sets token contract successfully", () => {
    const result = contract.setTokenContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.tokenContract).toBe("ST2TEST");
  });

  it("rejects token contract change by non-admin", () => {
    contract.caller = "ST3FAKE";
    const result = contract.setTokenContract("ST2TEST");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("sets verification contract successfully", () => {
    const result = contract.setVerificationContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.verificationContract).toBe("ST2TEST");
  });

  it("sets base reward rate successfully", () => {
    const result = contract.setBaseRewardRate(20);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.baseRewardRate).toBe(20);
  });

  it("rejects invalid reward rate", () => {
    const result = contract.setBaseRewardRate(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_REWARD_RATE);
  });

  it("sets bike bonus successfully", () => {
    const result = contract.setBikeBonus(10);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.bikeBonus).toBe(10);
  });

  it("sets multiplier successfully", () => {
    const result = contract.setMultiplier("electric", 150);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.rewardMultipliers.get("electric")?.multiplier).toBe(150);
  });

  it("rejects invalid multiplier", () => {
    const result = contract.setMultiplier("electric", 1001);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MULTIPLIER);
  });

  it("sets emission factor successfully", () => {
    const result = contract.setEmissionFactor("electric", 100);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.emissionFactors.get("electric")?.co2PerKm).toBe(100);
  });

  it("rejects unverified ride", () => {
    contract.setVerificationContract("ST2TEST");
    const result = contract.calculateReward(1, "ST1TEST", 10, "electric", 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_RIDE_NOT_VERIFIED);
  });

  it("rejects invalid vehicle type", () => {
    contract.setVerificationContract("ST2TEST");
    contract.state.rideRewards.set(1, { user: "ST1TEST", distance: 10, vehicleType: "invalid", rewardAmount: 0, timestamp: 0, emissionSaved: 0 });
    const result = contract.calculateReward(1, "ST1TEST", 10, "invalid", 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_VEHICLE_TYPE);
  });

  it("rejects invalid distance", () => {
    contract.setVerificationContract("ST2TEST");
    contract.state.rideRewards.set(1, { user: "ST1TEST", distance: 1001, vehicleType: "electric", rewardAmount: 0, timestamp: 0, emissionSaved: 0 });
    const result = contract.calculateReward(1, "ST1TEST", 1001, "electric", 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_DISTANCE);
  });

  it("gets total emissions saved", () => {
    contract.setVerificationContract("ST2TEST");
    contract.setEmissionFactor("electric", 100);
    contract.state.rideRewards.set(1, { user: "ST1TEST", distance: 10, vehicleType: "electric", rewardAmount: 1500, timestamp: 100, emissionSaved: 1000 });
    const result = contract.getTotalEmissionsSaved(1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(1000);
  });
});