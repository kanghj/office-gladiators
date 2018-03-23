
// triggers when the boss anger is high. 
// the most hated employee in the office is fired.
// If the slave gets fired, then the game ends.
class FireEmployee {
    constructor() {

    }

    run() {
        // each colleague produce a vote for someone to get fired

        // remove person from office
    }
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

            let leftCallback = function() {

                // find everyone with this political leaning
                let peopleWithPoliticalView = 
                    colleagues.filter((e) => political_compass_for_person[e.name][topic]);

                // now these people like you
                peopleWithPoliticalView.forEach(p => {
                    addFriend(p.name, slave.name);
                });
            }
            let rightCallback = function() {
                // find everyone with this political leaning
                let peopleWithPoliticalView = 
                    colleagues.filter((e) => political_compass_for_person[e.name][topic]);

                // now these people hate you
                peopleWithPoliticalView.forEach(p => {
                    addPoliticalEnemy(p.name, slave.name);
                });

            }
            showDialogue("CEO", 
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

    if (Math.random() > 0.95 && timeSinceLastFightFire > 10) {
        return new FightFire(
            possibleResolutionTasks.sample(), 
            colleagues.map(c => c.name).sample());
    } else {
        return null;
    }
}
