var fs = require('fs');
var ejs = require('ejs'); // loading EJS into our project
var tumblr = require('tumblr.js');  // loading tumblr into the project
var mandrill = require('mandrill-api/mandrill'); // loading mandrill into the project
var mandrill_client = new mandrill.Mandrill('API KEY HERE'); //provide mandrill api key between quotes

// Authenticate via OAuth, provide tumblr api keys here
var client = tumblr.createClient({
  consumer_key: 'API KEY HERE',
  consumer_secret: 'API KEY HERE',
  token: 'API KEY HERE',
  token_secret: 'API KEY HERE'
});

var csvFile = fs.readFileSync("friend_list.csv","utf8");	// stores the information from the csv file into a variable encoded as a string
var emailHtml = fs.readFileSync("email_template.ejs","utf8");  // stores the information from the email template into a variable encoded as a string

var sendEmail = function(to_name, to_email, from_name, from_email, subject, message_html){  // function to send email using Mandrill API
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 };

var csvParse = function(csvFile) {		// function to create an array of objects based on the contents of the .csv file
	var objectArray = [];
	var values = csvFile.split('\n');
	var keys = values.shift().split(',');
	var obj;

	values.forEach(function(person) {
		obj = {};
		var personInfo = person.split(',');
		for (var i =0; i < personInfo.length; i++) {
			obj[keys[i]] = personInfo[i];
		}
		objectArray.push(obj)
	});
	return objectArray;
};

var sendOutEmails = function(csv_data, posts) {
	csv_data.forEach(function(contact) {		// Goes through each contact from the .csv file
		var firstName = contact['firstName'];   
		var numMonthsSinceContact = contact['numMonthsSinceContact'];
		var emailAddress = contact['emailAddress'];
		var fromName = "NAME HERE";		// Name of person sending out the emails  "FirstName LastName"
		var fromEmail = "EMAIL ADDRESS HERE";		// Email address of person sending out the emails  "someone@emailadd.com"
		var subject = "EMAIL SUBJECT HERE"		// Subject line of email sent "Title of Email"
		var latestPosts = posts;					// sets the latestPosts variable equal to the argument passed into the function
		var emailToSend = ejs.render(emailHtml, 	// Uses the ejs library to programmatically insert the above information into the email template
	                { firstName: firstName,  
	                  numMonthsSinceContact: numMonthsSinceContact,
	                  latestPosts: latestPosts
	                });
		//console.log(emailToSend);
		sendEmail(firstName, emailAddress, fromName, fromEmail, subject, emailToSend);  //

	});
};

var csv_data = csvParse(csvFile);



client.posts('TUMBLR BLOG URL HERE', function(err, blog) {		// Enter the url of your tumblr blog ex: yourblog.tumblr.com
	// Get Current Date as a number of seconds since epoch
	var currentDate = new Date();  // Creates a new date object
	var currentDateInSeconds = currentDate.getTime()/1000; // Current time in seconds since unix/posix time Jan 1 1970
	var numberOfDays = 7;  // Sets the range on the number of days you want recent posts to cover
	var timeInSeconds = numberOfDays*24*60*60;  // Determines the number of seconds in the amount of days you have chosen
	var latestPosts = [];  // array to store the posts which are within the timeframe chosen

	// Get Date of blog posts
	// Date.prototype.getTime() returns nunmber of milliseconds since Jan 1 1970
	// 
	blog.posts.forEach(function(element){
		if ((currentDateInSeconds - element.timestamp) < timeInSeconds) { //Tests if the difference in time between the blog post and the current time is within the range of time you want to see posts from
			
			latestPosts.push(element); //Stores the post
		}
	});
	sendOutEmails(csv_data, latestPosts);  //Executes the sendOutEmails function passing in the contact information from the .csv file and the array with the latest posts
	
});




