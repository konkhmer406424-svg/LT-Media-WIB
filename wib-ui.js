// wib-ui.js — wires up the staff-facing builder panel: form fields, photo/music pickers, client profiles, ZIP export

// ---------- Builder UI wiring ----------

const $ = id => document.getElementById(id);

function buildThemeSelect(){
  const sel = $("themeSel");
  sel.innerHTML = Object.keys(THEMES).map(key => `<option value="${key}">${THEMES[key].label}</option>`).join("");
  sel.value = state.theme;
}
$("themeSel").addEventListener("change", () => { state.theme = $("themeSel").value; update(); });


function buildTimeline(){
  const list = $("timelineList");
  list.innerHTML = state.timeline.map((item,i) => `
    <div class="item-card" data-i="${i}">
      <div class="tl-head"><button class="icon-btn tl-remove" type="button" title="លុប">×</button></div>
      <div class="row2">
        <div class="tl-col">
          <input type="text" class="tl-time-in" value="${(item.time||"").replace(/"/g,"&quot;")}" placeholder="ម៉ោង (ខ្មែរ)">
          <input type="text" class="tl-name-in" value="${(item.name||"").replace(/"/g,"&quot;")}" placeholder="ឈ្មោះកម្មវិធី (ខ្មែរ)">
        </div>
        <div class="tl-col">
          <input type="text" class="tl-time-en-in" value="${(item.timeEn||"").replace(/"/g,"&quot;")}" placeholder="Time (English)">
          <input type="text" class="tl-name-en-in" value="${(item.nameEn||"").replace(/"/g,"&quot;")}" placeholder="Program Name (English)">
        </div>
      </div>
    </div>`).join("");
  list.querySelectorAll(".item-card").forEach(row => {
    const i = +row.dataset.i;
    row.querySelector(".tl-time-in").addEventListener("input", e => { state.timeline[i].time = e.target.value; scheduleUpdate(); });
    row.querySelector(".tl-name-in").addEventListener("input", e => { state.timeline[i].name = e.target.value; scheduleUpdate(); });
    row.querySelector(".tl-time-en-in").addEventListener("input", e => { state.timeline[i].timeEn = e.target.value; scheduleUpdate(); });
    row.querySelector(".tl-name-en-in").addEventListener("input", e => { state.timeline[i].nameEn = e.target.value; scheduleUpdate(); });
    row.querySelector(".tl-remove").addEventListener("click", () => { state.timeline.splice(i,1); buildTimeline(); update(); });
  });
}

function buildCoverPhoto(){
  const grid = $("coverGrid");
  if(state.coverPhoto){
    grid.innerHTML = `<div class="photo-file-row">
      <span class="filename-text" title="${(state.coverPhotoName||"").replace(/"/g,"&quot;")}">${(state.coverPhotoName||"រូបភាពគម្រប").replace(/</g,"&lt;")}</span>
      <button class="photo-clear" type="button" id="coverClear">×</button>
    </div>`;
    $("coverClear").addEventListener("click", () => { state.coverPhoto = null; state.coverPhotoName = ""; setImgStatus("coverStatus", ""); buildCoverPhoto(); update(); });
  } else {
    grid.innerHTML = `<div class="photo-add-row">
      <span>+ បញ្ចូលរូបភាពគម្រប</span>
      <input type="file" accept="image/*" id="coverInput">
    </div>`;
    $("coverInput").addEventListener("change", async e => {
      const file = e.target.files[0];
      if(!file) return;
      setImgStatus("coverStatus", "កំពុងបង្រួមរូបភាព...");
      try{
        const data = await compressImage(file, IMG_COVER);
        state.coverPhoto = data; state.coverPhotoName = file.name;
        buildCoverPhoto(); update();
        setImgStatus("coverStatus", "បានបង្រួម៖ " + fmtSize(file.size) + " → " + fmtSize(dataUrlBytes(data)));
      }catch(err){
        setImgStatus("coverStatus", "មិនអាចបើករូបភាពនេះបានទេ សូមជ្រើសរើសរូបភាព JPG/PNG ផ្សេង");
      }
    });
  }
}

function buildContacts(){
  const list = $("contactList");
  list.innerHTML = state.contacts.map((c,i) => `
    <div class="item-card" data-i="${i}">
      <div class="tl-head"><button class="icon-btn ct-remove" type="button" title="លុប">×</button></div>
      <div class="row2">
        <input type="text" class="ct-name-in" value="${(c.name||"").replace(/"/g,"&quot;")}" placeholder="ឈ្មោះ (ខ្មែរ)">
        <input type="text" class="ct-name-en-in" value="${(c.nameEn||"").replace(/"/g,"&quot;")}" placeholder="Name (English)">
      </div>
      <input type="text" class="ct-phone-in" style="width:100%;margin-top:8px;" value="${(c.phone||"").replace(/"/g,"&quot;")}" placeholder="លេខទូរស័ព្ទ">
    </div>`).join("");
  list.querySelectorAll(".item-card").forEach(row => {
    const i = +row.dataset.i;
    row.querySelector(".ct-name-in").addEventListener("input", e => { state.contacts[i].name = e.target.value; scheduleUpdate(); });
    row.querySelector(".ct-phone-in").addEventListener("input", e => { state.contacts[i].phone = e.target.value; scheduleUpdate(); });
    row.querySelector(".ct-name-en-in").addEventListener("input", e => { state.contacts[i].nameEn = e.target.value; scheduleUpdate(); });
    row.querySelector(".ct-remove").addEventListener("click", () => { state.contacts.splice(i,1); buildContacts(); update(); });
  });
}

