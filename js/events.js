
// triggers when the boss anger is high. 
// the most hated employee in the office is fired.
// If the slave gets fired, then the game ends.
class FireEmployee {
    constructor() {

    }

    run() {
        // each colleague produce a vote for someone to get fired
        var colleagueNames = colleagues.map((c) => c.name);
        colleagueNames.push(slave.name);
        let votesAgainst = {};
        for (colleagueName of colleagueNames) {
            votesAgainst[colleagueName] = 0;
        }

        for (colleagueName of colleagueNames) {
            let relations = relations_for_person[colleagueName];
            let blames = relations
                .filter(r => r[0] == 'blames')
            let enemies = relations
                .filter(r => r[0] == 'political_enemy')
            if (blames.length > 0) {
                let choice = blames.sample();
                let target = choice[1];
                votesAgainst[target] += 1;

            } else if (enemies.length > 0) {
                let choice = enemies.sample();
                let target = choice[1];
                votesAgainst[target] += 1;
            }
        }

        let mostPopularChoice = colleagueNames[0];
        for (let colleagueName of colleagueNames) {
            if (votesAgainst[colleagueName] > votesAgainst[mostPopularChoice]) {
                mostPopularChoice = colleagueName;                
            }
        }

        // remove person from office
        showDialogue("CEO", `${mostPopularChoice} is fired!`,
        () => {fire(mostPopularChoice)},
        () => {fire(mostPopularChoice)}
        )
    }
}

function fire(colleague) {
    var matchingColleague = colleagues.filter(c => c.name == colleague)
    matchingColleague.visible=false;
    // TODO

}

// add a new employee, can be created only if someone has been fired previously. 
// i.e. the game starts with office size at full capacity, and this capacity cannot be exceeded.
class NewHire {
    constructor() {

    }
}



class SomeoneWantsAMeeting {
    constructor(who) {

        this.requester = who;

    }

    run() {
        
        let everyoneElse = colleagues   .map((c) => c.name)
                                        .filter((e) => e != this.requester);
        showDialogue('Request from a colleague', `${this.requester} just had a 'brilliant' idea, and wants to have a meeting`,
                                        () => hideDialogue(), () => hideDialogue())
        let completeTaskCallback = function() {
            for (var p of everyoneElse) {
                workLeft.push([TYPE_OF_WORK.ASK_FOR_WORK, p, this.requester]);
            }
        }

        workLeft.push([TYPE_OF_WORK.SCHEDULE_MEETING, this.requester, completeTaskCallback.bind(this)]);
    }
}

// only for the slave
class Promotion {
    constructor() {

    }
}

// on FightFire, a resolutionTask 
// appears at the front of the queue and needs to be completed 
// by a time limit, otherwise it causes the boss to get angry.
// On task resolution, a retrospective question will appear 
// and the slave must blame one of the POLITICAL_TOPICS. 
// In addition, a number of CONSPIRE job may appear afterwards and the
// player may use it to blame and incite hatred for another colleague
class FightFire {
    constructor(resolutionTaskType, target) {
        if (![TYPE_OF_WORK.PRINT, 
            TYPE_OF_WORK.TYPE, 
            TYPE_OF_WORK.TALK].includes(resolutionTaskType)) {
                console.log(resolutionTaskType);
            throw new Error("wrong type ");
        }


        if (resolutionTaskType == TYPE_OF_WORK.TALK) {
            this.resolutionTask = [resolutionTaskType, target];
        } else {
            this.resolutionTask = resolutionTaskType;
        }

    }

    run() {
        // use a global flag for having time limits
        window.taskTimeLimit = 500;

        workLeft.unshift(this.resolutionTask);
        showDialogue("There is an urgent task from your boss!", "Complete your task quickly to avoid your boss's ire!",
        () => hideDialogue(), () => hideDialogue())


        window.completeTaskCallback = function() {
            let topic = Object.values(POLITICAL_TOPICS).sample();

            let commonCallback = function() {
                hideDialogue();

                let numConspire = Math.random() * 10 % 5;
                let conspireTasks = [];
                let colleagueNames = colleagues.map((c) => c.name);
                for (let i = 0; i < numConspire; i++) {
                    conspireTasks.push(
                        [TYPE_OF_WORK.CONSPIRE, colleagueNames.sample()]
                    );
                }
            };

            let leftCallback = function() {

                // find everyone with this political leaning
                let peopleWithPoliticalView = 
                    colleagues.filter((e) => political_compass_for_person[e.name][topic]);

                // now these people like you
                peopleWithPoliticalView.forEach(p => {
                    addFriend(p.name, slave.name);
                });
                commonCallback();
            }
            let rightCallback = function() {
                // find everyone with this political leaning
                let peopleWithPoliticalView = 
                    colleagues.filter((e) => political_compass_for_person[e.name][topic]);

                // now these people hate you
                peopleWithPoliticalView.forEach(p => {
                    addPoliticalEnemy(p.name, slave.name);
                });
                commonCallback();
            }
            showDialogue("The CEO wants to know more", 
                `Is ${displayPoliticalTopicNegatively(topic)} a problem in our company?`,
                leftCallback,
                rightCallback)

        }.bind(this);

    }
}

var timeSinceLastFightFire = 0;
function produceEvent(possibleResolutionTasks) {

    timeSinceLastFightFire += 1;

    if (bossAnger > 50) {
        return new FireEmployee();
    }

    if (Math.random() > 0.95 && timeSinceLastFightFire > 10 && window.taskTimeLimit == Infinity) {
        return new FightFire(
            possibleResolutionTasks.sample(), 
            colleagues.map(c => c.name).sample());
    } else {
        return null;
    }
}
