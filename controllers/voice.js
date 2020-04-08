const express = require('express');
const router = require('express').Router();
const verify = require("../models/verifyToken");
const VoiceMethods = require('../models/Voice');

var cookieParser = require('cookie-parser');
router.use(cookieParser());




//Static files
router.use("/", express.static("assets"));

//login GET
router.get("/start", async (req, res) => {

    //All words(incl. the wrong ones) are stored in memory
    let userBackupId = await req.cookies['userBackupId'];
    console.log(userBackupId);
    let userWords = await VoiceMethods.getUserWords(userBackupId);

    res.cookie("userWords", userWords);
    // global.userWords = await VoiceMethods.getUserWords();

    //Counter for the words sent to test
    let words = await req.cookies['words'];


    let counterWordsInt = await req.cookies['counterWords'];


    let startCounter = await req.cookies['startCounter'];


    let scoreInt = await req.cookies['score'];


    res.render("../views/start.ejs");
});
//login POST
router.post("/start", (req, res) => {
    res.redirect('./talk-login');
});

//talk-login GET
router.get("/talk-login", verify, async (req, res) => {
    //Verifies(verify middleware) that user logged in.
    if (req.user == "Access denied") {
        res.render("../views/error.ejs", {msg: "Please login"});
    } else if (req.user == "Invalid token") {
        res.render("../views/error.ejs", {msg: "Wrong email or password"});
    } else {
        let userBackupId = await req.cookies['userBackupId'];
        console.log(userBackupId);
        //Sets the current word that is sent to user
        let userWords = await req.cookies['userWords'];

        let startCounter = await req.cookies['startCounter'];


        let currentWord = await Object.keys(userWords)[parseInt(startCounter)];
        res.cookie("currentWord", currentWord);
        // global.currentWord = Object.keys(global.userWords)[global.startCounter];


        let currentResWords = userWords[currentWord];
        res.cookie("currentResWords", currentResWords);
        // global.currentResWords = global.userWords[global.currentWord];

        //Check if test if finished or not
        let counterWords = await req.cookies['counterWords'];


        if (parseInt(counterWords) > parseInt(startCounter)) {
            res.redirect('./talk-more');
        } if (counterWords == startCounter) {
            let userBackupId = await req.cookies['userBackupId'];
            let score = await req.cookies['score'];

            // Adds score to statistics in DB
            await VoiceMethods.addToStatistics(userBackupId, parseInt(score), parseInt(counterWords));
            res.render("../views/finished.ejs", {score: parseInt(score), total: parseInt(counterWords)});
        }

    }
});

//talk-login GET
router.get("/talk-more", verify, async (req, res) => {
    //Verifies(verify middleware) that user logged in.
    let userBackupId = await req.cookies['userBackupId'];
    console.log(userBackupId);
    let currentWord = await req.cookies['currentWord'];
    res.render("../views/talk.ejs", { msg: currentWord });
});


//submit POST
router.post("/submit", async (req, res) => {
    //Adds one(1) to startCounter
    let startCounter = await req.cookies['startCounter'];
    let startCounterInt = parseInt(startCounter);
    let userBackupId = await req.cookies['userBackupId'];
    console.log(userBackupId);
    res.cookie("startCounter", parseInt(startCounterInt+1));
    // global.startCounter = global.startCounter + 1;

    //Sets submitted word to memory(so addToNrOfTries can run correctly)
    res.cookie("subWord", req.body.value.toLowerCase());
    // global.subWord = req.body.value.toLowerCase();


    //Checks if word exists under res_word for current word
    let currentResWords = await req.cookies['currentResWords'];
    let subWord = req.body.value.toLowerCase();
    let checkIfWordExist = currentResWords.includes(subWord);

    if (checkIfWordExist == true) {
        // word exist
        // global.result = "rätt";
        let score = await req.cookies['score'];


        // let subWord = await req.cookies['subWord'];

        await VoiceMethods.addToNrOfTries(userBackupId, subWord);
        let scoreInt = parseInt(score)
        res.cookie("score", parseInt(scoreInt+1));
        // global.score = global.score + 1;
        res.redirect('./jump');
    } else {
        // word does not exist

        // Check that no clash with other word
        let words = await req.cookies['words'];
        // let checkNoClash = currentResWords.includes(subWord);
        let checkNoClash = words.includes(subWord); //ÄNDRA?

        // let checkNoClash = words.includes(subWord); // KANSKE BEHÅLLA?

        if (checkNoClash == true) {
            //Clash. Word not added to res_word
            // global.result = "fel";
            res.redirect('./jump');
        } else {
            //No clash. Word added to res_word
            // global.result = "fel";
            console.log("v");
            console.log(userBackupId);
            console.log("A");

            let currentWord = await req.cookies['currentWord'];
            await VoiceMethods.addResWord(userBackupId, currentWord, subWord);
            res.redirect('./jump');
        }
    }
});

//submit GET
router.get("/jump", async (req, res) => {
    res.redirect('./talk-login');
});

//submit GET
router.get("/submit", async (req, res) => {
    let result = await req.cookies['result'];
    let subWord = await req.cookies['subWord'];

    res.render("../views/result.ejs", {msg: result, result: subWord});
});


//restart GET
router.get("/restart", verify, async (req, res) => {
    // //Resets all memory variables and loads in all words (incl new res_words)
    // let words = await VoiceMethods.getWords();
    // res.cookie("words", words);
    // // global.words = await VoiceMethods.getWords();
    //
    //
    // let userBackupId = req.cookies['userBackupId'];
    // await VoiceMethods.setUserWords(words, userBackupId);
    //
    // let userWords = await VoiceMethods.getUserWords(userBackupId);
    //
    //
    // let counterWords = await VoiceMethods.getCounterWords(words);
    //
    // res.cookie("userWords", "userWords");
    // res.cookie("counterWords", parseInt(counterWords));
    // res.cookie("startCounter", parseInt(0));
    // res.cookie("score", parseInt(0));

    res.clearCookie('userBackupId');
    res.clearCookie('globalToken');
    res.clearCookie('words');
    res.clearCookie('userWords');
    res.clearCookie('counterWords');
    res.clearCookie('currentResWords');
    res.clearCookie('subWord');
    res.clearCookie('result');
    console.log("---------------------------------------");
    res.clearCookie('startCounter');
    res.clearCookie('score');
    res.clearCookie('currentWord');
    console.log(req.cookies);


    res.redirect('./restart-log');
    // res.redirect('./talk-login');
});


//restart GET
router.get("/restart-log", verify, async (req, res) => {
    //Words are imported from words-table in DB and stored
    //in memory




    console.log("---------------------------------------");
    console.log(req.cookies);
    res.redirect('../user/login');

});

module.exports = router;
