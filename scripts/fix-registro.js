const fs = require("fs");
let c = fs.readFileSync("./app/registro.tsx", "utf8");

// ── 1. Remove COUNTRIES array ──────────────────────────────────────
c = c.replace(/const COUNTRIES = \[[\s\S]*?\];\n\n/, "");

// ── 2. Replace GEO_DATA (all countries → El Salvador flat map) ────
const newGeo = `// ── Geo data El Salvador (departamentos → ciudades) ───────────────
const GEO_DATA: Record<string, string[]> = {
  Ahuachapán: ["Ahuachapán", "Atiquizaya", "Tacuba", "El Refugio", "Turín"],
  Cabañas: ["Sensuntepeque", "Ilobasco", "Victoria", "San Isidro"],
  Chalatenango: ["Chalatenango", "La Palma", "Tejutla", "San Francisco Morazán"],
  Cuscatlán: ["Cojutepeque", "Suchitoto", "San Pedro Perulapán"],
  "La Libertad": ["Santa Tecla", "Antiguo Cuscatlán", "Zaragoza", "San Juan Opico", "Colón"],
  "La Paz": ["Zacatecoluca", "San Luis Talpa", "San Juan Nonualco"],
  "La Unión": ["La Unión", "Santa Rosa de Lima"],
  Morazán: ["San Francisco Gotera", "Jocoaitique", "Cacaopera"],
  "San Miguel": ["San Miguel", "Moncagua", "San Rafael Oriente"],
  "San Salvador": ["San Salvador", "Soyapango", "Mejicanos", "Apopa", "Ciudad Delgado", "Ilopango", "San Marcos", "Panchimalco"],
  "San Vicente": ["San Vicente", "Apastepeque"],
  "Santa Ana": ["Santa Ana", "Chalchuapa", "Metapán"],
  Sonsonate: ["Sonsonate", "Izalco", "Nahuizalco", "Acajutla"],
  Usulután: ["Usulután", "Jiquilisco", "Santiago de María"],
};`;

c = c.replace(
  /\/\/ ── Geo data[\s\S]*?(?=\n\/\/ ── Universities by country)/,
  newGeo,
);

// ── 3. Replace UNIVERSIDADES (all countries → ES flat array) ─────
const newUniv = `// ── Universidades El Salvador ────────────────────────────────────
const UNIVERSIDADES: string[] = [
  "Universidad Don Bosco (UDB)",
  "Universidad Centroamericana José Simeón Cañas (UCA)",
  "Universidad de El Salvador (UES)",
  "Universidad Tecnológica de El Salvador (UTEC)",
  "Universidad Francisco Gavidia (UFG)",
  "Universidad Modular Abierta (UMA)",
  "USAM",
  "CESSA Universidad",
  "Universidad Católica de El Salvador (UNICAES)",
  "Universidad de Oriente (UNIVO)",
  "Escuela Superior de Economía y Negocios (ESEN)",
  "Universidad Evangélica de El Salvador",
  "Universidad Luterana Salvadoreña (ULS)",
  "Universidad Pedagógica de El Salvador",
];`;

c = c.replace(
  /\/\/ ── Universities by country[\s\S]*?(?=\n\/\/ ── Document validation rules)/,
  newUniv,
);

// ── 4. Replace U3_DOC_RULES (all countries → ES only, rename to DOC_RULES) ──
const newDocRules = `// ── Document validation rules (El Salvador) ────────────────────
interface DocRule {
  maxLen: number;
  pattern: RegExp;
  hint: string;
  upper?: boolean;
}
const DOC_RULES: Record<DocType, DocRule> = {
  dui: {
    maxLen: 10,
    pattern: /^\\d{8}-\\d$/,
    hint: "DUI: formato XXXXXXXX-X  (ej: 12345678-9)",
  },
  pasaporte: {
    maxLen: 8,
    pattern: /^[A-Z]\\d{7}$/,
    hint: "Pasaporte: 1 letra mayúscula + 7 dígitos  (ej: A1234567)",
    upper: true,
  },
  licencia: {
    maxLen: 10,
    pattern: /^\\d{10}$/,
    hint: "Licencia de conducir: exactamente 10 dígitos numéricos",
  },
};`;

c = c.replace(
  /\/\/ ── Document validation rules per country[\s\S]*?(?=\n\/\/ ── Password strength)/,
  newDocRules,
);

fs.writeFileSync("./app/registro.tsx", c, "utf8");
console.log("Done. Lines now:", c.split("\n").length);

// Verify key markers are present
console.log(
  "GEO_DATA present:",
  c.includes("const GEO_DATA: Record<string, string[]>"),
);
console.log(
  "UNIVERSIDADES present:",
  c.includes("const UNIVERSIDADES: string[]"),
);
console.log(
  "DOC_RULES present:",
  c.includes("const DOC_RULES: Record<DocType, DocRule>"),
);
console.log("COUNTRIES removed:", !c.includes("const COUNTRIES ="));
console.log("U3_DOC_RULES removed:", !c.includes("const U3_DOC_RULES"));
