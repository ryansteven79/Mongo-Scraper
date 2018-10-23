// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");

// const serve   = require('express-static');





// Initialize Express
var app = express();
app.use(express.static("public"));

// Database configuration
var databaseUrl = "mongo-devdrive";
var collections = ["articles"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function (error) {
    console.log("Database Error:", error);
});

app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Main route (simple Hello World Message)
app.get("/", function (req, res) {
    db.articles.find({}, function (err, data) {
        var hbsObject = {articles: data};

        res.render("index", hbsObject);
    })
});



// Retrieve data from the db
app.get("/all", function (req, res) {
    // Find all results from the scrapedData collection in the db
    db.articles.find({}, function (error, found) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the data to the browser as json
        else {
            res.json(found);
            // res.render("index",found);
        }
    });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
    // Make a request for the news section of `Developer Drive`
    request("http://www.developerdrive.com/", function (error, response, html) {
        // Load the html body from request into cheerio
        var $ = cheerio.load(html);
 
        $("div.hp-post-parts.frame-box.animation-card").each(function (i, element) {
            // Save the text and href of each link enclosed in the current element
            var title = $(element).find('.hp-post-title').text().trim();
            var link = $(element).find('.hp-post-title').children().attr('href');
            var summary = $(element).find('div.hppp-text').text().trim();
            var category = $(element).find('.hppp-category').text().trim();

            // Insert the data in the scrapedData db
            db.articles.insert({
                    title: title,
                    link: link,
                    summary: summary,
                    category: category
                },
                function (err, inserted) {
                    if (err) {
                        // Log the error if one is encountered during the query
                        console.log(err);
                    } else {
                        // Otherwise, log the inserted data
                        console.log(inserted);
                    }
                });
        });
    });

    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
    
});


// Listen on port 3000
app.listen(3000, function () {
    console.log("App running on port 3000!");
});