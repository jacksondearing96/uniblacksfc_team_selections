  var $ = jQuery.noConflict();

  // Initialise the year input field with the current year.
  let date = new Date();
  const thisYear = date.getFullYear();
  $('#year-input').val(thisYear);

  function removeGamesThatHaveNotBeenInitialisedInDatabase() {
    // Rounds that have not been entered in the databse will appear with #id = game-GameID-0.
    // Remove these games from the options.
    while ($('#game-GameID-0').length != 0) {
      $("#game-GameID-0").remove();
    }
  }

  function clearAllGameData() {
    clearOvalOfAllPlayers();
    clearPreGameInfo();
    clearPostGameInfo();
    $('#container_').hide();
    $('#interchange').hide();
  }

  function clearOvalOfAllPlayers() {
    $(".player").remove();
  }

  function clearPreGameInfo() {
    $('#pregameInfo').html('');
  }

  function clearPostGameInfo() {
    $('#postgameInfo').html('');
  }

  function clearTeamsButtons() {
    $('#teams-for-year button').remove();
  }

  function clearRoundButtons() {
    $('#rounds button').remove();
  }

  // Takes an HTML element that is used to hold a player and populates the 
  // element with the data to be shown for that player.
  function initialisePlayerElementContent(playerElement, player) {
    const position = player['Position'];

    playerElement.setAttribute('id', position);
    playerElement.setAttribute('class', 'player');

    playerElement.innerHTML = player['FirstName'];
    // Wrap some of the players' names for better viewing over the oval.
    const positionsToNotWrapNames = ['RUCK', 'R', 'RR', 'C'];
    const interchangePrefix = 'INT';
    if (positionsToNotWrapNames.includes(position) || position.includes(interchangePrefix)) {
      playerElement.innerHTML += ' ';
    } else {
      playerElement.innerHTML += '<br>';
    }
    playerElement.innerHTML += player['Surname'];
  }

  function populateOvalWithOnFieldPlayer(player) {
    let playerElement = document.createElement('div');
    initialisePlayerElementContent(playerElement, player);
    $('#players').append(playerElement);
  }

  function populateInterchangeWithPlayer(player) {
    let playerElement = document.createElement('li');
    initialisePlayerElementContent(playerElement, player);
    $('#interchange').append(playerElement);
  }

  function populateOvalWithPlayers(players) {
    clearOvalOfAllPlayers();

    for (let player of players) {
      if (player['Position'].includes('INT')) {
        populateInterchangeWithPlayer(player);
      } else {
        populateOvalWithOnFieldPlayer(player);
      }
    }
  }
  
  function populatePreGameInfo(pregameInfo) {
    clearPreGameInfo();

    let pregameInfoContainer = $('#pregameInfo');
    pregameInfoContainer.append('Date: ' + pregameInfo['Date'] + '<br>');
    pregameInfoContainer.append('Ground: ' + pregameInfo['Ground'] + '<br><br>');
    pregameInfoContainer.append('AUFC vs ' + pregameInfo['OppositionName'] + '<br><br>');
  }

  function populatePreGameInfoFromSubAuto() {
    console.log('sending: ' + JSON.stringify({ teams: resultsRequestJson }));

    fetch("http://localhost:5000/results", {
      method: "POST",
      "Content-Type": "application/json",
      body: JSON.stringify({ teams: [ resultsRequestJson ] }),
    })
      .then((response) => response.text())
      .then((html) => {
        let pregameInfoContainer = $('#pregameInfo');
        pregameInfoContainer.html(html);

        let postgameInfoContainer = $('#postgameInfo');
        postgameInfoContainer.html('');
      });
  }

  function populatePostGameInfo(postgameInfo, pregameInfo) {
    clearPostGameInfo();

    let postgameInfoContainer = $('#postgameInfo');

    const goalsUni = postgameInfo['GoalsUni'];
    const behindsUni = postgameInfo['BehindsUni'];
    const pointsUni = postgameInfo['PointsUni'];

    const goalsOpposition = postgameInfo['GoalsOpposition'];
    const behindsOpposition = postgameInfo['BehindsOpposition'];
    const pointsOpposition = postgameInfo['PointsOpposition'];

    if (goalsUni == 0
        && behindsUni == 0
        && pointsUni == 0
        && goalsOpposition == 0
        && behindsOpposition == 0
        && pointsOpposition == 0) {
      // This indicates the results have not yet been populated in the database.
      postgameInfoContainer.html('(Results not entered yet)');
    } else {
      postgameInfoContainer.append(`Uni: ${goalsUni}.${behindsUni}-${pointsUni}<br>`);
      postgameInfoContainer.append(`${pregameInfo['OppositionName']}: ${goalsOpposition}.${behindsOpposition}-${pointsOpposition}<br>`);
    }
  }

  function highlightElement(element) {
    element.css('background-color', 'lightgreen');
    element.css('color', 'black');
  }

  function unhighlightElement(element) {
    element.css("background-color", "black");
    element.css('color', 'white');
  }

  function highlightTeam(teamButtonToHighlight) {
    let teamButtons = $('#teams-for-year button');
    for (let teamButton of teamButtons) {
      unhighlightElement($(teamButton));
    }
    highlightElement(teamButtonToHighlight);
  }

  function highlightRound(roundButtonToHighlight) {
    let roundButtons = $('#rounds button');
    for (let roundButton of roundButtons) {
      unhighlightElement($(roundButton));
    }
    highlightElement(roundButtonToHighlight);
  }

  function extractId(str) {
    let strParts = str.split("-");
    return strParts[strParts.length - 1];
  }

  resultsRequestJson = {
    nickname: '',
    is_final: false,
    is_past_game: true,
    skip_this_game: false,
    url_code: null
  };

  function getTeamsForYear(year) {
    resultsRequestJson['year'] = year;

    clearTeamsButtons();
    // Send requests for both men's and womens games.
    // Do this because women's games are combined with men's games prior to 2018.
    // Also simplifies the input requirements for the user (no checkbox for mens/womens).
    $.ajax({
      url: "/members/php/unprotected_php/getGamesTeams2.php",
      type: 'POST',
      data: { "Year": year, "Womens": true },
      success: function (response) {
        let teamsButtons = JSON.parse(response)['payload']['content'];

        if (!teamsButtons.includes('There are no teams')) {
          $("#teams-for-year").append(teamsButtons);
          $('#teams-for-year button').prepend('Womens: ');
          addOnClickListenerForTeamButtons();
        }

        // Send the request for men's teams after the bulk rename prepend of 'Womens' is complete.
        $.ajax({
          url: "/members/php/unprotected_php/getGamesTeams2.php",
          type: 'POST',
          data: { "Year": year, "Womens": false },
          success: function (response) {
            let teamsButtons = JSON.parse(response)['payload']['content'];

            if (!teamsButtons.includes('There are no teams')) {
              $("#teams-for-year").append(teamsButtons);
              addOnClickListenerForTeamButtons();
            }
          }
        });
      }
    });
  }

  function addOnClickListenerForTeamButtons() {
    $('#teams-for-year button').click(function (event) {
      clearAllGameData();
      clearRoundButtons();

      highlightTeam($(event.target));
      let teamId = extractId(event.target.id);
      resultsRequestJson['gender'] = event.target.innerHTML.includes('Womens') ? 'Womens' : 'Mens';
      getRoundsForTeam(teamId);
      getDivisionForTeam(teamId);
    });
  }

  function getRoundsForTeam(teamId) {
    $.ajax({
      url: "/members/php/unprotected_php/getTeamRounds2.php",
      type: 'POST',
      data: { "TeamID": teamId },
      success: function (response) {
        let rounds = JSON.parse(response)['payload']['content'];
        $("#rounds").html(rounds);
        removeGamesThatHaveNotBeenInitialisedInDatabase();
        addOnClickListenerForRoundButtons();
      }
    });
  }

  function getDivisionForTeam(teamId) {
    $.ajax({
      url: "/members/php/unprotected_php/getTeamDivision.php",
      type: 'POST',
      data: { "TeamID": teamId },
      success: function (response) {
        let divison = response;
        // Hack to make these divisons the same as what is defined in 
        // team_configurations.json in subAuto so that the team's url can 
        // be deduced from lookup in the map.
        divison = divison.replace('Div', '');
        divison = divison.replace(' ', '');
        divison = divison.replace('R', 'Res');
        divison = divison.replace('Res', ' Res');
        divison = divison.replace('res', 'Res');
        resultsRequestJson['division'] = divison;
      }
    });
  }

  function addOnClickListenerForRoundButtons() {
    $('#rounds button').click(function (event) {
      let round = Number(event.target.innerHTML);
      resultsRequestJson['round'] = round;

      highlightRound($(event.target));
      let gameId = extractId(event.target.id);
      getGameDataAndPopulateOval(gameId);
    });
  }

