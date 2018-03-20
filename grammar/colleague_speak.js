var colleagueGrammar = tracery.createGrammar({
	
	"officeItem": ["printer", "stapler", "chair", "coffee mug"],
	"mood": ["vexed","indignant","impassioned","depressed"],
	"greeting": ["Hey John,"],
	"goAway": ["#greeting#.\nI am really #mood# right now, so can you go away?"]
});

function colleagueSpeaks() {
    return colleagueGrammar.flatten("#goAway#");
}