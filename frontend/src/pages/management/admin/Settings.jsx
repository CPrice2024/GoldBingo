import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  ShieldCheck,
  Image,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  BadgePercent,
} from "lucide-react";

import {
  getAdminPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../../../api/promotion.api";

import {
  getAdminProfile,
  updateAdminProfile,
  getDepositBonusSettings,
  updateDepositBonusSettings,
} from "../../../api/admin.api";

import { changePassword } from "../../../api/auth.api";


export default function AdminSettings() {
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const [account, setAccount] = useState(null);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [
  promotions,
  setPromotions,
] = useState([]);

const [
  promotionImage,
  setPromotionImage,
] = useState("");

const [
  promotionTitle,
  setPromotionTitle,
] = useState("");

const [
  promotionLink,
  setPromotionLink,
] = useState(
  "/player/play"
);

const [
  uploadingPromotion,
  setUploadingPromotion,
] = useState(false);

const [
  promotionLoading,
  setPromotionLoading,
] = useState(false);
const [
  depositBonus,
  setDepositBonus,
] = useState({
  enabled: false,
  percent: 100,
});


const [
  depositBonusLoading,
  setDepositBonusLoading,
] = useState(true);


const [
  savingDepositBonus,
  setSavingDepositBonus,
] = useState(false);


  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminProfile();

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to load profile"
        );
      }

      const data = response.data;

      setProfile({
        fullName: data.fullName || "",
        phone: data.phone || "",
        email: data.email || "",
      });

      setAccount(data);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };
  const loadPromotions =
  async () => {
    try {
      setPromotionLoading(
        true
      );

      const response =
        await getAdminPromotions();

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to load promotions"
        );
      }

      setPromotions(
        response.data || []
      );
    } catch (error) {
      console.error(
        "Promotion loading error:",
        error
      );
    } finally {
      setPromotionLoading(
        false
      );
    }
  };

  const loadDepositBonus =
  async () => {

    try {

      setDepositBonusLoading(
        true
      );

      const response =
        await getDepositBonusSettings();


      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to load deposit bonus settings"
        );
      }


      setDepositBonus({
        enabled:
          Boolean(
            response.data?.enabled
          ),

        percent:
          Number(
            response.data?.percent ??
              100
          ),
      });

    } catch (error) {

      console.error(
        "Deposit bonus loading error:",
        error
      );

    } finally {

      setDepositBonusLoading(
        false
      );

    }

  };


useEffect(() => {
  loadProfile();
  loadPromotions();
  loadDepositBonus();
}, []);

const handlePromotionImageChange =
  (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setMessage("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select a valid image."
      );

      return;
    }

    if (
      file.size >
      1024 * 1024
    ) {
      setError(
        "Banner must be smaller than 1 MB."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setPromotionImage(
        reader.result
      );
    };

    reader.readAsDataURL(
      file
    );
  };
  const handlePromotionUpload =
  async () => {
    if (!promotionImage) {
      setError(
        "Please select a banner image."
      );

      return;
    }

    try {
      setUploadingPromotion(
        true
      );

      setError("");
      setMessage("");

      const response =
        await createPromotion({
          title:
            promotionTitle.trim(),

          image:
            promotionImage,

          link:
            promotionLink.trim() ||
            "/player/play",

          order:
            promotions.length + 1,

          active: true,
        });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to upload promotion"
        );
      }

      setPromotionImage("");
      setPromotionTitle("");
      setPromotionLink(
        "/player/play"
      );

      setMessage(
        "Promotion uploaded successfully."
      );

      await loadPromotions();
    } catch (error) {
      console.error(
        "Promotion upload error:",
        error
      );

      setError(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Failed to upload promotion"
      );
    } finally {
      setUploadingPromotion(
        false
      );
    }
  };
  const handlePromotionToggle =
  async (promotion) => {
    try {
      setError("");
      setMessage("");

      const response =
        await updatePromotion(
          promotion._id,
          {
            active:
              !promotion.active,
          }
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update promotion"
        );
      }

      await loadPromotions();
    } catch (error) {
      setError(
        error?.response?.data
          ?.message ||
          "Failed to update promotion"
      );
    }
  };
  const handlePromotionDelete =
  async (promotionId) => {
    const confirmed =
      window.confirm(
        "Delete this promotion?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response =
        await deletePromotion(
          promotionId
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to delete promotion"
        );
      }

      setMessage(
        "Promotion deleted successfully."
      );

      await loadPromotions();
    } catch (error) {
      setError(
        error?.response?.data
          ?.message ||
          "Failed to delete promotion"
      );
    }
  };
