// ============================================================
//  CONFIG
// ============================================================
const GITHUB_USERNAME = "nepalibidur14";

// Social / contact links. Leave a value as "" to hide it.
const SOCIALS = {
  email:    "bidurnepali54@gmail.com",
  linkedin: "https://www.linkedin.com/in/your-handle",   // <- edit
  twitter:  "",                                           // e.g. "https://twitter.com/your-handle"
  website:  "https://nepalibidur.com.np",
};

// Bio overrides — these take precedence over what's pulled from the GitHub
// API. Leave a value as "" to fall back to GitHub.
const BIO = {
  name:     "Bidur Nepali",
  title:    "Full-Stack Engineer",
  location: "Japan (originally from Nepal)",
  tagline:  "I craft accessible, performant web applications that blend thoughtful design with robust engineering.",
  summary:  "Full-Stack Engineer based in Japan with 6+ years building products across startups and established companies. Specializing in React, Node.js, and cloud infrastructure — with recent focus on Generative AI, RAG systems, and microservices on AWS.",
};

// Skill stack, grouped.
const SKILLS = {
  frontend:    ["React", "Next.js", "Vue.js", "TypeScript", "JavaScript", "Tailwind CSS", "HTML/CSS", "Redux", "Material UI", "Bootstrap"],
  backend:     ["Node.js", "NestJS", "Express.js", "REST APIs", "WebSockets", "GraphQL"],
  database:    ["PostgreSQL", "MySQL", "Elasticsearch", "MongoDB", "Redis"],
  "cloud/devops": ["AWS (Lambda, EC2, S3, Amplify)", "GCP", "Docker", "CI/CD", "GitHub Actions", "Jenkins", "Vercel", "Bitbucket"],
  languages:   ["English (Fluent)", "Japanese (JLPT N2)", "Nepali (Native)"],
};

// Work history, newest first.
const EXPERIENCE = [
  {
    period:  "Jun 2023 – Present",
    role:    "AI Evangelist / System Engineer",
    company: "Okicom Co. Ltd., Japan",
    bullets: [
      "Led internal AI adoption — translated business needs into practical GenAI solutions (RAG chatbot, smart notifier, workflow automations)",
      "Proposed and validated use-cases with stakeholders; created demos, guidelines, and reusable prompt/RAG templates",
      "Designed Knowledge Video Application with Google Speech-to-Text + Generative AI (subtitles, proofreading, translation, auto-summary)",
      "Built microservices for batch operations (EC2-based batch + AWS Amplify serverless)",
      "Improved frontend performance/UX by ~40% through state optimization + web workers",
      "Contributed to CI/CD pipelines (GitHub Actions, Bitbucket, Vercel)",
    ],
    stack: ["AWS Amplify", "AWS Lambda", "Vue 3", "TypeScript", "Generative AI", "RAG", "Cypress"],
  },
  {
    period:  "Jul 2021 – Jun 2023",
    role:    "Full Stack Engineer",
    company: "Heubert Technologies Pvt. Ltd., Nepal",
    bullets: [
      "Architected and maintained multi-tenant CRM handling 2000+ daily requests with secure APIs using RLS/ABAC and AWS integration",
      "Enhanced UI/UX with React, AntD, Figma — +20% user engagement",
      "Optimized SQL + backend logic to reduce API response time by 30–40% using NestJS + TypeScript",
      "Improved code quality via documentation, reviews, and Agile collaboration",
    ],
    stack: ["React", "NestJS", "TypeScript", "PostgreSQL", "AWS", "WebSockets"],
  },
  {
    period:  "Feb 2020 – Jun 2021",
    role:    "Associate Software Developer",
    company: "General Technology Pvt. Ltd., Nepal",
    bullets: [
      "Built a Document Management System (DMS) used in 10+ financial institutions",
      "Implemented OCR + open search — reduced document retrieval time by 50%",
      "Optimized database indexing — reduced query times by 50%",
      "Delivered POC demos and client-facing presentations",
    ],
    stack: [],
  },
];

