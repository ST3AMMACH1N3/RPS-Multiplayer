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

    //Change the images of the hands to reflect current selection
    function changeHands(selected = null) {
        //Loops through all of the hand choices
        $(".hand").each((index, element) => {
            //Set a variable to the path to the image plus the image name
            let path = "assets/images/" + $(element).attr("data-value");
            //If the current element is selected change the path to use the 'Selected' image
            if ($(element).attr("data-value") === selected) {
                path += "-Selected";
            }
            //Add the file type to the end of the path
            path += ".png";
            //Change the src to the image we want
            $(element).attr("src", path);
        });
    }

    //Check if someone won increment the wins to reflect it and reset the choices
    function checkWinner() {
        let choices = ["Rock", "Paper", "Scissors"];
        let p1Move = choices.indexOf(players[0].move);
        let p2Move = choices.indexOf(players[1].move);
        //My self made algorithm for finding who won Rock, Paper, Scissors without loops or lots of if statements
        if (p1Move === p2Move) {
        } else if ((p1Move + 1) % 3 === p2Move) {
            players[1].wins++;
        } else {
            players[0].wins++;
        }
        //Give the database the updated wins and reset the moves
        for(let i = 0; i < players.length; i++) {
            updateDatabase(findPlayer("players", players[i].name), "wins", players[i].wins);
            updateDatabase(findPlayer("players", players[i].name), "move", "none");
        }
        //Update the interface to show current wins
        updateCards();
    }

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

    //Find a player in a list in the database and return the reference
    function findPlayer(reference, playerName = myName) {
        let tempRef
        //Take s snapshot of the list you're trying to find the player in
        database.ref(reference).once("value", (snapshot) => {
            //Loop through all of the players in the list
            for (let key in snapshot.val()) {
                //If the player is at this ref set tempRef equal to the ref and exit the database function
                if (snapshot.val()[key].name === playerName) {
                    tempRef = `${reference}/${key}`;
                    return;
                }
            }
        });
        //Return the exact reference of the player
        return tempRef;
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

    //Loop through the players and update the text of the interface accordingly
    function updateCards() {
        for(let i = 0; i < 2; i++) {
            let tempName = "";
            let tempWins = 0;
            if (i < players.length) {
                tempName = players[i].name;
                tempWins = players[i].wins;
            }
            $(`#player${i + 1}-name`).text(tempName);
            $(`#player${i + 1}-wins`).text(tempWins);
        }
    }

    //Set the value of a key at a given reference
    function updateDatabase(reference, key, value) {
        let tempRef = `${reference}/${key}`;
        database.ref(tempRef).set(value);
    }

    database.ref("players").on("child_added", (snapshot) => {
        //Whenever a player is added on the database add it as an object to the local array
        players.push({
            name: snapshot.val().name,
            move: snapshot.val().move,
            wins: snapshot.val().wins
        });
        //If I am the one being added to the players list set up my onDisconnect
        if (snapshot.val().name === myName) {
            let reference = `players/${snapshot.key}`
            database.ref(reference).onDisconnect().remove();
        //Otherwise set my wins back to 0
        } else if (findPlayer("players") !== undefined) {
            updateDatabase(findPlayer("players"), "wins", 0);
        }
        updateCards();
    });

    database.ref("viewers").on("child_added", (snapshot) => {
        //Whenever a viewer is added add it to the local array
        viewers.push(snapshot.val().name);
        //If the viewer is me set up my onDisconnect
        if (snapshot.val().name === myName) {
            let reference = `viewers/${snapshot.key}`
            database.ref(reference).onDisconnect().remove();
        }
    });

    database.ref("players").on("child_changed", (snapshot) => {
        let allMovesIn = true;
        let tempMove;
        //Loop through the players
        for(let i = 0; i < players.length; i++) {
            //If the player[i] is the one changed, change it to reflect the properties changed
            if (snapshot.val().name === players[i].name) {
                tempMove = players[i].move;
                players[i].move = snapshot.val().move;
                players[i].wins = snapshot.val().wins;
            }
            //If someone has not submitted a move set allMovesIn to false
            if (players[i].move === "none") {
                allMovesIn = false;
            }
        }
        //If I am the one being changed and my move changed, not my wins
        if (myName === snapshot.val().name && snapshot.val().move !== tempMove) {
            //Change my choices to reflect it
            changeHands(snapshot.val().move);
            //If player1 and player2 both have moves in check the winner
            if (allMovesIn) {
                checkWinner();  
            }
            return;
        }
        updateCards();
    });

    database.ref("players").on("child_removed", (snapshot) => {
        //If a player left remove them from the local array
        for(let i = 0; i < players.length; i++) {
            if (players[i].name === snapshot.val().name) {
                players.splice(i, 1);
                break;
            }
        }
        updateCards();
        //Try to join the game again
        signIn();
    });

    database.ref("viewers").on("child_removed", (snapshot) => {
        //If a viewer is removed from the database remove it from the local array
        viewers.splice(viewers.indexOf(snapshot.val().name), 1);
    });

    $(".hand").on("click", (event) => {
        //Only do things if both players are present
        if (players.length === 2) {
            //If I am one of the players change my move
            for(let i = 0; i < players.length; i++) {
                if (players[i].name === myName) {
                    updateDatabase(findPlayer("players"), "move", $(event.currentTarget).attr("data-value"));
                    break;
                }
            }
        }
    });

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