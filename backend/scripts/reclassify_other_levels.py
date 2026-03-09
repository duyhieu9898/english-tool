#!/usr/bin/env python3
"""
reclassify_other_levels.py  (v2)

Reclassifies A2, B1, B2, C1 vocabulary so every category has 5–30 words.
Strategy:
  1. Assign big/uncategorised buckets to a taxonomy-based category.
  2. For words that still don't match taxonomy, use word-class-based fallback buckets.
  3. Merge tiny (<5) categories into nearest related category.
  4. Split still-oversized (>30) categories using the taxonomy lookup to create
     meaningful sub-categories.
  5. Any remaining oversized category is force-split alphabetically into ≤30-word chunks.

No words are ever deleted.
"""

import json, os, math, sys
from collections import defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from flat_utils import load_flat, flat_to_nested, replace_level, save_flat

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLASSIFIED = os.path.join(SCRIPT_DIR, '..', 'oxford_classified.json')

# ─────────────────────────────────────────────────────────────────────────────
# TAXONOMY  — ordered most-specific first.
# Word matched to FIRST entry whose set contains it (lowercase).
# ─────────────────────────────────────────────────────────────────────────────
TAXONOMY = [

    ("Politics & Government", {
        "vote","election","parliament","congress","senate","minister","president",
        "prime minister","government","policy","political","politician","democracy",
        "constitution","referendum","campaign","candidate","legislation","authority",
        "federal","treaty","diplomat","embassy","sovereignty","revolution","protest",
        "reform","conservative","liberal","ideology","opposition","party","citizen",
        "citizenship","immigration","refugee","asylum","rights","propaganda",
        "censorship","corruption","scandal","debate","negotiate","sanction",
        "democracy","dictatorship","monarchy","republic","empire","colony",
        "military","troop","defence","security","intelligence","spy","rule","govern",
        "reign","overthrow","impose","abolish","appoint","resign","elect",
        "bureaucracy","committee","cabinet","council","mayor","governor","parliament",
    }),

    ("Law & Crime", {
        "law","legal","illegal","crime","criminal","arrest","prison","jail",
        "police","judge","jury","lawyer","court","trial","sentence","guilty",
        "innocent","victim","witness","evidence","verdict","offence","offense",
        "robbery","theft","murder","assault","fraud","drug","corrupt","fine",
        "penalty","punish","punishment","prosecute","defend","sue","ban","permit",
        "constable","detective","investigation","suspect","bail","custody",
        "confess","conviction","acquit","appeal","parole","probation","justice",
        "regulation","convict","accused","offender","inmate","custody",
    }),

    ("Environment & Climate", {
        "environment","climate","global warming","pollution","carbon","emission",
        "fossil","renewable","solar","wind","recycle","waste","plastic","ecosystem",
        "biodiversity","species","endangered","habitat","rainforest","deforestation",
        "flood","drought","earthquake","hurricane","volcano","tsunami","storm",
        "temperature","atmosphere","greenhouse","ozone","sustainable","conservation",
        "ecology","nature","planet","earth","ocean","sea","river","lake","mountain",
        "forest","desert","ice","glacier","natural disaster","soil","land","air",
        "toxic","chemical","acid","damage","destroy","protect","preserve","threat",
        "extinction","agriculture","farm","landscape","terrain","geology","rock",
        "mineral","energy","electricity","nuclear","gas","oil","fuel","coal",
        "petroleum","mine","drill","extract","weather","rain","snow","cloud","wind",
    }),

    ("Health & Medicine", {
        "health","medicine","doctor","nurse","hospital","patient","treatment",
        "disease","illness","sick","pain","symptom","diagnose","cure","prescription",
        "drug","pill","surgery","operation","therapy","vaccine","infection",
        "virus","bacteria","cancer","heart","brain","blood","organ","wound",
        "injury","recover","chronic","mental","diet","nutrition","vitamin","exercise",
        "physical","weight","obesity","diabetes","cholesterol","blood pressure",
        "ambulance","emergency","dental","vision","hearing","allergy","immune",
        "pregnant","birth","death","die","dead","alive","healthy","unhealthy",
        "prevention","hygiene","clinic","pharmacy","antibiotic","epidemic","pandemic",
        "fever","cough","cold","flu","asthma","arthritis","disability",
        "blind","deaf","wheelchair","elderly","ageing","aging","bone","muscle",
        "nerve","breathe","breath","heal","harm","addict","addiction","alcohol",
        "tobacco","smoke","cigarette","lung","kidney","liver","stomach",
        "pulse","digest","poison","overdose","bleed","burn","bruise","fracture",
        "anatomy","biology","cell","genetics","DNA","gene","hereditary","syndrome",
        "disorder","condition","chronic","acute","terminal","diagnose",
    }),

    ("Science & Technology", {
        "science","scientific","research","experiment","laboratory","theory",
        "hypothesis","analysis","data","result","discovery","invention","innovation",
        "technology","digital","computer","software","hardware","internet","network",
        "website","application","system","device","machine","engine","robot",
        "artificial intelligence","algorithm","program","code","programming",
        "database","smartphone","tablet","laptop","electric","electronic","circuit",
        "signal","wireless","satellite","telescope","microscope","chemistry",
        "physics","biology","mathematics","formula","equation","calculation",
        "measurement","mass","force","gravity","energy","radiation","particle",
        "atom","molecule","cell","evolution","organism","bacteria","virus",
        "neuroscience","space","planet","star","galaxy","rocket","astronaut",
        "orbit","vacuum","quantum","laser","engineering","mechanical","nuclear",
        "automation","manufacture","industrial","test","probability","model",
        "simulation","virtual","sensor","radar","computing","processor","chip",
        "digital","analogue","binary","data","file","server","cloud","software",
        "hardware","internet","browser","download","upload","update","install",
        "debug","encrypt","secure","hack","cyber","artificial","machine learning",
        "mathematical","statistical","logical","scientific","empirical",
    }),

    ("Economics & Business", {
        "economy","economics","business","company","corporation","market","trade",
        "export","import","product","service","supply","demand","price","cost",
        "profit","revenue","income","salary","wage","tax","investment","capital",
        "bank","finance","financial","money","currency","exchange","interest",
        "mortgage","loan","debt","credit","budget","inflation","growth","recession",
        "unemployment","industry","manufacture","production","enterprise","startup",
        "entrepreneur","management","manager","employee","employer","worker",
        "staff","hire","fire","contract","paycheck","bonus","benefit","pension",
        "insurance","account","asset","property","real estate","share","stock",
        "bond","dividend","merger","acquisition","bankruptcy","retail","wholesale",
        "brand","marketing","advertisement","consumer","customer","competition",
        "monopoly","distribution","logistics","supply chain","globalisation",
        "commerce","merchant","purchase","sale","discount","promote","strategy",
        "quarterly","accounting","invoice","receipt","expense","payroll","audit",
        "economic","commercial","industrial","corporate","multinational",
    }),

    ("Education & Learning", {
        "education","school","university","college","student","teacher","professor",
        "lecture","lesson","class","course","subject","curriculum","degree",
        "diploma","certificate","graduate","undergraduate","postgraduate","exam",
        "test","assignment","homework","essay","research","study","learn","teach",
        "knowledge","skill","academic","scholarship","tuition","campus","library",
        "textbook","notebook","kindergarten","primary","secondary","tutor","mentor",
        "coach","educate","enrol","enroll","apply","admission","publish","cite",
        "revision","presentation","seminar","workshop","conference","history",
        "geography","literature","philosophy","sociology","vocational","training",
        "internship","apprenticeship","intelligence","logical","analytical","idea",
    }),

    ("Work & Career", {
        "work","job","career","profession","occupation","employment","unemployed",
        "retire","office","workplace","colleague","boss","manager","employee",
        "staff","team","department","meeting","deadline","project","task","report",
        "presentation","conference","interview","hire","resign","dismiss","salary",
        "wage","promotion","experience","qualification","resume","cv","reference",
        "opportunity","achieve","accomplish","goal","target","performance",
        "productive","efficiency","leadership","collaborate","cooperate","organize",
        "manage","supervise","monitor","evaluate","feedback","appraisal","training",
        "professional","expert","specialist","consultant","freelance","self-employed",
        "corporate","occupation","labour","labor","workforce","employment","job",
        "role","position","title","department","sector","industry",
    }),

    ("Arts & Culture", {
        "art","artist","artwork","paint","painting","sculpture","draw","drawing",
        "sketch","gallery","museum","exhibition","photography","photographer",
        "film","movie","cinema","theatre","actor","actress","director","producer",
        "script","stage","perform","performance","audience","critic","review",
        "music","musician","song","sing","singer","band","orchestra","concert",
        "instrument","guitar","piano","violin","drums","dance","dancer","ballet",
        "opera","poetry","poet","poem","novel","author","writer","fiction",
        "literature","story","plot","character","narrative","publish","bestseller",
        "culture","cultural","tradition","heritage","folklore","myth","legend",
        "festival","ceremony","ritual","costume","craft","design","architecture",
        "architect","structure","statue","monument","collection","exhibit","ancient",
        "classical","modern","contemporary","abstract","creative","imagination",
        "inspiration","talent","broadcast","television","radio","media","journalist",
        "reporter","news","entertainment","celebrity","artistic","cultural",
    }),

    ("Sports & Recreation", {
        "sport","sports","football","soccer","basketball","tennis","swimming",
        "running","cycling","boxing","martial arts","gymnastics","athletics",
        "cricket","rugby","volleyball","golf","baseball","hockey","skiing",
        "snowboarding","surfing","climbing","hiking","camping","fishing",
        "team","player","coach","referee","match","game","competition","tournament",
        "championship","olympic","medal","trophy","win","lose","draw","score",
        "goal","point","league","transfer","stadium","arena","gym","track",
        "field","court","pool","pitch","equipment","uniform","jersey","boot",
        "ball","race","sprint","marathon","relay","jump","throw","catch",
        "kick","hit","tackle","defend","attack","train","practice","exercise",
        "fit","fitness","strength","agility","recreation","leisure","hobby",
        "outdoor","indoor","adventure","extreme","club","membership","fan",
        "supporter","audience","cheer","captain","squad","substitution",
        "penalty","offside","foul","athlete","champion","record","performance",
    }),

    ("Travel & Tourism", {
        "travel","trip","journey","holiday","vacation","tourism","tourist",
        "destination","flight","airline","airport","ticket","passport","visa",
        "hotel","hostel","accommodation","booking","reservation","luggage",
        "suitcase","customs","border","immigration","map","guide","itinerary",
        "sightseeing","monument","landmark","tour","cruise","adventure","explore",
        "discover","exotic","foreign","abroad","overseas","return","depart",
        "arrive","departure","arrival","delay","cancel","connection","train",
        "bus","ferry","taxi","car rental","motorway","highway","road","station",
        "terminal","platform","check-in","boarding","security","currency","tip",
        "souvenir","photograph","visiting","excursion","resort","coastline","route",
    }),

    ("Communication & Language", {
        "communicate","communication","language","speak","talk","say","tell",
        "explain","describe","discuss","argue","debate","negotiate","persuade",
        "convince","agree","disagree","opinion","view","believe","suggest",
        "recommend","mention","refer","quote","summarise","summarize","express",
        "convey","translate","interpret","message","email","text","chat","phone",
        "call","write","read","listen","hear","respond","reply","question","answer",
        "interview","speech","presentation","lecture","conversation","dialogue",
        "accent","dialect","vocabulary","grammar","pronunciation","fluent","native",
        "foreign","bilingual","multilingual","sign language","body language",
        "formal","informal","polite","rude","tone","voice","silence","noise",
        "media","broadcast","publish","report","announce","advertise","promote",
        "social media","online","digital","network","platform","verbal","written",
    }),

    ("Emotions & Psychology", {
        "emotion","feeling","mood","happy","happiness","sad","sadness","angry",
        "anger","fear","anxiety","stress","worry","nervous","excitement","joy",
        "pleasure","pain","suffer","grief","sorrow","regret","guilt","shame",
        "pride","confidence","shy","lonely","love","hate","jealous","envy",
        "hope","despair","surprise","shock","disgust","admire","respect",
        "appreciate","grateful","thankful","embarrassed","confused","frustrated",
        "disappointed","satisfied","bored","tired","depressed","anxious","relaxed",
        "calm","peaceful","energetic","enthusiastic","motivated","inspired",
        "passionate","curious","creative","sensitive","emotional","rational",
        "instinct","intuition","perception","attitude","behaviour","personality",
        "character","identity","consciousness","thought","memory","dream",
        "imagination","belief","value","moral","ethical","psychological","mental",
        "therapy","counselling","motivation","self-esteem","resilient","recover",
        "overcome","challenge","mindset","positive","negative","empathy","sympathy",
    }),

    ("People & Society", {
        "person","people","man","woman","child","adult","youth","elderly","family",
        "parent","relative","ancestor","generation","community","society","social",
        "individual","group","population","demographic","background","identity",
        "gender","male","female","race","ethnicity","religion","belief","tradition",
        "custom","norm","value","behaviour","interaction","relationship","friendship",
        "partnership","marriage","divorce","single","couple","colleague","neighbour",
        "stranger","celebrity","leader","hero","role model","volunteer","charity",
        "poverty","wealth","inequality","privilege","minority","majority","diversity",
        "inclusion","exclusion","prejudice","stereotype","image","reputation",
        "responsibility","role","address","household","urban","rural","social",
        "community","public","private","personal","individual","collective",
    }),

    ("Personality & Character", {
        "personality","character","trait","quality","honest","dishonest","brave",
        "courageous","coward","generous","selfish","kind","cruel","polite","rude",
        "shy","confident","humble","arrogant","patient","impatient","optimistic",
        "pessimistic","creative","logical","sensitive","tough","gentle","strict",
        "flexible","reliable","irresponsible","ambitious","lazy","hardworking",
        "independent","dependent","sociable","introverted","extraverted",
        "thoughtful","careless","responsible","accountable","trustworthy",
        "manipulative","loyal","faithful","intelligent","wise","clever","foolish",
        "mature","immature","adaptable","stubborn","open-minded","narrow-minded",
        "cheerful","gloomy","aggressive","passive","dominant","submissive",
    }),

    ("Nature & Geography", {
        "nature","natural","animal","plant","tree","flower","grass","leaf","seed",
        "root","branch","wildlife","bird","fish","mammal","reptile","insect",
        "amphibian","habitat","species","extinct","predator","prey","migrate",
        "hibernate","feed","hunt","bloom","landscape","terrain","geography",
        "map","direction","north","south","east","west","altitude","latitude",
        "longitude","border","coast","shore","beach","cliff","cave","volcano",
        "earthquake","tropical","arctic","polar","continent","country","region",
        "desert","plain","island","ocean","sea","river","lake","mountain","hill",
        "valley","forest","jungle","sky","star","moon","sun","constellation",
    }),

    ("Food & Cooking", {
        "food","cook","cooking","recipe","ingredient","meal","dish","breakfast",
        "lunch","dinner","snack","restaurant","cafe","kitchen","oven","fridge",
        "knife","fork","spoon","plate","bowl","cup","glass","pot","pan","boil",
        "fry","bake","grill","roast","steam","mix","stir","chop","slice","taste",
        "flavour","spicy","sweet","sour","salty","bitter","fresh","organic",
        "vegetarian","vegan","diet","calorie","protein","carbohydrate","vitamin",
        "grocery","supermarket","portion","serving","hungry","thirsty","appetite",
        "cuisine","traditional","local","street food","bakery","butcher","dairy",
        "vegetable","fruit","meat","fish","seafood","grain","rice","bread","pasta",
        "noodle","soup","salad","sauce","spice","herb","oil","butter","sugar",
        "salt","pepper","flour","egg","cheese","milk","drink","beverage",
    }),

    ("Home & Daily Life", {
        "home","house","apartment","flat","room","bedroom","kitchen","bathroom",
        "living room","garden","garage","roof","wall","floor","ceiling","window",
        "door","furniture","sofa","chair","table","bed","shelf","cupboard","closet",
        "decoration","interior","exterior","rent","buy","mortgage","property",
        "neighbourhood","suburb","household","domestic","chore","clean","tidy",
        "repair","maintain","daily","routine","morning","evening","alarm",
        "shower","cook","eat","sleep","wake","commute","shop","weekend","relax",
        "spend","budget","expense","bill","utility","heating","cooling","television",
        "wifi","gadget","appliance","washing machine","vacuum","microwave",
        "dishwasher","laundry","ironing","garbage","trash","organize","arrange",
        "fix","replace","install","build","paint","decorate","renovate","move",
    }),

    ("Fashion & Appearance", {
        "fashion","clothing","clothes","wear","dress","shirt","trousers","jeans",
        "skirt","jacket","coat","shoes","boots","hat","scarf","gloves","suit",
        "uniform","casual","formal","style","trend","design","brand","label",
        "fabric","cotton","silk","wool","leather","colour","pattern","size",
        "appearance","look","face","hair","skin","beauty","makeup","cosmetics",
        "perfume","accessory","jewellery","ring","necklace","bracelet","earring",
        "bag","purse","wallet","mirror","wardrobe","boutique","fashionable",
        "stylish","elegant","sporty","vintage","modern","wardrobe","outfit",
        "accessories","footwear","lingerie","swimwear","sportswear",
    }),

    ("Time & Sequence", {
        "time","date","day","week","month","year","century","decade","era","age",
        "period","duration","moment","instant","second","minute","hour","morning",
        "afternoon","evening","night","midnight","noon","dawn","dusk","sunset",
        "sunrise","yesterday","today","tomorrow","soon","later","earlier","recent",
        "ancient","historic","temporary","permanent","deadline","schedule",
        "timetable","agenda","appointment","calendar","anniversary","birthday",
        "season","quarterly","annually","monthly","immediately","eventually",
        "initially","gradually","suddenly","frequently","regularly","occasionally",
        "subsequently","contemporary","previously","upcoming","overdue","duration",
        "ongoing","current","former","past","present","future","next","last","then",
    }),

    ("Abstract Concepts & Logic", {
        "concept","idea","thought","theory","principle","system","process","method",
        "approach","strategy","solution","problem","challenge","issue","question",
        "answer","reason","cause","effect","result","consequence","impact","factor",
        "element","aspect","feature","quality","quantity","amount","level","degree",
        "rate","percentage","proportion","ratio","pattern","trend","example","case",
        "situation","circumstance","condition","context","background","purpose",
        "goal","aim","intention","meaning","definition","category","type","kind",
        "form","structure","function","role","relationship","connection","link",
        "difference","similarity","contrast","comparison","analysis","evaluation",
        "assessment","judgement","decision","choice","option","alternative",
        "possibility","probability","opportunity","risk","benefit","advantage",
        "disadvantage","importance","significance","influence","power","control",
        "authority","duty","obligation","freedom","equality","justice","truth",
        "fact","experience","memory","potential","capacity","ability","effort",
        "achievement","success","failure","progress","development","change",
        "improvement","growth","decline","increase","decrease","range","scale",
        "measure","standard","limit","rule","exception","vary","apply","refer",
        "relate","depend","involve","include","require","allow","prevent","enable",
        "affect","determine","indicate","suggest","represent","assume","conclude",
        "establish","achieve","create","produce","generate","provide","offer",
        "receive","accept","reject","adopt","adapt","transform","combine","identify",
        "recognize","acknowledge","confirm","deny","declare","claim","prove",
        "argue","demonstrate","illustrate","describe","explain","define","outline",
        "review","assess","evaluate","estimate","calculate","predict","observe",
        "notice","examine","verify","validate","confirm","support","oppose",
        "challenge","criticize","defend","justify","propose","recommend","suggest",
        "advise","warn","remind","encourage","persuade","convince","negotiate",
        "compromise","approve","disapprove","appreciate","blame","praise","reflect",
    }),
]

