let containerRules;
let table = document.getElementById("table");

function addRule(e) {
	containerRules.push([
		document.querySelector("#url").value,
		document.querySelector("#container").value,
		document.querySelector("#keepCookies").checked
		]);
	saveOptions();
	setRuleTable();
}

function saveOptions() {
	browser.storage.sync.set({
		containerRules: containerRules
	});
}

function removeRow(event) {
	// Remove from array
	containerRules.splice(parseInt(event.target.getAttribute("data-id")), 1);
	saveOptions();
	setRuleTable();
}

function setRuleTable() {
	let newTable = document.createElement("tbody");
	let index = 0;
	for (const rule of containerRules) {
		let newRow = newTable.insertRow(-1);

		let urlCell = newRow.insertCell(0);
		let containerCell = newRow.insertCell(1);
		let keepCell = newRow.insertCell(2)
		let removeCell = newRow.insertCell(3);

		urlCell.appendChild(document.createTextNode(rule[0]));
		containerCell.appendChild(document.createTextNode(rule[1]));

		let checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.checked = rule[2];
		keepCell.appendChild(checkbox);

		let button = document.createElement("button");
		button.setAttribute("data-id", index.toString());
		button.innerHTML = "Remove";
		button.addEventListener("click", removeRow);
		removeCell.appendChild(button);

		index++;
	}
	
	table.parentNode.replaceChild(newTable, table);
	table = newTable;
}

function restoreOptions() {
	browser.storage.sync.get("containerRules").then((rules) => {
		containerRules = rules.containerRules || [];
		setRuleTable();
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", addRule);