function buildPhotos(){
  if(state.photos.length !== state.photoNames.length){
    state.photoNames = state.photos.map((_,i) => state.photoNames[i] || `រូបភាព ${i+1}`);
  }
  const zipped = state.photos.map((src,i) => ({src, name: state.photoNames[i]})).filter(p => p.src);
  state.photos = zipped.map(p => p.src);
  state.photoNames = zipped.map(p => p.name);
  const grid = $("photoGrid");
  const existing = zipped.map((p,i) => `
    <div class="photo-file-row" data-i="${i}">
      <span class="filename-text" title="${(p.name||"").replace(/"/g,"&quot;")}">${(p.name||"").replace(/</g,"&lt;")}</span>
      <button class="photo-clear" type="button" data-i="${i}">×</button>
    </div>`).join("");
  const addTile = state.photos.length < MAX_PHOTOS
    ? `<div class="photo-add-row">
        <span>+ បញ្ចូលរូបភាព (${state.photos.length}/${MAX_PHOTOS})</span>
        <input type="file" accept="image/*" id="addPhotoInput" multiple>
      </div>`
    : "";
  grid.innerHTML = existing + addTile;

  const addInput = $("addPhotoInput");
  if(addInput){
    addInput.addEventListener("change", async e => {
      const files = Array.from(e.target.files || []);
      const remaining = MAX_PHOTOS - state.photos.length;
      const toAdd = files.slice(0, remaining);
      if(!toAdd.length) return;
      setImgStatus("photoStatus", "កំពុងបង្រួមរូបភាព...");
      let before = 0, after = 0, ok = 0, failed = 0;
      for(const file of toAdd){
        try{
          const data = await compressImage(file, IMG_GALLERY);
          state.photos.push(data);
          state.photoNames.push(file.name);
          before += file.size; after += dataUrlBytes(data); ok++;
        }catch(err){ failed++; }
      }
      buildPhotos(); update();
      let msg = ok ? "បានបង្រួម " + ok + " សន្លឹក៖ " + fmtSize(before) + " → " + fmtSize(after) : "";
      if(failed) msg += (msg ? " · " : "") + "មិនអាចបើករូបភាព " + failed + " សន្លឹក";
      if(files.length > remaining) msg += (msg ? " · " : "") + "បន្ថែមបានត្រឹម " + MAX_PHOTOS + " សន្លឹក";
      setImgStatus("photoStatus", msg);
    });
  }
  grid.querySelectorAll(".photo-clear").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const i = +e.target.dataset.i;
      state.photos.splice(i,1);
      state.photoNames.splice(i,1);
      buildPhotos(); update();
    });
  });
}

const MAX_MUSIC_INPUT_BYTES = 50 * 1024 * 1024; // largest song file staff may pick (it gets trimmed)
const MAX_MUSIC_OUT_BYTES = 2 * 1024 * 1024;    // size cap of the trimmed song embedded in every guest file
const MAX_GUESTS_PER_DOWNLOAD = 30;           // guests per ZIP file (larger lists are split automatically)
const IMG_COVER   = { maxDim:1600, quality:0.78 }; // cover photo compression
const IMG_GALLERY = { maxDim:1200, quality:0.72 }; // pre-wedding photos compression

function setImgStatus(id, text){ const el = $(id); if(el) el.textContent = text || ""; }
function fmtSize(bytes){
  if(bytes >= 1048576) return (bytes/1048576).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes/1024)) + " KB";
}
function dataUrlBytes(s){ return Math.round((s.length - s.indexOf(",") - 1) * 0.75); }

