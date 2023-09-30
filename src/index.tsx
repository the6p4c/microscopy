// ==UserScript==
// @name        microscopy
// @namespace   Violentmonkey Scripts
// @match       https://cohost.org/*
// @grant       none
// @version     1.0
// @author      the6p4c
// @description search for posts by a particular user
// @require     __react__
// @require     __react-dom__
// ==/UserScript==
/// <reference types="node" />
import React from 'react';
import { createRoot } from 'react-dom/client';

import Ui from './Ui';

(() => {
  // find an element on the site that doesn't disappear due to hydration
  const content = document.querySelector('#app > * > header')?.nextElementSibling;
  if (!content) {
    console.error('[microscopy] couldn\'t find cohost (?)');
    return;
  }

  // get ready to install our ui
  const getSidebar = () => content.querySelector('.flex.flex-col.gap-5');
  const install = () => {
    const sidebar = getSidebar();
    if (!sidebar) throw '[microscopy] couldn\'t find sidebar in install';

    const ui = document.createElement('div');
    const root = createRoot(ui);
    root.render(<Ui />);

    sidebar.appendChild(ui);
    return ui;
  };

  if (!getSidebar()) {
    console.debug('[microscopy] not a user page');
    return;
  }

  // install the ui, and put the ui back if it disappears >:(
  let ui = install();
  const mutationCallback = (mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      if (mutation.type != 'childList' || mutation.removedNodes.length === 0) continue;

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
