// 1. CONFIGURATION
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

let db;

// 2. INITIALIZATION
function initSupabase() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        startApp();
    } catch (err) {
        console.error("Connection error:", err);
    }
}

// 3. MAIN APP LOGIC
async function startApp() {
    const teamsList = document.getElementById('teams-list');
    const teamSelect = document.getElementById('team-select');
    const teamForm = document.getElementById('team-form');
    const playerForm = document.getElementById('player-form');

    // --- FETCH TEAMS ---
    if (teamsList || teamSelect) {
        const { data, error } = await db.from('teams').select('*');
        
        if (error) {
            console.error(error);
        } else {
            // Render to Public Homepage
            if (teamsList) {
                if (data.length === 0) {
                    teamsList.innerHTML = '<p class="text-slate-400 text-sm">No teams found.</p>';
                } else {
                    teamsList.innerHTML = data.map(team => `
                        <article class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                            <div class="flex justify-between items-center mb-4">
                                <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                    <i data-lucide="shield" class="w-5 h-5"></i>
                                </div>
                            </div>
                            <h3 class="font-bold text-slate-800 dark:text-white">${team.name}</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Coach: ${team.coach_name || 'N/A'}</p>
                            <div class="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                <span class="text-[10px] font-bold text-slate-400">REGULAR SEASON</span>
                                <button class="text-xs font-semibold text-blue-600 dark:text-blue-400">Roster</button>
                            </div>
                        </article>
                    `).join('');
                    lucide.createIcons();
                }
            }
            // Populate Admin Dropdown
            if (teamSelect) {
                teamSelect.innerHTML = '<option value="">Select Team...</option>' + 
                    data.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }
        }
    }

    // --- ADD TEAM ---
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('team-name').value;
            const coach = document.getElementById('coach-name').value;
            const { error } = await db.from('teams').insert([{ name, coach_name: coach }]);
            if (error) alert(error.message);
            else location.reload();
        });
    }

    // --- ADD PLAYER ---
    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                team_id: parseInt(document.getElementById('team-select').value),
                name: document.getElementById('player-name').value,
                position: document.getElementById('player-pos').value,
                age: parseInt(document.getElementById('player-age').value),
                phone_number: document.getElementById('player-phone').value
            };
            const { error } = await db.from('players').insert([payload]);
            if (error) alert(error.message);
            else { alert('Player added!'); playerForm.reset(); }
        });
    }
}

window.addEventListener('load', initSupabase);