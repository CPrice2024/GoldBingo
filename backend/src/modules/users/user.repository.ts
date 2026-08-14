import { User, IUserDocument } from "./user.model";

export const findUserById = async (
  userId: string
): Promise<IUserDocument | null> => {
  return User.findById(userId);
};

export const findUserByPhone = async (
  phone: string
): Promise<IUserDocument | null> => {
  return User.findOne({ phone });
};

export const findUserByPhoneWithPassword = async (
  phone: string
): Promise<IUserDocument | null> => {
  return User.findOne({ phone }).select("+password");
};

export const findUserByReferralCode = async (
  referralCode: string
): Promise<IUserDocument | null> => {
  return User.findOne({
    referralCode: referralCode.toUpperCase(),
    role: "agent",
    status: "active",
  });
};

export const createUser = async (
  data: Partial<IUserDocument>
): Promise<IUserDocument> => {
  return User.create(data);
};

export const findPlayersByAgent = async (
  agentId: string
): Promise<IUserDocument[]> => {
  return User.find({
    role: "player",
    referredBy: agentId,
  });
};