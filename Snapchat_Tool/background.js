
chrome.contextMenus.create({
    title: "Snap this Image!",
    contexts:["image"],
    onclick: function(info) {
		go(info.srcUrl);
		console.log("Initiating code.js.....: "+info.srcUrl);
		
    }
});

function go(url){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {snapchat: "true", image_url: url}, function(response) {
				console.log(response.farewell);
			});
		});
};