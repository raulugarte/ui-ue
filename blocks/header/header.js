/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-globals */
import { getMetadata } from '../../scripts/aem.js';
// import { getActiveAudiences } from '../../scripts/utils.js';
import { loadFragment } from '../fragment/fragment.js';
import authenticate from './auth.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');
const LOGIN_FORM = `<button type="button" aria-label="Login">
<span>Sign in</span>
</button>`;

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

export function decorateNavAuth() {
  const auth = document.getElementsByClassName('nav-auth')[0];
  auth.innerHTML = `<button type="button" id="logout" aria-label="Login">
            <span>Sign out</span>
          </button>`;
  const logoutButton = auth.children[0];
  logoutButton.addEventListener('click', () => {
    auth.innerHTML = LOGIN_FORM;
    window.localStorage.removeItem('auth');
    location.reload();
  });
}





// --- Sprachwahl: Konfiguration & Utilities ---
const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  // { code: 'fr', label: 'Français' },
];

// Ermittelt die aktuelle Sprache: bevorzugt das Segment nach "language-masters"
function getCurrentLocaleCode() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const lmIdx = parts.indexOf('language-masters');
  if (lmIdx !== -1 && parts[lmIdx + 1]) {
    const candidate = parts[lmIdx + 1];
    if (LOCALES.some(l => l.code === candidate)) return candidate;
  }
  // Fallback: erste Pfadkomponente als evtl. Sprachcode
  const first = parts[0] || '';
  const found = LOCALES.find(l => l.code === first);
  return found ? found.code : LOCALES[0].code;
}

// Baut die Ziel-URL: ersetzt/fügt den Sprachcode hinter "language-masters" ein
function buildLocalizedUrl(targetCode) {
  const url = new URL(window.location.href);
  const parts = url.pathname.split('/').filter(Boolean);

  const lmIdx = parts.indexOf('language-masters');
  if (lmIdx !== -1) {
    const langIdx = lmIdx + 1;
    if (parts[langIdx]) {
      parts[langIdx] = targetCode;
    } else {
      parts.splice(langIdx, 0, targetCode);
    }
    url.pathname = '/' + parts.join('/');
    return url.toString();
  }

  // Fallback (kein language-masters im Pfad)
  if (parts[0] && LOCALES.some(l => l.code === parts[0])) {
    parts[0] = targetCode;
  } else {
    parts.unshift(targetCode);
  }
  url.pathname = '/' + parts.join('/');
  return url.toString();
}

function createLanguageSwitcher() {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';

  const label = document.createElement('label');
  label.setAttribute('for', 'locale-select');
  label.className = 'visually-hidden';
  label.textContent = 'Sprache auswählen';

  const select = document.createElement('select');
  select.id = 'locale-select';
  select.setAttribute('aria-label', 'Sprache');

  const current = getCurrentLocaleCode();
  LOCALES.forEach(({ code, label: optionLabel }) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = optionLabel;
    if (code === current) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const target = e.target.value;
    window.location.href = buildLocalizedUrl(target);
  });

  wrapper.append(label, select);
  return wrapper;
}










/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
    brandLink.querySelector('img').setAttribute('alt', 'logo');
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // login section
  const auth = document.createElement('div');
  auth.classList.add('nav-auth');
  // console.log(getActiveAudiences());
  
  
// >>> NEU: Sprachwahl-Element erzeugen und zusammen mit auth in .nav-tools einhängen
const toolsContainer = nav.querySelector('.nav-tools') || nav;
const localeSwitcher = createLanguageSwitcher();
toolsContainer.append(localeSwitcher);

  
  
  if (window.localStorage.getItem('auth') === null) {
    auth.innerHTML = LOGIN_FORM;
    auth.addEventListener('click', () => {
      const loginForm = document.getElementsByClassName('login-form')[0];
      loginForm.style.display = 'block';
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('userName').value;
        const password = document.getElementById('password').value;

        authenticate(username, password).then((user) => {
          // console.log(user);
          const auth = document.getElementsByClassName('nav-auth')[0];
          auth.innerHTML = `<button type="button" id="logout" aria-label="Login">
            <span>Sign out</span>
          </button>`;
          const logoutButton = document.getElementById('logout');
          logoutButton.addEventListener('click', () => {
            auth.innerHTML = LOGIN_FORM;
            window.localStorage.removeItem('auth');
            const loginForm = document.getElementsByClassName('login-form')[0];
            loginForm.style.display = 'none';
          });
        });
        // handle submit
      });
    });
  } else {
    auth.innerHTML = `<button type="button" id="logout" aria-label="Login">
            <span>Sign out</span>
          </button>`;
    const logoutButton = auth.children[0];
    logoutButton.addEventListener('click', () => {
      window.localStorage.removeItem('auth');
      location.reload();
    });
  }

  //RUG  nav.append(auth);

	
// Wichtig: auth in den Tools-Container, nicht direkt an nav
toolsContainer.append(auth);



  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