// Hand-picked projects with live demo URLs.
//   name  (required) — display name shown in the terminal
//   live  (required) — the live demo URL
//   note  (optional) — short description
//   repo  (optional) — exact GitHub repo name. If set AND the repo is public,
//                      it'll be cross-linked with stars/language/updated date.
//                      Omit for private or non-GitHub projects.
const FEATURED_PROJECTS = [
  { name: "MockAPIHub",   live: "https://mockapihub.com",   note: "mock API hosting & generation" },
  { name: "FreeToolPoint", live: "https://freetoolpoint.com", note: "free online developer tools" },
];
// ============================================================

const API = `https://api.github.com/users/${GITHUB_USERNAME}`;
const REPOS_API = `${API}/repos?sort=updated&per_page=100`;

const screen   = document.getElementById("screen");
const output   = document.getElementById("output");
const banner   = document.getElementById("banner");
const form     = document.getElementById("prompt-form");
const input    = document.getElementById("cmd");

let userData = null;
let reposData = null;
const history = [];
let historyIdx = -1;

// ----- ASCII banner --------------------------------------------------
const BANNER = String.raw`
  ____ _ _   _   _       _      ____            _    __       _ _
 / ___(_) |_| | | |_   _| |__  |  _ \ ___  _ __| |_ / _| ___ | (_) ___
| |  _| | __| |_| | | | | '_ \ | |_) / _ \| '__| __| |_ / _ \| | |/ _ \
| |_| | | |_|  _  | |_| | |_) ||  __/ (_) | |  | |_|  _| (_) | | | (_) |
 \____|_|\__|_| |_|\__,_|_.__/ |_|   \___/|_|   \__|_|  \___/|_|_|\___/
`;

// ----- ASCII avatar (static fallback) -------------------------------
const AVATAR = String.raw`
    .--.
   |o_o |
   |:_/ |
  //   \ \
 (|     | )
/'\_   _/'\
\___)=(___/`;

// ----- helpers ------------------------------------------------------

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function scrollDown() {
  screen.scrollTop = screen.scrollHeight;
}

function printRaw(node) {
  output.appendChild(node);
  scrollDown();
}

function print(html, cls = "output-line") {
  printRaw(el("div", cls, html));
}

function printEcho(cmd) {
  const div = el("div", "cmd-echo");
  div.innerHTML = `
    <span class="prompt">
      <span class="user">guest</span><span class="at">@</span><span class="host">github</span><span class="colon">:</span><span class="path">~</span><span class="dollar">$</span>
    </span><span>${escapeHtml(cmd)}</span>`;
  printRaw(div);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

// Prefer an explicit FEATURED_PROJECTS entry, otherwise fall back to the
// repo's GitHub `homepage` field (which you can set on github.com under repo
// settings → "About"). Returns "" if there's no live URL.
function liveUrlFor(repo) {
  const featured = FEATURED_PROJECTS.find(f => {
    const key = (f.repo || f.name || "").toLowerCase();
    return key && key === repo.name.toLowerCase();
  });
  if (featured && featured.live) return featured.live;
  if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) return repo.homepage;
  return "";
}

// Typewriter print — chunked to avoid hammering the DOM
function typeLine(html, delay = 8) {
  return new Promise(resolve => {
    const div = el("div", "output-line");
    output.appendChild(div);
    let i = 0;
    const text = html;
    const step = () => {
      if (i >= text.length) { scrollDown(); return resolve(); }
      // Advance whole HTML tags in one go to keep markup valid
      if (text[i] === "<") {
        const end = text.indexOf(">", i);
        div.innerHTML = text.slice(0, end + 1);
        i = end + 1;
      } else {
        i += 2;
        div.innerHTML = text.slice(0, i);
      }
      scrollDown();
      setTimeout(step, delay);
    };
    step();
  });
}

