import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5177);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const KANBAN_PATH = path.join(DATA_DIR, "kanban.json");
const GOOGLE_REDIRECT_URI = `http://127.0.0.1:${PORT}/api/google/oauth/callback`;
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks"
].join(" ");

const DEFAULT_SETTINGS = {
  vaultPath: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "qwen3:14b",
  calendarIcsUrl: "",
  googleClientId: "",
  googleClientSecret: "",
  googleCalendarId: "primary",
  googleTaskListId: "",
  googleTaskCategoryListIds: {
    normal: "",
    reading: "",
    google: ""
  },
  todoCategories: [
    { id: "normal", name: "通常TODO", googleTaskListId: "" },
    { id: "reading", name: "読書TODO", googleTaskListId: "" },
    { id: "google", name: "Google Tasks", googleTaskListId: "" }
  ],
  googleTokens: null,
  taskFiles: [
    "07_タスク管理/📥_受信箱.md",
    "07_タスク管理/🏆_タスク管理.md",
    "07_タスク管理/📁_プロジェクト.md",
    "07_タスク管理/💭_いつかやる.md"
  ]
};

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);

function todayParts() {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  const yyyy = parts.year;
  const mm = parts.month;
  const dd = parts.day;
  return {
    yyyy,
    monthNumber: String(Number(mm)),
    isoDate: `${yyyy}-${mm}-${dd}`
  };
}

function timeLabel(date = new Date()) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function normalizeRelPath(relPath) {
  return relPath.replaceAll("/", path.sep);
}

function vaultFilePath(vaultPath, relPath) {
  const base = path.resolve(vaultPath);
  const target = path.resolve(base, normalizeRelPath(relPath));
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error("Vault外のパスにはアクセスできません。");
  }
  return target;
}

async function fileExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}


async function readKanban() {
  const saved = await readJson(KANBAN_PATH, {});
  const rawItems = saved && typeof saved.items === "object" && saved.items ? saved.items : {};
  const allowed = new Set(["today", "focus", "waiting"]);
  const items = {};
  for (const [taskId, status] of Object.entries(rawItems)) {
    const key = String(taskId || "").trim();
    const value = String(status || "").trim();
    if (key && allowed.has(value)) items[key] = value;
  }
  return { items };
}

async function saveKanban(kanban) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const next = { items: kanban.items || {} };
  await fs.writeFile(KANBAN_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}

async function moveKanbanTask(taskId, status) {
  const id = String(taskId || "").trim();
  const nextStatus = String(status || "backlog").trim();
  if (!id) throw new Error("Kanbanへ移動するTODOが見つかりません。");
  if (!["backlog", "today", "focus", "waiting"].includes(nextStatus)) throw new Error("Kanbanの移動先が不正です。");
  const kanban = await readKanban();
  if (nextStatus === "backlog") {
    delete kanban.items[id];
  } else {
    kanban.items[id] = nextStatus;
  }
  return saveKanban(kanban);
}
async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}


function categoryIdFromText(value) {
  const text = String(value || "").trim().toLowerCase();
  const ascii = text.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  if (ascii) return ascii;
  if (!text) return "";
  return `cat-${createHash("sha1").update(text).digest("hex").slice(0, 8)}`;
}

function sanitizeTodoCategories(categories, legacyMappings = {}) {
  const defaults = DEFAULT_SETTINGS.todoCategories.map((category) => ({
    ...category,
    googleTaskListId: String(legacyMappings[category.id] || category.googleTaskListId || "").trim()
  }));
  const byId = new Map(defaults.map((category) => [category.id, category]));
  for (const item of Array.isArray(categories) ? categories : []) {
    const name = String(item?.name || "").trim().slice(0, 40);
    const id = categoryIdFromText(item?.id || name);
    if (!id || !name) continue;
    const current = byId.get(id) || { id, name, googleTaskListId: "" };
    byId.set(id, {
      ...current,
      name,
      googleTaskListId: String(item?.googleTaskListId || legacyMappings[id] || current.googleTaskListId || "").trim()
    });
  }
  return Array.from(byId.values()).slice(0, 20);
}

function normalizeTodoCategoryId(settings, category) {
  const id = categoryIdFromText(category);
  return (settings.todoCategories || []).some((item) => item.id === id) ? id : "google";
}

function taskCategoryId(settings, task) {
  const raw = String(task.raw || "");
  const explicit = raw.match(/#mlc\/category\/([A-Za-z0-9_-]+)/)?.[1];
  if (explicit && (settings.todoCategories || []).some((item) => item.id === explicit)) return explicit;
  const title = String(task.title || "");
  return raw.includes("#reading-action") || /^【.+?】/.test(title) ? "reading" : "normal";
}
async function loadSettings() {
  const saved = await readJson(SETTINGS_PATH, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    googleTaskCategoryListIds: {
      ...DEFAULT_SETTINGS.googleTaskCategoryListIds,
      ...(saved.googleTaskCategoryListIds || {})
    },
    todoCategories: sanitizeTodoCategories(saved.todoCategories, saved.googleTaskCategoryListIds || {}),
    taskFiles: Array.isArray(saved.taskFiles) ? saved.taskFiles : DEFAULT_SETTINGS.taskFiles
  };
}

async function saveSettings(settings) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const next = {
    ...DEFAULT_SETTINGS,
    ...settings,
    googleTaskCategoryListIds: {
      ...DEFAULT_SETTINGS.googleTaskCategoryListIds,
      ...(settings.googleTaskCategoryListIds || {})
    },
    todoCategories: sanitizeTodoCategories(settings.todoCategories, settings.googleTaskCategoryListIds || {}),
    taskFiles: DEFAULT_SETTINGS.taskFiles
  };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function publicSettings(settings) {
  const { googleClientSecret, googleTokens, ...safeSettings } = settings;
  return {
    ...safeSettings,
    googleClientSecretSet: Boolean(googleClientSecret),
    googleConnected: Boolean(googleTokens?.refresh_token || googleTokens?.access_token),
    googleRedirectUri: GOOGLE_REDIRECT_URI
  };
}

function requireGoogleConfig(settings) {
  if (!settings.googleClientId || !settings.googleClientSecret) {
    throw new Error("Google OAuthのClient IDとClient Secretを設定してください。");
  }
}

function googleAuthUrl(settings) {
  requireGoogleConfig(settings);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", settings.googleClientId);
  url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

async function postGoogleToken(params) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error_description || body.error || `Google OAuth error: ${response.status}`);
  }
  return body;
}

async function exchangeGoogleCode(settings, code) {
  requireGoogleConfig(settings);
  const token = await postGoogleToken({
    code,
    client_id: settings.googleClientId,
    client_secret: settings.googleClientSecret,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code"
  });
  const googleTokens = {
    ...settings.googleTokens,
    ...token,
    expiry_date: Date.now() + Number(token.expires_in || 3600) * 1000
  };
  await saveSettings({ ...settings, googleTokens });
}

async function ensureGoogleAccessToken(settings) {
  requireGoogleConfig(settings);
  const tokens = settings.googleTokens || {};
  if (!tokens.access_token && !tokens.refresh_token) {
    throw new Error("Google Calendarに接続してください。");
  }
  if (tokens.access_token && Number(tokens.expiry_date || 0) > Date.now() + 60000) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) {
    throw new Error("Googleの再認証が必要です。設定からGoogle接続をやり直してください。");
  }
  const token = await postGoogleToken({
    client_id: settings.googleClientId,
    client_secret: settings.googleClientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token"
  });
  const googleTokens = {
    ...tokens,
    ...token,
    refresh_token: tokens.refresh_token,
    expiry_date: Date.now() + Number(token.expires_in || 3600) * 1000
  };
  await saveSettings({ ...settings, googleTokens });
  return googleTokens.access_token;
}

