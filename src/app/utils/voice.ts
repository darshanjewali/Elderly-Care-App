import { Medication } from "./types";

export interface Language {
  code: string;
  label: string;
  flag: string;
  nativeName: string;
  slangDesc: string;
}

export const LANGUAGES: Language[] = [
  { code: "en-US",  label: "English",   flag: "🇺🇸", nativeName: "English",   slangDesc: "Buddy / Mate" },
  { code: "hi-IN",  label: "Hindi",     flag: "🇮🇳", nativeName: "हिन्दी",    slangDesc: "Beta / Ji" },
  { code: "kn-IN",  label: "Kannada",   flag: "🇮🇳", nativeName: "ಕನ್ನಡ",     slangDesc: "Ayya / Amma" },
  { code: "te-IN",  label: "Telugu",    flag: "🇮🇳", nativeName: "తెలుగు",    slangDesc: "Babu / Amma" },
  { code: "ta-IN",  label: "Tamil",     flag: "🇮🇳", nativeName: "தமிழ்",     slangDesc: "Appa / Amma" },
  { code: "ml-IN",  label: "Malayalam", flag: "🇮🇳", nativeName: "മലയാളം",    slangDesc: "Mol / Mon" },
  { code: "es-ES",  label: "Spanish",   flag: "🇪🇸", nativeName: "Español",   slangDesc: "Campeón / Amigo" },
  { code: "fr-FR",  label: "French",    flag: "🇫🇷", nativeName: "Français",  slangDesc: "Mon ami / Chéri" },
  { code: "ar-SA",  label: "Arabic",    flag: "🇸🇦", nativeName: "العربية",   slangDesc: "Habibi / Ya 3azizi" },
  { code: "zh-CN",  label: "Chinese",   flag: "🇨🇳", nativeName: "中文",       slangDesc: "宝贝 / 来来" },
  { code: "pt-BR",  label: "Portuguese",flag: "🇧🇷", nativeName: "Português", slangDesc: "Meu bem / Gente" },
  { code: "ja-JP",  label: "Japanese",  flag: "🇯🇵", nativeName: "日本語",     slangDesc: "ね / さあ" },
  { code: "ko-KR",  label: "Korean",    flag: "🇰🇷", nativeName: "한국어",     slangDesc: "야 / 요" },
  { code: "tl-PH",  label: "Filipino",  flag: "🇵🇭", nativeName: "Filipino",  slangDesc: "Pre / Pare" },
];

