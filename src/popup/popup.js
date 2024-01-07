(async function () {
  /**
   * Create a title and a bar for an section in the options
   * @param {string} name 
   * @returns Element
   */
  const titleSection = (name) => {
    const title = el("span", { className: "menu_title" });
    el("hr", { className: 'flexchild' }, title)
    el("span", { textContent: name }, title);
    el("hr", { className: 'flexchild' }, title)
    return title;
  }

  const manifest = chrome.runtime.getManifest();
  $('#name').textContent = manifest.name;
  $('#version').textContent = manifest.version;

  $('#title-container img').src = (onChrome() ? '../../' : '') + manifest.icons[128];
  $('.title > a').href = webstore;
  $('#feedback').href = webstore + '/reviews';

  const upgradeButton = document.getElementById("premium");
  const upgradeButtonSpan = upgradeButton.querySelector('span');

  extpay.getUser().then(user => {
    upgradeButton.classList.add('upgrade-button');
    if (user.paidAt) {
      upgradeButtonSpan.textContent = 'Manage subscription';
      upgradeButton.addEventListener('click', extpay.openPaymentPage);
    } else {
      upgradeButtonSpan.textContent = 'Upgrade to Premium';
      upgradeButton.addEventListener('click', premiumPresentationPopup);
    }
  }).catch(err => {
    upgradeButtonSpan.textContent = 'Failed to load subscription status';
  })

  const liEng = document.querySelector("#engines");

  const [settings, engines, save] = await Promise.all([getSettings(), loadEngines(), loadSettings()]);

  OrderEngines.forEach((engineName, i) => {
    const e = engines[engineName];
    if (e.active) {
      const div = el("div", {
        className: "engine",
        style: `--order: ${i + 1};`,
        onclick: () => chrome.tabs.create({ active: true, url: e.link })
      }, liEng);

      el("img", {
        src: `../images/engines/${engineName}.png`,
        title: engineName,
        className: 'icon',
      }, div);
    }
  });


  const optionsContainer = document.getElementById("options-container");
  const disabledOptions = [];
  //options
  Object.keys(settings).forEach((category) => {
    const optionsInCategory = Object.entries(settings[category])
      .filter(([_, spec]) => !('active' in spec) || spec['active'] === true);
    if (optionsInCategory.length === 0) return;

    optionsContainer.append(titleSection(category));
    
    const sublist = el("ul", { className: "sublist", style: "display: block" }, optionsContainer);

    optionsInCategory.forEach(([o, spec]) => {
      if ('active' in spec && spec['active'] === false) return;
      if (!save[o] && spec.slaves)
        disabledOptions.push(...spec.slaves);
      const li = el("li", { id: o }, sublist);

      const label = el("label", {
        className: "optiondiv",
        style: "display: inline-block"
      }, li);

      const spanImg = el("span", {
        className: "titleOption",
        innerHTML: spec.href ? `<a href=${spec.href}>${spec.name}</a>` : spec.name,
        title: spec.title ?? "",
      }, label);

      if (spec.local_icon) {
        const img = el("div", { className: "icon" }, spanImg);
        img.style = `background-image: url(../images/${spec.local_icon});
                    background-size: contain;
                    width: 14px;
                    height: 14px;
                    display: inline-block;`;
        spanImg.prepend(img);
      }

      if (typeof spec.default === 'number') {
        el("input", {
          type: "number",
          style: "width: 2em",
          value: save[o],
          min: spec.min,
          max: spec.max,
          onchange: ({ target }) => set(o, target.value),
        }, label)
        return;
      }
      if (spec.options) {
        if (!Object.keys(spec.options).includes(save[o])) {
          set(o, spec.default);
        }
        const select = el("select", {
          value: save[o],
          onchange: ({ target }) => set(o, target.value),
        }, label);
        Object.entries(spec.options).forEach(([key, props]) => {
          el('option', { value: key, text: props.name, selected: save[o] === key }, select);
        });
        return;
      }

      const checkDiv = el("div", {
        className: 'checkdiv',
        style: "display: inline-block"
      }, label)

      const checkbox = el('input', {
        className: "checkbox",
        type: "checkbox",
        checked: save[o],
        onchange: ({ target }) => {
          set(o, target.checked);
          if (spec.slaves) {
            spec.slaves.forEach((slave) => {
              $$(`#${slave} input`).forEach((checkbox) => {
                checkbox.disabled = !save[o];
              });
            })
          }
        }
      }, checkDiv);

      if (disabledOptions.includes(o)) {
        checkbox.disabled = true;
      }
    });

    if (isOptiSearch && category === 'AI Assitant') {
      el('a', {
        className: 'ad',
        innerHTML: 'Get answers from <strong>Bing Chat</strong>',
        href: webstores['bingchat'][onChrome() ? 'chrome' : 'firefox']
      }, sublist);
      el('a', {
        className: 'ad',
        innerHTML: 'Get answers from <strong>Google Bard</strong>',
        href: webstores['bard'][onChrome() ? 'chrome' : 'firefox']
      }, sublist);
    }

  });

  if (!isOptiSearch) {
    el('a', {
      className: 'ad',
      innerHTML: 'I want answers from <strong>ChatGPT</strong> and <strong>StackOverflow</strong> too !',
      href: webstores['optisearch'][onChrome() ? 'chrome' : 'firefox']
    }, optionsContainer);
  }
  if (WhichExtension === 'bingchat') {
    el('a', {
      className: 'ad',
      innerHTML: 'I want answers from <strong>Google Bard</strong> too !',
      href: webstores['bard'][onChrome() ? 'chrome' : 'firefox']
    }, optionsContainer);
  }

  function set(key, value) {
    save[key] = value;
    saveSettings(save);
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(({ id }) => {
        chrome.tabs.sendMessage(id, { type: 'updateSetting', key, value },
          () => chrome.runtime.lastError // reading lastError prevents from logging an error for the tabs w/o content script
        );
      });
    });
  }

  if (onChrome()) hrefPopUp();
})();