# Build lookup: word → category
WORD_TO_CAT: dict[str, str] = {}
for _cat_name, _word_set in TAXONOMY:
    for _w in _word_set:
        if _w not in WORD_TO_CAT:
            WORD_TO_CAT[_w] = _cat_name

# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK by word class when taxonomy doesn't match
# ─────────────────────────────────────────────────────────────────────────────
CLASS_FALLBACK = {
    "adjective":        "Descriptive Words",
    "adverb":           "Adverbs & Expressions",
    "verb":             "Action Verbs",
    "noun":             "General Nouns",
    "conjunction":      "Grammar Words",
    "preposition":      "Grammar Words",
    "determiner":       "Grammar Words",
    "pronoun":          "Grammar Words",
    "modal verb":       "Grammar Words",
    "auxiliary verb":   "Grammar Words",
    "number":           "Numbers & Quantities",
    "ordinal number":   "Numbers & Quantities",
    "exclamation":      "Expressions",
    "infinitive marker":"Grammar Words",
    "definite article": "Grammar Words",
    "indefinite article":"Grammar Words",
}

# ─────────────────────────────────────────────────────────────────────────────
# MERGE MAP: small categories (< 5 words) → parent
# ─────────────────────────────────────────────────────────────────────────────
MERGE_MAP = {
    "Action":                 "Action Verbs",
    "Action Verbs":           "Action Verbs",
    "Biology & Chemistry":    "Science & Technology",
    "Character & Personality":"Personality & Character",
    "Physics & Engineering":  "Science & Technology",
    "Technology & Engineering":"Science & Technology",
    "Innovation & Engineering":"Science & Technology",
    "Mental Health":          "Emotions & Psychology",
    "Personal Development":   "Emotions & Psychology",
    "Personal & Social":      "People & Society",
    "Society & Community":    "People & Society",
    "Society & Law":          "Law & Crime",
    "Society":                "People & Society",
    "Government & Politics":  "Politics & Government",
    "Personal Finance":       "Economics & Business",
    "Crime & Justice":        "Law & Crime",
    "Fruits & Vegetables":    "Food & Cooking",
    "Cooking & Meals":        "Food & Cooking",
    "Places & Directions":    "Travel & Tourism",
    "Social Life":            "People & Society",
    "Speaking & Interaction": "Communication & Language",
    "Duration & Frequency":   "Time & Sequence",
    "Visual Arts":            "Arts & Culture",
    "Music & Performance":    "Arts & Culture",
    "Language Skills":        "Communication & Language",
    "Nature & Wildlife":      "Nature & Geography",
    "Weather & Climate":      "Nature & Geography",
    # tiny leftovers produced after force_split
    "Law & Crime":            "People & Society",
    "Politics & Government":  "People & Society",
    "Food & Cooking":         "Food & Cooking",   # keep if ≥5 else → General Nouns
    "Nature & Geography":     "Environment & Climate",
    "Time & Sequence":        "Time & Sequence",  # keep if ≥5 else merge
    "Food & Drink":           "Food & Cooking",
    "Home & Housing":         "Home & Daily Life",
    "Objects & Tools":        "Home & Daily Life",
    "Furniture & Objects":    "Home & Daily Life",
    "Transportation":         "Travel & Tourism",
    "Shopping & Money":       "Economics & Business",
    "Religion":               "People & Society",
    "History":                "Education & Learning",
    "Achievement":            "Work & Career",
    "Business":               "Economics & Business",
    "Business & Management":  "Economics & Business",
    "Economics & Trade":      "Economics & Business",
    "Design":                 "Arts & Culture",
    "Psychology":             "Emotions & Psychology",
    "Body & Fitness":         "Health & Medicine",
    "Fashion":                "Fashion & Appearance",
    "Philosophy":             "Abstract Concepts & Logic",
    "Industry":               "Economics & Business",
    "Education":              "Education & Learning",
    # ── oversized source categories (always reclassify) ──────────────────
    "General":                None,   # use TAXONOMY / CLASS_FALLBACK
    "Grammar":                None,
    "Professions":            "Work & Career",
    "People":                 "People & Society",
    "Emotions":               "Emotions & Psychology",
    "Communication":          "Communication & Language",
    "Environment":            "Environment & Climate",
    "Science":                "Science & Technology",
    "Health":                 "Health & Medicine",
    "Travel":                 "Travel & Tourism",
    "Sports":                 "Sports & Recreation",
    "Finance":                "Economics & Business",
    "Technology":             "Science & Technology",
    "Daily Life":             "Home & Daily Life",
    "Arts & Music":           "Arts & Culture",
    "Description":            "Descriptive Words",
}

