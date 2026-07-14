# Profile README source

This repo powers the GitHub profile README at [github.com/joelpeckham](https://github.com/joelpeckham).

## Regenerating the hero

The banner is a Bauhaus composition matching [jpeckham.com](https://jpeckham.com). Edit `assets/hero.html`, then:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=1100,520 \
  --screenshot="$(pwd)/assets/hero.png" \
  --virtual-time-budget=5000 \
  "file://$(pwd)/assets/hero.html"
```

`assets/hero.svg` is a lightweight vector twin (fonts may not load when GitHub serves it as an `<img>`).
