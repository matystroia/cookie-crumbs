let urls = [];
let containers = [];

function handleUpdated(tabId, changeInfo, tabInfo, urlPattern) {
    if (!(("status" in changeInfo) && tabInfo.cookieStoreId === 'firefox-default'))
        return;

    let container = containers[urls.indexOf(urlPattern)];

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

browser.storage.sync.get("containerRules").then((rules) => {
    let containerRules = rules.containerRules || [];
    for (const rule of containerRules) {
        urls.push(rule[0]);
        browser.contextualIdentities.query({name: rule[1]}).then((identities) => {
            containers.push(identities[0]);
        });
    }

    for (const pattern of urls) {
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {handleUpdated(tabId, changeInfo, tabInfo, pattern)}, {urls: [pattern]});
    }
});