// This function takes a date string in the format: "dd/mm/yyyy hh:mm"
// and converts it to a Date object. This is required because the generic
// date parser expects "mm/dd/yyyy" format for the date and therefore cannot be used.
function getDateFromDateString(dateString) {
  let dateAndTime = dateString.split(' ');

  // Break down the parts of the date.
  let datePart = dateAndTime[0];
  let dateParts = datePart.split('/');
  let day = Number(dateParts[0]);
  let monthIndex = Number(dateParts[1]) - 1;
  let year = Number(dateParts[2]);

  // Break down the parts of the time.
  let timePart = dateAndTime[1];
  let timeParts = timePart.split(':');
  let hour = Number(timeParts[0]);
  let minute = Number(timeParts[1]);

  return new Date(year, monthIndex, day, hour, minute);
}

function getGameDataAndPopulateOval(gameId) {
  console.log(resultsRequestJson);

  $.ajax({
    url: "/members/php/unprotected_php/getGameData2.php",
    type: 'POST',
    data: { "GameID": gameId },
    success: function (response) {
      clearAllGameData();
      
      let gameInfo = JSON.parse(response)['payload'];
      populatePreGameInfo(gameInfo['pregame']);
      populatePreGameInfoFromSubAuto();

      // Get the dates for the game and for the present.
      let currentDate = new Date();
      let gameDate = getDateFromDateString(gameInfo['pregame']['Date'])

      if (gameDate.getTime() < currentDate.getTime()) {
        // Game is in the past, populate the postgame data.
        populatePostGameInfo(gameInfo['postgame'], gameInfo['pregame']);
      }

      // To show the oval with player selections, make sure it is at least the Friday before the game.
      const lastFriday = new Date(gameDate);
      while (lastFriday.getDay() !== 5) {
        lastFriday.setDate(lastFriday.getDate() - 1);
      }
      lastFriday.setHours(0,0,0,0);

      // if (currentDate.getTime() < lastFriday.getTime()) {
      // Disable this for now (sending the link in the player emails and don't want mismatch
      // between team selected and team showing up here)
      if (false) {
        $('#pregameInfo').append('Team will be released Friday before the game.');
        return;
      }

      console.log(gameInfo);
      let players = gameInfo['positions'];
      $("#container_").show();
      $('#interchange').show();
      populateOvalWithPlayers(players);
    }
  });
}

  $("#team-selection-button").click(function () {
    let year = $("#year-input").val();
    clearAllGameData();
    clearTeamsButtons();
    clearRoundButtons();
    getTeamsForYear(year);
  });

function addConsistentStyleToButtons() {
  const WORDPRESS_THEME_BUTTON_CLASS = 'et_pb_button';
  // Inspect every button, if any button does not have the class that provides the 
  // consistent theme from wordpress, add this class. Also enforce black background.
  $('button').each(function() {
    if ($(this).hasClass(WORDPRESS_THEME_BUTTON_CLASS)) return;
    $(this).addClass(WORDPRESS_THEME_BUTTON_CLASS);
    $(this).css('background-color', 'black');
    $(this).css('color', 'white');
  });
}

addConsistentStyleToButtons();

$(document).ready(addConsistentStyleToButtons);

$('body').on('DOMSubtreeModified', '#team-selections', function(){
  addConsistentStyleToButtons();
});
