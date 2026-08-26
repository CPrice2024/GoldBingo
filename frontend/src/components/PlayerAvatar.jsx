export default function PlayerAvatar({
  avatarId = 1,
  size = 80,
}) {
  const avatarNumber = String(avatarId).padStart(
    2,
    "0"
  );

  const avatarUrl = `/avatars/avatar-${avatarNumber}.png`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        border: "2px solid #D4A72C",
        background: "#151720",
      }}
    >
      <img
        src={avatarUrl}
        alt="Player avatar"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}