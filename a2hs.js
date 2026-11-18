/* 홈 화면에 추가 안내 — 정적 페이지는 '앱 열기' 버튼 아래 카드, 앱 본체는 하단 배너(닫으면 14일 숨김) */
(function(){
  try{
    if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(function(){}); }
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if(standalone) return;
    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/i.test(ua);
    if(!isIOS && !isAndroid){ /* PC: 폰 앱 다운로드 안내 카드 (접속할 때마다, 닫으면 그 페이지에서만 사라져요) */
      var ga = function(n,p){ try{ if(window.gtag){ p = p || {}; p.page = location.pathname; gtag('event', n, p); } }catch(e){} };
      var pcMount = function(){
        if(document.querySelector('.pc-app')) return;
        var s = document.createElement('style');
        s.textContent = '.pc-app{position:fixed;right:20px;bottom:20px;z-index:90;width:min(340px,calc(100vw - 24px));background:#fff;border:1.5px solid #E7DFD0;border-radius:18px;padding:16px 16px 14px;box-shadow:0 10px 30px rgba(40,30,20,.2);font-family:inherit;word-break:keep-all;color:#2E2B24}'
          + '.pc-app .hd{display:flex;gap:11px;align-items:center}.pc-app img{width:44px;height:44px;border-radius:11px;flex:0 0 44px}'
          + '.pc-app b{display:block;font-size:15px;line-height:1.35}.pc-app small{display:block;font-size:12.5px;color:#6B6558;margin-top:2px;line-height:1.4}'
          + '.pc-app .bt{display:flex;flex-direction:column;gap:8px;margin-top:13px}'
          + '.pc-app .bt a{display:block;text-align:center;text-decoration:none;font-weight:800;font-size:13.5px;padding:11px 12px;border-radius:12px;font-family:inherit}'
          + '.pc-app .ios{background:#4B6B54;color:#fff}.pc-app .and{background:#F4EFE3;color:#4A4637;border:1px solid #E7DFD0}'
          + '.pc-app .and span{font-weight:600;font-size:12px;color:#6B6558}'
          + '.pc-app .x{position:absolute;top:-9px;right:-7px;width:26px;height:26px;border-radius:50%;border:0;background:#6B6558;color:#fff;font-size:14px;line-height:26px;padding:0;cursor:pointer}';
        document.head.appendChild(s);
        var b = document.createElement('div'); b.className = 'pc-app';
        b.innerHTML = '<button type="button" class="x" aria-label="닫기">✕</button><div class="hd"><img src="/icons/icon-192.png" alt=""><div><b>이유식노트 앱이 나왔어요</b><small>휴대폰에서 앱으로 받으면 더 편해요</small></div></div>'
          + '<div class="bt"><a class="ios" href="https://apps.apple.com/kr/app/id6834141266" target="_blank" rel="noopener">앱스토어에서 받기 (아이폰)</a>'
          + '<a class="and" href="/tester/">Google Play 준비 중 <span>· 테스터 참여하기</span></a></div>';
        b.querySelector('.ios').addEventListener('click', function(){ ga('appstore_click', {where:'pc'}); });
        b.querySelector('.and').addEventListener('click', function(){ ga('tester_click', {where:'pc'}); });
        b.querySelector('.x').addEventListener('click', function(){ b.remove(); ga('appstore_close', {where:'pc'}); });
        setTimeout(function(){ if(!document.body) return; document.body.appendChild(b); ga('appstore_show', {where:'pc'}); }, 1000);
      };
      if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pcMount); else pcMount();
      return;
    }
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

    /* 아이폰: 앱스토어 정식 앱이 나왔으니 '홈 화면에 추가' 안내 대신 앱스토어 카드 (앱은 아이폰 전용, 아이패드는 기존 안내 유지) */
    var APPSTORE_URL = 'https://apps.apple.com/kr/app/id6834141266';
    var isIphone = /iPhone|iPod/i.test(ua);
    function buildStore(asBar){
      var box = document.createElement('div'); box.className = 'a2hs' + (asBar ? ' a2hs-bar' : ''); if(!asBar) box.style.position = 'relative';
      box.innerHTML = '<img src="/icons/icon-192.png" alt=""><div class="tx"><b>이유식노트 앱 · 무료</b><small>시기별 메뉴, 99가지 재료도감, 필요한 알림까지 폰에서 바로</small></div><a class="go" href="' + APPSTORE_URL + '" style="flex:0 0 auto;background:#4B6B54;color:#fff;font-weight:800;font-size:13.5px;padding:10px 13px;border-radius:12px;text-decoration:none;font-family:inherit">앱 받기</a><button type="button" class="a2hs-x" aria-label="닫기">✕</button>';
      box.querySelector('.go').addEventListener('click', function(){ ga('appstore_click', {where: asBar ? 'app' : 'page'}); });
      box.querySelector('.a2hs-x').addEventListener('click', function(){ box.remove(); ga('appstore_close'); });
      var sp = document.createElement('div'); sp.style.display = 'none';
      return [box, sp];
    }

    function build(asBar){
      if(isIphone) return buildStore(asBar);
      var box = document.createElement('div'); box.className = 'a2hs' + (asBar ? ' a2hs-bar' : '');
      box.innerHTML = '<img src="/icons/icon-192.png" alt=""><div class="tx"><b>' + (isIOS ? '홈 화면에 추가하기' : '홈 화면에 추가하면 앱처럼 열려요') + '</b><small>' + (isIOS ? '앱스토어 출시를 준비하고 있어요' : '식단표·레시피를 다시 검색할 필요 없이 한 번에') + '</small></div><button type="button" class="go">추가하기</button>' + (asBar ? '<button type="button" class="a2hs-x" aria-label="닫기">✕</button>' : '');
      var sp = document.createElement('div'); sp.className = 'a2hs-steps'; sp.innerHTML = steps;
      if(asBar){ sp.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(90px + env(safe-area-inset-bottom));z-index:91;margin:0;box-shadow:0 8px 24px rgba(40,30,20,.15)'; }
      box.querySelector('.go').addEventListener('click', function(){
        ga('a2hs_click', {mode: deferred ? 'prompt' : (inApp ? 'inapp' : (isIOS ? 'ios' : 'manual'))});
        if(deferred){ deferred.prompt(); deferred.userChoice.then(function(c){ ga('a2hs_choice', {outcome: c && c.outcome}); deferred = null; }).catch(function(){}); return; }
        if(isIOS && !inApp && !iosNotSafari && navigator.share){
          /* 아이폰 Safari는 '홈 화면에 추가' 창을 코드로 직접 못 열어요 → 공유창을 바로 띄우고 한 줄만 안내 */
          sp.innerHTML = '공유창에서 <b>홈 화면에 추가</b>를 눌러 주세요 (목록을 조금 내려요)';
          sp.style.display = 'block';
          setTimeout(function(){ sp.style.display = 'none'; }, 9000);
          try{ navigator.share({title: document.title, url: location.href}).catch(function(){}); }catch(e){}
          return;
        }
        sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
      });
      if(asBar){ box.querySelector('.a2hs-x').addEventListener('click', function(){ box.remove(); sp.remove(); try{ localStorage.setItem('a2hs_hide', String(Date.now())); }catch(e){} ga('a2hs_close'); }); }
      return [box, sp];
    }

    window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; });
    window.addEventListener('appinstalled', function(){ ga('a2hs_installed'); document.querySelectorAll('.a2hs,.a2hs-steps').forEach(function(n){ n.remove(); }); });

    /* 안드로이드 앱 테스터 모집 배너 — 앱 홈에서만, 안드로이드만, 닫으면 7일 숨김. 정식 출시되면 이 블록을 지우거나 TESTER_UNTIL 날짜가 지나면 사라져요 */
    var TESTER_UNTIL = new Date('2027-03-01T00:00:00+09:00').getTime();
    function testerBar(){
      var hid = 0; try{ hid = +(localStorage.getItem('tester_hide') || 0); }catch(e){}
      if(hid && Date.now() - hid < 3*864e5) return false;
      var box = document.createElement('div'); box.className = 'a2hs a2hs-bar';
      box.innerHTML = '<img src="/icons/icon-192.png" alt=""><div class="tx"><b>안드로이드 앱 테스터를 모아요</b><small>14일 동안 계속 설치해 두실 분을 찾아요. 그룹에 가입하면 출시 때 설치 링크를 보내드려요</small></div><button type="button" class="go">그룹 가입</button><button type="button" class="a2hs-x" aria-label="닫기">✕</button>';
      box.querySelector('.go').addEventListener('click', function(){ ga('tester_click'); location.href = '/tester/'; });
      box.querySelector('.a2hs-x').addEventListener('click', function(){ box.remove(); try{ localStorage.setItem('tester_hide', String(Date.now())); }catch(e){} ga('tester_close'); });
      var tryShow = function(){ var mo = document.getElementById('modalOverlay'); if(mo && mo.classList.contains('open')){ setTimeout(tryShow, 2000); return; } document.body.appendChild(box); ga('tester_show'); };
      setTimeout(tryShow, 1000);
      return true;
    }

    /* 앱 홈이 아닌 일반 페이지(메뉴·가이드 등)에서도 안드로이드에게는 '홈 화면에 추가' 카드 대신 테스터 모집 카드 — 닫으면 3일 숨김 */
    function testerCard(anchor){
      var hid = 0; try{ hid = +(localStorage.getItem('tester_hide') || 0); }catch(e){}
      if(hid && Date.now() - hid < 3*864e5) return false;
      var box = document.createElement('div'); box.className = 'a2hs'; box.style.position = 'relative';
      box.innerHTML = '<img src="/icons/icon-192.png" alt=""><div class="tx"><b>안드로이드 앱 테스터를 모아요</b><small>14일 동안 설치만 해 두실 분을 찾아요. 그룹에 가입하면 출시 때 설치 링크를 보내드려요</small></div><button type="button" class="go">그룹 가입</button><button type="button" class="a2hs-x" aria-label="닫기">✕</button>';
      box.querySelector('.go').addEventListener('click', function(){ ga('tester_click', {where:'page'}); location.href = '/tester/'; });
      box.querySelector('.a2hs-x').addEventListener('click', function(){ box.remove(); try{ localStorage.setItem('tester_hide', String(Date.now())); }catch(e){} ga('tester_close', {where:'page'}); });
      if(anchor.matches && anchor.matches('a.cta')){ anchor.insertAdjacentElement('afterend', box); }
      else { anchor.parentNode.insertBefore(box, anchor); }
      ga('tester_show', {where:'page'});
      return true;
    }

    function mount(){
      if(isApp && isAndroid && Date.now() < TESTER_UNTIL && testerBar()) return;
      if(isApp){
        var hidden = 0, hideDays = 14; try{ if(isIphone){ hidden = 0; } else { hidden = +(localStorage.getItem('a2hs_hide') || 0); } }catch(e){}
        if(hidden && Date.now() - hidden < hideDays*864e5) return;
        var tryShow = function(){ var mo = document.getElementById('modalOverlay'); if(mo && mo.classList.contains('open')){ setTimeout(tryShow, 2000); return; } var p = build(true); document.body.appendChild(p[1]); document.body.appendChild(p[0]); ga(isIphone ? 'appstore_show' : 'a2hs_show', {where:'app'}); }; setTimeout(tryShow, 1000);
        return;
      }
      var anchor = document.querySelector('a.cta[href="https://meokboapa.com/"]') || document.querySelector('nav.sitelinks') || document.querySelector('footer');
      if(!anchor) return;
      if(isAndroid && Date.now() < TESTER_UNTIL && path.indexOf('/tester') !== 0 && testerCard(anchor)) return;
      var p = build(false);
      /* 아이폰: 글 맨 아래까지 내려가는 사람이 적어서, 첫 문단(lede) 바로 아래에 앱스토어 카드를 둠 */
      var lede = isIphone ? (document.querySelector('.wrap > p.lede') || document.querySelector('.wrap > .faq-a')) : null;
      if(lede){ lede.insertAdjacentElement('afterend', p[0]); p[0].style.margin = '0 0 18px'; ga('appstore_show', {where:'page_top'}); return; }
      if(anchor.matches && anchor.matches('a.cta')){ anchor.insertAdjacentElement('afterend', p[0]); p[0].insertAdjacentElement('afterend', p[1]); }
      else { anchor.parentNode.insertBefore(p[0], anchor); anchor.parentNode.insertBefore(p[1], anchor); }
      ga(isIphone ? 'appstore_show' : 'a2hs_show', {where:'page'});
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  }catch(e){}
})();
