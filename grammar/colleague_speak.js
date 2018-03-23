var colleagueGrammar = tracery.createGrammar({
	
	"officeItem": ["printer", "stapler", "chair", "coffee mug"],
	"mood": ["vexed","indignant","impassioned","depressed"],
	"greeting": ["Hey John,"],
    "goAway": ["#greeting#\nI am really #mood# right now, so can you go away?"],
    "questionText": ["which slidedeck to print?", "which excel sheet to edit?", "which excel workbook to print?", "which excel file to delete?", "whose documents to clean up?", "which intern you are supervising?", "what's our boss favourite coffee brand?", "where to buy the bithday cake for our CEO?", "where was last year's sales report kept?", "how did HR hire and fire so many people last year?", "which spreadsheet has that error our CEO complained about?", "how to generate a sales report for odd-numbered months in the past 5 years?", "which team handles the maintanence of our broken internal portal?", "how many customers we lost in the past year?", "how many complaints we have from our customers?", "how much did our competitors outsell us by?"],
    "question": ["Do you need to know #questionText#. I will email you my answer later when my schedule clears up."]
});

function colleagueSpeaks() {
    return colleagueGrammar.flatten("#goAway#");
}

function askColleagueQuestion() {
    return colleagueGrammar.flatten("#question#");
}