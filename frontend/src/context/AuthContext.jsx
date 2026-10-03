import {
  useEffect,
  useState,
} from "react";

import {
  Preferences,
} from "@capacitor/preferences";

import {
  AuthContext,
} from "./auth-context";

export const AuthProvider = ({
  children,
}) => {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    accessToken,
    setAccessToken,
  ] = useState(null);

  const [
    authReady,
    setAuthReady,
  ] = useState(false);


  /* ========================================
     RESTORE SAVED SESSION
  ======================================== */

  useEffect(() => {
    const restoreSession =
      async () => {
        try {
          const [
            tokenResult,
            userResult,
          ] = await Promise.all([
            Preferences.get({
              key: "accessToken",
            }),

            Preferences.get({
              key: "user",
            }),
          ]);

          const savedToken =
            tokenResult.value;

          const savedUser =
            userResult.value;

          if (
            savedToken &&
            savedUser
          ) {
            const parsedUser =
              JSON.parse(
                savedUser
              );

            setAccessToken(
              savedToken
            );

            setUser(
              parsedUser
            );

            /*
             * Keep localStorage synced
             * because axios currently
             * reads the token from there.
             */
            localStorage.setItem(
              "accessToken",
              savedToken
            );

            localStorage.setItem(
              "user",
              savedUser
            );

            console.log(
              "[AUTH] Persistent session restored"
            );
          } else {
            /*
             * Fallback for existing
             * installations that still
             * have the old localStorage
             * session.
             */
            const oldToken =
              localStorage.getItem(
                "accessToken"
              );

            const oldUser =
              localStorage.getItem(
                "user"
              );

            if (
              oldToken &&
              oldUser
            ) {
              const parsedUser =
                JSON.parse(
                  oldUser
                );

              setAccessToken(
                oldToken
              );

              setUser(
                parsedUser
              );

              /*
               * Migrate old session to
               * Capacitor Preferences.
               */
              await Promise.all([
                Preferences.set({
                  key: "accessToken",
                  value: oldToken,
                }),

                Preferences.set({
                  key: "user",
                  value: oldUser,
                }),
              ]);

              console.log(
                "[AUTH] Old session migrated to Preferences"
              );
            }
          }
        } catch (error) {
          console.error(
            "[AUTH] Session restore failed:",
            error
          );
        } finally {
          setAuthReady(true);
        }
      };

    restoreSession();
  }, []);


  /* ========================================
     LOGIN
  ======================================== */

  const login =
    async (
      token,
      userData
    ) => {
      const userJson =
        JSON.stringify(
          userData
        );

      /*
       * Native persistent storage.
       */
      await Promise.all([
        Preferences.set({
          key: "accessToken",
          value: token,
        }),

        Preferences.set({
          key: "user",
          value: userJson,
        }),
      ]);

      /*
       * Keep localStorage because the
       * current axios interceptor uses it.
       */
      localStorage.setItem(
        "accessToken",
        token
      );

      localStorage.setItem(
        "user",
        userJson
      );

      setAccessToken(
        token
      );

      setUser(
        userData
      );
    };


  /* ========================================
     LOGOUT
  ======================================== */

  const logout =
    async () => {
      await Promise.all([
        Preferences.remove({
          key: "accessToken",
        }),

        Preferences.remove({
          key: "user",
        }),
      ]);

      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem(
        "user"
      );

      setAccessToken(null);
      setUser(null);
    };


  /* ========================================
     TOKEN EXPIRATION
  ======================================== */

  useEffect(() => {
    if (
      !authReady ||
      !accessToken
    ) {
      return;
    }

    try {
      const payload =
        JSON.parse(
          atob(
            accessToken
              .split(".")[1]
              .replace(
                /-/g,
                "+"
              )
              .replace(
                /_/g,
                "/"
              )
          )
        );

      /*
       * Player token has no expiration.
       * Keep player logged in.
       */
      if (!payload.exp) {
        return;
      }

      /*
       * Admin / Agent tokens can
       * continue expiring normally.
       */
      const expiresAt =
        Number(
          payload.exp
        ) * 1000;

      const remaining =
        expiresAt -
        Date.now();

      if (remaining <= 0) {
        logout();
        return;
      }

      const timer =
        setTimeout(
          () => {
            logout();
          },
          remaining
        );

      return () => {
        clearTimeout(
          timer
        );
      };
    } catch (error) {
      console.error(
        "[AUTH] Invalid token:",
        error
      );
    }
  }, [
    accessToken,
    authReady,
  ]);


  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,

        isAuthenticated:
          Boolean(
            accessToken &&
            user
          ),

        authReady,

        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};