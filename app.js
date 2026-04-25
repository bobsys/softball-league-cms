// 1. CONFIGURATION
const SUPABASE_URL = 'https://gwcfzujfyzusyuaazslx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CXlvnbzmTyV_HuRVJNnB1A_SjRqfO2K';

let db;

// 2. INITIALIZATION
function init() {
    try {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        loadAllData();
        setupForms();
        setupThemeToggle();
    } catch (e) {
        console.error("Initialization failed:", e);
    }
}

// 3. DATA LOADING & RENDERING
// ... (Keep existing CONFIG and INIT) ...

async function loadAllData() {
    // ... (Keep existing Teams, Roster, and Docs fetching) ...

    // FORUM & ANNOUNCEMENT LOGIC
    const annList = document.getElementById('announcements-list');
    const forumList = document.getElementById('forum-list');
    const adminForumList = document.getElementById('admin-forum-list');

    if (annList || forumList || adminForumList) {
        const { data: allPosts } = await db.from('forum_posts').select('*').order('created_at', { ascending: false });

        if (allPosts) {
            // A. RENDER BLOG (ANNOUNCEMENTS) ON HOME PAGE
            if (annList) {
                const news = allPosts.filter(p => p.post_type === 'announcement');
                annList.innerHTML = news.map(p => `
                    <article class="bg-white dark:bg-slate-900 p-8 rounded-3xl border-l-4 border-l-red-500 shadow-sm">
                        <h3 class="text-2xl font-black mb-2">${p.title}</h3>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">${p.content}</p>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Update • ${new Date(p.created_at).toLocaleDateString()}</span>
                    </article>`).join('') || '<p class="text-slate-400 italic text-sm">No news today.</p>';
            }

            // B. RENDER FORUM (THREADED DISCUSSIONS)
            if (forumList) {
                const topLevelPosts = allPosts.filter(p => p.post_type !== 'announcement' && !p.parent_id);
                
                forumList.innerHTML = topLevelPosts.map(p => {
                    const replies = allPosts.filter(r => r.parent_id === p.id);
                    return `
                    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                        <div class="p-8">
                            <h3 class="text-2xl font-black mb-2">${p.title}</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">${p.content}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold text-slate-400 italic">Posted by ${p.author_name}</span>
                                <button onclick="openReplyModal(${p.id}, '${p.title}')" class="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Reply</button>
                            </div>
                        </div>
                        
                        <!-- REPLIES SECTION -->
                        ${replies.length ? `
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            ${replies.map(r => `
                                <div class="pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                    <p class="text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">${r.content}</p>
                                    <p class="text-[9px] font-bold text-slate-400 uppercase">— ${r.author_name}</p>
                                </div>`).join('')}
                        </div>` : ''}
                    </div>`;
                }).join('');
            }

            // C. ADMIN LIST
            if (adminForumList) {
                adminForumList.innerHTML = allPosts.map(p => `
                    <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div class="text-left">
                            <p class="font-bold text-sm">${p.post_type === 'announcement' ? '📢 ' : ''}${p.title || 'Reply'}</p>
                            <p class="text-[10px] text-slate-500 italic">by ${p.author_name}</p>
                        </div>
                        <button onclick="window.deletePost(${p.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>`).join('');
            }
        }
    }
    lucide.createIcons();
}

// FORUM FORM UPDATE
function setupForms() {
    // ... (Keep existing Team/Player/Doc forms) ...

    const forumForm = document.getElementById('forum-form');
    if (forumForm) {
        forumForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isAnnouncement = document.getElementById('post-is-announcement')?.checked;
            const parentId = document.getElementById('post-parent-id')?.value;

            const payload = {
                author_name: document.getElementById('post-author').value.trim(),
                title: parentId ? "" : document.getElementById('post-title').value.trim(),
                content: document.getElementById('post-content').value.trim(),
                post_type: isAnnouncement ? 'announcement' : 'discussion',
                parent_id: parentId ? parseInt(parentId) : null
            };

            const { error } = await db.from('forum_posts').insert([payload]);
            if (error) alert(error.message); else location.reload();
        });
    }
}

// REPLY MODAL LOGIC
window.openReplyModal = (parentId, parentTitle) => {
    document.getElementById('post-modal').classList.remove('hidden');
    document.getElementById('post-title').value = "Re: " + parentTitle;
    document.getElementById('post-title').disabled = true;
    
    // Add a hidden input to track parent
    let parentInput = document.getElementById('post-parent-id');
    if (!parentInput) {
        parentInput = document.createElement('input');
        parentInput.type = 'hidden';
        parentInput.id = 'post-parent-id';
        document.getElementById('forum-form').appendChild(parentInput);
    }
    parentInput.value = parentId;
};
// 5. UTILITIES & GLOBAL ACTIONS
function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
}

window.deleteTeam = async (id) => { if (confirm("Delete team?")) { await db.from('teams').delete().eq('id', id); location.reload(); } };
window.editTeam = async (id, name) => { const n = prompt("Rename:", name); if (n) { await db.from('teams').update({ name: n }).eq('id', id); location.reload(); } };
window.deletePlayer = async (id) => { if (confirm("Delete player?")) { await db.from('players').delete().eq('id', id); location.reload(); } };
window.deletePost = async (id) => { if (confirm("Delete post?")) { await db.from('forum_posts').delete().eq('id', id); location.reload(); } };

window.editPlayer = async (id) => {
    const modal = document.getElementById('edit-modal');
    const { data: p } = await db.from('players').select('*').eq('id', id).single();
    const { data: teams } = await db.from('teams').select('id, name').order('name');
    document.getElementById('edit-player-team').innerHTML = teams.map(t => `<option value="${t.id}" ${t.id === p.team_id ? 'selected' : ''}>${t.name}</option>`).join('');
    document.getElementById('edit-player-id').value = p.id;
    document.getElementById('edit-player-name').value = p.name;
    document.getElementById('edit-player-age').value = p.age || '';
    document.getElementById('edit-player-pos').value = p.position || '';
    document.getElementById('edit-player-phone').value = p.phone_number || '';
    modal.classList.remove('hidden');
    lucide.createIcons();
};

window.closeModal = () => document.getElementById('edit-modal').classList.add('hidden');

window.savePlayerEdit = async function() {
    const id = document.getElementById('edit-player-id').value;
    const updates = {
        name: document.getElementById('edit-player-name').value,
        team_id: parseInt(document.getElementById('edit-player-team').value),
        age: parseInt(document.getElementById('edit-player-age').value) || null,
        position: document.getElementById('edit-player-pos').value,
        phone_number: document.getElementById('edit-player-phone').value
    };
    await db.from('players').update(updates).eq('id', id);
    window.closeModal(); location.reload();
};

window.addEventListener('load', init);