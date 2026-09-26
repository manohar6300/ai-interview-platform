/* InterviewAI — Phase 3 Progression Intelligence */
(() => {
  'use strict';

  const LS = {
    state: 'interviewai_state_v1',
    interviews: 'ai_interviews',
    xp: 'ai_xp',
    level: 'ai_level',
    resume: 'resume_analyzed'
  };

  const TRACKS = ['technical', 'dsa', 'system-design', 'behavioural'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function parse(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '');
      return v ?? fallback;
    } catch {
      return fallback;
    }
  }

  function interviews() {
    const v = parse(LS.interviews, []);
    return Array.isArray(v) ? v : [];
  }

  function twin() {
    return window.InterviewAIState
      ? InterviewAIState.load().careerTwin
      : {};
  }

  function appState() {
    return window.InterviewAIState
      ? InterviewAIState.load()
      : {};
  }

  function trackOf(record) {
    const raw = String(
      record?.track ||
      record?.type ||
      ''
    ).toLowerCase();

    if (raw.includes('system')) return 'system-design';
    if (raw.includes('dsa')) return 'dsa';
    if (raw.includes('behavi')) return 'behavioural';

    return 'technical';
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function todayInterviews() {
    return interviews().filter(
      r => String(r.date || '').slice(0, 10) === today()
    );
  }

  function trackCounts() {
    const counts = Object.fromEntries(
      TRACKS.map(t => [t, 0])
    );

    interviews().forEach(r => {
      counts[trackOf(r)]++;
    });

    return counts;
  }

  function averageScore() {
    const scores = interviews()
      .map(r => Number(r.score))
      .filter(Number.isFinite);

    return scores.length
      ? Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        )
      : 0;
  }

  function aiCount() {
    return interviews().filter(
      r => r.aiStatus === 'complete' || r.ai
    ).length;
  }

  function getBadges() {
    const s = appState();
    return Array.isArray(s.badges)
      ? s.badges
      : [];
  }

  function unlockBadge(id, title, xp) {
    if (!window.InterviewAIState) return false;

    const current = getBadges();

    if (current.some(b => b.id === id)) {
      return false;
    }

    const entry = {
      id,
      title,
      unlockedAt: new Date().toISOString()
    };

    current.push(entry);

    InterviewAIState.set('badges', current);

    if (xp > 0) {
      InterviewAIState.awardXP(
        xp,
        `Badge: ${title}`
      );
    }

    localStorage.setItem(
      'ai_last_badge_unlock',
      JSON.stringify(entry)
    );

    return true;
  }

  function evaluateBadges() {
    const list = interviews();
    const counts = trackCounts();

    const resumeDone =
      localStorage.getItem(LS.resume) === 'true'
        ? 5
        : Number(
            appState()?.resume?.analysisCount || 0
          );

    const streak =
      Number(
        appState()?.progression?.streak || 0
      );

    const unlocked = [];

    // First interview
    if (list.length >= 1) {
      unlocked.push(
        unlockBadge(
          'first',
          'First Step',
          100
        )
      );
    }

    // Five interviews
    if (list.length >= 5) {
      unlocked.push(
        unlockBadge(
          'learner',
          'Interview Learner',
          250
        )
      );
    }

    // DSA
    if (counts.dsa >= 10) {
      unlocked.push(
        unlockBadge(
          'dsa',
          'DSA Explorer',
          400
        )
      );
    }

    // System Design
    if (counts['system-design'] >= 5) {
      unlocked.push(
        unlockBadge(
          'system',
          'System Thinker',
          600
        )
      );
    }

    // 25 interviews
    if (list.length >= 25) {
      unlocked.push(
        unlockBadge(
          'warrior',
          'Interview Warrior',
          1000
        )
      );
    }

    // Resume
    if (resumeDone >= 5) {
      unlocked.push(
        unlockBadge(
          'resume',
          'Resume Builder',
          300
        )
      );
    }

    // Streak
    if (streak >= 7) {
      unlocked.push(
        unlockBadge(
          'streak',
          'Consistent Learner',
          350
        )
      );
    }

    // AI evaluation
    if (aiCount() >= 3) {
      unlocked.push(
        unlockBadge(
          'hidden1',
          'AI Awakened',
          500
        )
      );
    }

    // High score
    const highScore = list.some(
      r =>
        Number(r.score) >= 90 &&
        (r.aiStatus === 'complete' || r.ai)
    );

    if (highScore) {
      unlocked.push(
        unlockBadge(
          'hidden2',
          'Elite Response',
          750
        )
      );
    }

    // Interview DNA
    const trackedSkills =
      Object.keys(
        twin()?.skillProfile || {}
      ).length;

    if (list.length >= 10 && trackedSkills >= 3) {
      unlocked.push(
        unlockBadge(
          'hidden3',
          'Interview DNA',
          900
        )
      );
    }

    return unlocked.filter(Boolean).length;
  }

  function readiness() {
    const t = twin();

    const n = Number(
      t?.readiness
    );

    return Number.isFinite(n)
      ? Math.max(
          0,
          Math.min(100, Math.round(n))
        )
      : averageScore();
  }

  function weakest() {
    const t = twin();

    const weak =
      Array.isArray(t?.weakestSkills)
        ? t.weakestSkills[0]
        : null;

    if (weak?.label) {
      return {
        name: weak.label,
        score: Number(weak.score) || 0
      };
    }

    const profile =
      Object.values(
        t?.skillProfile || {}
      );

    profile.sort(
      (a, b) =>
        (Number(a.score) || 0) -
        (Number(b.score) || 0)
    );

    if (profile[0]) {
      return {
        name:
          profile[0].label ||
          'Core Skills',
        score:
          Number(profile[0].score) || 0
      };
    }

    return {
      name: 'Interview Fundamentals',
      score: 0
    };
  }

  function missionForWeakness() {
    const w = weakest();
    const t = twin();

    const recurrent =
      Array.isArray(
        t?.recurringWeaknesses
      )
        ? t.recurringWeaknesses[0]
        : null;

    const focus =
      recurrent?.issue ||
      `Improve ${w.name}`;

    const title =
      `${w.name} Recovery Protocol`;

    return {
      title,
      focus,
      score: w.score,
      goal:
        `Raise ${w.name} above the current mastery threshold through targeted interview practice.`,
      drill:
        `Explain one concept, solve one applied problem, and defend one trade-off involving ${w.name}.`
    };
  }

  function localDrills() {
    const w = weakest();

    const map = {
      'technical accuracy':
        'Explain a web concept and identify two production edge cases.',

      'problem solving':
        'Solve a timed algorithm problem and explain complexity before coding.',

      'communication':
        'Give a 60-second structured explanation using approach → evidence → result.',

      'confidence':
        'Answer a difficult follow-up while explicitly stating assumptions.',

      'completeness':
        'Finish an answer with edge cases, trade-offs, and validation steps.',

      'sql':
        'Compare JOIN strategies and explain indexing choices for the query.',

      'dsa':
        'Solve an array or tree problem and justify time and space complexity.',

      'system design':
        'Design a scalable service and explain cache, queue, and failure trade-offs.'
    };

    const key =
      w.name.toLowerCase();

    return (
      map[key] ||
      `Targeted practice drill for ${w.name}: ${missionForWeakness().focus}`
    );
  }

  async function requestAIDrill() {
    const mission =
      missionForWeakness();

    try {
      const response = await fetch(
        '/api/training-drill',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            careerTwin: twin(),
            interviews:
              interviews().slice(0, 5),
            mission
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          'AI drill unavailable'
        );
      }

      const data =
        await response.json();

      return (
        data.drill ||
        localDrills()
      );
    } catch {
      return localDrills();
    }
  }

  function setText(el, value) {
    if (el) {
      el.textContent = value;
    }
  }

  function setupQuest() {
    const counts =
      trackCounts();

    const done =
      new Set(
        TRACKS.filter(
          t => counts[t] > 0
        )
      );

    // Guided progression
    const unlocked =
      new Set(['technical']);

    if (done.has('technical')) {
      unlocked.add('dsa');
    }

    if (done.has('dsa')) {
      unlocked.add('system-design');
    }

    if (done.has('system-design')) {
      unlocked.add('behavioural');
    }

    $$('[data-track]')
      .forEach(el => {
        const track =
          el.dataset.track;

        if (track === 'final') {
          el.dataset.locked =
            String(done.size < 4);
        } else {
          el.dataset.locked =
            String(
              !unlocked.has(track)
            );
        }
      });

    window.InterviewAIQuest = {
      getProgress() {
        return {
          completed: [...done],
          counts,
          unlocked: [...unlocked],
          total: 5,
          unlockedFinal:
            done.size === 4
        };
      }
    };
  }

  function setupQuestClicks() {
    $$('[data-track]')
      .forEach(el => {
        el.addEventListener(
          'click',
          event => {
            const track =
              el.dataset.track;

            if (
              el.dataset.locked ===
              'true'
            ) {
              event.preventDefault();

              const counts =
                trackCounts();

              if (
                track === 'final'
              ) {
                showToast(
                  `🔒 Final Boss requires all four arcs. ${
                    4 -
                    new Set(
                      TRACKS.filter(
                        t => counts[t] > 0
                      )
                    ).size
                  } arc(s) remaining.`
                );
              } else {
                showToast(
                  '🔒 Clear the previous training arc to unlock this chapter.'
                );
              }

              return;
            }

            if (
              track === 'final'
            ) {
              event.preventDefault();

              showToast(
                '⚔ Final Boss unlocked — entering the ultimate interview.'
              );

              setTimeout(() => {
                location.href =
                  'interview.html?track=technical&difficulty=Hard&boss=1';
              }, 450);
            }
          },
          true
        );
      });
  }

  function setupTrainingArena() {
    const s =
      appState();

    const total =
      interviews().length;

    const avg =
      averageScore();

    const xp =
      Number(
        s?.progression?.xp ||
        localStorage.getItem(
          LS.xp
        ) ||
        0
      );

    const level =
      Number(
        s?.progression?.level ||
        localStorage.getItem(
          LS.level
        ) ||
        1
      );

    const streak =
      Number(
        s?.progression?.streak ||
        0
      );

    // Hero stats
    const stats =
      $$('.stats .stat strong');

    if (stats[0]) {
      setText(
        stats[0],
        total
      );
    }

    if (stats[1]) {
      setText(
        stats[1],
        avg + '%'
      );
    }

    if (stats[2]) {
      setText(
        stats[2],
        streak
      );
    }

    if (stats[3]) {
      setText(
        stats[3],
        xp.toLocaleString()
      );
    }

    // XP
    const xpValue =
      $('.xp-value');

    const xpNext =
      $('.xp-next');

    const levelTarget =
      Math.max(
        120,
        level * 120
      );

    const progress =
      Math.min(
        100,
        Math.round(
          (xp % levelTarget) /
          levelTarget *
          100
        )
      );

    if (xpValue) {
      xpValue.textContent =
        `${xp.toLocaleString()} / ${levelTarget.toLocaleString()} XP`;
    }

    const fill =
      $('.track .fill');

    if (fill) {
      fill.style.width =
        progress + '%';
    }

    if (xpNext) {
      xpNext.textContent =
        `${Math.max(
          0,
          levelTarget -
            (xp % levelTarget)
        ).toLocaleString()} XP until Level ${
          level + 1
        }`;
    }

    // Skill bars
    const arenaLines =
      $$('.arena-box .arena-line');

    const scoreFor = track => {
      const vals =
        interviews()
          .filter(
            r =>
              trackOf(r) ===
              track
          )
          .map(
            r => Number(r.score)
          )
          .filter(
            Number.isFinite
          );

      return vals.length
        ? Math.round(
            vals.reduce(
              (a, b) => a + b,
              0
            ) / vals.length
          )
        : 0;
    };

    [
      [
        'Technical',
        scoreFor('technical')
      ],
      [
        'Communication',
        Number(
          twin()?.skillProfile
            ?.communication
            ?.score ||
            scoreFor(
              'behavioural'
            )
        )
      ],
      [
        'DSA',
        scoreFor('dsa')
      ]
    ].forEach(
      (item, i) => {
        if (!arenaLines[i]) {
          return;
        }

        const strong =
          $('strong',
            arenaLines[i]);

        setText(
          strong,
          item[1] + '%'
        );

        const bar =
          arenaLines[i]
            .nextElementSibling
            ?.querySelector(
              '.arena-fill'
            );

        if (bar) {
          bar.style.width =
            Math.max(
              0,
              Math.min(
                100,
                item[1]
              )
            ) + '%';
        }
      }
    );

    // Recommended practice
    const mission =
      missionForWeakness();

    const cards =
      $$('.quest-list .quest');

    if (cards.length) {
      const labels = [
        `${mission.title} — Targeted Drill`,
        'Adaptive Architecture Stress Test',
        'Communication Recovery Sprint'
      ];

      const descs = [
        `Personalized for ${mission.focus}`,
        `Built around your lowest system-level gaps`,
        `Focused on your recurring communication signals`
      ];

      cards.forEach(
        (card, i) => {
          const name =
            $('.qname', card);

          const desc =
            $('.qdesc', card);

          if (i === 0) {
            setText(
              name,
              labels[0]
            );

            setText(
              desc,
              `5 questions · 25 minutes · +150 XP · ${mission.focus}`
            );
          } else {
            setText(
              name,
              labels[i]
            );

            setText(
              desc,
              `${descs[i]} · AI-generated`
            );
          }
        }
      );
    }

    // Daily objective
    const daily =
      Math.min(
        3,
        todayInterviews().length
      );

    setText(
      $('#dailyText'),
      daily + ' / 3'
    );

    if ($('#dailyFill')) {
      $('#dailyFill').style.width =
        (daily / 3 * 100) +
        '%';
    }
  }

  function setupBadgesPage() {
    evaluateBadges();
  }

  function showToast(message) {
    const t =
      $('#toast');

    if (!t) return;

    t.textContent =
      message;

    t.classList.add('show');

    clearTimeout(
      window._phase3Toast
    );

    window._phase3Toast =
      setTimeout(
        () =>
          t.classList.remove(
            'show'
          ),
        3000
      );
  }

  async function init() {
    if (
      window.InterviewAIState
    ) {
      InterviewAIState.save();
    }

    evaluateBadges();

    setupQuest();
    setupQuestClicks();

    const path =
      location.pathname.toLowerCase();

    if (
      path.endsWith(
        'badges.html'
      )
    ) {
      setupBadgesPage();
    }

    if (
      path.endsWith(
        'training-arena.html'
      )
    ) {
      setupTrainingArena();

      requestAIDrill()
        .then(drill => {
          const first =
            $('.quest-list .quest .qdesc');

          if (first) {
            first.textContent =
              `${first.textContent} · AI: ${drill}`;
          }
        });
    }
  }

  window.InterviewAIPhase3 = {
    getCareerTwin: twin,
    getTrackCounts:
      trackCounts,
    getReadiness:
      readiness,
    getWeakestSkill:
      weakest,
    getMission:
      missionForWeakness,
    evaluateBadges,
    requestAIDrill,
    refresh: init
  };

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }
})();