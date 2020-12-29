Sites.wikipedia.msgApi = (link) => {
    const url = new URL(link);
    const pageName = url.pathname.match(/\/([^\/]+$)/)[1]
    return {
        // api: `${url.origin}/w/api.php?action=parse&format=json&prop=text&formatversion=2&page=${pageName}`,
        // type: 'json'
    }
}

Sites.wikipedia.get = (from, doc) => {
    console.log(from, doc);
    const body = doc.querySelector("body");
    const article = body.querySelector("#mw-content-text .mw-parser-output");
    const infobox = article.querySelector("[class^=infobox]");

    let img;
    if(infobox)
        img = infobox.querySelector(".image");
    else{
        img = article.querySelector(".thumbinner .image");
    }
    if(img){
        img.className = "imgwiki";
    }

    const children = article.querySelectorAll(":scope > p");
    let summary = null;
    for (let i = 0; i < children.length; i++) {
        const p = children[i];
        if(!p.className && p.textContent.trim()!=""){
            summary = p;
            break;
        }
    }

    const title = body.querySelector("#firstHeading")
    return {
        title : title ? title.textContent : "",
        link : from.link,
        site : from.site,
        summary : summary ? summary.outerHTML : null,
        img : img ? img.outerHTML : null,
    }
}

Sites.wikipedia.set = msg => {
    const bodyPanel = document.createElement("div");
    bodyPanel.className = "wikibody";
    bodyPanel.innerHTML = (msg.img ? msg.img : "") + (msg.summary ? msg.summary : "");
    return {body: bodyPanel};
}