// ----- data fetch ---------------------------------------------------

async function loadUser() {
  if (userData) return userData;
  const r = await fetch(API);
  if (!r.ok) throw new Error(`GitHub API ${r.status}`);
  userData = await r.json();
  return userData;
}

async function loadRepos() {
  if (reposData) return reposData;
  const r = await fetch(REPOS_API);
  if (!r.ok) throw new Error(`GitHub API ${r.status}`);
  reposData = await r.json();
  return reposData;
}

// ----- commands -----------------------------------------------------

const commands = {
  async help() {
    const items = [
      ["help",          "show this list"],
      ["whoami",        "show profile summary"],
      ["about",         "long-form bio"],
      ["skills",        "technologies & languages"],
      ["experience",    "work history (alias: cv)"],
      ["demos",         "featured projects with live URLs"],
      ["ls projects/",  "list public GitHub repositories"],
      ["repos",         "alias for `ls projects/`"],
      ["cat <repo>",    "show details of a repository"],
      ["stats",         "followers, following, repo count, etc."],
      ["contact",       "links and how to reach me"],
      ["open <repo>",   "open a repo on github.com in a new tab"],
      ["clear",         "clear the screen"],
      ["history",       "show previous commands"],
    ];
    const grid = el("div", "help-grid");
    for (const [c, d] of items) {
      grid.appendChild(el("span", "cmd", escapeHtml(c)));
      grid.appendChild(el("span", "desc", escapeHtml(d)));
    }
    printRaw(grid);
  },

  async whoami() {
    const u = await loadUser().catch(() => ({}));
    const wrap = el("div", "whoami-grid");
    wrap.appendChild(el("pre", "ascii-avatar", escapeHtml(AVATAR)));

    const websiteLink = SOCIALS.website
      ? `<a class="link" target="_blank" rel="noopener" href="${escapeHtml(SOCIALS.website)}">${escapeHtml(SOCIALS.website)}</a>`
      : (u.blog ? `<a class="link" target="_blank" rel="noopener" href="${escapeHtml(u.blog)}">${escapeHtml(u.blog)}</a>` : "—");

    const info = el("div");
    const rows = [
      ["name",     BIO.name || u.name || u.login || GITHUB_USERNAME],
      ["title",    BIO.title || "—"],
      ["location", BIO.location || u.location || "—"],
      ["tagline",  BIO.tagline || u.bio || "—"],
      ["website",  websiteLink],
      ["github",   `<a class="link" target="_blank" rel="noopener" href="https://github.com/${GITHUB_USERNAME}">github.com/${GITHUB_USERNAME}</a>`],
      ["joined",   u.created_at ? fmtDate(u.created_at) : "—"],
    ];
    for (const [k, v] of rows) {
      info.appendChild(el("div", "output-line",
        `<span class="label">${escapeHtml(k.padEnd(9, " "))}</span> <span class="value">${typeof v === "string" && v.startsWith("<") ? v : escapeHtml(String(v))}</span>`));
    }
    wrap.appendChild(info);
    printRaw(wrap);
  },

  async about() {
    await typeLine(`<span class="muted">// about.md</span>`);
    await typeLine(`<span class="value">${escapeHtml(BIO.summary)}</span>`);
    if (BIO.location) await typeLine(`<span class="muted">based in</span> <span class="accent">${escapeHtml(BIO.location)}</span>`);
    if (SOCIALS.website) {
      await typeLine(`<span class="muted">website:</span> <a class="link" target="_blank" rel="noopener" href="${escapeHtml(SOCIALS.website)}">${escapeHtml(SOCIALS.website)}</a>`);
    }
    await typeLine(`<span class="muted">github:</span>  <a class="link" target="_blank" rel="noopener" href="https://github.com/${GITHUB_USERNAME}">github.com/${GITHUB_USERNAME}</a>`);
  },

  async skills() {
    print(`<span class="muted">// skills.json</span>`);
    for (const [group, list] of Object.entries(SKILLS)) {
      print(`<span class="label">${escapeHtml(group)}</span>`);
      print(`  <span class="value">${list.map(escapeHtml).join(`<span class="muted"> · </span>`)}</span>`);
    }
  },

  async experience() {
    print(`<span class="muted">// experience.log — ${EXPERIENCE.length} entries</span>`);
    for (const job of EXPERIENCE) {
      print(`<span class="accent">${escapeHtml(job.period)}</span>  <span class="label">${escapeHtml(job.role)}</span>  <span class="muted">@ ${escapeHtml(job.company)}</span>`);
      for (const b of job.bullets) {
        print(`  <span class="muted">•</span> <span class="value">${escapeHtml(b)}</span>`);
      }
      if (job.stack && job.stack.length) {
        print(`  <span class="muted">stack:</span> <span class="value">${job.stack.map(escapeHtml).join(`<span class="muted">, </span>`)}</span>`);
      }
      print(`<span class="muted">—</span>`);
    }
  },

  async repos() { return commands["ls projects/"](); },

  async "ls projects/"() {
    const repos = await loadRepos();
    if (!repos.length) { print(`<span class="muted">(no public repositories)</span>`); return; }
    const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at));
    print(`<span class="muted">total ${sorted.length}</span>`);
    for (const r of sorted) {
      const live = liveUrlFor(r);
      const row = el("div", "repo-row");
      row.innerHTML = `
        <span class="repo-star">${r.stargazers_count > 0 ? "★ " + r.stargazers_count : "·"}</span>
        <span>
          <a class="repo-name link" target="_blank" rel="noopener" href="${r.html_url}">${escapeHtml(r.name)}</a>
          ${live ? `<a class="link" target="_blank" rel="noopener" title="live demo" href="${escapeHtml(live)}">🌐</a>` : ""}
          <span class="repo-desc">${escapeHtml(r.description || "")}</span>
        </span>
        <span class="repo-meta">${escapeHtml(r.language || "—")}</span>
        <span class="repo-meta">${fmtDate(r.updated_at)}</span>
      `;
      printRaw(row);
    }
  },

  async cat(arg) {
    if (!arg) { print(`<span class="error">cat: missing operand</span> <span class="muted">— try: cat &lt;repo-name&gt;</span>`); return; }
    const repos = await loadRepos();
    const r = repos.find(x => x.name.toLowerCase() === arg.toLowerCase());
    if (!r) { print(`<span class="error">cat: ${escapeHtml(arg)}: No such repository</span>`); return; }
    const live = liveUrlFor(r);
    const lines = [
      ["name",        r.name],
      ["description", r.description || "—"],
      ["language",    r.language || "—"],
      ["stars",       r.stargazers_count],
      ["forks",       r.forks_count],
      ["open issues", r.open_issues_count],
      ["created",     fmtDate(r.created_at)],
      ["updated",     fmtDate(r.updated_at)],
      ["repo",        `<a class="link" target="_blank" rel="noopener" href="${r.html_url}">${r.html_url}</a>`],
      ["live",        live ? `<a class="link" target="_blank" rel="noopener" href="${escapeHtml(live)}">${escapeHtml(live)}</a>` : "—"],
    ];
    for (const [k, v] of lines) {
      const val = typeof v === "string" && v.startsWith("<") ? v : escapeHtml(String(v));
      print(`<span class="label">${escapeHtml(k.padEnd(12, " "))}</span> <span class="value">${val}</span>`);
    }
  },

  async stats() {
    const [u, repos] = await Promise.all([loadUser(), loadRepos()]);
    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
    const langs = {};
    for (const r of repos) if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
    const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([l, n]) => `${l}(${n})`).join(", ") || "—";
    const rows = [
      ["public repos", u.public_repos],
      ["total stars",  totalStars],
      ["total forks",  totalForks],
      ["followers",    u.followers],
      ["following",    u.following],
      ["top langs",    topLangs],
      ["member since", fmtDate(u.created_at)],
    ];
    for (const [k, v] of rows) {
      print(`<span class="label">${escapeHtml(k.padEnd(14, " "))}</span> <span class="value">${escapeHtml(String(v))}</span>`);
    }
  },

  async contact() {
    const u = await loadUser();
    const linkOrDash = (url, label) =>
      url ? `<a class="link" target="_blank" rel="noopener" href="${escapeHtml(url)}">${escapeHtml(label || url)}</a>` : "—";

    const items = [
      ["github",   linkOrDash(u.html_url, u.html_url)],
      ["linkedin", linkOrDash(SOCIALS.linkedin)],
      ["email",    SOCIALS.email
                    ? `<a class="link" href="mailto:${escapeHtml(SOCIALS.email)}">${escapeHtml(SOCIALS.email)}</a>`
                    : (u.email || "(hidden — check profile)")],
      ["website",  linkOrDash(SOCIALS.website || u.blog)],
      ["twitter",  linkOrDash(
                    SOCIALS.twitter || (u.twitter_username ? `https://twitter.com/${u.twitter_username}` : ""),
                    u.twitter_username ? `@${u.twitter_username}` : SOCIALS.twitter)],
    ];
    for (const [k, v] of items) {
      print(`<span class="label">${escapeHtml(k.padEnd(9, " "))}</span> <span class="value">${v}</span>`);
    }
  },

  async demos() {
    if (!FEATURED_PROJECTS.length) {
      print(`<span class="muted">No featured demos yet. Add entries to <span class="accent">FEATURED_PROJECTS</span> in script.js.</span>`);
      return;
    }
    // Only call the API if any featured item actually wants a repo cross-link.
    const needsRepos = FEATURED_PROJECTS.some(f => f.repo);
    const repos = needsRepos ? await loadRepos().catch(() => []) : [];
    print(`<span class="muted">featured ${FEATURED_PROJECTS.length}</span>`);
    for (const f of FEATURED_PROJECTS) {
      const displayName = f.name || f.repo || f.live;
      const r = f.repo ? repos.find(x => x.name.toLowerCase() === f.repo.toLowerCase()) : null;
      const desc = (r && r.description) || f.note || "";
      const lang = (r && r.language) || "";
      const codeLink = r
        ? `&nbsp;·&nbsp; code: <a class="link" target="_blank" rel="noopener" href="${escapeHtml(r.html_url)}">${escapeHtml(r.html_url)}</a>`
        : "";
      const row = el("div", "repo-row");
      row.innerHTML = `
        <span class="repo-star">🌐</span>
        <span>
          <a class="repo-name link" target="_blank" rel="noopener" href="${escapeHtml(f.live)}">${escapeHtml(displayName)}</a>
          <span class="repo-desc">${escapeHtml(desc)}</span>
          <div class="muted" style="font-size:12px;margin-top:2px;">
            live: <a class="link" target="_blank" rel="noopener" href="${escapeHtml(f.live)}">${escapeHtml(f.live)}</a>${codeLink}
          </div>
        </span>
        <span class="repo-meta">${escapeHtml(lang || "—")}</span>
        <span class="repo-meta">${r ? fmtDate(r.updated_at) : ""}</span>
      `;
      printRaw(row);
    }
  },

  async open(arg) {
    if (!arg) { print(`<span class="error">open: missing operand</span>`); return; }
    const repos = await loadRepos();
    const r = repos.find(x => x.name.toLowerCase() === arg.toLowerCase());
    if (!r) { print(`<span class="error">open: ${escapeHtml(arg)}: not found</span>`); return; }
    print(`<span class="muted">opening</span> <a class="link" target="_blank" rel="noopener" href="${r.html_url}">${r.html_url}</a>`);
    window.open(r.html_url, "_blank", "noopener");
  },

  async clear() {
    output.innerHTML = "";
  },

  async cv() { return commands.experience(); },

  async history() {
    if (!history.length) { print(`<span class="muted">(no history)</span>`); return; }
    history.forEach((h, i) => print(`<span class="muted">${String(i + 1).padStart(3, " ")}</span>  <span class="value">${escapeHtml(h)}</span>`));
  },
};

