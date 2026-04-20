const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

let db;

function initSupabase() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        startApp();
    } catch (err) { console.error(err); }
}

async function startApp() {
    const teamsList = document.getElementById('teams-list'); // Homepage
    const adminTeamsList = document.getElementById('admin-teams-list'); // Admin page
    const teamSelect = document.getElementById('team-select');
    const teamForm = document.getElementById('team-form');
    const playerForm = document.getElementById('player-form');

    // --- FETCH & RENDER DATA ---
    async function loadData() {
        const { data: teams, error } = await db.from('teams').select('*').order('name');
        if (error) return console.error(error);

        // 1. Render for Homepage
        if (teamsList) {
            teamsList.innerHTML = teams.map(t => `
                <article class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 class="font-bold text-slate-800 dark:text-white">${t.name}</h3>
                    <p class="text-xs text-slate-500">Coach: ${t.coach_name || 'N/A'}</p>
                </article>
            `).join('');
        }

        // 2. Render for Admin List (Edit/Delete)
        if (adminTeamsList) {
            adminTeamsList.innerHTML = teams.map(t => `
                <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                        <p class="font-bold text-sm">${t.name}</p>
                        <p class="text-[10px] text-slate-500 italic">${t.coach_name || 'No Coach'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editTeam(${t.id}, '${t.name}')" class="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteTeam(${t.id})" class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `).join('');
        }

        // 3. Populate Dropdown
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Select Team...</option>' + 
                teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }
        lucide.createIcons();
    }

    // --- ADD TEAM WITH DUPLICATE CHECK ---
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('team-name').value.trim();
            const coach = document.getElementById('coach-name').value.trim();

            // Check if exists
            const { data: existing } = await db.from('teams').select('id').ilike('name', name);
            if (existing && existing.length > 0) return alert("Error: A team with this name already exists.");

            const { error } = await db.from('teams').insert([{ name, coach_name: coach }]);
            if (error) alert(error.message);
            else { teamForm.reset(); loadData(); }
        });
    }

    // --- ADD PLAYER WITH DUPLICATE CHECK ---
    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const team_id = parseInt(document.getElementById('team-select').value);
            const name = document.getElementById('player-name').value.trim();

            // Check if player exists on THIS team
            const { data: existing } = await db.from('players').select('id').eq('team_id', team_id).ilike('name', name);
            if (existing && existing.length > 0) return alert("Error: This player is already on the roster.");

            const { error } = await db.from('players').insert([{
                team_id, name, position: document.getElementById('player-pos').value,
                age: parseInt(document.getElementById('player-age').value)
            }]);
            if (error) alert(error.message);
            else { alert('Player added!'); playerForm.reset(); }
        });
    }

    loadData();
}

// --- GLOBAL ACTIONS (Called by buttons) ---
async function deleteTeam(id) {
    if (!confirm("Are you sure? This will also delete all players in this team.")) return;
    const { error } = await db.from('teams').delete().eq('id', id);
    if (error) alert(error.message);
    else location.reload();
}

async function editTeam(id, oldName) {
    const newName = prompt("Enter new team name:", oldName);
    if (!newName || newName === oldName) return;
    const { error } = await db.from('teams').update({ name: newName }).eq('id', id);
    if (error) alert(error.message);
    else location.reload();
}

window.addEventListener('load', initSupabase);