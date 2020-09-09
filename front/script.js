window.onload = function() {
  fetch('/players/').then(response => response.json())
    .then(json => setAllPlayers(json));

  $('form').submit(function(e) {
    e.preventDefault();
    let p1ID = $('#p1-input').val();
    let p2ID = $('#p2-input').val();
    if (!p1ID || !p2ID || p1ID === '-1' || p2ID === '-1') {
      return;
    }

    $('#results').html(`<p>Finding the shortest path between players \
      (this may take several seconds)...</p>`);

    fetch(`/connection?player1=${p1ID}&player2=${p2ID}`)
      .then(response => response.json())
        .then(json => reportResults(json));
  });

  $('[type="text"]').val('');
  $('[type="text"]').on('input', function(e) {
    let opt = $('option[value="' + $(e.target).val() + '"]');
    let playerID;
    if (opt.length) {
      let pidStr = $(opt).attr('class').split(/\s+/).filter((str) => str.indexOf('pid-') !== -1)[0];
      playerID = pidStr.substr('pid-'.length);
    } else {
      playerID = -1;
    }

    $(e.target).attr('id') === 'p1-text' ? $('#p1-input').val(playerID) : $('#p2-input').val(playerID);
  });
};

reportResults = function(json) {
  $('#results').html('');

  if (json.startPlayer) {
    let verb = json.pathLength === 1 ? 'is' : 'are';
    let noun = json.pathLength === 1 ? 'degree' : 'degrees';
    let header = `<h4>There ${verb} ${json.pathLength}\
      ${noun} of separation between ${json.startPlayer} and ${json.endPlayer}.</h4>`;

    $('#results').append(header);
    let prevPlayer = json.startPlayer;
    json.connections.forEach(conn => {
      let pStr = `<p class="result-text">${prevPlayer} played with\
        ${conn.playerName} on the ${conn.year} ${conn.teamName}.</p>`;
      
      $('#results').append(pStr);
      prevPlayer = conn.playerName;
    });
  } else {
    let header = '<h4>Error.</h4>'
    let pStr = `<p class="result-text">${json.message}</p>`;
    $('#results').append(header);
    $('#results').append(pStr);
  }
};

setAllPlayers = function(playerArr) {
  playerArr.forEach(player => {
    let opString = `<option id="pid-${player.id}" class="pid-${player.id}" value="${player.str}">`; 
    $('datalist').append(opString);
  });
};
