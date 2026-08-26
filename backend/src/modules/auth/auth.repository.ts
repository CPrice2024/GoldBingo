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

export const findUsedPlayerAvatars = async (): Promise<
  string[]
> => {
  const users = await User.find(
    {
      role: "player",
      avatar: {
        $ne: null,
      },
    },
    {
      avatar: 1,
      _id: 0,
    }
  ).lean();

  return users
    .map((user) => user.avatar)
    .filter(
      (avatar): avatar is string =>
        typeof avatar === "string" &&
        avatar.length > 0
    );
};
export const findFirstActiveAgent =
  async () => {
    return User.findOne({
      role: "agent",
      status: "active",
    })
      .sort({
        createdAt: 1,
        _id: 1,
      })
      .select("_id fullName phone");
  };