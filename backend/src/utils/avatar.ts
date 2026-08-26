export const PLAYER_AVATARS = [
  "/avatars/avatar-01.png",
  "/avatars/avatar-02.png",
  "/avatars/avatar-03.png",
  "/avatars/avatar-04.png",
  "/avatars/avatar-05.png",
  "/avatars/avatar-06.png",
  "/avatars/avatar-07.png",
  "/avatars/avatar-08.png",
  "/avatars/avatar-09.png",
  "/avatars/avatar-10.png",
];

export function generateRandomAvatar(): string {
  const index = Math.floor(
    Math.random() * PLAYER_AVATARS.length
  );

  return PLAYER_AVATARS[index];
}