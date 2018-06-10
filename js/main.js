const GAMEWIDTH = 1024;
const GAMEHEIGHT = 600;
const BACKGROUNDSCALEX = 1;
const BACKGROUNDSCALEY = BACKGROUNDSCALEX;
const BACKGROUNDWIDTH = 1024*BACKGROUNDSCALEX;
const BACKGROUNDHEIGHT = 768*BACKGROUNDSCALEY;
const PLANETSCALE = .35;
const SHIPACELERATION = 150;
const SHIPANGULARVELOCITY = 200;
const SHIPMAXVELOCITY = 150;
const SHIPDRAG = 100;
const SHIPSCALE = 0.15;
const BULLETVELOCITY = 1000;
const BULLETLIFESPAN = 2000;
const BULLETDELAY = 300;
const BULLETSCREATED = 40;
const ASTEROIDSCREATED = 10;
const ASTEROIDSKILLLIMIT = 9;
const ASTEROIDTIMELIMIT = 3000;
const ASTEROIDSWIDTH = 32;
const ASTEROIDSHEIGHT = ASTEROIDSWIDTH;
const ASTEROIDMAXVELOCITY = 50;
const ASTEROIDMAXROTATION = 50;
const LIVESNUMBER = 3;
const MAXHEALTH =100;
const PI = 3.14159265;
var game = new Phaser.Game(GAMEWIDTH, GAMEHEIGHT, Phaser.CANVAS, 'mainDiv', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('space', 'res/space.jpg');
    game.load.image('bullet', 'res/bullets.png');
    game.load.image('ship', 'res/spaceship.png');
    game.load.image('planet','res/planet.png');
    game.load.image('asteroid1','res/asteroid1.png');
    game.load.image('asteroid2','res/asteroid2.png');
    game.load.image('asteroid3','res/asteroid3.png');
}

var ship;
var cursors;
var bullet;
var bullets;
var bulletTime = 0;
var background;
var planet;
var lives=LIVESNUMBER;
var directionMultiplier=1;
var lastAsteroidTime=0;
var asteroidPlaceY=0;
function create() {

    //  This will run in Canvas mode, so let's gain a little speed and display
    game.renderer.clearBeforeRender = false;
    game.renderer.roundPixels = true;

    //  We need arcade physics
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //enable advancedtiming
	game.time.advancedtiming = true;

    //  A spacey background
    background = game.add.tileSprite(0, 0, BACKGROUNDWIDTH, BACKGROUNDHEIGHT, 'space');

    // Set game bounds to full background
    game.world.setBounds(0, 0, BACKGROUNDWIDTH, BACKGROUNDHEIGHT);

    // Planet
    planet = game.add.sprite(BACKGROUNDWIDTH/2, BACKGROUNDHEIGHT/2, 'planet');
    planet.anchor.set(0.5);
    planet.scale.setTo(PLANETSCALE);
    game.physics.enable(planet, Phaser.Physics.ARCADE);

    //  Our ships bullets
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    //  All 40 of them
    bullets.createMultiple(BULLETSCREATED, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);

    //  Our player ship
    ship = game.add.sprite(BACKGROUNDWIDTH/2, BACKGROUNDHEIGHT/2, 'ship');
    ship.scale.setTo(SHIPSCALE);
    ship.anchor.set(0.5);
    ship.outOfCameraBoundsKill=true;
    ship.autoCull=true;
	ship.events.onKilled.add(killShip, this);
    //  and its physics settings
    game.physics.enable(ship, Phaser.Physics.ARCADE);
    ship.body.drag.set(SHIPDRAG);
    ship.body.maxVelocity.set(SHIPMAXVELOCITY);

    // asteroids
    asteroids = game.add.group();
    asteroids.enableBody = true;
    asteroids.physicsBodyType = Phaser.Physics.ARCADE;
    asteroids.createMultiple(ASTEROIDSCREATED, 'asteroid1');
    asteroids.createMultiple(ASTEROIDSCREATED, 'asteroid2');
    asteroids.createMultiple(ASTEROIDSCREATED, 'asteroid3');
    asteroids.setAll('exists',true);
    asteroids.setAll('alive',true);
    asteroids.setAll('visible',true);
    asteroids.setAll('anchor.x', 0.5);
    asteroids.setAll('anchor.y', 0.5);
    asteroids.iterate('exists',true,asteroids.RETURN_TOTAL,placeAsterois,this);
    //  Game input
    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

    //Init Camera
    game.camera.follow(ship);
}

