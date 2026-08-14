import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  getAdminProfile,
  updateAdminProfile,
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


  useEffect(() => {
    loadProfile();
  }, []);


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

      </div>

    </div>
  );
}