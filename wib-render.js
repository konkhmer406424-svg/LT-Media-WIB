// wib-render.js — turns app state into the actual guest-facing invitation HTML/CSS (renderInvitation, buildSection, music/cover-open animation, countdown, particle effects)

let state = JSON.parse(JSON.stringify(defaultState));
try{
  const saved = localStorage.getItem("wib-draft-v2");
  if(saved) state = normalizeState(JSON.parse(saved));
}catch(e){}

// Saving: no longer silent. When the browser storage is full the staff is told (before, "saved" was shown even though nothing was written).
const STORAGE_FULL_MSG = "⚠ ទំហំ browser ពេញ — រក្សាទុកមិនបាន! សូមនាំចេញ (Export) .json ទុកជាមុន រួចលុបគម្រោងចាស់ ឬកាត់បន្ថយចំនួនរូបភាព";
let lastStorageWarn = 0;
function saveDraft(){
  try{ localStorage.setItem("wib-draft-v2", JSON.stringify(state)); return true; }
  catch(e){
    if(Date.now() - lastStorageWarn > 20000){
      lastStorageWarn = Date.now();
      const el = document.getElementById("profileStatus");
      if(el) el.textContent = STORAGE_FULL_MSG;
    }
    return false;
  }
}
let draftTimer = null;
function saveDraftSoon(){ clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 400); }   // typing no longer re-writes MBs of data on every key
window.addEventListener("pagehide", () => { if(draftTimer){ clearTimeout(draftTimer); draftTimer = null; saveDraft(); } });

function kmDate(dateStr){
  if(!dateStr) return "";
  const d = new Date(dateStr+"T00:00:00");
  return `ថ្ងៃ${KM_WEEKDAYS[d.getDay()]} ទី${d.getDate()} ខែ${KM_MONTHS[d.getMonth()]} ឆ្នាំ${d.getFullYear()}`;
}
function enDate(dateStr){
  if(!dateStr) return "";
  const d = new Date(dateStr+"T00:00:00");
  return `${EN_WEEKDAYS[d.getDay()]}, ${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function buildGalleryHtml(s, theme){
  const placeholderIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5.5-5-4 4-2-2L3 18"/></svg>`;
  const photosForGallery = s.photos.filter(Boolean).length ? s.photos.filter(Boolean) : [null,null,null,null];
  return photosForGallery.map((photo,i) => {
    let extraClass = "";
    if(s.galleryStyle==="grid") extraClass = (i%4===0 || i%4===3) ? " wide" : "";
    if(s.galleryStyle==="polaroid") extraClass = " rot-"+(i%3);
    const inner = photo
      ? `<img src="${photo}" alt="photo ${i+1}">`
      : `${placeholderIcon}<span>រូបភាព ${i+1}</span>`;
    return `<div class="gallery-item${extraClass}"><div class="frame${photo?" photo":""}">${inner}</div></div>`;
  }).join("");
}