// Resize (longest side <= maxDim) and re-encode as JPEG. PNG transparency
// becomes a white background. Falls back to the original file on any error.
function compressImage(file, opts){
  return new Promise((resolve, reject) => {
    if(!file.type || file.type.indexOf("image/") !== 0){ reject(new Error("not_image")); return; }
    const fallback = () => {
      const r = new FileReader();
      r.onload = ev => resolve(ev.target.result);
      r.onerror = () => reject(new Error("read_failed"));
      r.readAsDataURL(file);
    };
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try{
        const scale = Math.min(1, opts.maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL("image/jpeg", opts.quality);
        URL.revokeObjectURL(url);
        resolve(out);
      }catch(err){ URL.revokeObjectURL(url); fallback(); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallback(); };
    img.src = url;
  });
}

function guestNameList(){
  return $("guestNamesFile").value.split("\n").map(n => n.trim()).filter(Boolean);
}
function chunkList(list, size){
  const out = [];
  for(let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
function updateGuestCount(){
  const el = $("guestCount");
  if(!el) return;
  const n = guestNameList().length;
  el.textContent = n
    ? n + " នាក់ (" + Math.ceil(n / MAX_GUESTS_PER_DOWNLOAD) + " ក្រុម ZIP)"
    : "0 នាក់";
}

function safeFileName(name){
  return (name || "guest").trim().replace(/[^\w\u1780-\u17FF]+/g, "_").replace(/^_+|_+$/g, "") || "guest";
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function downloadBlob(blob, fileName){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// ---- Personalized guest files: baked-in, zipped in batches, no hosting needed ----
let guestBusy = false;
async function generateGuestFiles(){
  if(guestBusy) return;
  const statusEl = $("genFilesStatus");
  const btn = $("genFilesBtn");
  const names = guestNameList();
  state.guestNamesFileRaw = $("guestNamesFile").value;
  saveDraft();

  if(!names.length){
    statusEl.textContent = "សូមបញ្ចូលឈ្មោះភ្ញៀវយ៉ាងហោចណាស់ម្នាក់ម្នាក់ក្នុងមួយបន្ទាត់";
    return;
  }
  if(typeof JSZip === "undefined"){
    statusEl.textContent = "មិនអាចផ្ទុកម៉ូឌុល ZIP បាន សូមព្យាយាមម្តងទៀត ឬពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត";
    return;
  }

  const batches = chunkList(names, MAX_GUESTS_PER_DOWNLOAD);
  const total = batches.length;
  const digits = Math.max(2, String(total).length);
  const usedNames = {};            // shared across batches so duplicate names stay unique
  guestBusy = true; btn.disabled = true;

  try{
    for(let b = 0; b < total; b++){
      statusEl.textContent = total > 1
        ? `កំពុងបង្កើតក្រុមទី ${b + 1} / ${total} ...`
        : "កំពុងបង្កើតឯកសារ...";
      await sleep(30);             // let the page repaint between batches

      const zip = new JSZip();
      batches[b].forEach(name => {
        const guestState = Object.assign({}, state, { __guestName: name });
        const html = renderInvitation(guestState);
        const base = "ជូនចំពោះ_" + safeFileName(name);
        let finalName = base;
        let n = 2;
        while(usedNames[finalName]){ finalName = base + "-" + n; n++; }
        usedNames[finalName] = true;
        zip.file(finalName + ".html", html);
      });

      const blob = await zip.generateAsync({ type:"blob", compression:"DEFLATE", compressionOptions:{ level:5 } });
      const suffix = total > 1
        ? `-part-${String(b + 1).padStart(digits, "0")}-of-${String(total).padStart(digits, "0")}`
        : "";
      downloadBlob(blob, `guest-invitations${suffix}.zip`);
      if(b < total - 1) await sleep(700);   // small gap so browsers accept back-to-back downloads
    }
    statusEl.textContent = total > 1
      ? `បានទាញយក ${names.length} ឯកសារ ក្នុង ${total} ZIP — ពិនិត្យថា ZIP ទាំង ${total} ចូលក្នុងថត Downloads គ្រប់ (បើខ្វះ សូមអនុញ្ញាតការទាញយកច្រើនឯកសារក្នុង browser រួចចុចម្តងទៀត) បន្ទាប់មកស្រាយ (unzip) ហើយផ្ញើឯកសារនីមួយៗទៅភ្ញៀវផ្ទាល់`
      : `បានទាញយក ${names.length} ឯកសារ ក្នុង ZIP មួយ — ស្រាយ (unzip) រួចផ្ញើឯកសារនីមួយៗទៅភ្ញៀវផ្ទាល់`;
  }catch(e){
    statusEl.textContent = "មានបញ្ហាកើតឡើងពេលបង្កើត ZIP សូមព្យាយាមម្តងទៀត";
  }finally{
    guestBusy = false; btn.disabled = false;
  }
}
$("genFilesBtn").addEventListener("click", generateGuestFiles);

function restoreGuestFilesUI(){
  $("guestNamesFile").value = state.guestNamesFileRaw || "";
  $("guestNamesFile").oninput = () => { state.guestNamesFileRaw = $("guestNamesFile").value; saveDraftSoon(); updateGuestCount(); };
  updateGuestCount();
}

// ---------------------------------------------------------------------
// Client Profiles — lets staff save/switch between several couples'
// invitation projects on this device, without losing any of them.
// ---------------------------------------------------------------------
const PROFILES_KEY = "wib-staff-profiles";
const CURRENT_PROFILE_KEY = "wib-staff-current-profile";
let currentProfileId = "";
try{ currentProfileId = localStorage.getItem(CURRENT_PROFILE_KEY) || ""; }catch(e){}

function getProfiles(){
  try{
    const v = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
    return Array.isArray(v) ? v.filter(p => p && typeof p === "object" && typeof p.id === "string") : [];
  }catch(e){ return []; }
}
function setProfiles(list){
  try{ localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); return true; }catch(e){ return false; }
}
function currentProfileDirty(){
  if(!currentProfileId) return false;
  const p = getProfiles().find(x => x.id === currentProfileId);
  if(!p) return false;
  try{ return JSON.stringify(normalizeState(p.state)) !== JSON.stringify(normalizeState(state)); }catch(e){ return false; }
}
function refreshAllBuildersFromState(){
  buildThemeSelect(); buildFontSelects(); buildCoverStyleSelect(); buildGalleryStyleSelect(); buildKbachFrameSelect(); buildTimeline(); buildTimelineTemplates();
  buildContacts(); buildPhotos(); buildCoverPhoto(); buildTemplateChips(); bindSimpleFields();
  restoreGuestFilesUI(); update();
}
function renderProfileSelect(){
  const sel = $("profileSelect");
  const profiles = getProfiles();
  sel.innerHTML = "";
  const blankOpt = document.createElement("option");
  blankOpt.value = "";
  blankOpt.textContent = "— សេចក្តីព្រាង (មិនទាន់រក្សាទុកជាគម្រោង) —";
  sel.appendChild(blankOpt);
  profiles.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = profiles.some(p => p.id === currentProfileId) ? currentProfileId : "";
  currentProfileId = sel.value;
}
function saveCurrentProfile(){
  const statusEl = $("profileStatus");
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => p.id === currentProfileId);
  if(idx === -1){
    saveAsNewProfile();
    return;
  }
  profiles[idx].state = JSON.parse(JSON.stringify(state));
  profiles[idx].savedAt = Date.now();
  if(!setProfiles(profiles)){ statusEl.textContent = STORAGE_FULL_MSG; return false; }
  statusEl.textContent = `បានរក្សាទុក "${profiles[idx].name}" ជាថ្មី`;
}
function saveAsNewProfile(){
  const statusEl = $("profileStatus");
  const suggested = [state.groomName, state.brideName].filter(Boolean).join(" & ") || "អតិថិជនថ្មី";
  const name = window.prompt("ឈ្មោះគម្រោង/អតិថិជន (ឧ. ដារា & ស្រីនាង):", suggested);
  if(!name) return;
  const profiles = getProfiles();
  const id = "p" + Date.now();
  profiles.push({ id, name: name.trim(), state: JSON.parse(JSON.stringify(state)), savedAt: Date.now() });
  if(!setProfiles(profiles)){ statusEl.textContent = STORAGE_FULL_MSG; return; }
  currentProfileId = id;
  try{ localStorage.setItem(CURRENT_PROFILE_KEY, id); }catch(e){}
  renderProfileSelect();
  persistMusic();
  statusEl.textContent = `បានរក្សាទុកជាគម្រោងថ្មី "${name.trim()}"`;
}
function loadProfile(id){
  const statusEl = $("profileStatus");
  if(id !== currentProfileId && currentProfileDirty()){
    if(window.confirm("មានការកែប្រែមិនទាន់រក្សាទុកក្នុងគម្រោងបច្ចុប្បន្ន។\nOK = រក្សាទុកសិន រួចប្តូរ\nCancel = បោះបង់ការកែប្រែទាំងនោះ")) saveCurrentProfile();
  }
  if(!id){
    currentProfileId = "";
    try{ localStorage.setItem(CURRENT_PROFILE_KEY, ""); }catch(e){}
    statusEl.textContent = "";
    persistMusic();
    return;
  }
  const profiles = getProfiles();
  const p = profiles.find(x => x.id === id);
  if(!p) return;
  state = normalizeState(p.state);
  currentProfileId = id;
  try{ localStorage.setItem(CURRENT_PROFILE_KEY, id); }catch(e){}
  saveDraft();
  refreshAllBuildersFromState();
  loadMusicForCurrent();
  statusEl.textContent = `កំពុងកែសម្រួល "${p.name}"`;
}
function deleteCurrentProfile(){
  const statusEl = $("profileStatus");
  if(!currentProfileId){ statusEl.textContent = "សូមជ្រើសរើសគម្រោងសិន"; return; }
  const profiles = getProfiles();
  const p = profiles.find(x => x.id === currentProfileId);
  if(!p) return;
  if(!window.confirm(`លុបគម្រោង "${p.name}" ចោល? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ`)) return;
  const deletedId = currentProfileId;
  setProfiles(profiles.filter(x => x.id !== deletedId));
  musicStoreOp("readwrite", st => st.delete(deletedId)).catch(() => {});
  currentProfileId = "";
  try{ localStorage.setItem(CURRENT_PROFILE_KEY, ""); }catch(e){}
  state = JSON.parse(JSON.stringify(defaultState));   // clear the editor so the deleted couple's data can't linger as an anonymous draft
  renderProfileSelect();
  refreshAllBuildersFromState();
  loadMusicForCurrent();
  persistMusic();
  statusEl.textContent = `បានលុបគម្រោង "${p.name}"`;
}
function exportCurrentProfile(){
  const statusEl = $("profileStatus");
  const profiles = getProfiles();
  const p = profiles.find(x => x.id === currentProfileId);
  const name = p ? p.name : ([state.groomName, state.brideName].filter(Boolean).join(" & ") || "draft");
  const payload = {
    app: "wedding-invitation-builder-profile",
    version: 1,
    name,
    exportedAt: Date.now(),
    state: JSON.parse(JSON.stringify(state))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = safeFileName(name) + "-profile.json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  statusEl.textContent = `បាននាំចេញគម្រោង "${name}" ជាឯកសារ .json — ផ្ញើ/រក្សាទុកសម្រាប់ប្រើលើ device ផ្សេង${musicAsset ? " (ចម្រៀងមិនរួមជាមួយឯកសារនេះទេ ត្រូវជ្រើសរើសម្តងទៀតលើ device ថ្មី)" : ""}`;
}
function importProfileFromFile(file){
  const statusEl = $("profileStatus");
  const reader = new FileReader();
  reader.onload = (ev) => {
    try{
      const payload = JSON.parse(ev.target.result);
      if(!payload || payload.app !== "wedding-invitation-builder-profile" || !payload.state){
        statusEl.textContent = "ឯកសារនេះមិនត្រឹមត្រូវទេ (ត្រូវជាឯកសារ .json ដែលបាននាំចេញពីកម្មវិធីនេះ)";
        return;
      }
      const profiles = getProfiles();
      const id = "p" + Date.now();
      const name = String(payload.name || "គម្រោងបាននាំចូល").slice(0, 80);
      const mergedState = normalizeState(payload.state);
      profiles.push({ id, name, state: mergedState, savedAt: Date.now() });
      if(!setProfiles(profiles)){ statusEl.textContent = STORAGE_FULL_MSG; return; }
      renderProfileSelect();
      loadProfile(id);
      statusEl.textContent = `បាននាំចូលគម្រោង "${name}" ជោគជ័យ`;
    }catch(err){
      statusEl.textContent = "មិនអាចអានឯកសារនេះបានទេ";
    }
  };
  reader.readAsText(file);
}
$("profileExportBtn").addEventListener("click", exportCurrentProfile);
$("profileImportBtn").addEventListener("click", () => $("profileImportFile").click());
$("profileImportFile").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if(file) importProfileFromFile(file);
  e.target.value = "";
});
$("profileSelect").addEventListener("change", e => loadProfile(e.target.value));
$("profileSaveBtn").addEventListener("click", saveCurrentProfile);
$("profileSaveAsBtn").addEventListener("click", saveAsNewProfile);
$("profileDeleteBtn").addEventListener("click", deleteCurrentProfile);

// ---------------------------------------------------------------------
// Background song — stored per project in IndexedDB (too big for localStorage).
// Not part of the exported .json profile.
// ---------------------------------------------------------------------
const MUSIC_DB = "wib-music", MUSIC_STORE = "tracks";
function musicDb(){
  return new Promise((resolve, reject) => {
    if(!window.indexedDB){ reject(new Error("IndexedDB unavailable")); return; }
    const req = indexedDB.open(MUSIC_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(MUSIC_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function musicStoreOp(mode, fn){
  const db = await musicDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MUSIC_STORE, mode);
    const req = fn(tx.objectStore(MUSIC_STORE));
    tx.oncomplete = () => { db.close(); resolve(req ? req.result : undefined); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
const musicKey = () => currentProfileId || "draft";
async function persistMusic(){
  try{
    if(musicAsset) await musicStoreOp("readwrite", st => st.put(musicAsset, musicKey()));
    else await musicStoreOp("readwrite", st => st.delete(musicKey()));
  }catch(e){
    const st = $("musicStatus");
    if(st && musicAsset) st.textContent += " (មិនអាចរក្សាទុកចម្រៀងក្នុង browser នេះបានទេ — ត្រូវជ្រើសរើសម្តងទៀតពេលបើកថ្មី)";
  }
}
async function loadMusicForCurrent(){
  musicSource = null;
  try{
    const rec = await musicStoreOp("readonly", st => st.get(musicKey()));
    const num = v => (typeof v === "number" && isFinite(v) && v >= 0) ? v : null;
    musicAsset = (rec && typeof rec.dataUrl === "string" && /^data:audio\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+$/i.test(rec.dataUrl))
      ? { name: asStr(rec.name, 200) || "song", size: num(rec.size) || 0, origSize: num(rec.origSize) || 0, seconds: num(rec.seconds), origSeconds: num(rec.origSeconds), startSeconds: num(rec.startSeconds) || 0, dataUrl: rec.dataUrl }
      : null;
  }
  catch(e){ musicAsset = null; }
  refreshMusicUI();
  update();
}



function fmtTime(sec){
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}

function refreshMusicUI(autoplay){
  const prev = $("musicPreview"), st = $("musicStatus");
  if(!prev) return;
  const rm = $("musicRemoveBtn"), startField = $("musicStartField");
  try{ prev.pause(); }catch(e){}
  if(musicAsset){
    prev.src = musicAsset.dataUrl;
    prev.style.display = "block";
    rm.style.display = "";
    let line = musicAsset.name;
    const from = musicAsset.startSeconds > 0 ? `ចាប់ពី ${fmtTime(musicAsset.startSeconds)} · ` : "";
    if(musicAsset.seconds) line += ` — ${from}រយៈពេល ${fmtTime(musicAsset.seconds)} (${fmtSize(musicAsset.size)})`;
    else line += ` — ${fmtSize(musicAsset.size)}`;
    if(musicAsset.origSeconds && musicAsset.seconds && musicAsset.origSeconds - musicAsset.seconds > 1){
      line += ` · កាត់ពី ${fmtTime(musicAsset.origSeconds)} (${fmtSize(musicAsset.origSize)})`;
    }
    // start picker: only while the original file is still in memory (i.e. picked in this session)
    if(musicSource && musicAsset.origSeconds){
      const maxStart = Math.max(0, Math.floor(musicAsset.origSeconds - 5));
      $("musicStartRange").max = String(maxStart);
      $("musicStartRange").value = String(Math.min(maxStart, Math.round(musicAsset.startSeconds || 0)));
      $("musicStartTxt").value = fmtTime(musicAsset.startSeconds || 0);
      startField.style.display = "";
    }else{
      startField.style.display = "none";
    }
    if(autoplay){ try{ const pr = prev.play(); if(pr && pr.catch) pr.catch(() => {}); }catch(e){} }
    st.textContent = line + `\nឯកសារភ្ញៀវនីមួយៗនឹងធំបន្ថែមប្រហែល ${fmtSize(musicAsset.dataUrl.length)}`;
    st.style.whiteSpace = "pre-line";
  }else{
    prev.removeAttribute("src");
    prev.style.display = "none";
    rm.style.display = "none"; startField.style.display = "none";
    st.textContent = "មិនទាន់មានចម្រៀងទេ";
  }
}

// ---- MP3 trimming: no re-encoding. Keeps whole frames from `startSeconds`, drops ID3 tags / album art. ----
// Returns { data, seconds, totalSeconds } or null when the bytes are not a Layer III MP3 stream.
function trimMp3(u8, maxSeconds, maxBytes, startSeconds){
  startSeconds = startSeconds > 0 ? startSeconds : 0;
  const len = u8.length;
  const BR1 = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320];
  const BR2 = [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
  const SR = { 3:[44100,48000,32000], 2:[22050,24000,16000], 0:[11025,12000,8000] };

  function header(p){
    if(p + 4 > len || u8[p] !== 0xFF || (u8[p+1] & 0xE0) !== 0xE0) return null;
    const ver = (u8[p+1] >> 3) & 3, layer = (u8[p+1] >> 1) & 3;
    if(ver === 1 || layer !== 1) return null;             // reserved version, or not Layer III
    const bi = u8[p+2] >> 4, si = (u8[p+2] >> 2) & 3;
    if(bi === 0 || bi === 15 || si === 3) return null;
    const rate = SR[ver][si], kbps = (ver === 3 ? BR1 : BR2)[bi], pad = (u8[p+2] >> 1) & 1;
    const size = Math.floor((ver === 3 ? 144000 : 72000) * kbps / rate) + pad;
    return { ver, rate, kbps, size, samples: ver === 3 ? 1152 : 576,
             mono: (u8[p+3] >> 6) === 3, crc: (u8[p+1] & 1) === 0 };
  }
  function isFrame(p){
    const h = header(p);
    if(!h || p + h.size > len) return null;
    const q = p + h.size;
    // next frame must follow, unless this is the last frame (only trailing tags left)
    if(q === len || len - q <= 300 || header(q)) return h;
    return null;
  }
  function isInfoFrame(p, h){          // Xing / Info / VBRI header frame (metadata, not audio)
    const at = p + 4 + (h.crc ? 2 : 0) + (h.ver === 3 ? (h.mono ? 17 : 32) : (h.mono ? 9 : 17));
    const tag = String.fromCharCode(u8[at] || 0, u8[at+1] || 0, u8[at+2] || 0, u8[at+3] || 0);
    const v = String.fromCharCode(u8[p+36] || 0, u8[p+37] || 0, u8[p+38] || 0, u8[p+39] || 0);
    return tag === "Xing" || tag === "Info" || v === "VBRI";
  }

  let pos = 0;
  if(len > 10 && u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33){   // ID3v2 (may hold album art)
    pos = 10 + (((u8[6] & 0x7F) << 21) | ((u8[7] & 0x7F) << 14) | ((u8[8] & 0x7F) << 7) | (u8[9] & 0x7F));
    if(u8[5] & 0x10) pos += 10;
  }

  // MP3 frames borrow bits from the frames just before them (bit reservoir). When starting mid-song we
  // begin a few frames early, so the decoder has warmed up by the time the wanted start is reached.
  const PREROLL = 4;
  let recent = [];
  let start = -1, cut = -1, kept = 0, total = 0, end = 0, frames = 0, elapsed = 0, seenFirst = false;
  while(pos + 4 <= len){
    const h = isFrame(pos);
    if(!h){ pos++; continue; }                       // resync after junk bytes
    if(!seenFirst){
      seenFirst = true;
      if(isInfoFrame(pos, h)){ pos += h.size; continue; }
    }
    const sec = h.samples / h.rate;
    if(start < 0){
      if(elapsed >= startSeconds){ start = recent.length ? recent[0] : pos; }
      else{
        recent.push(pos); if(recent.length > PREROLL) recent.shift();
        elapsed += sec; total += sec; pos += h.size; end = pos; frames++;
        continue;
      }
    }
    if(cut < 0 && (kept + sec > maxSeconds || (pos + h.size - start) > maxBytes)) cut = pos;
    if(cut < 0) kept += sec;
    total += sec;
    pos += h.size;
    end = pos;
    frames++;
  }
  if(frames === 0 || start < 0) return null;
  if(cut < 0) cut = end;
  if(cut <= start) return null;
  return { data: u8.subarray(start, cut), seconds: kept, totalSeconds: total };
}

function readAsArrayBuffer(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}
function blobToDataUrl(blob){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
function guessAudioMime(name, type){
  if(type && type.indexOf("audio/") === 0) return type;
  const ext = (name.split(".").pop() || "").toLowerCase();
  return ({ mp3:"audio/mpeg", m4a:"audio/mp4", aac:"audio/aac", wav:"audio/wav", ogg:"audio/ogg", oga:"audio/ogg", opus:"audio/ogg" })[ext] || "audio/mpeg";
}

let musicSource = null;    // the file as picked (kept in memory only), so length / start can be changed without re-picking
function parseTime(str){
  const parts = String(str).trim().split(":").map(x => Number(x));
  if(!parts.length || parts.length > 3 || parts.some(x => !isFinite(x) || x < 0)) return null;
  return parts.reduce((acc, x) => acc * 60 + x, 0);
}
function musicMaxSeconds(){
  const v = Number($("musicMaxSel").value);
  return v > 0 ? v : Infinity;
}

async function buildMusicAsset(src, startSeconds, autoplay){
  const st = $("musicStatus");
  st.style.whiteSpace = "";
  const isMp3 = /\.mp3$/i.test(src.name) || src.type === "audio/mpeg";
  let start = startSeconds > 0 ? startSeconds : 0;
  if(src.totalSeconds) start = Math.min(start, Math.max(0, Math.floor(src.totalSeconds - 5)));   // keep at least a few seconds
  let trimmed = isMp3 ? trimMp3(src.u8, musicMaxSeconds(), MAX_MUSIC_OUT_BYTES, start) : null;
  if(!trimmed && isMp3 && start > 0){ start = 0; trimmed = trimMp3(src.u8, musicMaxSeconds(), MAX_MUSIC_OUT_BYTES, 0); }
  if(trimmed) src.totalSeconds = trimmed.totalSeconds;

  let data, mime, seconds = null, origSeconds = null;
  if(trimmed){
    data = trimmed.data; mime = "audio/mpeg";
    seconds = trimmed.seconds; origSeconds = trimmed.totalSeconds;
  }else{
    if(src.size > MAX_MUSIC_OUT_BYTES){
      st.textContent = `ឯកសារនេះធំពេក (${fmtSize(src.size)}) ហើយមិនអាចកាត់ស្វ័យប្រវត្តិបានទេ — ប្រព័ន្ធកាត់បានតែ MP3។ សូមបម្លែងជា MP3 ជាមុន ឬប្រើឯកសារតូចជាង ${fmtSize(MAX_MUSIC_OUT_BYTES)}`;
      return false;
    }
    data = src.u8; mime = guessAudioMime(src.name, src.type);
  }

  const dataUrl = await blobToDataUrl(new Blob([data], { type: mime }));
  musicAsset = { name: src.name, size: data.length, origSize: src.size, seconds, origSeconds, startSeconds: trimmed ? start : 0, dataUrl };
  musicSource = src;
  try{ sessionStorage.removeItem("wib-cover-seen"); }catch(e){}
  refreshMusicUI(autoplay);
  persistMusic();
  update();
  return true;
}

async function importMusic(file){
  const st = $("musicStatus");
  st.style.whiteSpace = "";
  if(!(file.type.indexOf("audio/") === 0 || /\.(mp3|m4a|aac|wav|ogg|oga|opus)$/i.test(file.name))){
    st.textContent = "សូមជ្រើសរើសឯកសារសំឡេង (MP3, M4A, WAV …)";
    return;
  }
  if(file.size > MAX_MUSIC_INPUT_BYTES){
    st.textContent = `ឯកសារធំពេក (${fmtSize(file.size)}) — សូមជ្រើសរើសឯកសារតូចជាង ${fmtSize(MAX_MUSIC_INPUT_BYTES)}`;
    return;
  }
  st.textContent = "កំពុងកាត់ចម្រៀង...";
  try{
    const buf = await readAsArrayBuffer(file);
    await buildMusicAsset({ name: file.name, type: file.type, size: file.size, u8: new Uint8Array(buf) }, 0, false);
  }catch(e){
    st.textContent = "មិនអាចអានឯកសារនេះបានទេ";
  }
}
try{ const savedMax = localStorage.getItem("wib-music-max"); if(savedMax !== null) $("musicMaxSel").value = savedMax; }catch(e){}
if(!$("musicMaxSel").value) $("musicMaxSel").value = "60";
$("musicMaxSel").addEventListener("change", async () => {
  try{ localStorage.setItem("wib-music-max", $("musicMaxSel").value); }catch(e){}
  if(musicSource){ await buildMusicAsset(musicSource, musicAsset ? musicAsset.startSeconds : 0, false); }
  else if(musicAsset){ $("musicStatus").textContent += "\n(ជ្រើសរើសឯកសារម្តងទៀត ដើម្បីកាត់តាមរយៈពេលថ្មី)"; }
});
// Font + opening-screen dropdowns. A live preview of the whole invitation already sits in the panel on the
// right, so these do not need their own text sample underneath.
function buildFontSelects(){
  [["fontKmSel","fontKm",FONT_KM],["fontEnSel","fontEn",FONT_EN]].forEach(([selId, key, list]) => {
    const sel = $(selId);
    sel.innerHTML = Object.keys(list).map(k => `<option value="${k}">${list[k].name}</option>`).join("");
    sel.value = hasOwn(list, state[key]) ? state[key] : Object.keys(list)[0];
  });
}
$("fontKmSel").addEventListener("change", () => { state.fontKm = $("fontKmSel").value; update(); });
$("fontEnSel").addEventListener("change", () => { state.fontEn = $("fontEnSel").value; update(); });

function buildGalleryStyleSelect(){
  const sel = $("galleryStyleSel");
  sel.innerHTML = Object.keys(GALLERY_STYLES).map(key => `<option value="${key}">${GALLERY_STYLES[key].label}</option>`).join("");
  sel.value = hasOwn(GALLERY_STYLES, state.galleryStyle) ? state.galleryStyle : "grid";
}
$("galleryStyleSel").addEventListener("change", () => { state.galleryStyle = $("galleryStyleSel").value; update(); });

function buildKbachFrameSelect(){
  const sel = $("kbachFrameSel");
  sel.innerHTML = Object.keys(KBACH_FRAME_STYLES).map(key => `<option value="${key}">${KBACH_FRAME_STYLES[key].label}</option>`).join("");
  sel.value = hasOwn(KBACH_FRAME_STYLES, state.kbachFrame) ? state.kbachFrame : "none";
}
$("kbachFrameSel").addEventListener("change", () => { state.kbachFrame = $("kbachFrameSel").value; update(); });

function buildCoverStyleSelect(){
  const sel = $("coverStyleSel");
  sel.innerHTML = Object.keys(COVER_STYLES).map(key => `<option value="${key}">${COVER_STYLES[key].label}</option>`).join("");
  sel.value = hasOwn(COVER_STYLES, state.openStyle) ? state.openStyle : "door";
  $("coverAlways").checked = !!state.coverAlways;
  refreshMusicUI();
}
$("coverStyleSel").addEventListener("change", () => {
  state.openStyle = $("coverStyleSel").value;
  try{ sessionStorage.removeItem("wib-cover-seen"); }catch(e){}   // show the new style in the preview straight away
  update();
});
$("coverAlways").addEventListener("change", e => {
  state.coverAlways = e.target.checked;
  try{ sessionStorage.removeItem("wib-cover-seen"); }catch(err){}
  refreshMusicUI();
  update();
});

async function setMusicStart(seconds){
  if(!musicSource || !musicAsset) return;
  await buildMusicAsset(musicSource, Math.max(0, Math.round(seconds)), true);
}
$("musicStartRange").addEventListener("input", () => { $("musicStartTxt").value = fmtTime(Number($("musicStartRange").value)); });
$("musicStartRange").addEventListener("change", () => setMusicStart(Number($("musicStartRange").value)));
$("musicStartTxt").addEventListener("change", () => {
  const t = parseTime($("musicStartTxt").value);
  if(t === null){ $("musicStartTxt").value = fmtTime(musicAsset ? musicAsset.startSeconds || 0 : 0); return; }
  setMusicStart(t);
});
$("musicStartBeginBtn").addEventListener("click", () => setMusicStart(0));
$("musicStartEndBtn").addEventListener("click", () => {
  if(!musicAsset || !musicAsset.origSeconds) return;
  // longest piece allowed (chosen length and the size cap), taken so that it ends exactly at the end of the song
  const bytesPerSec = musicAsset.size / Math.max(1, musicAsset.seconds);
  const longest = Math.min(musicMaxSeconds(), MAX_MUSIC_OUT_BYTES / bytesPerSec * 0.98, musicAsset.origSeconds);
  setMusicStart(Math.ceil(musicAsset.origSeconds - longest));
});
$("musicPickBtn").addEventListener("click", () => $("musicFile").click());
$("musicFile").addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if(file) importMusic(file);
});
$("musicRemoveBtn").addEventListener("click", () => {
  musicAsset = null; musicSource = null;
  refreshMusicUI();
  persistMusic();
  update();
});

function buildTemplateChips(){
  const specs = [
    { id:"tpl-eyebrow-km", items:TEMPLATES.eyebrow.km, target:"eyebrow", toggleLabel:"មើលគំរូ", hideLabel:"លាក់គំរូ" },
    { id:"tpl-eyebrow-en", items:TEMPLATES.eyebrow.en, target:"eyebrowEn", toggleLabel:"Show templates", hideLabel:"Hide templates" },
    { id:"tpl-welcome-km", items:TEMPLATES.welcomeText.km, target:"welcomeText", toggleLabel:"មើលគំរូ", hideLabel:"លាក់គំរូ" },
    { id:"tpl-welcome-en", items:TEMPLATES.welcomeText.en, target:"welcomeTextEn", toggleLabel:"Show templates", hideLabel:"Hide templates" }
  ];
  function truncate(text, max){
    return text.length > max ? text.slice(0, max).trim() + "…" : text;
  }
  specs.forEach(spec => {
    const row = $(spec.id);
    if(!row) return;
    row.className = "template-preview-wrap";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "tpl-toggle-btn";
    toggleBtn.textContent = spec.toggleLabel + " (" + spec.items.length + ")";

    const list = document.createElement("div");
    list.className = "template-preview-list";
    list.style.display = "none";
    list.innerHTML = spec.items.map((text,i) =>
      `<button type="button" class="template-chip-lg" data-i="${i}" title="${text.replace(/"/g,"&quot;")}">
         <span class="tpl-num">គំរូ ${i+1}</span>
         <span class="tpl-text">${truncate(text, 90).replace(/</g,"&lt;")}</span>
       </button>`
    ).join("");

    toggleBtn.addEventListener("click", () => {
      const expanded = list.style.display !== "none";
      list.style.display = expanded ? "none" : "flex";
      toggleBtn.textContent = (expanded ? spec.toggleLabel : spec.hideLabel) + " (" + spec.items.length + ")";
      toggleBtn.classList.toggle("expanded", !expanded);
    });

    row.innerHTML = "";
    row.appendChild(toggleBtn);
    row.appendChild(list);

    list.querySelectorAll(".template-chip-lg").forEach(chip => {
      chip.addEventListener("click", () => {
        const text = spec.items[+chip.dataset.i];
        state[spec.target] = text;
        const el = $(spec.target);
        if(el) el.value = text;
        list.querySelectorAll(".template-chip-lg").forEach(c => c.classList.remove("chosen"));
        chip.classList.add("chosen");
        update();
      });
    });
  });
}

function buildTimelineTemplates(){
  const row = $("tpl-timeline");
  if(!row) return;
  row.className = "template-preview-wrap";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "tpl-toggle-btn";
  toggleBtn.textContent = "ជ្រើសរើសគំរូកម្មវិធីពិធី (" + TIMELINE_PRESETS.length + ")";

  const list = document.createElement("div");
  list.className = "template-preview-list";
  list.style.display = "none";
  list.innerHTML = TIMELINE_PRESETS.map((preset,i) => {
    const previewKm = preset.items.map(it => it.name).join(" → ");
    return `<button type="button" class="template-chip-lg" data-i="${i}" title="${previewKm.replace(/"/g,"&quot;")}">
       <span class="tpl-num">${(preset.label+" · "+preset.labelEn).replace(/</g,"&lt;")}</span>
       <span class="tpl-text">${previewKm.replace(/</g,"&lt;")} — (${preset.items.length} ចំណុច)</span>
     </button>`;
  }).join("");

  toggleBtn.addEventListener("click", () => {
    const expanded = list.style.display !== "none";
    list.style.display = expanded ? "none" : "flex";
    toggleBtn.textContent = (expanded ? "ជ្រើសរើសគំរូកម្មវិធីពិធី" : "លាក់គំរូកម្មវិធីពិធី") + " (" + TIMELINE_PRESETS.length + ")";
    toggleBtn.classList.toggle("expanded", !expanded);
  });

  row.innerHTML = "";
  row.appendChild(toggleBtn);
  row.appendChild(list);

  list.querySelectorAll(".template-chip-lg").forEach(chip => {
    chip.addEventListener("click", () => {
      const preset = TIMELINE_PRESETS[+chip.dataset.i];
      state.timeline = JSON.parse(JSON.stringify(preset.items));
      list.querySelectorAll(".template-chip-lg").forEach(c => c.classList.remove("chosen"));
      chip.classList.add("chosen");
      buildTimeline();
      update();
    });
  });
}

function bindSimpleFields(){
  const map = {
    groomName:"groomName", brideName:"brideName", eyebrow:"eyebrow",
    groomNameEn:"groomNameEn", brideNameEn:"brideNameEn", eyebrowEn:"eyebrowEn",
    eventDate:"eventDate", startTime:"startTime",
    welcomeText:"welcomeText", host1:"host1", host2:"host2",
    welcomeTextEn:"welcomeTextEn", host1En:"host1En", host2En:"host2En",
    venueName:"venueName", venueAddr:"venueAddr",
    venueNameEn:"venueNameEn", venueAddrEn:"venueAddrEn",
    venueMapLink:"venueMapLink"
  };
  Object.entries(map).forEach(([id,key]) => {
    const el = $(id);
    el.value = state[key] || "";
    el.oninput = () => { state[key] = el.value; scheduleUpdate(); };   // "oninput" (not addEventListener) so re-binding after a profile switch does not stack handlers
  });
}

function update(){
  saveDraft();
  $("frame").srcdoc = renderInvitation(Object.assign({}, state, { __preview:true }));
}

let updateTimer = null;
function scheduleUpdate(){
  saveDraftSoon();
  if(updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    $("frame").srcdoc = renderInvitation(Object.assign({}, state, { __preview:true }));
  }, 450);
}

$("addTimeline").addEventListener("click", () => {
  state.timeline.push({time:"", name:"", timeEn:"", nameEn:""});
  buildTimeline();
  update();
});

$("addContact").addEventListener("click", () => {
  state.contacts.push({name:"", phone:"", nameEn:""});
  buildContacts();
  update();
});

// Mobile tabs
const tabEdit = $("tabEdit"), tabPreview = $("tabPreview"), panel = $("panel");
tabEdit.addEventListener("click", () => { panel.classList.remove("hide"); tabEdit.classList.add("active"); tabPreview.classList.remove("active"); });
tabPreview.addEventListener("click", () => { panel.classList.add("hide"); tabPreview.classList.add("active"); tabEdit.classList.remove("active"); });

// Resizable panel
const resizer = $("resizer"), appEl = document.querySelector(".app");
let resizing = false;
function setPanelWidth(px){
  const clamped = Math.max(280, Math.min(720, px));
  appEl.style.gridTemplateColumns = clamped + "px 6px 1fr";
  try{ localStorage.setItem("wib-panelw", clamped); }catch(e){}
}
try{
  const savedW = localStorage.getItem("wib-panelw");
  if(savedW) setPanelWidth(+savedW);
}catch(e){}
resizer.addEventListener("mousedown", () => {
  resizing = true;
  $("frame").style.pointerEvents = "none";
  resizer.classList.add("active");
  document.body.style.userSelect = "none";
});
window.addEventListener("mousemove", e => {
  if(!resizing) return;
  setPanelWidth(e.clientX);
});
window.addEventListener("mouseup", () => {
  if(!resizing) return;
  resizing = false;
  $("frame").style.pointerEvents = "";
  resizer.classList.remove("active");
  document.body.style.userSelect = "";
});
resizer.addEventListener("touchstart", () => { resizing = true; }, {passive:true});
window.addEventListener("touchmove", e => {
  if(!resizing) return;
  setPanelWidth(e.touches[0].clientX);
}, {passive:true});
window.addEventListener("touchend", () => { resizing = false; });

buildThemeSelect();
buildFontSelects();
buildCoverStyleSelect();
buildGalleryStyleSelect();
buildKbachFrameSelect();
buildTimeline();
buildTimelineTemplates();
buildContacts();
buildPhotos();
buildCoverPhoto();
buildTemplateChips();
bindSimpleFields();
restoreGuestFilesUI();
renderProfileSelect();
update();
refreshMusicUI();
loadMusicForCurrent();

if("serviceWorker" in navigator){
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(()=>{}); });
}
