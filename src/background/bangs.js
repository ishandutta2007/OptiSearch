// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//     getSettings((save)=>{
//         chrome.tabs.executeScript(tabId,
//         {
//             'code' : "var x=window.location.href; console.log(x); x"
//         },
//         function (results){
//             console.log(results);
//         });
//         // console.log(tab);
//         // const strUrl = tab.url.toString();
//         // let bangable = (isActive('bangs',Google,save) && strUrl.search(Engines.Google.regexp)==0)
//         //             || (isActive('bangs',Ecosia,save) && strUrl.search(Engines.Ecosia.regexp)==0);

//         // if(changeInfo.status=="loading" && bangable){
//         //     let regexp = /[?|&]q=((%21|!)[^&]*)/
//         //     if(strUrl.search(regexp)!=-1){
//         //         let reg = strUrl.match(regexp);
//         //         console.log(tab);
//         //         console.log(reg['1']);
//         //         chrome.tabs.update(tab.id, {url: "https://duckduckgo.com/?q="+reg['1']});
//         //     }
//         // }
//     }); 
// });