async function googleApiFetch(settings, url, options = {}) {
  const accessToken = await ensureGoogleAccessToken(settings);
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.message || `Google API error: ${response.status}`);
  }
  return body;
}

async function readGoogleTaskLists(settings) {
  const result = await googleApiFetch(settings, "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100");
  return (result.items || []).map((list) => ({
    id: list.id,
    title: list.title || "無題のリスト"
  })).filter((list) => list.id);
}

async function createGoogleTaskList(settings, title) {
  const result = await googleApiFetch(settings, "https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
    method: "POST",
    body: JSON.stringify({ title })
  });
  if (!result.id) throw new Error("Google Tasksリストを作成できませんでした。");
  return { id: result.id, title: result.title || title };
}

async function ensureGoogleTaskListsForCategories(settings, categories) {
  if (!settings.googleTokens?.refresh_token && !settings.googleTokens?.access_token) return categories;
  const taskLists = await readGoogleTaskLists(settings);
  const byTitle = new Map(taskLists.map((list) => [String(list.title || "").trim(), list]));
  const next = [];
  for (const category of categories) {
    const googleTaskListId = String(category.googleTaskListId || "").trim();
    if (googleTaskListId) {
      next.push({ ...category, googleTaskListId });
      continue;
    }
    const title = String(category.name || "").trim();
    if (!title) {
      next.push(category);
      continue;
    }
    const existing = byTitle.get(title);
    if (existing?.id) {
      next.push({ ...category, googleTaskListId: existing.id });
      continue;
    }
    const created = await createGoogleTaskList(settings, title);
    byTitle.set(created.title, created);
    next.push({ ...category, googleTaskListId: created.id });
  }
  return next;
}

function googleTaskCategoryFromListId(settings, taskListId) {
  const categories = settings.todoCategories || [];
  const found = categories.find((category) => String(category.googleTaskListId || "").trim() === taskListId);
  if (found?.id) return found.id;
  const legacy = Object.entries(settings.googleTaskCategoryListIds || {}).find(([, listId]) => String(listId || "").trim() === taskListId);
  return legacy?.[0] || "google";
}

async function resolveGoogleTaskListId(settings, category = "google", taskLists = null) {
  const categoryId = normalizeTodoCategoryId(settings, category);
  const matchedCategory = (settings.todoCategories || []).find((item) => item.id === categoryId);
  const categoryListId = String(matchedCategory?.googleTaskListId || settings.googleTaskCategoryListIds?.[categoryId] || "").trim();
  if (categoryListId) return categoryListId;
  const configured = String(settings.googleTaskListId || "").trim();
  if (configured) return configured;
  const lists = taskLists || await readGoogleTaskLists(settings);
  const first = lists[0];
  if (!first?.id) throw new Error("Google Tasksのリストが見つかりません。");
  return first.id;
}
async function readGoogleTasks(settings) {
  if (!settings.googleTokens?.refresh_token && !settings.googleTokens?.access_token) {
    return { configured: false, taskLists: [], tasks: [], error: null };
  }
  try {
    const taskLists = await readGoogleTaskLists(settings);
    const listIds = new Set([
      ...(settings.todoCategories || []).map((category) => String(category.googleTaskListId || "").trim()),
      ...Object.values(settings.googleTaskCategoryListIds || {}).map((value) => String(value || "").trim())
    ].filter(Boolean));
    if (settings.googleTaskListId) listIds.add(String(settings.googleTaskListId).trim());
    if (listIds.size === 0) listIds.add(await resolveGoogleTaskListId(settings, "google", taskLists));

    const listById = new Map(taskLists.map((list) => [list.id, list]));
    const tasks = [];
    for (const taskListId of listIds) {
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=false&maxResults=100`;
      const result = await googleApiFetch(settings, url);
      const taskListTitle = listById.get(taskListId)?.title || "Google Tasks";
      const category = googleTaskCategoryFromListId(settings, taskListId);
      tasks.push(...(result.items || []).map((task) => ({
        id: task.id,
        title: task.title || "無題",
        notes: task.notes || "",
        due: task.due || null,
        status: task.status || "needsAction",
        taskListId,
        taskListTitle,
        category
      })));
    }

    return {
      configured: true,
      taskListId: await resolveGoogleTaskListId(settings, "google", taskLists),
      taskLists,
      tasks,
      error: null
    };
  } catch (error) {
    return { configured: true, taskLists: [], tasks: [], error: error.message };
  }
}
async function createGoogleTask(settings, payload) {
  const title = String(payload.title || "").trim();
  let notes = String(payload.notes || "").trim();
  const dueDate = String(payload.dueDate || "").trim();
  const obsidianTaskId = String(payload.obsidianTaskId || "").trim();
  const category = normalizeTodoCategoryId(settings, String(payload.category || "google").trim());
  if (!title) throw new Error("Google Tasksへ追加するTODOを入力してください。");
  if (obsidianTaskId) {
    const marker = `mlc:obsidian-task-id=${obsidianTaskId}`;
    const existing = await readGoogleTasks(settings);
    const found = (existing.tasks || []).find((task) => String(task.notes || "").includes(marker));
    if (found) return { ...found, alreadyExists: true };
    notes = notes ? `${notes}\n${marker}` : marker;
  }
  const taskListId = await resolveGoogleTaskListId(settings, category);
  const body = { title, notes };
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    body.due = `${dueDate}T00:00:00.000Z`;
  }
  const task = await googleApiFetch(settings, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`, {
    method: "POST",
    body: JSON.stringify(body)
  });
  const diaryLines = [`- ${timeLabel()} 追加: ${title}`];
  if (dueDate) diaryLines.push(`  - 期限: ${dueDate}`);
  if (notes) diaryLines.push(`  - メモ: ${notes.replace(/\r?\n/g, " / ")}`);
  diaryLines.push(`  - Google Tasks ID: ${task.id || "unknown"}`);
  await appendToDailyDiary(settings.vaultPath, "Google Tasks", diaryLines);
  return task;
}

async function completeGoogleTask(settings, payload) {
  const taskId = String(payload.id || "").trim();
  const title = String(payload.title || "Google Tasks TODO").trim() || "Google Tasks TODO";
  const category = normalizeTodoCategoryId(settings, String(payload.category || "google").trim());
  if (!taskId) throw new Error("完了するGoogle Tasks TODOが見つかりません。");
  const taskListId = String(payload.taskListId || "").trim() || await resolveGoogleTaskListId(settings, category);
  const task = await googleApiFetch(settings, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "completed",
      completed: new Date().toISOString()
    })
  });
  await appendToDailyDiary(settings.vaultPath, "今日の完了", [
    `- ${timeLabel()} 完了: ${title}`,
    `  - 出典: Google Tasks:${taskId}`
  ]);
  return task;
}
async function syncObsidianTasksToGoogle(settings) {
  const taskResult = await readTasks(settings);
  let createdCount = 0;
  let skippedCount = 0;
  for (const task of taskResult.tasks) {
    const googleTask = await createGoogleTask(settings, {
      title: task.title,
      dueDate: task.dueDate || "",
      notes: `Obsidian: ${task.fileRel}:${task.lineIndex + 1}`,
      obsidianTaskId: task.id,
      category: taskCategoryId(settings, task)
    });
    if (googleTask.alreadyExists) {
      skippedCount += 1;
    } else {
      createdCount += 1;
    }
  }
  return { createdCount, skippedCount, totalCount: taskResult.tasks.length };
}
function eventDateTime(date, time) {
  return `${date}T${time}:00+09:00`;
}

