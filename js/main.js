var type = "WebGL";
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

var slave = null;
var printer = null;
var computer = null;
var bosses = [];
var colleagues = [];

var gameticks = 0;

var levelLines = [];

var workLeft = [];
var bossAnger = 0;
taskTimeLimit = Infinity;

var eventQueue = [];
var dialogue;
var leftButton;
var rightButton;
var isGameFrozen = false;
var ticksSinceLastBossDialogue = 0;
var ticksSinceLastColleagueDialogue = 0;

var workMessage = new PIXI.Text("Work left");
workMessage.style.fill = 0xFFFFFF;
workMessage.style.fontSize = 10;
var bossMessage = new PIXI.Text("How angry your boss is");
var speechText;
var dialoguePerson;


const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// possible starting spots
const CUBICLE_POSITIONS = [
    [250, 150],
    [250, 250],
    [350, 250],
    [750, 150],
    [650, 250],
    [250, 450],
    [750, 450]
];



PIXI.loader
    .add(["images/office_drone.png",
        "images/office_slavedriver.png",
        "images/printer.png",
        "images/table.png",
        "images/computer.png"])
    .on("progress", loadProgressHandler)
    .load(setup);

function loadProgressHandler(loader, resource) {
    console.log("loading: " + resource.url); 

    console.log("progress: " + loader.progress + "%"); 
}

const TYPE_OF_WORK = Object.freeze({
    PRINT: Symbol('print'),
    // type = type on keyboard
    TYPE : Symbol('type'),
    TALK: Symbol('talk'),
    SCHEDULE_MEETING: Symbol('schedule'),
    // ASK_FOR_WORK = ask a colleague to submit some work
    ASK_FOR_WORK: Symbol('ask_work'),
    // if failed to complete a throw_work task by a deadline, 
    // it turns into another type of work
    THROW_WORK: Symbol('throw_work'),
    // for political events once enough political_allies are gathered
    CONSPIRE: Symbol('conspire')
    
});

