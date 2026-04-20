// Initialize Supabase
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM ELEMENTS ---
const teamsList = document.getElementById('teams-list');
const gamesList = document.getElementById('games-list');
const teamForm = document.getElementById('team-form');
const playerForm = document.getElementById('player-form');
const teamSelect = document.getElementById('team-select');

// --- DATA FETCHING ---

// Load Teams for the Homepage
async function fetchTeams() {
    if (!teamsList) return;
    const { data, error } = await supabase.from('teams').select('*');
    if (error) console.error(error);
    
    teamsList.innerHTML = data.map(team => `
        <article>
            header><strong>${team.name}</strong></header>
            Coach: ${team.coach_name}
        </article>
    `).join('');
}

// Load Teams into the Dropdown (Admin Page)
async function populateTeamDropdown() {
    if (!teamSelect) return;
    const { data } = await supabase.from('teams').select('id, name');
    teamSelect.innerHTML += data.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

// Load Games
async function fetchGames() {
    if (!gamesList) return;
    const { data, error } = await supabase
        .from('games')
        .select(`
            id, game_date, home_score, away_score,
            home:home_team_id(name),
            away:away_team_id(name)
        `);
    
    gamesList.innerHTML = data.map(game => `
        <tr>
            <td>${new Date(game.game_date).toLocaleDateString()}</td>
            <td>${game.home.name}</td>
            <td>${game.away.name}</td>
            <td>${game.home_score} - ${game.away_score}</td>
        </tr>
    `).join('');
}

// --- ADMIN ACTIONS ---

// Add Team
if (teamForm) {
    teamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('team-name').value;
        const coach = document.getElementById('coach-name').value;

        const { error } = await supabase.from('teams').insert([{ name, coach_name: coach }]);
        if (error) alert(error.message);
        else location.reload();
    });
}

// Add Player (Including Age and Phone)
if (playerForm) {
    playerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const team_id = document.getElementById('team-select').value;
        const name = document.getElementById('player-name').value;
        const position = document.getElementById('player-pos').value;
        const age = document.getElementById('player-age').value;
        const phone_number = document.getElementById('player-phone').value;

        const { error } = await supabase.from('players').insert([{ 
            team_id, 
            name, 
            position, 
            age: parseInt(age), 
            phone_number 
        }]);

        if (error) alert(error.message);
        else alert('Player added successfully!');
    });
}

// Initialize
fetchTeams();
fetchGames();
populateTeamDropdown();