async function createGoogleCalendarEvent(settings, payload) {
  const title = String(payload.title || "").trim();
  const date = String(payload.date || "").trim();
  const startTime = String(payload.startTime || "").trim();
  const endTime = String(payload.endTime || "").trim();
  const location = String(payload.location || "").trim();
  const description = String(payload.description || "").trim();
  if (!title) throw new Error("予定タイトルを入力してください。");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("予定日を指定してください。");
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    throw new Error("開始時刻と終了時刻を指定してください。");
  }
  if (eventDateTime(date, endTime) <= eventDateTime(date, startTime)) {
    throw new Error("終了時刻は開始時刻より後にしてください。");
  }

  const accessToken = await ensureGoogleAccessToken(settings);
  const calendarId = encodeURIComponent(String(settings.googleCalendarId || "primary").trim() || "primary");
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: title,
      location,
      description,
      start: { dateTime: eventDateTime(date, startTime), timeZone: "Asia/Tokyo" },
      end: { dateTime: eventDateTime(date, endTime), timeZone: "Asia/Tokyo" }
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.message || `Google Calendar API error: ${response.status}`);
  }
  return body;
}
function safeOllamaUrl(rawUrl) {
  const parsed = new URL(rawUrl || DEFAULT_SETTINGS.ollamaUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(parsed.hostname)) {
    throw new Error("MVPではlocalhostのOllamaだけに接続できます。");
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}
function dailyDiaryRelPath() {
  const today = todayParts();
  return `01_日記/${today.yyyy}/${today.monthNumber}月/${today.isoDate}.md`;
}

async function ensureDailyDiary(vaultPath) {
  const relPath = dailyDiaryRelPath();
  const filePath = vaultFilePath(vaultPath, relPath);
  if (!(await fileExists(filePath))) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `# ${todayParts().isoDate}\n\n`, "utf8");
  }
  return { relPath, filePath };
}

function trimTaskText(rawTask) {
  return rawTask
    .replace(/^\s*-\s\[[ xX]\]\s*/, "")
    .replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/g, "")
    .trim();
}

function parseTaskLine(line, fileRel, lineIndex, mtimeMs) {
  const match = line.match(/^(\s*)-\s\[( |x|X)\]\s(.+)$/);
  if (!match) return null;
  const [, indent, status, body] = match;
  const dueMatch = body.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
  const doneMatch = body.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
  const raw = line;
  return {
    id: createHash("sha1").update(`${fileRel}\0${lineIndex}\0${raw}`).digest("hex").slice(0, 18),
    fileRel,
    lineIndex,
    raw,
    indent,
    title: trimTaskText(raw),
    dueDate: dueMatch?.[1] || null,
    doneDate: doneMatch?.[1] || null,
    completed: status.toLowerCase() === "x",
    mtimeMs
  };
}

async function readTasks(settings) {
  const tasks = [];
  const missingFiles = [];
  for (const fileRel of settings.taskFiles) {
    const filePath = vaultFilePath(settings.vaultPath, fileRel);
    if (!(await fileExists(filePath))) {
      missingFiles.push(fileRel);
      continue;
    }
    const stat = await fs.stat(filePath);
    const content = await fs.readFile(filePath, "utf8");
    content.split(/\r?\n/).forEach((line, lineIndex) => {
      const task = parseTaskLine(line, fileRel, lineIndex, stat.mtimeMs);
      if (task && !task.completed) tasks.push({ ...task, category: taskCategoryId(settings, task) });
    });
  }
  tasks.sort((a, b) => {
    const aDue = a.dueDate || "9999-99-99";
    const bDue = b.dueDate || "9999-99-99";
    return aDue.localeCompare(bDue) || a.fileRel.localeCompare(b.fileRel) || a.lineIndex - b.lineIndex;
  });
  return { tasks, missingFiles };
}

function findHeadingRange(lines, heading) {
  const headingRe = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`);
  const start = lines.findIndex((line) => headingRe.test(line));
  if (start === -1) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function appendUnderHeading(content, heading, entryLines) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const range = findHeadingRange(lines, heading);
  if (!range) {
    const base = content.trimEnd();
    return `${base}\n\n## ${heading}\n\n${entryLines.join("\n")}\n`;
  }

  let insertAt = range.end;
  while (insertAt > range.start + 1 && lines[insertAt - 1].trim() === "") {
    insertAt -= 1;
  }
  const needsBlankBefore = insertAt > range.start + 1 && lines[insertAt - 1].trim() !== "";
  const insertLines = [...(needsBlankBefore ? [""] : []), ...entryLines, ""];
  lines.splice(insertAt, 0, ...insertLines);
  return lines.join("\n").replace(/\n{4,}/g, "\n\n\n");
}

async function appendToDailyDiary(vaultPath, heading, entryLines) {
  const diary = await ensureDailyDiary(vaultPath);
  const content = await fs.readFile(diary.filePath, "utf8");
  const next = appendUnderHeading(content, heading, entryLines);
  await fs.writeFile(diary.filePath, next, "utf8");
  return diary.relPath;
}

