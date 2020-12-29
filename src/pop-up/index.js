const ARROW_LEFT = '&#9654;';
const ARROW_DOWN = '&#9660;';

const CLASS_CHECKDIV = 'checkdiv'

document.addEventListener("DOMContentLoaded", async () => {
  const save = await loadSettings();
  const engines = await loadEngines();

  const body = document.body;

  const liEng = document.querySelector("#engines")
  Object.values(engines).forEach(e => {
    if (e.active) {
      const div = el("div", {
        className: "engine",
        onclick: () => chrome.tabs.create({ active: true, url: e.link })
      }, liEng);

      el("img", {src: e.icon}, div);
    }
  })

  body.append(titleSection("Options"))

  const labelNumber = el("label",{className: "optiondiv"}, body);

  el("span", {className: "titleOption", innerHTML: "Max number of results", style: "vertical-align: sub"}, labelNumber);
  el("input", {
    type: "number",
    style: "width: 2rem",
    value: save.maxResults,
    min: 0,
    max: 9,
    onchange: ({target}) => saveSettings({ ...save, maxResults: target.value })
  }, labelNumber)

  const list = el('ul', null, document.body)

  //options
  Object.keys(Options).forEach((category) => {
    const menu = el('li', {className: "menu"}, list);
    menu.append(titleSection(category));

    const sublist = el("ul", {className: "sublist", style: "display: block"}, menu);

    Object.entries(Options[category]).forEach(([o, spec]) => {
      const li = el("li",{id: o}, sublist);
      
      const label = el("label", {
        className: "optiondiv",
        style: "display: inline-block"
      }, li);
      const spanImg = el("span", {
        className: "titleOption", 
        innerHTML: spec.name, 
        style: "padding-bottom: 2px"
      }, label);
      spanImg.prepend(el("img", {width: 14, height: 14, src: spec.icon}));

      const checkDiv = el("div", {
        className: CLASS_CHECKDIV,
        style: "display: inline-block"
      }, label)

      el('input', {
        className: "checkbox", 
        type: "checkbox",
        checked: save[o],
        onchange: ({target}) => saveSettings({ ...save, [o]: target.checked })
      }, checkDiv)
    })
  })

  document.querySelectorAll("a").forEach(ln => {
    ln.onclick = () => chrome.tabs.create({ active: true, url: ln.href })
  })

  function titleSection(name){
    const title = el("span", {className: "menu_title"});
    el("span", {className: "arrow", innerHTML: ARROW_LEFT, value: "down"}, title);
    el("span", {textContent: name}, title);
    hline(title);
    return title;
  }

});