const handleDepositBonusSave =
  async () => {

    setError("");
    setMessage("");


    const percent =
      Number(
        depositBonus.percent
      );


    if (
      !Number.isFinite(percent) ||
      percent < 0 ||
      percent > 100
    ) {

      setError(
        "Deposit bonus percentage must be between 0 and 100."
      );

      return;
    }


    try {

      setSavingDepositBonus(
        true
      );


      const response =
        await updateDepositBonusSettings(
          {
            enabled:
              depositBonus.enabled,

            percent,
          }
        );


      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to save deposit bonus settings"
        );
      }


      setDepositBonus({
        enabled:
          response.data.enabled,

        percent:
          response.data.percent,
      });


      setMessage(
        response?.message ||
          "Deposit bonus settings saved successfully."
      );

    } catch (error) {

      console.error(
        "Deposit bonus save error:",
        error
      );


      setError(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Failed to save deposit bonus settings"
      );

    } finally {

      setSavingDepositBonus(
        false
      );

    }

  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setError("");
      setMessage("");

      const response =
        await updateAdminProfile(profile);

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update profile"
        );
      }

      setAccount(response.data);

      setMessage(
        "Profile updated successfully."
      );

      // Keep AuthContext/localStorage user
      // synchronized.
      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {
        try {
          const user =
            JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              fullName:
                response.data.fullName,
              phone:
                response.data.phone,
            })
          );
        } catch {
          // Ignore malformed local storage.
        }
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };


  const handlePasswordSubmit =
    async (e) => {
      e.preventDefault();

      setError("");
      setMessage("");

      if (
        !passwords.currentPassword ||
        !passwords.newPassword ||
        !passwords.confirmPassword
      ) {
        setError(
          "All password fields are required."
        );
        return;
      }

      if (
        passwords.newPassword.length < 6
      ) {
        setError(
          "New password must be at least 6 characters."
        );
        return;
      }

      if (
        passwords.newPassword !==
        passwords.confirmPassword
      ) {
        setError(
          "New passwords do not match."
        );
        return;
      }

      try {
        setChangingPassword(true);

        const response =
          await changePassword(
            passwords.currentPassword,
            passwords.newPassword
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to change password"
          );
        }

        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setMessage(
          "Password changed successfully."
        );
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to change password"
        );
      } finally {
        setChangingPassword(false);
      }
    };


  if (loading) {
    return (
      <div className="admin-settings-page">
        <div className="admin-page-loading">
          Loading settings...
        </div>
      </div>
    );
  }


  return (
    <div className="admin-settings-page">

      <div className="admin-page-header">
        <div>
          <h1>Settings</h1>

          <p>
            Manage your administrator account
            and security.
          </p>
        </div>
      </div>


      {message && (
        <div className="admin-success">
          {message}
        </div>
      )}


      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}


      <div className="admin-settings-grid">

        {/* PROFILE */}

        <section className="admin-settings-card">

          <div className="admin-settings-card-header">
            <div className="admin-settings-card-icon">
              <User size={20} />
            </div>

            <div>
              <h2>Administrator Profile</h2>

              <p>
                Update your personal account
                information.
              </p>
            </div>
          </div>


          <form
            onSubmit={handleProfileSubmit}
          >

            <div className="admin-settings-field">

              <label>Full Name</label>

              <div className="admin-settings-input">
                <User size={18} />

                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      fullName:
                        e.target.value,
                    })
                  }
                />
              </div>

            </div>


            <div className="admin-settings-field">

              <label>Phone Number</label>

              <div className="admin-settings-input">
                <Phone size={18} />

                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      phone:
                        e.target.value,
                    })
                  }
                />
              </div>

            </div>


            <div className="admin-settings-field">

              <label>Email</label>

              <div className="admin-settings-input">
                <Mail size={18} />

                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      email:
                        e.target.value,
                    })
                  }
                />
              </div>

            </div>


            <button
              type="submit"
              disabled={savingProfile}
              className="admin-settings-save-button"
            >
              {savingProfile ? (
                <>
                  <Loader2
                    size={17}
                    className="admin-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />

                  Save Changes
                </>
              )}
            </button>

          </form>

        </section>


        {/* SECURITY */}

        <section className="admin-settings-card">

          <div className="admin-settings-card-header">

            <div className="admin-settings-card-icon">
              <Lock size={20} />
            </div>

            <div>
              <h2>Security</h2>

              <p>
                Change your administrator
                password.
              </p>
            </div>

          </div>


          <form
            onSubmit={
              handlePasswordSubmit
            }
          >

            <div className="admin-settings-field">

              <label>
                Current Password
              </label>

              <div className="admin-settings-input">

                <Lock size={18} />

                <input
                  type="password"
                  value={
                    passwords.currentPassword
                  }
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword:
                        e.target.value,
                    })
                  }
                />

              </div>

            </div>


            <div className="admin-settings-field">

              <label>
                New Password
              </label>

              <div className="admin-settings-input">

                <Lock size={18} />

                <input
                  type="password"
                  value={
                    passwords.newPassword
                  }
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      newPassword:
                        e.target.value,
                    })
                  }
                />

              </div>

            </div>


            <div className="admin-settings-field">

              <label>
                Confirm New Password
              </label>

              <div className="admin-settings-input">

                <Lock size={18} />

                <input
                  type="password"
                  value={
                    passwords.confirmPassword
                  }
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword:
                        e.target.value,
                    })
                  }
                />

              </div>

            </div>


            <button
              type="submit"
              disabled={changingPassword}
              className="admin-settings-save-button"
            >
              {changingPassword ? (
                <>
                  <Loader2
                    size={17}
                    className="admin-spin"
                  />

                  Changing...
                </>
              ) : (
                <>
                  <ShieldCheck
                    size={17}
                  />

                  Change Password
                </>
              )}
            </button>

          </form>

        </section>


        {/* ACCOUNT INFORMATION */}

        <section className="admin-settings-card admin-account-card">

          <div className="admin-settings-card-header">

            <div className="admin-settings-card-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Account Information</h2>

              <p>
                Current administrator account
                status.
              </p>
            </div>

          </div>


          <div className="admin-account-info">

            <div>
              <span>Role</span>
              <strong>
                {account?.role || "admin"}
              </strong>
            </div>


            <div>
              <span>Status</span>
              <strong>
                {account?.status || "-"}
              </strong>
            </div>


            <div>
              <span>Verification</span>
              <strong>
                {account?.isVerified
                  ? "Verified"
                  : "Not Verified"}
              </strong>
            </div>


            <div>
              <span>Last Login</span>
              <strong>
                {account?.lastLogin
                  ? new Date(
                      account.lastLogin
                    ).toLocaleString()
                  : "Never"}
              </strong>
            </div>

          </div>

        </section>
        {/* =====================================
    DEPOSIT BONUS
===================================== */}