// ── Pill color names in all languages ─────────────────────────────────────────
const COLOR_NAMES: Record<string, Record<string, string>> = {
  "en-US": {
    "#3b82f6": "blue",      "#ef4444": "red",       "#22c55e": "green",
    "#eab308": "yellow",    "#a855f7": "purple",    "#ec4899": "pink",
    "#f97316": "orange",    "#e2e8f0": "white",
  },
  "hi-IN": {
    "#3b82f6": "neeli",     "#ef4444": "laal",      "#22c55e": "hari",
    "#eab308": "peeli",     "#a855f7": "baingani",  "#ec4899": "gulabi",
    "#f97316": "narangi",   "#e2e8f0": "safed",
  },
  "kn-IN": {
    "#3b82f6": "nīli",      "#ef4444": "kempu",     "#22c55e": "hasiru",
    "#eab308": "haladi",    "#a855f7": "nēraḷe",    "#ec4899": "gulābi",
    "#f97316": "kittaḷe",   "#e2e8f0": "bili",
  },
  "te-IN": {
    "#3b82f6": "nīlam",     "#ef4444": "ērupu",     "#22c55e": "āku pacca",
    "#eab308": "pasupu",    "#a855f7": "ūdā",       "#ec4899": "gulābi",
    "#f97316": "nāriñja",   "#e2e8f0": "tēlupu",
  },
  "ta-IN": {
    "#3b82f6": "nīlam",     "#ef4444": "civappu",   "#22c55e": "paccai",
    "#eab308": "mañcaḷ",    "#a855f7": "ūtā",       "#ec4899": "iḷañcivappu",
    "#f97316": "āraññju",   "#e2e8f0": "veḷḷai",
  },
  "ml-IN": {
    "#3b82f6": "nīla",      "#ef4444": "cuvappu",   "#22c55e": "pacca",
    "#eab308": "mañña",     "#a855f7": "ūta",       "#ec4899": "piṅk",
    "#f97316": "ōraññju",   "#e2e8f0": "veḷḷa",
  },
  "es-ES": {
    "#3b82f6": "azul",      "#ef4444": "rojo",      "#22c55e": "verde",
    "#eab308": "amarillo",  "#a855f7": "morado",    "#ec4899": "rosado",
    "#f97316": "naranja",   "#e2e8f0": "blanco",
  },
  "fr-FR": {
    "#3b82f6": "bleue",     "#ef4444": "rouge",     "#22c55e": "verte",
    "#eab308": "jaune",     "#a855f7": "violette",  "#ec4899": "rose",
    "#f97316": "orange",    "#e2e8f0": "blanche",
  },
  "ar-SA": {
    "#3b82f6": "زرقاء",    "#ef4444": "حمراء",     "#22c55e": "خضراء",
    "#eab308": "صفراء",    "#a855f7": "بنفسجية",   "#ec4899": "وردية",
    "#f97316": "برتقالية", "#e2e8f0": "بيضاء",
  },
  "zh-CN": {
    "#3b82f6": "蓝色",      "#ef4444": "红色",       "#22c55e": "绿色",
    "#eab308": "黄色",      "#a855f7": "紫色",       "#ec4899": "粉色",
    "#f97316": "橙色",      "#e2e8f0": "白色",
  },
  "pt-BR": {
    "#3b82f6": "azul",      "#ef4444": "vermelha",  "#22c55e": "verde",
    "#eab308": "amarela",   "#a855f7": "roxa",      "#ec4899": "rosa",
    "#f97316": "laranja",   "#e2e8f0": "branca",
  },
  "ja-JP": {
    "#3b82f6": "青い",      "#ef4444": "赤い",       "#22c55e": "緑の",
    "#eab308": "黄色い",    "#a855f7": "紫の",       "#ec4899": "ピンクの",
    "#f97316": "オレンジの","#e2e8f0": "白い",
  },
  "ko-KR": {
    "#3b82f6": "파란색",    "#ef4444": "빨간색",     "#22c55e": "초록색",
    "#eab308": "노란색",    "#a855f7": "보라색",     "#ec4899": "분홍색",
    "#f97316": "주황색",    "#e2e8f0": "흰색",
  },
  "tl-PH": {
    "#3b82f6": "asul",      "#ef4444": "pula",      "#22c55e": "berde",
    "#eab308": "dilaw",     "#a855f7": "ube",       "#ec4899": "rosas",
    "#f97316": "dalandan",  "#e2e8f0": "puti",
  },
};

// ── Pill shape/type names in all languages ────────────────────────────────────
const SHAPE_NAMES: Record<string, Record<string, string>> = {
  "en-US": { tablet: "round tablet",       capsule: "capsule",       liquid: "liquid medicine"     },
  "hi-IN": { tablet: "gol goli",           capsule: "capsule",       liquid: "liquid dawa"          },
  "kn-IN": { tablet: "guḷige",             capsule: "kyāpsūl",       liquid: "drava auṣadha"        },
  "te-IN": { tablet: "mātra",              capsule: "kyāpsūl",       liquid: "drava mandu"          },
  "ta-IN": { tablet: "māttirāi",           capsule: "kēpcūl",        liquid: "tirava marundu"       },
  "ml-IN": { tablet: "guḷika",             capsule: "kāpsūl",        liquid: "drāvaka marunnu"      },
  "es-ES": { tablet: "pastilla redonda",   capsule: "cápsula",       liquid: "medicina líquida"     },
  "fr-FR": { tablet: "comprimé rond",      capsule: "gélule",        liquid: "médicament liquide"   },
  "ar-SA": { tablet: "قرص دائري",          capsule: "كبسولة",        liquid: "دواء سائل"            },
  "zh-CN": { tablet: "圆形药片",            capsule: "胶囊",           liquid: "液体药物"              },
  "pt-BR": { tablet: "comprimido redondo", capsule: "cápsula",       liquid: "medicamento líquido"  },
  "ja-JP": { tablet: "丸い錠剤",            capsule: "カプセル",       liquid: "液体薬"               },
  "ko-KR": { tablet: "원형 정제",           capsule: "캡슐",           liquid: "액체 약"              },
  "tl-PH": { tablet: "bilog na tableta",   capsule: "kapsula",       liquid: "likidong gamot"       },
};

/**
 * Builds a natural, slang-rich medication reminder announcement
 * in the given language for the given member.
 */