function buildSection(s, t, lang){
  const L = LABELS[lang];
  const isKm = lang === "km";
  const groom = isKm ? s.groomName : (s.groomNameEn || s.groomName);
  const bride = isKm ? s.brideName : (s.brideNameEn || s.brideName);
  const eyebrow = isKm ? s.eyebrow : (s.eyebrowEn || s.eyebrow);
  const welcome = isKm ? s.welcomeText : (s.welcomeTextEn || s.welcomeText);
  const host1 = isKm ? s.host1 : (s.host1En || s.host1);
  const host2 = isKm ? s.host2 : (s.host2En || s.host2);
  const venueName = isKm ? s.venueName : (s.venueNameEn || s.venueName);
  const venueAddr = isKm ? s.venueAddr : (s.venueAddrEn || s.venueAddr);
  const displayDate = isKm ? kmDate(s.eventDate) : enDate(s.eventDate);

  const ornamentSvg = t.ornate
    ? `<svg width="18" height="18" viewBox="0 0 20 20"><path d="M10 2 C10 8 4 8 4 12 C4 16 10 16 10 18 C10 16 16 16 16 12 C16 8 10 8 10 2 Z" fill="none" stroke="var(--accent-2)" stroke-width="1.2"/></svg>`
    : ``;
  const divider = `<div class="divider"><span class="rule"></span>${ornamentSvg}<span class="rule"></span></div>`;

  const timelineRows = s.timeline.map(item => ({
    time: isKm ? item.time : (item.timeEn || item.time),
    name: isKm ? item.name : (item.nameEn || item.name)
  })).filter(r => (r.time || "").trim() || (r.name || "").trim());          // rows left blank are skipped
  const timelineHtml = timelineRows.map(r =>
    `<div class="tl-item"><div class="tl-time">${escapeHtml(r.time)}</div><p class="tl-name">${escapeHtml(r.name)}</p></div>`
  ).join("");

  const galleryHtml = buildGalleryHtml(s, t);
  const galleryClass = "gallery gallery-style-" + (hasOwn(GALLERY_STYLES, s.galleryStyle) ? s.galleryStyle : "grid");

  const mapsUrl = (s.venueMapLink && /^https?:\/\//i.test(s.venueMapLink.trim())) ? s.venueMapLink.trim() : "";   // http(s) only (blocks javascript: links)

  const contactsHtml = (s.contacts||[]).filter(c => c.name || c.phone).map(c => {
    const cname = isKm ? c.name : (c.nameEn || c.name);
    return `<div class="contact-card"><p class="contact-name">${escapeHtml(cname)}</p>${c.phone ? `<a class="contact-phone" href="tel:${escapeHtml(c.phone.replace(/\s+/g,""))}">${escapeHtml(c.phone)}</a>` : ""}</div>`;
  }).join("");

  const heroStyle = s.coverPhoto
    ? ` style="background-image:linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.5) 40%, rgba(0,0,0,.66) 100%), url('${s.coverPhoto}');background-size:cover;background-position:center 25%;"`
    : "";
  const heroClass = s.coverPhoto ? "hero has-cover" : "hero";
  const suf = "-" + lang;

  const guestLineText = s.__guestName ? (isKm ? `ជូនចំពោះ ${s.__guestName}` : `Dear ${s.__guestName},`) : "";
  const guestLineAttrs = guestLineText ? "" : ` style="display:none"`;


  // Which sections have something to show? (In the live preview every section stays visible.)
  const isPrev = !!s.__preview;
  const hasWelcome = !!((welcome || "").trim() || (host1 || "").trim() || (host2 || "").trim());
  const hasCountdown = !!(s.eventDate && s.startTime);
  const hasProgram = timelineRows.length > 0;
  const hasGallery = s.photos.filter(Boolean).length > 0;
  const hasVenue = !!((venueName || "").trim() || (venueAddr || "").trim() || mapsUrl);
  const secWelcome   = (isPrev || hasWelcome)   ? `<section><div class="wrap"><div class="welcome">
<p>${escapeHtml(welcome)}</p>
<div class="hosts">${escapeHtml(host1)}<br>${escapeHtml(host2)}</div>
</div></div></section>` : "";
  const secCountdown = (isPrev || hasCountdown) ? `<section><div class="wrap">
<h2 class="section-title display">${L.countdownTitle}</h2>
<p class="section-sub">${L.countdownSub}</p>
<div class="countdown" id="countdown${suf}">
<div class="cd-unit"><div class="cd-num" id="cd-d${suf}">00</div><div class="cd-label">${L.days}</div></div>
<div class="cd-unit"><div class="cd-num" id="cd-h${suf}">00</div><div class="cd-label">${L.hours}</div></div>
<div class="cd-unit"><div class="cd-num" id="cd-m${suf}">00</div><div class="cd-label">${L.minutes}</div></div>
<div class="cd-unit"><div class="cd-num" id="cd-s${suf}">00</div><div class="cd-label">${L.seconds}</div></div>
</div></div></section>` : "";
  const secProgram   = (isPrev || hasProgram)   ? `<section><div class="wrap">
<h2 class="section-title display">${L.programTitle}</h2>
<p class="section-sub">${displayDate}</p>
<div class="timeline">${timelineHtml}</div>
</div></section>` : "";
  const secGallery   = (isPrev || hasGallery)   ? `<section><div class="wrap">
<h2 class="section-title display">${L.galleryTitle}</h2>
<p class="section-sub">${L.gallerySub}</p>
<div class="${galleryClass}">${galleryHtml}</div>
</div></section>` : "";
  const secVenue     = (isPrev || hasVenue)     ? `<section><div class="wrap">
<h2 class="section-title display">${L.venueTitle}</h2>
<div class="venue-card">
<p class="venue-name display">${escapeHtml(venueName)}</p>
<p class="venue-addr">${escapeHtml(venueAddr)}</p>
${mapsUrl ? `<a class="map-btn" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener">${L.mapBtn}</a>` : ""}
</div>
</div></section>` : "";
  const secContacts  = contactsHtml ? `<section><div class="wrap">
<h2 class="section-title display">${L.contactsTitle}</h2>
<p class="section-sub">${L.contactsSub}</p>
<div class="contact-grid">${contactsHtml}</div>
</div></section>` : "";
  const bodySections = [secWelcome, secCountdown, secProgram, secGallery, secVenue, secContacts].filter(Boolean).join(divider);

  return `<section id="section${suf}" class="lang-section lang-${lang}" style="display:${isKm ? "block" : "none"}">
<p class="guest-line" id="guestLine${suf}"${guestLineAttrs}>${escapeHtml(guestLineText)}</p>
<section class="${heroClass}"${heroStyle}>
<p class="eyebrow">${escapeHtml(eyebrow)}</p>
<h1 class="names display">${escapeHtml(groom)}<span class="amp">${escapeHtml(L.and)}</span>${escapeHtml(bride)}</h1>
<p class="hero-date">${displayDate}</p>
</section>
${bodySections}
<footer><div class="thanks display">${L.thanks}</div><div>${escapeHtml(groom)} ${L.and} ${escapeHtml(bride)}</div></footer>
</section>`;
}

// ---------- Background music for the guest invitation ----------
// Browsers block audio until the guest taps something, so the invitation opens with a
// "tap to open" cover; the tap starts the song. A floating button lets guests mute/unmute.
// Opening screens ("tap to open"). Each style = artwork (CSS only) + the time (ms) after which the screen fades away.
// Only the chosen style's CSS is written into a guest file.
const ocDarkText = c => `.open-cover.oc-s-${c} .oc-guest{color:#fff;opacity:.92;text-shadow:0 1px 8px rgba(0,0,0,.5);}
.open-cover.oc-s-${c} .oc-names{color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.55);}
.open-cover.oc-s-${c} .oc-hint{color:#fff;opacity:.85;text-shadow:0 1px 6px rgba(0,0,0,.55);}
.open-cover.oc-s-${c} .oc-btn{background:#fff;color:var(--ink);box-shadow:0 8px 22px rgba(0,0,0,.4);}`;

const LOTUS_PETALS = [   // [closed angle, open angle, closed scale, layer tint %]
  [-14,-72,.80,40],[-7,-36,.80,40],[0,0,.80,40],[7,36,.80,40],[14,72,.80,40],
  [-10,-54,.86,58],[-3,-18,.86,58],[3,18,.86,58],[10,54,.86,58],
  [-6,-32,.92,76],[0,0,.94,76],[6,32,.92,76]
];

const COVER_STYLES = {
  door:{
    label:"ទ្វារ", finishMs:1500,
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="7" height="18" rx="1"/><rect x="13" y="3" width="7" height="18" rx="1"/><path d="M9 12v1.5M15 12v1.5"/></svg>',
    parts:c => ({ behind:'<div class="oc-leaf oc-leaf-l"></div><div class="oc-leaf oc-leaf-r"></div>' }),
    css:`.oc-s-door{background:radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent-2) 45%,var(--bg)) 0%,var(--bg) 75%);perspective:1800px;}
.oc-leaf{position:absolute;top:0;bottom:0;width:50%;z-index:2;background:linear-gradient(90deg,color-mix(in srgb,var(--accent-1) 68%,#000),var(--accent-1) 42%,color-mix(in srgb,var(--accent-1) 78%,#000));box-shadow:inset 0 0 0 5px color-mix(in srgb,var(--accent-2) 55%,transparent),inset 0 0 70px rgba(0,0,0,.4);transition:transform 1.25s cubic-bezier(.66,0,.24,1);}
.oc-leaf::before{content:"";position:absolute;inset:7% 11% 9%;border:2px solid color-mix(in srgb,var(--accent-2) 62%,transparent);border-radius:3px;box-shadow:inset 0 0 26px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.25);}
.oc-leaf::after{content:"";position:absolute;top:76%;width:9px;height:96px;margin-top:-48px;border-radius:5px;background:linear-gradient(90deg,color-mix(in srgb,var(--accent-2) 60%,#fff),var(--accent-2) 55%,color-mix(in srgb,var(--accent-2) 70%,#000));box-shadow:0 3px 8px rgba(0,0,0,.45);}
.oc-leaf-l{left:0;transform-origin:0 50%;}
.oc-leaf-l::after{right:14px;}
.oc-leaf-r{right:0;transform-origin:100% 50%;}
.oc-leaf-r::after{left:14px;}
.open-cover.opening .oc-leaf-l{transform:rotateY(-112deg);}
.open-cover.opening .oc-leaf-r{transform:rotateY(112deg);}
${ocDarkText("door")}`
  },
  curtain:{
    label:"វាំងនន", finishMs:1800,
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18"/><path d="M5 4c0 6-1 12-2 16h6c-1-4-2-10-2-16"/><path d="M19 4c0 6 1 12 2 16h-6c1-4 2-10 2-16"/></svg>',
    parts:c => ({ behind:'<div class="oc-drape oc-drape-l"></div><div class="oc-drape oc-drape-r"></div><div class="oc-valance"></div>' }),
    css:`.oc-s-curtain{background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--accent-2) 40%,var(--bg)) 0%,var(--bg) 72%);}
.oc-drape{position:absolute;top:0;bottom:0;width:50.4%;z-index:2;background:repeating-linear-gradient(90deg,rgba(0,0,0,.34) 0,rgba(0,0,0,0) 15px,rgba(255,255,255,.13) 30px,rgba(0,0,0,.34) 46px),linear-gradient(180deg,color-mix(in srgb,var(--accent-1) 88%,#fff) 0%,var(--accent-1) 40%,color-mix(in srgb,var(--accent-1) 62%,#000) 100%);transition:transform 1.6s cubic-bezier(.62,0,.28,1);}
.oc-drape::after{content:"";position:absolute;left:0;right:0;bottom:0;height:12px;background:repeating-linear-gradient(90deg,var(--accent-2) 0 3px,transparent 3px 7px);}
.oc-drape-l{left:0;transform-origin:0 50%;}
.oc-drape-r{right:0;transform-origin:100% 50%;}
.open-cover.opening .oc-drape{transform:scaleX(.15);}
.oc-valance{position:absolute;top:0;left:0;right:0;height:58px;z-index:3;background:linear-gradient(180deg,color-mix(in srgb,var(--accent-1) 60%,#000),var(--accent-1));border-bottom:4px solid var(--accent-2);box-shadow:0 6px 16px rgba(0,0,0,.4);}
.oc-valance::after{content:"";position:absolute;left:0;right:0;top:100%;height:20px;background:radial-gradient(circle at 22px 0,var(--accent-1) 20px,transparent 21px) 0 0/44px 20px repeat-x;filter:drop-shadow(0 4px 3px rgba(0,0,0,.3));}
${ocDarkText("curtain")}`
  },
  lock:{
    label:"សោ", finishMs:1750,
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    parts:c => ({
      behind:'<div class="oc-half oc-half-t"></div><div class="oc-half oc-half-b"></div>',
      top:'<div class="oc-lockbox"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="10" y="22" width="28" height="20" rx="4" fill="currentColor" fill-opacity=".15"/><path class="oc-shackle" d="M16 22v-6a8 8 0 0 1 16 0v6"/><circle cx="24" cy="31" r="2.6" fill="currentColor" stroke="none"/><path d="M24 33v4"/></svg></div>'
    }),
    css:`.oc-half{position:absolute;left:0;right:0;height:50.4%;z-index:1;background:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px) 0 0/34px 34px,linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px) 0 0/34px 34px,color-mix(in srgb,var(--accent-1) 26%,#080a0f);transition:transform .95s cubic-bezier(.72,0,.28,1) .6s;}
.oc-half-t{top:0;}
.oc-half-b{bottom:0;}
.oc-half::after{content:"";position:absolute;left:0;right:0;height:2px;background:color-mix(in srgb,var(--accent-2) 45%,#fff);box-shadow:0 0 14px color-mix(in srgb,var(--accent-2) 45%,#fff);opacity:.85;}
.oc-half-t::after{bottom:0;}
.oc-half-b::after{top:0;}
.open-cover.opening .oc-half-t{transform:translateY(-101%);}
.open-cover.opening .oc-half-b{transform:translateY(101%);}
.oc-lockbox{--lk:color-mix(in srgb,var(--accent-2) 45%,#fff);width:116px;height:116px;margin:0 0 26px;border-radius:50%;border:3px solid var(--lk);color:var(--lk);display:grid;place-items:center;box-shadow:0 0 0 8px rgba(255,255,255,.05),0 0 30px color-mix(in srgb,var(--lk) 50%,transparent);transition:border-color .3s ease,color .3s ease,box-shadow .3s ease,opacity .35s ease .62s;animation:oc-led 2.4s ease-in-out infinite;}
.oc-lockbox svg{width:56px;height:56px;overflow:visible;}
.oc-shackle{transition:transform .5s cubic-bezier(.3,1.5,.5,1);transform-box:fill-box;transform-origin:0 100%;}
.open-cover.opening .oc-lockbox{border-color:#3ddc84;color:#3ddc84;box-shadow:0 0 0 8px rgba(61,220,132,.12),0 0 36px rgba(61,220,132,.7);opacity:0;animation:none;}
.open-cover.opening .oc-shackle{transform:translateY(-5px) rotate(-38deg);}
@keyframes oc-led{0%,100%{box-shadow:0 0 0 8px rgba(255,255,255,.05),0 0 22px color-mix(in srgb,var(--lk) 40%,transparent);}50%{box-shadow:0 0 0 8px rgba(255,255,255,.08),0 0 38px color-mix(in srgb,var(--lk) 75%,transparent);}}
${ocDarkText("lock")}`
  },
  envelope:{
    label:"អំណោយ", finishMs:1900,
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="1.5"/><rect x="3" y="7" width="18" height="4" rx="1.2"/><path d="M12 7v13"/><path d="M12 7C10.3 7 8 6 8 4.2 8 3 9 2 10.2 2 12 2 12 5 12 7Z"/><path d="M12 7c1.7 0 4-1 4-2.8C16 3 15 2 13.8 2 12 2 12 5 12 7Z"/></svg>',
    parts:c => ({ mid:'<div class="oc-gift"><div class="oc-gift-glow"></div><div class="oc-gift-base"><i class="oc-gift-rv"></i></div><div class="oc-gift-heart">&#9829;</div><div class="oc-gift-lid"><i class="oc-gift-rv"></i><i class="oc-gift-rh"></i></div></div>' }),
    css:`.oc-s-envelope{background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--accent-2) 22%,transparent) 0%,transparent 62%),var(--bg);}
.oc-gift{position:relative;width:min(58vw,210px);height:min(58vw,210px);margin:0 auto 30px;perspective:900px;transition:transform .75s ease 1.1s,opacity .5s ease 1.25s;}
.oc-gift-glow{position:absolute;inset:-25%;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent-2) 40%,transparent),transparent 68%);opacity:0;transition:opacity .5s ease .5s;}
.open-cover.opening .oc-gift-glow{opacity:1;}
.oc-gift-base{position:absolute;left:2%;right:2%;bottom:0;height:68%;border-radius:6px;overflow:hidden;background:linear-gradient(160deg,color-mix(in srgb,var(--accent-1) 88%,#fff),var(--accent-1) 55%,color-mix(in srgb,var(--accent-1) 68%,#000));box-shadow:0 16px 30px rgba(0,0,0,.28);}
.oc-gift-heart{position:absolute;left:50%;bottom:20%;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--accent-2) 72%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;line-height:1;box-shadow:0 0 26px color-mix(in srgb,var(--accent-2) 75%,transparent);opacity:0;transform:scale(.35);transition:opacity .55s ease .55s,transform .65s ease .55s;z-index:1;}
.open-cover.opening .oc-gift-heart{opacity:1;transform:scale(1);}
.oc-gift-lid{position:absolute;left:-3%;right:-3%;top:0;height:32%;border-radius:6px 6px 2px 2px;overflow:hidden;background:linear-gradient(160deg,color-mix(in srgb,var(--accent-2) 85%,#fff),var(--accent-2) 55%,color-mix(in srgb,var(--accent-2) 68%,#000));box-shadow:0 8px 16px rgba(0,0,0,.25);transform-origin:50% 100%;transition:transform 1s cubic-bezier(.5,0,.22,1) .1s;z-index:3;}
.oc-gift-rv{position:absolute;top:0;bottom:0;left:50%;width:15%;margin-left:-7.5%;background:color-mix(in srgb,#fff 55%,transparent);}
.oc-gift-rh{position:absolute;left:0;right:0;top:35%;height:22%;background:color-mix(in srgb,#fff 55%,transparent);}
.open-cover.opening .oc-gift-lid{transform:rotateX(-122deg) translateY(-4%);}
.open-cover.opening .oc-gift{transform:scale(1.5);opacity:0;}
@media(max-height:640px){.oc-gift{width:170px;height:170px;}}`
  },
  lotus:{
    label:"ផ្កាឈូក", finishMs:1900,
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20c-3-2-4-6-3-10 1 2 2 3 3 4 1-1 2-2 3-4 1 4 0 8-3 10z"/><path d="M12 20c-5 0-8-3-9-7 3 0 5 1 6.5 3"/><path d="M12 20c5 0 8-3 9-7-3 0-5 1-6.5 3"/></svg>',
    parts:c => ({ mid:'<div class="oc-lotus">' + LOTUS_PETALS.map(pt => `<svg class="oc-petal" viewBox="0 0 64 118" aria-hidden="true" style="--a0:${pt[0]}deg;--a1:${pt[1]}deg;--s0:${pt[2]};--tint:${pt[3]}%"><path d="M32 117C4 92 4 34 32 1C60 34 60 92 32 117Z"/></svg>`).join("") + '<b class="oc-core"></b><em class="oc-water"></em></div>' }),
    css:`.oc-s-lotus{background:radial-gradient(ellipse at 50% 46%,color-mix(in srgb,var(--accent-2) 24%,transparent) 0%,transparent 60%),var(--bg);}
.oc-lotus{position:relative;width:250px;height:200px;margin:4px auto 24px;transition:transform 1s cubic-bezier(.6,0,.3,1) 1s,opacity .6s ease 1.5s;}
.oc-petal{position:absolute;left:50%;bottom:16px;width:64px;height:118px;margin-left:-32px;transform-origin:50% 100%;transform:rotate(var(--a0)) scale(var(--s0));transition:transform 1.05s cubic-bezier(.3,1.25,.4,1);overflow:visible;}
.oc-petal path{fill:color-mix(in srgb,var(--accent-1) var(--tint),#fff);stroke:rgba(255,255,255,.75);stroke-width:1.5;}
.open-cover.opening .oc-petal{transform:rotate(var(--a1)) scale(1);}
.oc-core{position:absolute;left:50%;bottom:14px;width:40px;height:40px;margin-left:-20px;border-radius:50%;background:radial-gradient(circle,#fff6cf 0%,var(--accent-2) 70%);box-shadow:0 0 30px color-mix(in srgb,var(--accent-2) 80%,transparent);opacity:0;transform:scale(.3);transition:opacity .6s ease .5s,transform .8s ease .5s;}
.open-cover.opening .oc-core{opacity:1;transform:scale(1);}
.open-cover.opening .oc-lotus{transform:scale(7);opacity:0;}
.oc-water{position:absolute;left:6%;right:6%;bottom:0;height:22px;border-radius:50%;border:2px solid color-mix(in srgb,var(--accent-1) 35%,transparent);}
@media(max-height:640px){.oc-lotus{transform-origin:50% 100%;height:170px;}}`
  },
  book:{
    label:"ក្រណាត់រមូរ", finishMs:1900,
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="3" rx="1.5"/><rect x="3" y="17" width="18" height="3" rx="1.5"/><path d="M6 7v10M18 7v10"/></svg>',
    parts:c => ({
      mid:'<div class="oc-scroll"><div class="oc-scroll-rod oc-scroll-rod-t"></div><div class="oc-scroll-paper"><i></i><b>&#9829;</b><i></i></div><div class="oc-scroll-rod oc-scroll-rod-b"></div></div>'
    }),
    css:`.oc-s-book{background:radial-gradient(ellipse at 50% 42%,color-mix(in srgb,var(--accent-2) 20%,transparent) 0%,transparent 62%),var(--bg);}
.oc-scroll{position:relative;display:flex;flex-direction:column;align-items:center;width:min(72vw,260px);margin:0 auto 28px;transition:transform .8s ease 1.15s,opacity .5s ease 1.3s;}
.oc-scroll-rod{position:relative;z-index:3;width:100%;height:16px;border-radius:8px;flex:0 0 auto;background:linear-gradient(180deg,color-mix(in srgb,var(--accent-2) 88%,#fff),var(--accent-2) 55%,color-mix(in srgb,var(--accent-2) 68%,#000));box-shadow:0 4px 10px rgba(0,0,0,.3);transition:transform .95s cubic-bezier(.5,0,.22,1);}
.oc-scroll-rod::before,.oc-scroll-rod::after{content:"";position:absolute;top:-3px;bottom:-3px;width:12px;border-radius:50%;background:color-mix(in srgb,var(--accent-2) 55%,#000);}
.oc-scroll-rod::before{left:-6px;}
.oc-scroll-rod::after{right:-6px;}
.open-cover.opening .oc-scroll-rod-t{transform:translateY(-16px);}
.open-cover.opening .oc-scroll-rod-b{transform:translateY(16px);}
.oc-scroll-paper{width:90%;min-height:150px;margin:-4px 0;background:#fbf7ee;box-shadow:0 10px 24px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;gap:9px;color:var(--accent-2);transform:scaleY(.04);transform-origin:50% 50%;transition:transform 1.05s cubic-bezier(.5,0,.2,1) .12s;}
.oc-scroll-paper i{display:block;height:2px;width:44px;background:linear-gradient(90deg,transparent,var(--accent-2),transparent);opacity:0;transition:opacity .4s ease .95s;}
.oc-scroll-paper b{font-size:22px;line-height:1;font-weight:400;opacity:0;transition:opacity .4s ease .95s;}
.open-cover.opening .oc-scroll-paper{transform:scaleY(1);}
.open-cover.opening .oc-scroll-paper i,.open-cover.opening .oc-scroll-paper b{opacity:1;}
.open-cover.opening .oc-scroll{transform:scale(1.4);opacity:0;}
@media(max-height:640px){.oc-scroll{width:220px;}.oc-scroll-paper{min-height:120px;}}`
  }
};

const OC_BASE_CSS = `
.open-cover{position:fixed;inset:0;z-index:300;overflow:hidden;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.open-cover.finish{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .6s ease,visibility .6s;}
.oc-inner{position:relative;z-index:5;height:100%;max-width:440px;margin:0 auto;padding:28px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.oc-fade{transition:opacity .35s ease,transform .35s ease;}
.open-cover.opening .oc-fade{opacity:0 !important;transform:translateY(-6px);pointer-events:none;}   /* !important: the dark styles set their own text opacity */
.oc-guest{margin:0 0 12px;font-size:15px;color:var(--ink);opacity:.85;line-height:1.7;}
.oc-guest span{font-family:var(--body-font-en);font-style:italic;opacity:.8;}
.oc-names{font-size:clamp(28px,8vw,44px);line-height:1.5;margin:0 0 28px;}
.oc-btn{border:none;cursor:pointer;background:var(--accent-1);color:#fff;border-radius:999px;padding:14px 30px;display:inline-flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 8px 22px color-mix(in srgb,var(--accent-1) 35%,transparent);font-family:var(--body-font);animation:oc-pulse 2.6s ease-in-out infinite;}
.open-cover.opening .oc-btn{animation:none;}
.oc-btn .oc-km{font-size:16px;font-weight:600;line-height:1.6;}
.oc-btn .oc-en{font-size:12.5px;opacity:.9;font-family:var(--body-font-en);font-style:italic;}
.oc-hint{margin:18px 0 0;font-size:13px;color:var(--ink);opacity:.65;line-height:1.7;}
.oc-hint span{font-family:var(--body-font-en);font-style:italic;display:block;}
.oc-hint + .oc-hint{margin-top:8px;}
.oc-btn:focus-visible,.music-btn:focus-visible{outline:2px solid var(--accent-2);outline-offset:3px;}
body.oc-noscroll{overflow:hidden;}
@keyframes oc-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.045);}}
@media(prefers-reduced-motion:reduce){.open-cover *,.open-cover.finish{transition:none !important;animation:none !important;}}
`;

const MUSIC_BTN_CSS = `
.music-btn{position:fixed;right:16px;bottom:18px;z-index:100;width:44px;height:44px;padding:0;border-radius:50%;border:1px solid var(--border);background:color-mix(in srgb, var(--card) 15%, transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:var(--accent-1);box-shadow:0 4px 14px rgba(0,0,0,.14);display:flex;align-items:center;justify-content:center;cursor:pointer;}
.music-btn svg{width:20px;height:20px;}
.music-btn .ico-off{display:none;}
.music-btn:not(.on) .ico-on{display:none;}
.music-btn:not(.on) .ico-off{display:block;}
.music-btn.on{background:color-mix(in srgb, var(--accent-1) 25%, transparent);color:#fff;}
`;

// ---------- Opening screen + background music for the guest invitation ----------
// Browsers block audio until the guest taps something, so a song always comes with the opening screen:
// the tap starts the song. A floating button lets guests mute/unmute. The opening screen can also be
// shown without a song (state.coverAlways).
function buildMusicParts(s){
  const music = (musicAsset && musicAsset.dataUrl) ? musicAsset : null;
  if(!music && !s.coverAlways) return { css:"", html:"", js:"" };

  const key = hasOwn(COVER_STYLES, s.openStyle) ? s.openStyle : "door";
  const cfg = COVER_STYLES[key];
  const names = [s.groomName || s.groomNameEn, s.brideName || s.brideNameEn].filter(Boolean).map(escapeHtml).join(" & ");
  const g = s.__guestName ? escapeHtml(s.__guestName) : "";
  const previewAttr = s.__preview ? ' data-preview="1"' : "";
  const p = cfg.parts({ names });

  const namesHtml = (names && p.names !== false) ? `<p class="oc-names display oc-fade">${names}</p>` : "";
  const btnHtml = g
    ? `<button class="oc-btn oc-fade" id="openBtn" type="button"><span class="oc-km">ជូនចំពោះ ${g}</span><span class="oc-en">Dear ${g}</span></button>`
    : `<button class="oc-btn oc-fade" id="openBtn" type="button"><span class="oc-km">ចុចដើម្បីបើកធៀបអញ្ជើញ</span><span class="oc-en">Tap to open your invitation</span></button>`;
  const hintHtml = (g ? `<p class="oc-hint oc-fade">ចុចដើម្បីបើកធៀបអញ្ជើញ<span>Tap to open your invitation</span></p>` : "")
    + (music ? `<p class="oc-hint oc-fade">សូមបើកសំឡេងដើម្បីស្តាប់ចម្រៀង<span>Turn your sound on for the music</span></p>` : "");

  const css = (music ? MUSIC_BTN_CSS : "") + OC_BASE_CSS + cfg.css;

  const musicHtml = music ? `
<audio id="bgm" src="${music.dataUrl}" loop preload="metadata"></audio>
<button class="music-btn" id="musicBtn" type="button" aria-pressed="false" aria-label="Music" title="ចម្រៀង / Music">
  <svg class="ico-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  <svg class="ico-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
</button>` : "";
  const html = musicHtml + `
<div class="open-cover oc-s-${key}" id="openCover" role="dialog" aria-modal="true" aria-label="Open invitation"${previewAttr}>${p.behind || ""}<div class="oc-inner">${p.top || ""}${namesHtml}${p.mid || ""}${btnHtml}${hintHtml}</div></div>`;

  const js = `
var ocEl=document.getElementById('openCover');
var bgm=document.getElementById('bgm');
var playMusic=function(){};
if(bgm){
  var mBtn=document.getElementById('musicBtn');
  var wasPlaying=false;
  var baseVol=0.7;
  var fadeVol=function(){
    var d=bgm.duration, ct=bgm.currentTime, v=baseVol;
    if(d && isFinite(d) && d>8){
      var tail=d-ct;
      if(tail>=0 && tail<3){ v=baseVol*(tail/3); }   // tail<0: browser's duration estimate was short, keep playing
      else if(ct<2){ v=baseVol*Math.min(1,0.15+0.85*ct/2); }
    }
    try{ bgm.volume=Math.max(0,Math.min(1,v)); }catch(e){}
  };
  fadeVol();
  bgm.addEventListener('timeupdate',fadeVol);
  var syncMusic=function(){
    if(!mBtn) return;
    var on=!bgm.paused;
    mBtn.classList.toggle('on',on);
    mBtn.setAttribute('aria-pressed',on?'true':'false');
  };
  playMusic=function(){
    try{ var pr=bgm.play(); if(pr&&pr.catch){ pr.catch(function(){ syncMusic(); }); } }catch(e){}
  };
  bgm.addEventListener('play',syncMusic);
  bgm.addEventListener('pause',syncMusic);
  syncMusic();
  if(mBtn){ mBtn.addEventListener('click',function(){ if(bgm.paused){ playMusic(); } else { bgm.pause(); } }); }
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){ wasPlaying=!bgm.paused; bgm.pause(); }
    else if(wasPlaying){ wasPlaying=false; playMusic(); }
  });
}
if(ocEl){
  var seenKey='wib-cover-seen';
  var isPreview=ocEl.getAttribute('data-preview')==='1';
  var alreadySeen=false;
  if(isPreview){ try{ alreadySeen=sessionStorage.getItem(seenKey)==='1'; }catch(e){} }
  if(alreadySeen){
    ocEl.parentNode.removeChild(ocEl);
  }else{
    document.body.classList.add('oc-noscroll');
    var opened=false, reduce=false;
    try{ reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    ocEl.addEventListener('click',function(){
      if(opened) return;
      opened=true;
      playMusic();
      if(isPreview){ try{ sessionStorage.setItem(seenKey,'1'); }catch(e){} }
      ocEl.classList.add('opening');
      setTimeout(function(){
        ocEl.classList.add('finish');
        document.body.classList.remove('oc-noscroll');
        setTimeout(function(){ if(ocEl.parentNode){ ocEl.parentNode.removeChild(ocEl); } },650);
      },reduce?0:${cfg.finishMs});
    });
  }
}
`;
  return { css, html, js };
}

// Decorative Kbach Khmer border, fixed to the viewport (position:fixed) so it stays anchored to the
// screen edges while the invitation content scrolls underneath it. pointer-events:none keeps it from
// blocking taps/scroll.
//
// Rebuilt from an earlier version that stretched one big SVG (viewBox "0 0 360 640",
// preserveAspectRatio="none") to fill the whole screen: on any window that wasn't exactly that 360:640
// portrait ratio (i.e. almost every desktop browser, and most phones too), that squashed every lotus and
// vine into a lopsided oval and made the border lines thicker on one side than the other. Corners are now
// four independent small SVGs at a fixed pixel size — same shape at any window size — and the repeating
// motifs along an edge are small tiled background images (CSS background-repeat), which repeat instead of
// stretching, the way a real border pattern would. Colours are the theme's own hex values (not CSS
// variables): a background-image data URI is a separate mini-document that can't see the page's CSS, so
// the exact colour has to be baked in when the invitation is generated.
// ---- Flower shapes: 5 species drawn as raw path data (no <use>, so each mini-SVG document works standalone) ----
// ---- Flower shapes (5 species — same artwork, reused as a background watermark instead of a border) ----
const KF_PETAL_PATH  = "M0,0 C-5,-8 -5,-18 0,-26 C5,-18 5,-8 0,0 Z";
const KF_RPETAL_PATH = "M0,0 C-3,-10 -2,-24 0,-32 C2,-24 3,-10 0,0 Z";
const KF_LEAF_PATH   = "M0,0 C10,-4 18,-14 14,-26 C4,-20 -4,-8 0,0 Z";

function kfLotus(a1, bg){
  return `<path d="${KF_PETAL_PATH}" fill="${a1}"/>
<path d="${KF_PETAL_PATH}" fill="${a1}" opacity=".9" transform="rotate(35)"/>
<path d="${KF_PETAL_PATH}" fill="${a1}" opacity=".9" transform="rotate(-35)"/>
<path d="${KF_PETAL_PATH}" fill="${a1}" opacity=".75" transform="rotate(70)"/>
<path d="${KF_PETAL_PATH}" fill="${a1}" opacity=".75" transform="rotate(-70)"/>
<circle cx="0" cy="-2" r="2.6" fill="${bg}" stroke="${a1}" stroke-width="1"/>`;
}
function kfRomduol(a2, bg){
  return [0,72,144,216,288].map(d => `<path d="${KF_RPETAL_PATH}" fill="${a2}" transform="rotate(${d})"/>`).join("")
    + `<circle r="2.6" fill="${bg}"/>`;
}
function kfChampa(a1, a2){
  return [0,70,140,210,280].map((d,i) => `<path d="${KF_PETAL_PATH}" fill="${a1}" opacity="${(1-i*0.08).toFixed(2)}" transform="rotate(${d}) scale(1.3,0.85)"/>`).join("")
    + `<circle r="1.8" fill="${a2}"/>`;
}
function kfReachpreuk(a1){
  return `<path d="M0,0 C2,10 2,20 0,30" fill="none" stroke="${a1}" stroke-width="1"/>
<circle cx="0" cy="4" r="3" fill="${a1}"/>
<circle cx="1.3" cy="12" r="2.5" fill="${a1}" opacity=".9"/>
<circle cx="-1" cy="19" r="2.1" fill="${a1}" opacity=".8"/>
<circle cx="1" cy="25" r="1.7" fill="${a1}" opacity=".7"/>
<circle cx="0" cy="30" r="1.3" fill="${a1}" opacity=".6"/>`;
}
function kfKngork(a1){
  return [0,35,-35,70,-70].map(d => `<path d="${KF_PETAL_PATH}" fill="${a1}" opacity=".85" transform="rotate(${d}) scale(1.05,1.5)"/>`).join("")
    + `<line x1="0" y1="0" x2="3" y2="-32" stroke="${a1}" stroke-width=".8"/>
<line x1="0" y1="0" x2="-3" y2="-30" stroke="${a1}" stroke-width=".8"/>
<circle cx="3" cy="-32" r="1" fill="${a1}"/><circle cx="-3" cy="-30" r="1" fill="${a1}"/>`;
}
function kfFlower(idx, a1, a2, bg){
  const fns = [() => kfLotus(a1,bg), () => kfRomduol(a2,bg), () => kfChampa(a1,a2), () => kfReachpreuk(a1), () => kfKngork(a2)];
  return fns[((idx % fns.length) + fns.length) % fns.length]();
}
function kfSprig(a1, a2, bg, seed){
  const leaves = [-40,40,100,170].map((ang,i) =>
    `<path d="${KF_LEAF_PATH}" fill="${a1}" opacity=".5" transform="rotate(${ang}) translate(0,${2+i*2}) scale(${(0.9+((seed+i)%3)*0.15).toFixed(2)})"/>`
  ).join("");
  return leaves
    + `<g>${kfFlower(seed, a1, a2, bg)}</g>`
    + `<g transform="translate(9,6) scale(.55) rotate(15)">${kfFlower(seed+2, a1, a2, bg)}</g>`;
}

function kfWatermarkTileUri(inner, w, h){
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// Each style = one seamlessly-tiling pattern + a slow drift (dx/dy exactly one tile length, so the loop never jumps)
function buildKbachFrameOverlay(styleId, t){
  if(!styleId || styleId === "none" || !hasOwn(KBACH_FRAME_STYLES, styleId)) return "";
  const a1 = t.accent1, a2 = t.accent2, bg = t.bg;
  let w = 140, h = 140, dx = 140, dy = 140, dur = 55, inner = "";

  if(styleId === "diagbranch"){          // ស្តើង — drift ដេក
    w = h = 150; dx = 150; dy = 150; dur = 60;
    inner = `<g transform="translate(30,30) rotate(-15) scale(.7)">${kfSprig(a1,a2,bg,0)}</g>
<g transform="translate(105,95) rotate(20) scale(.55)">${kfSprig(a1,a2,bg,3)}</g>`;
  } else if(styleId === "fullwrap"){     // ក្រាស់ — mix ច្រើនប្រភេទ
    w = h = 110; dx = 110; dy = 110; dur = 50;
    inner = `<g transform="translate(20,20) scale(.6)">${kfSprig(a1,a2,bg,1)}</g>
<g transform="translate(75,35) rotate(40) scale(.45)">${kfSprig(a1,a2,bg,3)}</g>
<g transform="translate(45,80) rotate(-25) scale(.5)">${kfSprig(a1,a2,bg,4)}</g>`;
  } else if(styleId === "onecorner"){    // ស្តើងបំផុត — tile ធំ
    w = h = 220; dx = 220; dy = 220; dur = 75;
    inner = `<g transform="translate(40,50) rotate(10) scale(.6)">${kfSprig(a1,a2,bg,2)}</g>`;
  } else if(styleId === "bottomgarland"){ // ហូរដេក
    w = 130; h = 60; dx = 130; dy = 0; dur = 40;
    inner = `<path d="M0,30 Q32,46 65,30 T130,30" fill="none" stroke="${a1}" stroke-width="1" opacity=".5"/>
<g transform="translate(20,30) scale(.5)">${kfSprig(a1,a2,bg,2)}</g>
<g transform="translate(95,30) scale(.45) rotate(20)">${kfSprig(a1,a2,bg,4)}</g>`;
  } else if(styleId === "sidebranch"){    // ហូរឈរ
    w = 60; h = 130; dx = 0; dy = 130; dur = 40;
    inner = `<path d="M30,0 Q46,32 30,65 T30,130" fill="none" stroke="${a1}" stroke-width="1" opacity=".5"/>
<g transform="translate(30,20) scale(.5)">${kfSprig(a1,a2,bg,1)}</g>
<g transform="translate(30,95) scale(.45) rotate(-20)">${kfSprig(a1,a2,bg,3)}</g>`;
  } else if(styleId === "scatter"){       // កក្រាយសេរី — drift ដេក
    w = h = 180; dx = 180; dy = 180; dur = 70;
    inner = [0,1,2].map(i => {
      const x = 20 + i*55, y = 30 + (i%2)*90;
      return `<g transform="translate(${x},${y}) rotate(${i*33}) scale(${(0.3+i*0.08).toFixed(2)})">${kfSprig(a1,a2,bg,i)}</g>`;
    }).join("");
  }

  const uri = kfWatermarkTileUri(inner, w, h);
  return `<div class="kbach-watermark" style="background-image:url('${uri}');background-size:${w}px ${h}px;--kf-dx:${dx}px;--kf-dy:${dy}px;--kf-dur:${dur}s;" aria-hidden="true"></div>`;
}

function renderInvitation(s){
  const t = THEMES[s.theme];
  const fk = FONT_KM[hasOwn(FONT_KM, s.fontKm) ? s.fontKm : (THEME_FONT_DEFAULTS[s.theme] || THEME_FONT_DEFAULTS.gold)[0]];
  const fe = FONT_EN[hasOwn(FONT_EN, s.fontEn) ? s.fontEn : (THEME_FONT_DEFAULTS[s.theme] || THEME_FONT_DEFAULTS.gold)[1]];
  const targetIso = (s.eventDate && s.startTime) ? `${s.eventDate}T${s.startTime}:00+07:00` : "";
  const kmSection = buildSection(s, t, "km");
  const enSection = buildSection(s, t, "en");
  const LKM = LABELS.km, LEN = LABELS.en;
  const bodyClass = s.__guestName ? " class=\"guest-mode\"" : "";
  const mp = buildMusicParts(s);

  return `<!DOCTYPE html><html lang="km"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(s.groomName)} & ${escapeHtml(s.brideName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Moul&family=Moulpali&family=Battambang:wght@400;700&family=Suwannaphum&family=Angkor&family=Bokor&family=Kantumruy+Pro:wght@300;400;500;600;700&family=Great+Vibes&family=Parisienne&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Tangerine:wght@400;700&family=Marck+Script&display=swap" rel="stylesheet">
<style>
:root{--bg:${t.bg};--ink:${t.ink};--accent-1:${t.accent1};--accent-2:${t.accent2};--card:${t.card};--border:${t.border};--radius:${t.radius};--display-font:${fk.display};--body-font:${fk.body};--display-font-en:${fe.display};--body-font-en:${fe.body};}
*{box-sizing:border-box}
html{background:var(--bg);}
body{margin:0;color:var(--ink);font-family:var(--body-font);line-height:1.8;-webkit-font-smoothing:antialiased;}
.kbach-watermark{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.12;background-repeat:repeat;animation:kf-drift var(--kf-dur,55s) linear infinite;}
@keyframes kf-drift{from{background-position:0 0;}to{background-position:var(--kf-dx,140px) var(--kf-dy,140px);}}
@media(prefers-reduced-motion:reduce){.kbach-watermark{animation:none !important;}}
.display{font-family:var(--display-font);color:var(--accent-1);}
.lang-en{font-family:var(--body-font-en);font-style:italic;}
.lang-en .display{font-family:var(--display-font-en);font-style:normal;}
.lang-en .hero-date,.lang-en .tl-time,.lang-en .contact-phone,.lang-en .map-btn,.lang-en .cd-label{font-style:normal;}
.wrap{max-width:680px;margin:0 auto;padding:0 24px;}
.hero{padding:52px 24px 36px;text-align:center;background:radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent-1) 12%, transparent) 0%, transparent 60%), var(--bg);}
.eyebrow{font-size:17px;color:var(--ink);opacity:.75;margin:0 0 16px;}
.guest-line{position:sticky;top:0;z-index:70;display:block;width:100%;margin:0;padding:13px 20px;font-size:15px;font-weight:700;letter-spacing:.03em;text-align:center;color:#fff;background:linear-gradient(90deg, var(--accent-1), var(--accent-2));box-shadow:0 4px 16px rgba(0,0,0,.2);font-style:normal;}
.lang-en .guest-line{font-style:normal;}
.names{font-size:clamp(36px,10vw,64px);line-height:1.4;margin:0;}
.names .amp{display:block;font-family:var(--body-font);font-size:0.4em;color:var(--accent-2);margin:6px 0;}
.lang-en .names .amp{font-family:var(--body-font-en);font-style:italic;}
.hero-date{margin-top:14px;font-size:19px;color:var(--accent-1);}
.hero.has-cover{padding-top:150px;padding-bottom:100px;min-height:clamp(440px,85vh,720px);display:flex;flex-direction:column;justify-content:center;}
.hero.has-cover .eyebrow{color:#fff;opacity:.92;text-shadow:0 2px 10px rgba(0,0,0,.55);}
.hero.has-cover .names{color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.55), 0 1px 4px rgba(0,0,0,.85);}
.hero.has-cover .names .amp{color:var(--accent-2);}
.hero.has-cover .hero-date{color:#fff;opacity:.95;text-shadow:0 2px 10px rgba(0,0,0,.55);}
section{padding:30px 0;}
.lang-section{padding:0;}
.section-title{font-size:30px;text-align:center;margin:0 0 4px;}
.section-sub{text-align:center;color:var(--ink);opacity:.7;font-size:15px;margin:0 0 18px;}
.divider{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 auto;max-width:680px;padding:0 24px;}
.divider .rule{height:1px;width:56px;background:linear-gradient(90deg,transparent,var(--accent-2),transparent);}
.welcome{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:26px 32px;text-align:center;}
.welcome p{font-size:18px;margin:0;}
.hosts{margin-top:14px;font-size:18px;color:var(--accent-1);font-weight:600;}
.countdown{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;}
.cd-unit{width:76px;padding:16px 0;text-align:center;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);}
.cd-num{font-size:26px;font-weight:700;color:var(--accent-1);font-variant-numeric:tabular-nums;font-style:normal;}
.cd-label{font-size:12px;color:var(--ink);opacity:.7;margin-top:3px;}
.timeline{position:relative;padding-left:26px;border-left:1px solid var(--border);}
.tl-item{position:relative;padding-bottom:28px;}
.tl-item:last-child{padding-bottom:0;}
.tl-item::before{content:"";position:absolute;left:-31px;top:4px;width:8px;height:8px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 0 4px var(--bg);}
.tl-time{font-size:14.5px;color:var(--accent-2);font-weight:600;margin-bottom:3px;font-style:normal;}
.tl-name{font-size:18px;margin:0;}
.frame{border:1px solid var(--border);background:color-mix(in srgb, var(--accent-1) 8%, var(--bg));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--ink);opacity:.6;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,.09);transition:transform .45s cubic-bezier(.22,1,.36,1), box-shadow .45s ease;}
.frame.photo{opacity:1;}
.frame.photo:hover{transform:translateY(-5px) scale(1.02);box-shadow:0 16px 34px rgba(0,0,0,.18);}
.frame img{width:100%;height:100%;object-fit:cover;object-position:center 25%;display:block;transition:transform .6s cubic-bezier(.22,1,.36,1);}
.frame.photo:hover img{transform:scale(1.07);}
.frame svg{width:28px;height:28px;}
.frame span{font-size:11.5px;font-style:normal;}
.gallery-style-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
.gallery-style-grid .gallery-item.wide{grid-column:span 2;}
.gallery-style-grid .frame{aspect-ratio:4/3;border-radius:var(--radius);padding:0;}
.gallery-style-grid .gallery-item.wide .frame{aspect-ratio:16/9;}
.gallery-style-classic{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
.gallery-style-classic .frame{aspect-ratio:4/3;border-radius:var(--radius);padding:0;}
.gallery-style-polaroid{display:flex;flex-wrap:wrap;justify-content:center;gap:14px 8px;padding:6px 4px;}
.gallery-style-polaroid .gallery-item{width:calc(33.333% - 8px);}
.gallery-style-polaroid .frame{aspect-ratio:1/1.05;border-radius:2px;padding:10px 10px 24px;background:var(--card);box-shadow:0 8px 18px rgba(0,0,0,.1);}
.gallery-style-polaroid .frame.photo:hover{transform:translateY(-5px) scale(1.03);}
.gallery-style-polaroid .gallery-item.rot-0 .frame{transform:rotate(-3deg);}
.gallery-style-polaroid .gallery-item.rot-1 .frame{transform:rotate(2.5deg);}
.gallery-style-polaroid .gallery-item.rot-2 .frame{transform:rotate(-1.5deg);}
.gallery-style-polaroid .gallery-item.rot-0 .frame.photo:hover{transform:rotate(-3deg) translateY(-5px) scale(1.04);}
.gallery-style-polaroid .gallery-item.rot-1 .frame.photo:hover{transform:rotate(2.5deg) translateY(-5px) scale(1.04);}
.gallery-style-polaroid .gallery-item.rot-2 .frame.photo:hover{transform:rotate(-1.5deg) translateY(-5px) scale(1.04);}
@media(max-width:480px){.gallery-style-polaroid .gallery-item{width:calc(50% - 8px);}}
.gallery-style-square{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;}
.gallery-style-square .frame{aspect-ratio:1/1;border-radius:0;border:none;box-shadow:none;padding:0;}
.gallery-style-square .frame.photo:hover{transform:none;box-shadow:none;}
@media(max-width:480px){.gallery-style-square{grid-template-columns:repeat(2,1fr);}}
.gallery-style-mosaic{column-count:2;column-gap:8px;}
.gallery-style-mosaic .gallery-item{display:inline-block;width:100%;break-inside:avoid;margin-bottom:8px;}
.gallery-style-mosaic .frame{border-radius:calc(var(--radius) + 8px);padding:0;border-width:2px;position:relative;}
.gallery-style-mosaic .frame::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--accent-2) 55%, transparent);pointer-events:none;}
.gallery-style-mosaic .gallery-item:nth-child(3n+1) .frame{aspect-ratio:3/4;}
.gallery-style-mosaic .gallery-item:nth-child(3n+2) .frame{aspect-ratio:1/1;}
.gallery-style-mosaic .gallery-item:nth-child(3n+3) .frame{aspect-ratio:4/5;}
.venue-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:36px;text-align:center;}
.venue-name{font-size:25px;margin:0 0 8px;}
.venue-addr{color:var(--ink);opacity:.75;font-size:16px;margin:0 0 16px;}
.map-btn{display:inline-block;padding:12px 26px;border-radius:999px;background:var(--accent-1);color:#fff;text-decoration:none;font-size:14px;font-style:normal;}
.contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;}
.contact-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:22px;text-align:center;}
.contact-name{font-size:17px;margin:0 0 6px;}
.contact-phone{display:inline-block;color:var(--accent-1);font-weight:600;text-decoration:none;font-size:16.5px;font-style:normal;}
footer{text-align:center;padding:30px 24px 36px;color:var(--ink);opacity:.75;font-size:15px;}
footer .thanks{font-size:22px;color:var(--accent-1);opacity:1;margin-bottom:6px;}
.lang-toggle{position:fixed;top:16px;right:16px;z-index:100;display:flex;background:color-mix(in srgb, var(--card) 15%, transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:999px;padding:4px;box-shadow:0 4px 14px rgba(0,0,0,.14);}
.lang-toggle button{border:none;background:none;padding:8px 16px;border-radius:999px;font-size:13px;cursor:pointer;color:var(--ink);font-family:'Kantumruy Pro',sans-serif;font-style:normal;}
.lang-toggle button.active{background:color-mix(in srgb, var(--accent-1) 25%, transparent);color:#fff;}
body.guest-mode .lang-toggle{top:62px;}
.fx-toggle{position:fixed;top:16px;left:16px;z-index:100;display:flex;gap:2px;background:color-mix(in srgb, var(--card) 15%, transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:999px;padding:4px;box-shadow:0 4px 14px rgba(0,0,0,.14);}
.fx-toggle button{border:none;background:none;width:32px;height:32px;border-radius:50%;font-size:15px;line-height:1;cursor:pointer;color:var(--ink);display:flex;align-items:center;justify-content:center;font-style:normal;}
.fx-toggle button.active{background:color-mix(in srgb, var(--accent-1) 25%, transparent);color:#fff;}
body.guest-mode .fx-toggle{top:62px;}
@media(max-width:480px){.hero{padding:40px 18px 30px;}.welcome{padding:22px 20px;}.lang-toggle{top:10px;right:10px;}.lang-toggle button{padding:7px 12px;font-size:12px;}body.guest-mode .lang-toggle{top:56px;}.fx-toggle{top:10px;left:10px;}.fx-toggle button{width:28px;height:28px;font-size:13px;}body.guest-mode .fx-toggle{top:56px;}}
${mp.css}</style></head><body${bodyClass}>
${buildKbachFrameOverlay(s.kbachFrame, t)}
<div class="lang-toggle">
  <button id="btn-km" class="active" type="button">${LKM.toggleKm}</button>
  <button id="btn-en" type="button">${LEN.toggleEn}</button>
</div>
<div class="fx-toggle" id="fxToggle">${Object.keys(EFFECTS).map(key => `<button data-fx="${key}" type="button" title="${escapeHtml(EFFECTS[key].label)}">${EFFECTS[key].icon}</button>`).join("")}</div>
${mp.html}
${kmSection}
${enSection}
<script>(function(){
var target=${targetIso ? JSON.stringify(targetIso).replace(/</g,"\\u003c") : "null"};
var t=target?new Date(target).getTime():0;
function pad(n){return String(n).padStart(2,"0");}
var messages={km:"${LKM.congrats}",en:"${LEN.congrats}"};
function tick(){
  if(!t){return;}
  var diff=t-Date.now();
  ["km","en"].forEach(function(lang){
    var el=document.getElementById("countdown-"+lang);
    if(!el) return;
    if(diff<=0){
      el.innerHTML='<div class="cd-unit" style="width:auto;padding:16px 26px;"><div class="cd-num" style="font-size:18px;">'+messages[lang]+'</div></div>';
      return;
    }
    document.getElementById("cd-d-"+lang).textContent=pad(Math.floor(diff/86400000));
    document.getElementById("cd-h-"+lang).textContent=pad(Math.floor((diff%86400000)/3600000));
    document.getElementById("cd-m-"+lang).textContent=pad(Math.floor((diff%3600000)/60000));
    document.getElementById("cd-s-"+lang).textContent=pad(Math.floor((diff%60000)/1000));
  });
  if(diff<=0){clearInterval(timer);}
}
tick();var timer=setInterval(tick,1000);

try{
  var guestParams=new URLSearchParams(window.location.search);
  var guestName=guestParams.get('to');
  if(guestName){
    var gk=document.getElementById('guestLine-km');
    var ge=document.getElementById('guestLine-en');
    if(gk){ gk.textContent='ជូនចំពោះ '+guestName; gk.style.display='block'; }
    if(ge){ ge.textContent='Dear '+guestName+','; ge.style.display='block'; }
    document.body.classList.add('guest-mode');
  }
}catch(e){}

function setLang(lang){
  document.getElementById("section-km").style.display = lang==="km" ? "block" : "none";
  document.getElementById("section-en").style.display = lang==="en" ? "block" : "none";
  document.getElementById("btn-km").classList.toggle("active", lang==="km");
  document.getElementById("btn-en").classList.toggle("active", lang==="en");
}
document.getElementById("btn-km").addEventListener("click", function(){ setLang("km"); });
document.getElementById("btn-en").addEventListener("click", function(){ setLang("en"); });

var fxColor1=${JSON.stringify(t.accent1)};
var fxColor2=${JSON.stringify(t.accent2)};
var fxType=${JSON.stringify(DEFAULT_GUEST_FX)};
try{ var savedFx=localStorage.getItem("wib-guest-fx"); if(savedFx) fxType=savedFx; }catch(e){}

var fxCanvas=null, fxCtx=null, fxParticles=[], fxAnimId=null;
function fxResize(){ if(fxCanvas){ fxCanvas.width=window.innerWidth; fxCanvas.height=window.innerHeight; } }
function fxStop(){
  if(fxAnimId){ cancelAnimationFrame(fxAnimId); fxAnimId=null; }
  if(fxCanvas){ fxCanvas.remove(); fxCanvas=null; fxCtx=null; }
  window.removeEventListener("resize", fxResize);
}
function fxDrawPetal(p){
  fxCtx.save();
  fxCtx.translate(p.x,p.y);
  fxCtx.rotate(p.angle);
  fxCtx.globalAlpha=p.opacity;
  fxCtx.fillStyle=fxColor1;
  fxCtx.beginPath();
  fxCtx.ellipse(0,0,p.r,p.r*0.6,0,0,Math.PI*2);
  fxCtx.fill();
  fxCtx.restore();
}
function fxDrawSnow(p){
  fxCtx.beginPath();
  fxCtx.globalAlpha=p.opacity;
  fxCtx.fillStyle="#ffffff";
  fxCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
  fxCtx.fill();
}
function fxDrawStar(p){
  fxCtx.save();
  fxCtx.translate(p.x,p.y);
  fxCtx.rotate(p.angle);
  fxCtx.globalAlpha=p.opacity;
  fxCtx.fillStyle=fxColor2;
  var spikes=4, outer=p.r*2, inner=p.r*0.7;
  fxCtx.beginPath();
  for(var si=0; si<spikes*2; si++){
    var rad = si%2===0 ? outer : inner;
    var ang = (Math.PI/spikes)*si;
    fxCtx.lineTo(Math.cos(ang)*rad, Math.sin(ang)*rad);
  }
  fxCtx.closePath();
  fxCtx.fill();
  fxCtx.restore();
}
function fxStart(type){
  fxStop();
  fxType=type;
  if(type==="none") return;
  fxCanvas=document.createElement("canvas");
  fxCanvas.id="fx-canvas";
  fxCanvas.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40;";
  document.body.appendChild(fxCanvas);
  fxCtx=fxCanvas.getContext("2d");
  fxResize();
  window.addEventListener("resize", fxResize);

  var fxCount = type==="snow" ? 70 : (type==="stars" ? 50 : 40);
  function fxSpawn(initial){
    return {
      x: Math.random()*fxCanvas.width,
      y: initial ? Math.random()*fxCanvas.height : -10,
      r: type==="snow" ? (2+Math.random()*3) : (type==="petals" ? (5+Math.random()*5) : (2+Math.random()*2)),
      speed: type==="snow" ? (0.6+Math.random()*1.2) : (type==="petals" ? (0.5+Math.random()*1) : (0.8+Math.random()*1.5)),
      drift: Math.random()*1-0.5,
      angle: Math.random()*Math.PI*2,
      spin: (Math.random()*0.02)-0.01,
      sway: Math.random()*Math.PI*2,
      swaySpeed: 0.01+Math.random()*0.02,
      opacity: type==="stars" ? (0.35+Math.random()*0.65) : (0.6+Math.random()*0.4)
    };
  }
  fxParticles=[];
  for(var fi=0; fi<fxCount; fi++){ fxParticles.push(fxSpawn(true)); }

  function fxLoop(){
    fxCtx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
    fxParticles.forEach(function(p){
      p.y+=p.speed;
      p.sway+=p.swaySpeed;
      p.x+=Math.sin(p.sway)*0.6+p.drift*0.2;
      p.angle+=p.spin;
      if(p.y>fxCanvas.height+20 || p.x<-20 || p.x>fxCanvas.width+20){ Object.assign(p, fxSpawn(false)); }
      if(type==="snow") fxDrawSnow(p);
      else if(type==="stars") fxDrawStar(p);
      else fxDrawPetal(p);
    });
    fxAnimId=requestAnimationFrame(fxLoop);
  }
  fxLoop();
}

var fxButtons=document.querySelectorAll("#fxToggle button");
Array.prototype.forEach.call(fxButtons, function(btn){
  btn.classList.toggle("active", btn.getAttribute("data-fx")===fxType);
  btn.addEventListener("click", function(){
    var type=btn.getAttribute("data-fx");
    fxStart(type);
    try{ localStorage.setItem("wib-guest-fx", type); }catch(e){}
    Array.prototype.forEach.call(fxButtons, function(b){ b.classList.toggle("active", b===btn); });
  });
});
fxStart(fxType);
${mp.js}
})();<\/script>
</body></html>`;
}
