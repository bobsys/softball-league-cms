// 1. CONFIGURATION
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

// Declare db variable in the global scope
let db;

// 2. INITIALIZATION FUNCTION
function initSupabase() {
    try {
        // Create the client using the global 'supabase' object from the CDN script
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase connection initialized.");
        
        // Now that db is defined, start the app logic
        startApp();
    } catch (err) {
        console.error("Failed to initialize Supabase. Check your URL and Key.", err);
    }
}

// 3. DOM ELEMENTS
const getEl = (id) => document.getElementById(id);

// 4. APP LOGIC (Only runs once db is defined)
async function startApp() {
    const teamsList = getEl('teams-list');
    const gamesList = getEl('games-list');
    const teamForm = getEl('team-form');
    const playerForm = getEl('player-form');
    const teamSelect = getEl('team-select');

    // FETCH TEAMS
    if (teamsList) {
        const { data, error } = await db.from('teams').select('*');
        if (error) console.error(error);
        else if (data.length === 0) teamsList.innerHTML = 'No teams found.';
        else {
            teamsList.innerHTML = data.map(team => `
                <article><header><strong>${team.name}</strong></header>Coach: ${team.coach_name || 'N/A'}</article>
            `).join('');
        }
    }

    // FETCH GAMES
    if (gamesList) {
        const { data, error } = await db.from('games').select('*, home:home_team_id(name), away:away_team_id(name)');
        if (error) console.error(error);
        else {
            gamesList.innerHTML = data.map(game => `
                <tr>
                    <td>${new Date(game.game_date).toLocaleDateString()}</td>
                    <td>${game.home?.name || 'Home'}</td>
                    <td>${game.away?.name || 'Away'}</td>
                    <td>${game.home_score} - ${game.away_score}</td>
                </tr>
            `).join('');
        }
    }

    // POPULATE DROPDOWN
    if (teamSelect) {
        const { data } = await db.from('teams').select('id, name');
        if (data) {
            teamSelect.innerHTML = '<option value="">Select Team...</option>' + 
                data.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }
    }

    // CREATE TEAM
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = getEl('team-name').value;
            const coach = getEl('coach-name').value;
            const { error } = await db.from('teams').insert([{ name, coach_name: coach }]);
            if (error) alert(error.message);
            else { alert('Team created!'); location.reload(); }
        });
    }

    // CREATE PLAYER
    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { error } = await db.from('players').insert([{ 
                team_id: parseInt(getEl('team-select').value), 
                name: getEl('player-name').value, 
                position: getEl('player-pos').value, 
                age: parseInt(getEl('player-age').value), 
                phone_number: getEl('player-phone').value 
            }]);
            if (error) alert(error.message);
            else { alert('Player added!'); playerForm.reset(); }
        });
    }
}

// 5. RUN INITIALIZATION
// We wait for the window to load to ensure the Supabase CDN script is fully ready
window.addEventListener('load', initSupabase);