/*
 * Seven Beans Landing Page Interactions
 * Handles Loader, Animations, Navigation Drawer, Waitlist Modal and Toast Notification
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtNgCqNRMKR2KuOoh2Cx7-nKXMhNUTtOA",
  authDomain: "seven-beans-b0a56.firebaseapp.com",
  projectId: "seven-beans-b0a56",
  storageBucket: "seven-beans-b0a56.firebasestorage.app",
  messagingSenderId: "556193109060",
  appId: "1:556193109060:web:25e57d7097e67f0a3f9811",
  measurementId: "G-SR204JZZ6P"
};

const geminiApiKey = "AQ.Ab8RN6IfqAaXM1QieHB-2jB0x2ocH0O03WTfcPB5M12dag-wUIQ";

let app, db, auth, storage;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (e) {
  console.error("Firebase init error", e);
  alert("Firebase Init Error: " + e.message);
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
        if (translations[lang][key].includes('<') && translations[lang][key].includes('>')) {
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
    
    // Update job details page if active
    const jobTitleEl = document.getElementById('jobTitle');
    if (jobTitleEl) {
      const urlParams = new URLSearchParams(window.location.search);
      const roleId = urlParams.get('role');
      if (roleId) {
        const descEl = document.getElementById('jobDescription');
        const respEl = document.getElementById('jobResponsibilities');
        const reqEl = document.getElementById('jobRequirements');
        const langToUse = translations[lang] && translations[lang][`job_desc_${roleId}`] ? lang : 'en';
        
        if (descEl) descEl.innerHTML = translations[langToUse][`job_desc_${roleId}`] || '';
        if (respEl) respEl.innerHTML = translations[langToUse][`job_resp_${roleId}`] || '';
        if (reqEl) reqEl.innerHTML = translations[langToUse][`job_req_${roleId}`] || '';
      }
    }
    
    // Dispatch custom event for dynamic components
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  // Initialize Language
  const savedLang = localStorage.getItem('sevenbeans_lang');
  if (savedLang && translations && translations[savedLang]) {
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

  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
      document.querySelectorAll('.job-card').forEach(card => {
        card.classList.remove('active');
        const details = card.querySelector('.job-details');
        if (details) {
          details.style.maxHeight = '0px';
        }
      });
    }
  });
  
  // ==========================================================================
  // Analytics & Tracking (Google Analytics 4 & SendPulse)
  // ==========================================================================
  function loadTrackingScripts() {
    // 1. Google Analytics
    if (!document.getElementById('ga-script')) {
      const gaScript = document.createElement('script');
      gaScript.id = 'ga-script';
      gaScript.async = true;
      gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-SR204JZZ6P';
      document.head.appendChild(gaScript);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'G-SR204JZZ6P');
      console.log('Google Analytics loaded (User consented)');
    }

    // 2. SendPulse Pixel
    if (!document.getElementById('sp-pixel-script')) {
      const spScript = document.createElement('script');
      spScript.id = 'sp-pixel-script';
      spScript.async = true;
      spScript.src = 'https://spxl.supportsrc.com/pulsepix.js';
      spScript.setAttribute('data-project-id', 'af6d1a96-f424-4e61-b9a7-9b47f21383be');
      document.head.appendChild(spScript);
      console.log('SendPulse Pixel loaded (User consented)');
    }
  }

  // ==========================================================================
  // Cookie Consent Banner
  // ==========================================================================
  function initCookieBanner() {
    const consentState = localStorage.getItem('cookieConsent');
    
    if (consentState === 'accepted') {
      // User previously accepted, load GA immediately
      loadTrackingScripts();
    } else if (!consentState) {
      // User hasn't chosen yet, show banner
      const bannerHtml = `
        <div class="cookie-banner" id="cookieBanner">
          <div class="cookie-content">
            <p>We use cookies to improve your experience and analyze site traffic. By clicking "Accept", you agree to our use of cookies. Read our <a href="cookies.html">Cookie Policy</a>.</p>
          </div>
          <div class="cookie-actions">
            <button class="btn-cookie btn-cookie-decline" id="btnCookieDecline">Decline</button>
            <button class="btn-cookie btn-cookie-accept" id="btnCookieAccept">Accept</button>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', bannerHtml);
      
      const banner = document.getElementById('cookieBanner');
      const btnAccept = document.getElementById('btnCookieAccept');
      const btnDecline = document.getElementById('btnCookieDecline');
      
      // Delay showing banner slightly for better UX
      setTimeout(() => {
        banner.classList.add('visible');
      }, 2000);
      
      btnAccept.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 600);
        
        // Initialize tracking scripts since user just accepted
        loadTrackingScripts();
      });
      
      btnDecline.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 600);
      });
    }
  }

  initCookieBanner();

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
    document.body.classList.add('menu-open');
  }

  function closeDrawer() {
    menuToggle.classList.remove('active');
    navDrawer.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    navDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Unlock scroll
    document.body.classList.remove('menu-open');
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
      
      const phoneInput = document.getElementById('inlineWhatsappInput');
      const nameError = document.getElementById('nameError');
      const emailError = document.getElementById('emailError');
      const phoneError = document.getElementById('phoneError');

      // Reset errors
      [nameInput, emailInput, phoneInput].forEach(input => {
        if (input) input.classList.remove('error');
      });
      [nameError, emailError, phoneError].forEach(err => {
        if (err) { err.classList.add('hidden'); err.innerText = ''; }
      });

      let isValid = true;

      // Name Validation
      if (nameInput && !nameInput.value.trim()) {
        nameInput.classList.add('error');
        if (nameError) {
          nameError.innerText = "Please enter your name";
          nameError.classList.remove('hidden');
        }
        isValid = false;
      }

      // Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const badWords = ['gondon', 'test', 'fake', 'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'pussy', '1234', 'qwerty'];
      const emailVal = emailInput ? emailInput.value.trim().toLowerCase() : '';

      if (!emailVal) {
        if (emailInput) emailInput.classList.add('error');
        if (emailError) {
          emailError.innerText = "Please enter your email";
          emailError.classList.remove('hidden');
        }
        isValid = false;
      } else if (!emailRegex.test(emailVal)) {
        if (emailInput) emailInput.classList.add('error');
        if (emailError) {
          emailError.innerText = "Please enter a valid email address";
          emailError.classList.remove('hidden');
        }
        isValid = false;
      } else if (badWords.some(word => emailVal.includes(word))) {
        if (emailInput) emailInput.classList.add('error');
        if (emailError) {
          emailError.innerText = "Please enter a real email address";
          emailError.classList.remove('hidden');
        }
        isValid = false;
      }

      // Phone Validation
      if (phoneInput && !phoneInput.value.trim()) {
        phoneInput.classList.add('error');
        if (phoneError) {
          phoneError.innerText = "Please enter your phone number";
          phoneError.classList.remove('hidden');
        }
        isValid = false;
      }

      if (!isValid) return;

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
      
      // Generate unique short code (e.g., A8X2-9KMP)
      const generateCode = () => {
        const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${p1}-${p2}`;
      };
      const uniqueCode = generateCode();

      if (spEmail && spSubmit) {
        // Find or inject the code field. Handle standard and base64 names.
        const codeNames = ['sform[code]', 'sform[Y29kZQ==]', 'sform[Q29kZQ==]'];
        codeNames.forEach(fieldName => {
          let spCode = spForm.querySelector(`input[name="${fieldName}"]`);
          if (!spCode) {
            spCode = document.createElement('input');
            spCode.type = 'hidden';
            spCode.name = fieldName;
            spForm.appendChild(spCode);
          }
          spCode.value = uniqueCode;
          spCode.dispatchEvent(new Event('input', { bubbles: true }));
          spCode.dispatchEvent(new Event('change', { bubbles: true }));
        });

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

    const descEl = document.getElementById('jobDescription');
    const respEl = document.getElementById('jobResponsibilities');
    const reqEl = document.getElementById('jobRequirements');

    // Fallback to English if the translation doesn't exist for the current language
    const langToUse = translations[currentLang] && translations[currentLang][`job_desc_${job.id}`] ? currentLang : 'en';

    if (descEl) descEl.innerHTML = translations[langToUse][`job_desc_${job.id}`] || '';
    if (respEl) respEl.innerHTML = translations[langToUse][`job_resp_${job.id}`] || '';
    if (reqEl) reqEl.innerHTML = translations[langToUse][`job_req_${job.id}`] || '';

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

    // Web App URL з Google Apps Script
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZrzNeCf2yhcuv0g8l6NY42MpU9GYSaWtkEISzVOxhtm4wJFgQoUnmp8eZROZkmdcp/exec";

    if (jobApplicationForm) {
      jobApplicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Запобігаємо повторному відправленню
        if (applySubmitBtn.disabled) return;
        applySubmitBtn.disabled = true;
        applySubmitBtn.classList.add('loading');
        applySubmitBtn.style.pointerEvents = 'none';

        const fileInput = document.getElementById('applyCv');
        if (fileInput) fileInput.disabled = true;

        try {
          const fname = document.getElementById('applyFname')?.value.trim();
          const lname = document.getElementById('applyLname')?.value.trim();
          const phone = document.getElementById('applyPhone')?.value.trim();
          const email = document.getElementById('applyEmail')?.value.trim();
          const jobTitle = document.getElementById('jobTitle')?.textContent.trim() || 'General';

          let fileData = null;
          let fileName = null;
          let mimeType = null;

          if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            fileName = file.name;
            mimeType = file.type;
            fileData = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }

          const payload = {
            jobTitle,
            firstName: fname,
            lastName: lname,
            phone,
            email,
            fileName,
            mimeType,
            fileData
          };

          if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "ВСТАВ_СЮДИ_WEB_APP_URL") {
            await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8'
              },
              body: JSON.stringify(payload)
            });
          } else {
            console.warn('Google Script URL is not configured yet.');
          }

          applySubmitBtn.classList.remove('loading');
          jobApplicationForm.style.display = 'none';
          if (applySuccessMsg) applySuccessMsg.classList.remove('hidden');

        } catch (err) {
          console.error('Submission error:', err);
          applySubmitBtn.classList.remove('loading');
          applySubmitBtn.disabled = false;
          applySubmitBtn.style.pointerEvents = '';
          if (fileInput) fileInput.disabled = false;
          alert('Error sending application. Please try again or email us directly.');
        }
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
  const adminNewsList = document.getElementById('adminNewsList');
  let allNewsItems = [];
  let editingNewsId = null;
  let currentEditingImageUrl = null;
  let quillEn, quillEs, quillCa;

  async function loadNews() {
    if (!db) return;
    if (!newsGrid && !adminNewsList) return;
    
    try {
      const q = query(collection(db, "news"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      
      if (newsLoadingSpinner) newsLoadingSpinner.style.display = 'none';
      
      allNewsItems = [];
      querySnapshot.forEach((doc) => {
        allNewsItems.push({
          id: doc.id,
          ...doc.data()
        });
      });

      if (querySnapshot.empty) {
        if (noNewsMessage) noNewsMessage.classList.remove('hidden');
        if (adminNewsList) {
          adminNewsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px 0;">No news articles found.</p>';
        }
        return;
      }
      
      if (newsGrid) {
        renderNews();
      }
      if (adminNewsList) {
        renderAdminNewsList();
      }
    } catch (error) {
      console.error("Error loading news:", error);
      if (newsLoadingSpinner) newsLoadingSpinner.style.display = 'none';
      if (noNewsMessage) {
        noNewsMessage.innerText = "Error loading news. Please try again later.";
        noNewsMessage.classList.remove('hidden');
      }
      if (adminNewsList) {
        adminNewsList.innerHTML = `<p style="text-align: center; color: #d32f2f; padding: 20px 0;">Error loading news: ${error.message}</p>`;
      }
    }
  }

  function renderNews() {
    if (!newsGrid) return;
    newsGrid.innerHTML = '';
    const currentLang = localStorage.getItem('sevenbeans_lang') || 'en';
    
    allNewsItems.forEach(newsItem => {
      const localizedNews = newsItem[currentLang] || newsItem['en'];
      if (!localizedNews) return;

      const card = document.createElement('div');
      card.className = 'news-card';
      
      let imageHtml = '';
      if (newsItem.imageUrl) {
        imageHtml = `<img src="${newsItem.imageUrl}" alt="${localizedNews.title}" class="news-card-image">`;
      }

      card.innerHTML = `
        ${imageHtml}
        <div class="news-card-date">${newsItem.date}</div>
        <h3 class="news-card-title">${localizedNews.title}</h3>
        <div class="news-card-content">${localizedNews.content}</div>
      `;
      newsGrid.appendChild(card);
    });
  }

  function renderAdminNewsList() {
    if (!adminNewsList) return;
    adminNewsList.innerHTML = '';

    allNewsItems.forEach(newsItem => {
      const item = document.createElement('div');
      item.className = 'admin-news-item';
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #eee;';

      const title = newsItem.en?.title || newsItem.es?.title || newsItem.ca?.title || 'Untitled';
      
      item.innerHTML = `
        <div>
          <div style="font-weight: 600; color: #2a1f1a;">${title}</div>
          <div style="font-size: 13px; color: #666;">${newsItem.date}</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm edit-btn" data-id="${newsItem.id}">Edit</button>
          <button class="btn btn-outline btn-sm delete-btn" data-id="${newsItem.id}" style="color: #d32f2f; border-color: #d32f2f; background: transparent;">Delete</button>
        </div>
      `;
      adminNewsList.appendChild(item);
    });

    // Bind Edit and Delete events
    adminNewsList.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        startEditNews(id);
      });
    });

    adminNewsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteNews(id);
      });
    });
  }

  function startEditNews(id) {
    const newsItem = allNewsItems.find(item => item.id === id);
    if (!newsItem) return;

    editingNewsId = id;
    currentEditingImageUrl = newsItem.imageUrl || null;

    // Populate form
    document.getElementById('newsDate').value = newsItem.date || '';
    document.getElementById('newsTitleEn').value = newsItem.en?.title || '';
    document.getElementById('newsTitleEs').value = newsItem.es?.title || '';
    document.getElementById('newsTitleCa').value = newsItem.ca?.title || '';

    // Populate Quill Editors
    if (quillEn) quillEn.root.innerHTML = newsItem.en?.content || '';
    if (quillEs) quillEs.root.innerHTML = newsItem.es?.content || '';
    if (quillCa) quillCa.root.innerHTML = newsItem.ca?.content || '';

    // Image preview
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    if (newsItem.imageUrl) {
      imagePreview.src = newsItem.imageUrl;
      imagePreviewContainer.classList.remove('hidden');
    } else {
      imagePreview.src = '';
      imagePreviewContainer.classList.add('hidden');
    }

    // Update UI elements
    const adminFormTitle = document.getElementById('adminFormTitle');
    const btnPublish = document.getElementById('btnPublish');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    if (adminFormTitle) adminFormTitle.innerText = 'Edit News Article';
    if (btnPublish) btnPublish.innerText = 'Save Changes';
    if (btnCancelEdit) btnCancelEdit.classList.remove('hidden');

    // Scroll to form
    const adminNewsForm = document.getElementById('adminNewsForm');
    if (adminNewsForm) {
      adminNewsForm.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function cancelEditNews() {
    editingNewsId = null;
    currentEditingImageUrl = null;

    const adminNewsForm = document.getElementById('adminNewsForm');
    if (adminNewsForm) adminNewsForm.reset();

    // Reset Quill Editors
    if (quillEn) quillEn.root.innerHTML = '';
    if (quillEs) quillEs.root.innerHTML = '';
    if (quillCa) quillCa.root.innerHTML = '';

    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreviewContainer) {
      imagePreview.src = '';
      imagePreviewContainer.classList.add('hidden');
    }

    const adminFormTitle = document.getElementById('adminFormTitle');
    const btnPublish = document.getElementById('btnPublish');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    if (adminFormTitle) adminFormTitle.innerText = 'Add New Article';
    if (btnPublish) btnPublish.innerText = 'Publish Article';
    if (btnCancelEdit) btnCancelEdit.classList.add('hidden');
  }

  async function deleteNews(id) {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      await deleteDoc(doc(db, "news", id));
      alert("Article deleted successfully.");
      loadNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Error deleting news: " + error.message);
    }
  }

  // Call load news if on news page
  if (newsGrid) {
    loadNews();
    
    document.addEventListener('languageChanged', () => {
      if (allNewsItems.length > 0) {
        renderNews();
      }
    });
  }

  // --- Admin Panel Logic ---
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginScreen = document.getElementById('adminLoginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminNewsForm = document.getElementById('adminNewsForm');
  const loginError = document.getElementById('loginError');

  // Initialize Quill editors if on admin dashboard
  if (adminNewsForm) {
    // Configure Quill to use inline styles instead of class names
    const BackgroundStyle = Quill.import('attributors/style/background');
    Quill.register(BackgroundStyle, true);

    const ColorStyle = Quill.import('attributors/style/color');
    Quill.register(ColorStyle, true);

    const FontStyle = Quill.import('attributors/style/font');
    FontStyle.whitelist = ['arial', 'helvetica'];
    Quill.register(FontStyle, true);

    const toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      [{ 'color': [] }, { 'background': [] }],          // text color and background color
      [{ 'font': [false, 'arial', 'helvetica'] }],      // font selection (false is default)
      ['link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],                 // custom button values
      ['clean']                                         // remove formatting button
    ];

    quillEn = new Quill('#editorEn', {
      modules: { toolbar: toolbarOptions },
      theme: 'snow',
      placeholder: 'Write your news article in English...'
    });

    quillEs = new Quill('#editorEs', {
      modules: { toolbar: toolbarOptions },
      theme: 'snow',
      placeholder: 'Escribe tu noticia en español...'
    });

    quillCa = new Quill('#editorCa', {
      modules: { toolbar: toolbarOptions },
      theme: 'snow',
      placeholder: 'Escriu la teva notícia en català...'
    });
  }

  // Auth State Observer
  if (adminLoginScreen && auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        adminLoginScreen.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        loadNews(); // Load news inside the admin panel!
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

  // Bind Cancel Edit Action
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      cancelEditNews();
    });
  }

  // Publish/Update News Action
  if (adminNewsForm && db) {
    const newsImageInput = document.getElementById('newsImageInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');

    if (newsImageInput) {
      newsImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
          }
          reader.readAsDataURL(file);
        } else {
          imagePreview.src = '';
          imagePreviewContainer.classList.add('hidden');
        }
      });
    }

    adminNewsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnPublish = document.getElementById('btnPublish');
      const publishSuccess = document.getElementById('publishSuccess');
      const publishError = document.getElementById('publishError');
      
      publishSuccess.classList.add('hidden');
      publishError.classList.add('hidden');
      btnPublish.disabled = true;
      btnPublish.innerText = editingNewsId ? "Saving..." : "Publishing...";

      // Validation checking that the English editor is not empty
      const enContentText = quillEn ? quillEn.getText().trim() : '';
      if (!enContentText) {
        publishError.innerText = "Error: English Content is required.";
        publishError.classList.remove('hidden');
        btnPublish.disabled = false;
        btnPublish.innerText = editingNewsId ? "Save Changes" : "Publish Article";
        return;
      }

      try {
        let imageUrl = null;
        if (newsImageInput && newsImageInput.files.length > 0) {
          if (!storage) throw new Error("Firebase Storage is not initialized.");
          const file = newsImageInput.files[0];
          const fileRef = ref(storage, `news_images/${Date.now()}_${file.name}`);
          btnPublish.innerText = "Uploading Image...";
          await uploadBytes(fileRef, file);
          imageUrl = await getDownloadURL(fileRef);
          btnPublish.innerText = editingNewsId ? "Saving..." : "Publishing...";
        }

        const date = document.getElementById('newsDate').value;
        const enTitle = document.getElementById('newsTitleEn').value;
        const enContent = quillEn ? quillEn.root.innerHTML : '';
        const esTitle = document.getElementById('newsTitleEs').value;
        const esContent = quillEs ? quillEs.root.innerHTML : '';
        const caTitle = document.getElementById('newsTitleCa').value;
        const caContent = quillCa ? quillCa.root.innerHTML : '';

        const newsData = {
          date: date,
          timestamp: serverTimestamp(),
          en: { title: enTitle, content: enContent },
          es: { title: esTitle, content: esContent },
          ca: { title: caTitle, content: caContent }
        };

        if (imageUrl) {
          newsData.imageUrl = imageUrl;
        } else if (editingNewsId && currentEditingImageUrl) {
          newsData.imageUrl = currentEditingImageUrl;
        }

        if (editingNewsId) {
          await updateDoc(doc(db, "news", editingNewsId), newsData);
          publishSuccess.innerText = "Article updated successfully!";
        } else {
          await addDoc(collection(db, "news"), newsData);
          publishSuccess.innerText = "Article published successfully!";
        }
        
        btnPublish.innerText = editingNewsId ? "Save Changes" : "Publish Article";
        publishSuccess.classList.remove('hidden');
        
        cancelEditNews();
        loadNews();
        
        setTimeout(() => {
          publishSuccess.classList.add('hidden');
        }, 3000);
      } catch (error) {
        console.error("Error saving news:", error);
        btnPublish.innerText = editingNewsId ? "Save Changes" : "Publish Article";
        publishError.innerText = "Error: " + error.message;
        publishError.classList.remove('hidden');
      } finally {
        btnPublish.disabled = false;
      }
    });
  }
  // ==========================================================================
  // Story Carousel Interactions
  // ==========================================================================
  const storyCarousel = document.querySelector('.story-carousel-container');
  const swipeIndicator = document.querySelector('.swipe-indicator');
  if (storyCarousel && swipeIndicator) {
    const hideIndicator = () => {
      swipeIndicator.classList.add('hidden');
      storyCarousel.removeEventListener('scroll', hideIndicator);
    };
    storyCarousel.addEventListener('scroll', hideIndicator, { passive: true });
  }

});
