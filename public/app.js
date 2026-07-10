const state = {
  data: null,
  todoCategory: "normal",
  todoQuery: "",
  todoFilter: "all",
  kanbanDragTaskId: "",
  googleTasksExpanded: false,
  categoriesExpanded: false,
  calendarExpanded: false,
  calendarMonth: null,
  timer: {
    running: false,
    startedAt: null,
    elapsedBeforeStart: 0,
    intervalId: null
  }
};

const els = {
  vaultDot: document.querySelector("#vaultDot"),
  vaultStatus: document.querySelector("#vaultStatus"),
  todayLine: document.querySelector("#todayLine"),
  commanderSummary: document.querySelector("#commanderSummary"),
  commanderAiButton: document.querySelector("#commanderAiButton"),
  commanderAiMode: document.querySelector("#commanderAiMode"),
  commanderNextEvent: document.querySelector("#commanderNextEvent"),
  commanderNextEventMeta: document.querySelector("#commanderNextEventMeta"),
  commanderFocusTodo: document.querySelector("#commanderFocusTodo"),
  commanderFocusTodoMeta: document.querySelector("#commanderFocusTodoMeta"),
  sendFocusTodoButton: document.querySelector("#sendFocusTodoButton"),
  focusSendTarget: document.querySelector("#focusSendTarget"),
  commanderStudy: document.querySelector("#commanderStudy"),
  commanderStudyMeta: document.querySelector("#commanderStudyMeta"),
  commanderLog: document.querySelector("#commanderLog"),
  commanderLogMeta: document.querySelector("#commanderLogMeta"),
  todoSummary: document.querySelector("#todoSummary"),
  todoList: document.querySelector("#todoList"),
  todoCategoryTabs: document.querySelector("#todoCategoryTabs"),
  todoSearchInput: document.querySelector("#todoSearchInput"),
  todoFilterInput: document.querySelector("#todoFilterInput"),
  kanbanPanel: document.querySelector("#kanbanPanel"),
  kanbanSummary: document.querySelector("#kanbanSummary"),
  kanbanBoard: document.querySelector("#kanbanBoard"),
  kanbanRefresh: document.querySelector("#kanbanRefresh"),
  calendarSummary: document.querySelector("#calendarSummary"),
  calendarList: document.querySelector("#calendarList"),
  calendarToggle: document.querySelector("#calendarToggle"),
  calendarTimelineHost: document.querySelector("#calendarTimelineHost"),
  diaryPath: document.querySelector("#diaryPath"),
  completionLog: document.querySelector("#completionLog"),
  studyLog: document.querySelector("#studyLog"),
  message: document.querySelector("#message"),
  refreshButton: document.querySelector("#refreshButton"),
  todoRefresh: document.querySelector("#todoRefresh"),
  calendarEventForm: document.querySelector("#calendarEventForm"),
  calendarEventTitle: document.querySelector("#calendarEventTitle"),
  calendarEventDate: document.querySelector("#calendarEventDate"),
  calendarEventStart: document.querySelector("#calendarEventStart"),
  calendarEventEnd: document.querySelector("#calendarEventEnd"),
  calendarEventLocation: document.querySelector("#calendarEventLocation"),
  calendarEventDescription: document.querySelector("#calendarEventDescription"),
  calendarEventSubmit: document.querySelector("#calendarEventSubmit"),
  calendarEventFeedback: document.querySelector("#calendarEventFeedback"),
  googleCalendarStatus: document.querySelector("#googleCalendarStatus"),
  googleTasksStatus: document.querySelector("#googleTasksStatus"),
  googleTasksList: document.querySelector("#googleTasksList"),
  googleTasksToggle: document.querySelector("#googleTasksToggle"),
  googleTaskForm: document.querySelector("#googleTaskForm"),
  googleTaskTitle: document.querySelector("#googleTaskTitle"),
  googleTaskDue: document.querySelector("#googleTaskDue"),
  googleTaskNotes: document.querySelector("#googleTaskNotes"),
  googleTaskSubmit: document.querySelector("#googleTaskSubmit"),
  syncObsidianTasksButton: document.querySelector("#syncObsidianTasksButton"),
  googleTaskFeedback: document.querySelector("#googleTaskFeedback"),
  todoAddForm: document.querySelector("#todoAddForm"),
  todoTitleInput: document.querySelector("#todoTitleInput"),
  todoDueInput: document.querySelector("#todoDueInput"),
  todoKindInput: document.querySelector("#todoKindInput"),
  todoRepeatInput: document.querySelector("#todoRepeatInput"),
  diaryForm: document.querySelector("#diaryForm"),
  diaryHeading: document.querySelector("#diaryHeading"),
  diaryText: document.querySelector("#diaryText"),
  studyForm: document.querySelector("#studyForm"),
  studyCategory: document.querySelector("#studyCategory"),
  studyMemo: document.querySelector("#studyMemo"),
  timerDisplay: document.querySelector("#timerDisplay"),
  timerState: document.querySelector("#timerState"),
  startTimer: document.querySelector("#startTimer"),
  stopTimer: document.querySelector("#stopTimer"),
  settingsPanel: document.querySelector("#settingsPanel"),
  settingsForm: document.querySelector("#settingsForm"),
  vaultPathInput: document.querySelector("#vaultPathInput"),
  ollamaUrlInput: document.querySelector("#ollamaUrlInput"),
  ollamaModelInput: document.querySelector("#ollamaModelInput"),
  aiderAskModelInput: document.querySelector("#aiderAskModelInput"),
  aiderWriteModelInput: document.querySelector("#aiderWriteModelInput"),
  calendarIcsUrlInput: document.querySelector("#calendarIcsUrlInput"),
  googleClientIdInput: document.querySelector("#googleClientIdInput"),
  googleClientSecretInput: document.querySelector("#googleClientSecretInput"),
  googleCalendarIdInput: document.querySelector("#googleCalendarIdInput"),
  googleTaskListIdInput: document.querySelector("#googleTaskListIdInput"),
  categorySummary: document.querySelector("#categorySummary"),
  categoryToggle: document.querySelector("#categoryToggle"),
  categorySettingsBody: document.querySelector("#categorySettingsBody"),
  categorySettingsList: document.querySelector("#categorySettingsList"),
  categoryNameInput: document.querySelector("#categoryNameInput"),
  categoryTaskListInput: document.querySelector("#categoryTaskListInput"),
  addCategoryButton: document.querySelector("#addCategoryButton"),
  googleConnectButton: document.querySelector("#googleConnectButton"),
  aiPriorityButton: document.querySelector("#aiPriorityButton"),
  aiPriorityResult: document.querySelector("#aiPriorityResult"),
  aiModelLabel: document.querySelector("#aiModelLabel"),
  aiConsultForm: document.querySelector("#aiConsultForm"),
  aiConsultText: document.querySelector("#aiConsultText"),
  aiConsultButton: document.querySelector("#aiConsultButton"),
  codexForm: document.querySelector("#codexForm"),
  codexPrompt: document.querySelector("#codexPrompt"),
  codexIncludeContext: document.querySelector("#codexIncludeContext"),
  codexSubmit: document.querySelector("#codexSubmit"),
  codexResult: document.querySelector("#codexResult"),
  aiDraftForm: document.querySelector("#aiDraftForm"),
  aiDraftKind: document.querySelector("#aiDraftKind"),
  aiDraftSource: document.querySelector("#aiDraftSource"),
  aiDraftSubmit: document.querySelector("#aiDraftSubmit"),
  aiDraftResult: document.querySelector("#aiDraftResult"),
  aiDraftHeading: document.querySelector("#aiDraftHeading"),
  aiDraftToDiaryButton: document.querySelector("#aiDraftToDiaryButton"),
  aiDraftSaveButton: document.querySelector("#aiDraftSaveButton"),
  aiderForm: document.querySelector("#aiderForm"),
  aiderMode: document.querySelector("#aiderMode"),
  aiderPrompt: document.querySelector("#aiderPrompt"),
  aiderIncludeContext: document.querySelector("#aiderIncludeContext"),
  aiderIncludeAppFiles: document.querySelector("#aiderIncludeAppFiles"),
  aiderSubmit: document.querySelector("#aiderSubmit"),
  aiderResult: document.querySelector("#aiderResult"),
  aiderModelLabel: document.querySelector("#aiderModelLabel")
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || "APIエラーが発生しました。");
  return body;
}

function showMessage(text, type = "info") {
  els.message.textContent = text;
  els.message.className = `message ${type === "error" ? "error" : ""}`;
  els.message.hidden = false;
  window.clearTimeout(showMessage.timerId);
  showMessage.timerId = window.setTimeout(() => {
    els.message.hidden = true;
  }, 4200);
}

