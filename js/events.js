

class FireEmployee {
    constructor() {

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
                workLeft.push([TYPE_OF_WORK.ASK_FOR_WORK, this.requester]);
            }
        }

        workLeft.push([TYPE_OF_WORK.SCHEDULE_MEETING, this.requester, completeTaskCallback]);
    }
}

// only for the player
class Promotion {
    constructor() {

    }
}


