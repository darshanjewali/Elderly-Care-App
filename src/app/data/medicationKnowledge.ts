export interface MedInfo {
  names: string[];
  genericName: string;
  brandNames: string[];
  drugClass: string;
  uses: string;
  sideEffects: { common: string[]; serious: string[] };
  timing: string;
  withFood: "yes" | "no" | "either";
  warnings: string[];
  interactions: string[];
  notes: string;
  emoji: string;
}

export const MEDICATION_DB: Record<string, MedInfo> = {
  metformin: {
    names: ["metformin", "glucophage", "fortamet", "glumetza"],
    genericName: "Metformin",
    brandNames: ["Glucophage", "Fortamet", "Glumetza"],
    drugClass: "Biguanide (Diabetes)",
    uses: "Controls blood sugar levels in type 2 diabetes. It reduces glucose production in the liver and improves insulin sensitivity.",
    sideEffects: {
      common: ["Nausea", "Diarrhea", "Stomach upset", "Metallic taste in mouth", "Loss of appetite"],
      serious: ["Lactic acidosis (rare but serious — seek emergency care if muscle pain, weakness, or difficulty breathing)", "Vitamin B12 deficiency with long-term use"],
    },
    timing: "Take with meals (morning and evening) to reduce stomach upset. Do not crush extended-release tablets.",
    withFood: "yes",
    warnings: ["Do not drink excessive alcohol", "Stop before CT scan with contrast dye — inform your doctor", "Hold if sick with vomiting/diarrhea (dehydration risk)"],
    interactions: ["Alcohol (increases lactic acidosis risk)", "Contrast dyes (kidney risk)", "Some antibiotics like ciprofloxacin"],
    notes: "One of the most commonly prescribed diabetes medications. Usually taken twice daily with meals. Regular kidney function tests needed.",
    emoji: "💊",
  },

  atorvastatin: {
    names: ["atorvastatin", "lipitor", "torvast"],
    genericName: "Atorvastatin",
    brandNames: ["Lipitor"],
    drugClass: "Statin (Cholesterol)",
    uses: "Lowers LDL (bad) cholesterol and triglycerides, raises HDL (good) cholesterol. Reduces risk of heart attack and stroke.",
    sideEffects: {
      common: ["Muscle aches or weakness", "Headache", "Nausea", "Constipation or diarrhea", "Joint pain"],
      serious: ["Rhabdomyolysis (severe muscle breakdown — stop and call doctor if severe muscle pain)", "Liver damage (rare)", "Memory problems (rare)"],
    },
    timing: "Can be taken at any time of day, with or without food. Usually taken in the evening for best effect.",
    withFood: "either",
    warnings: ["Avoid grapefruit juice — it increases drug levels in blood", "Stop immediately if unexplained muscle pain/weakness", "Tell doctor about pregnancy immediately"],
    interactions: ["Grapefruit juice (increases levels)", "Warfarin (may increase bleeding risk)", "Cyclosporine", "Some antibiotics"],
    notes: "Take at the same time each day. Regular cholesterol blood tests needed. Evening dosing is often recommended.",
    emoji: "❤️",
  },

  lisinopril: {
    names: ["lisinopril", "zestril", "prinivil", "qbrelis"],
    genericName: "Lisinopril",
    brandNames: ["Zestril", "Prinivil"],
    drugClass: "ACE Inhibitor (Blood Pressure / Heart)",
    uses: "Treats high blood pressure, heart failure, and protects kidneys in diabetes. Relaxes blood vessels.",
    sideEffects: {
      common: ["Dry persistent cough (very common)", "Dizziness", "Headache", "Fatigue", "Low blood pressure on standing"],
      serious: ["Angioedema — swelling of face, lips, tongue, throat (STOP and call emergency immediately)", "High potassium levels", "Kidney problems"],
    },
    timing: "Take once daily at the same time each day, morning is preferred. Can be taken with or without food.",
    withFood: "either",
    warnings: ["Avoid potassium supplements unless doctor advises", "Stand up slowly to avoid dizziness", "Do NOT take if pregnant (can harm baby)"],
    interactions: ["Potassium supplements (dangerously high K+ risk)", "NSAIDs like ibuprofen (reduce effectiveness)", "Diuretics"],
    notes: "The dry cough is a very common side effect — up to 20% of patients get it. If bothersome, doctor may switch to an ARB like losartan.",
    emoji: "🩸",
  },

  amlodipine: {
    names: ["amlodipine", "norvasc", "katerzia"],
    genericName: "Amlodipine",
    brandNames: ["Norvasc"],
    drugClass: "Calcium Channel Blocker (Blood Pressure)",
    uses: "Treats high blood pressure and chest pain (angina). Relaxes and widens blood vessels.",
    sideEffects: {
      common: ["Ankle/foot swelling (edema)", "Flushing (warmth, redness)", "Headache", "Dizziness", "Fatigue"],
      serious: ["Very low blood pressure", "Worsening chest pain when starting (rare)", "Rapid heartbeat"],
    },
    timing: "Take once daily at the same time each day. Can be taken with or without food.",
    withFood: "either",
    warnings: ["Stand up slowly — can cause dizziness", "Avoid grapefruit juice"],
    interactions: ["Grapefruit juice", "Simvastatin (higher statin levels)", "Cyclosporine"],
    notes: "Ankle swelling affects about 10% of patients. This is due to the drug's action on blood vessels, not the heart. Elevate feet if this occurs.",
    emoji: "💓",
  },

  metoprolol: {
    names: ["metoprolol", "lopressor", "toprol", "toprol-xl"],
    genericName: "Metoprolol",
    brandNames: ["Lopressor", "Toprol-XL"],
    drugClass: "Beta Blocker (Heart / Blood Pressure)",
    uses: "Treats high blood pressure, angina, heart failure, and abnormal heart rhythms. Slows heart rate.",
    sideEffects: {
      common: ["Fatigue and tiredness", "Dizziness", "Slow heart rate (bradycardia)", "Cold hands and feet", "Depression (rare)"],
      serious: ["Very slow heart rate", "Worsening of asthma/COPD", "Masking of low blood sugar symptoms in diabetics"],
    },
    timing: "Take with or after food to reduce dizziness. Usually once or twice daily — follow your prescription label.",
    withFood: "yes",
    warnings: ["NEVER stop abruptly — must taper off to avoid rebound effects like chest pain", "Caution in asthma/COPD", "Diabetics: may mask low blood sugar symptoms"],
    interactions: ["Clonidine (dangerous if stopped together)", "Calcium channel blockers", "Diabetes medications"],
    notes: "Do NOT stop taking without doctor guidance even if you feel well. Sudden stopping can cause serious heart problems.",
    emoji: "💗",
  },

  aspirin: {
    names: ["aspirin", "ecotrin", "bayer aspirin", "bufferin"],
    genericName: "Aspirin (low-dose)",
    brandNames: ["Ecotrin", "Bayer", "Bufferin"],
    drugClass: "Antiplatelet / NSAID",
    uses: "Low-dose (81mg) prevents blood clots to reduce heart attack and stroke risk. Higher doses reduce pain and inflammation.",
    sideEffects: {
      common: ["Stomach upset", "Heartburn", "Nausea", "Minor bleeding"],
      serious: ["GI bleeding (black/tarry stools — seek care immediately)", "Ringing in ears (tinnitus) at high doses", "Allergic reaction"],
    },
    timing: "Take with food or milk to reduce stomach irritation. Usually taken in the morning.",
    withFood: "yes",
    warnings: ["Do NOT give to children under 16 (Reye's syndrome risk)", "Tell dentist/surgeon before procedures", "Avoid alcohol"],
    interactions: ["Warfarin (increases bleeding risk significantly)", "Ibuprofen (may reduce aspirin's protective effect)", "Other blood thinners"],
    notes: "Even low-dose aspirin increases bleeding risk. Many doctors now only recommend it if you've already had a heart attack or stroke.",
    emoji: "❤️‍🩹",
  },

  warfarin: {
    names: ["warfarin", "coumadin", "jantoven"],
    genericName: "Warfarin",
    brandNames: ["Coumadin", "Jantoven"],
    drugClass: "Anticoagulant (Blood Thinner)",
    uses: "Prevents and treats blood clots. Used in atrial fibrillation, after heart valve surgery, deep vein thrombosis (DVT), and pulmonary embolism.",
    sideEffects: {
      common: ["Easy bruising", "Prolonged bleeding from cuts", "Heavier menstrual periods"],
      serious: ["Serious internal bleeding (blood in urine/stool, unusual bruising — SEEK EMERGENCY CARE)", "Skin necrosis (rare)", "Purple toe syndrome (rare)"],
    },
    timing: "Take at the SAME TIME every day, usually in the evening. Never double dose if missed — contact doctor.",
    withFood: "either",
    warnings: ["Regular INR blood tests are ESSENTIAL to ensure correct dosing", "Consistent vitamin K intake — sudden increase (spinach, kale) can reduce effectiveness", "Tell ALL healthcare providers you take warfarin before ANY procedure"],
    interactions: ["Many, many drug interactions — always check with pharmacist before starting ANY new medication", "Aspirin/NSAIDs (greatly increased bleeding)", "Vitamin K (green leafy vegetables)"],
    notes: "Warfarin has the most drug and food interactions of any common medication. ALWAYS carry a warfarin card. Requires regular blood monitoring (INR test).",
    emoji: "🩸",
  },

  omeprazole: {
    names: ["omeprazole", "prilosec", "losec"],
    genericName: "Omeprazole",
    brandNames: ["Prilosec", "Losec"],
    drugClass: "Proton Pump Inhibitor (Stomach Acid)",
    uses: "Reduces stomach acid production. Treats heartburn, GERD, stomach ulcers, and protects stomach from NSAIDs.",
    sideEffects: {
      common: ["Headache", "Nausea", "Diarrhea", "Stomach pain", "Gas/flatulence"],
      serious: ["Low magnesium (long-term use — causes muscle spasms, irregular heartbeat)", "C. difficile infection", "Bone fracture risk with prolonged use", "Vitamin B12 deficiency"],
    },
    timing: "Take 30-60 MINUTES BEFORE a meal (breakfast is most common). This is crucial for full effectiveness.",
    withFood: "no",
    warnings: ["Long-term use beyond 8 weeks should be discussed with doctor", "May reduce absorption of some medications like clopidogrel", "Avoid if taking clopidogrel unless doctor specifically prescribes both"],
    interactions: ["Clopidogrel (reduces its effectiveness)", "Methotrexate", "Some antifungals"],
    notes: "Must be taken BEFORE meals for best effect. Not for immediate heartburn relief — antacids work faster for that. Long-term use needs doctor supervision.",
    emoji: "🔶",
  },

  losartan: {
    names: ["losartan", "cozaar", "hyzaar"],
    genericName: "Losartan",
    brandNames: ["Cozaar", "Hyzaar"],
    drugClass: "ARB (Blood Pressure / Kidney Protection)",
    uses: "Treats high blood pressure and protects kidneys in type 2 diabetes. Also used for heart failure.",
    sideEffects: {
      common: ["Dizziness", "Fatigue", "Low blood pressure on standing", "Back pain", "Upper respiratory symptoms"],
      serious: ["High potassium levels", "Kidney function changes", "Angioedema (rare — swelling of face/tongue, stop immediately)"],
    },
    timing: "Take once daily, with or without food. Take at the same time each day.",
    withFood: "either",
    warnings: ["Do NOT take if pregnant", "Avoid potassium supplements", "Stand up slowly"],
    interactions: ["Potassium supplements", "NSAIDs", "Lithium"],
    notes: "Often used as an alternative to ACE inhibitors (lisinopril) when patients develop a dry cough.",
    emoji: "💙",
  },

  levothyroxine: {
    names: ["levothyroxine", "synthroid", "levoxyl", "tirosint"],
    genericName: "Levothyroxine",
    brandNames: ["Synthroid", "Levoxyl", "Tirosint"],
    drugClass: "Thyroid Hormone",
    uses: "Replaces or supplements thyroid hormone in hypothyroidism (underactive thyroid). Treats thyroid cancer.",
    sideEffects: {
      common: ["Usually none when dose is correct", "When overdosed: increased heart rate, anxiety, insomnia, weight loss, tremors, sweating"],
      serious: ["Chest pain (overdose)", "Irregular heartbeat"],
    },
    timing: "Take on an EMPTY STOMACH, 30-60 minutes BEFORE breakfast. Consistency in timing is critical.",
    withFood: "no",
    warnings: ["Take at same time each day", "Many foods and supplements reduce absorption — wait 4 hours before calcium, iron supplements", "Coffee and high-fiber foods also reduce absorption"],
    interactions: ["Calcium supplements (take 4h apart)", "Iron supplements (take 4h apart)", "Antacids (take 4h apart)", "Coffee and high-fiber diet"],
    notes: "This is one of the most commonly missed timing guidelines. Take 30-60 minutes before any food, drink, or other medications for proper absorption.",
    emoji: "🦋",
  },

  furosemide: {
    names: ["furosemide", "lasix"],
    genericName: "Furosemide",
    brandNames: ["Lasix"],
    drugClass: "Loop Diuretic (Water Pill)",
    uses: "Removes excess fluid from the body. Treats swelling (edema) from heart failure, kidney disease, or liver disease. Also lowers blood pressure.",
    sideEffects: {
      common: ["Frequent urination (especially first few hours after dose)", "Dizziness on standing", "Low potassium (weakness, cramps, irregular heartbeat)", "Thirst", "Dehydration"],
      serious: ["Very low potassium causing heart rhythm problems", "Hearing loss at high IV doses (rare)", "Severe dehydration"],
    },
    timing: "Take in the morning to avoid nighttime urination affecting sleep. If prescribed twice daily, take morning and noon — not at night.",
    withFood: "either",
    warnings: ["Monitor potassium — may need potassium supplements", "Weigh yourself daily — sudden weight gain (2+ lbs overnight) means fluid retention, call doctor", "Stay hydrated but follow fluid restriction if ordered"],
    interactions: ["Digoxin (low K+ makes digoxin toxic)", "Lithium", "NSAIDs (reduce effectiveness)"],
    notes: "Keep a daily weight log. Wear compression stockings if legs swell. Potassium-rich foods (banana, avocado) can help maintain levels.",
    emoji: "💧",
  },

  glipizide: {
    names: ["glipizide", "glucotrol", "glyburide", "glynase", "glimepiride", "amaryl"],
    genericName: "Glipizide / Glyburide / Glimepiride",
    brandNames: ["Glucotrol", "Glynase", "Amaryl"],
    drugClass: "Sulfonylurea (Diabetes)",
    uses: "Stimulates pancreas to produce more insulin to lower blood sugar in type 2 diabetes.",
    sideEffects: {
      common: ["Low blood sugar (hypoglycemia) — most important side effect", "Weight gain", "Nausea", "Dizziness"],
      serious: ["Severe hypoglycemia (confusion, unconsciousness — give sugar immediately)", "SIADH (low sodium, rare)"],
    },
    timing: "Glipizide: Take 30 minutes BEFORE meals. Glyburide and glimepiride: Take WITH meals.",
    withFood: "yes",
    warnings: ["Never skip meals when taking this medication", "Carry glucose tablets or sweet candy for low blood sugar emergencies", "Alcohol increases low blood sugar risk"],
    interactions: ["Alcohol", "Aspirin/NSAIDs (can worsen hypoglycemia)", "Sulfa antibiotics", "Beta blockers (mask low blood sugar symptoms)"],
    notes: "Learn to recognize signs of low blood sugar: shakiness, sweating, confusion, fast heartbeat, hunger. Treat immediately with 15g fast sugar (4 glucose tablets, ½ cup juice).",
    emoji: "🩹",
  },

  paracetamol: {
    names: ["paracetamol", "acetaminophen", "tylenol", "panadol", "calpol"],
    genericName: "Paracetamol / Acetaminophen",
    brandNames: ["Tylenol", "Panadol", "Calpol"],
    drugClass: "Analgesic / Antipyretic (Pain Reliever / Fever Reducer)",
    uses: "Relieves mild to moderate pain (headache, joint pain, toothache) and reduces fever. Safe for most people when used correctly.",
    sideEffects: {
      common: ["Usually very well tolerated at standard doses", "Rare: skin reactions"],
      serious: ["Liver damage with OVERDOSE — even slightly exceeding max dose (3-4g/day) can be toxic", "Kidney damage with very long-term high doses"],
    },
    timing: "Take every 4-6 hours as needed. Maximum: 4000mg (4g) per day for healthy adults, 2000mg for elderly or those with liver issues.",
    withFood: "either",
    warnings: ["Check ALL medications for hidden paracetamol (cold & flu medicines often contain it)", "LIMIT ALCOHOL — increases liver toxicity risk significantly", "Do NOT exceed maximum daily dose"],
    interactions: ["Warfarin (high doses increase bleeding risk)", "Alcohol (serious liver damage)", "Many cold/flu medicines contain paracetamol — avoid doubling up"],
    notes: "The maximum safe dose is lower than many people realize. Always check the total dose from all sources. Alcohol + paracetamol = very dangerous combination.",
    emoji: "💊",
  },

  ibuprofen: {
    names: ["ibuprofen", "advil", "nurofen", "brufen", "motrin"],
    genericName: "Ibuprofen",
    brandNames: ["Advil", "Nurofen", "Brufen", "Motrin"],
    drugClass: "NSAID (Anti-inflammatory / Pain Reliever)",
    uses: "Relieves pain, reduces inflammation, and lowers fever. Used for arthritis, muscle pain, headaches, menstrual cramps, dental pain.",
    sideEffects: {
      common: ["Stomach upset/irritation", "Heartburn", "Nausea", "Dizziness", "Headache"],
      serious: ["GI bleeding/ulcers (especially in elderly)", "Kidney damage (especially in dehydration)", "Heart attack/stroke risk with high doses or long-term use", "Elevated blood pressure"],
    },
    timing: "Always take WITH food or milk to protect the stomach. Take the lowest effective dose for the shortest time needed.",
    withFood: "yes",
    warnings: ["ELDERLY patients have highest risk of GI bleeding from NSAIDs", "Avoid if kidney disease, heart failure, or taking blood thinners", "Avoid in last trimester of pregnancy", "Limit use to 3-5 days unless directed by doctor"],
    interactions: ["Aspirin (increased bleeding, reduces aspirin's heart-protective effect)", "Warfarin (increased bleeding risk)", "ACE inhibitors/ARBs (reduce effectiveness)", "Diuretics", "Lithium"],
    notes: "For elderly patients, paracetamol/acetaminophen is often safer for routine pain. NSAIDs carry significant risks in older adults, especially kidney and GI complications.",
    emoji: "🟠",
  },

  gabapentin: {
    names: ["gabapentin", "neurontin", "gralise", "horizant"],
    genericName: "Gabapentin",
    brandNames: ["Neurontin", "Gralise"],
    drugClass: "Anticonvulsant / Nerve Pain",
    uses: "Treats nerve pain (neuropathy), epilepsy, restless leg syndrome. Also used off-label for anxiety and fibromyalgia.",
    sideEffects: {
      common: ["Dizziness (very common)", "Drowsiness/sedation (very common)", "Coordination problems", "Blurred vision", "Weight gain", "Swelling in hands/feet"],
      serious: ["Severe dizziness leading to falls (major concern in elderly)", "Respiratory depression when combined with opioids", "Suicidal thoughts (rare)"],
    },
    timing: "Usually taken 3 times daily. Take at evenly spaced times. Can be taken with or without food. Do not crush capsules.",
    withFood: "either",
    warnings: ["HIGH FALL RISK in elderly — dizziness is very common", "Avoid alcohol — greatly increases drowsiness", "Do not stop suddenly — taper off under doctor guidance", "Affects driving ability"],
    interactions: ["Opioids (dangerous respiratory depression)", "Alcohol (increased sedation)", "Antacids (reduce absorption — take 2 hours apart)", "Other CNS depressants"],
    notes: "The dizziness and sedation are usually worst when starting and may improve over time. Elderly patients should be especially careful about falls.",
    emoji: "🧠",
  },

  sertraline: {
    names: ["sertraline", "zoloft", "lustral"],
    genericName: "Sertraline",
    brandNames: ["Zoloft", "Lustral"],
    drugClass: "SSRI Antidepressant",
    uses: "Treats depression, anxiety disorders, OCD, PTSD, and panic disorder. Takes 2-6 weeks to show full benefit.",
    sideEffects: {
      common: ["Nausea (common at start)", "Headache", "Diarrhea/loose stools", "Insomnia or drowsiness", "Dry mouth", "Decreased libido"],
      serious: ["Serotonin syndrome (rare — fever, agitation, rapid heartbeat, coordination problems — STOP and seek care)", "Suicidal thoughts (especially in under-25, monitor closely)", "Bleeding risk"],
    },
    timing: "Take once daily, morning or evening — whichever causes less nausea. Take with food if stomach upset occurs.",
    withFood: "either",
    warnings: ["Takes 2-6 weeks to work fully — do not stop prematurely", "NEVER stop abruptly — discontinuation syndrome (dizziness, flu-like symptoms)", "Tell doctor about all medications — many interactions"],
    interactions: ["MAOIs (DANGEROUS combination — potentially fatal)", "Other antidepressants", "Tramadol and triptans (serotonin syndrome)", "Blood thinners", "Tamoxifen"],
    notes: "Common to feel worse before better in the first 1-2 weeks. Initial nausea usually improves. Patience is important — full effect takes 4-6 weeks.",
    emoji: "🌤️",
  },

  donepezil: {
    names: ["donepezil", "aricept"],
    genericName: "Donepezil",
    brandNames: ["Aricept"],
    drugClass: "Cholinesterase Inhibitor (Alzheimer's / Dementia)",
    uses: "Slows the decline of memory and thinking in Alzheimer's disease and dementia. Does not cure or stop progression but improves quality of life.",
    sideEffects: {
      common: ["Nausea and vomiting (especially at higher doses)", "Diarrhea", "Insomnia", "Fatigue", "Muscle cramps", "Vivid dreams/nightmares"],
      serious: ["Slowed heart rate (bradycardia)", "Fainting", "Stomach bleeding (rare)", "Seizures (rare)"],
    },
    timing: "Take once daily at BEDTIME to reduce side effects like nausea. Take with water.",
    withFood: "either",
    warnings: ["Take at bedtime — reduces nausea and vivid dreams are less disruptive", "Do not use with certain anesthetics — tell surgeon before any procedure", "Used for mild-to-severe Alzheimer's"],
    interactions: ["NSAIDs (GI bleeding risk)", "Certain antibiotics (erythromycin)", "Ketoconazole", "Quinidine"],
    notes: "Results are gradual and may be subtle. Family members often notice the benefit more than the patient. Regular cognitive assessments help track effectiveness.",
    emoji: "🧩",
  },

  alendronate: {
    names: ["alendronate", "fosamax", "binosto"],
    genericName: "Alendronate",
    brandNames: ["Fosamax", "Binosto"],
    drugClass: "Bisphosphonate (Osteoporosis)",
    uses: "Treats and prevents osteoporosis in postmenopausal women and in men. Reduces fracture risk.",
    sideEffects: {
      common: ["Stomach pain", "Heartburn", "Nausea", "Constipation or diarrhea"],
      serious: ["Esophageal irritation/ulcers (if not taken correctly)", "Jaw bone problems (osteonecrosis of jaw — rare)", "Thigh bone fractures with very long-term use (rare)", "Low calcium in blood"],
    },
    timing: "Take ONCE WEEKLY on the same day each week. Take FIRST THING IN THE MORNING on an empty stomach. Use a full glass of plain water ONLY. Stay UPRIGHT for at least 30 minutes and do not eat for 30 minutes.",
    withFood: "no",
    warnings: ["MUST stay upright (sitting or standing) for 30 minutes after taking — PREVENTS ESOPHAGEAL DAMAGE", "Do not take with other medications, food, coffee, juice — ONLY plain water", "Tell dentist you take this before any dental work"],
    interactions: ["Calcium supplements (take 2+ hours apart)", "Antacids (reduce absorption)", "Aspirin/NSAIDs (increased GI risk)"],
    notes: "The specific taking instructions are critical and unusual. If you forget to take it on the scheduled day, take it the next morning then resume your regular weekly schedule.",
    emoji: "🦴",
  },

  prednisone: {
    names: ["prednisone", "deltasone", "prednisolone", "budesonide"],
    genericName: "Prednisone / Prednisolone",
    brandNames: ["Deltasone", "Omnipred"],
    drugClass: "Corticosteroid (Anti-inflammatory)",
    uses: "Powerful anti-inflammatory used for allergic reactions, asthma, arthritis, inflammatory bowel disease, autoimmune conditions, and cancer treatment.",
    sideEffects: {
      common: ["Increased appetite and weight gain", "Mood changes (anxiety, irritability, euphoria)", "Insomnia", "Increased blood sugar", "Fluid retention/swelling"],
      serious: ["Adrenal insufficiency if stopped suddenly (MUST taper off)", "Bone loss (osteoporosis) with long-term use", "Increased infection risk (immunosuppression)", "Cataracts and glaucoma with long-term use", "Stomach ulcers"],
    },
    timing: "Take in the MORNING to minimize sleep disturbance. Take WITH food or milk to protect the stomach. Never stop abruptly — always taper with doctor guidance.",
    withFood: "yes",
    warnings: ["NEVER stop suddenly after prolonged use — must taper to avoid adrenal crisis", "Increased risk of infections — avoid contact with sick people", "Monitor blood sugar (increases levels)", "Take calcium and vitamin D supplements if on long-term therapy"],
    interactions: ["NSAIDs (increased GI bleeding)", "Live vaccines (avoid)", "Diabetes medications (dose adjustment needed)", "Warfarin (variable effects)"],
    notes: "Even a short course requires a tapering schedule if taken for more than 2 weeks. Wear a medical alert bracelet if on long-term steroids.",
    emoji: "⚡",
  },

  hydrochlorothiazide: {
    names: ["hydrochlorothiazide", "hctz", "microzide", "hydrodiuril"],
    genericName: "Hydrochlorothiazide (HCTZ)",
    brandNames: ["Microzide", "HydroDIURIL"],
    drugClass: "Thiazide Diuretic (Blood Pressure / Water Pill)",
    uses: "Treats high blood pressure and edema. Also used for kidney stones and some forms of diabetes insipidus.",
    sideEffects: {
      common: ["Frequent urination", "Low potassium (weakness, cramps)", "Low sodium", "Dizziness", "Increased blood sugar in diabetics"],
      serious: ["Severe low potassium causing heart rhythm problems", "Gout attacks (increases uric acid)", "Severe skin reactions (rare)"],
    },
    timing: "Take in the morning to avoid nighttime urination. Can be taken with or without food.",
    withFood: "either",
    warnings: ["Monitor potassium — eat potassium-rich foods or take supplements as directed", "Increases sensitivity to sunlight (use sunscreen)", "May worsen diabetes control"],
    interactions: ["Digoxin (low K+ increases toxicity)", "Lithium", "NSAIDs (reduce effectiveness)"],
    notes: "Often combined with other blood pressure medications. Called HCTZ for short. Usually once daily in the morning.",
    emoji: "💧",
  },

  clopidogrel: {
    names: ["clopidogrel", "plavix"],
    genericName: "Clopidogrel",
    brandNames: ["Plavix"],
    drugClass: "Antiplatelet (Blood Thinner)",
    uses: "Prevents blood clots in arteries. Used after heart attack, stroke, or stent placement to prevent recurrence.",
    sideEffects: {
      common: ["Bleeding (cuts take longer to stop)", "Easy bruising", "Stomach pain", "Nausea"],
      serious: ["Serious internal bleeding (blood in stool, coughing blood — EMERGENCY)", "TTP (rare but life-threatening blood disorder)"],
    },
    timing: "Take once daily, with or without food. Same time each day.",
    withFood: "either",
    warnings: ["Do NOT stop without doctor consultation — especially if you have a stent (life-threatening clot risk)", "Tell ALL doctors and dentists you take clopidogrel before any procedure", "Avoid omeprazole/esomeprazole — reduces effectiveness"],
    interactions: ["Omeprazole/Esomeprazole (significantly reduces effectiveness)", "Aspirin (commonly prescribed together but increases bleeding)", "NSAIDs", "Warfarin"],
    notes: "If you have a coronary stent, stopping clopidogrel early can cause a fatal stent clot. NEVER stop without cardiologist approval.",
    emoji: "🔴",
  },

  digoxin: {
    names: ["digoxin", "lanoxin"],
    genericName: "Digoxin",
    brandNames: ["Lanoxin"],
    drugClass: "Cardiac Glycoside (Heart Failure / Atrial Fibrillation)",
    uses: "Slows and strengthens the heartbeat. Used in heart failure and atrial fibrillation.",
    sideEffects: {
      common: ["Nausea and vomiting", "Loss of appetite", "Dizziness", "Headache", "Visual disturbances (yellow/green halos around lights — early toxicity sign)"],
      serious: ["Digoxin toxicity — dangerous heart rhythms, nausea, visual changes (narrow window between therapeutic and toxic dose)", "Toxicity worsened by LOW POTASSIUM"],
    },
    timing: "Take at the same time each day. Can be taken with or without food.",
    withFood: "either",
    warnings: ["NARROW THERAPEUTIC WINDOW — easy to accumulate to toxic levels", "Low potassium (from diuretics) greatly increases toxicity risk", "Check pulse before taking — if below 60 bpm, contact doctor", "Regular blood level monitoring required"],
    interactions: ["Diuretics (low K+ causes toxicity)", "Amiodarone (increases digoxin levels)", "Antibiotics like erythromycin (increase absorption)", "Antacids (reduce absorption)", "Many other interactions"],
    notes: "Yellow/green vision halos around lights is a classic early sign of toxicity — contact doctor immediately. ALWAYS take your pulse before each dose.",
    emoji: "💚",
  },

  ramipril: {
    names: ["ramipril", "altace"],
    genericName: "Ramipril",
    brandNames: ["Altace"],
    drugClass: "ACE Inhibitor (Blood Pressure / Heart)",
    uses: "Treats high blood pressure and heart failure. Protects heart after heart attack. Reduces risk of cardiovascular events in high-risk patients.",
    sideEffects: {
      common: ["Dry persistent cough (very common, like lisinopril)", "Dizziness", "Headache", "Fatigue"],
      serious: ["Angioedema (swelling of face/lips/tongue — STOP and call emergency immediately)", "High potassium levels", "Kidney changes"],
    },
    timing: "Take once daily. Can be taken with or without food. Take at the same time each day.",
    withFood: "either",
    warnings: ["Do NOT take if pregnant", "Avoid potassium supplements unless directed", "Stand up slowly"],
    interactions: ["Potassium supplements", "NSAIDs", "Diuretics"],
    notes: "Same drug class as lisinopril. Dry cough affects up to 15% of patients. If troublesome, doctor may switch to losartan or valsartan.",
    emoji: "💙",
  },

  simvastatin: {
    names: ["simvastatin", "zocor"],
    genericName: "Simvastatin",
    brandNames: ["Zocor"],
    drugClass: "Statin (Cholesterol)",
    uses: "Lowers LDL cholesterol and reduces risk of heart attack and stroke.",
    sideEffects: {
      common: ["Muscle aches", "Headache", "Nausea", "Constipation"],
      serious: ["Rhabdomyolysis (severe muscle breakdown — STOP if severe muscle pain, weakness, or dark urine)"],
    },
    timing: "Take in the EVENING (best time — cholesterol production highest at night). Can be taken with or without food.",
    withFood: "either",
    warnings: ["AVOID grapefruit juice — MUCH stronger interaction than other statins (can cause dangerous muscle toxicity)", "Cannot use doses above 40mg if taking amlodipine due to interaction"],
    interactions: ["Grapefruit juice (MAJOR — avoid completely)", "Amlodipine (limits dose)", "Amiodarone", "Verapamil", "Many antibiotics", "Warfarin"],
    notes: "Unlike atorvastatin, simvastatin has much stricter grapefruit restrictions and more drug interactions. Evening dosing is important for best effect.",
    emoji: "❤️",
  },

  cetirizine: {
    names: ["cetirizine", "zyrtec", "reactine", "levocetirizine", "xyzal", "loratadine", "claritin"],
    genericName: "Cetirizine / Loratadine",
    brandNames: ["Zyrtec", "Reactine", "Claritin"],
    drugClass: "Antihistamine (Allergy)",
    uses: "Relieves allergy symptoms: runny nose, sneezing, itchy eyes, hives, and itching.",
    sideEffects: {
      common: ["Drowsiness (cetirizine more than loratadine)", "Dry mouth", "Headache", "Fatigue"],
      serious: ["Urinary retention in men with prostate enlargement", "Very rare: palpitations"],
    },
    timing: "Take once daily. For cetirizine — evening may be better due to drowsiness. Loratadine can be taken in the morning.",
    withFood: "either",
    warnings: ["Elderly are more sensitive to drowsiness and dizziness — risk of falls", "Avoid alcohol (increases drowsiness)", "Caution if driving"],
    interactions: ["Alcohol", "Other sedating medications"],
    notes: "Loratadine tends to cause less drowsiness than cetirizine and is often preferred for daytime use in elderly patients.",
    emoji: "🌸",
  },

  tamsulosin: {
    names: ["tamsulosin", "flomax"],
    genericName: "Tamsulosin",
    brandNames: ["Flomax"],
    drugClass: "Alpha Blocker (Prostate / Urinary)",
    uses: "Relaxes muscles in the prostate and bladder neck to improve urine flow in benign prostatic hyperplasia (BPH). Also used for kidney stones.",
    sideEffects: {
      common: ["Dizziness (MAJOR concern — especially after first dose)", "Retrograde ejaculation (semen goes backward)", "Nasal congestion", "Headache"],
      serious: ["Severe low blood pressure on standing (first-dose effect) — fall risk", "Intraoperative floppy iris syndrome (tell eye surgeon before cataract surgery)"],
    },
    timing: "Take 30 minutes AFTER the same meal each day (helps reduce dizziness). Start at lower dose and increase.",
    withFood: "yes",
    warnings: ["TELL EYE SURGEON before any cataract surgery — can cause complications even if you've stopped taking it", "Stand up very slowly", "HIGH FALL RISK in elderly men"],
    interactions: ["Other blood pressure medications (additive low BP effect)", "PDE5 inhibitors like sildenafil (Viagra) — very low blood pressure"],
    notes: "The floppy iris warning is critical — always inform your ophthalmologist or eye surgeon about tamsulosin even if you stopped it months ago.",
    emoji: "🔵",
  },
};

