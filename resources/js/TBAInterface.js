// TBAInterface functions to pull data from TheBlueAlliance.com
var teams = null;
var schedule = null;
var authKey = "uTHeEfPigDp9huQCpLNkWK7FBQIb01Qrzvt4MAjh9z2WQDkrsvNE77ch6bOPvPb6";
var blueAllianceEventCode = null;
var blueAllianceRefreshTimer = null;
var blueAllianceRefreshIntervalMs = 5 * 60 * 1000;
var blueAllianceOnlineHandlerInstalled = false;

function getBlueAllianceCacheKey(eventCode, kind) {
	return "scoutingpass-bluealliance:" + eventCode + ":" + kind;
}

function loadBlueAllianceCache(eventCode) {
	if (!eventCode) {
		return;
	}

	try {
		var cachedTeams = localStorage.getItem(getBlueAllianceCacheKey(eventCode, "teams"));
		if (cachedTeams) {
			teams = JSON.parse(cachedTeams);
		}

		var cachedSchedule = localStorage.getItem(getBlueAllianceCacheKey(eventCode, "schedule"));
		if (cachedSchedule) {
			schedule = JSON.parse(cachedSchedule);
		}
	} catch (err) {
		console.log("Unable to load cached Blue Alliance data.", err);
	}
}

function saveBlueAllianceCache(eventCode, kind, value) {
	if (!eventCode) {
		return;
	}

	try {
		localStorage.setItem(getBlueAllianceCacheKey(eventCode, kind), JSON.stringify(value));
	} catch (err) {
		console.log("Unable to save cached Blue Alliance data.", err);
	}
}

function redrawScoutingPass() {
	if (typeof drawFields === "function") {
		drawFields();
	}
}

function requestBlueAllianceData(url, cacheKind, assignValue, eventCode) {
	if (!authKey) {
		return;
	}

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", url, true);
	xmlhttp.setRequestHeader("X-TBA-Auth-Key", authKey);
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				var response = JSON.parse(this.responseText);
				assignValue(response);
				saveBlueAllianceCache(eventCode, cacheKind, response);
				redrawScoutingPass();
			}
		}
	};
	xmlhttp.send();
}
/**
 * Get list of teams in event
 *
 * @param {eventCode} eventCode the event code (i.e. 2020caln) to pull the team list
 */
function getTeams(eventCode) {
	if (!eventCode) {
		return;
	}

	var url = "https://www.thebluealliance.com/api/v3/event/" + eventCode + "/teams/simple";
	requestBlueAllianceData(url, "teams", function(response) {
		teams = response;
	}, eventCode);
}

/**
 * Get schedule for event
 *
 * @param {eventCode} eventCode the event code (i.e. 2020caln) to pull the team list
 */
function getSchedule(eventCode) {
	if (!eventCode) {
		return;
	}

	var url = "https://www.thebluealliance.com/api/v3/event/" + eventCode + "/matches/simple";
	requestBlueAllianceData(url, "schedule", function(response) {
		schedule = response;
	}, eventCode);
}

function refreshBlueAlliance(eventCode) {
	if (!eventCode) {
		return;
 	}

	getTeams(eventCode);
	getSchedule(eventCode);
}

function startBlueAllianceSync(eventCode) {
	if (!eventCode) {
		return;
	}

	blueAllianceEventCode = eventCode;
	loadBlueAllianceCache(eventCode);
	refreshBlueAlliance(eventCode);

	if (blueAllianceRefreshTimer) {
		clearInterval(blueAllianceRefreshTimer);
	}
	blueAllianceRefreshTimer = setInterval(function() {
		if (navigator.onLine) {
			refreshBlueAlliance(blueAllianceEventCode);
		}
	}, blueAllianceRefreshIntervalMs);

	if (!blueAllianceOnlineHandlerInstalled) {
		window.addEventListener("online", function() {
			if (blueAllianceEventCode) {
				refreshBlueAlliance(blueAllianceEventCode);
			}
		});
		blueAllianceOnlineHandlerInstalled = true;
	}
}
