var type = "WebGL";
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

var slave = null;
var printer = null;
var bosses = [];
var colleagues = [];

var gameticks = 0;

var levelLines = [];

var workLeft = [];
var bossAnger = 0;

var dialogue;
var leftButton;
var rightButton;
var isGameFrozen = false;
var ticksSinceLastBossDialogue = 0;
var ticksSinceLastColleagueDialogue = 0;

var workMessage = new PIXI.Text("Work left");
var bossMessage = new PIXI.Text("How angry your boss is");
var speechText;


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
    TYPE : Symbol('type'),
    TALK: Symbol('talk')
});

function setup() {
    slave = new PIXI.Sprite(
        PIXI.loader.resources["images/office_drone.png"].texture
    );

    var startingPosition = CUBICLE_POSITIONS.sample();
    slave.x = startingPosition[0];
    slave.y = startingPosition[1] + 50;

    let computer = new PIXI.Sprite(
        PIXI.loader.resources["images/computer.png"].texture
    );

    computer.x = startingPosition[0];
    computer.y = startingPosition[1];

    slave.vx = 0;
    slave.vy = 0;

    slave.width = 50;
    slave.height = 50;

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

            colleagues.push(colleague);

        }
    }
    

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
        speechText.position = new PIXI.Point (app.stage.width / 2 - 180 ,app.stage.height / 2 - 80);
        dialogue.addChild(speechText);


        dialogue.visible = false;
        
    }
    createDialogueBox();
    hideDialogue();


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

        if (options && options['checkBoss'] && ticksSinceLastBossDialogue > 50) {
            for (var boss of bosses) {
                if (hitRectangle(future, boss)) {

                    leftDialogueButtonCallback = function() {
                        hideDialogue();

                        bossAnger += 5;
                    };

                    rightDialogueButtonCallback = function() {
                        hideDialogue();

                        workLeft.push(Object.values(TYPE_OF_WORK).sample());
                    }
                    showDialogue(bossSpeaks(), leftDialogueButtonCallback, rightDialogueButtonCallback);

                    ticksSinceLastBossDialogue = 0;

                    
                    return false;
                }
            }
        }

        if (!options.hasOwnProperty('incPrinter') || options['incPrinter'] === true) {
            if (hitRectangle(future, printer)) {
                let index = workLeft.indexOf(TYPE_OF_WORK.PRINT);
                if (index > -1) {
                    workLeft.splice(workLeft.indexOf(TYPE_OF_WORK.PRINT), 1);
                }
                return false;
            }
        }

        for (var colleague of colleagues) {
            if (hitRectangle(future, colleague)) {
                leftDialogueButtonCallback = function() {
                    hideDialogue();

                };

                rightDialogueButtonCallback = function() {
                    hideDialogue();

                }

                showDialogue(colleagueSpeaks(), leftDialogueButtonCallback, rightDialogueButtonCallback);

                ticksSinceLastColleagueDialogue = 0;

                return false;
            }
        }

        return true;
    }

    if (!isGameFrozen) {
        

        theSlaveMoves();
        for (boss in bosses) {
            theBossFollows(boss);
        }

        gameticks += 1 % 10000;
        ticksSinceLastBossDialogue += 1 % 10000;
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

        workMessage.text = "Work left: " + workLeft.length;
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
function showDialogue(text, leftDialogueButtonCallback,rightDialogueButtonCallback ) {
    leftButton.click = leftDialogueButtonCallback;
    rightButton.click = rightDialogueButtonCallback;

    isGameFrozen = true;
    dialogue.visible = true;
    speechText.text = text;
}