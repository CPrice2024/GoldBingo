import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import {
  User,
  Phone,
  ShieldCheck,
  Calendar,
  UserCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  MousePointerClick,
} from "lucide-react";
import PlayerAvatar from "../../components/PlayerAvatar";

import { getMyProfile } from "../../api/profile.api";

function Profile() {
  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);
    const [soundEnabled, setSoundEnabled] =
  useState(() => {
    return (
      localStorage.getItem(
        "bingoSoundEnabled"
      ) !== "false"
    );
  });
  const [
  manualMarkingEnabled,
  setManualMarkingEnabled,
] = useState(() => {

  return (
    localStorage.getItem(
      "bingoManualMarkingEnabled"
    ) !== "false"
  );

});

  const [error, setError] =
    useState("");

    const navigate = useNavigate();
    const { t } = useLanguage();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getMyProfile();

      setProfile(response.data);
    } catch (error) {
      console.error(
        "Failed to load profile:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSoundToggle = () => {
  setSoundEnabled(
    (currentValue) => {
      const nextValue =
        !currentValue;

      localStorage.setItem(
        "bingoSoundEnabled",
        String(nextValue)
      );

      return nextValue;
    }
  );
};
const [theme, setTheme] =
  useState(() => {
    return (
      localStorage.getItem(
        "playerTheme"
      ) || "day"
    );
  });
  const handleThemeToggle = () => {
  setTheme(
    (currentTheme) => {
      const nextTheme =
        currentTheme === "day"
          ? "night"
          : "day";

      localStorage.setItem(
        "playerTheme",
        nextTheme
      );

      document.documentElement.setAttribute(
        "data-theme",
        nextTheme
      );

      return nextTheme;
    }
  );
};
const handleManualMarkingToggle =
  () => {

    setManualMarkingEnabled(
      (currentValue) => {

        const nextValue =
          !currentValue;


        localStorage.setItem(
          "bingoManualMarkingEnabled",
          String(
            nextValue
          )
        );


        window.dispatchEvent(
          new Event(
            "bingoManualMarkingChanged"
          )
        );


        return nextValue;
      }
    );

  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <RefreshCw
            size={20}
            className="spin"
          />
          {t("profile.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <p>{error}</p>

          <button
            onClick={fetchProfile}
            className="profile-refresh-btn"
          >
            <RefreshCw size={17} />
           {t("common.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  

  const createdDate = profile.createdAt
    ? new Date(
        profile.createdAt
      ).toLocaleDateString()
    : "-";

  return (
    <div className="profile-page">

      {/* Header */}
      <div className="profile-header">
        <div>
          <h1>
  {t("profile.title")}
</h1>

<p>
  {t("profile.subtitle")}
</p>
        </div>

        <button
          onClick={fetchProfile}
          className="profile-refresh-btn"
        >
          <RefreshCw size={17} />
{t("common.refresh")}
        </button>
      </div>

      {/* Profile Hero */}
      <section className="profile-card">

        <div className="profile-avatar">
  <PlayerAvatar
  avatarId={1}
  size={110}
/>
</div>

        <div className="profile-main-info">
          <h2>{profile.fullName}</h2>

          <p className="profile-phone">
            {profile.phone}
          </p>

          <div className="profile-badges">

            <span className="profile-badge role">
              <User size={14} />
{t("profile.player")}
            </span>

            <span className="profile-badge active">
              <ShieldCheck size={14} />
{profile.status === "active"
  ? t("profile.active")
  : profile.status}
            </span>

            {profile.isVerified && (
              <span className="profile-badge verified">
                <UserCheck size={14} />
{t("profile.verified")}
              </span>
            )}

          </div>
        </div>

      </section>
      {/* Game Preferences */}
<section className="profile-section">

  <div className="profile-section-header">
    <div>
      <h2>
        Game settings
      </h2>

      <p>
        Manage game settings.
      </p>
    </div>
  </div>

  <div className="profile-sound-setting">

    <div className="profile-sound-info">

      <div className="profile-info-icon">
        {soundEnabled ? (
          <Volume2 size={20} />
        ) : (
          <VolumeX size={20} />
        )}
      </div>

      <div>
        <strong>
          Game Sound
        </strong>

        <span>
          {soundEnabled
            ? "Call and winning sounds are on."
            : "Game sounds are muted."}
        </span>
      </div>

    </div>

    <button
      type="button"
      className={`profile-sound-toggle ${
        soundEnabled
          ? "enabled"
          : ""
      }`}
      onClick={
        handleSoundToggle
      }
      aria-pressed={
        soundEnabled
      }
      aria-label={
        soundEnabled
          ? "Turn game sound off"
          : "Turn game sound on"
      }
    >
      <span className="profile-sound-toggle-knob" />
    </button>

  </div>
  {/* Manual Card Marking */}

<div className="profile-sound-setting profile-manual-marking-setting">

  <div className="profile-sound-info">

    <div className="profile-info-icon">

      <MousePointerClick
        size={20}
      />

    </div>

    <div>

      <strong>
        Manual Card Marking
      </strong>

      <span>
        {manualMarkingEnabled
          ? "Click called numbers on your card."
          : "Called numbers are marked automatically."}
      </span>

    </div>

  </div>


  <button
    type="button"
    className={`profile-sound-toggle ${
      manualMarkingEnabled
        ? "enabled"
        : ""
    }`}
    onClick={
      handleManualMarkingToggle
    }
    aria-pressed={
      manualMarkingEnabled
    }
    aria-label={
      manualMarkingEnabled
        ? "Turn manual card marking off"
        : "Turn manual card marking on"
    }
  >

    <span className="profile-sound-toggle-knob" />

  </button>

</div>
  <div className="profile-theme-setting">

  <div className="profile-theme-info">

    <div className="profile-info-icon">
      {theme === "day" ? (
        <Sun size={20} />
      ) : (
        <Moon size={20} />
      )}
    </div>

    <div>
      <strong>
        Appearance
      </strong>

      <span>
        {theme === "day"
          ? "Day mode uses a bright white palette."
          : "Night mode uses the dark Bingo palette."}
      </span>
    </div>

  </div>

  <button
    type="button"
    className={`profile-theme-toggle ${
      theme === "night"
        ? "night"
        : ""
    }`}
    onClick={
      handleThemeToggle
    }
    aria-label={
      theme === "day"
        ? "Switch to night mode"
        : "Switch to day mode"
    }
  >
    <span className="profile-theme-toggle-knob">
      {theme === "day" ? (
        <Sun size={14} />
      ) : (
        <Moon size={14} />
      )}
    </span>
  </button>

</div>

</section>



      {/* Account Information */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
           <h2>
  {t("profile.accountInformation")}
</h2>

<p>
  {t("profile.accountDescription")}
</p>
          </div>
        </div>

        <div className="profile-info-grid">

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <User size={19} />
            </div>

            <div>
              <span>
  {t("profile.fullName")}
</span>
              <strong>
                {profile.fullName}
              </strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <Phone size={19} />
            </div>

            <div>
                {t("profile.phoneNumber")}
              <strong>
                {profile.phone}
              </strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <span>{t("profile.accountStatus")}</span>
              <strong>
                {profile.status}
              </strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <Calendar size={19} />
            </div>

            <div>
              <span>{t("profile.memberSince")}</span>
              <strong>
                {createdDate}
              </strong>
            </div>
          </div>

        </div>

      </section>

      {/* Security */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>
  {t("profile.security")}
</h2>

<p>
  {t("profile.securityDescription")}
</p>
          </div>
        </div>

        <div className="profile-security-card">

          <div className="security-title">
  {t("profile.password")}
</div>

<div className="security-description">
  {t("profile.passwordDescription")}
</div>

          <button
  className="profile-secondary-btn"
  onClick={() =>
    navigate("/player/change-password")
  }
>
  {t("profile.changePassword")}
</button>

        </div>

      </section>

    </div>
  );
}

export default Profile;