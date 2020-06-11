const serverUrling = window.location.href;
console.log(serverUrling);

const serverUrl = serverUrling.charAt(serverUrling.length - 1) == "/" ? serverUrling.substring(0, serverUrling.length - 1) : serverUrling;
console.log(serverUrl);

var $inner = $('.inner'),
    $spin = $('#spin'),
    $reset = $('#reset'),
    $data = $('.data'),
    $mask = $('.mask'),
    maskDefault = 'Place Your Bets',
    timer = 9000;

var red = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3];

$reset.hide();

$mask.text(maskDefault);

$reset.on('click', function () {
    // remove the spinto data attr so the ball 'resets'
    $inner.attr('data-spinto', '').removeClass('rest');
    $(this).hide();
    $spin.show();
    $data.removeClass('reveal');
});




$("#login").click(function () {
    const username = $("#userName").val();
    const password = $("#password").val();

    $.post(serverUrl + "/login", {
        username: username,
        password: password
    }, function (data) {
        if (data == "ok") {
            Route("casino-page");
        }
    });
});

$("#register").click(function () {
    const username = $("#reg-user-name").val();
    const password = $("#reg-password").val();

    $.post(serverUrl + "/register", {
        username: username,
        password: password
    }, function (data) {
        if (data == "ok") {
            Route("casino-page");
        }

    });
});

function Route(page) {
    $("section").hide();
    $("#" + page).show();
}

////////////// Rollete 
function RolleteStart() {
    const betAmount = $("#rollete-bet-amount").val();
    const betNumber = $("#rollete-bet-number").val();

    $.get("/rollete?betAmount=" + betAmount + "&betNumber=" + betNumber, function (data) {
        console.log(data);

        // Rollete Animaion
        // get a random number between 0 and 36 and apply it to the nth-child selector
        var randomNumber = data.rolleteNumber,
            color = null;
        $inner.attr('data-spinto', randomNumber).find('li:nth-child(' + randomNumber + ') input').prop('checked', 'checked');
        // prevent repeated clicks on the spin button by hiding it
        $("#spin").hide();
        // disable the reset button until the ball has stopped spinning
        $reset.addClass('disabled').prop('disabled', 'disabled').show();

        $('.placeholder').remove();

        setTimeout(function () {
            $mask.text('No More Bets');
        }, timer / 2);

        setTimeout(function () {
            $mask.text(maskDefault);
        }, timer + 500);

        // remove the disabled attribute when the ball has stopped
        setTimeout(function () {
            $reset.removeClass('disabled').prop('disabled', '');

            if ($.inArray(randomNumber, red) !== -1) {
                color = 'red'
            } else {
                color = 'black'
            };
            if (randomNumber == 0) {
                color = 'green'
            };

            $('.result-number').text(randomNumber);
            $('.result-color').text(color);
            $('.result').css({
                'background-color': '' + color + ''
            });
            $data.addClass('reveal');
            $inner.addClass('rest');

            $thisResult = '<li class="previous-result color-' + color + '"><span class="previous-number">' + randomNumber + '</span><span class="previous-color">' + color + '</span></li>';

            $('.previous-list').prepend($thisResult);
            if (data.win) {
                $("#rollete-result").html("the number is: " + data.rolleteNumber + " you fucking win in " + data.amount + " you stupid asshole dushbag")
            } else {
                $("#rollete-result").html("the number is: " + data.rolleteNumber + " you fucking Looser stupid asshole dushbag")
            }
        }, timer);





    })
    // const rolleteNumber = Math.floor(Math.random * 32);

}


////// BlackJack - Start Game!! (Of the fresh makers....)
function BlackStart() {
    $("#my-cards").html("");
    $("#dealer-cards").html("");
    $("#black-result").html("");

    const betAmount = $("#black-bet-amount").val();
    $.get("/blackJackStart?betAmount=" + betAmount, function (data) {

        let playerCounter = 0;
        let dealerCounter = 0;
        data.playerCards.forEach(card => {
            var cardDiv = document.createElement("div");
            var cardNumber = document.createElement("h2");
            cardDiv.classList.add("card");
            if (card == 1) {
                cardNumber.innerHTML = "A";

            } else {

                cardNumber.innerHTML = card;
            }
            cardDiv.appendChild(cardNumber);
            $("#my-cards").append(cardDiv);
            playerCounter += card;
        });
        data.dealerCards.forEach(card => {
            var cardDiv = document.createElement("div");
            var cardNumber = document.createElement("h2");
            cardDiv.classList.add("card");

            if (card == 1) {
                cardNumber.innerHTML = "A";

            } else {

                cardNumber.innerHTML = card;
            }

            cardDiv.appendChild(cardNumber);
            $("#dealer-cards").append(cardDiv);
            dealerCounter += card;

        });
        var cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.classList.add("flip-card");
        var cardNumber = document.createElement("h2");
        cardNumber.innerHTML = "Dealer";
        cardDiv.appendChild(cardNumber);

        if (data.playerAce) {
            $("#player-sum").html(playerCounter + 10);

        } else {
            $("#player-sum").html(playerCounter);
        }
        if (data.dealerAce) {
            $("#dealer-sum").html(dealerCounter + 10);

        } else {
            $("#dealer-sum").html(dealerCounter);
        }


        $("#dealer-cards").append(cardDiv);
        $("#black-bet-amount").val("");

    });;
};

function Hit() {
    $.get(serverUrl + "/blackHit", function (data) {
        let dealerCounter = 0;

        console.log(data);
        if (data) {
            if (data.ace && data.playerSum <= 21) {
                $("#player-sum").html(data.playerSum + 10);

            } else {

                $("#player-sum").html(data.playerSum);
            }
            if (data.loose) {
                $("#black-result").html("fucking looser idiot noob l2p");
            } else if (data.win) {
                $("#black-result").html("fucking winner idiot noob l2p");
                $("#dealer-cards").html("");


                data.dealerCards.forEach(card => {
                    var cardDiv = document.createElement("div");
                    var cardNumber = document.createElement("h2");
                    cardDiv.classList.add("card");
                    if (card == 1) {
                        cardNumber.innerHTML = "A";

                    } else {

                        cardNumber.innerHTML = card;
                    }
                    cardDiv.appendChild(cardNumber);
                    $("#dealer-cards").append(cardDiv);
                    dealerCounter += card;
                });
                $("#dealer-sum").html(dealerCounter);

            }
            var cardDiv = document.createElement("div");
            var cardNumber = document.createElement("h2");
            cardDiv.classList.add("card");
            if (data.playerCard == 1) {
                cardNumber.innerHTML = "A";

            } else {

                cardNumber.innerHTML = data.playerCard;
            }

            cardDiv.appendChild(cardNumber);
            $("#my-cards").append(cardDiv);
        }


    })
}

function BlackFinish() {
    $.get(serverUrl + "/blackFinish", function (data) {
        $("#dealer-cards").html("");
        data.dealerCards.forEach((card, index) => {

            setTimeout(() => {

                var cardDiv = document.createElement("div");
                var cardNumber = document.createElement("h2");
                cardDiv.classList.add("card");
                if (card == 1) {
                    cardNumber.innerHTML = "A";

                } else {

                    cardNumber.innerHTML = card;
                }
                cardDiv.appendChild(cardNumber);
                $("#dealer-cards").append(cardDiv);
            }, 1000 * index);
            $("#dealer-sum").html(data.dealerSum);

        });
        if (!data.win) {
            $("#black-result").html("fucking looser idiot noob l2p");
        } else if (data.win) {
            $("#black-result").html("fucking winner idiot noob l2p");
        }
    })
}