/**
 * engine.js
 * ---------
 * Pure grading logic for the School Result Processing & GPA Engine (P08).
 * No DOM access here — everything is a plain function that takes data in
 * and returns data out, so it can be tested or reused (e.g. from a CLI
 * or a Node test file) independently of app.js.
 *
 * Rule references (kept in the output so the trace can cite them):
 *   R-10  mark band -> grade point table, letter grade bands
 *   R-11  practical subjects: theory & practical pass marks, fail rule
 *   R-12  absence handling (compulsory vs optional)
 *   R-13  GPA formula, capping, compulsory-failure cancellation
 *   R-29  the three checking lists
 */

(function (root) {
  "use strict";

  const THEORY_MAX = 75;
  const THEORY_PASS = 25;
  const PRACTICAL_MAX = 25;
  const PRACTICAL_PASS = 8;

  // Highest band first. `label` is only for display.
  const GRADE_BANDS = [
    { min: 80, gp: 5.0, label: "80–100" },
    { min: 70, gp: 4.0, label: "70–79" },
    { min: 60, gp: 3.5, label: "60–69" },
    { min: 50, gp: 3.0, label: "50–59" },
    { min: 40, gp: 2.0, label: "40–49" },
    { min: 33, gp: 1.0, label: "33–39" },
    { min: 0, gp: 0.0, label: "0–32" },
  ];

  function gradeBand(total) {
    for (const b of GRADE_BANDS) {
      if (total >= b.min) return b;
    }
    return GRADE_BANDS[GRADE_BANDS.length - 1];
  }

  function round2(x) {
    return Math.round((x + Number.EPSILON) * 100) / 100;
  }

  function fmtGP(gp) {
    return gp.toFixed(1);
  }

  function letterFromGPA(gpa) {
    if (gpa >= 5.0) return "A+";
    if (gpa >= 4.0) return "A";
    if (gpa >= 3.5) return "A-";
    if (gpa >= 3.0) return "B";
    if (gpa >= 2.0) return "C";
    if (gpa >= 1.0) return "D";
    return "F";
  }

  /**
   * Evaluate one subject mark for one student.
   * @param {object} meta   {code, name, practical}
   * @param {*} rawValue    number | {theory,practical} | "AB"
   * @param {boolean} isCompulsory
   */
  function evaluateSubject(meta, rawValue, isCompulsory) {
    const base = {
      code: meta.code,
      name: meta.name,
      isPractical: !!meta.practical,
      isCompulsory,
    };

    // --- Absent ---------------------------------------------------------
    if (rawValue === "AB" || rawValue === undefined || rawValue === null) {
      return {
        ...base,
        status: "absent",
        marksDisplay: "AB",
        total: null,
        gp: 0,
        fail: true,
        rule: isCompulsory
          ? "Absent (AB) in a compulsory subject → subject grade point 0.0 → the whole result is F (R-12)."
          : "Absent (AB) in the optional subject → contributes 0 to GPA and the student is added to the Absent checking list (R-12).",
      };
    }

    // --- Subject with a practical part -----------------------------------
    if (meta.practical) {
      const theory = rawValue.theory;
      const practical = rawValue.practical;
      const theoryPass = theory >= THEORY_PASS;
      const practicalPass = practical >= PRACTICAL_PASS;
      const total = theory + practical;
      const marksDisplay = `${theory} + ${practical} = ${total}/100`;

      if (!theoryPass || !practicalPass) {
        let status;
        if (!theoryPass && !practicalPass) status = "both_fail";
        else if (!practicalPass) status = "practical_fail";
        else status = "theory_fail";

        return {
          ...base,
          status,
          marksDisplay,
          total,
          theory,
          practical,
          gp: 0,
          fail: true,
          rule:
            `Theory ${theory}/${THEORY_MAX} (pass ≥${THEORY_PASS}) ${theoryPass ? "PASS" : "FAIL"}, ` +
            `Practical ${practical}/${PRACTICAL_MAX} (pass ≥${PRACTICAL_PASS}) ${practicalPass ? "PASS" : "FAIL"} ` +
            `→ one part failed → subject grade point 0.0 regardless of total (R-11).`,
        };
      }

      const band = gradeBand(total);
      return {
        ...base,
        status: "ok",
        marksDisplay,
        total,
        theory,
        practical,
        gp: band.gp,
        fail: false,
        rule:
          `Theory ${theory}/${THEORY_MAX} PASS, Practical ${practical}/${PRACTICAL_MAX} PASS → ` +
          `total ${total}/100 → band ${band.label} → grade point ${fmtGP(band.gp)} (R-11, R-10).`,
      };
    }

    // --- Plain subject, no practical part ---------------------------------
    const total = rawValue;
    const band = gradeBand(total);
    return {
      ...base,
      status: band.gp === 0 ? "fail" : "ok",
      marksDisplay: `${total}/100`,
      total,
      gp: band.gp,
      fail: band.gp === 0,
      rule: `Mark ${total}/100 → band ${band.label} → grade point ${fmtGP(band.gp)} (R-10).`,
    };
  }

  /**
   * Evaluate one student's full result.
   * @param {object} student   {id, name, class, optional, marks}
   * @param {object} subjectsByCode  map code -> {code,name,practical}
   * @param {string[]} compulsoryCodes
   */
  function evaluateStudent(student, subjectsByCode, compulsoryCodes) {
    const compulsoryResults = compulsoryCodes.map((code) =>
      evaluateSubject(subjectsByCode[code], student.marks[code], true)
    );

    const optionalCode = student.optional;
    const optionalResult = evaluateSubject(
      subjectsByCode[optionalCode],
      student.marks[optionalCode],
      false
    );

    const compulsorySum = compulsoryResults.reduce((s, r) => s + r.gp, 0);
    const hasCompulsoryFail = compulsoryResults.some((r) => r.fail);
    const optionalBonus = Math.max(0, optionalResult.gp - 2);

    const rawGPA = (compulsorySum + optionalBonus) / 6;
    const cappedRawGPA = round2(Math.min(rawGPA, 5.0));

    const finalGPA = hasCompulsoryFail ? 0.0 : cappedRawGPA;
    const letter = hasCompulsoryFail ? "F" : letterFromGPA(finalGPA);
    const passFail = hasCompulsoryFail ? "FAIL" : "PASS";

    const failingSubjects = compulsoryResults.filter((r) => r.fail).map((r) => r.name);

    const allResults = [...compulsoryResults, optionalResult];

    const flags = {
      onOptionalList: optionalResult.gp <= 2.0, // R-29: includes an absent optional (gp 0)
      onPracticalList: allResults.some(
        (r) => r.isPractical && (r.status === "practical_fail" || r.status === "both_fail")
      ),
      onAbsentList: allResults.some((r) => r.status === "absent"),
    };

    return {
      id: student.id,
      name: student.name,
      class: student.class,
      optionalCode,
      compulsoryResults,
      optionalResult,
      compulsorySum: round2(compulsorySum),
      optionalBonus: round2(optionalBonus),
      rawGPA: cappedRawGPA, // "uncancelled" average — always visible in the trace
      hasCompulsoryFail,
      finalGPA: round2(finalGPA),
      letter,
      passFail,
      failingSubjects,
      flags,
    };
  }

  /**
   * Evaluate an entire case (a set of subjects + students).
   */
  function evaluateCase(caseData) {
    const subjectsByCode = {};
    caseData.subjects.forEach((s) => (subjectsByCode[s.code] = s));

    const students = caseData.students.map((st) =>
      evaluateStudent(st, subjectsByCode, caseData.compulsory)
    );

    const lists = {
      optional: students.filter((s) => s.flags.onOptionalList),
      practical: students.filter((s) => s.flags.onPracticalList),
      absent: students.filter((s) => s.flags.onAbsentList),
    };

    const passCount = students.filter((s) => s.passFail === "PASS").length;
    const failCount = students.length - passCount;
    const avgGPA =
      students.length === 0
        ? 0
        : round2(students.reduce((s, st) => s + st.finalGPA, 0) / students.length);

    return {
      caseId: caseData.case_id,
      subjects: caseData.subjects,
      compulsory: caseData.compulsory,
      classes: Array.from(new Set(caseData.students.map((s) => s.class))).sort(),
      students,
      lists,
      stats: { total: students.length, pass: passCount, fail: failCount, avgGPA },
    };
  }

  const Engine = {
    THEORY_MAX,
    THEORY_PASS,
    PRACTICAL_MAX,
    PRACTICAL_PASS,
    GRADE_BANDS,
    gradeBand,
    round2,
    letterFromGPA,
    evaluateSubject,
    evaluateStudent,
    evaluateCase,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Engine; // Node (for tests / CLI use)
  } else {
    root.Engine = Engine; // Browser
  }
})(typeof window !== "undefined" ? window : globalThis);
