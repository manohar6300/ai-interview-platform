/* ============================================================
   InterviewAI — APP SYNC BRIDGE
   Connects:
   Dashboard
   Settings
   Training Arena
   Career Quest
   Interview
   Results

   IMPORTANT:
   InterviewAIState is the source of truth.
   Legacy localStorage keys are kept for compatibility.
============================================================ */

(() => {

  'use strict';


  const LEGACY = {

    xp: 'ai_xp',

    level: 'ai_level',

    streak: 'ai_streak',

    interviews: 'ai_interviews',

    lastInterview: 'ai_last_interview',

    name: 'ai_user_name',

    role: 'ai_user_role',

    email: 'ai_user_email',

    settings: 'interviewai_settings',

    interviewType: 'interview_default_type',

    difficulty: 'interview_difficulty',

    questions: 'interview_questions',

    cqXP: 'cq_xp',

    cqLevel: 'cq_level',

    cqStreak: 'cq_streak'

  };


  /* ==========================================================
     SAFE PARSE
  ========================================================== */

  function safeParse(
    value,
    fallback = null
  ){

    try{

      const parsed =
        JSON.parse(value);

      return parsed;

    }catch{

      return fallback;

    }

  }


  /* ==========================================================
     GET STATE
  ========================================================== */

  function getState(){

    if(
      window.InterviewAIState &&
      typeof InterviewAIState.get === 'function'
    ){

      return InterviewAIState.get();

    }


    return {

      user:{
        name:
          localStorage.getItem(
            LEGACY.name
          ) ||
          'Manohar',

        role:
          localStorage.getItem(
            LEGACY.role
          ) ||
          'Future Software Engineer'
      },


      progression:{

        xp:
          Number(
            localStorage.getItem(
              LEGACY.xp
            ) || 0
          ),

        level:
          Number(
            localStorage.getItem(
              LEGACY.level
            ) || 1
          ),

        streak:
          Number(
            localStorage.getItem(
              LEGACY.streak
            ) || 0
          )

      },


      interviews:
        safeParse(
          localStorage.getItem(
            LEGACY.interviews
          ),
          []
        ) || [],


      settings:
        safeParse(
          localStorage.getItem(
            LEGACY.settings
          ),
          {}
        ) || {},


      careerTwin:{
        readiness:0,
        skillProfile:{}
      }

    };

  }


  /* ==========================================================
     GET INTERVIEWS
  ========================================================== */

  function getInterviews(){

    const state =
      getState();

    if(
      Array.isArray(
        state.interviews
      )
    ){

      return state.interviews;

    }


    return [];

  }


  /* ==========================================================
     NORMALIZE SETTINGS
  ========================================================== */

  function normalizeSettings(
    settings = {}
  ){

    return {

      defaultType:
        settings.defaultType ||
        'Technical',

      difficulty:
        settings.difficulty ||
        'Medium',

      questions:
        Number(
          settings.questions || 10
        ),

      dailyReminder:
        settings.dailyReminder ??
        settings.reminders ??
        true,

      questAlerts:
        settings.questAlerts ??
        true,

      badgeAlerts:
        settings.badgeAlerts ??
        settings.badgeNotifications ??
        true,

      animations:
        settings.animations ??
        settings.neonAnimations ??
        true,

      sound:
        settings.sound ??
        settings.soundEffects ??
        false,

      reducedMotion:
        settings.reducedMotion ??
        false,

      intensity:
        Number(
          settings.intensity ??
          settings.animationIntensity ??
          75
        ),

      history:
        settings.history ??
        true,

      resumeSave:
        settings.resumeSave ??
        true

    };

  }


  /* ==========================================================
     SYNC STATE → LEGACY
  ========================================================== */

  function syncLegacy(){

    const state =
      getState();

    const progression =
      state.progression || {};

    const user =
      state.user || {};


    localStorage.setItem(
      LEGACY.xp,
      String(
        Number(
          progression.xp || 0
        )
      )
    );


    localStorage.setItem(
      LEGACY.level,
      String(
        Number(
          progression.level || 1
        )
      )
    );


    localStorage.setItem(
      LEGACY.streak,
      String(
        Number(
          progression.streak || 0
        )
      )
    );


    localStorage.setItem(
      LEGACY.cqXP,
      String(
        Number(
          progression.xp || 0
        )
      )
    );


    localStorage.setItem(
      LEGACY.cqLevel,
      String(
        Number(
          progression.level || 1
        )
      )
    );


    localStorage.setItem(
      LEGACY.cqStreak,
      String(
        Number(
          progression.streak || 0
        )
      )
    );


    localStorage.setItem(
      LEGACY.name,
      user.name ||
      'Manohar'
    );


    localStorage.setItem(
      LEGACY.role,
      user.role ||
      'Future Software Engineer'
    );


    if(
      Array.isArray(
        state.interviews
      )
    ){

      localStorage.setItem(
        LEGACY.interviews,
        JSON.stringify(
          state.interviews.slice(
            0,
            50
          )
        )
      );

    }


    if(
      state.interviews &&
      state.interviews[0]
    ){

      localStorage.setItem(
        LEGACY.lastInterview,
        JSON.stringify(
          state.interviews[0]
        )
      );

    }


    const settings =
      normalizeSettings(
        state.settings || {}
      );


    localStorage.setItem(
      LEGACY.settings,
      JSON.stringify(
        settings
      )
    );


    localStorage.setItem(
      LEGACY.interviewType,
      settings.defaultType
    );


    localStorage.setItem(
      LEGACY.difficulty,
      settings.difficulty
    );


    localStorage.setItem(
      LEGACY.questions,
      String(
        settings.questions
      )
    );

  }


  /* ==========================================================
     SETTINGS → STATE
  ========================================================== */

  function saveSettings(
    payload = {}
  ){

    const current =
      getState();


    const normalized =
      normalizeSettings(
        payload
      );


    const profileName =
      String(
        payload.name ||
        current.user?.name ||
        'Manohar'
      ).trim();


    const profileRole =
      String(
        payload.role ||
        current.user?.role ||
        'Future Software Engineer'
      ).trim();


    if(
      window.InterviewAIState
    ){

      /*
         Set user first.
      */

      InterviewAIState.set(
        'user.name',
        profileName ||
        'Manohar'
      );


      InterviewAIState.set(
        'user.role',
        profileRole ||
        'Future Software Engineer'
      );


      /*
         Store both the modern names
         and compatibility aliases.
      */

      InterviewAIState.set(
        'settings',
        {

          defaultType:
            normalized.defaultType,

          difficulty:
            normalized.difficulty,

          questions:
            normalized.questions,

          reminders:
            normalized.dailyReminder,

          dailyReminder:
            normalized.dailyReminder,

          questAlerts:
            normalized.questAlerts,

          badgeNotifications:
            normalized.badgeAlerts,

          badgeAlerts:
            normalized.badgeAlerts,

          neonAnimations:
            normalized.animations,

          animations:
            normalized.animations,

          soundEffects:
            normalized.sound,

          sound:
            normalized.sound,

          reducedMotion:
            normalized.reducedMotion,

          animationIntensity:
            String(
              normalized.intensity
            ),

          intensity:
            normalized.intensity,

          history:
            normalized.history,

          resumeSave:
            normalized.resumeSave

        }
      );

    }


    if(payload.email){

      localStorage.setItem(
        LEGACY.email,
        String(
          payload.email
        ).trim()
      );

    }


    /*
       Force compatibility with older
       pages and Career Quest.
    */

    syncLegacy();


    /*
       Notify all open page code.
    */

    window.dispatchEvent(
      new CustomEvent(
        'interviewai:settings-saved',
        {
          detail:{
            ...normalized,

            name:profileName,

            role:profileRole,

            email:
              payload.email || ''
          }
        }
      )
    );


    return getState();

  }


  /* ==========================================================
     REFRESH DASHBOARD
  ========================================================== */

  function refreshDashboard(){

    const state =
      getState();


    const interviews =
      getInterviews();


    const progression =
      state.progression || {};


    const user =
      state.user || {};


    const careerTwin =
      state.careerTwin || {};


    const scores =
      interviews
        .map(
          item =>
            Number(
              item.score
            )
        )
        .filter(
          Number.isFinite
        );


    const total =
      interviews.length;


    const average =
      scores.length
        ? Math.round(
            scores.reduce(
              (a,b) =>
                a + b,
              0
            ) /
            scores.length
          )
        : 0;


    const best =
      scores.length
        ? Math.max(
            ...scores
          )
        : 0;


    const minutes =
      interviews.reduce(
        (
          totalMinutes,
          item
        ) =>
          totalMinutes +
          Number(
            item.duration ||
            15
          ),
        0
      );


    const hours =
      Math.round(
        minutes / 60
      );


    const streak =
      Number(
        progression.streak ||
        0
      );


    const xp =
      Number(
        progression.xp ||
        0
      );


    const level =
      Number(
        progression.level ||
        1
      );


    /*
       Profile
    */

    setText(
      'topbar-name',
      user.name || 'Manohar'
    );


    setText(
      'sname',
      user.name || 'Manohar'
    );


    setText(
      'topbar-sub',
      `Targeting ${
        user.role ||
        'Future Software Engineer'
      }`
    );


    const initial =
      String(
        user.name ||
        'M'
      )
      .charAt(0)
      .toUpperCase();


    setText(
      'sav',
      initial
    );


    /*
       Main stats
    */

    setText(
      'sc-total',
      total
    );


    setText(
      'sc-avg',
      `${average}%`
    );


    setText(
      'sc-best',
      `${best}%`
    );


    setText(
      'sc-hours',
      `${hours}h`
    );


    /*
       Streak
    */

    setText(
      'streak-num',
      streak
    );


    setText(
      'cq-streak',
      streak
    );


    setText(
      'streak-goal-sub',
      `${streak} of 7 days done`
    );


    setText(
      'streak-goal-badge',
      `${streak}/7`
    );


    /*
       Career readiness
    */

    const readiness =
      Number(
        careerTwin.readiness ||
        average ||
        0
      );


    setText(
      'gauge-pct',
      `${Math.round(readiness)}%`
    );


    const arc =
      document.getElementById(
        'gauge-arc'
      );


    if(arc){

      const circumference = 327;

      const safe =
        Math.max(
          0,
          Math.min(
            100,
            readiness
          )
        );


      arc.setAttribute(
        'stroke-dashoffset',
        String(
          circumference -
          (
            circumference *
            safe /
            100
          )
        )
      );

    }


    /*
       Skill values
    */

    const skillProfile =
      careerTwin.skillProfile ||
      {};


    const findSkill =
      (
        names,
        fallback
      ) => {

        for(
          const name of names
        ){

          const key =
            name
              .toLowerCase()
              .replace(
                /\s+/g,
                '-'
              );


          if(
            skillProfile[key]
          ){

            return Number(
              skillProfile[key].score ||
              0
            );

          }

        }


        return fallback;

      };


    const technical =
      findSkill(
        [
          'technical',
          'technical-interview',
          'python',
          'javascript',
          'programming'
        ],
        average
      );


    const communication =
      findSkill(
        [
          'communication',
          'behavioural',
          'behavioural-interview'
        ],
        average
      );


    const confidence =
      Number(
        careerTwin.confidence ||
        average
      );


    setProgressBar(
      'pb1',
      technical
    );


    setProgressBar(
      'pb2',
      communication
    );


    setProgressBar(
      'pb3',
      confidence
    );


    /*
       Training data
    */

    setText(
      'cq-level',
      level
    );


    setText(
      'cq-xptext',
      `${xp.toLocaleString()} XP`
    );


    const xpFill =
      document.getElementById(
        'cq-xpfill'
      );


    if(xpFill){

      const levelXP = 120;

      const currentXP =
        xp % levelXP;

      const percent =
        Math.round(
          (
            currentXP /
            levelXP
          ) *
          100
        );


      xpFill.style.width =
        `${percent}%`;

    }


    /*
       Interview badge
    */

    setText(
      'int-badge',
      `${total} total`
    );


    /*
       Recent interviews
    */

    renderInterviewList(
      interviews
    );


    /*
       Save legacy values one more
       time after refresh.
    */

    syncLegacy();

  }


  /* ==========================================================
     INTERVIEW LIST
  ========================================================== */

  function renderInterviewList(
    interviews
  ){

    const list =
      document.getElementById(
        'interview-list'
      );


    if(!list){
      return;
    }


    if(
      !Array.isArray(interviews) ||
      interviews.length === 0
    ){

      return;

    }


    list.innerHTML = '';


    const iconMap = {

      Technical:'⚡',

      DSA:'💻',

      'System Design':'🏗️',

      Behavioural:'🧠',

      HR:'🤝',

      Mixed:'🎯'

    };


    interviews
      .slice(
        0,
        6
      )
      .forEach(
        interview => {

          const score =
            Number(
              interview.score ||
              0
            );


          const cls =
            score >= 80
              ? 'sc-green'
              : score >= 55
                ? 'sc-yellow'
                : 'sc-red';


          const item =
            document.createElement(
              'div'
            );


          item.className =
            'int-item';


          item.innerHTML = `

            <div
              class="int-icon"
              style="
                background:
                  rgba(124,58,237,0.18)
              "
            >
              ${
                iconMap[
                  interview.type
                ] ||
                '🎙️'
              }
            </div>

            <div class="int-info">

              <div class="int-title">
                ${
                  escapeHTML(
                    interview.role ||
                    'Software Engineer'
                  )
                }
                —
                ${
                  escapeHTML(
                    interview.type ||
                    'Technical'
                  )
                }
              </div>

              <div class="int-meta">

                ${
                  escapeHTML(
                    interview.company ||
                    'General'
                  )
                }

                ·

                ${
                  escapeHTML(
                    interview.date ||
                    'Today'
                  )
                }

                ·

                ${
                  Number(
                    interview.duration ||
                    15
                  )
                }
                min

              </div>

            </div>

            <div
              class="score-chip ${cls}"
            >
              ${score}%
            </div>

          `;


          item.addEventListener(
            'click',
            () => {

              location.href =
                'result.html';

            }
          );


          list.appendChild(
            item
          );

        }
      );

  }


  /* ==========================================================
     DASHBOARD TEXT HELPER
  ========================================================== */

  function setText(
    id,
    value
  ){

    const element =
      document.getElementById(
        id
      );


    if(element){

      element.textContent =
        String(
          value
        );

    }

  }


  /* ==========================================================
     PROGRESS BAR
  ========================================================== */

  function setProgressBar(
    id,
    value
  ){

    const element =
      document.getElementById(
        id
      );


    if(!element){
      return;
    }


    const safe =
      Math.max(
        0,
        Math.min(
          100,
          Number(value) || 0
        )
      );


    element.style.width =
      `${safe}%`;

  }


  /* ==========================================================
     ESCAPE
  ========================================================== */

  function escapeHTML(
    value
  ){

    return String(
      value ?? ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  }


  /* ==========================================================
     SETTINGS → TRAINING CONFIG
  ========================================================== */

  function getTrainingConfig(){

    const state =
      getState();


    const settings =
      normalizeSettings(
        state.settings || {}
      );


    return {

      type:
        settings.defaultType,

      difficulty:
        settings.difficulty,

      questions:
        settings.questions

    };

  }


  /* ==========================================================
     TRAINING START
  ========================================================== */

  function prepareTraining(
    type = null
  ){

    const config =
      getTrainingConfig();


    const selectedType =
      type ||
      config.type;


    const map = {

      Technical:
        'technical',

      DSA:
        'dsa',

      'System Design':
        'system-design',

      Behavioural:
        'behavioural'

    };


    localStorage.setItem(
      'training_mode',
      selectedType
    );


    localStorage.setItem(
      'interview_type',
      selectedType
    );


    localStorage.setItem(
      'interview_difficulty',
      config.difficulty
    );


    localStorage.setItem(
      'interview_questions',
      String(
        config.questions
      )
    );


    const weak =
      getState()
        ?.careerTwin
        ?.weakestSkills?.[0];


    if(weak){

      localStorage.setItem(
        'ai_training_focus',
        weak.label ||
        weak.name ||
        ''
      );

    }


    return {

      type:
        selectedType,

      track:
        map[
          selectedType
        ] ||
        'technical',

      difficulty:
        config.difficulty,

      questions:
        config.questions

    };

  }


  /* ==========================================================
     INIT
  ========================================================== */

  function init(){

    /*
       Do not call InterviewAIState.save()
       here unnecessarily because that
       would trigger repeated state events.
    */

    syncLegacy();


    const path =
      location.pathname
        .toLowerCase();


    if(
      path.endsWith(
        'dashboard.html'
      )
    ){

      refreshDashboard();

    }


  }


  /* ==========================================================
     LISTEN FOR STATE UPDATES
  ========================================================== */

  window.addEventListener(
    'interviewai:state',
    event => {

      syncLegacy();


      const path =
        location.pathname
          .toLowerCase();


      if(
        path.endsWith(
          'dashboard.html'
        )
      ){

        refreshDashboard();

      }

    }
  );


  window.addEventListener(
    'interviewai:settings-saved',
    () => {

      syncLegacy();


      refreshDashboard();

    }
  );


  window.addEventListener(
    'storage',
    event => {

      if(
        !event.key ||
        [
          LEGACY.xp,
          LEGACY.level,
          LEGACY.streak,
          LEGACY.interviews,
          LEGACY.settings,
          'interviewai_state_v1'
        ].includes(
          event.key
        )
      ){

        const path =
          location.pathname
            .toLowerCase();


        if(
          path.endsWith(
            'dashboard.html'
          )
        ){

          refreshDashboard();

        }

      }

    }
  );


  /* ==========================================================
     PUBLIC API
  ========================================================== */

  window.InterviewAISync = {

    getState,

    getInterviews,

    normalizeSettings,

    syncLegacy,

    saveSettings,

    refreshDashboard,

    getTrainingConfig,

    prepareTraining

  };


  /*
     Run after the current page is ready.
  */

  if(
    document.readyState ===
    'loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once:true
      }
    );

  }else{

    init();

  }

})();