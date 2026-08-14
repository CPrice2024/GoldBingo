import { User, IUserDocument } from "../users/user.model";

export const findUserByPhone = async (
  phone: string
): Promise<IUserDocument | null> => {
  return User.findOne({ phone }).select("+password");
};

export const findAgentByReferralCode = async (
  referralCode: string
): Promise<IUserDocument | null> => {
  return User.findOne({
    referralCode: referralCode.toUpperCase(),
    role: "agent",
    status: "active",
  });
};

export const createAuthUser = async (
  data: Partial<IUserDocument>
): Promise<IUserDocument> => {
  return User.create(data);
};
export const findUserByPhoneWithPassword = async (
  phone: string
) => {
  return User.findOne({ phone }).select("+password");
};