// ----- command dispatch ---------------------------------------------

async function run(raw) {
  const line = raw.trim();
  if (!line) return;
  printEcho(line);
  history.push(line);
  historyIdx = history.length;

  // Match longest command prefix (so "ls projects/" wins over "ls")
  const keys = Object.keys(commands).sort((a, b) => b.length - a.length);
  let handler = null;
  let argStr = "";
  for (const k of keys) {
    if (line === k || line.startsWith(k + " ")) {
      handler = commands[k];
      argStr = line.slice(k.length).trim();
      break;
    }
  }

  if (!handler) {
    print(`<span class="error">command not found: ${escapeHtml(line.split(" ")[0])}</span> <span class="muted">— try \`help\`</span>`);
    return;
  }

  try {
    await handler(argStr);
  } catch (err) {
    print(`<span class="error">error: ${escapeHtml(err.message)}</span>`);
  }
}

// ----- input handling -----------------------------------------------

input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    if (historyIdx > 0) historyIdx--;
    input.value = history[historyIdx] || "";
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    if (historyIdx < history.length - 1) { historyIdx++; input.value = history[historyIdx]; }
    else { historyIdx = history.length; input.value = ""; }
    e.preventDefault();
  } else if (e.key === "l" && e.ctrlKey) {
    e.preventDefault();
    commands.clear();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = input.value;
  input.value = "";
  await run(v);
});