function setup() {
    slave = new PIXI.Sprite(
        PIXI.loader.resources["images/office_drone.png"].texture
    );

    var startingPosition = CUBICLE_POSITIONS.sample();
    slave.x = startingPosition[0];
    slave.y = startingPosition[1] + 50;

    computer = new PIXI.Sprite(
        PIXI.loader.resources["images/computer.png"].texture
    );

    computer.x = startingPosition[0];
    computer.y = startingPosition[1];

    slave.vx = 0;
    slave.vy = 0;

    slave.width = 50;
    slave.height = 50;

    slave.name = 'John';

    computer.width = 50;
    computer.height = 50;

    app.stage.addChild(slave);
    app.stage.addChild(computer);

    printer = new PIXI.Sprite(
        PIXI.loader.resources["images/printer.png"].texture
    );

    printer.x = 0;
    printer.y = 0;
    app.stage.addChild(printer);

    let numberOfBosses = 2,
        spacing = 48,
        xOffset = 150;


    for (let i = 0; i < numberOfBosses; i++) {

        let boss = new PIXI.Sprite(
            PIXI.loader.resources["images/office_slavedriver.png"].texture
        );

        let x = spacing * i + xOffset;

        let y = 50;

        boss.x = x;
        boss.y = y;

        boss.vx = 0;
        boss.vy = 0;

        app.stage.addChild(boss);
        bosses.push(boss);
    }

    var colleague_names = ['Mary', 'Sam', 'Tom', 'Steve', 'Nicole', 'Sophia'];

    for (const position of CUBICLE_POSITIONS) {
        if (position !== startingPosition) {
            let computer = new PIXI.Sprite(
                PIXI.loader.resources["images/computer.png"].texture
            );

            computer.x = position[0];
            computer.y = position[1];
            let colleague = new PIXI.Sprite(
                PIXI.loader.resources["images/office_drone.png"].texture
            );

            colleague.x = position[0];
            colleague.y = position[1] + 50;

            colleague.width = 50;
            colleague.height = 50;

            computer.width = 50;
            computer.height = 50;

            app.stage.addChild(colleague);
            app.stage.addChild(computer);

            colleague.name = colleague_names.sample();
            colleague_names = colleague_names.filter((e) => e != colleague.name);

            colleagues.push(colleague);
        }
    }
    randomInitPoliticalCompass(colleagues.map((c) => c.name));
    randomInitRelations(colleagues.map((c) => c.name));
    
    app.stage.addChild(workMessage);

    function buildLevel() {
        function line(startX, startY, endX, endY) {
            let line = new PIXI.Graphics();
            line.lineStyle(4, 0xFFFFFF, 1);
            line.moveTo(startX, startY);
            line.lineTo(endX, endY);
            line.x = 32;
            line.y = 32;
            app.stage.addChild(line);

            levelLines.push(line);
        }

        line(200, 100, 200, GAME_HEIGHT);
        line(200, 100, 400, 100);
        line(200, 350, 400, 350);


        line(500, 100, GAME_WIDTH, 100);
        line(500, 350, GAME_WIDTH, 350);

        line(400, 185, 400, 450);
        line(500, 185, 500, 450);

        // line(400, 100, 400, GAME_HEIGHT);
        

        workLeft.push(TYPE_OF_WORK.PRINT, TYPE_OF_WORK.PRINT, TYPE_OF_WORK.PRINT);
    }
    buildLevel();

    function createDialogueBox() {
        dialogue = new PIXI.DisplayObjectContainer();
        dialogue.position.set(0, 0);
        app.stage.addChild(dialogue);
    
        let rectangleContainer = new PIXI.Graphics();
        rectangleContainer.beginFill(0xFFFFFF);
        rectangleContainer.drawRect(app.stage.width / 2 - 200, app.stage.height / 2 - 100, 420, 220);
        rectangleContainer.endFill();
        dialogue.addChild(rectangleContainer);


        leftButton = new PIXI.Graphics();

        leftButton.beginFill(0x555555);
        leftButton.drawRect(app.stage.width / 2 - 175, app.stage.height / 2 + 50, 100, 50);
        leftButton.endFill();
        dialogue.addChild(leftButton);

        leftButton.interactive = true;
        leftButton.buttonMode = true;

        // Add a hit area, otherwise clicking doesn't work
        leftButton.hitArea = new PIXI.Rectangle(app.stage.width / 2 - 175, app.stage.height / 2 + 50, 100, 50);


        rightButton = new PIXI.Graphics();
        rightButton.beginFill(0x555555);
        rightButton.drawRect(app.stage.width / 2 + 35, app.stage.height / 2 + 50, 100, 50);
        rightButton.endFill();
        dialogue.addChild(rightButton);

        rightButton.interactive = true;
        rightButton.buttonMode = true;

        // Add a hit area, otherwise clicking doesn't work
        rightButton.hitArea = new PIXI.Rectangle(app.stage.width / 2 + 75, app.stage.height / 2 + 50, 100, 50);


        let leftButtonText = new PIXI.Text("No");
        leftButtonText.position = new PIXI.Point (app.stage.width / 2 - 175,app.stage.height / 2 + 50);
        dialogue.addChild(leftButtonText);

        
        let rightButtonText = new PIXI.Text("Yes");
        rightButtonText.position = new PIXI.Point (app.stage.width / 2 + 75,app.stage.height / 2 + 50);
        dialogue.addChild(rightButtonText);

        speechText = new PIXI.Text("Ok\n AHHHHHHHHH", {fontSize: 16});
        speechText.position = new PIXI.Point (app.stage.width / 2 - 180 ,app.stage.height / 2 - 60);
        dialogue.addChild(speechText);


        dialoguePerson = new PIXI.Text("", {fontSize: 12});
        dialoguePerson.position = new PIXI.Point (app.stage.width / 2 - 180 ,app.stage.height / 2 - 80);
        dialogue.addChild(dialoguePerson);

        dialogue.visible = false;
        
    }
    createDialogueBox();
    hideDialogue();

    function createConspiracyChoiceBox() {
        conspiracyDialogue = new PIXI.DisplayObjectContainer();
        conspiracyDialogue.position.set(0, 0);
        app.stage.addChild(conspiracyDialogue);
    
        let rectangleContainer = new PIXI.Graphics();
        rectangleContainer.beginFill(0xFFFFFF);
        rectangleContainer.drawRect(app.stage.width / 2 - 200, app.stage.height / 2 - 100, 420, 220);
        rectangleContainer.endFill();
        conspiracyDialogue.addChild(rectangleContainer);


        leftButton = new PIXI.Graphics();

        leftButton.beginFill(0x555555);
        leftButton.drawRect(app.stage.width / 2 - 175, app.stage.height / 2 + 50, 100, 50);
        leftButton.endFill();
        conspiracyDialogue.addChild(leftButton);

        leftButton.interactive = true;
        leftButton.buttonMode = true;

        // Add a hit area, otherwise clicking doesn't work
        leftButton.hitArea = new PIXI.Rectangle(app.stage.width / 2 - 175, app.stage.height / 2 + 50, 100, 50);


        rightButton = new PIXI.Graphics();
        rightButton.beginFill(0x555555);
        rightButton.drawRect(app.stage.width / 2 + 35, app.stage.height / 2 + 50, 100, 50);
        rightButton.endFill();
        conspiracyDialogue.addChild(rightButton);

        rightButton.interactive = true;
        rightButton.buttonMode = true;

        // Add a hit area, otherwise clicking doesn't work
        rightButton.hitArea = new PIXI.Rectangle(app.stage.width / 2 + 75, app.stage.height / 2 + 50, 100, 50);


        let leftButtonText = new PIXI.Text("No");
        leftButtonText.position = new PIXI.Point (app.stage.width / 2 - 175,app.stage.height / 2 + 50);
        conspiracyDialogue.addChild(leftButtonText);

        
        let rightButtonText = new PIXI.Text("Yes");
        rightButtonText.position = new PIXI.Point (app.stage.width / 2 + 75,app.stage.height / 2 + 50);
        conspiracyDialogue.addChild(rightButtonText);

        speechText = new PIXI.Text("Ok\n AHHHHHHHHH", {fontSize: 16});
        speechText.position = new PIXI.Point (app.stage.width / 2 - 180 ,app.stage.height / 2 - 60);
        conspiracyDialogue.addChild(speechText);


        conspiracyDialoguePerson = new PIXI.Text("", {fontSize: 12});
        conspiracyDialoguePerson.position = new PIXI.Point (app.stage.width / 2 - 180 ,app.stage.height / 2 - 80);
        conspiracyDialogue.addChild(conspiracyDialoguePerson);

        conspiracyDialogue.visible = false;
        
    }

    eventQueue = [
        null, null, null, null, null, null, 
        new SomeoneWantsAMeeting(colleagues.sample().name)];    


    let left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40);


    left.press = () => {
        slave.vx = -5;
        slave.vy = 0;
    };

    left.release = () => {
    
        if (!right.isDown && slave.vy === 0) {
        slave.vx = 0;
        }
    };


    up.press = () => {
        slave.vy = -5;
        slave.vx = 0;
    };
    up.release = () => {
        if (!down.isDown && slave.vx === 0) {
        slave.vy = 0;
        }
    };


    right.press = () => {
        slave.vx = 5;
        slave.vy = 0;
    };
    right.release = () => {
        if (!left.isDown && slave.vy === 0) {
        slave.vx = 0;
        }
    };

    down.press = () => {
        slave.vy = 5;
        slave.vx = 0;
    };
    down.release = () => {
        if (!up.isDown && slave.vx === 0) {
        slave.vy = 0;
        }
    };

    app.ticker.add(delta => gameLoop(delta))
}


