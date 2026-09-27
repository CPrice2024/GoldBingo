/* =========================================
   NORMALIZE CBE RECEIPT URL
========================================= */

export const normalizeCbeReceiptUrl = (
  value: unknown
): string | null => {

  const raw =
    String(
      value || ""
    )
      .trim()
      .replace(
        /&amp;/gi,
        "&"
      );


  if (!raw) {
    return null;
  }


  try {

    const url =
      new URL(raw);


    if (
      url.protocol !==
      "https:"
    ) {
      return null;
    }


    if (
      url.hostname
        .toLowerCase() !==
      "mbreciept.cbe.com.et"
    ) {
      return null;
    }


    /*
     * QR/SMS transaction URLs currently
     * look like:
     *
     * https://mbreciept.cbe.com.et/v2-xxxxx
     */

    const pathname =
      url.pathname
        .replace(
          /\/+$/,
          ""
        );


    if (
      !/^\/v2-[A-Za-z0-9_-]+$/.test(
        pathname
      )
    ) {
      return null;
    }


    /*
     * Query string / hash must never
     * affect transaction matching.
     */

    return (
      "https://mbreciept.cbe.com.et" +
      pathname
    );

  } catch {

    return null;

  }

};


/* =========================================
   EXTRACT CBE RECEIPT URL FROM SMS
========================================= */

export const extractCbeReceiptUrl = (
  text: string
): string | null => {

  const cleanText =
    String(
      text || ""
    )
      .replace(
        /&amp;/gi,
        "&"
      );


  const match =
    cleanText.match(
      /https:\/\/mbreciept\.cbe\.com\.et\/v2-[A-Za-z0-9_-]+/i
    );


  if (!match) {
    return null;
  }


  return normalizeCbeReceiptUrl(
    match[0]
  );

};

/* =========================================
   EXTRACT CBE TRANSFER AMOUNT FROM SMS

   Example:
   You have successfully transferred
   ETB300.00 ...
========================================= */

export const extractCbeTransferAmountFromSms = (
  text: unknown
): number | null => {

  const match =
    String(
      text || ""
    ).match(
      /you\s+have\s+successfully\s+transferred\s+(?:ETB|BIRR)\s*:?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i
    );


  if (!match) {
    return null;
  }


  const amount =
    Number(
      match[1]
        .replace(
          /,/g,
          ""
        )
    );


  return Number.isFinite(
    amount
  )
    ? amount
    : null;
};