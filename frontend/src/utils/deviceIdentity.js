import {
  Capacitor,
} from "@capacitor/core";

import {
  Preferences,
} from "@capacitor/preferences";


const DEVICE_ID_KEY =
  "goldbingo_device_id";

const DEVICE_CREDENTIAL_KEY =
  "goldbingo_device_credential";


/* ========================================
   GENERATE DEVICE ID
======================================== */

const generateDeviceId = () => {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID ===
      "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  const bytes =
    new Uint8Array(16);

  globalThis.crypto.getRandomValues(
    bytes
  );

  return Array.from(bytes)
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
};


/* ========================================
   GET OR CREATE DEVICE ID
======================================== */

export const getOrCreateDeviceId =
  async () => {

    /*
     * Native Android / Capacitor
     */
    if (
      Capacitor.isNativePlatform()
    ) {
      const result =
        await Preferences.get({
          key: DEVICE_ID_KEY,
        });

      if (result.value) {
        return result.value;
      }

      const deviceId =
        generateDeviceId();

      await Preferences.set({
        key: DEVICE_ID_KEY,
        value: deviceId,
      });

      console.log(
        "[DEVICE] New native device ID created"
      );

      return deviceId;
    }


    /*
     * Browser
     */
    let deviceId =
      localStorage.getItem(
        DEVICE_ID_KEY
      );

    if (deviceId) {
      return deviceId;
    }

    deviceId =
      generateDeviceId();

    localStorage.setItem(
      DEVICE_ID_KEY,
      deviceId
    );

    console.log(
      "[DEVICE] New browser device ID created"
    );

    return deviceId;
  };


/* ========================================
   GET DEVICE CREDENTIAL
======================================== */

export const getDeviceCredential =
  async () => {

    if (
      Capacitor.isNativePlatform()
    ) {
      const result =
        await Preferences.get({
          key:
            DEVICE_CREDENTIAL_KEY,
        });

      return result.value || null;
    }

    return (
      localStorage.getItem(
        DEVICE_CREDENTIAL_KEY
      ) || null
    );
  };


/* ========================================
   SAVE DEVICE CREDENTIAL
======================================== */

export const saveDeviceCredential =
  async (credential) => {

    if (
      !credential ||
      typeof credential !==
        "string"
    ) {
      return;
    }

    if (
      Capacitor.isNativePlatform()
    ) {
      await Preferences.set({
        key:
          DEVICE_CREDENTIAL_KEY,

        value:
          credential,
      });

      console.log(
        "[DEVICE] Native credential saved"
      );

      return;
    }

    localStorage.setItem(
      DEVICE_CREDENTIAL_KEY,
      credential
    );

    console.log(
      "[DEVICE] Browser credential saved"
    );
  };


/* ========================================
   GET COMPLETE DEVICE IDENTITY
======================================== */

export const getDeviceIdentity =
  async () => {

    const deviceId =
      await getOrCreateDeviceId();

    const deviceCredential =
      await getDeviceCredential();

    return {
      deviceId,
      deviceCredential,

      platform:
        Capacitor.isNativePlatform()
          ? "android"
          : "web",
    };
  };