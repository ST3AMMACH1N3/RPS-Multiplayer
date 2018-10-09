$(document).ready(() => {
    //Set up firebase for use
    let config = {
        apiKey: "AIzaSyAZHgntVV2i5prpRULYP11bceh_s_ghvyc",
        authDomain: "rps-multiplayer-3557e.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-3557e.firebaseio.com",
        projectId: "rps-multiplayer-3557e",
        storageBucket: "rps-multiplayer-3557e.appspot.com",
        messagingSenderId: "402935998812"
    };
    firebase.initializeApp(config);

    let database = firebase.database();

    //Set up variables to keep track of things locally
    let myName;
    let players = [];
    let viewers = [];

    //Finds the next player in line to player
    function findNextPlayer() {
        //Return the first player in the viewers section
        database.ref("viewers").limitToFirst(1).once("value", (snapshot) => {
            //Access the snapshot at the key
            for (let key in snapshot.val()) {
                //If the next player in line is me
                if (snapshot.val()[key].name === myName) {
                    let reference = `viewers/${key}`
                    //Remove me from the viewers list
                    database.ref(reference).remove();
                    //Join the game
                    joinGame()
                }
            }
        });
    }

    //Add me to the database
    function joinGame() {
        database.ref("players").push({
            name: myName,
            move: "none",
            wins: 0
        });
    }

    //Sign me into the database, if there is a spot open, add me, otherwise add me to the viwers
    function signIn() {
        //If there are no players or there is one that is not me
        if (players.length === 0 || (players.length === 1 && players[0].name !== myName)) {
            //If I am already a viewer find the next player otherwise try to join the game
            if (viewers.indexOf(myName) !== -1) {
                findNextPlayer();
            } else {
                joinGame();
            }
        //If there are 2 players add me to the viewers list
        } else if (players.length === 2) {
            database.ref("viewers").push({
                name: myName,
            })
        }
    }

    //If my the box is not empty set the variable myName equal to the text in the box
    $("#sign-in-btn").on("click", () => {
        myName = $("#name-input").val().trim();
        $("#name-input").val("");
        if (myName !== "") {
            signIn();
        } else {
            myName = "";
        }
    });
});