function setCalendarEventFeedback(text, type = "info") {
  if (!els.calendarEventFeedback) return;
  els.calendarEventFeedback.textContent = text;
  els.calendarEventFeedback.className = `form-feedback ${type === "error" ? "error" : ""}`;
  els.calendarEventFeedback.hidden = false;
}

function setGoogleTaskFeedback(text, type = "info") {
  if (!els.googleTaskFeedback) return;
  els.googleTaskFeedback.textContent = text;
  els.googleTaskFeedback.className = `form-feedback ${type === "error" ? "error" : ""}`;
  els.googleTaskFeedback.hidden = false;
}

function clearGoogleTaskFeedback() {
  if (!els.googleTaskFeedback) return;
  els.googleTaskFeedback.textContent = "";
  els.googleTaskFeedback.hidden = true;
}
function clearCalendarEventFeedback() {
  if (!els.calendarEventFeedback) return;
  els.calendarEventFeedback.textContent = "";
  els.calendarEventFeedback.hidden = true;
}

function validateCalendarEventForm() {
  const title = els.calendarEventTitle.value.trim();
  const date = els.calendarEventDate.value;
  const startTime = els.calendarEventStart.value;
  const endTime = els.calendarEventEnd.value;
  if (!title) return "タイトルを入力してください。";
  if (!date) return "日付を選んでください。";
  if (!startTime || !endTime) return "開始時刻と終了時刻を選んでください。";
  if (endTime <= startTime) return "終了時刻は開始時刻より後にしてください。";
  return "";
}
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shortFileName(fileRel) {
  return fileRel.split(/[\\/]/).at(-1) || fileRel;
}

function formatCalendarTime(event) {
  if (event.allDay) return "終日";
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const options = { hour: "2-digit", minute: "2-digit" };
  const startText = start.toLocaleTimeString("ja-JP", options);
  const endText = end ? end.toLocaleTimeString("ja-JP", options) : "";
  return endText ? `${startText}-${endText}` : startText;
}

function formatCalendarDate(event) {
  const start = new Date(event.start);
  return start.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

function buildCalendarLines(limit = 8) {
  const calendar = state.data?.calendar || {};
  return (calendar.events || []).slice(0, limit).map((event, index) => {
    const location = event.location ? ` / 場所:${event.location}` : "";
    return `${index + 1}. ${formatCalendarDate(event)} ${formatCalendarTime(event)} ${event.title}${location}`;
  });
}
function buildAiPrompt() {
  const data = state.data || {};
  const tasks = (data.tasks || []).slice(0, 20).map((task, index) => {
    const due = task.dueDate ? ` / 期限:${task.dueDate}` : "";
    return `${index + 1}. ${task.title}${due} / 出典:${task.fileRel}:${task.lineIndex + 1}`;
  });
  const completions = (data.completionLines || []).slice(-8).join("\n");
  const study = (data.studyLines || []).slice(-8).join("\n");
  const calendarLines = buildCalendarLines();

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
    `日付: ${data.today || "今日"}`,
    "",
    "今日・明日の予定:",
    calendarLines.length ? calendarLines.join("\n") : "なし",
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

function buildConsultPrompt(question) {
  const data = state.data || {};
  const tasks = (data.tasks || []).slice(0, 15).map((task, index) => {
    const due = task.dueDate ? ` / 期限:${task.dueDate}` : "";
    return `${index + 1}. ${task.title}${due}`;
  });
  const completions = (data.completionLines || []).slice(-6).join("\n");
  const study = (data.studyLines || []).slice(-6).join("\n");
  const calendarLines = buildCalendarLines(6);

  return [
    "あなたはMasa Life CommandのローカルAI秘書です。",
    "ユーザーの生活OS、TODO、学習を支援します。",
    "ファイルの保存・削除・書き換えを実行したと言わないでください。必要なら『アプリで記録してください』と案内します。",
    "回答は日本語で、具体的・短め・実行しやすくしてください。",
    "",
    `日付: ${data.today || "今日"}`,
    "",
    "参考: 今日・明日の予定:",
    calendarLines.length ? calendarLines.join("\n") : "なし",
    "",
    "ユーザーの相談:",
    question,
    "",
    "参考: 未完了TODO上位:",
    tasks.length ? tasks.join("\n") : "なし",
    "",
    "参考: 今日の完了ログ:",
    completions || "なし",
    "",
    "参考: 今日の学習ログ:",
    study || "なし"
  ].join("\n");
}

async function askOllamaWithPrompt(prompt) {
  const ollamaUrl = (els.ollamaUrlInput?.value || "http://localhost:11434").replace(/\/+$/, "");
  const model = (els.ollamaModelInput?.value || "qwen3:14b").trim();
  if (!model) throw new Error("Ollamaモデル名を入力してください。");

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.5,
        num_predict: 800
      }
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Ollama API error: ${res.status}`);
  return { model, response: String(body.response || "").trim() };
}
async function askOllamaDirect() {
  const ollamaUrl = (els.ollamaUrlInput?.value || "http://localhost:11434").replace(/\/+$/, "");
  const model = (els.ollamaModelInput?.value || "qwen3:14b").trim();
  if (!model) throw new Error("Ollamaモデル名を入力してください。");

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: buildAiPrompt(),
      stream: false,
      options: {
        temperature: 0.4,
        num_predict: 500
      }
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Ollama API error: ${res.status}`);
  return { model, response: String(body.response || "").trim() };
}
function isReadingAction(task) {
  const title = task.title || "";
  const raw = task.raw || "";
  return raw.includes("#reading-action") || /^【.+?】/.test(title);
}


function fallbackCategories() {
  return [
    { id: "normal", name: "通常TODO", googleTaskListId: "" },
    { id: "reading", name: "読書TODO", googleTaskListId: "" },
    { id: "google", name: "Google Tasks", googleTaskListId: "" }
  ];
}

function getTodoCategories() {
  const categories = state.data?.settings?.todoCategories;
  return Array.isArray(categories) && categories.length ? categories : fallbackCategories();
}

function categoryName(id) {
  return getTodoCategories().find((category) => category.id === id)?.name || id || "未分類";
}