// General health topics database
export interface HealthTopicInfo {
  title: string;
  response: string;
  keywords: string[];
}

export const HEALTH_TOPICS: HealthTopicInfo[] = [
  {
    title: "Blood Sugar Levels",
    keywords: ["blood sugar", "glucose", "diabetes", "sugar level", "hyperglycemia", "hypoglycemia", "low sugar", "high sugar"],
    response: `**Normal Blood Sugar Ranges (Fasting):**
• Normal: 70–99 mg/dL
• Pre-diabetes: 100–125 mg/dL
• Diabetes: 126 mg/dL or above

**After Meals (2 hours post-meal):**
• Normal: below 140 mg/dL
• Pre-diabetes: 140–199 mg/dL

**Danger Signs — Call Doctor:**
• High: above 240 mg/dL with symptoms
• Low (Hypoglycemia): below 70 mg/dL — shakiness, sweating, confusion

**For Hypoglycemia:** Take 15g of fast sugar immediately (4 glucose tablets, ½ cup juice, 3-4 hard candies). Recheck in 15 minutes.`,
  },
  {
    title: "Blood Pressure Levels",
    keywords: ["blood pressure", "hypertension", "bp", "systolic", "diastolic", "high blood pressure", "low blood pressure"],
    response: `**Blood Pressure Categories:**
• Normal: Below 120/80 mmHg ✅
• Elevated: 120-129 / below 80
• Stage 1 Hypertension: 130-139 / 80-89
• Stage 2 Hypertension: 140+ / 90+
• Hypertensive Crisis: 180+/120+ (CALL 911)

**Tips to Lower Blood Pressure:**
• Reduce salt intake
• Exercise regularly (30 min/day)
• Lose excess weight
• Limit alcohol
• Manage stress
• Take medications as prescribed — never skip`,
  },
  {
    title: "Missed Dose",
    keywords: ["missed", "forgot", "miss dose", "missed dose", "skip dose", "forgot to take"],
    response: `**If You Miss a Dose:**

• **If close to next dose time:** Skip the missed dose and take the next one at the regular time
• **If not close to next dose:** Take it as soon as you remember
• **NEVER double up:** Do not take two doses to make up for one missed

**Important exceptions — CALL YOUR DOCTOR if you miss:**
• Warfarin (blood thinner)
• Heart medications (digoxin, antiarrhythmics)
• Epilepsy medications
• HIV medications

For any uncertainty, call your pharmacist or doctor — they can advise based on your specific medication.`,
  },
  {
    title: "Drug Interactions",
    keywords: ["interaction", "mix", "combine", "safe to take together", "can i take", "together"],
    response: `**Common Dangerous Combinations:**
• Warfarin + Aspirin/NSAIDs = Major bleeding risk
• Statins + Grapefruit juice = Muscle toxicity risk
• Blood pressure meds + NSAIDs = Reduced BP control
• Digoxin + Diuretics = Toxicity risk
• Clopidogrel + Omeprazole = Reduced clot protection

**Always check with your pharmacist before starting:**
• Any new prescription medication
• Over-the-counter medicines (aspirin, ibuprofen, antacids)
• Herbal supplements (St. John's Wort is a major offender)
• Vitamins and minerals

Your pharmacist is the best resource for interaction checking.`,
  },
  {
    title: "Medicine Storage",
    keywords: ["store", "storage", "refrigerate", "keep", "temperature", "fridge"],
    response: `**General Medication Storage:**
• Store in a cool, dry place (not bathroom — humidity degrades medications)
• Keep away from direct sunlight
• Room temperature: 15–25°C (59–77°F) is ideal for most medications

**Refrigerated Medications:**
• Some insulin types require refrigeration (2–8°C)
• Some liquid antibiotics
• Eye drops (some)
• Always check the label

**Important:**
• Keep all medications out of children's reach
• Check expiry dates regularly
• Dispose of expired medications safely — many pharmacies accept them`,
  },
  {
    title: "Grapefruit Interactions",
    keywords: ["grapefruit", "citrus", "fruit juice"],
    response: `**Grapefruit Warning:**
Grapefruit and grapefruit juice can dangerously increase the levels of many medications in your blood by blocking a key enzyme that breaks them down.

**Medications affected — AVOID grapefruit:**
• Statins: Simvastatin (MAJOR), atorvastatin (moderate)
• Amlodipine (blood pressure)
• Cyclosporine
• Some antibiotics
• Some heart rhythm medications

**Important:** This interaction can last for **24 hours** after drinking grapefruit juice. Even "a little" can be problematic.

Ask your pharmacist if any of your medications interact with grapefruit.`,
  },
  {
    title: "Side Effects Management",
    keywords: ["side effect", "side effects", "reaction", "adverse", "nausea", "dizziness", "headache from"],
    response: `**Managing Common Side Effects:**

**Nausea/Stomach Upset:**
• Take medication with food or milk (unless instructed otherwise)
• Take at bedtime if possible
• Eat small, frequent meals
• Ginger tea can help

**Dizziness:**
• Stand up slowly from sitting/lying
• Hold onto something when getting up
• Stay hydrated
• Report to doctor if severe

**Dry Mouth:**
• Sip water frequently
• Sugar-free gum or lozenges
• Avoid caffeine and alcohol

**When to contact your doctor:**
• Difficulty breathing
• Swelling of face/throat
• Severe rash
• Unusual bleeding
• Symptoms that interfere with daily life`,
  },
  {
    title: "Steps and Exercise",
    keywords: ["steps", "exercise", "walking", "activity", "fitness", "physical activity"],
    response: `**Daily Steps Goals for Elderly Adults:**
• Sedentary: less than 5,000 steps/day
• Low active: 5,000–7,499 steps
• Somewhat active: 7,500–9,999 steps
• Active: 10,000+ steps

**Benefits of Regular Walking:**
• Reduces blood pressure naturally
• Improves blood sugar control
• Strengthens bones (reduces osteoporosis risk)
• Improves mood and reduces depression risk
• Reduces fall risk by improving balance

**Tips:**
• Start slowly and build up gradually
• Walk after meals to help control blood sugar
• Use supportive footwear
• Bring someone along or use a walking aid if needed
• Even 10-minute walks count!`,
  },
  {
    title: "Vitamins and Supplements",
    keywords: ["vitamin", "supplement", "calcium", "vitamin d", "b12", "omega", "fish oil"],
    response: `**Important Supplements for Elderly Patients:**

**Vitamin D + Calcium:**
• Crucial for bone health and fall prevention
• Many elderly are deficient
• Vitamin D3: 800-2000 IU/day with calcium
• Note: If taking levothyroxine, take calcium 4+ hours apart

**Vitamin B12:**
• Metformin depletes B12 over time
• Deficiency causes fatigue, nerve problems, memory issues
• Get blood levels checked annually if on metformin

**Omega-3 / Fish Oil:**
• Can reduce triglycerides
• May interact with blood thinners — tell your doctor

**Always tell your doctor about any supplements** — many interact with medications.`,
  },
];

export function findMedicationInfo(query: string): MedInfo | null {
  const q = query.toLowerCase().trim();
  for (const [, info] of Object.entries(MEDICATION_DB)) {
    for (const name of info.names) {
      if (q.includes(name.toLowerCase()) || name.toLowerCase().includes(q)) {
        return info;
      }
    }
  }
  return null;
}

export function findHealthTopic(query: string): HealthTopicInfo | null {
  const q = query.toLowerCase().trim();
  let bestMatch: HealthTopicInfo | null = null;
  let bestScore = 0;
  for (const topic of HEALTH_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = topic;
    }
  }
  return bestScore > 0 ? bestMatch : null;
}