<section className="admin-settings-card admin-deposit-bonus-card">

  <div className="admin-settings-card-header">

    <div className="admin-settings-card-icon">
      <BadgePercent size={20} />
    </div>

    <div>
      <h2>
        Deposit Bonus
      </h2>

      <p>
        Enable or disable deposit
        bonuses and configure the
        bonus percentage.
      </p>
    </div>

  </div>


  {depositBonusLoading ? (

    <div className="admin-deposit-bonus-loading">

      <Loader2
        size={18}
        className="admin-spin"
      />

      Loading deposit bonus...

    </div>

  ) : (

    <>

      {/* ENABLE / DISABLE */}

      <div className="admin-deposit-bonus-row">

        <div>

          <strong>
            Deposit Bonus
          </strong>

          <span>
            Give players an extra
            percentage when a deposit
            is approved.
          </span>

        </div>


        <label className="admin-bonus-switch">

          <input
            type="checkbox"

            checked={
              depositBonus.enabled
            }

            onChange={(event) =>
              setDepositBonus(
                (current) => ({
                  ...current,

                  enabled:
                    event.target
                      .checked,
                })
              )
            }
          />

          <span className="admin-bonus-slider" />

        </label>

      </div>


      {/* PERCENT */}

      <div className="admin-settings-field">

        <label>
          Bonus Percentage
        </label>


        <div className="admin-bonus-percent-input">

          <BadgePercent
            size={18}
          />

          <input
            type="number"

            min="0"
            max="100"
            step="1"

            value={
              depositBonus.percent
            }

            onChange={(event) =>
              setDepositBonus(
                (current) => ({
                  ...current,

                  percent:
                    event.target
                      .value,
                })
              )
            }

            disabled={
              !depositBonus.enabled
            }
          />

          <span>
            %
          </span>

        </div>

      </div>


      {/* EXAMPLE */}

      <div className="admin-bonus-example">

        <span>
          Example
        </span>

        <strong>
          100 ETB deposit
          {" → "}
          {depositBonus.enabled
            ? (
                100 +
                (
                  100 *
                  Number(
                    depositBonus.percent ||
                      0
                  )
                ) /
                  100
              ).toFixed(2)
            : "100.00"}{" "}
          ETB credited
        </strong>

      </div>


      <button
        type="button"

        className="admin-settings-save-button"

        onClick={
          handleDepositBonusSave
        }

        disabled={
          savingDepositBonus
        }
      >

        {savingDepositBonus ? (

          <>
            <Loader2
              size={17}
              className="admin-spin"
            />

            Saving...
          </>

        ) : (

          <>
            <Save size={17} />

            Save Deposit Bonus
          </>

        )}

      </button>

    </>

  )}