function categoryIdFromTask(task) {
  if (task.category) return task.category;
  const explicit = String(task.raw || "").match(/#mlc\/category\/([A-Za-z0-9_-]+)/)?.[1];
  if (explicit) return explicit;
  return isReadingAction(task) ? "reading" : "normal";
}

function clientCategoryId(name) {
  const text = String(name || "").trim().toLowerCase();
  const ascii = text.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  return ascii || `cat-${Date.now().toString(36)}`;
}

function taskListOptions(selectedValue = "") {
  const lists = state.data?.googleTasks?.taskLists || [];
  const options = [`<option value="">同名リストを自動作成</option>`];
  options.push(...lists.map((list) => `<option value="${escapeHtml(list.id)}" ${list.id === selectedValue ? "selected" : ""}>${escapeHtml(list.title)}</option>`));
  return options.join("");
}


function updateCategoryCollapse() {
  const categories = getTodoCategories();
  if (els.categorySummary) els.categorySummary.textContent = `${categories.length}件`;
  if (!els.categorySettingsBody || !els.categoryToggle) return;
  els.categorySettingsBody.hidden = !state.categoriesExpanded;
  els.categoryToggle.textContent = state.categoriesExpanded ? "▴" : "▾";
  els.categoryToggle.title = state.categoriesExpanded ? "カテゴリー管理を隠す" : "カテゴリー管理を表示";
  els.categoryToggle.setAttribute("aria-expanded", String(state.categoriesExpanded));
}
function renderCategoryControls(data) {
  const categories = getTodoCategories();
  if (els.todoKindInput) {
    els.todoKindInput.innerHTML = categories
      .filter((category) => category.id !== "google")
      .map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`)
      .join("");
  }
  if (els.categoryTaskListInput) els.categoryTaskListInput.innerHTML = taskListOptions("");
  updateCategoryCollapse();
  if (els.categorySettingsList) {
    els.categorySettingsList.innerHTML = categories.map((category) => {
      const removable = !["normal", "reading", "google"].includes(category.id);
      return `
        <div class="category-setting-row" data-category-id="${escapeHtml(category.id)}">
          <label>
            カテゴリー名
            <input class="category-name-input" type="text" value="${escapeHtml(category.name)}" ${removable ? "" : "readonly"} />
          </label>
          <label>
            Google Tasksリスト
            <select class="category-task-list-select">${taskListOptions(category.googleTaskListId || "")}</select>
          </label>
          <button class="secondary-button remove-category-button" type="button" ${removable ? "" : "disabled"}>削除</button>
        </div>
      `;
    }).join("");
  }
}

function collectTodoCategories() {
  const rows = [...document.querySelectorAll(".category-setting-row")];
  return rows.map((row) => ({
    id: row.dataset.categoryId,
    name: row.querySelector(".category-name-input")?.value.trim() || categoryName(row.dataset.categoryId),
    googleTaskListId: row.querySelector(".category-task-list-select")?.value || ""
  })).filter((category) => category.id && category.name);
}

function configPayload() {
  return {
    vaultPath: els.vaultPathInput.value,
    ollamaUrl: els.ollamaUrlInput.value,
    ollamaModel: els.ollamaModelInput.value,
    aiderAskModel: els.aiderAskModelInput?.value || "",
    aiderWriteModel: els.aiderWriteModelInput?.value || "",
    calendarIcsUrl: els.calendarIcsUrlInput.value,
    googleClientId: els.googleClientIdInput?.value || "",
    googleClientSecret: els.googleClientSecretInput?.value || "",
    googleCalendarId: els.googleCalendarIdInput?.value || "primary",
    googleTaskListId: els.googleTaskListIdInput?.value || "",
    todoCategories: collectTodoCategories()
  };
}

async function saveConfigFromUi() {
  return api("/api/config", {
    method: "POST",
    body: JSON.stringify(configPayload())
  });
}
function googleTaskDueDate(due) {
  if (!due) return "";
  const date = new Date(due);
  if (Number.isNaN(date.valueOf())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function googleTaskToTodo(task) {
  return {
    ...task,
    id: `google:${task.id}`,
    googleTaskId: task.id,
    source: "google",
    fileRel: "Google Tasks",
    lineIndex: -1,
    raw: task.notes || "",
    dueDate: googleTaskDueDate(task.due)
  };
}

function isLinkedGoogleTask(task, obsidianTasks) {
  const notes = String(task.notes || "");
  if (notes.includes("mlc:obsidian-task-id=") || notes.includes("Obsidian:")) return true;
  return obsidianTasks.some((obsidianTask) => obsidianTask.title === task.title);
}
function renderTaskGroup(title, tasks, emptyText) {
  if (tasks.length === 0) {
    return `
      <section class="todo-group">
        <div class="todo-group-head">
          <h3>${escapeHtml(title)}</h3>
          <span>0件</span>
        </div>
        <div class="empty compact-empty">${escapeHtml(emptyText)}</div>
      </section>
    `;
  }

  const rows = tasks
    .map((task) => {
      const due = task.dueDate ? `<span class="chip">📅 ${escapeHtml(task.dueDate)}</span>` : "";
      const isGoogleTask = task.source === "google";
      const categoryChip = `<span class="chip">${escapeHtml(categoryName(task.category || categoryIdFromTask(task)))}</span>`;
      const listChip = isGoogleTask && task.taskListTitle ? `<span class="chip">${escapeHtml(task.taskListTitle)}</span>` : "";
      const source = isGoogleTask ? "Google Tasks" : `${escapeHtml(shortFileName(task.fileRel))}:${task.lineIndex + 1}`;
      const actions = isGoogleTask
        ? `<button class="secondary-button complete-google-task" type="button" data-google-task-id="${escapeHtml(task.googleTaskId)}" data-google-task-list-id="${escapeHtml(task.taskListId || "")}">完了</button>`
        : `<button class="secondary-button send-google-task" type="button">Googleへ送る</button>
            <button class="secondary-button complete-task" type="button">完了</button>`;
      return `
        <article class="todo-row" data-id="${task.id}">
          <div class="todo-check">✓</div>
          <div>
            <div class="todo-title">${escapeHtml(task.title)}</div>
            <div class="todo-meta">
              ${categoryChip}
              ${listChip}
              ${due}
              <span>${source}</span>
            </div>
          </div>
          <div class="todo-actions">
            ${actions}
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section class="todo-group">
      <div class="todo-group-head">
        <h3>${escapeHtml(title)}</h3>
        <span>${tasks.length}件</span>
      </div>
      ${rows}
    </section>
  `;
}

function todayKey() {
  return state.data?.today || dateKey(new Date());
}

function combinedTodoItems(tasks) {
  const categories = getTodoCategories();
  const categoryIds = new Set(categories.map((category) => category.id));
  const googleOnlyTasks = (state.data?.googleTasks?.tasks || [])
    .filter((task) => !isLinkedGoogleTask(task, tasks))
    .map((task) => ({ ...googleTaskToTodo(task), category: categoryIds.has(task.category) ? task.category : "google" }));
  const obsidianTasks = tasks.map((task) => {
    const category = categoryIdFromTask(task);
    return { ...task, category: categoryIds.has(category) ? category : "normal" };
  });
  return [...obsidianTasks, ...googleOnlyTasks];
}


const KANBAN_COLUMNS = [
  { id: "backlog", title: "未整理", hint: "まだ扱いを決めていないTODO" },
  { id: "today", title: "今日やる", hint: "今日中に進めたいTODO" },
  { id: "focus", title: "今やる", hint: "司令塔のFocusTODOになります" },
  { id: "waiting", title: "待ち", hint: "返事待ち・保留中" }
];

function kanbanItems() {
  return state.data?.kanban?.items || {};
}

function kanbanStatus(task) {
  return kanbanItems()[task.id] || "backlog";
}

function kanbanTaskMeta(task) {
  const due = task.dueDate ? `<span class="chip">📅 ${escapeHtml(task.dueDate)}</span>` : "";
  const category = `<span class="chip">${escapeHtml(categoryName(task.category || categoryIdFromTask(task)))}</span>`;
  const source = task.source === "google"
    ? `<span>${escapeHtml(task.taskListTitle ? `Google Tasks / ${task.taskListTitle}` : "Google Tasks")}</span>`
    : `<span>${escapeHtml(shortFileName(task.fileRel))}:${task.lineIndex + 1}</span>`;
  return `${category}${due}${source}`;
}

function renderKanbanCard(task) {
  const activeStatus = kanbanStatus(task);
  const moveButtons = KANBAN_COLUMNS
    .filter((column) => column.id !== activeStatus)
    .map((column) => `<button class="mini-action-button kanban-move" type="button" data-task-id="${escapeHtml(task.id)}" data-status="${escapeHtml(column.id)}">${escapeHtml(column.title)}</button>`)
    .join("");
  const completeButton = task.source === "google"
    ? `<button class="secondary-button complete-google-task" type="button" data-google-task-id="${escapeHtml(task.googleTaskId)}" data-google-task-list-id="${escapeHtml(task.taskListId || "")}">完了</button>`
    : `<button class="secondary-button complete-task" type="button">完了</button>`;
  return `
    <article class="kanban-card todo-row" draggable="true" data-id="${escapeHtml(task.id)}">
      <div class="todo-check">✓</div>
      <div>
        <div class="todo-title">${escapeHtml(task.title)}</div>
        <div class="todo-meta">${kanbanTaskMeta(task)}</div>
        <div class="kanban-card-actions">
          ${moveButtons}
          ${completeButton}
        </div>
      </div>
    </article>
  `;
}

function renderKanban(data) {
  if (!els.kanbanBoard || !els.kanbanSummary) return;
  const tasks = combinedTodoItems(data.tasks || []);
  const counts = KANBAN_COLUMNS.map((column) => tasks.filter((task) => kanbanStatus(task) === column.id).length);
  els.kanbanSummary.textContent = `${tasks.length}件 / 今やる ${counts[KANBAN_COLUMNS.findIndex((column) => column.id === "focus")]}件`;
  els.kanbanBoard.innerHTML = KANBAN_COLUMNS.map((column) => {
    const columnTasks = tasks.filter((task) => kanbanStatus(task) === column.id);
    const cards = columnTasks.length
      ? columnTasks.map(renderKanbanCard).join("")
      : `<div class="empty compact-empty">${escapeHtml(column.hint)}</div>`;
    return `
      <section class="kanban-column" data-kanban-column="${escapeHtml(column.id)}">
        <div class="kanban-column-head">
          <h3>${escapeHtml(column.title)}</h3>
          <span>${columnTasks.length}件</span>
        </div>
        <div class="kanban-column-body">${cards}</div>
      </section>
    `;
  }).join("");
}
function renderCommander(data) {
  if (!els.commanderSummary) return;
  const now = new Date();
  const today = data.today || dateKey(now);
  const events = (data.calendar?.events || []).filter((event) => eventOverlapsDate(event, today));
  const upcoming = events
    .filter((event) => event.allDay || new Date(event.end || event.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  const todos = combinedTodoItems(data.tasks || []).sort((a, b) => {
    const aDue = a.dueDate || "9999-99-99";
    const bDue = b.dueDate || "9999-99-99";
    return aDue.localeCompare(bDue) || String(a.title).localeCompare(String(b.title));
  });
  const focus = todos.find((task) => kanbanStatus(task) === "focus") || todos[0];
  const completionCount = data.completionLines?.length || 0;
  const studyCount = data.studyLines?.length || 0;

  els.commanderSummary.textContent = `${events.length}件の予定 / ${todos.length}件のTODO`;
  els.commanderNextEvent.textContent = upcoming ? upcoming.title : "予定なし";
  els.commanderNextEventMeta.textContent = upcoming ? `${formatCalendarTime(upcoming)} ${upcoming.location ? `@ ${upcoming.location}` : ""}` : "空き時間です";
  els.commanderFocusTodo.textContent = focus ? focus.title : "TODOなし";
  els.commanderFocusTodoMeta.textContent = focus ? `${categoryName(focus.category)}${focus.dueDate ? ` / 期限 ${focus.dueDate}` : ""}` : "今日は身軽です";
  if (els.sendFocusTodoButton) els.sendFocusTodoButton.disabled = !focus;
  els.commanderStudy.textContent = state.timer.running ? "計測中" : `${studyCount}件記録`;
  els.commanderStudyMeta.textContent = state.timer.running ? formatDuration(currentElapsedSeconds()) : "勉強タイマーから記録できます";
  els.commanderLog.textContent = `${completionCount}件完了`;
  els.commanderLogMeta.textContent = studyCount ? `学習ログ ${studyCount}件` : "まだ学習ログはありません";
}
function renderTasks(tasks) {
  const categories = getTodoCategories();
  const categoryIds = new Set(categories.map((category) => category.id));
  const googleRawTasks = state.data?.googleTasks?.tasks || [];
  const googleOnlyTasks = googleRawTasks
    .filter((task) => !isLinkedGoogleTask(task, tasks))
    .map((task) => ({ ...googleTaskToTodo(task), category: categoryIds.has(task.category) ? task.category : "google" }));
  const obsidianTasks = tasks.map((task) => {
    const category = categoryIdFromTask(task);
    return { ...task, category: categoryIds.has(category) ? category : "normal" };
  });
  const allTasks = [...obsidianTasks, ...googleOnlyTasks];
  const query = state.todoQuery.toLowerCase();
  const today = state.data?.today || "";
  const visibleTasks = allTasks.filter((task) => {
    const text = `${task.title} ${task.category} ${task.taskListTitle || ""}`.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesCategory = state.todoCategory === "all" || task.category === state.todoCategory;
    const matchesFilter = state.todoFilter === "all" || (state.todoFilter === "today" && (!task.dueDate || task.dueDate <= today)) || (state.todoFilter === "overdue" && task.dueDate && task.dueDate < today) || (state.todoFilter === "no-due" && !task.dueDate) || (state.todoFilter === "google" && task.source === "google") || (state.todoFilter === "obsidian" && task.source !== "google");
    return matchesQuery && matchesCategory && matchesFilter;
  });
  const totalCount = visibleTasks.length;
  const categoryGroups = categories.map((category) => ({
    ...category,
    tasks: visibleTasks.filter((task) => task.category === category.id),
    empty: `${category.name}はありません。`
  }));
  els.todoSummary.textContent = `${totalCount}件 / ${categories.length}カテゴリ`;
  if (els.todoCategoryTabs) {
    els.todoCategoryTabs.innerHTML = [
      ...categoryGroups.map((category) => `<button class="todo-category-tab" type="button" data-todo-category="${escapeHtml(category.id)}">${escapeHtml(category.name)} ${category.tasks.length}</button>`),
      `<button class="todo-category-tab" type="button" data-todo-category="all">全部 ${totalCount}</button>`
    ].join("");
    if (state.todoCategory !== "all" && !categoryIds.has(state.todoCategory)) state.todoCategory = categories[0]?.id || "normal";
    els.todoCategoryTabs.querySelectorAll(".todo-category-tab").forEach((button) => {
      button.classList.toggle("active", button.dataset.todoCategory === state.todoCategory);
    });
  }
  if (totalCount === 0) {
    els.todoList.innerHTML = `<div class="empty">未完了TODOはありません。</div>`;
    return;
  }

  if (state.todoCategory === "all") {
    els.todoList.innerHTML = categoryGroups
      .map((category) => renderTaskGroup(category.name, category.tasks, category.empty))
      .join("");
    return;
  }

  const category = categoryGroups.find((item) => item.id === state.todoCategory) || categoryGroups[0];
  els.todoList.innerHTML = renderTaskGroup(category.name, category.tasks, category.empty);
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function eventOverlapsDate(event, key) {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : new Date(start.getTime() + 30 * 60000);
  const dayStart = new Date(`${key}T00:00:00`);
  const dayEnd = new Date(`${key}T23:59:59`);
  return start <= dayEnd && end >= dayStart;
}

function renderDayTimeline(events, key) {
  const dayEvents = events
    .map((event, eventIndex) => ({ event, eventIndex }))
    .filter(({ event }) => eventOverlapsDate(event, key))
    .sort((a, b) => new Date(a.event.start) - new Date(b.event.start));
  const hours = Array.from({ length: 24 }, (_, hour) => `
    <div class="calendar-time-row">
      <div class="calendar-time-label">${hour === 0 ? "GMT+09" : `${hour}時`}</div>
      <div class="calendar-time-line"></div>
    </div>
  `).join("");
  const blocks = dayEvents.map(({ event, eventIndex }) => {
    if (event.allDay) {
      return `<button class="calendar-time-event all-day" type="button" data-calendar-index="${eventIndex}">終日 ${escapeHtml(event.title)}</button>`;
    }
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : new Date(start.getTime() + 30 * 60000);
    const top = Math.max(0, Math.min(1435, minutesSinceMidnight(start)));
    const height = Math.max(28, Math.min(1440 - top, Math.max(15, (end - start) / 60000)));
    return `
      <button class="calendar-time-event" type="button" data-calendar-index="${eventIndex}" style="top:${top}px;height:${height}px;">
        <strong>${escapeHtml(event.title)}</strong>
        <span>${escapeHtml(formatCalendarTime(event))}</span>
      </button>
    `;
  }).join("");
  return `
    <section class="calendar-day-timeline">
      <div class="calendar-timeline-head">
        <h3>今日の時間割</h3>
        <span>${escapeHtml(key)} / ${dayEvents.length}件</span>
      </div>
      <div class="calendar-time-scroll">
        <div class="calendar-time-grid">
          ${hours}
          <div class="calendar-time-events">${blocks}</div>
        </div>
      </div>
    </section>
  `;
}

function addMonths(monthKey, delta) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthGridStart(year, month) {
  const start = new Date(year, month - 1, 1);
  start.setDate(start.getDate() - start.getDay());
  return start;
}
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}


function updateCalendarCollapse() {
  if (!els.calendarList || !els.calendarToggle) return;
  els.calendarList.hidden = !state.calendarExpanded;
  els.calendarToggle.textContent = state.calendarExpanded ? "▴" : "▾";
  els.calendarToggle.title = state.calendarExpanded ? "月カレンダーを隠す" : "月カレンダーを表示";
  els.calendarToggle.setAttribute("aria-expanded", String(state.calendarExpanded));
}
function renderCalendar(calendar) {
  if (!els.calendarSummary || !els.calendarList) return;
  if (!calendar?.configured) {
    els.calendarSummary.textContent = "未連携";
    els.calendarList.innerHTML = `<div class="empty compact-empty">設定でGoogle CalendarのiCal URLを保存してください。</div>`;
    if (els.calendarTimelineHost) els.calendarTimelineHost.innerHTML = "";
    updateCalendarCollapse();
    return;
  }
  if (calendar.error) {
    els.calendarSummary.textContent = "取得エラー";
    els.calendarList.innerHTML = `<div class="empty compact-empty">${escapeHtml(calendar.error)}</div>`;
    if (els.calendarTimelineHost) els.calendarTimelineHost.innerHTML = "";
    updateCalendarCollapse();
    return;
  }

  const events = calendar.events || [];
  const baseMonth = calendar.month || state.data?.today?.slice(0, 7) || dateKey(new Date()).slice(0, 7);
  if (!state.calendarMonth) state.calendarMonth = baseMonth;
  const currentMonth = state.calendarMonth;
  const [year, month] = currentMonth.split("-").map(Number);
  const monthLabel = `${year}年${month}月`;
  const rangeStart = monthGridStart(year, month);
  const today = state.data?.today || dateKey(new Date());
  const eventsByDay = new Map();

  events.forEach((event, eventIndex) => {
    const key = dateKey(new Date(event.start));
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key).push({ event, eventIndex });
  });

  const monthEvents = events.filter((event) => {
    const start = new Date(event.start);
    return start.getFullYear() === year && start.getMonth() === month - 1;
  });
  els.calendarSummary.textContent = `${monthLabel} / ${monthEvents.length}件`;

  const weekdayHeader = ["日", "月", "火", "水", "木", "金", "土"]
    .map((day) => `<div class="calendar-weekday">${day}</div>`)
    .join("");

  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    const key = dateKey(date);
    const inMonth = date.getMonth() === month - 1;
    const dayEvents = eventsByDay.get(key) || [];
    const eventItems = dayEvents.slice(0, 3).map(({ event, eventIndex }) => `
      <button class="calendar-chip" type="button" data-calendar-index="${eventIndex}" title="${escapeHtml(event.title)}">
        <span>${escapeHtml(formatCalendarTime(event))}</span>
        ${escapeHtml(event.title)}
      </button>
    `).join("");
    const more = dayEvents.length > 3 ? `<div class="calendar-more">+${dayEvents.length - 3}件</div>` : "";
    const classes = ["calendar-day", inMonth ? "" : "outside", key === today ? "today" : ""].filter(Boolean).join(" ");
    return `
      <div class="${classes}">
        <div class="calendar-day-number">${date.getDate()}</div>
        <div class="calendar-day-events">${eventItems}${more}</div>
      </div>
    `;
  }).join("");

  els.calendarList.innerHTML = `
    <div class="calendar-nav">
      <button class="secondary-button calendar-prev-month" type="button">前月</button>
      <strong>${monthLabel}</strong>
      <div>
        <button class="secondary-button calendar-current-month" type="button">今月</button>
        <button class="secondary-button calendar-next-month" type="button">次月</button>
      </div>
    </div>
    <div class="calendar-month">
      ${weekdayHeader}
      ${cells}
    </div>
    <div id="calendarDetail" class="calendar-detail empty compact-empty">予定をクリックすると詳細を表示します。</div>
  `;
  if (els.calendarTimelineHost) els.calendarTimelineHost.innerHTML = renderDayTimeline(events, today);
  updateCalendarCollapse();
}

function showCalendarDetail(event) {
  const target = document.querySelector("#calendarDetail");
  if (!target || !event) return;
  const location = event.location ? `<div><span>場所</span>${escapeHtml(event.location)}</div>` : "";
  const description = event.description ? `<div><span>説明</span>${escapeHtml(event.description).replaceAll("\n", "<br />")}</div>` : "";
  target.className = "calendar-detail";
  target.innerHTML = `
    <div class="calendar-detail-head">
      <h3>${escapeHtml(event.title)}</h3>
      <button class="icon-button calendar-detail-close" type="button" aria-label="閉じる" title="閉じる">×</button>
    </div>
    <div class="calendar-detail-grid">
      <div><span>日付</span>${escapeHtml(formatCalendarDate(event))}</div>
      <div><span>時間</span>${escapeHtml(formatCalendarTime(event))}</div>
      ${location}
      ${description}
    </div>
  `;
}
function formatGoogleTaskDue(due) {
  if (!due) return "";
  const date = new Date(due);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}


function updateGoogleTasksCollapse() {
  if (!els.googleTasksList || !els.googleTasksToggle) return;
  els.googleTasksList.hidden = !state.googleTasksExpanded;
  els.googleTasksToggle.textContent = state.googleTasksExpanded ? "▴" : "▾";
  els.googleTasksToggle.title = state.googleTasksExpanded ? "Google Tasks一覧を隠す" : "Google Tasks一覧を表示";
  els.googleTasksToggle.setAttribute("aria-expanded", String(state.googleTasksExpanded));
}
function renderGoogleTasks(googleTasks) {
  if (!els.googleTasksStatus || !els.googleTasksList) return;
  if (!googleTasks?.configured) {
    els.googleTasksStatus.textContent = "未接続";
    els.googleTasksList.innerHTML = `<div class="empty compact-empty">Google接続後、Tasksスコープで再認証してください。</div>`;
    updateGoogleTasksCollapse();
    return;
  }
  if (googleTasks.error) {
    els.googleTasksStatus.textContent = "取得エラー";
    els.googleTasksList.innerHTML = `<div class="empty compact-empty">${escapeHtml(googleTasks.error)}</div>`;
    updateGoogleTasksCollapse();
    return;
  }
  const tasks = googleTasks.tasks || [];
  els.googleTasksStatus.textContent = `接続済み・${tasks.length}件`;
  if (tasks.length === 0) {
    els.googleTasksList.innerHTML = `<div class="empty compact-empty">Google Tasksの未完了TODOはありません。</div>`;
    updateGoogleTasksCollapse();
    return;
  }
  els.googleTasksList.innerHTML = tasks.map((task) => {
    const due = formatGoogleTaskDue(task.due);
    const notes = task.notes ? `<div class="mini-list-note">${escapeHtml(task.notes)}</div>` : "";
    const list = task.taskListTitle ? `<span class="chip">${escapeHtml(categoryName(task.category))} / ${escapeHtml(task.taskListTitle)}</span>` : "";
    return `
      <div class="mini-list-row">
        <div>
          <div class="mini-list-title">${escapeHtml(task.title)}</div>
          ${notes}
        </div>
        <div class="mini-list-actions">
          ${list}
          ${due ? `<span class="chip">${escapeHtml(due)}</span>` : ""}
          <button class="secondary-button complete-google-task" type="button" data-google-task-id="${escapeHtml(task.id)}" data-google-task-list-id="${escapeHtml(task.taskListId || "")}">完了</button>
        </div>
      </div>
    `;
  }).join("");
  updateGoogleTasksCollapse();
}
function renderLog(target, lines, emptyText) {
  if (!lines || lines.length === 0) {
    target.innerHTML = `<div class="empty">${emptyText}</div>`;
    return;
  }
  target.innerHTML = lines
    .slice(-8)
    .reverse()
    .map((line) => `<div class="log-line">${escapeHtml(line)}</div>`)
    .join("");
}

function render(data) {
  state.data = data;
  els.vaultDot.className = `status-dot ${data.vaultExists ? "ok" : "error"}`;
  els.vaultStatus.textContent = data.vaultExists ? "Vault接続済み" : "Vault未確認";
  els.todayLine.textContent = `${data.today} / ${data.diaryRelPath}`;
  els.diaryPath.textContent = data.diaryExists ? "作成済み" : "未作成";
  els.vaultPathInput.value = data.settings.vaultPath;
  els.ollamaUrlInput.value = data.settings.ollamaUrl || els.ollamaUrlInput.value || "http://localhost:11434";
  els.ollamaModelInput.value = data.settings.ollamaModel || els.ollamaModelInput.value || "qwen3:14b";
  if (els.aiderAskModelInput) els.aiderAskModelInput.value = data.settings.aiderAskModel || els.ollamaModelInput.value || "qwen3:14b";
  if (els.aiderWriteModelInput) els.aiderWriteModelInput.value = data.settings.aiderWriteModel || "qwen3-coder:latest";
  els.calendarIcsUrlInput.value = data.settings.calendarIcsUrl || "";
  if (els.googleClientIdInput) els.googleClientIdInput.value = data.settings.googleClientId || "";
  if (els.googleCalendarIdInput) els.googleCalendarIdInput.value = data.settings.googleCalendarId || "primary";
  if (els.googleTaskListIdInput) els.googleTaskListIdInput.value = data.settings.googleTaskListId || "";
  if (els.googleClientSecretInput) els.googleClientSecretInput.placeholder = data.settings.googleClientSecretSet ? "保存済み。変更しないなら空のまま" : "Google OAuth Client Secret";
  renderCategoryControls(data);
  if (els.googleCalendarStatus) els.googleCalendarStatus.textContent = data.settings.googleConnected ? "Google接続済み" : "Google未接続";
  els.aiModelLabel.textContent = els.ollamaModelInput.value || "Ollama";
  if (els.aiderModelLabel) els.aiderModelLabel.textContent = `質問: ${els.aiderAskModelInput?.value || "Ollama"} / 入力: ${els.aiderWriteModelInput?.value || "qwen code"}`;
  renderCommander(data);
  renderTasks(data.tasks || []);
  renderKanban(data);
  renderCalendar(data.calendar);
  renderGoogleTasks(data.googleTasks);
  renderLog(els.completionLog, data.completionLines, "今日の完了ログはまだありません。");
  renderLog(els.studyLog, data.studyLines, "今日の学習ログはまだありません。");
}

async function refresh() {
  try {
    const data = await api("/api/state");
    render(data);
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function currentElapsedSeconds() {
  if (!state.timer.running) return Math.floor(state.timer.elapsedBeforeStart / 1000);
  return Math.floor((state.timer.elapsedBeforeStart + Date.now() - state.timer.startedAt.getTime()) / 1000);
}

function formatTimer(seconds) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
}

function updateTimerDisplay() {
  els.timerDisplay.textContent = formatTimer(currentElapsedSeconds());
}

function startTimer() {
  if (state.timer.running) return;
  state.timer.running = true;
  state.timer.startedAt = new Date();
  state.timer.intervalId = window.setInterval(updateTimerDisplay, 500);
  els.timerState.textContent = "計測中";
  els.startTimer.disabled = true;
  els.stopTimer.disabled = false;
  updateTimerDisplay();
}

function stopTimer() {
  if (!state.timer.running) return;
  state.timer.elapsedBeforeStart += Date.now() - state.timer.startedAt.getTime();
  state.timer.running = false;
  window.clearInterval(state.timer.intervalId);
  els.timerState.textContent = "停止中";
  els.startTimer.disabled = false;
  els.stopTimer.disabled = true;
  updateTimerDisplay();
}

function resetTimer() {
  window.clearInterval(state.timer.intervalId);
  state.timer.running = false;
  state.timer.startedAt = null;
  state.timer.elapsedBeforeStart = 0;
  state.timer.intervalId = null;
  els.timerState.textContent = "停止中";
  els.startTimer.disabled = false;
  els.stopTimer.disabled = true;
  updateTimerDisplay();
}

document.addEventListener("click", async (event) => {
  const calendarPrevMonth = event.target.closest(".calendar-prev-month");
  const calendarNextMonth = event.target.closest(".calendar-next-month");
  const calendarCurrentMonth = event.target.closest(".calendar-current-month");
  if (calendarPrevMonth || calendarNextMonth || calendarCurrentMonth) {
    const baseMonth = state.data?.calendar?.month || state.data?.today?.slice(0, 7) || dateKey(new Date()).slice(0, 7);
    if (calendarCurrentMonth) state.calendarMonth = baseMonth;
    if (calendarPrevMonth) state.calendarMonth = addMonths(state.calendarMonth || baseMonth, -1);
    if (calendarNextMonth) state.calendarMonth = addMonths(state.calendarMonth || baseMonth, 1);
    renderCalendar(state.data?.calendar);
    return;
  }

  const calendarButton = event.target.closest(".calendar-chip, .calendar-time-event");
  if (calendarButton) {
    const calendarEvent = state.data?.calendar?.events?.[Number(calendarButton.dataset.calendarIndex)];
    showCalendarDetail(calendarEvent);
    return;
  }

  const closeCalendarDetail = event.target.closest(".calendar-detail-close");
  if (closeCalendarDetail) {
    const target = document.querySelector("#calendarDetail");
    if (target) {
      target.className = "calendar-detail empty compact-empty";
      target.textContent = "予定をクリックすると詳細を表示します。";
    }
    return;
  }

  const kanbanMoveButton = event.target.closest(".kanban-move");
  if (kanbanMoveButton) {
    kanbanMoveButton.disabled = true;
    try {
      const result = await api("/api/kanban/move", {
        method: "POST",
        body: JSON.stringify({
          taskId: kanbanMoveButton.dataset.taskId,
          status: kanbanMoveButton.dataset.status
        })
      });
      render(result.state);
      showMessage("Kanbanを更新しました。");
    } catch (error) {
      showMessage(error.message, "error");
      kanbanMoveButton.disabled = false;
    }
    return;
  }

  const completeGoogleTaskButton = event.target.closest(".complete-google-task");
  if (completeGoogleTaskButton) {
    const task = state.data?.googleTasks?.tasks?.find((item) => item.id === completeGoogleTaskButton.dataset.googleTaskId && (!completeGoogleTaskButton.dataset.googleTaskListId || item.taskListId === completeGoogleTaskButton.dataset.googleTaskListId));
    if (!task) return;
    completeGoogleTaskButton.disabled = true;
    completeGoogleTaskButton.textContent = "完了中...";
    try {
      const result = await api("/api/google-tasks/complete", {
        method: "POST",
        body: JSON.stringify(task)
      });
      render(result.state);
      showMessage("Google Tasksを完了し、今日の完了に記録しました。");
    } catch (error) {
      showMessage(error.message, "error");
      completeGoogleTaskButton.disabled = false;
      completeGoogleTaskButton.textContent = "完了";
    }
    return;
  }

  const sendGoogleTaskButton = event.target.closest(".send-google-task");
  if (sendGoogleTaskButton) {
    const row = sendGoogleTaskButton.closest(".todo-row");
    const task = state.data.tasks.find((item) => item.id === row.dataset.id);
    if (!task) return;
    sendGoogleTaskButton.disabled = true;
    sendGoogleTaskButton.textContent = "送信中...";
    try {
      const result = await api("/api/google-tasks", {
        method: "POST",
        body: JSON.stringify({
          title: task.title,
          dueDate: task.dueDate || "",
          notes: `Obsidian: ${task.fileRel}:${task.lineIndex + 1}`,
          obsidianTaskId: task.id,
          category: task.category || categoryIdFromTask(task)
        })
      });
      render(result.state);
      showMessage("Obsidian TODOをGoogle Tasksへ追加しました。");
    } catch (error) {
      showMessage(error.message, "error");
      sendGoogleTaskButton.disabled = false;
      sendGoogleTaskButton.textContent = "Googleへ送る";
    }
    return;
  }

  const completeButton = event.target.closest(".complete-task");
  if (completeButton) {
    const row = completeButton.closest(".todo-row");
    const task = state.data.tasks.find((item) => item.id === row.dataset.id);
    if (!task) return;
    completeButton.disabled = true;
    try {
      const result = await api("/api/tasks/complete", {
        method: "POST",
        body: JSON.stringify(task)
      });
      render(result.state);
      showMessage("TODOを完了し、今日の日記へ追記しました。");
    } catch (error) {
      showMessage(error.message, "error");
      completeButton.disabled = false;
    }
  }
});

els.todoSearchInput?.addEventListener("input", (event) => {
  state.todoQuery = event.target.value.trim();
  renderTasks(state.data?.tasks || []);
});
els.todoFilterInput?.addEventListener("change", (event) => {
  state.todoFilter = event.target.value;
  renderTasks(state.data?.tasks || []);
});

els.todoCategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest(".todo-category-tab");
  if (!button) return;
  state.todoCategory = button.dataset.todoCategory || "normal";
  renderTasks(state.data?.tasks || []);
  els.todoList.scrollTop = 0;
});


async function persistCategories(message) {
  if (!state.data?.settings) return;
  state.data.settings.todoCategories = collectTodoCategories();
  await saveConfigFromUi();
  showMessage(message);
}

els.categorySettingsList?.addEventListener("click", async (event) => {
  const removeButton = event.target.closest(".remove-category-button");
  if (!removeButton || removeButton.disabled) return;
  const row = removeButton.closest(".category-setting-row");
  const id = row?.dataset.categoryId;
  if (!id || !state.data?.settings?.todoCategories) return;
  state.data.settings.todoCategories = state.data.settings.todoCategories.filter((category) => category.id !== id);
  if (state.todoCategory === id) state.todoCategory = "normal";
  render(state.data);
  try {
    await persistCategories("カテゴリーを削除しました。");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

els.categorySettingsList?.addEventListener("change", async (event) => {
  if (!event.target.closest(".category-setting-row")) return;
  try {
    await persistCategories("カテゴリー設定を保存しました。");
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

els.addCategoryButton?.addEventListener("click", async () => {
  const name = els.categoryNameInput?.value.trim();
  if (!name || !state.data?.settings) return;
  const current = state.data.settings.todoCategories || fallbackCategories();
  let id = clientCategoryId(name);
  while (current.some((category) => category.id === id)) id = `${id}-${current.length}`;
  state.data.settings.todoCategories = [...current, { id, name, googleTaskListId: els.categoryTaskListInput?.value || "" }];
  els.categoryNameInput.value = "";
  render(state.data);
  try {
    await persistCategories("カテゴリーを追加しました。");
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  }
});



els.calendarToggle?.addEventListener("click", () => {
  state.calendarExpanded = !state.calendarExpanded;
  updateCalendarCollapse();
});
els.categoryToggle?.addEventListener("click", () => {
  state.categoriesExpanded = !state.categoriesExpanded;
  updateCategoryCollapse();
});
els.googleTasksToggle?.addEventListener("click", () => {
  state.googleTasksExpanded = !state.googleTasksExpanded;
  updateGoogleTasksCollapse();
});
els.commanderAiButton?.addEventListener("click", () => {
  const mode = els.commanderAiMode?.value || "local";
  if (mode === "local") {
    els.aiPriorityButton?.click();
    return;
  }
  if (!els.codexForm || !els.codexPrompt) {
    els.aiPriorityButton?.click();
    return;
  }
  els.codexPrompt.value = "今日の予定、TODO、学習ログを見て、今からの作戦を3つに絞ってください。最初にやること、次にやること、避けることを短く提案してください。";
  if (els.codexIncludeContext) els.codexIncludeContext.checked = false;
  els.codexForm.scrollIntoView({ behavior: "smooth", block: "center" });
  showMessage("Codex欄に作戦依頼を入れました。必要なら文脈チェックをONにして送信してください。");
});
els.sendFocusTodoButton?.addEventListener("click", async () => {
  els.sendFocusTodoButton.disabled = true;
  els.sendFocusTodoButton.textContent = "送信中...";
  try {
    const result = await api("/api/focus/send", {
      method: "POST",
      body: JSON.stringify({ durationSeconds: currentElapsedSeconds(), target: els.focusSendTarget?.value || "focus" })
    });
    render(result.state);
    showMessage(`FocusTODOを${result.heading || "今日の日記"}へ送りました: ${result.diaryRelPath}`);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    els.sendFocusTodoButton.disabled = false;
    els.sendFocusTodoButton.textContent = "Obsidianへ送る";
  }
});
els.refreshButton.addEventListener("click", refresh);
els.todoRefresh.addEventListener("click", refresh);
els.kanbanRefresh?.addEventListener("click", refresh);
els.googleConnectButton.addEventListener("click", async () => {
  try {
    await api("/api/config", {
      method: "POST",
      body: JSON.stringify({
        vaultPath: els.vaultPathInput.value,
        ollamaUrl: els.ollamaUrlInput.value,
        ollamaModel: els.ollamaModelInput.value,
        aiderAskModel: els.aiderAskModelInput?.value || "",
        aiderWriteModel: els.aiderWriteModelInput?.value || "",
    aiderAskModel: els.aiderAskModelInput?.value || "",
    aiderWriteModel: els.aiderWriteModelInput?.value || "",
        calendarIcsUrl: els.calendarIcsUrlInput.value,
        googleClientId: els.googleClientIdInput?.value || "",
        googleClientSecret: els.googleClientSecretInput?.value || "",
        googleCalendarId: els.googleCalendarIdInput?.value || "primary",
        googleTaskListId: els.googleTaskListIdInput?.value || "",
        todoCategories: collectTodoCategories()
      })
    });
    const result = await api("/api/google/auth-url");
    window.open(result.authUrl, "_blank", "noopener,noreferrer");
    showMessage("Google認証ページを開きました。認証後、このアプリを再読み込みしてください。");
  } catch (error) {
    showMessage(error.message, "error");
  }
});
els.syncObsidianTasksButton?.addEventListener("click", async () => {
  els.syncObsidianTasksButton.disabled = true;
  els.syncObsidianTasksButton.textContent = "同期中...";
  try {
    const result = await api("/api/google-tasks/sync-obsidian", { method: "POST" });
    render(result.state);
    const skipped = result.skippedCount ? ` / 既存${result.skippedCount}件` : "";
    setGoogleTaskFeedback(`Obsidian TODOをGoogle Tasksへ${result.createdCount}件同期しました${skipped}。`);
    showMessage(`Obsidian TODOをGoogle Tasksへ${result.createdCount}件同期しました。`);
  } catch (error) {
    setGoogleTaskFeedback(error.message, "error");
    showMessage(error.message, "error");
  } finally {
    els.syncObsidianTasksButton.disabled = false;
    els.syncObsidianTasksButton.textContent = "Obsidian TODOを同期";
  }
});
els.startTimer.addEventListener("click", startTimer);
els.stopTimer.addEventListener("click", stopTimer);

els.googleTaskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearGoogleTaskFeedback();
  const title = els.googleTaskTitle.value.trim();
  if (!title) {
    setGoogleTaskFeedback("Google Tasksへ追加するTODOを入力してください。", "error");
    return;
  }
  els.googleTaskSubmit.disabled = true;
  els.googleTaskSubmit.textContent = "追加中...";
  try {
    const result = await api("/api/google-tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        dueDate: els.googleTaskDue.value,
        notes: els.googleTaskNotes.value,
        category: "google"
      })
    });
    els.googleTaskTitle.value = "";
    els.googleTaskDue.value = "";
    els.googleTaskNotes.value = "";
    render(result.state);
    setGoogleTaskFeedback("Google Tasksへ追加しました。");
  } catch (error) {
    setGoogleTaskFeedback(error.message, "error");
    showMessage(error.message, "error");
  } finally {
    els.googleTaskSubmit.disabled = false;
    els.googleTaskSubmit.textContent = "Google Tasksへ追加";
  }
});
els.calendarEventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearCalendarEventFeedback();
  const validationError = validateCalendarEventForm();
  if (validationError) {
    setCalendarEventFeedback(validationError, "error");
    showMessage(validationError, "error");
    return;
  }

  els.calendarEventSubmit.disabled = true;
  els.calendarEventSubmit.textContent = "追加中...";
  try {
    const result = await api("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify({
        title: els.calendarEventTitle.value,
        date: els.calendarEventDate.value,
        startTime: els.calendarEventStart.value,
        endTime: els.calendarEventEnd.value,
        location: els.calendarEventLocation.value,
        description: els.calendarEventDescription.value
      })
    });
    els.calendarEventTitle.value = "";
    els.calendarEventLocation.value = "";
    els.calendarEventDescription.value = "";
    render(result.state);
    setCalendarEventFeedback("Google Calendarへ予定を追加しました。カレンダー表示への反映に少し時間がかかる場合があります。");
    showMessage("Google Calendarへ予定を追加しました。反映に少し時間がかかる場合があります。");
  } catch (error) {
    setCalendarEventFeedback(error.message, "error");
    showMessage(error.message, "error");
  } finally {
    els.calendarEventSubmit.disabled = false;
    els.calendarEventSubmit.textContent = "Google Calendarへ追加";
  }
});
els.todoAddForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = els.todoTitleInput.value.trim();
  if (!title) {
    showMessage("追加するTODOを入力してください。", "error");
    return;
  }
  try {
    const result = await api("/api/tasks/add", {
      method: "POST",
      body: JSON.stringify({
        title,
        dueDate: els.todoDueInput.value,
        kind: els.todoKindInput.value,
        repeatRule: els.todoRepeatInput?.value || ""
      })
    });
    els.todoTitleInput.value = "";
    els.todoDueInput.value = "";
    if (els.todoRepeatInput) els.todoRepeatInput.value = "";
    els.todoKindInput.value = getTodoCategories().find((category) => category.id !== "google")?.id || "normal";
    render(result.state);
    if (result.googleTaskError) {
      showMessage(`TODOはObsidianへ追加しました。Google Tasks追加は失敗: ${result.googleTaskError}`, "error");
    } else if (result.googleTask) {
      showMessage("TODOをObsidianとGoogle Tasksのカテゴリーリストへ追加しました。");
    } else {
      showMessage("TODOを受信箱へ追加しました。");
    }
  } catch (error) {
    showMessage(error.message, "error");
  }
});

els.diaryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const result = await api("/api/diary/append", {
      method: "POST",
      body: JSON.stringify({
        heading: els.diaryHeading.value,
        text: els.diaryText.value
      })
    });
    els.diaryText.value = "";
    render(result.state);
    showMessage("今日の日記へ追記しました。");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

els.studyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  stopTimer();
  const durationSeconds = currentElapsedSeconds();
  try {
    const result = await api("/api/study/log", {
      method: "POST",
      body: JSON.stringify({
        category: els.studyCategory.value,
        memo: els.studyMemo.value,
        durationSeconds,
        startedAt: state.timer.startedAt?.toISOString(),
        endedAt: new Date().toISOString()
      })
    });
    els.studyMemo.value = "";
    resetTimer();
    render(result.state);
    showMessage(result.focus ? "学習ログとFocusTODOの勉強時間を同期しました。" : "学習ログを今日の日記へ追記しました。");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

els.aiPriorityButton.addEventListener("click", async () => {
  els.aiPriorityButton.disabled = true;
  els.aiPriorityButton.textContent = "AIに確認中...";
  els.aiPriorityResult.textContent = "Ollamaへ直接問い合わせています。初回は少し時間がかかります。";
  try {
    const result = await askOllamaDirect();
    els.aiPriorityResult.textContent = result.response || "提案が空でした。";
    showMessage(`${result.model} から優先順位提案を受け取りました。`);
  } catch (error) {
    const hint = `${error.message}\n\n確認: Ollamaが起動しているか、設定のモデル名が手元のモデル名と一致しているか見てください。`;
    els.aiPriorityResult.textContent = hint;
    showMessage(error.message, "error");
  } finally {
    els.aiPriorityButton.disabled = false;
    els.aiPriorityButton.textContent = "AIに優先順位を聞く";
  }
});
els.aiConsultForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = els.aiConsultText.value.trim();
  if (!question) {
    showMessage("相談内容を入力してください。", "error");
    return;
  }
  els.aiConsultButton.disabled = true;
  els.aiConsultButton.textContent = "相談中...";
  els.aiPriorityResult.textContent = "Ollamaへ相談しています。";
  try {
    const result = await askOllamaWithPrompt(buildConsultPrompt(question));
    els.aiPriorityResult.textContent = result.response || "回答が空でした。";
    showMessage(`${result.model} から相談回答を受け取りました。`);
  } catch (error) {
    const hint = `${error.message}\n\n確認: Ollamaが起動しているか、設定のモデル名が手元のモデル名と一致しているか見てください。`;
    els.aiPriorityResult.textContent = hint;
    showMessage(error.message, "error");
  } finally {
    els.aiConsultButton.disabled = false;
    els.aiConsultButton.textContent = "相談する";
  }
});
els.codexForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = els.codexPrompt?.value.trim() || "";
  if (!prompt) {
    showMessage("Codexへの相談内容を入力してください。", "error");
    return;
  }
  els.codexSubmit.disabled = true;
  els.codexSubmit.textContent = "Codex確認中...";
  els.codexResult.textContent = "Codexを読み取り専用で起動しています。少し時間がかかります。";
  try {
    const result = await api("/api/codex/ask", {
      method: "POST",
      body: JSON.stringify({ prompt, includeContext: Boolean(els.codexIncludeContext?.checked) })
    });
    els.codexResult.textContent = result.response || "Codexの回答が空でした。";
    showMessage("Codexから回答を受け取りました。");
  } catch (error) {
    els.codexResult.textContent = error.message;
    showMessage(error.message, "error");
  } finally {
    els.codexSubmit.disabled = false;
    els.codexSubmit.textContent = "Codexに聞く";
  }
});

els.aiDraftForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const source = els.aiDraftSource?.value.trim() || "";
  els.aiDraftSubmit.disabled = true;
  els.aiDraftSubmit.textContent = "作成中...";
  if (els.aiDraftResult) els.aiDraftResult.value = "Ollamaで下書きを作っています。";
  try {
    const result = await api("/api/ai/draft", {
      method: "POST",
      body: JSON.stringify({ kind: els.aiDraftKind?.value || "diary", source })
    });
    els.aiDraftResult.value = result.draft || "";
    if (result.heading && els.aiDraftHeading) els.aiDraftHeading.value = result.heading;
    showMessage(`${result.model || "Ollama"} で下書きを作りました。`);
  } catch (error) {
    if (els.aiDraftResult) els.aiDraftResult.value = error.message;
    showMessage(error.message, "error");
  } finally {
    els.aiDraftSubmit.disabled = false;
    els.aiDraftSubmit.textContent = "下書きを作る";
  }
});

els.aiDraftToDiaryButton?.addEventListener("click", () => {
  const draft = els.aiDraftResult?.value.trim() || "";
  if (!draft) {
    showMessage("日記欄へ入れる下書きがありません。", "error");
    return;
  }
  if (els.diaryText) els.diaryText.value = draft;
  if (els.diaryHeading && els.aiDraftHeading) els.diaryHeading.value = els.aiDraftHeading.value;
  els.diaryForm?.scrollIntoView({ behavior: "smooth", block: "center" });
  showMessage("下書きを日記追記欄へ入れました。確認して保存できます。");
});

els.aiDraftSaveButton?.addEventListener("click", async () => {
  const draft = els.aiDraftResult?.value.trim() || "";
  if (!draft) {
    showMessage("保存する下書きがありません。", "error");
    return;
  }
  els.aiDraftSaveButton.disabled = true;
  els.aiDraftSaveButton.textContent = "保存中...";
  try {
    const result = await api("/api/diary/append", {
      method: "POST",
      body: JSON.stringify({ heading: els.aiDraftHeading?.value || "今日のメモ", text: draft })
    });
    render(result.state);
    showMessage(`AI下書きを今日の日記へ保存しました: ${result.diaryRelPath}`);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    els.aiDraftSaveButton.disabled = false;
    els.aiDraftSaveButton.textContent = "日記へ保存";
  }
});

els.aiderForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = els.aiderPrompt?.value.trim() || "";
  if (!prompt) {
    showMessage("Aiderへの相談内容を入力してください。", "error");
    return;
  }
  els.aiderSubmit.disabled = true;
  els.aiderSubmit.textContent = "Aider確認中...";
  const mode = els.aiderMode?.value === "write" ? "write" : "ask";
  els.aiderResult.textContent = mode === "write"
    ? "qwen code系モデルで入力・保存/編集案を作成しています。初回は少し時間がかかります。"
    : "Gemma/Qwen系モデルで質問に回答しています。初回は少し時間がかかります。";
  try {
    const result = await api("/api/aider/ask", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        mode,
        includeContext: Boolean(els.aiderIncludeContext?.checked),
        includeAppFiles: Boolean(els.aiderIncludeAppFiles?.checked)
      })
    });
    els.aiderResult.textContent = result.response || "Aiderの回答が空でした。";
    showMessage("Aiderから回答を受け取りました。");
  } catch (error) {
    els.aiderResult.textContent = error.message;
    showMessage(error.message, "error");
  } finally {
    els.aiderSubmit.disabled = false;
    els.aiderSubmit.textContent = "Aiderに聞く";
  }
});

els.kanbanBoard?.addEventListener("dragstart", (event) => {
  const card = event.target.closest(".kanban-card");
  if (!card) return;
  state.kanbanDragTaskId = card.dataset.id || "";
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.kanbanDragTaskId);
  card.classList.add("is-dragging");
});
els.kanbanBoard?.addEventListener("dragend", (event) => {
  event.target.closest(".kanban-card")?.classList.remove("is-dragging");
  state.kanbanDragTaskId = "";
});
els.kanbanBoard?.addEventListener("dragover", (event) => {
  const column = event.target.closest(".kanban-column");
  if (!column) return;
  event.preventDefault();
  column.classList.add("is-drag-over");
});
els.kanbanBoard?.addEventListener("dragleave", (event) => {
  event.target.closest(".kanban-column")?.classList.remove("is-drag-over");
});
els.kanbanBoard?.addEventListener("drop", async (event) => {
  const column = event.target.closest(".kanban-column");
  if (!column) return;
  event.preventDefault();
  column.classList.remove("is-drag-over");
  const taskId = event.dataTransfer.getData("text/plain") || state.kanbanDragTaskId;
  if (!taskId) return;
  try {
    const result = await api("/api/kanban/move", { method: "POST", body: JSON.stringify({ taskId, status: column.dataset.kanbanColumn }) });
    render(result.state);
    showMessage("Kanbanを移動しました。");
  } catch (error) {
    showMessage(error.message, "error");
  }
});
els.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/config", {
      method: "POST",
      body: JSON.stringify({
        vaultPath: els.vaultPathInput.value,
        ollamaUrl: els.ollamaUrlInput.value,
        ollamaModel: els.ollamaModelInput.value,
        aiderAskModel: els.aiderAskModelInput?.value || "",
        aiderWriteModel: els.aiderWriteModelInput?.value || "",
    aiderAskModel: els.aiderAskModelInput?.value || "",
    aiderWriteModel: els.aiderWriteModelInput?.value || "",
        calendarIcsUrl: els.calendarIcsUrlInput.value,
        googleClientId: els.googleClientIdInput?.value || "",
        googleClientSecret: els.googleClientSecretInput?.value || "",
        googleCalendarId: els.googleCalendarIdInput?.value || "primary",
        googleTaskListId: els.googleTaskListIdInput?.value || "",
        todoCategories: collectTodoCategories()
      })
    });
    await refresh();
    showMessage("設定を保存しました。");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const showSettings = button.dataset.view === "settings";
    const showKanban = button.dataset.view === "kanban";
    els.settingsPanel.hidden = !showSettings;
    if (els.kanbanPanel) els.kanbanPanel.hidden = !showKanban;
    if (showSettings) els.settingsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    if (showKanban) els.kanbanPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

refresh();
