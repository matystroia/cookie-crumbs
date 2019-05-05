let patterns = [];
let containers = [];
let keepCookies = [];

function handleUpdated(tabId, changeInfo, tabInfo, urlPattern, keepCookies) {
	if (!(("status" in changeInfo) && tabInfo.cookieStoreId === 'firefox-default'))
		return;

	let container = containers[patterns.indexOf(urlPattern)];

	// Close tab
	browser.tabs.remove(tabId);
  
	// Re-open tab in container
	browser.tabs.create({
		active: tabInfo.active,
		index: tabInfo.index,
		openerTabId: tabInfo.openerTabId,
		cookieStoreId: container.cookieStoreId,
		url: changeInfo.url
	});

	if (!keepCookies) {
		// Delete all cookies
		browser.cookies.getAll({storeId: container.cookieStoreId}).then((cookies) => {
			for (const cookie of cookies) {
				browser.cookies.remove({
					url: changeInfo.url,
					firstPartyDomain: cookie.firstPartyDomain,
					name: cookie.name,
					storeId: container.cookieStoreId
				});
			}
		});		
	}
}

browser.storage.sync.get("containerRules").then((rules) => {
	let containerRules = rules.containerRules || [];
	for (const rule of containerRules) {
		patterns.push(rule[0]);
		browser.contextualIdentities.query({name: rule[1]}).then((identities) => {
			containers.push(identities[0]);
		});
		keepCookies.push(rule[2]);
	}

	// Add a handler for each rule
	for (let i = 0; i < containerRules.length; ++i) {
		browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
			handleUpdated(tabId, changeInfo, tabInfo, patterns[i], keepCookies[i]);
		}, {urls: [patterns[i]]});
	}
});