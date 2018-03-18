var bossGrammar = tracery.createGrammar({
	"name": ["... is your name John?", "Steve? Uh no, it's John, right? "],
	"officeItem": ["printer", "stapler", "chair", "coffee mug"],
	"mood": ["vexed","indignant","impassioned","depressed"],
	"greeting": ["Hey #name#, you look #mood#.\n How is everything going?"],
	"doMoreWork": ["#[slave:#name#][slaveFavouriteItem:#officeItem#]greeting#.\nIt will be great if you could go ahead \nand fix these problems for me."]
});

function bossSpeaks() {
    return bossGrammar.flatten("#doMoreWork#");
}