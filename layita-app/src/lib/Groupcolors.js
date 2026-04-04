export const GROUP_COLORS = {
  "default":                                        { fill: "#9aa5b1", border: "#ffffff", glow: "rgba(154,165,177,0.5)" },
  "ss group 1 (2023)":                              { fill: "#2d6b73", border: "#ffffff", glow: "rgba(45,107,115,0.5)"  },
  "ss group 2 (feb 2024)":                          { fill: "#1990c4", border: "#ffffff", glow: "rgba(25,144,196,0.5)"  },
  "ss group 3 (oct 2024 - mpakama a/a training)":   { fill: "#6854a5", border: "#ffffff", glow: "rgba(104,84,165,0.5)"  },
  "ss group 4 (oct 2024 - madwaleni training)":     { fill: "#fc8438", border: "#ffffff", glow: "rgba(252,132,56,0.5)"  },
  "ss group 5 (nov 2025 elliotdale)":               { fill: "#c0392b", border: "#ffffff", glow: "rgba(192,57,43,0.5)"   },
  "ss group 6 (nov 2025 mqanduli)":                 { fill: "#956c00", border: "#ffffff", glow: "rgba(149,108,0,0.5)"   },
  "siyakholwa group":                               { fill: "#1e7e44", border: "#ffffff", glow: "rgba(30,126,68,0.5)"   },
  "person interested in joining":                   { fill: "#d96520", border: "#ffffff", glow: "rgba(217,101,32,0.5)"  },
  "other":                                          { fill: "#637381", border: "#ffffff", glow: "rgba(99,115,129,0.5)"  },
};

export const resolveGroupColor = (groupName) => {
  if (!groupName) return GROUP_COLORS["default"];
  return GROUP_COLORS[groupName.toLowerCase().trim()] ?? GROUP_COLORS["default"];
};

export const GROUP_NAME_SHORT_FORMS = {
  "ss group 1 (2023)": "SS Group 1",
  "ss group 2 (feb 2024)": "SS Group 2",
  "ss group 3 (oct 2024 - mpakama a/a training)": "SS Group 3",
  "ss group 4 (oct 2024 - madwaleni training)": "SS Group 4",
  "ss group 5 (nov 2025 elliotdale)": "SS Group 5",
  "ss group 6 (nov 2025 mqanduli)": "SS Group 6",
  "siyakholwa group": "Siyakholwa Group",
  "person interested in joining": "Interested in Joining",
  "other": "Other",
};

export const resolveGroupNameShortForm = (groupName) => {
  return GROUP_NAME_SHORT_FORMS[groupName.toLowerCase().trim()] ?? groupName;
};