async function addTask(settings, payload) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("追加するTODOを入力してください。");
  if (/\r|\n/.test(title)) throw new Error("TODO本文は1行で入力してください。");

  const dueDate = String(payload.dueDate || "").trim();
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new Error("期限は YYYY-MM-DD 形式で入力してください。");
  }

  let workingSettings = settings;
  const kind = normalizeTodoCategoryId(settings, String(payload.kind || "normal").trim());
  if (settings.googleTokens?.refresh_token || settings.googleTokens?.access_token) {
    const nextCategories = await ensureGoogleTaskListsForCategories(settings, settings.todoCategories || []);
    if (JSON.stringify(nextCategories) !== JSON.stringify(settings.todoCategories || [])) {
      workingSettings = await saveSettings({ ...settings, todoCategories: nextCategories });
    }
  }

  const inboxRel = "07_タスク管理/📥_受信箱.md";
  const filePath = vaultFilePath(workingSettings.vaultPath, inboxRel);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const exists = await fileExists(filePath);
  const current = exists ? await fs.readFile(filePath, "utf8") : "# 📥 受信箱\n\n";
  const datePart = dueDate ? ` 📅 ${dueDate}` : "";
  const readingTag = kind === "reading" && !title.includes("#reading-action") ? " #reading-action" : "";
  const categoryTag = !["normal", "reading"].includes(kind) ? ` #mlc/category/${kind}` : "";
  const taskLine = `- [ ] ${title}${datePart} #task${readingTag}${categoryTag}`;
  const prefix = current.endsWith("\n") ? current : `${current}\n`;
  const lineIndex = prefix.replace(/\r\n/g, "\n").split("\n").length - 1;
  await fs.writeFile(filePath, `${prefix}${taskLine}\n`, "utf8");

  let googleTask = null;
  let googleTaskError = null;
  if (workingSettings.googleTokens?.refresh_token || workingSettings.googleTokens?.access_token) {
    try {
      const stat = await fs.stat(filePath);
      const parsed = parseTaskLine(taskLine, inboxRel, lineIndex, stat.mtimeMs);
      googleTask = await createGoogleTask(workingSettings, {
        title,
        dueDate,
        notes: `Obsidian: ${inboxRel}:${lineIndex + 1}`,
        obsidianTaskId: parsed?.id || "",
        category: kind
      });
    } catch (error) {
      googleTaskError = error.message;
    }
  }

  return { taskLine, fileRel: inboxRel, googleTask, googleTaskError };
}
async function completeLinkedGoogleTask(settings, payload, title) {
  if (!settings.googleTokens?.refresh_token && !settings.googleTokens?.access_token) return null;
  const obsidianTaskId = String(payload.id || "").trim();
  const sourceLine = Number.isInteger(Number(payload.lineIndex)) ? Number(payload.lineIndex) + 1 : "";
  const source = sourceLine ? `Obsidian: ${payload.fileRel}:${sourceLine}` : "";
  const marker = obsidianTaskId ? `mlc:obsidian-task-id=${obsidianTaskId}` : "";
  const googleTasks = await readGoogleTasks(settings);
  const linked = (googleTasks.tasks || []).find((task) => {
    const notes = String(task.notes || "");
    return (marker && notes.includes(marker)) || (source && notes.includes(source)) || task.title === title;
  });
  if (!linked?.id) return null;
  const taskListId = linked.taskListId || googleTasks.taskListId || await resolveGoogleTaskListId(settings, taskCategoryId(settings, payload));
  await googleApiFetch(settings, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(linked.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "completed",
      completed: new Date().toISOString()
    })
  });
  return linked;
}
async function completeTask(settings, payload) {
  const filePath = vaultFilePath(settings.vaultPath, payload.fileRel);
  const stat = await fs.stat(filePath);
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let lineIndex = Number(payload.lineIndex);

  if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= lines.length || lines[lineIndex] !== payload.raw) {
    lineIndex = lines.findIndex((line) => line === payload.raw);
  }

  if (lineIndex === -1) {
    throw new Error("対象TODO行が見つかりません。Obsidian側で変更されている可能性があります。");
  }
  if (!/^\s*-\s\[ \]\s/.test(lines[lineIndex])) {
    throw new Error("対象TODOは未完了形式ではありません。");
  }

  const isoDate = todayParts().isoDate;
  const before = lines[lineIndex];
  let after = before.replace("- [ ]", "- [x]");
  if (!/✅\s*\d{4}-\d{2}-\d{2}/.test(after)) {
    after = `${after} ✅ ${isoDate}`;
  }
  lines[lineIndex] = after;
  await fs.writeFile(filePath, lines.join("\n"), "utf8");

  const title = trimTaskText(after);
  const linkedGoogleTask = await completeLinkedGoogleTask(settings, { ...payload, lineIndex }, title);
  const diaryLines = [
    `- ${timeLabel()} 完了: ${title}`,
    `  - 出典: ${payload.fileRel}:${lineIndex + 1}`
  ];
  if (linkedGoogleTask) diaryLines.push(`  - Google Tasksも完了: ${linkedGoogleTask.title}`);
  await appendToDailyDiary(settings.vaultPath, "今日の完了", diaryLines);

  return {
    completedTask: {
      ...payload,
      title,
      lineIndex,
      previousMtimeMs: payload.mtimeMs,
      currentMtimeMs: stat.mtimeMs
    }
  };
}

