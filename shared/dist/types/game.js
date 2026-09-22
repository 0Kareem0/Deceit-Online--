export var GameStatus;
(function (GameStatus) {
    GameStatus["notStarted"] = "notStarted";
    GameStatus["inLobby"] = "inLobby";
    GameStatus["inRoleReveal"] = "inRoleReveal";
    GameStatus["inMatchIntro"] = "inMatchIntro";
    GameStatus["inNight"] = "inNight";
    GameStatus["inMorning"] = "inMorning";
    GameStatus["inDiscussion"] = "inDiscussion";
    GameStatus["inVoting"] = "inVoting";
    GameStatus["inDayPowers"] = "inDayPowers";
    GameStatus["inElimination"] = "inElimination";
    GameStatus["inGameOver"] = "inGameOver";
})(GameStatus || (GameStatus = {}));
export var EventType;
(function (EventType) {
    EventType["darkFog"] = "darkFog";
    EventType["peacefulNight"] = "peacefulNight";
    EventType["royalDecree"] = "royalDecree";
    EventType["bloodMoon"] = "bloodMoon";
    EventType["truthSpell"] = "truthSpell";
})(EventType || (EventType = {}));
export var VictoryKind;
(function (VictoryKind) {
    VictoryKind["undecided"] = "undecided";
    VictoryKind["faction"] = "faction";
    VictoryKind["solo"] = "solo";
})(VictoryKind || (VictoryKind = {}));
