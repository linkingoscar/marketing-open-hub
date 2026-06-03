(function () {
  'use strict';

  var STORAGE_KEY = 'mth-lang';
  var currentLang = localStorage.getItem(STORAGE_KEY) || 'zh';

  // ===== Language Toggle =====
  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    // Update nav toggle buttons (desktop + mobile)
    var btns = document.querySelectorAll('.lang-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var text = b.getAttribute('data-' + lang);
      b.textContent = text || (lang === 'zh' ? 'EN' : '中文');
    }

    // Update all data-en / data-zh elements
    var elements = document.querySelectorAll('[data-en][data-zh]');
    for (var j = 0; j < elements.length; j++) {
      var el = elements[j];
      var val = el.getAttribute('data-' + lang);
      if (val !== null) {
        el.textContent = val;
      }
    }

    // Update page title
    if (lang === 'en') {
      document.title = 'MarTech Open Hub — Marketing Research Platform';
    } else {
      document.title = 'MarTech Open Hub — 市场营销开源项目发现与实证分析平台';
    }
  }

  window.toggleLang = function () {
    applyLang(currentLang === 'zh' ? 'en' : 'zh');
  };

  // ===== Mobile Menu =====
  window.toggleMobileMenu = function () {
    var menu = document.getElementById('mobile-menu');
    menu.classList.toggle('active');
  };

  // Close mobile menu on link click
  var mobileLinks = document.querySelectorAll('.nav-mobile a');
  for (var m = 0; m < mobileLinks.length; m++) {
    mobileLinks[m].addEventListener('click', function () {
      document.getElementById('mobile-menu').classList.remove('active');
    });
  }

  // ===== Counter Animation =====
  function animateCounters() {
    var counters = document.querySelectorAll('[data-count]');
    for (var i = 0; i < counters.length; i++) {
      var el = counters[i];
      if (el.classList.contains('counted')) continue;

      var rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) continue;

      el.classList.add('counted');
      var target = parseInt(el.getAttribute('data-count'), 10);
      var duration = 1200;
      var startTime = performance.now();

      (function (elem, tgt, dur, start) {
        function tick(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / dur, 1);
          // Ease out cubic
          var eased = 1 - Math.pow(1 - progress, 3);
          elem.textContent = Math.round(eased * tgt);
          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      })(el, target, duration, startTime);
    }
  }

  // ===== Scroll Reveal =====
  function revealOnScroll() {
    var reveals = document.querySelectorAll('.reveal');
    for (var i = 0; i < reveals.length; i++) {
      var el = reveals[i];
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        el.classList.add('visible');
      }
    }
  }

  // ===== Nav scroll effect =====
  var nav = document.querySelector('.nav');
  function navScroll() {
    if (window.scrollY > 20) {
      nav.style.background = 'rgba(8,8,13,0.92)';
    } else {
      nav.style.background = 'rgba(8,8,13,0.8)';
    }
  }

  // ===== Init =====
  function onScroll() {
    animateCounters();
    revealOnScroll();
    navScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Run on load
  applyLang(currentLang);
  onScroll();
})();
