/* 숫자 비율(1:1, 1:10 등)·시각(07:00)이 줄 끝에서 끊기지 않게 한 덩어리로 묶기.
   아이폰 사파리는 '끊김 방지 문자'를 무시하고 "1:" 뒤에서 줄을 바꾸기 때문에, 요소로 감싸는 방식으로 막습니다.
   글자 내용은 그대로이고 보이는 모양도 같습니다. */
(function(){
  var RE=/\d{1,3}:⁠?\d{1,3}/g;
  var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,CODE:1,PRE:1,NOSCRIPT:1,SELECT:1,OPTION:1,TITLE:1,SVG:1};
  function wrapIn(root){
    if(!root||(root.nodeType!==1&&root.nodeType!==9))return;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n,list=[];
    while((n=w.nextNode())){
      if(n.nodeValue.indexOf(':')<0)continue;
      var p=n.parentNode;
      if(!p||SKIP[(p.nodeName||'').toUpperCase()]||p.isContentEditable)continue;
      if(p.classList&&p.classList.contains('nbr'))continue;
      RE.lastIndex=0;if(RE.test(n.nodeValue))list.push(n);
    }
    list.forEach(function(n){
      var t=n.nodeValue,frag=document.createDocumentFragment(),last=0,m;RE.lastIndex=0;
      while((m=RE.exec(t))){
        if(m.index>last)frag.appendChild(document.createTextNode(t.slice(last,m.index)));
        var s=document.createElement('span');s.className='nbr';s.style.whiteSpace='nowrap';
        s.textContent=m[0].replace(/⁠/g,'');frag.appendChild(s);last=m.index+m[0].length;
      }
      if(last<t.length)frag.appendChild(document.createTextNode(t.slice(last)));
      if(n.parentNode)n.parentNode.replaceChild(frag,n);
    });
  }
  var pending=[],timer=null;
  function flush(){timer=null;var l=pending;pending=[];for(var i=0;i<l.length;i++){if(l[i].isConnected)wrapIn(l[i]);}}
  function init(){
    wrapIn(document.body);
    try{new MutationObserver(function(ms){
      for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++){if(a[j].nodeType===1)pending.push(a[j]);}}
      if(pending.length&&!timer)timer=setTimeout(flush,80);
    }).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
