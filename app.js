/**
 * app.js
 * ------
 * All DOM rendering + interaction for the ledger UI. Depends on
 * `window.Engine` (engine.js) and `window.FIXTURES` (data.js).
 */

(function () {
  "use strict";

  const state = {
    caseId: null,
    result: null, // output of Engine.evaluateCase
    tab: "all", // all | optional | practical | absent
    classFilter: "all",
    search: "",
    customData: null, // if the office uploads its own JSON, cases live here
  };

  // ---------- element refs ----------
  const el = {
    caseSelect: document.getElementById("caseSelect"),
    classSelect: document.getElementById("classSelect"),
    search: document.getElementById("search"),
    fileInput: document.getElementById("fileInput"),
    statStrip: document.getElementById("statStrip"),
    tabs: document.getElementById("tabs"),
    tableWrap: document.getElementById("tableWrap"),
    overlay: document.getElementById("overlay"),
    scriptBody: document.getElementById("scriptBody"),
    scriptHead: document.getElementById("scriptHead"),
    closeBtn: document.getElementById("closeBtn"),
  };

  // ---------- helpers ----------
  function fmtGPA(n) {
    return n.toFixed(2);
  }

  function studentDataSource() {
    return state.customData || window.FIXTURES || {};
  }

  function loadCase(caseId) {
    const source = studentDataSource();
    const caseData = source[caseId];
    if (!caseData) return;
    state.caseId = caseId;
    state.result = window.Engine.evaluateCase(caseData);
    state.classFilter = "all";
    populateClassFilter();
    render();
  }

  function populateCaseSelect() {
    const source = studentDataSource();
    const ids = Object.keys(source).sort();
    el.caseSelect.innerHTML = ids
      .map((id) => {
        const n = source[id].students.length;
        return `<option value="${id}">${id} — ${n} students</option>`;
      })
      .join("");
    if (ids.length) {
      el.caseSelect.value = ids.includes(state.caseId) ? state.caseId : ids[0];
    }
  }

  function populateClassFilter() {
    const classes = state.result.classes;
    el.classSelect.innerHTML =
      `<option value="all">All classes</option>` +
      classes.map((c) => `<option value="${c}">${c}</option>`).join("");
    el.classSelect.value = "all";
  }

  function filteredStudents() {
    const r = state.result;
    let list;
    if (state.tab === "all") list = r.students;
    else if (state.tab === "optional") list = r.lists.optional;
    else if (state.tab === "practical") list = r.lists.practical;
    else list = r.lists.absent;

    if (state.classFilter !== "all") {
      list = list.filter((s) => s.class === state.classFilter);
    }
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // ---------- render: stat strip ----------
  function renderStats() {
    const s = state.result.stats;
    const l = state.result.lists;
    el.statStrip.innerHTML = `
      <div class="stat-cell">
        <div class="num">${s.total}</div>
        <div class="label">Students</div>
      </div>
      <div class="stat-cell pass">
        <div class="num">${s.pass}</div>
        <div class="label">Passed</div>
      </div>
      <div class="stat-cell fail">
        <div class="num">${s.fail}</div>
        <div class="label">Failed</div>
      </div>
      <div class="stat-cell">
        <div class="num">${fmtGPA(s.avgGPA)}</div>
        <div class="label">Average GPA</div>
      </div>
      <div class="stat-cell clickable" data-jump="practical">
        <div class="num">${l.practical.length}</div>
        <div class="label">Practical-fail check</div>
      </div>
      <div class="stat-cell clickable" data-jump="absent">
        <div class="num">${l.absent.length}</div>
        <div class="label">Absent check</div>
      </div>
    `;
    el.statStrip.querySelectorAll("[data-jump]").forEach((cell) => {
      cell.addEventListener("click", () => {
        state.tab = cell.getAttribute("data-jump");
        render();
      });
    });
  }

  // ---------- render: tabs ----------
  function renderTabs() {
    const l = state.result.lists;
    const defs = [
      ["all", "All Students", state.result.students.length],
      ["optional", "Optional-Subject List", l.optional.length],
      ["practical", "Practical-Fail List", l.practical.length],
      ["absent", "Absent List", l.absent.length],
    ];
    el.tabs.innerHTML = defs
      .map(
        ([key, label, count]) => `
        <div class="tab ${state.tab === key ? "active" : ""}" data-tab="${key}">
          ${label}<span class="count">(${count})</span>
        </div>`
      )
      .join("");
    el.tabs.querySelectorAll(".tab").forEach((t) => {
      t.addEventListener("click", () => {
        state.tab = t.getAttribute("data-tab");
        render();
      });
    });
  }

  // ---------- render: table ----------
  function badgesFor(s) {
    let out = "";
    if (s.flags.onAbsentList) out += `<span class="badge ab">AB</span>`;
    if (s.flags.onPracticalList) out += `<span class="badge pr">PR</span>`;
    if (s.flags.onOptionalList) out += `<span class="badge opt">OPT</span>`;
    return out;
  }

  function reasonFor(s) {
    if (state.tab === "optional") {
      const r = s.optionalResult;
      return r.status === "absent"
        ? `Absent in optional (${r.name}) → treated as 0.`
        : `Optional grade point ${r.gp.toFixed(1)} ≤ 2.0 (${r.name}).`;
    }
    if (state.tab === "practical") {
      const failed = [...s.compulsoryResults, s.optionalResult].filter(
        (r) => r.status === "practical_fail" || r.status === "both_fail"
      );
      return `Practical below pass mark in ${failed.map((r) => r.name).join(", ")}.`;
    }
    if (state.tab === "absent") {
      const abs = [...s.compulsoryResults, s.optionalResult].filter(
        (r) => r.status === "absent"
      );
      return `Marked AB in ${abs.map((r) => r.name).join(", ")}.`;
    }
    return "";
  }

  function renderTable() {
    const rows = filteredStudents();
    const showReason = state.tab !== "all";

    if (!rows.length) {
      el.tableWrap.innerHTML = `<div class="empty-state">No students match this list and filter.</div>`;
      return;
    }

    const head = `
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Class</th>
        <th>Optional</th>
        <th class="num">GPA</th>
        <th>Letter</th>
        <th>Result</th>
        <th>Flags</th>
        ${showReason ? "<th>Reason</th>" : ""}
      </tr>`;

    const body = rows
      .map(
        (s) => `
      <tr data-id="${s.id}">
        <td class="marks-cell">${s.id}</td>
        <td>${s.name}</td>
        <td>${s.class}</td>
        <td>${s.optionalCode}</td>
        <td class="num gpa-num">${fmtGPA(s.finalGPA)}</td>
        <td class="letter">${s.letter}</td>
        <td><span class="pill ${s.passFail === "PASS" ? "pass" : "fail"}">${s.passFail}</span></td>
        <td>${badgesFor(s)}</td>
        ${showReason ? `<td class="checklist-reason">${reasonFor(s)}</td>` : ""}
      </tr>`
      )
      .join("");

    el.tableWrap.innerHTML = `
      <table>
        <thead>${head}</thead>
        <tbody>${body}</tbody>
      </table>`;

    el.tableWrap.querySelectorAll("tbody tr").forEach((tr) => {
      tr.addEventListener("click", () => openTrace(tr.getAttribute("data-id")));
    });
  }

  // ---------- render: trace / detail script ----------
  const PEN_CIRCLE_SVG = `
    <svg viewBox="0 0 46 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 3
        C34 2, 43 8, 42 16
        C41 24, 30 29, 20 28
        C9 27, 2 20, 4 13
        C6 6, 15 3, 24 4"
        stroke="#ab3a2c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </svg>`;

  function subjectRow(r) {
    const isFailCause = r.fail && r.isCompulsory;
    return `
      <tr class="${r.fail ? "fail-row" : ""}">
        <td class="subj-cell">${r.name}${r.isPractical ? " <span style='color:var(--ink-faint);font-weight:400;'>(practical)</span>" : ""}</td>
        <td class="marks-cell">${r.marksDisplay}</td>
        <td class="gp-cell">
          ${isFailCause ? `<span class="pen-circle">${PEN_CIRCLE_SVG}</span>` : ""}
          ${r.gp.toFixed(1)}
        </td>
        <td class="rule-cell">${r.rule}${isFailCause ? `<span class="pen-note">← caused the fail</span>` : ""}</td>
      </tr>`;
  }

  function traceTable(title, rows) {
    return `
      <div class="section-label">${title}</div>
      <table class="trace-table">
        <thead>
          <tr><th style="width:22%">Subject</th><th style="width:20%">Marks used</th><th style="width:9%">GP</th><th>Rule applied</th></tr>
        </thead>
        <tbody>${rows.map(subjectRow).join("")}</tbody>
      </table>`;
  }

  function calcBox(s) {
    const optName = s.optionalResult.name;
    let html = `
      <div class="calc-box">
        Compulsory grade points: ${s.compulsoryResults.map((r) => r.gp.toFixed(1)).join(" + ")} = <b>${s.compulsorySum.toFixed(1)}</b><br/>
        Optional bonus: max(0, ${s.optionalResult.gp.toFixed(1)} − 2.0) [${optName}] = <b>${s.optionalBonus.toFixed(1)}</b><br/>
        Raw GPA: (${s.compulsorySum.toFixed(1)} + ${s.optionalBonus.toFixed(1)}) ÷ 6 = <b>${s.rawGPA.toFixed(2)}</b> (capped at 5.00)
        <div class="final-line">Final GPA: ${fmtGPA(s.finalGPA)} → Letter ${s.letter} → ${s.passFail}</div>
      </div>`;

    if (s.hasCompulsoryFail) {
      html += `
        <div class="cancel-note">
          <b>Cancelled.</b> Compulsory failure in <b>${s.failingSubjects.join(", ")}</b> forces the whole
          result to GPA 0.00 / F, whatever the average says (R-13). The uncancelled average above
          (${s.rawGPA.toFixed(2)}) is kept only so the office can verify the arithmetic by hand.
        </div>`;
    }
    return html;
  }

  function openTrace(id) {
    const s = state.result.students.find((x) => x.id === id);
    if (!s) return;

    el.scriptHead.innerHTML = `
      <div>
        <h2>${s.name}</h2>
        <div class="meta">${s.id} · ${s.class} · Optional subject: ${s.optionalResult.name}</div>
      </div>
      <button class="close-btn" id="closeBtnInner" aria-label="Close">✕</button>`;

    el.scriptBody.innerHTML =
      traceTable("Compulsory subjects", s.compulsoryResults) +
      traceTable("Optional subject", [s.optionalResult]) +
      calcBox(s);

    el.overlay.classList.add("open");
    document.getElementById("closeBtnInner").addEventListener("click", closeTrace);
  }

  function closeTrace() {
    el.overlay.classList.remove("open");
  }

  // ---------- master render ----------
  function render() {
    if (!state.result) return;
    renderStats();
    renderTabs();
    renderTable();
  }

  // ---------- events ----------
  el.caseSelect.addEventListener("change", () => loadCase(el.caseSelect.value));
  el.classSelect.addEventListener("change", () => {
    state.classFilter = el.classSelect.value;
    render();
  });
  el.search.addEventListener("input", () => {
    state.search = el.search.value;
    render();
  });
  el.overlay.addEventListener("click", (e) => {
    if (e.target === el.overlay) closeTrace();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTrace();
  });
  el.closeBtn?.addEventListener("click", closeTrace);

  el.fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        // Accept either the full fixture wrapper ({cases:[...]}) or a single case object.
        let cases = {};
        if (Array.isArray(parsed.cases)) {
          parsed.cases.forEach((c) => (cases[c.case_id] = c));
        } else if (parsed.case_id && parsed.students) {
          cases[parsed.case_id] = parsed;
        } else {
          throw new Error("Unrecognised JSON shape");
        }
        state.customData = cases;
        populateCaseSelect();
        loadCase(Object.keys(cases)[0]);
      } catch (err) {
        alert("Could not read that file as P08 case data: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  // ---------- boot ----------
  populateCaseSelect();
  loadCase(el.caseSelect.value);
})();
