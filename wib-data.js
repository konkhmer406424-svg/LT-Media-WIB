// wib-data.js — theme colors, fonts, text templates, timeline presets, and state schema/validation (normalizeState)

const THEMES = {
  gold:{ label:"មាស", swatch:"linear-gradient(135deg,#B8912E,#6B2D5C)",
    bg:"#FBF8EF", ink:"#3B2A1C", accent1:"#B8912E", accent2:"#6B2D5C",
    card:"#FFFFFF", border:"rgba(184,145,46,0.22)", radius:"4px",
    ornate:true },
  rose:{ label:"ផ្កាកុលាប", swatch:"linear-gradient(135deg,#A8465A,#C9A227)",
    bg:"#FFF3F0", ink:"#402530", accent1:"#A8465A", accent2:"#C9A227",
    card:"#FFFFFF", border:"rgba(168,70,90,0.2)", radius:"4px",
    ornate:true },
  minimal:{ label:"សាមញ្ញ", swatch:"linear-gradient(135deg,#1F1B16,#6B6142)",
    bg:"#F7F4EE", ink:"#1F1B16", accent1:"#1F1B16", accent2:"#6B6142",
    card:"#FFFFFF", border:"rgba(31,27,22,0.15)", radius:"0px",
    ornate:false },
  royal:{ label:"នគរ", swatch:"linear-gradient(135deg,#1B3A6B,#C9A227)",
    bg:"#F5F6FA", ink:"#1B2440", accent1:"#1B3A6B", accent2:"#C9A227",
    card:"#FFFFFF", border:"rgba(27,58,107,0.18)", radius:"4px",
    ornate:true },
  emerald:{ label:"ម្រកត", swatch:"linear-gradient(135deg,#1F5C45,#C9A227)",
    bg:"#F2F8F5", ink:"#1E3B2F", accent1:"#1F5C45", accent2:"#C9A227",
    card:"#FFFFFF", border:"rgba(31,92,69,0.18)", radius:"4px",
    ornate:true },
  blush:{ label:"ផ្កាឈូក", swatch:"linear-gradient(135deg,#C76B84,#E0A458)",
    bg:"#FFF8F5", ink:"#4A2E2A", accent1:"#C76B84", accent2:"#E0A458",
    card:"#FFFFFF", border:"rgba(199,107,132,0.18)", radius:"4px",
    ornate:true }
};