function formatDuration(seconds) {
  const totalMinutes = Math.max(1, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}分`;
  if (minutes === 0) return `${hours}時間`;
  return `${hours}時間${minutes}分`;
}

function extractSectionLines(content, heading) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const range = findHeadingRange(lines, heading);
  if (!range) return [];
  return lines.slice(range.start + 1, range.end).filter((line) => line.trim() !== "");
}

async function readDiarySnapshot(settings) {
  const relPath = dailyDiaryRelPath();
  const filePath = vaultFilePath(settings.vaultPath, relPath);
  if (!(await fileExists(filePath))) {
    return {
      diaryRelPath: relPath,
      diaryExists: false,
      completionLines: [],
      studyLines: [],
      memoLines: []
    };
  }
  const content = await fs.readFile(filePath, "utf8");
  return {
    diaryRelPath: relPath,
    diaryExists: true,
    completionLines: extractSectionLines(content, "今日の完了"),
    studyLines: extractSectionLines(content, "学習ログ"),
    memoLines: extractSectionLines(content, "今日のメモ")
  };
}

function buildPriorityPrompt(state) {
  const tasks = (state.tasks || []).slice(0, 20).map((task, index) => {
    const due = task.dueDate ? ` / 期限:${task.dueDate}` : "";
    return `${index + 1}. ${task.title}${due} / 出典:${task.fileRel}:${task.lineIndex + 1}`;
  });
  const completions = (state.completionLines || []).slice(-8).join("\n");
  const study = (state.studyLines || []).slice(-8).join("\n");

  return [
    "あなたはMasa Life CommandのローカルAI秘書です。",
    "Obsidian Vaultのファイル操作はアプリが担当します。あなたは保存や書き換えを提案しないでください。",
    "以下の情報だけを見て、今日の優先順位を短く日本語で提案してください。",
    "出力は次の形式にしてください。",
    "1. 最優先: ...",
    "2. 次にやる: ...",
    "3. 余裕があれば: ...",
    "一言: ...",
    "",
    `日付: ${state.today}`,
    "",
    "未完了TODO:",
    tasks.length ? tasks.join("\n") : "なし",
    "",
    "今日の完了ログ:",
    completions || "なし",
    "",
    "今日の学習ログ:",
    study || "なし"
  ].join("\n");
}

async function askOllamaForPriority(settings) {
  const state = await appState();
  const ollamaUrl = safeOllamaUrl(settings.ollamaUrl);
  const model = String(settings.ollamaModel || DEFAULT_SETTINGS.ollamaModel).trim();
  if (!model) throw new Error("Ollamaモデル名を設定してください。");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt: buildPriorityPrompt(state),
        stream: false,
        options: {
          temperature: 0.4,
          num_predict: 500
        }
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `Ollama API error: ${response.status}`);
    }
    return {
      model,
      response: String(body.response || "").trim(),
      state
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Ollamaの応答がタイムアウトしました。モデルが重い可能性があります。");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
function compactItems(items, limit = 10) {
  return Array.isArray(items) ? items.slice(0, limit) : [];
}

function buildCodexPrompt(snapshot, question) {
  if (!snapshot) {
    return [
      "あなたはMasa Life Commandに内蔵されたCodexです。",
      "この実行は読み取り専用です。ファイル変更、危険な操作はせず、日本語で簡潔に答えてください。",
      "今回はMasa Life CommandのTODO・予定・日記の文脈は含まれていません。必要なら、ユーザーに文脈付き実行を選ぶよう案内してください。",
      "",
      "ユーザーの依頼:",
      String(question || "").trim()
    ].join("\n");
  }
  const tasks = compactItems(snapshot.tasks || [], 12).map((task, index) => {
    const due = task.due ? ` / 期限:${task.due}` : "";
    return `${index + 1}. ${task.title}${due} / ${task.fileRel}:${task.lineIndex + 1}`;
  });
  const googleTasks = compactItems(snapshot.googleTasks?.tasks || [], 8).map((task, index) => {
    const due = task.due ? ` / 期限:${task.due}` : "";
    return `${index + 1}. ${task.title}${due} / Google Tasks:${task.taskListTitle || ""}`;
  });
  const calendar = compactItems(snapshot.calendar?.events || [], 8).map((event, index) => {
    return `${index + 1}. ${event.start || ""} ${event.title || "無題"}`;
  });
  const completions = (snapshot.completionLines || []).slice(-8).join("\n") || "なし";
  const study = (snapshot.studyLines || []).slice(-8).join("\n") || "なし";

  return [
    "あなたはMasa Life Commandに内蔵されたCodexです。",
    "この実行は読み取り専用です。ファイル変更、コマンド実行の提案、危険な操作はせず、必要なら変更案を具体的に説明してください。",
    "ユーザーの生活管理、Obsidian、TODO、学習、Google Calendar/Tasksを助けるために、日本語で簡潔に答えてください。",
    "実装相談の場合は、変更対象ファイルと手順を短く整理してください。",
    "",
    `今日: ${snapshot.today}`,
    `日記: ${snapshot.diaryRelPath}`,
    "",
    "Obsidian TODO:",
    tasks.length ? tasks.join("\n") : "なし",
    "",
    "Google Tasks:",
    googleTasks.length ? googleTasks.join("\n") : "なし",
    "",
    "Calendar:",
    calendar.length ? calendar.join("\n") : "なし",
    "",
    "今日の完了ログ:",
    completions,
    "",
    "今日の学習ログ:",
    study,
    "",
    "ユーザーの依頼:",
    String(question || "").trim()
  ].join("\n");
}

function formatCodexError(output) {
  const text = String(output || "").trim();
  if (!text) return "Codexがエラーで終了しました。";
  const modelMatch = text.match(/The '[^']+' model[^\r\n]+/);
  if (modelMatch) return modelMatch[0];
  const errorLine = text.split(/\r?\n/).reverse().find((line) => /ERROR|error|failed|失敗|拒否/.test(line));
  return (errorLine || text).slice(0, 700);
}
async function runCodexAsk(settings, question, includeContext = false) {
  const trimmed = String(question || "").trim();
  if (!trimmed) throw new Error("Codexへの相談内容を入力してください。");
  const snapshot = includeContext ? await appState() : null;
  await fs.mkdir(DATA_DIR, { recursive: true });
  const outputPath = path.join(DATA_DIR, `codex-last-${Date.now()}.txt`);
  const command = "codex";
  const args = [
    "--ask-for-approval", "never",
    "exec",
    "--skip-git-repo-check",
    "--model", "gpt-5.4-mini",
    "--sandbox", "read-only",
    "--cd", __dirname,
    ...(includeContext ? ["--add-dir", settings.vaultPath] : []),
    "--output-last-message", outputPath,
    "--color", "never",
    "-"
  ];
  const prompt = buildCodexPrompt(snapshot, trimmed);

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: __dirname,
      windowsHide: true,
      shell: process.platform === "win32",
      env: { ...process.env, NO_COLOR: "1" }
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Codexの応答がタイムアウトしました。依頼を短くしてもう一度試してください。"));
    }, 240000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 40000) stdout = stdout.slice(-40000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 12000) stderr = stderr.slice(-12000);
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`Codexを起動できませんでした: ${error.message}`));
    });
    child.on("close", async (code) => {
      clearTimeout(timeout);
      try {
        const finalMessage = await fs.readFile(outputPath, "utf8").catch(() => "");
        await fs.unlink(outputPath).catch(() => {});
        if (code !== 0) {
          const detail = (stderr || stdout || "Codexがエラーで終了しました。").trim();
          reject(new Error(detail));
          return;
        }
        resolve({ response: (finalMessage || stdout).trim(), transcript: stdout.trim(), state: snapshot });
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(prompt);
  });
}

function buildAiDraftPrompt(snapshot, kind, source) {
  const mode = String(kind || "diary");
  const headingMap = {
    diary: "今日のメモ",
    review: "AI秘書レビュー",
    study: "学習ログ",
    inbox: "今日のメモ"
  };
  const tasks = compactItems(snapshot.tasks || [], 10).map((task, index) => {
    const due = task.dueDate ? ` / 期限:${task.dueDate}` : "";
    return `${index + 1}. ${task.title}${due}`;
  });
  const calendar = compactItems(snapshot.calendar?.events || [], 8).map((event, index) => `${index + 1}. ${event.start || ""} ${event.title || "無題"}`);
  const completions = (snapshot.completionLines || []).slice(-10).join("\n") || "なし";
  const study = (snapshot.studyLines || []).slice(-10).join("\n") || "なし";
  const instruction = {
    diary: "元メモを、今日の日記にそのまま追記しやすい短い箇条書きに整えてください。事実と感想を分け、断定しすぎないでください。",
    review: "夜の秘書レビューとして、今日の成果、よかった行動、詰まったこと、明日の優先タスク、秘書コメントを短く整理してください。",
    study: "学習ログとして、学んだこと、詰まったこと、次にやることを短く整理してください。",
    inbox: "AIインボックス分類として、元メモをTODO、日記、学習メモ、アイデア、後で確認に分類し、保存前確認しやすい形で出してください。"
  }[mode] || "今日の日記に追記しやすい下書きにしてください。";
  return {
    heading: headingMap[mode] || "今日のメモ",
    prompt: [
      "あなたはMasa Life CommandのローカルAI秘書です。",
      "Obsidianへの保存はアプリが行います。あなたはMarkdown断片の下書きだけを作ってください。",
      "秘密情報や認証情報を推測・要求しないでください。不確かな内容は推測として書いてください。",
      "出力は日本語。見出しは不要。今日の日記に追記する本文だけを返してください。",
      "箇条書き中心で、長くしすぎないでください。",
      "",
      `今日: ${snapshot.today}`,
      `保存候補見出し: ${headingMap[mode] || "今日のメモ"}`,
      "",
      "指示:",
      instruction,
      "",
      "元メモ:",
      String(source || "").trim() || "なし",
      "",
      "参考: 未完了TODO:",
      tasks.length ? tasks.join("\n") : "なし",
      "",
      "参考: 今日の予定:",
      calendar.length ? calendar.join("\n") : "なし",
      "",
      "参考: 今日の完了ログ:",
      completions,
      "",
      "参考: 今日の学習ログ:",
      study
    ].join("\n")
  };
}

async function generateAiDraft(settings, payload = {}) {
  const snapshot = await appState();
  const ollamaUrl = safeOllamaUrl(settings.ollamaUrl);
  const model = String(settings.ollamaModel || DEFAULT_SETTINGS.ollamaModel).trim();
  if (!model) throw new Error("Ollamaモデル名を設定してください。");
  const { heading, prompt } = buildAiDraftPrompt(snapshot, payload.kind, payload.source);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.45,
          num_predict: 900
        }
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Ollama API error: ${response.status}`);
    return { model, heading, draft: String(body.response || "").trim(), state: snapshot };
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Ollamaの下書き生成がタイムアウトしました。元メモを短くしてもう一度試してください。");
    if (String(error.message || "").includes("fetch failed")) throw new Error("Ollamaに接続できません。Ollamaを起動して、設定のOllama URLとモデル名を確認してください。");
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function aiderModelName(settings) {
  const model = String(settings.ollamaModel || DEFAULT_SETTINGS.ollamaModel).trim();
  if (!model) throw new Error("Ollamaモデル名を設定してください。");
  return model.includes("/") ? model : `ollama_chat/${model}`;
}

