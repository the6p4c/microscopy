// ==UserScript==
// @name        cohost user post search
// @namespace   Violentmonkey Scripts
// @match       https://cohost.org/*
// @grant       none
// @version     1.0
// @author      the6p4c
// @description search for posts by a particular user
// @require     __react__
// @require     __react-dom__
// ==/UserScript==
import React from 'react';
import { createRoot } from 'react-dom/client';

import Ui from './Ui';

(() => {
  // find an element on the site that doesn't disappear due to hydration
  const content = document.querySelector('#app > * > header').nextElementSibling;

  // insert our ui (if we're on a user page)
  const install = () => {
    const sidebar = content.querySelector('.flex.flex-col.gap-5');
    if (!sidebar) return;

    const ui = document.createElement('div');
    const root = createRoot(ui);
    root.render(<Ui />);
    
    sidebar.appendChild(ui);
    return ui;
  };

  let ui = install();
  if (!ui) {
    console.debug('cohost user post search: not a user page');
    return;
  }

  // put the ui back if it disappears >:(
  const mutationCallback = (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type != 'childList' || mutation.removedNodes == 0) continue;

      for (const removedNode of mutation.removedNodes) {
        if (removedNode.contains(ui)) {
          ui = install();
          break;
        }
      }
    }
  };

  const observer = new MutationObserver(mutationCallback);
  observer.observe(content, { childList: true });
})();
