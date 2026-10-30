/*
 * Seven Beans Landing Page Interactions
 * Handles Loader, Animations, Navigation Drawer, Waitlist Modal and Toast Notification
 */


const firebaseConfig = {
  apiKey: "AIzaSyCtNgCqNRMKR2KuOoh2Cx7-nKXMhNUTtOA",
  authDomain: "seven-beans-b0a56.firebaseapp.com",
  projectId: "seven-beans-b0a56",
  storageBucket: "seven-beans-b0a56.firebasestorage.app",
  messagingSenderId: "556193109060",
  appId: "1:556193109060:web:25e57d7097e67f0a3f9811",
  measurementId: "G-SR204JZZ6P"
};

let app, db, auth, ai, model;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  ai = getVertexAI(app);
  model = getGenerativeModel(ai, { 
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });
} catch (e) {
  console.error("Firebase init error", e);
}

document.addEventListener('DOMContentLoaded', () => {
  const translations = window.translations;

  // ==========================================================================
  // Localization (i18n)
  // ==========================================================================
  const langBtns = document.querySelectorAll('.lang-btn');

  function updateLanguage(lang) {
    if (!translations || !translations[lang]) return;

    // Update active button
    langBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update text
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        // Special case for innerHTML if there are tags
        if (translations[lang][key].includes('<br>')) {
          el.innerHTML = translations[lang][key];
        } else {
          el.innerText = translations[lang][key];
        }
      }
    });

    // Update placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang] && translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });

    // Save preference
    localStorage.setItem('sevenbeans_lang', lang);
    
    // Dispatch custom event for dynamic components
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  // Initialize Language
  const savedLang = localStorage.getItem('sevenbeans_lang');
  if (savedLang && translations[savedLang]) {
    updateLanguage(savedLang);
  } else {
    // Basic browser detection
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.startsWith('es')) updateLanguage('es');
    else if (userLang.startsWith('ca')) updateLanguage('ca');
    else updateLanguage('en');
  }

  // Bind clicks
  langBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lang = e.target.getAttribute('data-lang');
      updateLanguage(lang);
    });
  });



  // ==========================================================================
  // 1. Page Loader & Staggered Entry Animations
  // ==========================================================================
  const loader = document.getElementById('loader');
  const animatedItems = document.querySelectorAll('.animate-item');

  // Fade out loader on window load and trigger animations
  window.addEventListener('load', () => {
    if (loader) {
      setTimeout(() => {
        loader.classList.add('fade-out');

        // Trigger animations for hero components
        setTimeout(() => {
          animatedItems.forEach(item => item.classList.add('animated'));
        }, 300); // Small offset after loader fades

      }, 600); // Visual hold on loader for premium feel
    }
  });

  // Fallback in case window load takes too long (e.g. slow resources)
  setTimeout(() => {
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
      animatedItems.forEach(item => item.classList.add('animated'));
    }
  }, 3000);

  // ==========================================================================
  // 2. Navigation Drawer Toggle (Hamburger Menu)
  // ==========================================================================
  const menuToggle = document.getElementById('menuToggle');
  const navDrawer = document.getElementById('navDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    menuToggle.classList.add('active');
    navDrawer.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    navDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  function closeDrawer() {
    menuToggle.classList.remove('active');
    navDrawer.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    navDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Unlock scroll
  }

  if (menuToggle && navDrawer) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navDrawer.classList.contains('active');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  // Close drawer when backdrop is clicked
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  // Close drawer on link clicks
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close drawer on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navDrawer && navDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // ==========================================================================
  // 3. Inline Waiting List Form Interactions
  // ==========================================================================
  const scrollToWaitlistBtn = document.getElementById('scrollToWaitlistBtn');
  const drawerJoinWaitlist = document.getElementById('drawerJoinWaitlist');
  const waitlistSection = document.getElementById('waitlistSection');

  function scrollToWaitlist() {
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  if (scrollToWaitlistBtn) {
    scrollToWaitlistBtn.addEventListener('click', scrollToWaitlist);
  }

  if (drawerJoinWaitlist) {
    drawerJoinWaitlist.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      setTimeout(scrollToWaitlist, 400); // smooth scroll after drawer closes
    });
  }

  // Form Logic
  const inlineWaitlistForm = document.getElementById('inlineWaitlistForm');
  const whatsappCheckbox = document.getElementById('whatsappCheckbox');
  const whatsappFieldContainer = document.getElementById('whatsappFieldContainer');
  const inlineSubmitBtn = document.getElementById('inlineSubmitBtn');
  const inlineWaitlistFormContainer = document.getElementById('inlineWaitlistFormContainer');
  const waitlistSuccessView = document.getElementById('waitlistSuccessView');

  // Toggle WhatsApp Field
  if (whatsappCheckbox && whatsappFieldContainer) {
    whatsappCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        whatsappFieldContainer.classList.remove('hidden');
      } else {
        whatsappFieldContainer.classList.add('hidden');
      }
    });
  }

  // Handle Form Submission
  if (inlineWaitlistForm) {
    inlineWaitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('inlineEmailInput');
      const nameInput = document.getElementById('inlineNameInput');
      const honeypotInput = document.getElementById('inlineHoneypotInput');
      
      if (emailInput && !emailInput.value) return;

      // Anti-bot Honeypot Check
      if (honeypotInput && honeypotInput.value) {
        console.warn('Bot detected. Silently dropping submission.');
        // Pretend it was successful to trick the bot
        if (inlineWaitlistFormContainer) inlineWaitlistFormContainer.style.display = 'none';
        if (waitlistSuccessView) waitlistSuccessView.classList.remove('hidden');
        return;
      }

      // Set loading state
      if (inlineSubmitBtn) {
        inlineSubmitBtn.classList.add('loading');
        inlineSubmitBtn.disabled = true;
      }
      
      // Bridge to SendPulse hidden form
      const spForm = document.querySelector('.sp-element-container');
      const spEmail = document.querySelector('.sp-form input[type="email"]') || document.querySelector('input[name*="email"]');
      const spName = document.querySelector('.sp-form input[type="text"]') || document.querySelector('input[name*="name"]');
      const spSubmit = document.querySelector('.sp-form button') || document.querySelector('.sp-button');

      if (spEmail && spSubmit) {
        // Fill SendPulse form
        spEmail.value = emailInput.value;
        // Trigger input event to update React/Vue models if SendPulse uses them
        spEmail.dispatchEvent(new Event('input', { bubbles: true }));
        spEmail.dispatchEvent(new Event('change', { bubbles: true }));

        if (spName && nameInput) {
          spName.value = nameInput.value;
          spName.dispatchEvent(new Event('input', { bubbles: true }));
          spName.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Inject Language hidden field
        const currentLang = localStorage.getItem('sevenbeans_lang') || 'en';
        
        // SendPulse uses Base64 encoded names for custom variables. 
        // btoa('language') = 'bGFuZ3VhZ2U=', btoa('Language') = 'TGFuZ3VhZ2U='
        const possibleNames = ['sform[language]', 'sform[bGFuZ3VhZ2U=]', 'sform[TGFuZ3VhZ2U=]'];
        
        possibleNames.forEach(fieldName => {
          let langInput = spForm.querySelector(`input[name="${fieldName}"]`);
          if (!langInput) {
            langInput = document.createElement('input');
            langInput.type = 'hidden';
            langInput.name = fieldName;
            spForm.appendChild(langInput);
          }
          langInput.value = currentLang;
          langInput.dispatchEvent(new Event('input', { bubbles: true }));
          langInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Trigger SendPulse submit
        spSubmit.click();
        
        // Transition to success state immediately for UX
        setTimeout(() => {
          if (inlineWaitlistFormContainer) inlineWaitlistFormContainer.style.display = 'none';
          if (waitlistSuccessView) waitlistSuccessView.classList.remove('hidden');
        }, 500);
      } else if (spForm) {
        // Fallback: if we found the form but not the button, try to dispatch submit event
        console.warn('Found SendPulse form but missing inputs/button, trying direct form submit');
        if (spEmail) spEmail.value = emailInput.value;
        spForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        
        setTimeout(() => {
          if (inlineWaitlistFormContainer) inlineWaitlistFormContainer.style.display = 'none';
          if (waitlistSuccessView) waitlistSuccessView.classList.remove('hidden');
        }, 500);
      } else {
        console.error('SendPulse form not loaded yet or not found');
        // Fallback simulate delay if SendPulse isn't loaded
        setTimeout(() => {
          if (inlineWaitlistFormContainer) inlineWaitlistFormContainer.style.display = 'none';
          if (waitlistSuccessView) waitlistSuccessView.classList.remove('hidden');
        }, 1500);
      }
    });
  }

  // ==========================================================================
  // 4. Follow the Journey Button Scroll
  // ==========================================================================
  const followJourneyBtn = document.getElementById('followJourneyBtn');
  const blogSection = document.getElementById('blogSection');

  if (followJourneyBtn && blogSection) {
    followJourneyBtn.addEventListener('click', () => {
      blogSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ==========================================================================
  // 5. Section 2: Header Scroll Effect & Scroll Indicator & Animations
  // ==========================================================================
  const siteHeader = document.querySelector('.site-header');
  const scrollIndicator = document.getElementById('scrollIndicator');
  const storySection = document.getElementById('storySection');
  const animatedScrollItems = document.querySelectorAll('.animate-item-scroll');

  // Header Scrolled Background Effect
  function checkHeaderScroll() {
    if (siteHeader) {
      if (window.scrollY > 50) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }
  }

  window.addEventListener('scroll', checkHeaderScroll);
  checkHeaderScroll(); // Check on init

  // Smooth scroll to story section on click
  if (scrollIndicator && storySection) {
    scrollIndicator.addEventListener('click', () => {
      storySection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Intersection Observer for scroll animations
  if ('IntersectionObserver' in window && animatedScrollItems.length > 0) {
    const scrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target); // Trigger once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedScrollItems.forEach(item => {
      scrollObserver.observe(item);
    });
  } else {
    // Fallback if IntersectionObserver is not supported
    animatedScrollItems.forEach(item => {
      item.classList.add('animated');
    });
  }

  // ==========================================================================
  // 6. Secret Viral Section Interactions
  // ==========================================================================
  const secretWrapper = document.getElementById('secretPosterWrapper');
  const saveSecretBtn = document.getElementById('saveSecretBtn');

  if (secretWrapper) {
    // Mobile tap interaction
    secretWrapper.addEventListener('touchstart', function () {
      this.classList.toggle('active');
    }, { passive: true });
  }

  if (saveSecretBtn) {
    saveSecretBtn.addEventListener('click', function (e) {
      e.stopPropagation(); // prevent triggering wrapper events if any
      const secretCode = "FIRSTPEEK";
      navigator.clipboard.writeText(secretCode).then(() => {
        const originalText = this.innerText;
        this.innerText = "Copied!";
        setTimeout(() => {
          this.innerText = originalText;
        }, 2000);
      }).catch(err => {
        console.error("Failed to copy code: ", err);
      });
    });
  }

  // ==========================================================================
  // 7. Hiring & Job Details Pages Logic
  // ==========================================================================
  const jobsData = [
    { id: 'head-chef', titleKey: 'job_head_chef' },
    { id: 'cook', titleKey: 'job_cook' },
    { id: 'prep-cook', titleKey: 'job_prep_cook' },
    { id: 'dishwasher', titleKey: 'job_dishwasher' },
    { id: 'waiter', titleKey: 'job_waiter' },
    { id: 'barista', titleKey: 'job_barista' },
    { id: 'smm', titleKey: 'job_smm' }
  ];

  const jobsList = document.getElementById('jobsList');
  const jobSearchInput = document.getElementById('jobSearchInput');
  const noJobsMessage = document.getElementById('noJobsMessage');

  function renderJobs(filterText = '') {
    if (!jobsList) return;
    
    jobsList.innerHTML = '';
    let visibleCount = 0;
    const currentLang = localStorage.getItem('sevenbeans_lang') || 'en';
    const langDict = translations[currentLang] || translations['en'];

    jobsData.forEach(job => {
      const jobTitle = langDict[job.titleKey] || 'Job';
      
      if (jobTitle.toLowerCase().includes(filterText.toLowerCase())) {
        visibleCount++;
        const card = document.createElement('a');
        card.href = `job-details.html?role=${job.id}`;
        card.className = 'job-card';
        card.innerHTML = `
          <div class="job-card-content">
            <h3 class="job-card-title">${jobTitle}</h3>
            <div class="job-card-meta">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="job-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Barcelona</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="job-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Full-time</span>
            </div>
          </div>
          <div class="job-card-arrow">&rarr;</div>
        `;
        jobsList.appendChild(card);
      }
    });

    if (visibleCount === 0 && noJobsMessage) {
      noJobsMessage.classList.remove('hidden');
    } else if (noJobsMessage) {
      noJobsMessage.classList.add('hidden');
    }
  }

  if (jobsList) {
    renderJobs();
    
    if (jobSearchInput) {
      jobSearchInput.addEventListener('input', (e) => {
        renderJobs(e.target.value);
      });
    }

    document.addEventListener('languageChanged', () => {
      renderJobs(jobSearchInput ? jobSearchInput.value : '');
    });
  }

  // Job Details Page Logic
  const jobTitleEl = document.getElementById('jobTitle');
  if (jobTitleEl) {
    const urlParams = new URLSearchParams(window.location.search);
    const roleId = urlParams.get('role');
    const job = jobsData.find(j => j.id === roleId) || jobsData[0];
    
    jobTitleEl.setAttribute('data-i18n', job.titleKey);
    const currentLang = localStorage.getItem('sevenbeans_lang') || 'en';
    jobTitleEl.innerText = translations[currentLang][job.titleKey] || 'Job';

    const applyCv = document.getElementById('applyCv');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    
    if (applyCv && fileNameDisplay) {
      applyCv.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          fileNameDisplay.textContent = "📎 " + e.target.files[0].name;
          fileNameDisplay.classList.remove('hidden');
        } else {
          fileNameDisplay.classList.add('hidden');
        }
      });
    }

    const jobApplicationForm = document.getElementById('jobApplicationForm');
    const applySuccessMsg = document.getElementById('applySuccessMsg');
    const applySubmitBtn = document.getElementById('applySubmitBtn');

    if (jobApplicationForm) {
      jobApplicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        applySubmitBtn.classList.add('loading');
        
        // Groundwork for SendPulse / form submission
        // Example: collect form data
        // const formData = new FormData(jobApplicationForm);
        // fetch('SENDPULSE_URL', { method: 'POST', body: formData }).then(...)

        setTimeout(() => {
          applySubmitBtn.classList.remove('loading');
          jobApplicationForm.style.display = 'none';
          if (applySuccessMsg) applySuccessMsg.classList.remove('hidden');
        }, 1500);
      });
    }
  }

  /* ==========================================
     News Page & Admin Panel Logic
     ========================================== */


  // --- News Page Logic ---
  const newsGrid = document.getElementById('newsGrid');
  const newsLoadingSpinner = document.getElementById('newsLoadingSpinner');
  const noNewsMessage = document.getElementById('noNewsMessage');

  async function loadNews() {
    if (!newsGrid || !db) return;
    
    try {
      const q = query(collection(db, "news"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      
      if (newsLoadingSpinner) newsLoadingSpinner.style.display = 'none';
      
      if (querySnapshot.empty) {
        if (noNewsMessage) noNewsMessage.classList.remove('hidden');
        return;
      }

      querySnapshot.forEach((doc) => {
        const newsItem = doc.data();
        const currentLang = localStorage.getItem('language') || 'en';
        const localizedNews = newsItem[currentLang] || newsItem['en'];
        
        if (!localizedNews) return; // safety check

        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
          <div class="news-card-date">${newsItem.date}</div>
          <h3 class="news-card-title">${localizedNews.title}</h3>
          <div class="news-card-content">${localizedNews.content}</div>
        `;
        newsGrid.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading news:", error);
      if (newsLoadingSpinner) newsLoadingSpinner.style.display = 'none';
      if (noNewsMessage) {
        noNewsMessage.innerText = "Error loading news. Please try again later.";
        noNewsMessage.classList.remove('hidden');
      }
    }
  }

  // Call load news if on news page
  if (newsGrid) {
    loadNews();
  }

  // --- Admin Panel Logic ---
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginScreen = document.getElementById('adminLoginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminNewsForm = document.getElementById('adminNewsForm');
  const btnTranslate = document.getElementById('btnTranslate');
  const loginError = document.getElementById('loginError');

  // Auth State Observer
  if (adminLoginScreen && auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        adminLoginScreen.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
      } else {
        adminDashboard.classList.add('hidden');
        adminLoginScreen.classList.remove('hidden');
      }
    });
  }

  // Login Action
  if (adminLoginForm && auth) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adminEmail').value;
      const pass = document.getElementById('adminPassword').value;
      loginError.classList.add('hidden');

      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (error) {
        loginError.innerText = "Error: " + error.message;
        loginError.classList.remove('hidden');
      }
    });
  }

  // Logout Action
  if (adminLogoutBtn && auth) {
    adminLogoutBtn.addEventListener('click', async () => {
      await signOut(auth);
    });
  }

  // AI Translation Action using Gemini
  if (btnTranslate) {
    btnTranslate.addEventListener('click', async () => {
      const titleEn = document.getElementById('newsTitleEn').value;
      const contentEn = document.getElementById('newsContentEn').value;

      if (!titleEn || !contentEn) {
        alert("Please write the English title and content first!");
        return;
      }

      if (!model) {
        alert("AI model not initialized. Make sure Firebase AI Logic is set up.");
        return;
      }

      btnTranslate.innerText = "Translating...";
      btnTranslate.disabled = true;
      
      try {
        const prompt = `Translate the following news announcement for a cafe into Spanish (es) and Catalan (ca). 
Return the result EXACTLY as a JSON object with this structure:
{
  "es": { "title": "...", "content": "..." },
  "ca": { "title": "...", "content": "..." }
}

English Title: ${titleEn}
English Content: ${contentEn}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Parse the JSON safely (handling possible markdown code blocks)
        let jsonStr = text;
        if (jsonStr.startsWith('\`\`\`')) {
          jsonStr = jsonStr.replace(/^\`\`\`(json)?/, '').replace(/\`\`\`$/, '');
        }
        
        const translations = JSON.parse(jsonStr.trim());
        
        if (translations.es) {
          document.getElementById('newsTitleEs').value = translations.es.title || "";
          document.getElementById('newsContentEs').value = translations.es.content || "";
        }
        
        if (translations.ca) {
          document.getElementById('newsTitleCa').value = translations.ca.title || "";
          document.getElementById('newsContentCa').value = translations.ca.content || "";
        }
        
      } catch (error) {
        console.error("Translation error", error);
        alert("Error translating: " + error.message);
      } finally {
        btnTranslate.innerText = "🪄 Translate to ES & CA";
        btnTranslate.disabled = false;
      }
    });
  }

  // Publish News Action
  if (adminNewsForm && db) {
    adminNewsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnPublish = document.getElementById('btnPublish');
      const publishSuccess = document.getElementById('publishSuccess');
      const publishError = document.getElementById('publishError');
      
      publishSuccess.classList.add('hidden');
      publishError.classList.add('hidden');
      btnPublish.innerText = "Publishing...";
      
      try {
        await addDoc(collection(db, "news"), {
          date: document.getElementById('newsDate').value,
          createdAt: serverTimestamp(),
          en: {
            title: document.getElementById('newsTitleEn').value,
            content: document.getElementById('newsContentEn').value
          },
          es: {
            title: document.getElementById('newsTitleEs').value,
            content: document.getElementById('newsContentEs').value
          },
          ca: {
            title: document.getElementById('newsTitleCa').value,
            content: document.getElementById('newsContentCa').value
          }
        });
        
        btnPublish.innerText = "Publish Article";
        publishSuccess.classList.remove('hidden');
        adminNewsForm.reset();
        
        setTimeout(() => {
          publishSuccess.classList.add('hidden');
        }, 3000);
      } catch (error) {
        btnPublish.innerText = "Publish Article";
        publishError.innerText = "Error: " + error.message;
        publishError.classList.remove('hidden');
      }
    });
  }

});