export function buildAnnouncement(
  langCode: string,
  med: Medication,
  memberName: string
): string {
  const clr  = (COLOR_NAMES[langCode]  ?? COLOR_NAMES["en-US"])[med.pillColor]  ?? "colored";
  const shp  = (SHAPE_NAMES[langCode]  ?? SHAPE_NAMES["en-US"])[med.pillType]   ?? med.pillType;
  const name = med.name;
  const dose = med.dosage;
  const time = med.scheduledTime;

  const scripts: Record<string, string> = {
    "en-US":
      `Hey ${memberName}, buddy! It's ${time}, time to take your ${name}! ` +
      `That's ${dose}. Look for the ${clr} ${shp}. Come on, you've got this! Take care!`,

    "hi-IN":
      `Sunno ${memberName} ji, beta! ${time} baj gaye, ${name} lene ka waqt ho gaya! ` +
      `${dose} lena hai. ${clr} ${shp} dhundho. Jaldi lo, apna khayal rakhena!`,

    "kn-IN":
      `${memberName} ayya, ${time} āytu! ${name} tagonḍi! ` +
      `${dose} tagonḍi. ${clr} ${shp} nōḍi. Ārogyavāgiri, jagrateya iṛi!`,

    "te-IN":
      `${memberName} babu, ${time} ayindi! ${name} tīsukoṇḍi! ` +
      `${dose} vēsukōṇḍi. ${clr} ${shp} cūḍaṇḍi. Jāgrattagā uṇḍaṇḍi!`,

    "ta-IN":
      `${memberName}, ${time} ācci! ${name} sāppiḍuṅka! ` +
      `${dose} sāppiḍaṇum. ${clr} ${shp} eḍuṅka. Nalamāy iruṅka!`,

    "ml-IN":
      `${memberName}, ${time} āyi! ${name} kaṭikkū! ` +
      `${dose} kaṭiккaṇam. ${clr} ${shp} nōkkū. Ārogyattōṭe irikkū!`,

    "es-ES":
      `¡Oye ${memberName}, campeón! Son las ${time}, ¡hora de tomar tu ${name}! ` +
      `Son ${dose}. Busca la ${shp} ${clr}. ¡Vamos, tú puedes! ¡Cuídate mucho!`,

    "fr-FR":
      `Hé ${memberName}, mon ami! Il est ${time}, c'est l'heure de prendre ton ${name}! ` +
      `C'est ${dose}. Cherche le ${shp} ${clr}. Allez, tu peux le faire! Prends soin de toi!`,

    "ar-SA":
      `يا ${memberName} حبيبي! الساعة ${time}، حان وقت تناول ${name}! ` +
      `إنها ${dose}. ابحث عن ${shp} ${clr}. يلا يا عزيزي، اعتنِ بصحتك!`,

    "zh-CN":
      `${memberName}宝贝，来来！现在${time}，该吃${name}啦！` +
      `吃${dose}。找那个${clr}${shp}。快点，你可以的！保重身体哦！`,

    "pt-BR":
      `Ei ${memberName}, meu bem! São ${time}, hora de tomar o ${name}! ` +
      `É ${dose}. Procure o ${shp} ${clr}. Vai lá, você consegue! Se cuida!`,

    "ja-JP":
      `${memberName}さん、ちょっとね！${time}ですよ、${name}を飲む時間です！` +
      `${dose}を飲んでください。${clr}${shp}を探してね。さあ、頑張って！お大事に！`,

    "ko-KR":
      `${memberName}아, 이봐요! ${time}이에요, ${name} 드실 시간이에요! ` +
      `${dose} 드세요. ${clr} ${shp}를 찾으세요. 자, 할 수 있어요! 건강하세요!`,

    "tl-PH":
      `Huy ${memberName}, pre! Alas ${time} na, oras na para uminom ng ${name}! ` +
      `Iyan ay ${dose}. Hanapin ang ${clr} ${shp}. Sige na, kaya mo 'yan! Ingat ka!`,
  };

  return scripts[langCode] ?? scripts["en-US"];
}

/** Speak text using the Web Speech API */
export function speakText(text: string, langCode: string): void {
  if (!("speechSynthesis" in window)) {
    console.warn("Text-to-speech not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = langCode;
    utt.rate = 0.85;
    utt.pitch = 1.05;
    utt.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang === langCode) ??
      voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
    if (match) utt.voice = match;

    window.speechSynthesis.speak(utt);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
  }
}

/** Stop any ongoing speech */
export function stopSpeaking(): void {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
