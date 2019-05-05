let rules = [];

function handleUpdated(tabId, changeInfo, tabInfo, ruleObject) {
    if (!(("status" in changeInfo) && tabInfo.cookieStoreId === 'firefox-default'))
        return;

    // Close tab
    browser.tabs.remove(tabId);

    // Re-open tab in container
    browser.tabs.create({
        active: tabInfo.active,
        index: tabInfo.index,
        openerTabId: tabInfo.openerTabId,
        cookieStoreId: ruleObject.container.cookieStoreId,
        url: changeInfo.url
    });

    if (!ruleObject.keepCookies) {
        // Delete all cookies
        browser.cookies.getAll({storeId: ruleObject.container.cookieStoreId}).then((cookies) => {
            for (const cookie of cookies) {
                browser.cookies.remove({
                    url: changeInfo.url,
                    firstPartyDomain: cookie.firstPartyDomain,
                    name: cookie.name,
                    storeId: ruleObject.container.cookieStoreId
                });
            }
        });
    }
}

browser.storage.sync.get("containerRules").then((storage) => {
    rules = storage.containerRules || [];

    // Add container to every rule object
    for (let rule of rules) {
        browser.contextualIdentities.query({name: rule.containerName}).then((identities) => {
            rule.container = identities[0];
        });
    }

    // Add a handler for each rule
    for (const rule of rules) {
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
            handleUpdated(tabId, changeInfo, tabInfo, rule);
        }, {urls: [rule.urlPattern]});
    }
});