//Create a Pixi Application
let app = new PIXI.Application({width: GAME_WIDTH, height: GAME_HEIGHT});

app.renderer.backgroundColor = 0x061639;
app.renderer.autoResize = true;
app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);

document.body.appendChild(app.view);

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gameLoop(delta) {
    function theSlaveMoves() {
    
        let projected_x = slave.x + slave.vx;
        let projected_y = slave.y + slave.vy;

        let canMove = slaveCollision(slave, projected_x, projected_y);
        if (canMove) {
            slave.x += slave.vx;
            slave.y += slave.vy;
        }
    }

    function theBossFollows(bossIndex) {
        let boss = bosses[bossIndex];
    
        let projected_x = boss.x + boss.vx;
        let projected_y = boss.y + boss.vy;

        let canMove = bossCollision(boss, projected_x, projected_y);
        if (canMove) {
            boss.x += boss.vx;
            boss.y += boss.vy;
        }
    }
    
    function slaveCollision(slave, projected_x, projected_y) {
        return collision(slave, projected_x, projected_y, {
            'checkBoss': true
        });
    }

    function bossCollision(slave, projected_x, projected_y) {
        return collision(slave, projected_x, projected_y, {
            'checkBoss': false,
            'incPrinter': false
        });
    }

    function collision(slave, projected_x, projected_y, options) {
        let future = {
                    width: slave.width,
                    height: slave.height,
                    x: projected_x,
                    y: projected_y,

                };

        if (future.x < 0 || future.x >= GAME_WIDTH) {
            return false;
        }
        if (future.y < 0 || future.y >= GAME_HEIGHT) {
            return false;
        }
        for (var levelLine of levelLines) {

            if (levelLine.currentPath.points) {
                

                var slaveLeftX = future.x - future.width / 2;
                var slaveRightX =  future.x + future.width / 2;
                var slaveTopY = future.y - future.height / 2;
                var slaveBottomY = future.y + future.height / 2;

                var inBoundsX = (
                        slaveLeftX <= levelLine.currentPath.points[0] && 
                        slaveRightX >= levelLine.currentPath.points[0]
                    ) || (
                        slaveLeftX >= levelLine.currentPath.points[0] && 
                        slaveLeftX <= levelLine.currentPath.points[2]
                    );
                    
                var inBoundsY = (
                    slaveTopY <= levelLine.currentPath.points[1] && 
                    slaveBottomY >= levelLine.currentPath.points[1]
                ) || (
                    slaveTopY >= levelLine.currentPath.points[1] && 
                    slaveTopY <= levelLine.currentPath.points[3]
                );
                
                if (inBoundsX && inBoundsY) {
                    return false;
                }
            }
        }
        // hitRectangle(future, levelLines[0]);

        if (options && options['checkBoss']) {
            for (var boss of bosses) {
                if (hitRectangle(future, boss)) {

                    if (ticksSinceLastBossDialogue > 75) {
                        leftDialogueButtonCallback = function() {
                            hideDialogue();

                            bossAnger += 5;
                        };

                        rightDialogueButtonCallback = function() {
                            hideDialogue();

                            workLeft.push(
                                [TYPE_OF_WORK.TYPE, TYPE_OF_WORK.PRINT, 
                                TYPE_OF_WORK.THROW_WORK].sample());
                        }
                        showDialogue(boss.name, bossSpeaks(), leftDialogueButtonCallback, rightDialogueButtonCallback);

                        ticksSinceLastBossDialogue = 0;
                    }

                    
                    return false;
                }
            }
        }

        if (options && !options.hasOwnProperty('incPrinter') || options['incPrinter'] == true) {
            if (hitRectangle(future, printer)) {
                let index = workLeft.indexOf(TYPE_OF_WORK.PRINT);
                
                workLeft = workLeft.filter(w => w instanceof Array 
                                                || w != TYPE_OF_WORK.PRINT);

                if (window.completeTaskCallback) {
                    window.completeTaskCallback();
                    window.completeTaskCallback = null;
                }
                return false;
            }
        }

        if (options && !options.hasOwnProperty('incComputer') || options['incComputer'] == true) {
            if (hitRectangle(future, computer)) {
                let index = workLeft.indexOf(TYPE_OF_WORK.TYPE);
                
                workLeft = workLeft.filter(w => w instanceof Array 
                                                || w != TYPE_OF_WORK.TYPE);
                if (window.completeTaskCallback) {
                    window.completeTaskCallback();
                    window.completeTaskCallback = null;
                }

                return false;
            }
        }

        for (var colleague of colleagues) {
            if (hitRectangle(future, colleague)) {
                if (ticksSinceLastColleagueDialogue > 75) {
                    let scheduleMeetingJobs = workLeft
                        .filter(work => work instanceof Array)
                        .filter(work => work[0] == TYPE_OF_WORK.SCHEDULE_MEETING)
                        .filter(work => work[1] == colleague.name);
                    let askForWorkJobs = workLeft
                        .filter(work => work instanceof Array)
                        .filter(work => work[0] == TYPE_OF_WORK.ASK_FOR_WORK)
                        .filter(work => work[1] == colleague.name);
                        
                    let hasThrowWorkJobs = !(workLeft[0] instanceof Array) 
                        && workLeft[0] == TYPE_OF_WORK.THROW_WORK;
                    
                    let talkToColleagueJobs = workLeft
                        .filter(work => work instanceof Array)
                        .filter(work => work[0] == TYPE_OF_WORK.TALK)
                        .filter(work => work[1] == colleague.name);

                    let conspireJobs = workleft
                        .filter(work => work instanceof Array)
                        .filter(work => work[0] == TYPE_OF_WORK.CONSPIRE)
                        .filter(work => work[1] == colleague.name);


                    if (scheduleMeetingJobs.length > 0) {
                        let work = scheduleMeetingJobs.shift();

                        workLeft = workLeft.filter(w => 
                            !(w instanceof Array) || 
                            work[0] != TYPE_OF_WORK.SCHEDULE_MEETING ||
                            work[1] != colleague.name);
                        
                        if (window.completeTaskCallback) {
                            window.completeTaskCallback();
                            window.completeTaskCallback = null;
                        }

                        leftDialogueButtonCallback = function() {
                            hideDialogue();
                            addPoliticalEnemy(colleague.name, slave.name);
                        };

                        rightDialogueButtonCallback = function() {
                            hideDialogue();

                            addFriend(colleague.name, slave.name);

                            // callback for work
                            work[2]();
                        }

                        showDialogue(colleague.name, colleagueSpeaksWithPolitics(colleague.name, 'meeting'), 
                            leftDialogueButtonCallback, rightDialogueButtonCallback);

                    } else if (askForWorkJobs.length > 0) {
                        let work = askForWorkJobs.shift();

                        workLeft = workLeft.filter(w => 
                            !(w instanceof Array) || 
                            w[0] != TYPE_OF_WORK.ASK_FOR_WORK || 
                            w[1] != colleague.name);

                        if (window.completeTaskCallback) {
                            window.completeTaskCallback();
                            window.completeTaskCallback = null;
                        }

                        let checkThatNoMoreAskForWork = function() {
                            let hasAskForWork = workLeft
                                .filter(work => work instanceof Array)
                                .filter(work => work[0] == TYPE_OF_WORK.ASK_FOR_WORK)
                                .length > 0;

                            if (!hasAskForWork) {
                                let meetingOrganizer = work[2];
                                let topicOfMeeting = Object.getOwnPropertySymbols(political_compass_for_person[meetingOrganizer])
                                    .filter(sym => political_compass_for_person[meetingOrganizer][sym])
                                    .sample();
                                
                                let happyPeople = 
                                    colleagues.filter((e) => political_compass_for_person[e.name][topicOfMeeting])
                                    .map(e => e.name);

                                let unhappyPeople =
                                    colleagues.filter((e) => !political_compass_for_person[e.name][topicOfMeeting])
                                    .map(e => e.name);

                                unhappyPeople.forEach(up => addPoliticalEnemy(up, meetingOrganizer));

                                let complainer = unhappyPeople
                                    .filter(up => !hasRelation(up, meetingOrganizer, 'friend'))
                                    .sample();

                                showDialogue("Meeting", 
                                    `A meeting was held.\n${complainer} was vocal about his unhappiness \nwith ${meetingOrganizer}'s support for ${displayPoliticalTopicActiveSense(topicOfMeeting)}.\nDo you inform ${complainer} that you have similar concerns?`,
                                    function() {hideDialogue();}, 
                                    function() {
                                        addFriend(complainer, slave.name);
                                        hideDialogue();
                                    });
                            }
                        }

                        leftDialogueButtonCallback = function() {
                            hideDialogue();
                            checkThatNoMoreAskForWork();
                        };

                        rightDialogueButtonCallback = function() {
                            if (hasRelation(colleague.name, work[2], 'political_enemy')) {
                                addPoliticalEnemy(colleague.name, slave.name);
                            }

                            hideDialogue();
                            checkThatNoMoreAskForWork();
                        }

                        showDialogue(colleague.name, `Oh, ${work[2]} wants a meeting.\n
                            Do you think ${work[2]} knows what should be done?`, 
                            leftDialogueButtonCallback, rightDialogueButtonCallback);
                    } else if (hasThrowWorkJobs) {
                        let work = workLeft.shift();

                        if (window.completeTaskCallback) {
                            window.completeTaskCallback();
                            window.completeTaskCallback = null;
                        }

                        leftDialogueButtonCallback = function() {
                            addFriend(colleague.name, slave.name);
                            hideDialogue();
                        };

                        rightDialogueButtonCallback = function() {
                            addPoliticalEnemy(colleague.name, slave.name);
                            hideDialogue();
                        }

                        showDialogue(colleague.name, "Are you sure I should work on this?", 
                            leftDialogueButtonCallback, rightDialogueButtonCallback);
                    } else if (talkToColleagueJobs.length > 0) {
                        let work = workLeft.shift();

                        leftDialogueButtonCallback = function() {
                            hideDialogue();
                        };

                        rightDialogueButtonCallback = function() {
                            hideDialogue();
                        }

                        showDialogue(colleague.name, askColleagueQuestion(), 
                            leftDialogueButtonCallback, rightDialogueButtonCallback);
                    } else if (conspireJobs) {
                        workLeft = workLeft.filter(w => 
                            !(w instanceof Array) || 
                            w[0] != TYPE_OF_WORK.CONSPIRE || 
                            w[1] != colleague.name);

                        if (window.completeTaskCallback) {
                            window.completeTaskCallback();
                            window.completeTaskCallback = null;
                        }

                        leftDialogueButtonCallback = function() {
                            hideDialogue();
                        };

                        rightDialogueButtonCallback = function() {
                            hideDialogue();
                        }

                        showDialogue(colleague.name, colleagueConspires(), 
                            leftDialogueButtonCallback, rightDialogueButtonCallback);
                        
                        
                    } else {
                        // just normal talk

                        leftDialogueButtonCallback = function() {
                            hideDialogue();
                        };

                        rightDialogueButtonCallback = function() {
                            hideDialogue();
                        }

                        let whatToSay = [
                                colleagueSpeaks, 
                                colleagueSpeaksWithPolitics.bind(null, colleague.name, 'smalltalk')
                            ].sample();
                        showDialogue(colleague.name, whatToSay(), leftDialogueButtonCallback, rightDialogueButtonCallback);
                    }

                    ticksSinceLastColleagueDialogue = 0;
                }

                return false;
            }
        }

        return true;
    }

    if (!isGameFrozen) {
        
        theSlaveMoves();
        for (let boss in bosses) {
            theBossFollows(boss);
        }

        gameticks += 1 % 10000;
        ticksSinceLastBossDialogue += 1 % 10000;
        ticksSinceLastColleagueDialogue += 1 % 10000;

        if (window.taskTimeLimit != Infinity) {
            if (window.taskTimeLimit == 0) {
                angerBoss(10);
                window.taskTimeLimit = Infinity;
            } else {
                window.taskTimeLimit -= 1;
            }
        }

        if (gameticks % 25 == 0) {
            for (boss of bosses) {
                if (randomInt(0, 1) == 0) {
                    boss.vx = randomInt(-5, 5);
                    boss.vy = 0;
                } else {
                    boss.vx = 0;
                    boss.vy = randomInt(-5, 5);
                }
                
            }
        }

        if (gameticks % 200 == 0) {
            let event = nextEvent();
            if (event) {
                event.run();
            }

            let e = produceEvent([TYPE_OF_WORK.PRINT, 
                TYPE_OF_WORK.TYPE, 
                TYPE_OF_WORK.TALK]);
            
            eventQueue.push(e);
        
        }

        let displayableWorkLeft = workLeft.map(
            work => displayWork(work)
        );

        workMessage.text = "Work left: " + displayableWorkLeft;
    }
}

