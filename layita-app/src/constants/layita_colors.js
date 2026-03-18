// ─────────────────────────────────────────────────────────────────────────────
// LAYITA COLOR SYSTEM

export const LAYITA_HEX_COLORS = {
  // Brand
  "blue":           "#86b5b9",
  "blue_dark":      "#5a9099",
  "blue_deep":      "#2d6b73",
  "orange":         "#fc8438",
  "orange_light":   "#fda461",
  "orange_deep":    "#d96520",

  // Neutrals (light UI surface scale)
  "gray":           "#7f7f7f",
  "gray_light":     "#b0b8c1",
  "gray_lighter":   "#d1d9e0",
  "gray_lightest":  "#eef1f4",
  "white":          "#ffffff",
  "off_white":      "#f6f8fa",
  "near_white":     "#f0f3f6",

  // Text
  "ink":            "#090b0d",   // primary text
  "ink_mid":        "#3d4f5c",   // secondary text
  "ink_light":      "#637381",   // muted / labels

  // Semantic
  "success":        "#1e7e44",
  "success_bg":     "#eaf6ee",
  "danger":         "#c0392b",
  "danger_bg":      "#fdecea",
  "warning":        "#956c00",
  "warning_bg":     "#fdf4dc",
};

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOKENS
export const themeColors = {
  // Brand / interactive
  primary:            LAYITA_HEX_COLORS.blue,           // #86b5b9
  primaryDark:        LAYITA_HEX_COLORS.blue_dark,      // #5a9099  — hover
  primaryDeep:        LAYITA_HEX_COLORS.blue_deep,      // #2d6b73  — active / selected
  secondary:          LAYITA_HEX_COLORS.orange,         // #fc8438
  secondaryLight:     LAYITA_HEX_COLORS.orange_light,   // #fda461
  secondaryDark:      LAYITA_HEX_COLORS.orange_deep,    // #d96520  — hover on secondary

  // Text
  text:               LAYITA_HEX_COLORS.ink,            // #1a2027  — primary body text
  textSecondary:      LAYITA_HEX_COLORS.ink_mid,        // #3d4f5c  — secondary
  textMuted:          LAYITA_HEX_COLORS.ink_light,      // #637381  — labels / placeholders
  textDisabled:       LAYITA_HEX_COLORS.gray_light,     // #b0b8c1

  // Backgrounds & surfaces
  background:         LAYITA_HEX_COLORS.white,          // #ffffff  — page bg
  bgSubtle:           LAYITA_HEX_COLORS.off_white,      // #f6f8fa  — sidebar / header
  bgSunken:           LAYITA_HEX_COLORS.near_white,     // #f0f3f6  — inputs
  bgHover:            LAYITA_HEX_COLORS.gray_lightest,  // #eef1f4  — hover rows
  bgPanel:            LAYITA_HEX_COLORS.white,          // #ffffff  — panels / cards

  // Borders
  border:             LAYITA_HEX_COLORS.gray_lighter,   // #d1d9e0
  borderStrong:       LAYITA_HEX_COLORS.gray_light,     // #b0b8c1

  // Semantic
  success:            LAYITA_HEX_COLORS.success,        // #1e7e44
  successBg:          LAYITA_HEX_COLORS.success_bg,     // #eaf6ee
  danger:             LAYITA_HEX_COLORS.danger,         // #c0392b
  dangerBg:           LAYITA_HEX_COLORS.danger_bg,      // #fdecea
  warning:            LAYITA_HEX_COLORS.warning,        // #956c00
  warningBg:          LAYITA_HEX_COLORS.warning_bg,     // #fdf4dc

  // Tints (used for active states, glows, badge backgrounds)
  primaryTint08:      "rgba(134,181,185,0.08)",
  primaryTint15:      "rgba(134,181,185,0.15)",
  primaryTint25:      "rgba(134,181,185,0.25)",
  primaryGlow:        "rgba(90,144,153,0.35)",
  secondaryTint10:    "rgba(252,132,56,0.10)",
  secondaryTint20:    "rgba(252,132,56,0.20)",
};