ALWAYS_RECLASSIFY = set(MERGE_MAP.keys())


# ─────────────────────────────────────────────────────────────────────────────
# CLASSIFICATION LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def classify_word(word: str, word_class: str, orig_cat: str) -> str:
    """Find the best category for a word."""
    lower = word.lower()
    # 1. Exact taxonomy match
    if lower in WORD_TO_CAT:
        return WORD_TO_CAT[lower]
    # 2. Merge map gives a positive target
    if orig_cat in MERGE_MAP:
        target = MERGE_MAP[orig_cat]
        if target is not None:
            return target
    # 3. Class-based fallback
    return CLASS_FALLBACK.get(word_class, "General Nouns")


def reclassify_level(level_data: dict) -> dict:
    new_cats: dict = defaultdict(list)
    for orig_cat, words in level_data.items():
        for w in words:
            if orig_cat in ALWAYS_RECLASSIFY:
                new_cat = classify_word(w['word'], w['class'], orig_cat)
            else:
                new_cat = orig_cat
            new_cats[new_cat].append(w)
    return dict(sorted(new_cats.items()))


def split_big_cats(cats: dict, threshold: int = 30) -> dict:
    """Re-run taxonomy on items inside oversized categories to sub-split them."""
    result: dict = defaultdict(list)
    for cat_name, words in cats.items():
        if len(words) <= threshold:
            result[cat_name].extend(words)
            continue
        sub: dict = defaultdict(list)
        for w in words:
            matched = WORD_TO_CAT.get(w['word'].lower())
            if matched and matched != cat_name:
                sub[matched].append(w)
            else:
                sub[cat_name].append(w)
        for k, v in sub.items():
            result[k].extend(v)
    return dict(sorted(result.items()))


