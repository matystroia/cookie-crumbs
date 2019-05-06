let rules = [];
let whitelistedTabs = [];

function moveTabToContainer(tab, cookieStoreId) {
    // Close tab
    browser.tabs.remove(tab.id);

    // Re-open tab in container
    browser.tabs.create({
        active: tab.active,
        cookieStoreId: cookieStoreId,
        index: tab.index,
        openerTabId: tab.openerTabId,
        url: tab.url,
        windowId: tab.windowId
    });
}

function handleUpdated(tabId, changeInfo, tabInfo, ruleObject) {
    if (!(("status" in changeInfo) && tabInfo.cookieStoreId === 'firefox-default'))
        return;

    if (whitelistedTabs.includes(tabInfo.successorId))
        return;

    moveTabToContainer(tabInfo, ruleObject.container.cookieStoreId);

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

function toggleActiveTabContainer() {
    // Get active tab
    browser.tabs.query({active: true}).then((tabs) => {
        // Discard tabs with default container
        while (tabs[0].cookieStoreId === 'firefox-default' && !whitelistedTabs.includes(tabs[0].successorId))
            tabs.shift();

        // TODO: This won't work if tabs are sorted by container
        let index = whitelistedTabs.indexOf(tabs[0].successorId);
        if (index > -1)
            whitelistedTabs.splice(index, 1);
        else {
            whitelistedTabs.push(tabs[0].succesorId);
            // Re-open in default container
            moveTabToContainer(tabs[0], 'firefox-default');
        }
    });
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