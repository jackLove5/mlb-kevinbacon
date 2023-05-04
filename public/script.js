window.addEventListener('load', async () => {
  const res = await fetch ('/players');

  const resObj = await res.json();
  const players = resObj.players;
  document.querySelector('datalist').innerHTML = players.reduce((prev, p) => prev + `<option data-id="${p.id}" value="${p.name}">`, '');

  document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const player1Name = document.getElementById('p1-text').value;
    const player2Name = document.getElementById('p2-text').value;

    const op1 = document.querySelector(`option[value="${player1Name}"]`);
    const op2 = document.querySelector(`option[value="${player2Name}"]`);

    if (!op1 || !op2) {
      return;
    }

    const player1Id = op1.getAttribute('data-id');
    const player2Id = op2.getAttribute('data-id');

    const res = await fetch(`/players/connection?player1=${player1Id}&player2=${player2Id}`);
    if (res.status !== 200) {
      reportError(res.status);
      return;
    }
    const connections = await res.json();

    document.getElementById('results').innerHTML = JSON.stringify(resObj);
    reportResults(player1Name, player2Name, connections);
  });

});

const reportResults = (player1Name, player2Name, connections) => {
  const results = document.getElementById('results');
  results.innerHTML = '';

  const header = document.createElement('h3');

  header.textContent = `There ${connections.length === 1 ? 'is' : 'are'} 
    ${connections.length} ${connections.length === 1 ? 'degree' : 'degrees'} of separation between
    ${player1Name} and ${player2Name}`;
  
  results.appendChild(header);
  
  const div = document.createElement('div');
  connections.forEach(c => {
    const p = document.createElement('p');
    p.textContent = `${c.name1} played with ${c.name2} on the ${c.team}`;
    div.appendChild(p);
  });

  results.appendChild(div);
}

const reportError = (statusCode) => {
  const results = document.getElementById('results');
  
  const p = document.createElement('p');
  p.classList.add('error');
  p.textContent = statusCode >= 400 && statusCode < 500 ? 'Error. Bad Request' : 'Server error. Please try again';

  results.appendChild(p);
}