</section>

        <section className="admin-settings-card admin-promotion-card">

  <div className="admin-settings-card-header">

    <div className="admin-settings-card-icon">
      <Image size={20} />
    </div>

    <div>
      <h2>
        Player Sidebar Promotions
      </h2>

      <p>
        Upload and manage promotional
        banners displayed in the
        player sidebar.
      </p>
    </div>

  </div>


  <div className="admin-promotion-upload-area">

    <label className="admin-promotion-file">

      <Upload size={22} />

      <span>
        Choose Promotion Banner
      </span>

      <small>
        Recommended ratio: 192 × 88
      </small>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={
          handlePromotionImageChange
        }
      />

    </label>


    {promotionImage && (
      <div className="admin-promotion-preview">

        <img
          src={promotionImage}
          alt="Banner preview"
        />

      </div>
    )}


    <div className="admin-settings-field">

      <label>
        Promotion Title
      </label>

      <div className="admin-settings-input">

        <input
          type="text"
          value={
            promotionTitle
          }
          placeholder="Premier League"
          onChange={(e) =>
            setPromotionTitle(
              e.target.value
            )
          }
        />

      </div>

    </div>


    <div className="admin-settings-field">

      <label>
        Click Destination
      </label>

      <div className="admin-settings-input">

        <input
          type="text"
          value={
            promotionLink
          }
          placeholder="/player/play"
          onChange={(e) =>
            setPromotionLink(
              e.target.value
            )
          }
        />

      </div>

    </div>


    <button
      type="button"
      className="admin-settings-save-button"
      disabled={
        uploadingPromotion ||
        !promotionImage
      }
      onClick={
        handlePromotionUpload
      }
    >

      {uploadingPromotion ? (
        <>
          <Loader2
            size={17}
            className="admin-spin"
          />

          Uploading...
        </>
      ) : (
        <>
          <Upload size={17} />
          Upload
        </>
      )}

    </button>

  </div>


  <div className="admin-promotion-list">

    <h3>
      Current Promotions
    </h3>


    {promotionLoading ? (
      <div className="admin-promotion-empty">
        Loading promotions...
      </div>
    ) : promotions.length === 0 ? (
      <div className="admin-promotion-empty">
        No promotions uploaded yet.
      </div>
    ) : (
      promotions.map(
        (promotion) => (
          <div
            key={promotion._id}
            className="admin-promotion-item"
          >

            <img
              src={promotion.image}
              alt={
                promotion.title ||
                "Promotion"
              }
            />


            <div className="admin-promotion-info">

              <strong>
                {promotion.title ||
                  "Untitled Promotion"}
              </strong>

              <span>
                {promotion.link}
              </span>

              <small
                className={
                  promotion.active
                    ? "active"
                    : "hidden"
                }
              >
                {promotion.active
                  ? "Active"
                  : "Hidden"}
              </small>

            </div>


            <div className="admin-promotion-actions">

              <button
                type="button"
                title={
                  promotion.active
                    ? "Hide promotion"
                    : "Show promotion"
                }
                onClick={() =>
                  handlePromotionToggle(
                    promotion
                  )
                }
              >

                {promotion.active ? (
                  <Eye size={17} />
                ) : (
                  <EyeOff size={17} />
                )}

              </button>


              <button
                type="button"
                className="delete"
                title="Delete promotion"
                onClick={() =>
                  handlePromotionDelete(
                    promotion._id
                  )
                }
              >
                <Trash2 size={17} />
              </button>

            </div>

          </div>
        )
      )
    )}

  </div>

</section>

      </div>

    </div>
  );
}