// Click anywhere -> focus the input (real terminal feel)
document.addEventListener("click", (e) => {
  if (window.getSelection().toString()) return; // don't steal focus while user is selecting
  input.focus();
});

// Reposition the blinking cursor right after the typed text
const cursor = document.querySelector(".cursor");
function placeCursor() {
  // measure typed text width using a temp span
  const mirror = document.createElement("span");
  mirror.textContent = input.value || "";
  mirror.style.font = getComputedStyle(input).font;
  mirror.style.visibility = "hidden";
  mirror.style.position = "absolute";
  mirror.style.whiteSpace = "pre";
  document.body.appendChild(mirror);
  const w = mirror.getBoundingClientRect().width;
  document.body.removeChild(mirror);
  const promptW = document.querySelector(".prompt-line .prompt").getBoundingClientRect().width;
  cursor.style.left = (promptW + w) + "px";
}
input.addEventListener("input", placeCursor);
window.addEventListener("resize", placeCursor);

// ----- boot ---------------------------------------------------------

async function boot() {
  banner.textContent = BANNER;

  await typeLine(`<span class="muted">Last login: ${new Date().toUTCString()}</span>`, 4);
  await typeLine(`<span class="value">Welcome to <span class="accent">${escapeHtml(BIO.name || GITHUB_USERNAME)}</span>'s portfolio shell — <span class="muted">${escapeHtml(BIO.title || "")}</span></span>`, 8);
  await typeLine(`<span class="muted">Type</span> <span class="accent">help</span> <span class="muted">to see available commands. Try</span> <span class="accent">about</span><span class="muted">,</span> <span class="accent">skills</span><span class="muted">,</span> <span class="accent">experience</span><span class="muted">, or</span> <span class="accent">demos</span><span class="muted">.</span>`, 6);

  // Auto-run whoami so visitors immediately see something
  await run("whoami");

  placeCursor();
  input.focus();
}

boot().catch(err => {
  print(`<span class="error">boot error: ${escapeHtml(err.message)}</span>`);
});