function displayPoliticalTopicActiveSense(topic) {
    switch (topic) {
        case POLITICAL_TOPICS.QUALITY:
            return "raising our product's quality";
        case POLITICAL_TOPICS.SPEED :
            return "increasing our department's speed";
        case POLITICAL_TOPICS.COST:
            return "lowering the cost of our department";
        case POLITICAL_TOPICS.BUREACRACY:
            return "improving the department's processes and accountability";
        case POLITICAL_TOPICS.DICTATORSHIP:
            return "letting our department's head and CEO's have a hands-on approach to management";
        case POLITICAL_TOPICS.SOCIALISM:
            return "enhancing the distribution of credit and bonus in our department";
        default:
            console.log(topic);
            throw new Error('dev forget a case ')
    }
}

function displayPoliticalTopicNegatively(topic) {
    switch (topic) {
        case POLITICAL_TOPICS.QUALITY:
            return "our product's lack of quality";
        case POLITICAL_TOPICS.SPEED :
            return "our department's lack of speed";
        case POLITICAL_TOPICS.COST:
            return "the high cost of our department";
        case POLITICAL_TOPICS.BUREACRACY:
            return "the department's growing amount of red tape";
        case POLITICAL_TOPICS.DICTATORSHIP:
            return "our department's head and CEO's tight grip over the company";
        case POLITICAL_TOPICS.SOCIALISM:
            return "the unequal distribution of credit and bonus in our department";
        default:
            console.log(topic);
            throw new Error('dev forget a case ')
    }
}

