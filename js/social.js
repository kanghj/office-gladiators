// relations(target, type)
// 

var relations_for_person = {};

function addRelation(person, type, target) {
    // these relations are from the perspective of `person`.
    // therefore, relations are not symmetric! 
    // if A thinks that B is his friend, B may not necessarily think so

    if (!relations_for_person.hasOwnProperty(person)) {
        relations_for_person[person] = [];
    }
    relations_for_person[person].push([type, target]);
}

// a friend is more likely to reveal his political preferences.
function addFriend(person, target) {
    if (!relations_for_person[person].includes(['friend', target])) {
        addRelation(person, 'friend', target);
    } else {
        addPoliticalAlly(person, target);
    }
    
}

// the goal of the game is to get everyone to view you as a political_ally.
// Once that happens, you can request for a promotion to replace your boss.
function addPoliticalAlly(person, target) {
    addRelation(person, 'political_ally', target);
}

function addPoliticalEnemy(person, target) {
    addRelation(person, 'political_enemy', target);
}


var political_compass_for_person = {};
const POLITICAL_TOPICS = Object.freeze({
    QUALITY: Symbol('QUALITY'),
    SPEED : Symbol('SPEED'),
    COST: Symbol('COST'),
    BUREACRACY: Symbol('BUREACRACY'),
    DICTATORSHIP: Symbol('DICTATORSHIP'),
    SOCIALISM: Symbol('SOCIALISM')
});

function randomInitPoliticalCompass(persons) {
    for (let person of persons) {
        political_compass_for_person[person] = {};
        for (let topic of Object.values(POLITICAL_TOPICS)) {
            political_compass_for_person[person][topic] = [true, false].sample();
        }
    }
}

// construct grammar for each political position
// if a person is inclined twoards a particular political position, he will use more vocabulary and grammar of that political direction
var political_grammar = {};
political_grammar[POLITICAL_TOPICS.QUALITY] = tracery.createGrammar({
	
    "greeting": ["Hi", "Good afternoon.", "Hey!"],
    "opening": ["Let's try to improve on our project's quality next month."],
    "callToAction": ["We must have a meeting to clarify everyone's doubts about our project."],
    "meeting": ["#greeting#.\n#opening#\n#callToAction#"],
    
    "": [""],
    "talk": ["#greeting#. "],

    "smalltalk": ["#greeting#. blah blah blah"]
});

political_grammar[POLITICAL_TOPICS.SPEED] = tracery.createGrammar({
	
    "greeting": ["Good morning!", "Hihi"],
    "opening": ["Let's speed up our work next iteration!"],
    "callToAction": ["Will you schedule a meeting for redistributing our tasks so that we can complete our work as early as we can."],
    "meeting": ["#greeting#.\n#opening#\n#callToAction#"],
    
    "smalltalk": ["#greeting#. blah blah blah"]
});

political_grammar[POLITICAL_TOPICS.COST] = tracery.createGrammar({
	
    "greeting": ["Good evening."],
    "opening": ["We ought to think about outsouring work to Elbonia. \nIt may ruffle some feathers, but the cost savings more than make up for any hurt feelings."],
    "callToAction": ["Will you schedule a meeting with everyone to discuss the possibility of outsourcing some of our work?"],
    "meeting": ["#greeting#.\n#opening#\n#callToAction#"],
    
    "smalltalk": ["#greeting#. Small talk is expensive, and we have no time to waste."]
});

political_grammar[POLITICAL_TOPICS.BUREACRACY] = tracery.createGrammar({
	
    "greeting": ["How are you doing, John?"],
    "opening": ["Recently, upper management has been thinking of promoting someone to give our projects more supervision."],
    "callToAction": ["Will you schedule a meeting with the team? I want to listen to everyone's feelings about our department's lack of progress."],
    "meeting": ["#greeting#.\n#opening#\n#callToAction#"],
    
    "smalltalk": ["#greeting#. Don't forget that I am your boss."]
});

political_grammar[POLITICAL_TOPICS.DICTATORSHIP] = tracery.createGrammar({
	
    "greeting": ["Comrade John!"],
    "opening": ["I have been thinking of reallocating several tasks and job responsibilities for greater production."],
    "callToAction": ["I want you to arrange for a meeting with the team. Will you accept this responsibility?"],
    "meeting": ["#greeting#.\n#opening#\n#callToAction#"],
    
    "smalltalk": ["#greeting#. Hail our CEO. Long live the CEO"]
});

political_grammar[POLITICAL_TOPICS.SOCIALISM] = tracery.createGrammar({
	
    "greeting": ["Greetings, comrade!", "Hi,"],
    "opening": ["there are many tasks and jobs to complete in the next cycle. \nWe should have a meeting one day to equally distribute our work.", ],
    "callToAction": ["Let's plan a meeting for redistributing these tasks equally."],
    "meeting": ["#greeting#.\n#opening#\n#callToAction#"],
    
    "smalltalk": ["#greeting#. One day we must sieze the means of production from our CEO and make things more equitable."]
});

function colleagueSpeaksWithPolitics(colleague, task) {
    for (let topic of Object.values(POLITICAL_TOPICS)) {
        if (political_compass_for_person[colleague][topic]) {
            return political_grammar[topic].flatten('#' + task + '#');
        }
    }
}