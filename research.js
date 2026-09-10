(() => {
  const grid = document.querySelector('.research-grid');
  const search = document.getElementById('article-search');
  const sort = document.getElementById('article-sort');
  const filters = [...document.querySelectorAll('[data-theme-filter]')];
  const cards = grid ? [...grid.children] : [];
  let theme = 'All';
  function updateCollection() {
    const query = (search?.value || '').toLowerCase().trim();
    const ordered = [...cards].sort((a,b) => {
      if(sort?.value==='title')return a.dataset.title.localeCompare(b.dataset.title);
      if(sort?.value==='theme')return a.dataset.theme.localeCompare(b.dataset.theme)||Number(a.dataset.number)-Number(b.dataset.number);
      if(sort?.value==='shortest')return Number(a.dataset.minutes)-Number(b.dataset.minutes)||Number(a.dataset.number)-Number(b.dataset.number);
      return Number(a.dataset.number)-Number(b.dataset.number);
    });
    let count=0;
    for(const card of ordered) {
      card.hidden = (theme!=='All' && card.dataset.theme!==theme) || !card.dataset.title.toLowerCase().includes(query);
      if(!card.hidden) count++;
      grid.append(card);
    }
    const counter=document.querySelector('.results-count');
    if(counter)counter.textContent=`${count} ${count===1?'article':'articles'}${theme==='All'?'':` in ${theme}`}`;
    const empty=document.querySelector('.no-results');
    if(empty)empty.hidden=count!==0;
  }
  filters.forEach(button=>button.addEventListener('click',()=>{
    theme=button.dataset.themeFilter;
    filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    updateCollection();
  }));
  search?.addEventListener('input',updateCollection);
  sort?.addEventListener('change',updateCollection);
  document.querySelector('[data-clear-filters]')?.addEventListener('click',()=>{
    theme='All';search.value='';sort.value='editorial';
    filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeFilter==='All')));
    updateCollection();search.focus();
  });

  const drawer=document.querySelector('.reader-drawer');
  const content=drawer?.querySelector('.reader-content');
  let opener=null;
  function openArticle(id, changeHistory=true) {
    const template=document.getElementById(`article-${id}`);
    if(!drawer||!template||!drawer.showModal)return false;
    const wasOpen=drawer.open;
    if(!wasOpen)opener=document.activeElement;
    content.replaceChildren(template.content.cloneNode(true));
    const heading=content.querySelector('.article-heading h1');
    if(heading){heading.id='reader-title';drawer.setAttribute('aria-labelledby','reader-title');}
    if(!wasOpen)drawer.showModal();
    document.body.classList.add('reader-open');
    drawer.scrollTop=0;
    if(changeHistory) {
      const next={matocReader:wasOpen ? Boolean(history.state?.matocReader) : true,article:id};
      if(wasOpen)history.replaceState(next,'',`#post-${id}`);
      else history.pushState(next,'',`#post-${id}`);
    }
    drawer.querySelector('[data-close-reader]').focus({preventScroll:true});
    return true;
  }
  function dismiss() {
    if(drawer?.open)drawer.close();
    document.body.classList.remove('reader-open');
    if(opener?.isConnected)opener.focus({preventScroll:true});
  }
  function requestClose() {
    if(history.state?.matocReader)history.back();
    else {history.replaceState(null,'',location.pathname+location.search);dismiss();}
  }
  function syncArticle() {
    const match=location.hash.match(/^#post-(\d+)$/);
    if(match&&document.getElementById(`article-${match[1]}`))openArticle(match[1],false);
    else dismiss();
  }
  document.addEventListener('click', async event=>{
    const link=event.target.closest('a[data-open-article]');
    if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0) {
      if(document.getElementById(`article-${link.dataset.openArticle}`)&&drawer?.showModal) {
        event.preventDefault();openArticle(link.dataset.openArticle);
      }
      return;
    }
    if(event.target.closest('[data-close-reader]'))requestClose();
    const copy=event.target.closest('[data-copy-link]');
    if(copy) {
      const status=copy.closest('.reading-actions').querySelector('[data-reader-status]');
      const url=new URL(copy.dataset.copyLink,location.href).href;
      try {await navigator.clipboard.writeText(url);status.textContent='Article link copied.';}
      catch {status.replaceChildren();const fallback=document.createElement('a');fallback.href=url;fallback.textContent='Open the article to copy its address.';status.append(fallback);}
    }
    const size=event.target.closest('[data-text-size]');
    if(size) {
      const article=size.closest('.research-article');
      const enlarged=article.classList.toggle('is-large');
      size.setAttribute('aria-pressed',String(enlarged));size.textContent=enlarged?'Standard text':'Larger text';
    }
    if(event.target.closest('[data-print]'))window.print();
  });
  drawer?.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
  drawer?.addEventListener('click',event=>{
    if(event.target===drawer) {const bounds=drawer.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right)requestClose();}
  });
  drawer?.addEventListener('close',()=>document.body.classList.remove('reader-open'));
  addEventListener('popstate',syncArticle);
  addEventListener('hashchange',syncArticle);
  if(location.hash==='#findings') {
    theme='Research Findings';
    filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeFilter===theme)));
    updateCollection();
  }
  syncArticle();
})();
