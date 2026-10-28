(function () {
  "use strict";
  var raw = document.getElementById("brief-data"); if (!raw) return;
  var D = JSON.parse(raw.textContent), form = document.getElementById("tool-form"), out = document.getElementById("tool-out");
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var S = { types: [], setting: "", site: "", scale: "", specials: [], by: "", notes: "", name: "", org: "", email: "", phone: "", like: "" };
  var edited = false;
  var fam = {}; D.families.forEach(function (f) { fam[f.slug] = f; });
  var specLabel = {}; D.specials.forEach(function (s) { specLabel[s.key] = s; });
  var siteLabel = {}; D.sites.forEach(function (s) { siteLabel[s.key] = s.label; });
  var scaleLabel = {}; D.scales.forEach(function (s) { scaleLabel[s.key] = s.label; });
  var setLabel = {}; D.settings.forEach(function (s) { setLabel[s.key] = s.label; });
  var projBySlug = {}; D.projects.forEach(function (p) { projBySlug[p.slug] = p; });

  /* prefill from ?type=a,b or ?like=project */
  var q = new URLSearchParams(location.search);
  if (q.get("type")) S.types = q.get("type").split(",").filter(function (t) { return fam[t]; });
  if (q.get("like") && projBySlug[q.get("like")]) {
    var lp = projBySlug[q.get("like")]; S.like = lp.slug; S.types = lp.fams.slice(); S.site = lp.site;
    S.specials = lp.flags.filter(function (k) { return specLabel[k]; });
  }

  function build() {
    var h = "";
    h += '<fieldset class="fs"><legend><span class="n">1</span>What are you signing?</legend><p class="hint">Choose every sign type the project needs.</p><div class="opts opts-img">';
    D.families.forEach(function (f) {
      h += '<label class="opt opt-img"><input type="checkbox" name="type" value="' + f.slug + '"><img src="' + f.img + '" alt="" width="560" height="350" loading="lazy"><span class="opt-t"><b>' + esc(f.name) + '</b></span></label>';
    });
    h += '</div></fieldset>';
    h += '<fieldset class="fs"><legend><span class="n">2</span>Where will it go?</legend><div class="opts opts-row">';
    D.settings.forEach(function (s) { h += '<label class="opt"><input type="radio" name="setting" value="' + s.key + '"><span class="opt-t">' + esc(s.label) + '</span></label>'; });
    h += '</div><label class="fld"><span>What kind of site is it?</span><select name="site"><option value="">Choose a site type</option>';
    D.sites.forEach(function (s) { h += '<option value="' + s.key + '">' + esc(s.label) + '</option>'; });
    h += '</select></label></fieldset>';
    h += '<fieldset class="fs"><legend><span class="n">3</span>How big is the job?</legend><div class="opts">';
    D.scales.forEach(function (s) { h += '<label class="opt"><input type="radio" name="scale" value="' + s.key + '"><span class="opt-t">' + esc(s.label) + '</span></label>'; });
    h += '</div></fieldset>';
    h += '<fieldset class="fs"><legend><span class="n">4</span>Anything special?</legend><div class="opts">';
    D.specials.forEach(function (s) { h += '<label class="opt"><input type="checkbox" name="special" value="' + s.key + '"><span class="opt-t">' + esc(s.label) + '</span></label>'; });
    h += '</div></fieldset>';
    h += '<fieldset class="fs"><legend><span class="n">5</span>Timing and details</legend>';
    h += '<label class="fld"><span>Needed by (month or date)</span><input type="text" name="by" placeholder="For example, March 2027" autocomplete="off"></label>';
    h += '<label class="fld"><span>Anything else we should know?</span><textarea name="notes" rows="3" placeholder="Site name, who designed it, anything tricky"></textarea></label></fieldset>';
    h += '<fieldset class="fs"><legend><span class="n">6</span>Your details <small>(optional, goes in the email only)</small></legend><div class="grid2">';
    h += '<label class="fld"><span>Name</span><input type="text" name="name" autocomplete="name"></label><label class="fld"><span>Organisation</span><input type="text" name="org" autocomplete="organization"></label>';
    h += '<label class="fld"><span>Your email</span><input type="email" name="email" autocomplete="email"></label><label class="fld"><span>Phone</span><input type="tel" name="phone" autocomplete="tel"></label></div></fieldset>';
    form.innerHTML = h;
    // reflect state
    $$('input[name=type]', form).forEach(function (i) { i.checked = S.types.indexOf(i.value) > -1; });
    $$('input[name=special]', form).forEach(function (i) { i.checked = S.specials.indexOf(i.value) > -1; });
    if (S.site) form.elements.site.value = S.site;
  }

  function read() {
    S.types = $$('input[name=type]:checked', form).map(function (i) { return i.value; });
    S.specials = $$('input[name=special]:checked', form).map(function (i) { return i.value; });
    var st = $('input[name=setting]:checked', form), sc = $('input[name=scale]:checked', form);
    S.setting = st ? st.value : ""; S.scale = sc ? sc.value : ""; S.site = form.elements.site.value;
    ["by", "notes", "name", "org", "email", "phone"].forEach(function (k) { S[k] = form.elements[k].value.trim(); });
    if (S.scale === "s3" || S.scale === "s4") { /* a big rollout implies the large flag in matching only */ }
  }

  function match() {
    var res = [];
    D.projects.forEach(function (p) {
      var sc = 0, why = [];
      if (S.site && S.site === p.site) { sc += 3; why.push("same kind of site"); }
      var ov = p.fams.filter(function (f) { return S.types.indexOf(f) > -1; });
      if (ov.length) { sc += 2 * ov.length; why.push(ov.map(function (f) { return fam[f].name.toLowerCase(); }).join(" and ")); }
      S.specials.forEach(function (k) { if (p.flags.indexOf(k) > -1) { sc += 1; why.push(specLabel[k].label.toLowerCase()); } });
      if ((S.scale === "s3" || S.scale === "s4") && p.flags.indexOf("large") > -1 && S.specials.indexOf("large") < 0) { sc += 1; why.push("large rollout"); }
      if (ov.length === 0 && !(S.site && S.site === p.site)) sc = 0;
      if (sc > 0) res.push({ p: p, sc: sc, why: why });
    });
    res.sort(function (a, b) { return b.sc - a.sc; });
    return res.slice(0, 3);
  }

  function briefText() {
    var t = [], names = S.types.map(function (s) { return fam[s].name; });
    t.push("Hello Cunneen Signs,", "", "Here is a brief for a signage project.", "");
    t.push("Sign types: " + (names.length ? names.join(", ") : "(not chosen yet)"));
    var where = [S.setting ? setLabel[S.setting] : "", S.site ? siteLabel[S.site] : ""].filter(Boolean).join(", ");
    if (where) t.push("Where: " + where);
    if (S.scale) t.push("Size of job: " + scaleLabel[S.scale]);
    if (S.specials.length) t.push("Special requirements: " + S.specials.map(function (k) { return specLabel[k].label; }).join("; "));
    if (S.by) t.push("Needed by: " + S.by);
    if (S.like) t.push("Similar to your project: " + projBySlug[S.like].name);
    if (S.notes) t.push("", "Notes: " + S.notes);
    t.push("");
    var c = [S.name, S.org, S.phone, S.email].filter(Boolean).join(" | ");
    t.push("Contact: " + (c || "(please add your name and phone)"));
    t.push("", "Sent from the website brief builder.");
    return t.join("\n");
  }

  function render() {
    var h = "";
    var n = S.types.length;
    h += '<div class="out-head"><p class="eyebrow">Your brief</p><h2>' + (n ? n + (n === 1 ? " sign type" : " sign types") + ", ready to send" : "Choose a sign type to begin") + '</h2></div>';
    if (n) {
      var dep = {}; S.types.forEach(function (s) { fam[s].depts.forEach(function (d) { dep[d] = 1; }); });
      if (S.specials.indexOf("lit") > -1) dep.illumination = 1;
      if (S.specials.indexOf("height") > -1 || S.specials.indexOf("approvals") > -1) dep.installation = 1;
      if (S.specials.indexOf("slip") > -1) dep.foundry = 1;
      if (S.specials.indexOf("design") > -1) dep.design = 1;
      if (S.specials.indexOf("access") > -1) dep.engraving = 1;
      var order = ["design", "foundry", "fabrication", "painting", "engraving", "print", "illumination", "assembly", "installation", "maintenance"];
      h += '<section class="blk"><h3>In-house teams for this job</h3><ul class="dl">';
      order.forEach(function (d) { if (dep[d]) h += '<li><a href="' + D.depts[d].href + '"><b>' + esc(D.depts[d].name) + '</b></a><span>' + esc(D.depts[d].line) + '</span></li>'; });
      h += '</ul><p class="src mono">From each sign type page and the Capabilities page on cunneen.com.au</p></section>';
      if (S.specials.length) {
        h += '<section class="blk"><h3>What Cunneen says about your requirements</h3><ul class="dl">';
        S.specials.forEach(function (k) { var s = specLabel[k]; h += '<li><a href="' + s.href + '"><b>' + esc(s.label) + '</b></a><span>' + esc(s.says) + '</span></li>'; });
        h += '</ul></section>';
      }
      var m = match();
      if (m.length) {
        h += '<section class="blk"><h3>Closest delivered work</h3><div class="mcards">';
        m.forEach(function (r) { h += '<a class="mcard" href="' + r.p.href + '"><img src="' + r.p.img + '" alt="' + esc(r.p.name) + '" width="560" height="420" loading="lazy"><span><b>' + esc(r.p.name) + '</b><small>' + esc(r.why.slice(0, 3).join(" · ")) + '</small></span></a>'; });
        h += '</div></section>';
      }
    } else {
      h += '<p class="hint">Pick the sign types on the left. We will match them to Cunneen\'s in-house teams and past projects, then write the brief for you.</p>';
    }
    if (n) { h += '<section class="blk"><h3>Send these with the brief</h3><ul class="ck">';
    D.send.forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
    h += '</ul></section>'; }
    var bt = briefText();
    h += '<section class="blk"><h3>The brief</h3><textarea id="brief-text" rows="11" aria-label="Brief text">' + esc(bt) + '</textarea></section>';
    var subj = "Sign brief: " + (S.types.length ? S.types.map(function (s) { return fam[s].name; }).join(", ") : "new project");
    h += '<div class="out-act"><a class="btn btn-red" id="mail-go" href="#tool-form">Email this brief to Cunneen</a><button class="btn btn-ghost" type="button" id="copy-go">Copy brief</button><a class="btn btn-ghost" href="' + D.tel + '">Call ' + esc(D.phone) + '</a></div>';
    h += '<p class="fine" id="copy-msg" role="status"></p><p class="fine">The email button opens your mail app with this text addressed to ' + esc(D.email) + '. Nothing is sent until you press send there.</p>';
    out.innerHTML = h;
    var ta = $("#brief-text"), mail = $("#mail-go");
    var setMail = function () {
      if (!S.types.length) { mail.setAttribute('href', '#tool-form'); mail.setAttribute('aria-disabled', 'true'); mail.textContent = 'Choose a sign type to email the brief'; return; } mail.setAttribute("href", "mailto:" + D.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(ta.value.slice(0, 1500))); };
    ta.addEventListener("input", function () { edited = true; setMail(); });
    setMail();
    $("#copy-go").addEventListener("click", function () {
      var done = function () { $("#copy-msg").textContent = "Brief copied."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); document.execCommand("copy"); done(); });
      else { ta.select(); document.execCommand("copy"); done(); }
    });
  }

  var keepFocus = function () { var a = document.activeElement; return a && out.contains(a) && a.id === "brief-text"; };
  function update() {
    read();
    if (keepFocus() && edited) return;
    var y = null;
    render();
  }
  var bar = document.querySelector('#bar .btn-red'); if (bar) { bar.textContent = 'See my brief'; bar.setAttribute('href', '#tool-out'); }
  build(); form.addEventListener("input", update); form.addEventListener("change", update);
  read(); render();
})();
