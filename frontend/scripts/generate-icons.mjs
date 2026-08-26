import fs from "fs";
import path from "path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();

const publicDir =
  path.join(root, "public");

const sourceIcon =
  path.join(
    publicDir,
    "favicon.svg"
  );

const sizes = [
  16,
  32,
  48,
  72,
  96,
  128,
  144,
  152,
  180,
  192,
  384,
  512,
  1024,
];

if (!fs.existsSync(sourceIcon)) {
  console.error(
    "favicon.svg was not found:",
    sourceIcon
  );

  process.exit(1);
}


/* ========================================
   NORMAL ICONS
======================================== */

for (const size of sizes) {

  let fileName;

  if (size === 16) {
    fileName =
      "favicon-16x16.png";
  } else if (size === 32) {
    fileName =
      "favicon-32x32.png";
  } else if (size === 48) {
    fileName =
      "favicon-48x48.png";
  } else if (size === 180) {
    fileName =
      "apple-touch-icon.png";
  } else if (size === 1024) {
    fileName =
      "gold-bingo-master.png";
  } else {
    fileName =
      `icon-${size}x${size}.png`;
  }


  await sharp(sourceIcon)
    .resize(size, size, {
      fit: "contain",
    })
    .png()
    .toFile(
      path.join(
        publicDir,
        fileName
      )
    );


  console.log(
    `Created ${fileName}`
  );
}


/* ========================================
   MASKABLE 192
======================================== */

const createMaskableIcon =
  async (size) => {

    /*
     * Maskable icons require safe spacing.
     * Logo occupies about 80% of canvas.
     */

    const innerSize =
      Math.round(size * 0.8);


    const logo =
      await sharp(sourceIcon)
        .resize(
          innerSize,
          innerSize,
          {
            fit: "contain",
          }
        )
        .png()
        .toBuffer();


    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,

        background: {
          r: 13,
          g: 16,
          b: 23,
          alpha: 1,
        },
      },
    })
      .composite([
        {
          input: logo,

          left:
            Math.round(
              (size - innerSize) / 2
            ),

          top:
            Math.round(
              (size - innerSize) / 2
            ),
        },
      ])
      .png()
      .toFile(
        path.join(
          publicDir,
          `maskable-icon-${size}x${size}.png`
        )
      );


    console.log(
      `Created maskable-icon-${size}x${size}.png`
    );
  };


await createMaskableIcon(192);
await createMaskableIcon(512);


/* ========================================
   FAVICON.ICO
======================================== */

const icoSources = [
  path.join(
    publicDir,
    "favicon-16x16.png"
  ),

  path.join(
    publicDir,
    "favicon-32x32.png"
  ),

  path.join(
    publicDir,
    "favicon-48x48.png"
  ),
];


const icoBuffer =
  await pngToIco(icoSources);


fs.writeFileSync(
  path.join(
    publicDir,
    "favicon.ico"
  ),
  icoBuffer
);


console.log(
  "Created favicon.ico"
);


console.log(
  "\n✅ GoldBingo icon generation completed."
);