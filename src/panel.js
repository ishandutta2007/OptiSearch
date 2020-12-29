console.log(`OptiSearch`);

const PANEL_CLASS = "optipanel";
const REGEX_LATEX = /\${1,2}([^\$]*)\${1,2}/;
const REGEX_LATEX_G = /\${1,2}([^\$]*)\${1,2}/g;

const ICON_COPY =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

//engines
let engine = "";
const siteFound = window.location.hostname;

if (siteFound.endsWith("ecosia.org")) engine = Ecosia;
else if (siteFound.search(".bing.com") != -1) engine = Bing;
else if (siteFound.search(".google.") != -1) engine = Google;
else if (siteFound.search(".yahoo.") != -1) engine = Yahoo;
else if (siteFound.search("duckduckgo.com") != -1) engine = DuckDuckGo;
else if (siteFound.search("baidu.com") != -1) engine = Baidu;


//Not await !!
loadEngines().then(async (engines) => {

  // console.log(document.body.innerHTML);
  const searchString = document.querySelector(engines[engine].searchBox).value;
  if (!searchString) console.warn("No search string detected");

  console.log(`OptiSearch - ${engine} : "${searchString}"`);

  const save = await loadSettings();

  //Tools
  if (save["bangs"]) {
    const regexp = /[?|&]q=((%21|!)[^&]*)/;
    const reg = window.location.href.match(regexp);
    if (reg) {
      console.log(reg["1"]);
      window.location.href = "https://duckduckgo.com/?q=" + reg["1"];
    }
  }

  if (save["calculator"]) {
    if (window.location.href.search(/[?|&]q=calculator(&?|$)/) != -1) {
      const iframe = el("iframe", {
        className: PANEL_CLASS,
        id: "opticalculator",
        src: "https://www.desmos.com/scientific"
      });
      appendPanel(iframe);
    }
  }

  const rep = isMathExpr(searchString);
  if (rep) {
    if (rep.vars.length > 0) {
      if (save["plot"]) {
        let fun = {
          expr: rep.expr,
          vars: rep.vars,
        };
        let graph = document.createElement("div");
        graph.id = "optiplot";
        graph.className = PANEL_CLASS;
        appendPanel(graph);
        plotFun(fun, "optiplot");
      }
    } else if (
      save["calculator"] &&
      (typeof rep.answer == "number" ||
        typeof rep.answer == "boolean" ||
        rep.answer.entries)
    ) {
      let expr = document.createElement("div");
      expr.id = "optiexpr";
      expr.className = PANEL_CLASS;

      let str = "$" + math.parse(rep.expr).toTex() + "~";
      let answer = rep.answer;
      if (typeof answer == "number") {
        str += "=~" + answer;
      } else if (typeof answer == "boolean") {
        str += ":~" + answer;
      } else if (rep.answer.entries) {
        answer = answer.entries[0];
        str += "=~" + answer;
      }
      str += "$";
      expr.innerHTML = str;

      toTeX(expr);
      appendPanel(expr)
        .querySelector("#optiexpr")
        .appendChild(createCopyButton(answer.toString()));
    }
  }

  //Sites
  const port = chrome.runtime.connect();

  let numberPanel = 0, links = [];
  const handleResult = (r) => {
    let link = r.querySelector("a")
    if (!link) return;
    link = link.href;
    const found = Object.keys(Sites).find((site) => {
      return save[site]
        && link.search(Sites[site].link) != -1
        && !links.find(l => link === l);// no duplicates
    });
    if (found && numberPanel < save.maxResults) {
      links.push(link);
      port.postMessage({
        engine: engine,
        link: link,
        site: found,
        type: "html",
        indexPanel: numberPanel,
        ...Sites[found].msgApi(link),
      });
      numberPanel++;
    }
  }

  const results = document.querySelectorAll(engines[engine].resultRow);
  if (results.length === 0) {
    if (engine === DuckDuckGo) {
      const links = document.querySelector(engines[DuckDuckGo].resultsContainer);
      links.addEventListener("DOMNodeInserted", ({ target }) => {
        const classNames = engines[DuckDuckGo].resultRow.slice(1).replace(/\./g, " ");
        if (target.className.search(classNames) != -1)
          handleResult(target)
      });
    } else {
      console.warn("No result detected");
    }
  }
  else {
    Array.from(results).forEach(handleResult);
  }

  let currentPanelIndex = 0, panels = [];
  port.onMessage.addListener((msg) => {
    if (Sites.hasOwnProperty(msg.site)) {
      const site = Sites[msg.site];
      const infos = site.set(msg);
      if (infos) {
        panels[msg.indexPanel] = panelFromSite(msg.site, msg.title, msg.link, site.icon, infos);
      } else {
        panels[msg.indexPanel] = "BUG";
      }
      //print the panels in order
      while (currentPanelIndex < numberPanel) {
        const panel = panels[currentPanelIndex];
        if (panel) {
          if (panel !== "BUG")
            appendPanel(panel);
          currentPanelIndex++;
        } else {
          break;
        }
      }
      if (currentPanelIndex === numberPanel) {
        PR.prettyPrint();
      }
    }
  });

  function panelFromSite(site, title, link, icon, infos) {
    const panel = el("div", { className: PANEL_CLASS });

    //watermark
    el("div", { className: "watermark", textContent: "OptiSearch" }, panel);

    const headPanel = el("div", { className: "optiheader" }, panel);

    const a = el("a", { href: link }, headPanel);

    title = title.replace(/<(\w*)>/g, "&lt;$1&gt;"); // avoid html tag to be counted if it is in the title
    toTeX(el("div", { className: "title result-title", textContent: title }, a));

    const linkElement = el("div", { className: "optilink result-url", textContent: link }, a);
    linkElement.prepend(el("img", { width: 16, height: 16, src: icon }));

    // BODY
    if (infos.body) {
      hline(panel);
      infos.body.className += " optibody";

      if (site === "stackexchange") {
        childrenToTeX(infos.body);
      }

      const codes = infos.body.querySelectorAll("code, pre");
      codes.forEach((c) => {
        c.className += ` prettyprint`;
      });

      const pres = infos.body.querySelectorAll("pre");
      pres.forEach((pre) => {
        const surround = el("div", { innerHTML: pre.outerHTML, style: "position: relative" });
        surround.appendChild(createCopyButton(pre.innerText));

        pre.parentNode.replaceChild(surround, pre);
      });
      panel.appendChild(infos.body);
    }

    // FOOT
    if (infos.foot) {
      infos.foot.id = "output";
      hline(panel);
      panel.appendChild(infos.foot);
    }

    // put the host in every link
    const host = link.match("https?://[^/]+")[0];
    const links = panel.querySelectorAll("a");
    links.forEach((a) => {
      let ahref = a.getAttribute("href");
      if (!ahref.startsWith("//") && !ahref.startsWith("http")) {
        if (!ahref.startsWith("/")) {
          a.href = `${link.replace(/\/[^\/]*$/, "")}/${ahref}`;
        } else a.href = host + ahref;
      }
    });

    return panel;
  }

  /**
   * Append pannel to the side of the result page
   * @param {Element} panel the content of the panel
   * @returns {Element} the box where the panel is 
   */
  function appendPanel(panel) {
    const rightColumn = document.querySelector(engines[engine].rightColumn);
    if (!rightColumn)
      console.warn("No right column detected");
    else {
      const box = el("div", {className: `optisearchbox ${isDarkMode() ? "dark" : "bright"}`}, rightColumn);
      if (engine == Ecosia)
        box.style.marginTop = "20px";
      box.style.marginBottom = "20px";
      box.append(panel);
      return box;
    }
  }


  /**
   * Update color if the theme is somehow changed
   */
  let wasDark = isDarkMode();
  setInterval(() => {
    const dark = isDarkMode();
    if (dark !== wasDark) {
      wasDark = dark;
      const panels = document.querySelectorAll(".optisearchbox")

      for (let p of panels) {
        if (dark)
          p.className = p.className.replace("bright", "dark");
        else
          p.className = p.className.replace("dark", "bright");
      }
    }
  }, 200)
});