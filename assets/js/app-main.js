/* ═══════════════════════════════════════════════════════════════
   🏛️ منظومة الإحالة التربوية السريعة — الحراسة العامة
   الكود البرمجي الرئيسي الشامل — المملكة المغربية
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // A storage restriction must not disable the form; permanent saves are explicit.
  const volatileStorage = new Map();
  function storageWarning() {
    const node = document.getElementById('storageStatus');
    if (node) { node.hidden = false; node.textContent = 'الحفظ الدائم غير متاح في هذا المتصفح. لن تبقى البيانات بعد إغلاق الصفحة؛ يرجى السماح بالتخزين المحلي قبل استيراد اللائحة.'; }
  }
  const storage = {
    getItem(key) {
      try { const value = localStorage.getItem(key); if (value !== null) volatileStorage.set(key, value); return value; }
      catch { storageWarning(); return volatileStorage.get(key) || null; }
    },
    setItem(key, value) {
      volatileStorage.set(key, value);
      try { localStorage.setItem(key, value); return true; }
      catch { storageWarning(); return false; }
    }
  };

  // ═══ مفاتيح التخزين المحلي ═══
  const STORAGE_KEYS = {
    TEACHER: 'men_gov_teacher_data',
    SETTINGS: 'men_gov_app_settings',
    STUDENTS: 'men_gov_students_db',
    REPORTS: 'men_gov_reports_history',
    DAILY_CYCLE: 'men_gov_last_daily_cycle'
  };

  // ═══ دالة تعقيم وتأمين النصوص ضد حقن HTML ═══
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const INSTITUTION = Object.freeze({
    schoolName: 'مجموعة مدارس مون إيكول — GS MON ECOLE',
    directorate: 'المديرية الإقليمية بتطوان',
    academy: 'أكاديمية جهة طنجة - تطوان - الحسيمة'
  });

  // ═══ التسميات الرسمية للأسلاك والمستويات — مؤسسة GS MON ECOLE (بدون أقواس منعاً لتشوه الخط) ═══
  const OFFICIAL_STRUCTURE = {
    'التعليم الابتدائي': [
      'السنة الأولى ابتدائي — 1AP',
      'السنة الثانية ابتدائي — 2AP',
      'السنة الثالثة ابتدائي — 3AP',
      'السنة الرابعة ابتدائي — 4AP',
      'السنة الخامسة ابتدائي — 5AP',
      'السنة السادسة ابتدائي — 6AP'
    ],
    'الثانوي الإعدادي': [
      'السنة الأولى إعدادي — مسار دولي 1AC',
      'السنة الثانية إعدادي — مسار دولي 2AC',
      'السنة الثالثة إعدادي — مسار دولي 3AC'
    ],
    'الثانوي التأهيلي': [
      'الجذع المشترك العلمي — TC S',
      '1Bac — شعبة العلوم التجريبية',
      '1Bac — شعبة العلوم الرياضية',
      '1Bac — شعبة العلوم الاقتصادية والتدبير',
      '2Bac — مسلك العلوم الفيزيائية — PC'
    ]
  };

  /**
   * تطهير وإلغاء الأقواس من المستويات الدراسية لتفادي تداخل وانعكاس الحروف (مثل S)(TC)
   */
  function cleanLevel(str) {
    if (!str) return '—';
    return String(str)
      .replace(/\s*\(\s*TC\s*S\s*\)/gi, ' — TC S')
      .replace(/\s*\(\s*2Bac\s*PC\s*\)/gi, ' — PC')
      .replace(/\s*\(\s*مسار\s*دولي\s*-\s*(\d+AC)\s*\)/gi, ' — مسار دولي $1')
      .replace(/\s*\(\s*(\d+AP)\s*\)/gi, ' — $1')
      .replace(/[()]/g, '')
      .replace(/\s*—\s*—\s*/g, ' — ')
      .trim();
  }

  function resolveOfficialLevel(value) {
    const text = cleanLevel(value);
    for (const [cycle, levels] of Object.entries(OFFICIAL_STRUCTURE)) {
      const level = levels.find(item => item === text);
      if (level) return { cycle, level };
    }
    const upper = text.toUpperCase();
    if (/عام|GENERAL|GÉNÉRAL/.test(upper)) return null;
    const primary = upper.match(/([1-6])AP/);
    if (primary) return { cycle: 'التعليم الابتدائي', level: OFFICIAL_STRUCTURE['التعليم الابتدائي'][+primary[1] - 1] };
    const college = upper.match(/([1-3])AC/);
    if (college) return { cycle: 'الثانوي الإعدادي', level: OFFICIAL_STRUCTURE['الثانوي الإعدادي'][+college[1] - 1] };
    const lycee = OFFICIAL_STRUCTURE['الثانوي التأهيلي'];
    let index = -1;
    if (/TC\s*S|الجذع المشترك العلمي/.test(upper)) index = 0;
    else if (/1\s*BAC/.test(upper)) {
      if (/EXP|تجريبية/.test(upper)) index = 1;
      else if (/MATH|رياضية/.test(upper)) index = 2;
      else if (/ECO|ÉCO|اقتصاد/.test(upper)) index = 3;
    } else if (/2\s*BAC/.test(upper) && /PC|PHYS|فيزيائية/.test(upper)) index = 4;
    return index >= 0 ? { cycle: 'الثانوي التأهيلي', level: lycee[index] } : null;
  }

  // ═══ لائحة التلاميذ الافتراضية (فارغة تماماً لحين استيراد لوائح مسار الرسمية) ═══
  const DEFAULT_STUDENTS = [];

  // School days follow Morocco's clock, regardless of the device timezone.
  const schoolClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  function schoolTimeParts(now = new Date()) {
    return Object.fromEntries(schoolClock.formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  }
  function getCurrentDailyCycleKey(now = new Date()) {
    const p = schoolTimeParts(now);
    const day = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
    if (+p.hour < 7) day.setUTCDate(day.getUTCDate() - 1);
    return `cycle_${day.toISOString().slice(0, 10)}_07:00`;
  }
  function getDailyCycleStartTimestamp(now = new Date()) {
    const date = getCurrentDailyCycleKey(now).slice(6, 16);
    const target = Date.parse(`${date}T07:00:00Z`);
    let instant = target;
    for (let i = 0; i < 3; i++) {
      const p = schoolTimeParts(new Date(instant));
      const rendered = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
      instant += target - rendered;
    }
    return instant;
  }
  function readStoredArray(key) {
    try {
      const value = JSON.parse(storage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }
  function checkAndApplyDailyReset() {
    const currentCycle = getCurrentDailyCycleKey();
    const reports = readStoredArray(STORAGE_KEYS.REPORTS);
    const fresh = reports.filter(r => r && r.createdAt && Number.isFinite(Date.parse(r.createdAt)) && getCurrentDailyCycleKey(new Date(r.createdAt)) === currentCycle);
    const changed = storage.getItem(STORAGE_KEYS.DAILY_CYCLE) !== currentCycle || fresh.length !== reports.length;
    state.reports = fresh;
    if (changed) {
      storage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(fresh));
      storage.setItem(STORAGE_KEYS.DAILY_CYCLE, currentCycle);
      discardPreparedImage();
    }
    updateStatsBadges();
    if (changed && document.getElementById('tab-stats')?.classList.contains('active')) renderStatistics();
    return changed;
  }
  let dailyResetTimer;
  function scheduleDailyReset() {
    clearTimeout(dailyResetTimer);
    checkAndApplyDailyReset();
    const now = new Date();
    // A date safely within the next school cycle also covers Ramadan offset changes.
    const next = getDailyCycleStartTimestamp(new Date(getDailyCycleStartTimestamp(now) + 36 * 60 * 60 * 1000));
    dailyResetTimer = setTimeout(scheduleDailyReset, Math.max(100, next - now.getTime()));
  }

  // ═══ حالة التطبيق (State) ═══
  const state = {
    students: [],
    selectedStudents: [], // مصفوفة التلاميذ المعنيين بالإحالة (دعم تلميذ أو عدة تلاميذ)
    selectedInfractions: new Set(),
    settings: { ...INSTITUTION, whatsappPhone: '' },
    reports: [],
    charts: {
      types: null,
      divisions: null
    }
  };

  // ═══ تطبيق الشعارات الرسمية بصيغة Base64 (لمنع Tainted Canvas جذرياً) ═══
  function applyOfficialLogos() {
    if (!window.OFFICIAL_LOGOS) return;
    const { schoolLogo, ministryLogo } = window.OFFICIAL_LOGOS;

    const schoolImgs = document.querySelectorAll('#headerSchoolLogo, #pdfSchoolLogo, img[src*="school-logo"]');
    schoolImgs.forEach(img => {
      if (schoolLogo && img.src !== schoolLogo) img.src = schoolLogo;
    });

    const ministryImgs = document.querySelectorAll('#headerMinistryLogo, #pdfMinistryLogo, img[src*="ministry-logo"]');
    ministryImgs.forEach(img => {
      if (ministryLogo && img.src !== ministryLogo) img.src = ministryLogo;
    });
  }

  // ═══ تهيئة البيانات ═══
  function initData() {
    // تحميل الإعدادات
    const savedSettings = storage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try { state.settings.whatsappPhone = String(JSON.parse(savedSettings)?.whatsappPhone || ''); } catch (e) {}
    }

    Object.entries(INSTITUTION).forEach(([key, value]) => {
      Object.defineProperty(state.settings, key, { value, writable: false, configurable: false, enumerable: true });
    });
    try { storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings)); }
    catch (error) { console.warn('Institution settings could not be persisted', error); }

    // Never delete imported pupils by name or overwrite their persisted list on startup.
    state.students = readStoredArray(STORAGE_KEYS.STUDENTS).filter(student => student && typeof student.name === 'string')
      .map(student => ({ ...student, id: String(student.id || ''), level: cleanLevel(student.level) }));
    state.reports = readStoredArray(STORAGE_KEYS.REPORTS);

    // تطبيق فحص الدورة اليومية على رأس 24 ساعة عند 07:00 صباحاً
    checkAndApplyDailyReset();
  }

  // ═══ إدارة التبويبات ═══
  function initNavigation() {
    document.querySelector('.intro-action').addEventListener('click', () => {
      document.querySelector('[data-tab="tab-form"]').click();
    });
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const activePane = document.getElementById(targetTab);
        if (activePane) activePane.classList.add('active');

        // تحديث الإحصائيات عند الانتقال لتبويبها
        if (targetTab === 'tab-stats') {
          checkAndApplyDailyReset();
          renderStatistics();
        } else if (targetTab === 'tab-students') {
          renderStudentsTable();
        }
      });
    });
  }

  // ═══ تحديث المستويات بناء على السلك المختار ═══
  function initCycleAndLevels() {
    const cycleSelect = document.getElementById('educationCycle');
    const levelSelect = document.getElementById('levelGrade');

    function populateLevels(cycle) {
      levelSelect.innerHTML = '<option value="">-- اختر المستوى الرسمي --</option>';
      if (!cycle || !OFFICIAL_STRUCTURE[cycle]) {
        levelSelect.disabled = true;
        return;
      }
      levelSelect.disabled = false;
      OFFICIAL_STRUCTURE[cycle].forEach(lvl => {
        const opt = document.createElement('option');
        opt.value = lvl;
        opt.textContent = lvl;
        levelSelect.appendChild(opt);
      });
    }

    cycleSelect.addEventListener('change', (e) => {
      populateLevels(e.target.value);
    });
  }

  // ═══ نظام البحث التلقائي الذكي والإضافة اليدوية للتلاميذ ═══
  function initStudentAutocomplete() {
    const searchInput = document.getElementById('studentSearchInput');
    const dropdown = document.getElementById('studentSuggestionsDropdown');
    const addManualBtn = document.getElementById('btnAddManualStudent');
    const container = document.getElementById('selectedStudentsContainer');
    const chipsList = document.getElementById('selectedStudentsChipsList');
    const countBadge = document.getElementById('selectedStudentsCountBadge');
    const clearAllBtn = document.getElementById('btnClearAllStudents');

    function normalizeText(txt) {
      return (txt || '')
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .trim();
    }

    // رسم شارات التلاميذ المحددين
    function renderSelectedStudents() {
      if (countBadge) countBadge.textContent = `🎓 التلاميذ المعنيون بالإحالة (${state.selectedStudents.length})`;
      if (state.selectedStudents.length === 0) {
        if (chipsList) chipsList.replaceChildren();
        if (container) container.style.display = 'none';
        validateActionButtons();
        return;
      }

      if (container) container.style.display = 'block';
      if (countBadge) {
        countBadge.textContent = `🎓 التلاميذ المعنيون بالإحالة (${state.selectedStudents.length})`;
      }

      if (chipsList) {
        chipsList.innerHTML = state.selectedStudents.map((s, idx) => `
          <div class="student-chip-card" data-idx="${idx}">
            <div class="student-chip-num">${idx + 1}</div>
            <div class="student-chip-details">
              <span class="student-chip-name">${escapeHtml(s.name)}</span>
              <span class="student-chip-id">مسار: ${escapeHtml(s.id || '—')}</span>
            </div>
            <button type="button" class="student-chip-remove" onclick="window.removeStudentFromReport(${idx})" title="إزالة">✕ إزالة</button>
          </div>
        `).join('');
      }

      validateActionButtons();
    }

    window.removeStudentFromReport = function (idx) {
      discardPreparedImage();
      state.selectedStudents.splice(idx, 1);
      renderSelectedStudents();
    };

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        discardPreparedImage();
        state.selectedStudents = [];
        renderSelectedStudents();
      });
    }

    function addStudent(student) {
      discardPreparedImage();

      // تجنب التكرار
      const exists = state.selectedStudents.some(s => 
        (s.id && student.id && s.id !== '—' && s.id === student.id) || 
        ((!s.id || s.id === '—' || !student.id || student.id === '—') && s.name.trim() === student.name.trim())
      );

      if (exists) {
        alert('⚠️ هذا التلميذ مضاف بالفعل إلى قائمة التقرير.');
        searchInput.value = '';
        dropdown.style.display = 'none';
        return;
      }

      state.selectedStudents.push(student);
      dropdown.style.display = 'none';
      searchInput.value = '';

      if (state.selectedStudents.length === 1) {
        const match = resolveOfficialLevel(student.level);
        if (match) {
          const cycleSelect = document.getElementById('educationCycle');
          cycleSelect.value = match.cycle;
          cycleSelect.dispatchEvent(new Event('change'));
          document.getElementById('levelGrade').value = match.level;
        }
        if (student.division) document.getElementById('divisionNumber').value = student.division;
      }

      renderSelectedStudents();
    }

    function addManualStudentFromInput() {
      const rawText = searchInput ? searchInput.value.trim() : '';
      if (!rawText) {
        alert('⚠️ يُرجى كتابة اسم التلميذ في الخانة أولاً لإضافته.');
        if (searchInput) searchInput.focus();
        return;
      }
      const currentCycle = document.getElementById('educationCycle')?.value || '';
      const currentLevel = document.getElementById('levelGrade')?.value || '';
      const currentDiv = document.getElementById('divisionNumber')?.value?.trim() || '1';

      addStudent({
        name: rawText,
        id: '—',
        cycle: currentCycle,
        level: currentLevel,
        division: currentDiv
      });
    }

    // زر الإضافة اليدوية المباشرة للتلميذ
    if (addManualBtn) {
      addManualBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addManualStudentFromInput();
      });
    }

    // الاستماع لحقل البحث مع إبراز اسم التلميذ بوضوح أعلى من رقم مسار
    searchInput.addEventListener('input', (e) => {
      const rawQuery = e.target.value;
      const q = normalizeText(rawQuery);
      if (q.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      const matches = state.students.filter(s => {
        const nameMatch = normalizeText(s.name).includes(q);
        const idMatch = (s.id || '').toLowerCase().includes(q.toLowerCase());
        return nameMatch || idMatch;
      }).slice(0, 8);

      let html = '';

      if (matches.length > 0) {
        html += matches.map(s => `
          <div class="suggestion-item" data-id="${escapeHtml(s.id)}">
            <div style="flex: 1;">
              <div class="suggestion-student-name">${escapeHtml(s.name)}</div>
              <div class="suggestion-details">
                <span>${escapeHtml(s.level || '')}</span>
                <span>• القسم: <strong>${escapeHtml(s.division || '—')}</strong></span>
                <span class="suggestion-massar-code">مسار: ${escapeHtml(s.id || '—')}</span>
              </div>
            </div>
            <span class="suggestion-pick-badge">اختيار ↵</span>
          </div>
        `).join('');

        // خيار إضافي بالأسفل لإضافة الاسم يدوياً حتى مع وجود اقتراحات
        html += `
          <div class="suggestion-manual-item" id="suggestionManualAddBtn">
            <div style="font-weight: 700; color: #1e293b; font-size: 0.92rem;">
              ➕ إضافة <strong>«${escapeHtml(rawQuery.trim())}»</strong> كتلميذ غير مسجل باللائحة
            </div>
            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
              اضغط هنا أو اضغط زر «إضافة التلميذ» لإدراجه مباشرة بالتقرير
            </div>
          </div>
        `;
      } else {
        // لا توجد نتائج: إمكانية الإضافة اليدوية الفورية
        html = `
          <div class="suggestion-manual-item" id="suggestionManualAddBtn">
            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">
              ➕ غير مسجل باللائحة: اضغط لإضافة <strong>«${escapeHtml(rawQuery.trim())}»</strong> يدوياً
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 3px;">
              يمكنك الضغط هنا أو مفتاح «Enter» أو زر «إضافة التلميذ» لإدراجه مباشرة في التقرير.
            </div>
          </div>
        `;
      }

      dropdown.innerHTML = html;
      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const sid = item.getAttribute('data-id');
          const student = state.students.find(x => x.id === sid);
          if (student) addStudent(student);
        });
      });

      const manualAddEl = dropdown.querySelector('#suggestionManualAddBtn');
      if (manualAddEl) {
        manualAddEl.addEventListener('click', () => {
          addManualStudentFromInput();
        });
      }
    });

    // الضغط على Enter في مربع البحث يضيف التلميذ فوراً
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = normalizeText(searchInput.value);
        const exact = state.students.filter(student => normalizeText(student.id) === query || normalizeText(student.name) === query);
        if (exact.length === 1) addStudent(exact[0]);
        else addManualStudentFromInput();
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && !(addManualBtn && addManualBtn.contains(e.target))) {
        dropdown.style.display = 'none';
      }
    });

    window.addStudentToReport = addStudent;
    window.renderSelectedStudents = renderSelectedStudents;
  }

  // ═══ إدارة شارات المخالفات المتعددة ═══
  function initInfractionChips() {
    const chips = document.querySelectorAll('.infraction-chip');
    chips.forEach(chip => {
      chip.setAttribute('role', 'checkbox');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-checked', 'false');
      chip.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chip.click(); }
      });
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-val');
        if (state.selectedInfractions.has(val)) {
          state.selectedInfractions.delete(val);
          chip.classList.remove('selected');
        } else {
          state.selectedInfractions.add(val);
          chip.classList.add('selected');
        }
        chip.setAttribute('aria-checked', String(state.selectedInfractions.has(val)));
        validateActionButtons();
      });
    });
  }

  // ═══ التحقق من صحة المادة المُدرَّسة (ودعم المادة المخصصة مادة أخرى…) ═══
  function getResolvedSubject() {
    const subjectSelect = document.getElementById('subjectTaught');
    const customSubjectInput = document.getElementById('customSubject');
    if (!subjectSelect) return 'عام';

    if (subjectSelect.value === 'مادة أخرى…') {
      const customVal = customSubjectInput ? customSubjectInput.value.trim() : '';
      return customVal || 'مادة مخصصة';
    }
    return subjectSelect.value || 'عام';
  }

  function validateCustomSubject() {
    const subjectSelect = document.getElementById('subjectTaught');
    const customSubjectInput = document.getElementById('customSubject');
    const customSubjectError = document.getElementById('customSubjectError');

    if (!subjectSelect || !subjectSelect.value) {
      alert('⚠️ يُرجى اختيار المادة المُدرَّسة للمتابعة.');
      if (subjectSelect) subjectSelect.focus();
      return false;
    }

    if (subjectSelect.value === 'مادة أخرى…') {
      const val = customSubjectInput ? customSubjectInput.value.trim() : '';
      if (!val) {
        if (customSubjectInput) {
          customSubjectInput.classList.add('input-error');
          customSubjectInput.focus();
        }
        if (customSubjectError) {
          customSubjectError.textContent = '⚠️ يُرجى كتابة اسم المادة المُدرَّسة في الخانة المخصصة للمتابعة.';
          customSubjectError.style.display = 'block';
        }
        alert('⚠️ يُرجى كتابة اسم المادة المُدرَّسة في الخانة المخصصة للمتابعة.');
        return false;
      }
      if (customSubjectInput) customSubjectInput.classList.remove('input-error');
      if (customSubjectError) {
        customSubjectError.style.display = 'none';
        customSubjectError.textContent = '';
      }
    }
    return true;
  }

  // ═══ التحقق الذكي والشامل قبل الإرسال أو التحميل ═══
  function ensureStudentAndInfractions() {
    checkAndApplyDailyReset();
    // 1. التحقق من كتابة اسم الأستاذ(ة) (إلزامي بدون قيمة مسبقة)
    const teacherNameInput = document.getElementById('teacherName');
    const teacherName = teacherNameInput ? teacherNameInput.value.trim() : '';
    if (!teacherName) {
      alert('⚠️ يُرجى كتابة اسم الأستاذ(ة) في الخانة المخصصة للمتابعة.');
      if (teacherNameInput) {
        teacherNameInput.focus();
        teacherNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    // 2. التحقق من المادة المُدرَّسة والمادة المخصصة
    if (!validateCustomSubject()) {
      return false;
    }

    // 3. التحقق من التلميذ المعني بالإحالة أو إدراجه تلقائياً إن كان مكتوباً في خانة البحث
    const searchInput = document.getElementById('studentSearchInput');
    const writtenName = searchInput ? searchInput.value.trim() : '';

    if (writtenName) {
      const currentCycle = document.getElementById('educationCycle')?.value || '';
      const currentLevel = document.getElementById('levelGrade')?.value || '';
      const currentDiv = document.getElementById('divisionNumber')?.value?.trim() || '1';
      window.addStudentToReport({ name: writtenName, id: '—', cycle: currentCycle, level: currentLevel, division: currentDiv });
      searchInput.value = '';
      if (window.renderSelectedStudents) window.renderSelectedStudents();
    }

    if (state.selectedStudents.length === 0) {
      alert('⚠️ يرجى كتابة أو اختيار اسم تلميذ واحد على الأقل معني بالإحالة.');
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    // 4. التحقق من تحديد مخالفة واحدة على الأقل
    if (state.selectedInfractions.size === 0) {
      alert('⚠️ يرجى تحديد مخالفة واحدة على الأقل من القائمة بنقرة واحدة.');
      const infractionsGrid = document.querySelector('.infractions-grid');
      if (infractionsGrid) {
        infractionsGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  }

  // ═══ تفعيل/تحديث حالة الأزرار (مرنة وتفاعلية دائماً) ═══
  function validateActionButtons() {
    const btnWhatsApp = document.getElementById('btnSendWhatsApp');
    const btnPDF = document.getElementById('btnDownloadPDF');
    if (btnWhatsApp) btnWhatsApp.disabled = false;
    if (btnPDF) btnPDF.disabled = false;
  }

  // ═══ إدارة واسترجاع بيانات الأستاذ والمادة (مع دعم المادة المخصصة واسم الأستاذ كـ Placeholder) ═══
  function initTeacherCache() {
    const teacherNameInput = document.getElementById('teacherName');
    const subjectSelect = document.getElementById('subjectTaught');
    const customSubjectGroup = document.getElementById('customSubjectGroup');
    const customSubjectInput = document.getElementById('customSubject');
    const customSubjectError = document.getElementById('customSubjectError');

    // استرجاع البيانات المحفوظة
    const saved = storage.getItem(STORAGE_KEYS.TEACHER);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        teacherNameInput.value = ''; // Each session starts with an empty teacher field.

        // استرجاع المادة
        if (data.subject) {
          if (data.subject === 'مادة أخرى…') {
            subjectSelect.value = 'مادة أخرى…';
            if (customSubjectGroup) customSubjectGroup.style.display = 'block';
            if (customSubjectInput && data.customSubject) {
              customSubjectInput.value = data.customSubject;
            }
          } else {
            const options = Array.from(subjectSelect.options).map(o => o.value);
            if (options.includes(data.subject)) {
              subjectSelect.value = data.subject;
            } else if (data.subject.trim()) {
              subjectSelect.value = 'مادة أخرى…';
              if (customSubjectGroup) customSubjectGroup.style.display = 'block';
              if (customSubjectInput) customSubjectInput.value = data.subject;
            }
          }
        }
      } catch (e) {
        teacherNameInput.value = '';
      }
    } else {
      teacherNameInput.value = '';
    }

    if (customSubjectInput) customSubjectInput.required = subjectSelect.value === 'مادة أخرى…';
    function handleSubjectChange() {
      if (customSubjectInput) customSubjectInput.required = subjectSelect.value === 'مادة أخرى…';
      if (subjectSelect.value === 'مادة أخرى…') {
        if (customSubjectGroup) customSubjectGroup.style.display = 'block';
        if (customSubjectInput) {
          customSubjectInput.focus();
        }
      } else {
        if (customSubjectGroup) customSubjectGroup.style.display = 'none';
        if (customSubjectInput) {
          customSubjectInput.value = '';
          customSubjectInput.classList.remove('input-error');
        }
        if (customSubjectError) {
          customSubjectError.style.display = 'none';
          customSubjectError.textContent = '';
        }
      }
      saveTeacherCache();
    }

    function saveTeacherCache() {
      const customVal = customSubjectInput ? customSubjectInput.value.trim() : '';
      const isCustom = subjectSelect.value === 'مادة أخرى…';
      const data = {
        subject: subjectSelect.value,
        customSubject: isCustom ? customVal : ''
      };
      storage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(data));
    }

    teacherNameInput.addEventListener('input', () => {
      discardPreparedImage();
      saveTeacherCache();
    });
    teacherNameInput.addEventListener('change', saveTeacherCache);

    subjectSelect.addEventListener('change', () => {
      discardPreparedImage();
      handleSubjectChange();
    });

    if (customSubjectInput) {
      customSubjectInput.addEventListener('input', () => {
        discardPreparedImage();
        if (customSubjectInput.value.trim().length > 0) {
          customSubjectInput.classList.remove('input-error');
          if (customSubjectError) {
            customSubjectError.style.display = 'none';
            customSubjectError.textContent = '';
          }
        }
        saveTeacherCache();
      });
      customSubjectInput.addEventListener('change', saveTeacherCache);
    }
  }

  // ═══ ضبط التاريخ والوقت التلقائي ═══
  function initDateTimeDefaults() {
    const dateInput = document.getElementById('incidentDate');
    const timeInput = document.getElementById('incidentTime');

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;

    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    if (timeInput) timeInput.value = `${hh}:${min}`;
  }

  // ═══ توليد وحفظ تقرير جديد (دعم الإحالة الجماعية والمادة المخصصة) ═══
  function getFormData() {
    const teacher = document.getElementById('teacherName').value.trim() || 'الأستاذ(ة)';
    const subject = getResolvedSubject();
    const date = document.getElementById('incidentDate').value || new Date().toISOString().split('T')[0];
    const time = document.getElementById('incidentTime').value || '';
    const cycle = document.getElementById('educationCycle').value || '';
    const level = document.getElementById('levelGrade').value || '';
    const division = document.getElementById('divisionNumber').value.trim() || '1';
    const classroom = document.getElementById('classroom').value.trim();
    const notes = document.getElementById('additionalNotes').value.trim();
    const infractions = Array.from(state.selectedInfractions);
    const students = state.selectedStudents.map(s => ({ ...s }));

    return {
      id: 'REP_' + Date.now(),
      createdAt: new Date().toISOString(),
      date,
      time,
      teacher,
      subject,
      cycle,
      level,
      division,
      classroom,
      students,
      student: students[0] || { name: '—', id: '—' }, // توافق عكسي
      infractions,
      notes
    };
  }

  function saveReportToHistory(report) {
    checkAndApplyDailyReset();
    if (getCurrentDailyCycleKey(new Date(report.createdAt)) !== getCurrentDailyCycleKey()) return;
    if (state.reports.some(item => item.id === report.id)) return;
    state.reports.unshift(report);
    storage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(state.reports));
    updateStatsBadges();
  }

  // One rendering pipeline for PNG, PDF and history downloads.
  let exportBusy = false;
  let preparedImage = null;
  let imageUrl = null;
  let sharing = false;
  let formRevision = 0;

  function exportStatus(message, error = false) {
    const status = document.getElementById('exportStatus');
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function safeFilename(value) {
    return String(value || 'eleve').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, '_').slice(0, 70);
  }

  function pdfOptions(report) {
    const students = report.students && report.students.length > 0 ? report.students : [report.student];
    const baseName = students.length > 1 
      ? `${safeFilename(students[0]?.name)}_وآخرون`
      : safeFilename(students[0]?.name);

    return {
      margin: 0,
      filename: `Rapport_GS_MonEcole_${baseName}_${safeFilename(report.date)}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, allowTaint: false, letterRendering: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' },
      pagebreak: { mode: ['css'] }
    };
  }

  async function renderOfficialReport(report, format) {
    if (!window.html2pdf) throw new Error('مكتبة إنشاء الوثائق غير متوفرة. يرجى إعادة تحميل الصفحة.');
    const template = document.getElementById('pdfA5Container');
    const sheet = template.querySelector('.a5-official-sheet');
    
    const students = report.students && report.students.length > 0 ? report.students : [report.student || { name: '—', id: '—' }];
    
    // تعبئة جدول التلاميذ ديناميكياً
    const studentsTableBody = document.getElementById('pdfStudentsTableBody');
    if (studentsTableBody) {
      if (students.length === 1) {
        studentsTableBody.innerHTML = `
          <tr><th>التلميذ(ة)</th><td colspan="3"><strong id="pdfStudentName">${escapeHtml(students[0].name)}</strong></td></tr>
          <tr><th>رقم مسار</th><td id="pdfMassarId" dir="ltr">${escapeHtml(students[0].id || '—')}</td><th>القسم</th><td id="pdfDivision">${escapeHtml(report.division || '—')}</td></tr>
          <tr><th>المستوى الدراسي</th><td colspan="3" id="pdfLevel">${escapeHtml(cleanLevel(report.level))}</td></tr>
        `;
      } else {
        let rows = `<tr><th>التلاميذ المعنيون (${students.length})</th><td colspan="3" style="padding:1.5mm 2.5mm;">`;
        rows += students.map((s, idx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:7.5pt; padding:0.8mm 0; border-bottom:1px dotted #e2e8f0;">
            <span><strong>${idx + 1}. ${escapeHtml(s.name)}</strong>${((resolveOfficialLevel(s.level)?.level || s.level) === report.level && s.division === report.division) ? '' : `<br><small>${escapeHtml(s.level || report.level)} — ${escapeHtml(s.division || report.division)}</small>`}</span>
            <span dir="ltr" style="font-family:monospace; color:#334155; font-size:7pt;">مسار: ${escapeHtml(s.id || '—')}</span>
          </div>
        `).join('');
        rows += `</td></tr>`;
        rows += `<tr><th>القسم</th><td id="pdfDivision">${escapeHtml(report.division || '—')}</td><th>المستوى الدراسي</th><td id="pdfLevel">${escapeHtml(cleanLevel(report.level))}</td></tr>`;
        studentsTableBody.innerHTML = rows;
      }
    }

    const fields = {
      pdfSchoolName: INSTITUTION.schoolName, pdfDirectorate: INSTITUTION.directorate,
      pdfAcademy: INSTITUTION.academy, pdfTeacher: report.teacher || '—',
      pdfSubject: report.subject || '—', pdfDate: report.date || '—', pdfTime: report.time || '—',
      pdfClassroom: report.classroom || '—', pdfNotes: report.notes || 'لا توجد ملاحظات إضافية.'
    };
    Object.entries(fields).forEach(([id, value]) => { 
      const el = document.getElementById(id);
      if (el) el.textContent = value; 
    });

    document.getElementById('pdfInfractionsList').replaceChildren(...(report.infractions || []).map(value => {
      const li = document.createElement('li');
      li.textContent = value;
      return li;
    }));

    template.classList.add('pdf-rendering');
    sheet.classList.remove('a5-compact');
    try {
      // ═══ تأمين الشعارات: ضمان استبدال الصور بنسخ Base64 قبل تصيير Canvas ═══
      applyOfficialLogos();
      await document.fonts.ready;
      await Promise.all([...template.querySelectorAll('img')].map(img => img.decode()));
      const fits = () => {
        const bottom = sheet.getBoundingClientRect().bottom - parseFloat(getComputedStyle(sheet).paddingBottom);
        return sheet.querySelector('.a5-sheet-footer').getBoundingClientRect().bottom <= bottom + 1 && sheet.scrollHeight <= sheet.clientHeight + 1;
      };
      if (!fits()) sheet.classList.add('a5-compact');
      if (!fits()) throw new Error('النص أطول من مساحة بطاقة A5. يرجى اختصار الملاحظات أو البيانات المطولة؛ لن يتم حذف أي جزء منها.');
      const worker = window.html2pdf().set(pdfOptions(report)).from(sheet);
      if (format === 'png') {
        const canvas = await worker.toCanvas().get('canvas');
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(value => value ? resolve(value) : reject(new Error('تعذر إنشاء صورة البطاقة.')), 'image/png');
        });
        return new File([blob], 'Rapport_GS_Mon_Ecole.png', { type: 'image/png' });
      }
      const pdfWorker = worker.toPdf();
      const pdf = await pdfWorker.get('pdf');
      if (pdf.internal.getNumberOfPages() !== 1) throw new Error('تعذر احتواء البطاقة في صفحة A5 واحدة. يرجى اختصار الملاحظات.');
      await pdfWorker.save();
    } finally {
      template.classList.remove('pdf-rendering');
      sheet.classList.remove('a5-compact');
    }
  }

  function startExport(button) {
    if (exportBusy) {
      exportStatus('جارٍ إعداد الوثيقة الحالية، يرجى الانتظار لحظات ثم المحاولة.');
      return false;
    }
    exportBusy = true;
    button.setAttribute('aria-busy', 'true');
    exportStatus('جارٍ إعداد البطاقة الرسمية عالية الدقة…');
    return true;
  }

  function finishExport(button) {
    exportBusy = false;
    button.removeAttribute('aria-busy');
  }

  function rememberExport(report) {
    if (state.reports.some(item => item.id === report.id)) return;
    try { saveReportToHistory(report); }
    catch (error) { console.warn('Document ready; history could not be persisted', error); }
  }

  function shareMessage(report) {
    const students = report.students && report.students.length > 0 ? report.students : [report.student || { name: '—', id: '—' }];
    let studentsText = '';
    if (students.length === 1) {
      studentsText = `🎓 *التلميذ(ة) :* ${students[0].name} (مسار: ${students[0].id || '—'})`;
    } else {
      studentsText = `🎓 *التلاميذ المعنيون بالإحالة المشتركة (${students.length}) :*\n` +
        students.map((s, i) => `${i + 1}. ${s.name} (مسار: ${s.id || '—'})`).join('\n');
    }

    return `📋 *إشعار بإحالة تربوية — الحراسة العامة*\n` +
      `🏫 *${INSTITUTION.schoolName}*\n` +
      `🏛️ *${INSTITUTION.directorate}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 *الأستاذ(ة) المكلف(ة) :* ${report.teacher}\n` +
      `📚 *المادة المدرسة :* ${report.subject}\n` +
      `📅 *التاريخ والتوقيت :* ${report.date} (الحصة: ${report.time})\n` +
      `🏫 *المستوى والقسم :* ${report.level} — القسم: ${report.division}\n` +
      (report.classroom ? `📍 *قاعة الدرس :* ${report.classroom}\n` : '') +
      `${studentsText}\n` +
      `⚠️ *طبيعة المخالفة :*\n${(report.infractions || []).map(i => `• ${i}`).join('\n')}\n` +
      `📝 *ملاحظات :* ${report.notes || 'لا توجد'}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📌 *يرجى الاطلاع على صورة بطاقة الإحالة المرفقة.*`;
  }

  function whatsappUrl(report) {
    const phone = String(state.settings.whatsappPhone || '').replace(/[^0-9]/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(shareMessage(report))}`;
  }

  function canShareImage(file) {
    try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); }
    catch { return false; }
  }

  function copyImage(fileOrPromise) {
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) return Promise.resolve(false);
      return navigator.clipboard.write([new ClipboardItem({ 'image/png': fileOrPromise })]).then(() => true, () => false);
    } catch { return Promise.resolve(false); }
  }

  function discardPreparedImage() {
    formRevision += 1;
    preparedImage = null;
    document.getElementById('imageSharePanel').hidden = true;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = null;
    document.getElementById('downloadReadyImage').removeAttribute('href');
    document.getElementById('openWhatsAppImage').removeAttribute('href');
  }

  function showPreparedImage(file, report) {
    discardPreparedImage();
    preparedImage = { file, report };
    imageUrl = URL.createObjectURL(file);
    document.getElementById('downloadReadyImage').href = imageUrl;
    document.getElementById('openWhatsAppImage').href = whatsappUrl(report);
    document.getElementById('btnShareReadyImage').hidden = !canShareImage(file);
    document.getElementById('btnCopyReadyImage').hidden = !(navigator.clipboard?.write && window.ClipboardItem);
    document.getElementById('imageSharePanel').hidden = false;
  }

  async function sharePreparedImage() {
    if (!preparedImage || sharing) return;
    const {file, report} = preparedImage;
    sharing = true;
    try {
      // Called immediately from the ready button when activation expired during rendering.
      await navigator.share({ files: [file], title: 'تقرير إحالة تربوية', text: shareMessage(report) });
      rememberExport(report);
      exportStatus('تم تسليم الصورة إلى قائمة المشاركة. تأكد من إرسالها إلى الحراسة العامة داخل WhatsApp.');
    } catch (error) {
      exportStatus(error.name === 'AbortError'
        ? 'أُلغيت المشاركة. الصورة جاهزة ويمكن مشاركتها أو تحميلها لاحقاً.'
        : 'الصورة جاهزة. اضغط «مشاركة الصورة الجاهزة» أو حمّلها وأرفقها في WhatsApp.');
    } finally { sharing = false; }
  }

  function initWhatsAppAction() {
    const button = document.getElementById('btnSendWhatsApp');
    button.addEventListener('click', async () => {
      if (sharing || !ensureStudentAndInfractions() || !startExport(button)) return;
      const report = getFormData();
      const revision = formRevision;
      const probe = new File([''], 'Rapport_GS_Mon_Ecole.png', {type: 'image/png'});
      const nativeShare = canShareImage(probe);
      let popup = null;
      // Reserve the window during the click, before awaiting the canvas.
      if (!nativeShare) {
        popup = window.open('about:blank', '_blank');
        if (popup) popup.opener = null;
      }
      try {
        const rendering = renderOfficialReport(report, 'png');
        // Promise-valued ClipboardItem retains the original user gesture in supporting browsers.
        const copied = nativeShare ? Promise.resolve(false) : copyImage(rendering);
        const file = await rendering;
        if (revision !== formRevision) throw new Error('تغيرت بيانات الإحالة أثناء الإعداد. يرجى الضغط مجدداً لإنشاء الصورة المحدثة.');
        showPreparedImage(file, report);
        if (nativeShare && canShareImage(file)) {
          if (navigator.userActivation?.isActive !== false) await sharePreparedImage();
          else exportStatus('الصورة جاهزة. اضغط «مشاركة الصورة الجاهزة» ثم اختر WhatsApp.');
        } else {
          document.getElementById('downloadReadyImage').click();
          const didCopy = await copied;
          if (popup && !popup.closed) popup.location.replace(whatsappUrl(report));
          rememberExport(report);
          exportStatus(didCopy
            ? 'نُسخت الصورة وبدأ تنزيلها. الصقها في WhatsApp باستخدام Ctrl + V ثم أكد الإرسال.'
            : 'بدأ تنزيل الصورة. أرفق ملف Rapport_GS_Mon_Ecole.png داخل WhatsApp.');
          if (!popup || popup.closed) exportStatus('الصورة جاهزة وبدأ تنزيلها. اضغط «فتح WhatsApp» ثم ألصق الصورة أو أرفق الملف المحمّل.');
        }
      } catch (error) {
        if (popup && !popup.closed) popup.close();
        console.error('Image export failed', error);
        exportStatus(error.message || 'تعذر إنشاء الصورة. يرجى إعادة المحاولة.', true);
      } finally { finishExport(button); }
    });
    document.getElementById('btnShareReadyImage').addEventListener('click', sharePreparedImage);
    document.getElementById('btnCopyReadyImage').addEventListener('click', async () => {
      if (!preparedImage) return;
      const copied = await copyImage(preparedImage.file);
      exportStatus(copied ? 'نُسخت الصورة. الصقها داخل WhatsApp باستخدام Ctrl + V.' : 'تعذر نسخ الصورة. استخدم «تحميل الصورة PNG» ثم أرفقها بالمحادثة.');
    });
    document.getElementById('downloadReadyImage').addEventListener('click', () => {
      if (preparedImage) rememberExport(preparedImage.report);
    });
    // Never offer a previous student's image after the teacher edits a field.
    document.getElementById('tab-form').addEventListener('input', discardPreparedImage);
    document.getElementById('tab-form').addEventListener('change', discardPreparedImage);
    document.querySelectorAll('.infraction-chip, #btnClearStudent, #btnResetReport').forEach(el => el.addEventListener('click', discardPreparedImage));
  }

  async function downloadPdf(report, remember = true) {
    const button = document.getElementById('btnDownloadPDF');
    if (!startExport(button)) return;
    try {
      await renderOfficialReport(report, 'pdf');
      if (remember) rememberExport(report);
      exportStatus('تم إعداد بطاقة الإحالة الرسمية في صفحة A5 واحدة وبدء تنزيلها.');
    } catch (error) {
      console.error('A5 export failed', error);
      exportStatus(error.message || 'تعذر إنشاء PDF. يرجى إعادة المحاولة.', true);
      // The error remains visible even when downloading from the history tab.
      if (!document.getElementById('tab-form').classList.contains('active')) alert(error.message);
    } finally { finishExport(button); }
  }

  function initPdfAction() {
    document.getElementById('btnDownloadPDF').addEventListener('click', () => {
      if (ensureStudentAndInfractions()) downloadPdf(getFormData());
    });
  }

  // ═══ لوحة الإحصائيات (Charts & Statistics) ═══
  function renderStatistics() {
    const totalCountEl = document.getElementById('statTotalToday');
    const topTypeEl = document.getElementById('statTopInfraction');
    const topDivEl = document.getElementById('statTopDivision');
    const totalAllEl = document.getElementById('statTotalAll');

    const todayReports = state.reports;

    totalCountEl.textContent = todayReports.length;
    totalAllEl.textContent = state.reports.length;

    // حساب تكرار المخالفات
    const infractionsCount = {};
    state.reports.forEach(r => {
      (r.infractions || []).forEach(inf => {
        infractionsCount[inf] = (infractionsCount[inf] || 0) + 1;
      });
    });

    let topInf = '—';
    let maxInfCount = 0;
    for (let k in infractionsCount) {
      if (infractionsCount[k] > maxInfCount) {
        maxInfCount = infractionsCount[k];
        topInf = k;
      }
    }
    topTypeEl.textContent = topInf.length > 20 ? topInf.substring(0, 20) + '...' : topInf;

    // حساب تكرار الأقسام
    const divCount = {};
    state.reports.forEach(r => {
      const key = `${r.level || ''} (${r.division || '1'})`;
      divCount[key] = (divCount[key] || 0) + 1;
    });

    let topDiv = '—';
    let maxDivCount = 0;
    for (let k in divCount) {
      if (divCount[k] > maxDivCount) {
        maxDivCount = divCount[k];
        topDiv = k;
      }
    }
    topDivEl.textContent = topDiv.length > 18 ? topDiv.substring(0, 18) + '...' : topDiv;

    // رسم Donut Chart للمخالفات
    const ctxTypes = document.getElementById('chartInfractionTypes');
    if (ctxTypes && window.Chart) {
      if (state.charts.types) state.charts.types.destroy();

      const labels = Object.keys(infractionsCount);
      const data = Object.values(infractionsCount);

      state.charts.types = new Chart(ctxTypes, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['لا توجد تقارير بعد'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: [
              '#ea580c', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6',
              '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#64748b'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Cairo' } } }
          }
        }
      });
    }

    // رسم Bar Chart للأقسام
    const ctxDivs = document.getElementById('chartDivisions');
    if (ctxDivs && window.Chart) {
      if (state.charts.divisions) state.charts.divisions.destroy();

      const divLabels = Object.keys(divCount).sort((a, b) => divCount[b] - divCount[a]).slice(0, 6);
      const divData = divLabels.map(k => divCount[k]);

      state.charts.divisions = new Chart(ctxDivs, {
        type: 'bar',
        data: {
          labels: divLabels.length ? divLabels : ['لا بيانات'],
          datasets: [{
            label: 'عدد الإحالات',
            data: divData.length ? divData : [0],
            backgroundColor: '#1e293b',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Cairo' } } },
            x: { ticks: { font: { family: 'Cairo' } } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // تعبئة جدول آخر التقارير
    const tbody = document.getElementById('recentReportsTableBody');
    if (tbody) {
      if (state.reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px;">لم يتم تسجيل أي إحالة تربوية بعد</td></tr>';
      } else {
        tbody.innerHTML = state.reports.slice(0, 10).map((r, idx) => {
          const students = r.students && r.students.length > 0 ? r.students : [r.student || { name: '—', id: '—' }];
          const namesStr = students.map(s => s.name).join('، ');
          const idsStr = students.map(s => s.id || '—').join(' | ');

          return `
            <tr>
              <td><strong>${escapeHtml(namesStr)}</strong></td>
              <td><span style="font-family:monospace; background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:0.8rem;">${escapeHtml(idsStr)}</span></td>
              <td>${escapeHtml(r.level || '')} (${escapeHtml(r.division || '—')})</td>
              <td>${escapeHtml((r.infractions || []).join('، '))}</td>
              <td>${escapeHtml(r.date)} ${escapeHtml(r.time)}</td>
              <td>
                <button class="btn-clear-selection" data-report-index="${idx}" title="تحميل">📥 PDF</button>
              </td>
            </tr>
          `;
        }).join('');
        tbody.querySelectorAll('[data-report-index]').forEach(button => button.addEventListener('click', () => downloadPdf(state.reports[Number(button.dataset.reportIndex)], false)));
      }
    }
  }

  window.reDownloadReport = function (repId) {
    const report = state.reports.find(item => item.id === repId);
    if (report) downloadPdf(report, false);
  };

  function updateStatsBadges() {
    const countBadge = document.getElementById('tabStatsCountBadge');
    if (countBadge) countBadge.textContent = state.reports.length;
  }

  // ═══ إدارة لوائح مسار Excel (SheetJS) ═══
  function initMassarImport() {
    const fileInput = document.getElementById('excelFileInput');
    const importBtn = document.getElementById('btnTriggerUpload');
    const statusMsg = document.getElementById('importStatusMsg');

    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        statusMsg.textContent = 'جارٍ معالجة وتفريغ لائحة مسار...';
        statusMsg.style.color = '#1e293b';

        const reader = new FileReader();
        reader.onload = function (evt) {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // استخراج ذكي للأعمدة
            let massarIdx = -1, nameIdx = -1, levelIdx = -1, divIdx = -1, headerRow = -1, firstNameIdx = -1;

            for (let r = 0; r < Math.min(rows.length, 10); r++) {
              const row = rows[r] || [];
              row.forEach((cell, idx) => {
                const txt = String(cell || '').trim();
                if (/مسار|Code|Massar/i.test(txt)) massarIdx = idx;
                if (/Prénom|prenom|الاسم الشخصي/i.test(txt)) firstNameIdx = idx;
                else if (/الاسم|Nom|التلميذ/i.test(txt)) nameIdx = idx;
                if (/المستوى|Niveau/i.test(txt)) levelIdx = idx;
                if (/القسم|Classe|Division/i.test(txt)) divIdx = idx;
              });
              if (massarIdx !== -1 && nameIdx !== -1) { headerRow = r; break; }
            }

            // افتراض تلقائي في حال غياب الترويسة
            if (massarIdx === -1) massarIdx = 0;
            if (nameIdx === -1) nameIdx = 1;

            let importedCount = 0;
            const newStudents = [];

            for (let i = headerRow + 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || !row[nameIdx]) continue;

              const id = String(row[massarIdx] || '').trim();
              const name = [row[nameIdx], firstNameIdx >= 0 ? row[firstNameIdx] : ''].filter(Boolean).join(' ').trim();
              const level = levelIdx !== -1 && row[levelIdx] ? String(row[levelIdx]).trim() : '';
              const division = divIdx !== -1 && row[divIdx] ? String(row[divIdx]).trim() : '1';

              if (name.length > 0) {
                newStudents.push({ id, name, level: cleanLevel(level), division });
                importedCount++;
              }
            }

            if (importedCount > 0) {
              const merged = [...state.students];
              newStudents.forEach(student => {
                const index = merged.findIndex(existing => student.id ? existing.id === student.id : !existing.id && existing.name === student.name && existing.division === student.division);
                if (index >= 0) merged[index] = student;
                else merged.push(student);
              });
              if (!storage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(merged))) throw new Error('Local storage unavailable');
              state.students = merged;
              statusMsg.textContent = `✅ تم استيراد وتحديث ${importedCount} تلميذ(ة) بنجاح من مسار!`;
              statusMsg.style.color = '#15803d';
              renderStudentsTable();
            } else {
              statusMsg.textContent = '❌ تعذر العثور على بيانات صالحة في الملف، تأكد من الصيغة.';
              statusMsg.style.color = '#b91c1c';
            }
          } catch (err) {
            console.error(err);
            statusMsg.textContent = '❌ حدث خطأ أثناء قراءة ملف Excel.';
            statusMsg.style.color = '#b91c1c';
          }
        };
        reader.onerror = () => { statusMsg.textContent = 'تعذر قراءة الملف. يرجى إعادة المحاولة.'; };
        reader.readAsArrayBuffer(file);
        fileInput.value = '';
      });
    }

    // إضافة تلميذ يدوياً
    const formAdd = document.getElementById('formAddStudent');
    if (formAdd) {
      formAdd.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('newStudentId').value.trim();
        const name = document.getElementById('newStudentName').value.trim();
        const level = document.getElementById('newStudentLevel').value;
        const division = document.getElementById('newStudentDiv').value.trim();

        if (!id || !name) return;

        if (state.students.some(student => student.id === id)) { alert('رقم مسار مسجل بالفعل.'); return; }
        const next = [{ id, name, level: cleanLevel(level), division }, ...state.students];
        try { if (!storage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next))) throw new Error('Local storage unavailable'); }
        catch { alert('تعذر حفظ اللائحة على هذا الجهاز. يرجى التأكد من توفر مساحة التخزين.'); return; }
        state.students = next;
        formAdd.reset();
        renderStudentsTable();
        alert('تمت إضافة التلميذ(ة) بنجاح.');
      });
    }
  }

  function renderStudentsTable() {
    const countEl = document.getElementById('studentsListCount');
    const tbody = document.getElementById('studentsTableBody');
    if (countEl) countEl.textContent = state.students.length;

    if (tbody) {
      if (state.students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">لا يوجد تلاميذ مسجلون حالياً</td></tr>';
      } else {
        tbody.innerHTML = state.students.slice(0, 50).map((s, index) => `
          <tr>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td><span style="font-family:monospace; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(s.id)}</span></td>
            <td>${escapeHtml(s.level || '—')}</td>
            <td>${escapeHtml(s.division || '—')}</td>
            <td>
              <button class="btn-clear-selection" onclick="window.deleteStudent('${escapeHtml(s.id)}')">حذف</button>
            </td>
          </tr>
        `).join('');
        tbody.querySelectorAll('[data-student-index]').forEach(button => button.addEventListener('click', () => window.deleteStudent(Number(button.dataset.studentIndex))));
      }
    }
  }

  window.deleteStudent = function (index) {
    if (!confirm('هل تريد حقاً حذف هذا التلميذ؟')) return;
    state.students.splice(index, 1);
    storage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(state.students));
    renderStudentsTable();
  };

  // ═══ إدارة الإعدادات ═══
  function initSettings() {
    const schoolNameInput = document.getElementById('settingSchoolName');
    const dirInput = document.getElementById('settingDirectorate');
    const acadInput = document.getElementById('settingAcademy');
    const phoneInput = document.getElementById('settingPhone');
    const form = document.getElementById('settingsForm');

    if (schoolNameInput) schoolNameInput.value = state.settings.schoolName || '';
    if (dirInput) dirInput.value = state.settings.directorate || '';
    if (acadInput) acadInput.value = state.settings.academy || '';
    if (phoneInput) phoneInput.value = state.settings.whatsappPhone || '';

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.settings.whatsappPhone = phoneInput.value.trim();
        storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
        alert('✅ تم حفظ إعدادات المؤسسة بنجاح.');
      });
    }
  }

  // ═══ زر إعادة التعيين ═══
  function initResetButton() {
    const btn = document.getElementById('btnResetReport');
    if (btn) {
      btn.addEventListener('click', () => {
        if (!confirm('هل تريد تفريغ الحقول وإلغاء التحديد؟')) return;
        state.selectedStudents = [];
        state.selectedInfractions.clear();

        if (window.renderSelectedStudents) window.renderSelectedStudents();
        document.querySelectorAll('.infraction-chip').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
        document.getElementById('additionalNotes').value = '';
        document.getElementById('studentSearchInput').value = '';
        discardPreparedImage();
        validateActionButtons();
      });
    }
  }

  // ═══ انطلاق التطبيق ═══
  applyOfficialLogos();
  document.addEventListener('DOMContentLoaded', () => {
    applyOfficialLogos(); // تطبيق الشعارات بصيغة Base64 لتفادي Tainted Canvas
    initData();
    initNavigation();
    initCycleAndLevels();
    initStudentAutocomplete();
    initInfractionChips();
    initTeacherCache();
    initDateTimeDefaults();
    initWhatsAppAction();
    initPdfAction();
    initMassarImport();
    initSettings();
    initResetButton();
    updateStatsBadges();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline installation unavailable', error));
    }

    // فحص دوري للدورة اليومية عند رأس كل 24 ساعة (07:00 صباحاً)
    scheduleDailyReset();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleDailyReset(); });
    window.addEventListener('focus', scheduleDailyReset);
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEYS.REPORTS || event.key === STORAGE_KEYS.DAILY_CYCLE) {
        checkAndApplyDailyReset();
        if (document.getElementById('tab-stats').classList.contains('active')) renderStatistics();
      }
      if (event.key === STORAGE_KEYS.STUDENTS) {
        state.students = readStoredArray(STORAGE_KEYS.STUDENTS);
        renderStudentsTable();
      }
    });
  });
})();
