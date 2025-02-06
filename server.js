const express = require("express")
const axios = require("axios")
const path = require("path")

const app = express()
const PORT = 3000
const staticUrl = "https://67d4jpft7i.execute-api.eu-west-1.amazonaws.com/?url=https://api.digital.uefa.com/data-format/v1/matches/"
let matchId
// test matchid: 2040101

app.use(express.static(path.join(__dirname, "public")))

app.use("/:matchId", (req, res, next) => {
    matchId = Number(req.params.matchId)

    if(isNaN(matchId)){
        return res.status(400).json({error: "Invalid matchId: must be a number"})
    }

    // add checking the length

    next()
})

app.get("/:matchId", async (req, res) => {

    console.log("matchid:", matchId)

    const fullUrl = `${staticUrl}${matchId}`
    let returnObj = {}

    try{
        let response = await axios.get(fullUrl, {headers: {"accept": "application/json"}})
        let jsonData = response.data

        console.log("jsondata:", jsonData.referees, jsonData.referees.length, typeof jsonData.referees, Array.isArray(jsonData.referees))

        if(jsonData.referees && Array.isArray(jsonData.referees) && jsonData.referees.length > 0){
            returnObj.status = "valid"
            returnObj.invalidIndices = []
            returnObj.referees = [];
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

        if(returnObj.invalidIndices?.length > 0){
            returnObj.status = "invalid"
        }
        else{
            delete returnObj.invalidIndices
        }

    }
    catch (error){
        returnObj = {"error": error}
        console.error("error in GET:", error)
    }
    res.json(returnObj)

})


app.listen(PORT)