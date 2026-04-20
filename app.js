// 1. CONFIGURATION
// Replace these with your actual values from the Supabase Dashboard
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

// 3. DOM ELEMENTS
// These might be null depending on which page (index or admin) you are on
const teamsList = document.getElementById('teams-list');
const gamesList = document.getElementById('games-list');
const teamForm = document.getElementById('team-form');
const playerForm = document.getElementById('player-form');
const teamSelect = document.getElementById('team-select');

// 4. PUBLIC DATA FETCHING FUNCTIONS

// Fetch and display teams on the homepage
async function fetchTeams() {
    if (!teamsList) return; // Exit if not on the homepage
    
    const { data, error } = await db.from('teams').select('*');
    
    if (error) {
        console.error('Error fetching teams:', error);
        teamsList.innerHTML = 'Error loading teams.';
        return;
    }
    
    if (data.length === 0) {
        teamsList.innerHTML = 'No teams found.';
        return;
    }

    teamsList.innerHTML = data.map(team => `
        <article>
            <header><strong>${team.name}</strong></header>
            <p>Coach: ${team.coach_name || 'N/A'}</p>
        </article>
    `).join('');
}

// Fetch and display games on the homepage
async function fetchGames() {
    if (!gamesList) return; // Exit if not on homepage

    const { data, error } = await db
        .from('games')
        .select(`
            id, 
            game_date, 
            home_score, 
            away_score,
            home:home_team_id(name),
            away:away_team_id(name)
        `);
    
    if (error) {
        console.error('Error fetching games:', error);
        return;
    }

    if (data.length === 0) {
        gamesList.innerHTML = '<tr><td colspan="4">No games scheduled.</td></tr>';
        return;
    }

    gamesList.innerHTML = data.map(game => `
        <tr>
            <td>${new Date(game.game_date).toLocaleDateString()}</td>
            <td>${game.home ? game.home.name : 'Unknown'}</td>
            <td>${game.away ? game.away.name : 'Unknown'}</td>
            <td>${game.home_score} - ${game.away_score}</td>
        </tr>
    `).join('');
}

// 5. ADMIN FUNCTIONS (CMS)

// Populate the dropdown menu on the admin page so we can link players to teams
async function populateTeamDropdown() {
    if (!teamSelect) return;

    const { data, error } = await db.from('teams').select('id, name');
    
    if (error) {
        console.error('Error fetching teams for dropdown:', error);
        return;
    }

    teamSelect.innerHTML = '<option value="">Select Team...</option>' + 
        data.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

// Handle Team Creation
if (teamForm) {
    teamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('team-name').value;
        const coach = document.getElementById('coach-name').value;

        const { error } = await db.from('teams').insert([{ 
            name: name, 
            coach_name: coach 
        }]);

        if (error) {
            alert('Error creating team: ' + error.message);
        } else {
            alert('Team created successfully!');
            teamForm.reset();
            fetchTeams(); // Refresh list if on same page
            populateTeamDropdown(); // Refresh dropdown
        }
    });
}

// Handle Player Creation (Including Age and Phone)
if (playerForm) {
    playerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const team_id = document.getElementById('team-select').value;
        const name = document.getElementById('player-name').value;
        const position = document.getElementById('player-pos').value;
        const age = document.getElementById('player-age').value;
        const phone_number = document.getElementById('player-phone').value;

        if (!team_id) {
            alert('Please select a team first!');
            return;
        }

        const { error } = await db.from('players').insert([{ 
            team_id: parseInt(team_id), 
            name: name, 
            position: position, 
            age: age ? parseInt(age) : null, 
            phone_number: phone_number 
        }]);

        if (error) {
            alert('Error adding player: ' + error.message);
        } else {
            alert('Player added successfully!');
            playerForm.reset();
        }
    });
}

// 6. START THE APP
fetchTeams();
fetchGames();
populateTeamDropdown();