def merge_small_cats(cats: dict, threshold: int = 5) -> dict:
    """Merge tiny categories into best parent."""
    result: dict = defaultdict(list)
    for cat_name, words in cats.items():
        if len(words) < threshold:
            if cat_name in MERGE_MAP:
                target = MERGE_MAP[cat_name] or "Abstract Concepts & Logic"
                # prevent self-mapping loop
                if target == cat_name:
                    target = "Abstract Concepts & Logic"
                result[target].extend(words)
            else:
                # Find where most words would go
                counts: dict = {}
                for w in words:
                    m = WORD_TO_CAT.get(w['word'].lower())
                    if m:
                        counts[m] = counts.get(m, 0) + 1
                best = max(counts, key=counts.get) if counts else "General Nouns"
                result[best].extend(words)
        else:
            result[cat_name].extend(words)
    return dict(sorted(result.items()))


def force_split(cats: dict, threshold: int = 30) -> dict:
    """
    For categories that are STILL > threshold after all other passes,
    split them into alphabetically ordered chunks named 'Cat (A-E)', etc.
    This guarantees no category exceeds threshold.
    """
    result: dict = defaultdict(list)
    for cat_name, words in cats.items():
        if len(words) <= threshold:
            result[cat_name].extend(words)
            continue
        n_chunks = math.ceil(len(words) / threshold)
        sorted_words = sorted(words, key=lambda w: w['word'].lower())
        chunk_size = math.ceil(len(sorted_words) / n_chunks)
        for i, start in enumerate(range(0, len(sorted_words), chunk_size)):
            chunk = sorted_words[start:start + chunk_size]
            label = f"{cat_name} {i + 1}" if n_chunks > 1 else cat_name
            result[label].extend(chunk)
    return dict(sorted(result.items()))