function stripAnsi(value) {
  return String(value || "").replace(/\u001b\[[0-9;]*m/g, "").trim();
}

function buildAiderPrompt(snapshot, question) {
  const intro = [
    "あなたはMasa Life Commandに内蔵されたAiderです。",
    "この実行はaskモードです。ファイル編集はせず、日本語で実装相談・改善案・Obsidian運用案を返してください。",
    "Obsidianの正本はMarkdownで、AIは保存先や差分を提案し、実際の保存はアプリが行います。",
    "回答は具体的に、次に押すボタンや変更対象がわかる粒度にしてください。"
  ];
  if (!snapshot) return [...intro, "", "ユーザーの依頼:", String(question || "").trim()].join("\n");
  const tasks = compactItems(snapshot.tasks || [], 12).map((task, index) => `${index + 1}. ${task.title}${task.dueDate ? ` / 期限:${task.dueDate}` : ""}`);
  const calendar = compactItems(snapshot.calendar?.events || [], 8).map((event, index) => `${index + 1}. ${event.start || ""} ${event.title || "無題"}`);
  return [
    ...intro,
    "",
    `今日: ${snapshot.today}`,
    `日記: ${snapshot.diaryRelPath}`,
    "",
    "未完了TODO:",
    tasks.length ? tasks.join("\n") : "なし",
    "",
    "今日の予定:",
    calendar.length ? calendar.join("\n") : "なし",
    "",
    "今日の完了:",
    (snapshot.completionLines || []).slice(-8).join("\n") || "なし",
    "",
    "学習ログ:",
    (snapshot.studyLines || []).slice(-8).join("\n") || "なし",
    "",
    "ユーザーの依頼:",
    String(question || "").trim()
  ].join("\n");
}

async function runAiderAsk(settings, payload = {}) {
  const promptText = String(payload.prompt || "").trim();
  if (!promptText) throw new Error("Aiderへの相談内容を入力してください。");
  const snapshot = payload.includeContext ? await appState() : null;
  const args = [
    "--model", aiderModelName(settings),
    "--chat-mode", "ask",
    "--no-git",
    "--no-gitignore",
    "--no-auto-commits",
    "--no-pretty",
    "--no-stream",
    "--no-analytics",
    "--no-detect-urls"
  ];
  if (payload.includeAppFiles) {
    args.push("--read", path.join(__dirname, "server.js"));
    args.push("--read", path.join(PUBLIC_DIR, "app.js"));
    args.push("--read", path.join(PUBLIC_DIR, "index.html"));
    args.push("--read", path.join(PUBLIC_DIR, "styles.css"));
  }
  args.push("--message", buildAiderPrompt(snapshot, promptText));

  return await new Promise((resolve, reject) => {
    const child = spawn("aider", args, {
      cwd: __dirname,
      windowsHide: true,
      shell: process.platform === "win32",
      env: { ...process.env, NO_COLOR: "1", AIDER_ANALYTICS: "false" }
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Aiderの応答がタイムアウトしました。依頼を短くしてもう一度試してください。"));
    }, 240000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 60000) stdout = stdout.slice(-60000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 20000) stderr = stderr.slice(-20000);
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`Aiderを起動できませんでした: ${error.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const cleanStdout = stripAnsi(stdout);
      const cleanStderr = stripAnsi(stderr);
      if (code !== 0) {
        reject(new Error((cleanStderr || cleanStdout || "Aiderがエラーで終了しました。").slice(0, 1200)));
        return;
      }
      resolve({ model: aiderModelName(settings), response: cleanStdout || cleanStderr, state: snapshot });
    });
  });
}
function normalizeCalendarUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  const normalized = value.startsWith("webcal://") ? `https://${value.slice("webcal://".length)}` : value;
  const parsed = new URL(normalized);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Google CalendarのiCal URLは https:// または webcal:// を指定してください。");
  }
  return parsed.toString();
}

function unfoldIcsLines(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .reduce((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
      return lines;
    }, []);
}

function decodeIcsText(value) {
  return String(value || "")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{8}$/.test(raw)) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6)) - 1;
    const day = Number(raw.slice(6, 8));
    return { date: new Date(year, month, day), allDay: true };
  }
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, z] = match;
  const date = z
    ? new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
    : new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return { date, allDay: false };
}

function addInterval(date, freq, interval) {
  const next = new Date(date);
  if (freq === "DAILY") next.setDate(next.getDate() + interval);
  if (freq === "WEEKLY") next.setDate(next.getDate() + 7 * interval);
  if (freq === "MONTHLY") next.setMonth(next.getMonth() + interval);
  return next;
}

function parseRRule(value) {
  const rule = {};
  String(value || "").split(";").forEach((part) => {
    const [key, val] = part.split("=");
    if (key && val) rule[key] = val;
  });
  return rule;
}

function eventIntersects(start, end, rangeStart, rangeEnd) {
  const actualEnd = end && end > start ? end : new Date(start.getTime() + 30 * 60 * 1000);
  return start < rangeEnd && actualEnd > rangeStart;
}

function expandCalendarEvent(event, rangeStart, rangeEnd) {
  const instances = [];
  if (!event.start) return instances;
  const duration = event.end && event.end > event.start ? event.end.getTime() - event.start.getTime() : event.allDay ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000;
  const pushInstance = (start) => {
    const end = new Date(start.getTime() + duration);
    if (eventIntersects(start, end, rangeStart, rangeEnd)) {
      instances.push({ ...event, start, end });
    }
  };

  if (!event.rrule) {
    pushInstance(event.start);
    return instances;
  }

  const rule = parseRRule(event.rrule);
  const freq = rule.FREQ;
  if (!["DAILY", "WEEKLY", "MONTHLY"].includes(freq)) {
    pushInstance(event.start);
    return instances;
  }

  const interval = Math.max(1, Number(rule.INTERVAL || 1));
  const countLimit = rule.COUNT ? Math.min(Number(rule.COUNT), 500) : 500;
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL)?.date : null;
  let cursor = new Date(event.start);
  let count = 0;
  while (count < countLimit && cursor < rangeEnd) {
    if (!until || cursor <= until) pushInstance(cursor);
    cursor = addInterval(cursor, freq, interval);
    count += 1;
  }
  return instances;
}

function parseIcsEvents(icsText, rangeStart, rangeEnd) {
  const lines = unfoldIcsLines(icsText);
  const events = [];
  let current = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(...expandCalendarEvent(current, rangeStart, rangeEnd));
      current = null;
      continue;
    }
    if (!current) continue;
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const left = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1);
    const key = left.split(";")[0];
    if (key === "SUMMARY") current.title = decodeIcsText(value) || "無題";
    if (key === "LOCATION") current.location = decodeIcsText(value);
    if (key === "DESCRIPTION") current.description = decodeIcsText(value);
    if (key === "DTSTART") {
      const parsed = parseIcsDate(value);
      if (parsed) {
        current.start = parsed.date;
        current.allDay = parsed.allDay;
      }
    }
    if (key === "DTEND") {
      const parsed = parseIcsDate(value);
      if (parsed) current.end = parsed.date;
    }
    if (key === "RRULE") current.rrule = value;
  }
  return events
    .filter((event) => event.start)
    .sort((a, b) => a.start - b.start)
    .map((event) => ({
      title: event.title || "無題",
      location: event.location || "",
      allDay: Boolean(event.allDay),
      start: event.start.toISOString(),
      end: event.end ? event.end.toISOString() : null
    }));
}

