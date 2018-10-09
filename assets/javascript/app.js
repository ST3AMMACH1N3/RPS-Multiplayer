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