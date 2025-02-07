// Importing dependencies
const express = require("express")
const axios = require("axios")
const path = require("path")

const app = express() // Making an Express.js app
const PORT = 3000 // Specifying the port
const staticUrl = "https://67d4jpft7i.execute-api.eu-west-1.amazonaws.com/?url=https://api.digital.uefa.com/data-format/v1/matches/" // Saving the API
let matchId // Example: 2040101

// Using the static page in the public folder
app.use(express.static(path.join(__dirname, "public")))

// Middleware to verify the match ID format.
// This prevents attacks
app.use("/:matchId", (req, res, next) => {
    matchId = Number(req.params.matchId)

    // Verifies that the matchID is a number to prevent injections
    if(isNaN(matchId)){
        return res.status(400).json({error: "Invalid matchId: must be a number"})
    }

    // Moves on to the next thing
    next()
})

// Checking the JSON file this will run on a GET request and take the dynamic parameter, match ID
app.get("/:matchId", async (req, res) => {

    console.log("matchid:", matchId)

    // constructing the full URL based on the match ID
    const fullUrl = `${staticUrl}${matchId}`
    let returnObj = {}

    try{
        // fetching data from the API
        let response = await axios.get(fullUrl, {headers: {"accept": "application/json"}})
        let jsonData = response.data

        console.log("jsondata:", jsonData.referees, jsonData.referees.length, typeof jsonData.referees, Array.isArray(jsonData.referees))

        // Checking if the file has a "referee" list
        if(jsonData.referees && Array.isArray(jsonData.referees) && jsonData.referees.length > 0){
            returnObj.status = "valid"
            returnObj.invalidIndices = []
            returnObj.referees = [];

            // Looping through all the items in the referees list and validating
            for(let i = 0; i < Object.keys(jsonData.referees).length; i++){
                if(jsonData.referees[i].person){
                    if(jsonData.referees[i].person.translations){
                        if(jsonData.referees[i].person?.translations?.countryName?.EN &&
                            jsonData.referees[i].person?.translations?.firstName?.EN &&
                            jsonData.referees[i].person?.translations?.lastName?.EN){
                                
                                returnObj.referees[i] = {"country name": jsonData.referees[i].person?.translations?.countryName?.EN,
                                    "first name": jsonData.referees[i].person?.translations?.firstName?.EN,
                                    "last name": jsonData.referees[i].person?.translations?.lastName?.EN}

                                    console.log(`Referee index ${i} has the nececarry properties`)
                            }        
                            else{
                                returnObj.referees[i] = {"country name": jsonData.referees[i].person?.translations?.countryName?.EN,
                                    "first name": jsonData.referees[i].person?.translations?.firstName?.EN,
                                    "last name": jsonData.referees[i].person?.translations?.lastName?.EN}

                                returnObj.invalidIndices.push(i)
                                console.log(`Referee with index ${i} is missing properties or values:\n\ncountry: ${jsonData.referees[i].person?.translations?.countryName?.EN}\nfirst name: ${jsonData.referees[i].person?.translations?.firstName?.EN}\nlast name: ${jsonData.referees[i].person?.translations?.lastName?.EN}\n`)
                            }
                    }
                    else{
                        returnObj.referees[i] = "missing persons.translations attribute"
                        console.log(`Referee with index ${i} is missing persons.translations attribute`)
                    }
                }
                else{
                    returnObj.referees[i] = "missing persons attribute"
                    console.log(`Referee with index ${i} is missing persons attribute`)
                }  
            }
        }
        else{
            returnObj.referees = "referee list is empty or does not exist"
            returnObj.status = "invalid"
            console.log("File is missing referee list")
        }

        // checks if there were any invalid attributes and changes the status to invalid
        if(returnObj.invalidIndices?.length > 0){
            returnObj.status = "invalid"
        }
        // deletes the invalidIndices if there were none
        else{
            delete returnObj.invalidIndices
        }

    }
    // catches errors
    catch (error){
        returnObj = {"error": error}
        console.error("error in GET:", error)
    }
    // outputs the returnObj as a JSON file to the place that made the GET request
    res.json(returnObj)

})

// listens for HTTP request on the specified port
app.listen(PORT)