function update() {

	var currTime = game.time.time;
    if (cursors.up.isDown)
    {
        game.physics.arcade.accelerationFromRotation(ship.rotation, SHIPACELERATION, ship.body.acceleration);
        directionMultiplier=1;
    }
    else if (cursors.down.isDown)
    {
    	game.physics.arcade.accelerationFromRotation(ship.rotation, -SHIPACELERATION, ship.body.acceleration);
    	directionMultiplier=-1;
    }
    else
    {
        ship.body.acceleration.set(0);
    }

    if (cursors.left.isDown)
    {
        ship.body.angularVelocity = -SHIPANGULARVELOCITY;
    }
    else if (cursors.right.isDown)
    {
        ship.body.angularVelocity = SHIPANGULARVELOCITY;
    }
    else
    {
        ship.body.angularVelocity = 0;
    }
    if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
    {
        fireBullet();
    }
    if(asteroids.countDead()<ASTEROIDSKILLLIMIT && (currTime-lastAsteroidTime)>ASTEROIDTIMELIMIT)
    {
    	asteroidCreate();
    	lastAsteroidTime=currTime;
    }
    game.physics.arcade.overlap(bullets, asteroids, bulletAsteroidCollision, null, this);
	game.physics.arcade.overlap(ship, asteroids, shipAsteroidCollision, null, this);
	game.physics.arcade.overlap(planet, asteroids, planetAsteroidCollision, null, this);
	game.physics.arcade.overlap(asteroids, asteroids, asteroidsCollision, null, this);
    //screenWrap(ship);
    //bullets.forEachExists(screenWrap, this);

}

function render() {
}

function fireBullet () {
    if (game.time.now > bulletTime)
    {
        bullet = bullets.getFirstExists(false);
        if (bullet)
        {
            bullet.reset(ship.x+((ship.width/2)*Math.cos(ship.rotation)), ship.y+((ship.width/2)*Math.sin(ship.rotation)));
            bullet.lifespan = BULLETLIFESPAN;
            bullet.rotation = ship.rotation;
            //game.physics.arcade.velocityFromRotation(bullet.rotation, directionMultiplier*Math.pow(Math.pow(ship.body.velocity.x,2)+Math.pow(ship.body.velocity.y,2),1/2)+BULLETVELOCITY, bullet.body.velocity);
            game.physics.arcade.velocityFromRotation(bullet.rotation, BULLETVELOCITY, bullet.body.velocity);
            bulletTime = game.time.now + BULLETDELAY;
        }
    }
}

function placeAsterois(asteroid)
{
	asteroid.position.setTo(-2*ASTEROIDSWIDTH,asteroidPlaceY);
	asteroidPlaceY+=2*ASTEROIDSWIDTH;
}

function asteroidCreate () {
	var asteroidX;
	var asteroidY;
	var side = parseInt(Math.random()*100)%2;

	if(side)
	{
		var left = parseInt(Math.random()*100)%2;
		if(left)
		{
			asteroidX = -ASTEROIDSWIDTH;
			asteroidY = parseInt(Math.random()*BACKGROUNDHEIGHT);
		}
		else
		{
			asteroidX = BACKGROUNDWIDTH+ASTEROIDSWIDTH;
			asteroidY = parseInt(Math.random()*BACKGROUNDHEIGHT);
		}
	}
	else
	{
		var top = parseInt(Math.random()*100)%2;
		if(top)
		{
			asteroidX = parseInt(Math.random()*BACKGROUNDWIDTH);
			asteroidY = -ASTEROIDSHEIGHT;
		}
		else
		{
			asteroidX = parseInt(Math.random()*BACKGROUNDWIDTH);
			asteroidY = BACKGROUNDHEIGHT+ASTEROIDSHEIGHT;
		}
	}	
	var asteroidVelocity = parseInt((Math.random()+.01)*ASTEROIDMAXVELOCITY);
	var asteroidRotation = parseInt((Math.random()+.01)*ASTEROIDMAXROTATION);
	asteroid = asteroids.getFirstExists(false);
    if (asteroid)
    {
        asteroid.reset(asteroidX, asteroidY);
        game.physics.arcade.accelerateToObject(asteroid, planet, asteroidVelocity, asteroidVelocity, asteroidVelocity);
        //game.physics.arcade.velocityFromRotation(asteroidRotation, asteroidVelocity, asteroid.body.velocity);
    }

}

function bulletAsteroidCollision(bullet, asteroid)
{
	bullet.kill();
	asteroid.kill();
}

function shipAsteroidCollision(ship, asteroid)
{
	killShip();
	asteroid.kill();
}

function planetAsteroidCollision(planet,asteroid)
{
	asteroid.kill();
}

function asteroidsCollision(asteroid1,asteroid2)
{
	asteroid1.kill();
	asteroid2.kill();
}

function killShip()
{
	lives -=1;
	ship.reset(BACKGROUNDWIDTH/2, BACKGROUNDHEIGHT/2,MAXHEALTH);
}
/*function screenWrap (ship) {

    if (ship.x < 0)
    {
        ship.x = game.world.width;
    }
    else if (ship.x > game.world.width)
    {
        ship.x = 0;
    }

    if (ship.y < 0)
    {
        ship.y = game.world.height;
    }
    else if (ship.y > game.world.height)
    {
        ship.y = 0;
    }

}*/