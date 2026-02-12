import type { FeatureLike } from "ol/Feature";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";
import Text from "ol/style/Text";

// REGIONS (polygon)
const regionFill = new Fill({ color: "rgba(30, 136, 229, 0.15)" });
const regionFillHover = new Fill({ color: "rgba(30, 136, 229, 0.30)" });
const regionStroke = new Stroke({ color: "rgba(30, 136, 229, 0.9)", width: 2 });
const regionStrokeHover = new Stroke({
  color: "rgba(30, 136, 229, 1)",
  width: 3,
});

export function regionStyle(feature: FeatureLike) {
  const hovered = feature.get("___hover") === true;
  return new Style({
    fill: hovered ? regionFillHover : regionFill,
    stroke: hovered ? regionStrokeHover : regionStroke,
  });
}

// SHELTERS (point)
function capacityFromProps(feature: FeatureLike): number | null {
  const candidates = ["plasser", "PLASSER", "kapasitet", "KAPASITET"];
  for (const key of candidates) {
    const v = feature.get(key);
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v)))
      return Number(v);
  }
  return null;
}

export function shelterStyle(feature: FeatureLike) {
  const hovered = feature.get("___hover") === true;
  const cap = capacityFromProps(feature);

  const radiusBase =
    cap == null ? 6 : Math.max(6, Math.min(14, 4 + Math.sqrt(cap) / 3));
  const radius = hovered ? radiusBase + 3 : radiusBase;

  const fillColor =
    cap == null
      ? "rgba(120, 120, 120, 0.8)"
      : cap >= 500
        ? "rgba(216, 27, 96, 0.85)"
        : cap >= 200
          ? "rgba(245, 124, 0, 0.85)"
          : "rgba(46, 125, 50, 0.85)";

  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({
        color: "rgba(255,255,255,0.95)",
        width: hovered ? 3 : 2,
      }),
    }),
    text: hovered
      ? new Text({
          text: cap != null ? `${cap}` : "",
          offsetY: -18,
          fill: new Fill({ color: "rgba(0,0,0,0.9)" }),
          stroke: new Stroke({ color: "rgba(255,255,255,0.9)", width: 3 }),
        })
      : undefined,
  });
}
