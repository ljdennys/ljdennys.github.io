// Placeholder MSAL configuration
const msalConfig = {
    auth: {
        clientId: 'YOUR_CLIENT_ID', // TODO: replace with real client id
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin
    }
};
const msalInstance = new msal.PublicClientApplication(msalConfig);
let account = null;

async function signIn() {
    try {
        const loginResponse = await msalInstance.loginPopup({ scopes: ["User.Read"] });
        account = loginResponse.account;
        document.getElementById('user-info').textContent = account.username;
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('login-btn')?.addEventListener('click', signIn);

// Simple ticket storage using localStorage
function loadTickets() {
    return JSON.parse(localStorage.getItem('tickets') || '[]');
}

function saveTickets(tickets) {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}

function addTicket(text, user) {
    const tickets = loadTickets();
    tickets.push({ id: Date.now(), text, user, votes: 0, voters: [] });
    saveTickets(tickets);
}

function voteTicket(id) {
    const tickets = loadTickets();
    const ticket = tickets.find(t => t.id === id);
    if (ticket && !ticket.voters.includes(account.username)) {
        ticket.votes += 1;
        ticket.voters.push(account.username);
        saveTickets(tickets);
        render();
    }
}

function render() {
    const tickets = loadTickets();
    const top = [...tickets].sort((a,b) => b.votes - a.votes).slice(0,5);
    const topContainer = document.getElementById('top-slider');
    if (topContainer) {
        topContainer.innerHTML = '';
        top.forEach(t => {
            const div = document.createElement('div');
            div.className = 'ticket';
            div.textContent = `${t.text} (voti: ${t.votes})`;
            topContainer.appendChild(div);
        });
    }

    const pending = tickets.filter(t => !t.voters.includes(account?.username));
    const pendingList = document.getElementById('pending-list');
    if (pendingList) {
        pendingList.innerHTML = '';
        pending.forEach(t => {
            const li = document.createElement('li');
            li.textContent = t.text + ` (voti: ${t.votes})`;
            const btn = document.createElement('button');
            btn.textContent = 'Vota';
            btn.onclick = () => voteTicket(t.id);
            li.appendChild(btn);
            pendingList.appendChild(li);
        });
    }

    const users = {};
    tickets.forEach(t => {
        if(!users[t.user]) users[t.user] = 0;
        users[t.user] += t.votes;
    });
    const rankingList = document.getElementById('ranking-list');
    if (rankingList) {
        rankingList.innerHTML = '';
        Object.entries(users).sort((a,b) => b[1]-a[1]).forEach(([user, score]) => {
            const li = document.createElement('li');
            li.textContent = `${user}: ${score}`;
            rankingList.appendChild(li);
        });
    }

    const dash = document.getElementById('dashboard-ranking');
    if (dash) {
        dash.innerHTML = '';
        Object.entries(users).sort((a,b) => b[1]-a[1]).forEach(([user, score], i) => {
            const div = document.createElement('div');
            div.className = 'ticket';
            div.style.background = ['#ffd6a5','#fdffb6','#caffbf'][i%3];
            div.textContent = `#${i+1} ${user} - ${score} punti`;
            dash.appendChild(div);
        });
    }
}

document.getElementById('ticket-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('ticket-text').value.trim();
    if(text && account){
        addTicket(text, account.username);
        document.getElementById('ticket-text').value = '';
        render();
    }
});

document.getElementById('search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('search-date').value;
    const user = document.getElementById('search-user').value;
    const votes = parseInt(document.getElementById('search-votes').value || '0',10);
    const tickets = loadTickets().filter(t => {
        return (!user || t.user.includes(user)) &&
               (!votes || t.votes >= votes);
    });
    const list = document.getElementById('search-results');
    list.innerHTML = '';
    tickets.forEach(t => {
        const li = document.createElement('li');
        li.textContent = `${t.text} - ${t.user} (${t.votes} voti)`;
        list.appendChild(li);
    });
});

window.addEventListener('load', render);