def report(cats: dict, level: str):
    cats_sorted = sorted([(len(v), k) for k, v in cats.items()], reverse=True)
    total = sum(c[0] for c in cats_sorted)
    too_big   = [(n, c) for n, c in cats_sorted if n > 30]
    too_small = [(n, c) for n, c in cats_sorted if n < 5]
    ok        = [(n, c) for n, c in cats_sorted if 5 <= n <= 30]
    print(f"\n✅ {level.upper()} — Categories: {len(cats_sorted)} | "
          f"Words: {total} | "
          f"🔴 Too big: {len(too_big)} | "
          f"🟡 Too small: {len(too_small)} | "
          f"🟢 OK: {len(ok)}")
    if too_big:
        print("   🔴 Still too big:", [(n, c) for n, c in too_big])
    if too_small:
        print("   🟡 Still too small:", [(n, c) for n, c in too_small])
    print("\n📋 Categories:")
    for n, c in cats_sorted:
        bar = "🔴" if n > 30 else ("🟡" if n < 5 else "🟢")
        print(f"   {bar} [{n:3}] {c}")


def main():
    lessons = load_flat()

    for level in ['a2', 'b1', 'b2', 'c1']:
        nested = flat_to_nested(lessons, level)
        orig_total = sum(len(v) for v in nested.values())
        print(f"\n{'='*60}")
        print(f"Processing {level.upper()}... ({orig_total} words)")

        cats = reclassify_level(nested)      # Step 1
        cats = split_big_cats(cats)           # Step 2
        cats = merge_small_cats(cats)         # Step 3
        cats = split_big_cats(cats)           # Step 4
        cats = merge_small_cats(cats)         # Step 5
        cats = force_split(cats)              # Step 6
        cats = merge_small_cats(cats)         # Step 7

        new_total = sum(len(v) for v in cats.values())
        assert new_total == orig_total, \
            f"Word count mismatch {level}: {orig_total} → {new_total}"

        lessons = replace_level(lessons, level, cats)
        report(cats, level)

    save_flat(lessons)
    print("\n\n🎉 All levels reclassified successfully!")


if __name__ == '__main__':
    main()
