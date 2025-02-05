const express = require("express")
const axios = require("axios")
const fs = require("fs")
const util = require("util")

const app = express()
const PORT = 3000
const staticUrl = "https://67d4jpft7i.execute-api.eu-west-1.amazonaws.com/?url=https://api.digital.uefa.com/data-format/v1/matches/"
let matchId = "2040101"
let fullUrl = `${staticUrl}${matchId}`

async function getData() {
    try{
        let response = await axios.get(fullUrl, {headers: {"accept": "application/json"}})

        let jsonData = response.data

        if(jsonData.referees){
            for(let i = 0; i < Object.keys(jsonData.referees).length; i++){
                if(jsonData.referees[i].person){
                    if(jsonData.referees[i].person.translations){
                        if(jsonData.referees[i].person?.translations?.countryName?.EN &&
                            jsonData.referees[i].person?.translations?.firstName?.EN &&
                            jsonData.referees[i].person?.translations?.lastName?.EN){
                    
                                console.log(`Referee index ${i} has the nececarry properties`)
                            }        
                            else{
                                console.log(`Referee with index ${i} is missing properties or values:\n\ncountry: ${jsonData.referees[i].person?.translations?.countryName?.EN}\nfirst name: ${jsonData.referees[i].person?.translations?.firstName?.EN}\nlast name: ${jsonData.referees[i].person?.translations?.lastName?.EN}\n`)
                            }
                    }
                    else{
                        console.log(`Referee with index ${i} is missing persons.translations attribute`)
                    }
                }
                else{
                    console.log(`Referee with index ${i} is missing persons attrib`)
                }  
            }
        }
        else{
            console.log("File is missing referee list")
        }

    }
    catch (error){
        console.error("error in getData():", error)
    }
}

getData()

app.listen(PORT)