async function readCalendar(settings) {
  const rawUrl = String(settings.calendarIcsUrl || "").trim();
  if (!rawUrl) return { configured: false, events: [], error: null };
  const calendarUrl = normalizeCalendarUrl(rawUrl);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay());
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  rangeEnd.setDate(rangeEnd.getDate() + (6 - rangeEnd.getDay()));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(calendarUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Google Calendar iCalの取得に失敗しました: ${response.status}`);
    const icsText = await response.text();
    return {
      configured: true,
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      events: parseIcsEvents(icsText, rangeStart, rangeEnd),
      error: null
    };
  } catch (error) {
    return {
      configured: true,
      events: [],
      error: error.name === "AbortError" ? "Google Calendarの取得がタイムアウトしました。" : error.message
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
function googleDueDate(task) {
  if (!task?.due) return null;
  const date = new Date(task.due);
  if (Number.isNaN(date.valueOf())) return null;
  return date.toISOString().slice(0, 10);
}

function googleTaskToFocusTodo(task) {
  return {
    id: `google:${task.id}`,
    source: "Google Tasks",
    title: task.title || "無題",
    category: task.category || "google",
    dueDate: googleDueDate(task),
    location: task.taskListTitle ? `Google Tasks / ${task.taskListTitle}` : "Google Tasks",
    note: task.notes || ""
  };
}

function obsidianTaskToFocusTodo(task) {
  return {
    id: task.id,
    source: "Obsidian",
    title: task.title || "無題",
    category: task.category || "normal",
    dueDate: task.dueDate || null,
    location: `${task.fileRel}:${task.lineIndex + 1}`,
    note: ""
  };
}

function pickFocusTodo(snapshot) {
  const obsidianTasks = (snapshot.tasks || []).map(obsidianTaskToFocusTodo);
  const googleTasks = (snapshot.googleTasks?.tasks || []).map(googleTaskToFocusTodo);
  const todos = [...obsidianTasks, ...googleTasks].sort((a, b) => {
    const aDue = a.dueDate || "9999-99-99";
    const bDue = b.dueDate || "9999-99-99";
    return aDue.localeCompare(bDue) || String(a.title).localeCompare(String(b.title));
  });
  const kanbanItems = snapshot.kanban?.items || {};
  return todos.find((todo) => kanbanItems[todo.id] === "focus") || todos[0] || null;
}

function focusSendHeading(target) {
  const value = String(target || "focus").trim();
  if (value === "study") return "学習ログ";
  if (value === "memo") return "今日のメモ";
  return "FocusTODO";
}

function focusTodoEntryLines(focus, durationSeconds = 0, heading = "FocusTODO") {
  const durationText = durationSeconds > 0 ? formatDuration(durationSeconds) : "";
  if (heading === "学習ログ") {
    return [
      `- ${timeLabel()} FocusTODO: ${focus.title}${durationText ? ` / ${durationText}` : ""}`,
      `  - 種別: ${focus.category}`,
      `  - 期限: ${focus.dueDate || "なし"}`,
      `  - 出典: ${focus.source} / ${focus.location}`,
      `  <!-- mlc:focus target="study" seconds=${Math.round(durationSeconds)} title="${String(focus.title).replaceAll('"', "'")}" -->`
    ];
  }
  if (heading === "今日のメモ") {
    return [
      `- ${timeLabel()} FocusTODO: ${focus.title}`,
      `  - 種別: ${focus.category}`,
      `  - 期限: ${focus.dueDate || "なし"}`,
      `  - 出典: ${focus.source} / ${focus.location}`,
      ...(durationText ? [`  - 勉強時間: ${durationText}`] : []),
      `  <!-- mlc:focus target="memo" title="${String(focus.title).replaceAll('"', "'")}" -->`
    ];
  }
  const lines = [
    `- ${focus.title}`,
    `  - 種別: ${focus.category}`,
    `  - 期限: ${focus.dueDate || "なし"}`,
    `  - 出典: ${focus.source} / ${focus.location}`,
    `  - 送信: ${timeLabel()}`,
    `  <!-- mlc:focus source="${String(focus.source).replaceAll('"', "'")}" title="${String(focus.title).replaceAll('"', "'")}" -->`
  ];
  if (focus.note) lines.splice(4, 0, `  - メモ: ${focus.note.replace(/\r?\n/g, " / ")}`);
  if (durationSeconds > 0) lines.splice(lines.length - 1, 0, `  - 勉強時間: ${durationText}`);
  return lines;
}

async function sendFocusTodoToObsidian(settings, payload = {}) {
  const snapshot = await appState();
  const focus = pickFocusTodo(snapshot);
  if (!focus) throw new Error("送信できるFocusTODOがありません。");
  const durationSeconds = Number(payload.durationSeconds || 0);
  const heading = focusSendHeading(payload.target);
  const lines = focusTodoEntryLines(focus, durationSeconds, heading);
  const diaryRelPath = await appendToDailyDiary(settings.vaultPath, heading, lines);
  return { focus, diaryRelPath, durationSeconds, heading };
}
async function appendFocusStudyTime(settings, payload = {}) {
  const durationSeconds = Number(payload.durationSeconds || 0);
  if (durationSeconds < 1) return null;
  const snapshot = await appState();
  const focus = pickFocusTodo(snapshot);
  if (!focus) return null;
  const category = String(payload.category || "その他").trim();
  const memo = String(payload.memo || "").trim();
  const timeRange = String(payload.timeRange || timeLabel()).trim();
  const lines = [
    `- ${focus.title}`,
    `  - 勉強時間: ${formatDuration(durationSeconds)} / ${category}`,
    `  - 時間: ${timeRange}`,
    `  - 出典: ${focus.source} / ${focus.location}`,
    `  - 期限: ${focus.dueDate || "なし"}`,
    `  <!-- mlc:focus-study seconds=${Math.round(durationSeconds)} category="${category.replaceAll('"', "'")}" title="${String(focus.title).replaceAll('"', "'")}" -->`
  ];
  if (memo) lines.splice(4, 0, `  - メモ: ${memo.replace(/\r?\n/g, " / ")}`);
  const diaryRelPath = await appendToDailyDiary(settings.vaultPath, "FocusTODO", lines);
  return { focus, diaryRelPath };
}
async function appState() {
  const settings = await loadSettings();
  const vaultExists = await fileExists(settings.vaultPath);
  const taskResult = vaultExists ? await readTasks(settings) : { tasks: [], missingFiles: settings.taskFiles };
  const diary = vaultExists
    ? await readDiarySnapshot(settings)
    : { diaryRelPath: dailyDiaryRelPath(), diaryExists: false, completionLines: [], studyLines: [], memoLines: [] };
  const calendar = await readCalendar(settings);
  const googleTasks = await readGoogleTasks(settings);
  const kanban = await readKanban();

  return {
    today: todayParts().isoDate,
    settings: publicSettings(settings),
    vaultExists,
    ...taskResult,
    ...diary,
    calendar,
    googleTasks,
    kanban
  };
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/config") {
      const settings = await loadSettings();
      return sendJson(res, 200, { settings: publicSettings(settings), vaultExists: await fileExists(settings.vaultPath) });
    }

    if (req.method === "POST" && url.pathname === "/api/config") {
      const body = await parseJsonBody(req);
      const vaultPath = String(body.vaultPath || "").trim();
      if (!path.isAbsolute(vaultPath)) throw new Error("Vaultパスは絶対パスで指定してください。");
      const current = await loadSettings();
      const nextSettings = {
        ...current,
        vaultPath,
        ollamaUrl: safeOllamaUrl(String(body.ollamaUrl || DEFAULT_SETTINGS.ollamaUrl).trim()),
        ollamaModel: String(body.ollamaModel || DEFAULT_SETTINGS.ollamaModel).trim(),
        calendarIcsUrl: normalizeCalendarUrl(String(body.calendarIcsUrl || "").trim()),
        googleClientId: String(body.googleClientId || "").trim(),
        googleClientSecret: String(body.googleClientSecret || current.googleClientSecret || "").trim(),
        googleCalendarId: String(body.googleCalendarId || "primary").trim() || "primary",
        googleTaskListId: String(body.googleTaskListId || "").trim(),
        todoCategories: sanitizeTodoCategories(body.todoCategories || current.todoCategories, body.googleTaskCategoryListIds || current.googleTaskCategoryListIds || {})
      };
      nextSettings.todoCategories = await ensureGoogleTaskListsForCategories(nextSettings, nextSettings.todoCategories);
      const settings = await saveSettings(nextSettings);
      return sendJson(res, 200, { settings: publicSettings(settings), vaultExists: await fileExists(settings.vaultPath) });
    }

    if (req.method === "GET" && url.pathname === "/api/state") {
      return sendJson(res, 200, await appState());
    }

    if (req.method === "GET" && url.pathname === "/api/google/auth-url") {
      const settings = await loadSettings();
      return sendJson(res, 200, { authUrl: googleAuthUrl(settings), redirectUri: GOOGLE_REDIRECT_URI });
    }

    if (req.method === "GET" && url.pathname === "/api/google/oauth/callback") {
      const code = url.searchParams.get("code");
      if (!code) throw new Error(url.searchParams.get("error") || "Google認証コードを取得できませんでした。");
      const settings = await loadSettings();
      await exchangeGoogleCode(settings, code);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<h1>Google Calendar connected</h1><p>Masa Life Commandに戻って再読み込みしてください。</p>");
    }

    if (req.method === "POST" && url.pathname === "/api/kanban/move") {
      const body = await parseJsonBody(req);
      const kanban = await moveKanbanTask(body.taskId, body.status);
      return sendJson(res, 200, { kanban, state: await appState() });
    }
    if (req.method === "POST" && url.pathname === "/api/google-tasks") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const task = await createGoogleTask(settings, body);
      return sendJson(res, 200, { task, state: await appState() });
    }
    if (req.method === "POST" && url.pathname === "/api/google-tasks/complete") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const task = await completeGoogleTask(settings, body);
      return sendJson(res, 200, { task, state: await appState() });
    }
    if (req.method === "POST" && url.pathname === "/api/google-tasks/sync-obsidian") {
      const settings = await loadSettings();
      const result = await syncObsidianTasksToGoogle(settings);
      return sendJson(res, 200, { ...result, state: await appState() });
    }
    if (req.method === "POST" && url.pathname === "/api/calendar/events") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const event = await createGoogleCalendarEvent(settings, body);
      return sendJson(res, 200, { event, state: await appState() });
    }
    if (req.method === "POST" && url.pathname === "/api/tasks/add") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const result = await addTask(settings, body);
      return sendJson(res, 200, { ...result, state: await appState() });
    }
    if (req.method === "POST" && url.pathname === "/api/tasks/complete") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const result = await completeTask(settings, body);
      return sendJson(res, 200, { ...result, state: await appState() });
    }

    if (req.method === "POST" && url.pathname === "/api/focus/send") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const result = await sendFocusTodoToObsidian(settings, body);
      return sendJson(res, 200, { ...result, state: await appState() });
    }

    if (req.method === "POST" && url.pathname === "/api/diary/append") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const text = String(body.text || "").trim();
      if (!text) throw new Error("追記する本文を入力してください。");
      const heading = String(body.heading || "今日のメモ").trim();
      const entryLines = text.split(/\r?\n/).map((line, index) => (index === 0 ? `- ${timeLabel()} ${line}` : `  ${line}`));
      const diaryRelPath = await appendToDailyDiary(settings.vaultPath, heading, entryLines);
      return sendJson(res, 200, { diaryRelPath, state: await appState() });
    }

    if (req.method === "POST" && url.pathname === "/api/study/log") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const category = String(body.category || "その他").trim();
      const durationSeconds = Number(body.durationSeconds || 0);
      const memo = String(body.memo || "").trim();
      if (durationSeconds < 1) throw new Error("学習時間が記録されていません。");
      const memoText = memo ? ` - ${memo}` : "";
      const started = body.startedAt ? new Date(body.startedAt) : null;
      const ended = body.endedAt ? new Date(body.endedAt) : new Date();
      const timeRange = started && !Number.isNaN(started.valueOf()) ? `${timeLabel(started)}-${timeLabel(ended)}` : timeLabel(ended);
      const diaryRelPath = await appendToDailyDiary(settings.vaultPath, "学習ログ", [
        `- ${timeRange} ${category}: ${formatDuration(durationSeconds)}${memoText}`,
        `  <!-- mlc:study seconds=${Math.round(durationSeconds)} category="${category.replaceAll('"', "'")}" -->`
      ]);
      const focusResult = await appendFocusStudyTime(settings, { durationSeconds, category, memo, timeRange });
      return sendJson(res, 200, { diaryRelPath, focus: focusResult?.focus || null, focusDiaryRelPath: focusResult?.diaryRelPath || null, state: await appState() });
    }

    if (req.method === "POST" && url.pathname === "/api/codex/ask") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const result = await runCodexAsk(settings, body.prompt, Boolean(body.includeContext));
      return sendJson(res, 200, result);
    }


    if (req.method === "POST" && url.pathname === "/api/ai/draft") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const result = await generateAiDraft(settings, body);
      return sendJson(res, 200, result);
    }

    if (req.method === "POST" && url.pathname === "/api/aider/ask") {
      const settings = await loadSettings();
      const body = await parseJsonBody(req);
      const result = await runAiderAsk(settings, body);
      return sendJson(res, 200, result);
    }
    if (req.method === "POST" && url.pathname === "/api/ai/priority") {
      const settings = await loadSettings();
      const result = await askOllamaForPriority(settings);
      return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { error: "API not found" });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || String(error) });
  }
}

async function serveStatic(req, res, url) {
  const rawPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const target = path.resolve(PUBLIC_DIR, "." + rawPath);
  if (target !== PUBLIC_DIR && !target.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  try {
    const content = await fs.readFile(target);
    res.writeHead(200, { "Content-Type": MIME_TYPES.get(path.extname(target)) || "application/octet-stream" });
    return res.end(content);
  } catch {
    res.writeHead(404);
    return res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
  return serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`Masa Life Command is running at http://localhost:${PORT}`);
});
