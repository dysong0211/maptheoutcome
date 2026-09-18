/* Keep dialogs inside the visible part of the embedded app. */
(() => {
  const host = window.frameElement;
  if (!host) return;
  let previousDialog = null;
  const revealDialog = () => {
    const dialog = document.querySelector('[role="dialog"][data-state="open"]');
    if (dialog && dialog !== previousDialog) {
      host.scrollIntoView({block: 'start', behavior: 'instant'});
    }
    previousDialog = dialog;
  };
  new MutationObserver(revealDialog).observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['data-state']
  });
  revealDialog();
})();
