(() => {
  'use strict';
  const KEY = '__fjInvoiceDisplayV9', STORAGE = 'fj-invoice-display-preferences-v2';
  if (window[KEY]) return;
  const names = ['购买方地址', '购方开户银行', '销售方地址', '销方开户银行'];
  const skipNotice = '自动跳过提示';
  const multiline = '项目名称多行显示';
  const optionsNames = [...names, skipNotice, multiline];
  const normalize = text => (text || '').replace(/\s+/g, '');
  const active = () => location.protocol === 'https:' && location.hostname === 'dppt.fujian.chinatax.gov.cn' && location.port === '8443' && location.pathname.replace(/\/$/, '') === '/blue-invoice-makeout/invoice-makeout';
  let prefs = Object.fromEntries(optionsNames.map(name => [name, false]));
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    for (const name of optionsNames) if (typeof saved?.[name] === 'boolean') prefs[name] = saved[name];
  } catch { /* Storage unavailable: retain usable in-memory settings. */ }
  let timer, host, root;
  let syncing = false;
  const attempts = new WeakMap(), controls = new Map();
  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(prefs)); return true; }
    catch { return false; }
  }
  function mount() {
    const account = document.querySelector('.g-layout__header .user-info');
    if (!account) return;
    if (host?.isConnected && host.parentElement === account) return;
    if (host) host.remove();
    host = document.createElement('div');
    host.id = 'fj-invoice-display-settings';
    root = host.attachShadow({mode: 'open'});
    const el = (tag, text) => {
      const node = document.createElement(tag);
      if (text) node.textContent = text;
      return node;
    };
    const style = el('style', `
      :host{all:initial;display:inline-flex;position:relative;flex-shrink:0;margin-right:24px;vertical-align:middle;font:14px/1.5 system-ui,sans-serif;color:#202939;z-index:1000}
      *{box-sizing:border-box}button{font:inherit;cursor:pointer;border:1px solid #ffffffa0;border-radius:6px;padding:7px 14px;background:transparent;color:white;white-space:nowrap}button:hover{background:#ffffff20}button:focus-visible,input:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}
      section{position:absolute;right:0;top:calc(100% + 12px);width:290px;padding:18px;background:white;border:1px solid #dce3ec;border-radius:10px;box-shadow:0 8px 32px #0003;white-space:normal;text-align:left}section[hidden]{display:none}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}strong{font-size:16px}header button{background:#eef2f7;color:#334155;padding:2px 9px;border:0}label{display:flex;align-items:center;gap:10px;padding:9px 0;cursor:pointer}input{width:17px;height:17px;accent-color:#2563eb;margin:0}p{font-size:12px;color:#64748b;margin:12px 0 0}
      @media(max-width:700px){:host{margin-right:10px}#toggle{padding:6px 8px}section{width:260px}}
    `);
    const panel = el('section'); panel.hidden = true;
    panel.setAttribute('aria-label', '插件展示设置');
    const heading = el('header'), title = el('strong', '插件展示设置');
    const closeButton = el('button', '×'); closeButton.type = 'button'; closeButton.setAttribute('aria-label', '关闭设置');
    heading.append(title, closeButton);
    const options = el('div'), description = el('p', '四个展示选项分别控制页面勾选状态；开启“自动跳过提示”后自动点击该展示提示的“我知道了”。“项目名称多行显示”可切换多行编辑框。所有选项默认关闭，修改后立即保存。');
    const status = el('p'); status.setAttribute('role', 'status');
    const toggle = el('button', '插件展示设置'); toggle.type = 'button'; toggle.id = 'toggle'; toggle.setAttribute('aria-expanded', 'false');
    panel.append(heading, options, description, status); root.append(style, panel, toggle);
    const close = () => {panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus();};
    toggle.addEventListener('click', event => {event.stopPropagation();panel.hidden = !panel.hidden;toggle.setAttribute('aria-expanded', String(!panel.hidden));});
    closeButton.addEventListener('click', close);
    // Keep plugin controls independent from the site's account controls.
    host.addEventListener('click', event => event.stopPropagation());
    root.addEventListener('keydown', event => {if (event.key === 'Escape') close();});
    controls.clear();
    for (const name of optionsNames) {
      const label = el('label'), input = el('input');
      input.type = 'checkbox'; input.checked = prefs[name];
      label.append(input, document.createTextNode(name)); options.append(label); controls.set(name, input);
      input.addEventListener('change', () => {
        prefs[name] = input.checked;
        status.textContent = save() ? '设置已保存' : '当前页面已生效；浏览器禁止保存设置。';
        apply(true);
      });
    }
    account.insertBefore(host, account.firstChild);
  }
  // Only acknowledge this specific informational notice, never other confirmations.
  const noticeText = normalize('勾选后，相关信息将展示在备注栏，您可在发票预览查看。');
  const noticeClicks = new WeakMap();
  function dismissDisplayNotice() {
    if (!prefs[skipNotice]) return;
    for (const dialog of document.querySelectorAll('[role="dialog"], [role="alertdialog"], .t-dialog')) {
      let visible = true;
      for (let node = dialog; node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none' || style.visibility === 'hidden') {visible = false; break;}
      }
      if (!visible) continue;
      const body = dialog.querySelector('.t-dialog__body');
      const heading = dialog.querySelector('.t-dialog__header, [class*="dialog__header"], [role="heading"]');
      // The body must match in full when TDesign exposes it; otherwise match the
      // exact sentence inside a dialog with the expected informational heading.
      if (heading && normalize(heading.textContent) !== '提示') continue;
      if (body ? normalize(body.textContent) !== noticeText : !normalize(dialog.textContent).includes(noticeText)) continue;
      const button = [...dialog.querySelectorAll('button')].find(node => normalize(node.textContent) === '我知道了');
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') continue;
      if (Date.now() - (noticeClicks.get(button) || 0) < 1500) continue;
      noticeClicks.set(button, Date.now());
      button.click();
    }
  }
  const editors = new Map();
  let editorStyle;
  function cleanupEditors() {
    for (const [input, record] of editors) {
      record.area.remove(); input.removeAttribute('data-fj-original-name'); record.container?.removeAttribute('data-fj-original-container');
      record.wrapper.removeAttribute('data-fj-multiline');
    }
    editors.clear(); editorStyle?.remove(); editorStyle = undefined;
  }
  function enhanceProjectNames() {
    if (!editorStyle?.isConnected) {
      editorStyle = document.createElement('style');
      editorStyle.textContent = `
        .xmmc_handle[data-fj-multiline]{display:flex!important;align-items:flex-start!important;height:auto!important;gap:8px}
        .xmmc_handle [data-fj-original-name],.xmmc_handle [data-fj-original-container]{display:none!important}
        .xmmc_handle textarea.fj-project-name{display:block!important;flex:1 1 0;min-width:0;width:0;min-height:64px;max-height:180px;height:64px;resize:vertical;box-sizing:border-box;padding:7px 10px;border:1px solid #dcdcdc;border-radius:3px;background:white;color:#333;font:14px/22px system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;overflow:auto}
        .xmmc_handle textarea.fj-project-name:focus{outline:0;border-color:#0052d9;box-shadow:0 0 0 2px #0052d920}
        .xmmc_handle textarea.fj-project-name:disabled{background:#eee;color:#999}
      `;
      document.documentElement.append(editorStyle);
    }
    for (const [input, record] of editors) {
      if (!input.isConnected || !record.area.isConnected) {
        record.area.remove(); input.removeAttribute('data-fj-original-name'); record.container?.removeAttribute('data-fj-original-container');
        record.wrapper.removeAttribute('data-fj-multiline'); editors.delete(input);
      }
    }
    for (const input of document.querySelectorAll('.xmmc_handle > input.blueinvoice-input, .xmmc_handle .t-input__wrap input.t-input__inner')) {
      let record = editors.get(input);
      if (!record) {
        const area = document.createElement('textarea'), wrapper = input.closest('.xmmc_handle');
        area.className = 'fj-project-name'; area.rows = 2; area.wrap = 'soft';
        area.setAttribute('aria-label', '项目名称');
        area.title = '项目名称自动换行显示；回车沿用原页面的候选项操作。';
        record = {area, wrapper:input.closest('.xmmc_handle'), container:input.closest('.t-input__wrap') || input, composing:false}; editors.set(input, record);
        const fit = () => {area.style.height = '64px';area.style.height = Math.min(180, Math.max(64, area.scrollHeight)) + 'px';};
        const forward = type => input.dispatchEvent(new FocusEvent(type, {bubbles:type === 'focusin' || type === 'focusout',relatedTarget:area}));
        area.addEventListener('focus', () => {if (!input.matches('.t-input__inner')) {forward('focus');forward('focusin');}});
        area.addEventListener('blur', () => {input.dispatchEvent(new Event('change', {bubbles:true}));forward('blur');forward('focusout');});
        area.addEventListener('compositionstart', () => {record.composing = true;input.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true}));});
        area.addEventListener('compositionend', event => {record.composing = false;input.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true,data:event.data}));syncInput(false);});
        const syncInput = composing => {
          // This remains a single invoice name: wrapping adds no newline to its value.
          const value = area.value.replace(/[\r\n]+/g, ' ');
          if (!composing && area.value !== value) area.value = value;
          input.value = value;
          input.dispatchEvent(new InputEvent('input', {bubbles:true,inputType:'insertText',isComposing:composing})); fit();
        };
        area.addEventListener('input', event => syncInput(event.isComposing || record.composing));
        area.addEventListener('keydown', event => {
          if (event.isComposing || record.composing || event.keyCode === 229) return;
          const forwarded = new KeyboardEvent('keydown', {key:event.key,code:event.code,keyCode:event.keyCode,which:event.which,ctrlKey:event.ctrlKey,altKey:event.altKey,shiftKey:event.shiftKey,metaKey:event.metaKey,bubbles:true,cancelable:true});
          input.dispatchEvent(forwarded);
          if (event.key === 'Enter' || forwarded.defaultPrevented) event.preventDefault();
        });
        const hadFocus = document.activeElement === input;
        const selection = [input.selectionStart, input.selectionEnd];
        record.transferring = hadFocus;
        input.setAttribute('data-fj-original-name', ''); record.container.setAttribute('data-fj-original-container', ''); wrapper.setAttribute('data-fj-multiline', '');
        record.container.insertAdjacentElement('afterend', area); record.fit = fit;
        area.value = input.value; fit();
        if (hadFocus) {area.focus({preventScroll:true});area.setSelectionRange(selection[0] ?? area.value.length, selection[1] ?? area.value.length);}
        record.transferring = false;
      }
      if (!record.composing && record.area.value !== input.value) {record.area.value = input.value;record.fit();}
      if (record.area.disabled !== input.disabled) record.area.disabled = input.disabled;
      if (record.area.readOnly !== input.readOnly) record.area.readOnly = input.readOnly;
      record.area.placeholder = input.placeholder;
      if (input.hasAttribute('maxlength')) record.area.maxLength = input.maxLength;
    }
  }
  function preserveEditorFocus(event) {
    const record = editors.get(event.target);
    if (record && (record.transferring || event.relatedTarget === record.area)) event.stopImmediatePropagation();
  }
  document.addEventListener('blur', preserveEditorFocus, true);
  document.addEventListener('focusout', preserveEditorFocus, true);
  function apply(force = false) {
    if (!active()) {if (host) host.remove(); cleanupEditors(); return;}
    mount();
    if (prefs[multiline]) enhanceProjectNames();
    else if (editors.size || editorStyle) cleanupEditors();
    dismissDisplayNotice();
    for (const row of document.querySelectorAll('.t-form__item')) {
      const name = normalize(row.querySelector('.t-form__label')?.textContent);
      if (!names.includes(name)) continue;
      for (const label of row.querySelectorAll('label.t-checkbox')) {
        if (normalize(label.querySelector('.t-checkbox__label')?.textContent) !== '是否展示') continue;
        const input = label.querySelector('input[type="checkbox"]');
        if (!input || input.checked === prefs[name] || input.disabled || label.classList.contains('t-is-disabled')) continue;
        if (!force && Date.now() - (attempts.get(input) || 0) < 1500) continue;
        attempts.set(input, Date.now());
        syncing = true;
        try { input.click(); } finally { syncing = false; }
        dismissDisplayNotice();
      }
    }
  }
  function onPageChange(event) {
    if (syncing || !active()) return;
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
    const label = input.closest('label.t-checkbox');
    if (!label || normalize(label.querySelector('.t-checkbox__label')?.textContent) !== '是否展示') return;
    const row = input.closest('.t-form__item');
    const name = normalize(row?.querySelector('.t-form__label')?.textContent);
    if (!names.includes(name)) return;
    // A direct change on the invoice page becomes the new preference.
    prefs[name] = input.checked;
    attempts.delete(input);
    const control = controls.get(name);
    if (control) control.checked = input.checked;
    const saved = save();
    const status = root?.querySelector('[role="status"]');
    if (status) status.textContent = saved ? '已保存页面上的展示选择' : '已同步页面选择；浏览器禁止保存设置。';
  }
  document.addEventListener('change', onPageChange, true);
  const schedule = () => {clearTimeout(timer); timer = setTimeout(() => apply(), 100);};
  const observer = new MutationObserver(records => {
    // Vue swaps the display input for a nested TDesign editor on focus.
    // Upgrade that replacement before the next paint, rather than waiting a second.
    if (active() && prefs[multiline] && records.some(record => record.type === 'childList')) enhanceProjectNames();
    schedule();
  });
  observer.observe(document.documentElement, {subtree:true,childList:true,attributes:true,attributeFilter:['class','checked','disabled']});
  const interval = setInterval(() => apply(), 1000);
  window[KEY] = {stop() {document.removeEventListener('blur', preserveEditorFocus, true);document.removeEventListener('focusout', preserveEditorFocus, true);cleanupEditors();document.removeEventListener('change', onPageChange, true);observer.disconnect();clearTimeout(timer);clearInterval(interval);host?.remove();delete window[KEY];}};
  apply();
})();
