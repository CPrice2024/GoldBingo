import { User } from "../users/user.model";

export const getUserProfile = async (
  userId: string
) => {
  const user = await User.findById(userId).select(
    "_id phone role status avatar isVerified referredBy createdAt updatedAt"
  );

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user._id,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    isVerified: user.isVerified,
    referredBy: user.referredBy,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};