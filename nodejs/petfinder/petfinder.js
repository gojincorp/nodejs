// Copyright TuggerToys, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Include dependencies
var http = require('http');
var url = require('url');

var server = http.createServer();

/*
// Hard coded URLs
var urls = [
	"http://api.petfinder.com/shelter.find?format=json&key=5aecd2abf90929bd01aad4e46282f529&location=95124" +
	"" +
	"",
	"http://api.petfinder.com/shelter.find?format=json&key=5aecd2abf90929bd01aad4e46282f529&location=reno,nv"
];
*/

server.on('request', function(req, res) {
	res.writeHead(200, {'content-type': 'application/json'});

	
	var totalResults = [];
	var responseCnt = 0;
	var queryObj = url.parse(req.url, true).query;
	console.log('queryObj:  ', queryObj);
	var location = queryObj.location; // ...need to handle error case here.
	var breed = queryObj.breed; // ...need to handle error case here.
	var callback = queryObj.callback; // ...need to handle error case here.
	var action = queryObj.action

	/*
	 * Select URL based on requested action
	 */
	switch (action) {
		case 'findShelters':
			var urls = [
				"http://api.petfinder.com/shelter.find?format=json&key=5aecd2abf90929bd01aad4e46282f529&location=" + location
			];
			break;
		case 'findBreeds':
			var urls = [
				"http://api.petfinder.com/breed.list?format=json&key=5aecd2abf90929bd01aad4e46282f529&animal=dog"
			];
			break;
		case 'findDogs':
		default:
			var urls = [
				"http://api.petfinder.com/pet.find?format=json&key=5aecd2abf90929bd01aad4e46282f529&location=" + location + '&animal=dog&breed=' + breed
			];
			break;
	}

	/*
	 * Callback handler to process httpget json response
	 */
	function processJsonRes (jsonRes) {
		var jsonRspBody = '';
		jsonRes.setEncoding('utf8');
		
		// Read data as it become available
		jsonRes.on('data', function(jsonRspFrag) {
			jsonRspBody += jsonRspFrag;
		});
		
		// Package and send jsonp response back to client
		jsonRes.on('end', function() {
			// Convert json string to javascript object
			var objRsp = JSON.parse(jsonRspBody);
			
			// Check status code returned from petfinder API
			var rspStatusCode = parseInt(objRsp.petfinder.header.status.code.$t);
			if (rspStatusCode !== 100) {
			// Petfinder returned an error...
				console.log(__filename + "::processJsonRes()...need to handle error cases here.");
				responseCnt++;
			} else {
				switch (action) {
				case 'findShelters':
					totalResults = totalResults.concat(objRsp.petfinder.shelters.shelter);
					responseCnt++;
					break;
				case 'findDogs':
					totalResults = totalResults.concat(objRsp.petfinder.pets.pet);
					responseCnt++;
					break;
				case 'findBreeds':
					totalResults = totalResults.concat(objRsp.petfinder.breeds.breed);
					responseCnt++;
					break;
				}
				console.log("%d results from path: ", totalResults.length, jsonRes.req.path);
				
				// After all URLs have been processed we can send back a response.
				if (responseCnt === urls.length) {
					console.log("All results have returned...total number of results is ", totalResults.length);

					switch (action) {
					case 'findShelters':
						res.end(callback + '(' + JSON.stringify({shelters: totalResults}) + ');', 'utf8');
						break;
					case 'findDogs':
						res.end(callback + '(' + JSON.stringify({pets: totalResults}) + ');', 'utf8');
						break;
						case 'findBreeds':
							res.end(callback + '(' + JSON.stringify({breeds: totalResults}) + ');', 'utf8');
							break;
					}
				}
			}
		});
	}

	urls.forEach(function(url) {
		http.get(url, processJsonRes);
	});
});

var port = 7071;
server.listen(port);
server.once('listening', function() {
	console.log("Hello World server listening on port %d", port);
});