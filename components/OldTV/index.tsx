/* eslint-disable */
import Box from "../Box";
import ScreenEffect from "../../lib/screenEffect";
import { useEffect } from "react";

const OldTV = () => {
  useEffect(() => {
    const screen = new ScreenEffect("#screen", {});
    const dat = require("dat.gui");
    const gui = new dat.GUI();

    const config = {
      effects: {
        roll: {
          enabled: false,
          options: {
            speed: 1000,
          },
        },
        image: {
          enabled: true,
          options: {
            src: "https://images.unsplash.com/photo-1505977404378-3a0e28ec6488?ixlib=rb-1.2.1&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ",
            blur: 1.2,
          },
        },
        vignette: { enabled: true },
        scanlines: { enabled: true },
        vcr: {
          enabled: true,
          options: {
            opacity: 1,
            miny: 220,
            miny2: 220,
            num: 70,
            fps: 60,
          },
        },
        wobbley: { enabled: true },
        snow: {
          enabled: true,
          options: {
            opacity: 0.2,
          },
        },
      },
    };

    const f1 = gui.addFolder("Effects");
    const f2 = gui.addFolder("Snow");
    const f3 = gui.addFolder("VCR");
    const f4 = gui.addFolder("Roll");
    const f5 = gui.addFolder("Image");

    for (const effect in config.effects) {
      const type = config.effects[effect];
      f1.add(type, "enabled")
        .name(effect)
        .onChange((bool) => {
          if (bool) {
            screen.add(effect, config.effects[effect].options);
          } else {
            screen.remove(effect);
          }
        });

      if (type.options) {
        const folder = effect === "vcr" || effect === "video" ? f3 : f2;
        for (const p in type.options) {
          if (p === "speed") {
            f4.add(type.options, p)
              .min(100)
              .step(1)
              .max(10000)
              .onChange((val) => {
                screen.effects[
                  effect
                ].node.style.animationDuration = `${val}ms`;
              });
          }

          if (p === "opacity") {
            folder
              .add(type.options, p)
              .name(`${effect} opacity`)
              .min(0)
              .step(0.1)
              .max(1)
              .onChange((val) => {
                screen.effects[effect].node.style.opacity = val;
              });
          }

          if (p === "miny") {
            folder
              .add(type.options, p)
              .name(`tracking`)
              .min(0)
              .step(0.1)
              .max(400)
              .onChange((val) => {
                screen.effects[effect].config.miny = val;
                screen.effects[effect].config.miny2 = 400 - val;
              });
          }

          if (p === "num") {
            folder
              .add(type.options, p)
              .name(`tape age`)
              .min(1)
              .step(0.1)
              .max(100)
              .onChange((val) => {
                screen.effects[effect].config.num = val;
              });
          }

          if (p === "blur") {
            f5.add(type.options, p)
              .name(`blur`)
              .min(1)
              .step(0.1)
              .max(5)
              .onChange((val) => {
                if (effect === "vcr") {
                  screen.effects[effect].config.blur = val;
                } else {
                  screen.effects[effect].node.style.filter = `blur(${val}px)`;
                }
              });
          }
        }
      }
    }

    f1.open();
    f2.open();
    f3.open();
    f4.open();
    f5.open();

    setTimeout(() => {
      for (const prop in config.effects) {
        if (!!config.effects[prop].enabled) {
          screen.add(prop, config.effects[prop].options);
        }
      }
    }, 1000);
  }, []);

  return (
    <Box className="tv">
      <Box id="screen" />
    </Box>
  );
};

export default OldTV;