const KM_WEEKDAYS = ["អាទិត្យ","ចន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const KM_MONTHS = ["មករា","កុម្ភៈ","មីនា","មេសា","ឧសភា","មិថុនា","កក្កដា","សីហា","កញ្ញា","តុលា","វិច្ឆិកា","ធ្នូ"];
const EN_WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const LABELS = {
  km:{ countdownTitle:"រាប់ថយក្រោយ", countdownSub:"រយៈពេលដែលនៅសល់រហូតដល់ថ្ងៃមង្គលការ",
    days:"ថ្ងៃ", hours:"ម៉ោង", minutes:"នាទី", seconds:"វិនាទី", congrats:"សូមអបអរសាទរ!",
    programTitle:"កម្មវិធីនៃពិធីមង្គលការ", galleryTitle:"រូបភាពនៃពួកយើង",
    gallerySub:"ដាក់រូបភាព pre-wedding របស់អ្នកជំនួសកន្លែងទាំងនេះ", venueTitle:"ទីតាំងកម្មវិធី",
    mapBtn:"មើលទីតាំងលើ Google Maps", contactsTitle:"ទំនាក់ទំនង",
    contactsSub:"សម្រាប់ព័ត៌មានលម្អិត សូមទាក់ទងមកកាន់", thanks:"អរគុណ", and:"និង",
    toggleKm:"ខ្មែរ", toggleEn:"English" },
  en:{ countdownTitle:"Countdown", countdownSub:"Time remaining until our special day",
    days:"Days", hours:"Hours", minutes:"Minutes", seconds:"Seconds", congrats:"Congratulations!",
    programTitle:"Wedding Program", galleryTitle:"Our Moments Together",
    gallerySub:"Your pre-wedding photos will appear here", venueTitle:"Event Location",
    mapBtn:"View on Google Maps", contactsTitle:"Contact Us",
    contactsSub:"For more details, please reach out to", thanks:"Thank You", and:"&",
    toggleKm:"ខ្មែរ", toggleEn:"English" }
};

// Staff no longer choose an effect; each guest picks one from the toggle on the invitation.
const DEFAULT_GUEST_FX = "none";   // "none" | "petals" | "snow" | "stars"
// Background song (one per project). Kept out of `state` because it is far too big for localStorage;
// it is stored in IndexedDB instead (see the Music block below).
let musicAsset = null;   // { name, size, dataUrl } or null
const EFFECTS = {
  none:{ label:"គ្មាន", icon:"–" },
  petals:{ label:"ផ្កាធ្លាក់", icon:"🌸" },
  snow:{ label:"ព្រិលធ្លាក់", icon:"❄️" },
  stars:{ label:"ផ្កាយធ្លាក់", icon:"✨" }
};

const TPL_LABELS = { km:["ប្រពៃណី","កក់ក្តៅ","សាមញ្ញ"], en:["Formal","Heartfelt","Simple"] };

const TEMPLATES = {
  eyebrow:{
    km:[
      "សូមគោរពអញ្ជើញអ្នកមកចូលរួមព្រឹត្តិការណ៍ដ៏មានតម្លៃមួយនេះ",
      "ក្នុងជីវិតមានតែថ្ងៃមួយប៉ុណ្ណោះ ដែលយើងចង់ឲ្យអ្នកនៅជាមួយ",
      "អញ្ជើញអ្នកមកចែករំលែកភាពរីករាយក្នុងថ្ងៃសំខាន់របស់យើង"
    ],
    en:[
      "You are cordially invited to join us in celebrating our special day",
      "Together with our families, we joyfully invite you to share in our wedding day",
      "Join us as we begin our forever — your presence means the world to us"
    ]
  },
  welcomeText:{
    km:[
      "ក្តីស្រឡាញ់ពីរដួងចិត្តបានលូតលាស់ ហើយថ្ងៃមួយដ៏មានអត្ថន័យបំផុតកំពុងតែមកដល់។ សូមគោរពអញ្ជើញលោកអ្នកជាទីគោរពស្រឡាញ់ ចូលរួមជាភ្ញៀវកិត្តិយសក្នុងពិធីមង្គលការនេះ។",
      "ពួកយើងទាំងពីរនាក់មានក្តីរីករាយយ៉ាងខ្លាំង ដែលទទួលបានឱកាសចែករំលែកថ្ងៃពិសេសនេះជាមួយអ្នក។ វត្តមានរបស់អ្នកនឹងធ្វើឲ្យថ្ងៃនេះកាន់តែមានអត្ថន័យសម្រាប់ពួកយើង។",
      "សុបិនចង់បានរបស់យើងកំពុងនឹងក្លាយជាការពិត។ សូមអញ្ជើញអ្នកមកចែករំលែកភាពសប្បាយរីករាយ និងក្តីស្រឡាញ់ជាមួយពួកយើង។"
    ],
    en:[
      "Two hearts have grown into one, and the most meaningful day is finally here. We warmly invite you, our cherished guest, to join us as an honored guest at our wedding celebration.",
      "We are so happy to share this special chapter of our lives with you. Your presence would mean so much to us as we begin our journey together as husband and wife.",
      "Our story is just beginning, and we would love for you to be part of it. Please join us for a celebration of love, laughter, and new beginnings."
    ]
  }
};

const TIMELINE_PRESETS = [
  {
    label:"កម្មវិធីព្រឹក (សំខាន់ៗ)",
    labelEn:"Morning Ceremony (Essentials)",
    items:[
      {time:"៦:០០ ព្រឹក", name:"ពិធីហែជំនូន", timeEn:"6:00 AM", nameEn:"Gift Procession Ceremony"},
      {time:"៧:០០ ព្រឹក", name:"ពិធីសូត្រមន្ត ជូនពរដល់ព្រះសង្ឃ", timeEn:"7:00 AM", nameEn:"Blessing by Buddhist Monks"},
      {time:"៨:០០ ព្រឹក", name:"ពិធីសំពះផ្ការ", timeEn:"8:00 AM", nameEn:"Flower Blessing Ceremony"},
      {time:"៩:០០ ព្រឹក", name:"ពិធីកាត់សក់ (ស្រង់សក់)", timeEn:"9:00 AM", nameEn:"Hair Cutting Ceremony"},
      {time:"១០:០០ ព្រឹក", name:"ពិធីបង្វិលពពិល", timeEn:"10:00 AM", nameEn:"Candle Circling Ceremony"},
      {time:"១១:០០ ព្រឹក", name:"ពិធីជូនកូនក្រមុំចូលបន្ទប់", timeEn:"11:00 AM", nameEn:"Bridal Chamber Ceremony"},
      {time:"១២:០០ ថ្ងៃត្រង់", name:"អាហារថ្ងៃត្រង់ អញ្ជើញភ្ញៀវ", timeEn:"12:00 PM", nameEn:"Lunch Reception"}
    ]
  },
  {
    label:"កម្មវិធីពេញលេញ (ព្រឹក + ល្ងាច)",
    labelEn:"Full Day (Morning + Evening)",
    items:[
      {time:"៦:០០ ព្រឹក", name:"ពិធីហែជំនូន", timeEn:"6:00 AM", nameEn:"Gift Procession Ceremony"},
      {time:"៧:០០ ព្រឹក", name:"ពិធីសូត្រមន្ត ជូនពរដល់ព្រះសង្ឃ", timeEn:"7:00 AM", nameEn:"Blessing by Buddhist Monks"},
      {time:"៨:០០ ព្រឹក", name:"ពិធីសំពះផ្ការ", timeEn:"8:00 AM", nameEn:"Flower Blessing Ceremony"},
      {time:"៩:០០ ព្រឹក", name:"ពិធីកាត់សក់ (ស្រង់សក់)", timeEn:"9:00 AM", nameEn:"Hair Cutting Ceremony"},
      {time:"១០:០០ ព្រឹក", name:"ពិធីបង្វិលពពិល", timeEn:"10:00 AM", nameEn:"Candle Circling Ceremony"},
      {time:"១១:០០ ព្រឹក", name:"ពិធីជូនកូនក្រមុំចូលបន្ទប់", timeEn:"11:00 AM", nameEn:"Bridal Chamber Ceremony"},
      {time:"១២:០០ ថ្ងៃត្រង់", name:"អាហារថ្ងៃត្រង់ អញ្ជើញភ្ញៀវ", timeEn:"12:00 PM", nameEn:"Lunch Reception"},
      {time:"៥:០០ ល្ងាច", name:"ភ្ញៀវអញ្ជើញចូលរួមអបអរសាទរ", timeEn:"5:00 PM", nameEn:"Guests Arrive & Celebration Begins"},
      {time:"៦:០០ ល្ងាច", name:"ពិធីជូនពរកូនកម្លោះកូនក្រមុំ", timeEn:"6:00 PM", nameEn:"Blessing the Newlyweds"},
      {time:"៧:០០ ល្ងាច", name:"ពិធីកាត់នំខេក និងអាហារពេលល្ងាច", timeEn:"7:00 PM", nameEn:"Cake Cutting & Dinner"}
    ]
  },
  {
    label:"ទទួលភ្ញៀវល្ងាចតែមួយ",
    labelEn:"Evening Reception Only",
    items:[
      {time:"៥:៣០ ល្ងាច", name:"ភ្ញៀវអញ្ជើញចូលរួម", timeEn:"5:30 PM", nameEn:"Guests Arrive"},
      {time:"៦:០០ ល្ងាច", name:"ពិធីស្វាគមន៍កូនកម្លោះកូនក្រមុំ", timeEn:"6:00 PM", nameEn:"Welcoming the Newlyweds"},
      {time:"៦:៣០ ល្ងាច", name:"ពិធីជូនពរ និងផ្តល់អំណោយ", timeEn:"6:30 PM", nameEn:"Blessings & Gift Giving"},
      {time:"៧:០០ ល្ងាច", name:"ពិធីកាត់នំខេក", timeEn:"7:00 PM", nameEn:"Cake Cutting Ceremony"},
      {time:"៧:៣០ ល្ងាច", name:"អាហារពេលល្ងាច និងកម្សាន្ត", timeEn:"7:30 PM", nameEn:"Dinner & Entertainment"}
    ]
  }
];


// ---- Font styles: chosen separately from the colour theme (Khmer and English each have their own) ----
const FONT_KM = {
  moul:{ name:"Moul", display:"'Moul',serif", body:"'Kantumruy Pro',sans-serif" },
  suwannaphum:{ name:"Suwannaphum", display:"'Suwannaphum',serif", body:"'Battambang',sans-serif" },
  battambang:{ name:"Battambang", display:"'Battambang',serif", body:"'Kantumruy Pro',sans-serif" },
  bokor:{ name:"Bokor", display:"'Bokor',serif", body:"'Kantumruy Pro',sans-serif" },
  angkor:{ name:"Angkor", display:"'Angkor',serif", body:"'Battambang',sans-serif" },
  moulpali:{ name:"Moulpali", display:"'Moulpali',serif", body:"'Kantumruy Pro',sans-serif" }
};
const FONT_EN = {
  greatVibes:{ name:"Great Vibes", display:"'Great Vibes',cursive", body:"'Cormorant Garamond',serif" },
  parisienne:{ name:"Parisienne", display:"'Parisienne',cursive", body:"'Cormorant Garamond',serif" },
  playfair:{ name:"Playfair Display", display:"'Playfair Display',serif", body:"'Cormorant Garamond',serif" },
  ebGaramond:{ name:"EB Garamond", display:"'EB Garamond',serif", body:"'EB Garamond',serif" },
  tangerine:{ name:"Tangerine", display:"'Tangerine',cursive", body:"'Cormorant Garamond',serif" },
  marckScript:{ name:"Marck Script", display:"'Marck Script',cursive", body:"'Cormorant Garamond',serif" }
};
// What each theme used to force. Only used to keep old drafts / saved projects looking exactly as before.
const THEME_FONT_DEFAULTS = {
  gold:["moul","greatVibes"], rose:["suwannaphum","parisienne"], minimal:["battambang","playfair"],
  royal:["bokor","ebGaramond"], emerald:["angkor","tangerine"], blush:["moulpali","marckScript"]
};
// ---- Photo gallery layout: chosen separately from colour/font/theme ----
const GALLERY_STYLES = {
  grid:{ label:"ក្រឡាចត្រង្គ (រូបធំ-តូចឆ្លាស់)" },
  classic:{ label:"ក្រឡាចត្រង្គ (ស្មើគ្នា)" },
  polaroid:{ label:"រូបថតប៉ូឡារ៉ូអ៊ីត" },
  square:{ label:"ក្រឡាការ៉េ" },
  mosaic:{ label:"ម៉ូសាអ៊ិក (ចម្រុះទំហំ — លេចធ្លោ)" }
};
// What each colour theme used to force, before the layout became its own choice. Only used to keep old
// drafts/projects looking the same as before.
const THEME_GALLERY_DEFAULTS = { gold:"grid", rose:"polaroid", minimal:"square", royal:"grid", emerald:"grid", blush:"grid" };

// Fixed decorative Kbach Khmer border: stays anchored to the screen edges while the invitation content
// scrolls underneath it. Colours are drawn from the active theme (--accent-1 / --accent-2 / --bg), so no
// separate colour picker is needed here.
const KBACH_FRAME_STYLES = {
  none:{ label:"គ្មាន" },
  mixed:{ label:"ផ្កាចម្រុះ" },
  flame:{ label:"ក្បាច់ភ្លើង" },
  vine:{ label:"ក្រវាត់ស្លឹក" },
  minimal:{ label:"សាមញ្ញ" },
  dense:{ label:"កម្រងផ្កាក្រាស់" },
  star:{ label:"ចំណុចផ្កាយ" }
};

const defaultState = {
  theme:"gold",
  fontKm:"moul",
  fontEn:"greatVibes",
  galleryStyle:"grid",
  kbachFrame:"none",
  openStyle:"door",
  coverAlways:false,
  groomName:"", brideName:"",
  eyebrow:"",
  groomNameEn:"", brideNameEn:"",
  eyebrowEn:"",
  eventDate:"", startTime:"",
  welcomeText:"",
  host1:"",
  host2:"",
  welcomeTextEn:"",
  host1En:"",
  host2En:"",
  timeline:[
    {time:"", name:"", timeEn:"", nameEn:""},
    {time:"", name:"", timeEn:"", nameEn:""},
    {time:"", name:"", timeEn:"", nameEn:""},
    {time:"", name:"", timeEn:"", nameEn:""}
  ],
  venueName:"",
  venueAddr:"",
  venueNameEn:"",
  venueAddrEn:"",
  venueMapLink:"",
  contacts:[
    {name:"", phone:"", nameEn:""},
    {name:"", phone:"", nameEn:""}
  ],
  photos:[],
  photoNames:[],
  coverPhoto:null,
  coverPhotoName:"",
  guestNamesFileRaw:""
};
const MAX_PHOTOS = 10;
const COVER_STYLE_KEYS = ["door","curtain","lock","envelope","lotus","book"];   // keep in sync with COVER_STYLES below

// ---- Data hygiene: every state that comes from storage or from an imported .json goes through here ----
// (a broken or hand-edited file can no longer stop the app from starting, or inject code into the guest pages)
const DATA_IMG_RE = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/;
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function safeImg(v){ return (typeof v === "string" && DATA_IMG_RE.test(v)) ? v : null; }
function asStr(v, max){ return (typeof v === "string") ? (max ? v.slice(0, max) : v) : ""; }
function normalizeState(raw){
  const s = JSON.parse(JSON.stringify(defaultState));
  const r = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : {};
  ["groomName","brideName","eyebrow","groomNameEn","brideNameEn","eyebrowEn","welcomeText","host1","host2",
   "welcomeTextEn","host1En","host2En","venueName","venueAddr","venueNameEn","venueAddrEn","venueMapLink",
   "coverPhotoName"].forEach(k => { s[k] = asStr(r[k], 20000); });
  s.guestNamesFileRaw = asStr(r.guestNamesFileRaw, 500000);          // a long guest list must not be cut off
  s.openStyle = COVER_STYLE_KEYS.includes(r.openStyle) ? r.openStyle : "door";
  s.theme = (typeof r.theme === "string" && hasOwn(THEMES, r.theme)) ? r.theme : "gold";
  const fd = THEME_FONT_DEFAULTS[s.theme] || THEME_FONT_DEFAULTS.gold;   // older data has no font fields: keep the theme's old fonts
  s.fontKm = hasOwn(FONT_KM, r.fontKm) ? r.fontKm : fd[0];
  s.fontEn = hasOwn(FONT_EN, r.fontEn) ? r.fontEn : fd[1];
  s.galleryStyle = hasOwn(GALLERY_STYLES, r.galleryStyle) ? r.galleryStyle : (THEME_GALLERY_DEFAULTS[s.theme] || "grid");
  s.kbachFrame = hasOwn(KBACH_FRAME_STYLES, r.kbachFrame) ? r.kbachFrame : "none";
  s.eventDate = /^\d{4}-\d{2}-\d{2}$/.test(r.eventDate || "") ? r.eventDate : "";
  s.startTime = /^\d{2}:\d{2}$/.test(r.startTime || "") ? r.startTime : "";
  s.coverAlways = !!r.coverAlways;
  const list = (v, keys) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === "object").slice(0, 200)
    .map(x => { const o = {}; keys.forEach(k => { o[k] = asStr(x[k], 500); }); return o; });
  s.timeline = Array.isArray(r.timeline) ? list(r.timeline, ["time","name","timeEn","nameEn"]) : s.timeline;
  s.contacts = Array.isArray(r.contacts) ? list(r.contacts, ["name","phone","nameEn"]) : s.contacts;
  const names = Array.isArray(r.photoNames) ? r.photoNames : [];
  s.photos = []; s.photoNames = [];
  (Array.isArray(r.photos) ? r.photos : []).forEach((p, i) => {
    const ok = safeImg(p);
    if(ok && s.photos.length < MAX_PHOTOS){ s.photos.push(ok); s.photoNames.push(asStr(names[i], 200) || ("រូបភាព " + (s.photos.length))); }
  });
  s.coverPhoto = safeImg(r.coverPhoto);
  if(!s.coverPhoto) s.coverPhotoName = "";
  return s;
}
