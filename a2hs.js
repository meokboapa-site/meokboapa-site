/* 홈 화면에 추가 안내 — 정적 페이지는 '앱 열기' 버튼 아래 카드, 앱 본체는 하단 배너(닫으면 14일 숨김) */
(function(){
  try{
    if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(function(){}); }
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if(standalone) return;
    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/i.test(ua);
    if(!isIOS && !isAndroid) return; /* PC에서는 안 보여요 */
    var inApp = /Instagram|Barcelona|FBAN|FBAV|KAKAOTALK|NAVER\(|Line\/|DaumApps|everytimeApp/i.test(ua);
    var iosNotSafari = isIOS && /CriOS|FxiOS|EdgiOS|Whale/i.test(ua);
    var path = location.pathname;
    var isApp = (path === '/' || path === '/index.html' || path.indexOf('/app') === 0);
    var deferred = null;
    var ga = function(n,p){ try{ if(window.gtag){ p = p || {}; p.page = path; gtag('event', n, p); } }catch(e){} };

    var css = '.a2hs{display:flex;gap:12px;align-items:center;background:#fff;border:1.5px solid #E7DFD0;border-radius:16px;padding:13px 14px;margin:12px 0 18px;font-family:inherit;word-break:keep-all}'
      + '.a2hs img{width:44px;height:44px;border-radius:11px;flex:0 0 44px}'
      + '.a2hs .tx{flex:1;min-width:0}.a2hs b{display:block;font-size:14.5px;color:#2E2B24;line-height:1.35}.a2hs small{display:block;font-size:12.5px;color:#6B6558;margin-top:2px;line-height:1.4}'
      + '.a2hs button{flex:0 0 auto;border:0;background:#4B6B54;color:#fff;font-weight:800;font-size:13.5px;padding:10px 13px;border-radius:12px;font-family:inherit}'
      + '.a2hs-steps{display:none;font-size:13px;color:#34493B;background:#EAF1E9;border-radius:12px;padding:10px 13px;margin:-8px 0 18px;line-height:1.65;word-break:keep-all}'
      + '.a2hs-bar{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:90;margin:0;box-shadow:0 8px 24px rgba(40,30,20,.18)}'
      + '.a2hs-x{position:absolute;top:-9px;right:-6px;width:26px;height:26px;border-radius:50%;background:#6B6558 !important;color:#fff;font-size:14px !important;padding:0 !important;line-height:26px}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var steps;
    if(inApp){ steps = '지금은 앱 안의 브라우저라 바로 추가가 안 돼요.<br>① 오른쪽 위 <b>···</b> 메뉴 → <b>외부 브라우저로 열기</b><br>② ' + (isIOS ? 'Safari 아래 <b>공유 버튼(□↑)</b> → <b>홈 화면에 추가</b>' : 'Chrome 메뉴 <b>⋮</b> → <b>홈 화면에 추가</b>'); }
    else if(isIOS){ steps = iosNotSafari ? '아이폰은 <b>Safari</b>에서만 추가돼요. 이 주소를 Safari로 열어 주세요.<br>그다음 아래 <b>공유 버튼(□↑)</b> → <b>홈 화면에 추가</b>' : '① 화면 아래 <b>공유 버튼(□↑)</b>을 눌러요<br>② 목록을 내려 <b>홈 화면에 추가</b> → <b>추가</b>'; }
    else { steps = '브라우저 메뉴 <b>⋮</b> → <b>홈 화면에 추가</b> (또는 <b>앱 설치</b>)'; }

    function build(asBar){
      var box = document.createElement('div'); box.className = 'a2hs' + (asBar ? ' a2hs-bar' : '');
      box.innerHTML = '<img src="/icons/icon-192.png" alt=""><div class="tx"><b>홈 화면에 추가하면 앱처럼 열려요</b><small>식단표·레시피를 다시 검색할 필요 없이 한 번에</small></div><button type="button" class="go">추가하기</button>' + (asBar ? '<button type="button" class="a2hs-x" aria-label="닫기">✕</button>' : '');
      var sp = document.createElement('div'); sp.className = 'a2hs-steps'; sp.innerHTML = steps;
      if(asBar){ sp.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(90px + env(safe-area-inset-bottom));z-index:91;margin:0;box-shadow:0 8px 24px rgba(40,30,20,.15)'; }
      box.querySelector('.go').addEventListener('click', function(){
        ga('a2hs_click', {mode: deferred ? 'prompt' : (inApp ? 'inapp' : (isIOS ? 'ios' : 'manual'))});
        if(deferred){ deferred.prompt(); deferred.userChoice.then(function(c){ ga('a2hs_choice', {outcome: c && c.outcome}); deferred = null; }).catch(function(){}); return; }
        sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
      });
      if(asBar){ box.querySelector('.a2hs-x').addEventListener('click', function(){ box.remove(); sp.remove(); try{ localStorage.setItem('a2hs_hide', String(Date.now())); }catch(e){} ga('a2hs_close'); }); }
      return [box, sp];
    }

    window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; });
    window.addEventListener('appinstalled', function(){ ga('a2hs_installed'); document.querySelectorAll('.a2hs,.a2hs-steps').forEach(function(n){ n.remove(); }); });

    function mount(){
      if(isApp){
        var hidden = 0; try{ hidden = +(localStorage.getItem('a2hs_hide') || 0); }catch(e){}
        if(hidden && Date.now() - hidden < 14*864e5) return;
        var tryShow = function(){ var mo = document.getElementById('modalOverlay'); if(mo && mo.classList.contains('open')){ setTimeout(tryShow, 5000); return; } var p = build(true); document.body.appendChild(p[1]); document.body.appendChild(p[0]); ga('a2hs_show', {where:'app'}); }; setTimeout(tryShow, 20000);
        return;
      }
      var anchor = document.querySelector('a.cta[href="https://meokboapa.com/"]') || document.querySelector('nav.sitelinks') || document.querySelector('footer');
      if(!anchor) return;
      var p = build(false);
      if(anchor.matches && anchor.matches('a.cta')){ anchor.insertAdjacentElement('afterend', p[0]); p[0].insertAdjacentElement('afterend', p[1]); }
      else { anchor.parentNode.insertBefore(p[0], anchor); anchor.parentNode.insertBefore(p[1], anchor); }
      ga('a2hs_show', {where:'page'});
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  }catch(e){}
})();