function displayWork(work) {
    let workType;
    if (work instanceof Array) {
        workType = work[0];
    } else {
        workType = work;
    }
    switch (workType) {
        case TYPE_OF_WORK.PRINT:
            return 'Go to the printer and press a button';
        case TYPE_OF_WORK.TALK:
            return `Talk to ${work[1]}`; // TODO
        case TYPE_OF_WORK.TYPE:
            return 'Type on your computer'; // TODO
        case TYPE_OF_WORK.SCHEDULE_MEETING:
            return `Talk to ${work[1]} to schedule a meeting`;
        case TYPE_OF_WORK.THROW_WORK:
            return 'Delegate silly work to somewhere'; // TODO
        case TYPE_OF_WORK.ASK_FOR_WORK:
            return `Talk to ${work[1]} to convey a request from ${work[2]}`;
        case TYPE_OF_WORK.CONSPIRE:
            return 'conspire'; // TODO
        default:
            throw new Error("The developer forgot to include some case");
    }
}

function hitRectangle(r1, r2) {
    let combinedHalfWidths, combinedHalfHeights, vx, vy;
    
    r1.centerX = r1.x + r1.width / 2;
    r1.centerY = r1.y + r1.height / 2;
    r2.centerX = r2.x + r2.width / 2;
    r2.centerY = r2.y + r2.height / 2;

    
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;

    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    return Math.abs(vx) < combinedHalfWidths && Math.abs(vy) < combinedHalfHeights;
            
};

function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}


function hideDialogue() {
    isGameFrozen = false;
    dialogue.visible = false;
}
function showDialogue(person, text, leftDialogueButtonCallback,rightDialogueButtonCallback ) {
    dialoguePerson.text = person;

    leftButton.click = leftDialogueButtonCallback;
    rightButton.click = rightDialogueButtonCallback;

    isGameFrozen = true;
    dialogue.visible = true;
    speechText.text = text;
}


function nextEvent() {


    return eventQueue.shift();

}


function angerBoss(amt) {
    showDialogue("Urgent task failed", "You have failed to answer your boss's request quickly.\nYour boss is not pleased.",
        () => hideDialogue(),
        () => hideDialogue()
    );
    bossAnger += amt;
}