const express = require("express");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const bodyParser = require("body-parser");
const LocalStrategy = require('passport-local').Strategy;
const ejs = require("ejs");

const app = express();


app.use(express.static("public"));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'Wallik',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://alinz:201121480@cluster0-q31x3.mongodb.net/LotteryDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    score: Number
});

const blackSchema = new mongoose.Schema({
    player: userSchema,
    betAmount: Number,
    deck: [Number],
    playerAce: Boolean,
    dealerAce: Boolean,
    playerCards: [Number],
    dealerCards: [Number]
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

const BlackJack = new mongoose.model("BlackJack", blackSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.post("/register", function (req, res) {

    User.register({
        username: req.body.username,
        score: 100
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.send("ok");
            });
        }
    });

});

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.send("ok");
            });
        }
    });

});

app.get("/rollete", function (req, res) {

    if (req.isAuthenticated) {

        const betAmount = parseInt(req.query.betAmount);
        const betNumber = parseInt(req.query.betNumber);
        if (betNumber >= 0 && betNumber <= 36) {
            if (req.user.score > betAmount && betAmount > 0) {
                req.user.score -= betAmount;
                req.user.save();
                const rolleteNumber = Math.floor(Math.random() * 36);
                // console.log(rolleteNumber);

                if (rolleteNumber == betNumber) {
                    req.user.score += 36 * betAmount;
                    req.user.save();
                    res.send({
                        rolleteNumber: rolleteNumber,
                        win: true,
                        amount: 36 * betAmount
                    });
                } else {
                    res.send({
                        rolleteNumber: rolleteNumber,
                        win: false,
                        amout: 0
                    });

                }
            } else {
                res.send(new Error("not enought coins"));
            }

        } else {
            res.send(new Error("bad-number"));
        }

    } else {
        res.redirect("/");
    }



});

app.get("/blackJackStart", function (req, res) {

    if (req.isAuthenticated) {

        const betAmount = parseInt(req.query.betAmount);
        if (req.user.score > betAmount && betAmount > 0) {

            req.user.score -= betAmount;
            req.user.save();

            const newDeck = CreateDeck();

            const newGame = new BlackJack({
                player: req.user,
                betAmount: betAmount,
                deck: newDeck,
                playerAce: false,
                dealerAce: false,
                playerCards: [getCard(newDeck), getCard(newDeck)],
                dealerCards: [getCard(newDeck), getCard(newDeck)]
            })
            newGame.playerCards.forEach(playerCard => {
                if (playerCard == 1) {
                    newGame.playerAce = true;
                }
            });
            newGame.dealerCards.forEach(dealerCard => {
                if (dealerCard == 1) {
                    newGame.dealerAce = true;
                }
            });

            newGame.save();


            res.send({
                playerCards: newGame.playerCards,
                dealerCards: [newGame.dealerCards[0]],
                playerAce: newGame.playerAce,
                dealerAce: newGame.dealerAce
            })
        } else {
            res.send(new Error("not enought coins"));
        }

    } else {
        res.redirect("/");
    }
})

app.get("/blackHit", function (req, res) {
    if (req.isAuthenticated) {

        BlackJack.findOne({
            player: req.user
        }, function (err, game) {
            if (err) {
                res.send(new Error("no-game"));
            }
            if (game) {

                const card = getCard(game.deck);
                if (card == 1) {
                    game.playerAce = true;
                }
                game.playerCards.push(card);

                var sumCards = 0;
                game.playerCards.forEach(playerCard => {
                    sumCards += playerCard;
                });
                if (sumCards > 21) {
                    res.send({
                        win: false,
                        playerCard: card,
                        dealerCards: [],
                        loose: true,
                        playerSum: sumCards,
                        ace: game.playerAce

                    })
                    game.deleteOne();
                } else if (sumCards == 21 || (game.playerAce && sumCards + 10 == 21)) {
                    req.user.score += game.betAmount * 2;
                    req.user.save();
                    res.send({
                        win: true,
                        playerCard: card,
                        dealerCards: game.dealerCards,
                        loose: false,
                        playerSum: sumCards,
                        ace: game.playerAce
                    })
                    game.deleteOne();
                } else {
                    res.send({
                        win: false,
                        playerCard: card,
                        dealerCards: [],
                        loose: false,
                        playerSum: sumCards,
                        ace: game.playerAce
                    })
                    game.save();
                }
            } else {
                res.end();

            }
        })

    } else {
        res.redirect("/");
    }
});

app.get("/blackFinish", function (req, res) {
    if (req.isAuthenticated) {

        BlackJack.findOne({
            player: req.user
        }, function (err, foundGame) {
            if (err) {
                res.send(new Error("no-game"));
            }

            if (foundGame) {

                var playerSumCards = 0;
                var dealerSumCards = 0;

                foundGame.playerCards.forEach(playerCard => {
                    playerSumCards += playerCard;
                });
                foundGame.dealerCards.forEach(dealerCard => {
                    dealerSumCards += dealerCard;
                });

                if (foundGame.playerAce && playerSumCards + 10 <= 21) {
                    playerSumCards += 10;
                }

                while (true) {
                    if (dealerSumCards >= playerSumCards || (foundGame.dealerAce && dealerSumCards + 10 >= playerSumCards)) {
                        if (foundGame.dealerAce && dealerSumCards + 10 <= 21) {
                            dealerSumCards += 10;
                        }
                        break;
                    }
                    const card = getCard(foundGame.deck);
                    if (card == 1) {
                        foundGame.dealerAce = true;
                    }
                    dealerSumCards += card;
                    foundGame.dealerCards.push(card);
                }

                if (dealerSumCards > 21 || dealerSumCards < playerSumCards) {
                    req.user.score += foundGame.betAmount * 2;
                    req.user.save();
                    res.send({
                        win: true,
                        dealerCards: foundGame.dealerCards,
                        dealerSum: dealerSumCards
                    })
                } else {
                    res.send({
                        win: false,
                        dealerCards: foundGame.dealerCards,
                        dealerSum: dealerSumCards

                    })
                }

                foundGame.delete();
            } else {
                res.end();
            }
        });



    } else {
        res.redirect("/");
    }
})






app.listen("3000", function () {
    console.log("akoBez'e");
});


function CreateDeck() {
    const CardsInit = [];
    const CardsShuffle = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j < 14; j++) {
            if (j > 10) {
                CardsInit.push(10);
            } else {

                CardsInit.push(j);
            }
        }
    }

    for (let i = 0; i < 52; i++) {
        const random = Math.floor(Math.random() * CardsInit.length);
        CardsShuffle.push(CardsInit[random]);
        CardsInit.splice(random, 1);
    }

    return CardsShuffle;
}

function getCard(deck) {

    const random = Math.floor(Math.random() * deck.length);
    const pickedCard = deck[random];
    deck.splice(random, 1);

    return pickedCard;
}