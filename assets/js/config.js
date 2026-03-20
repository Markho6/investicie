// Konfigurácia - zoznam všetkých povolených používateľov
const CONFIG = {
    users: ["sanob", "katar"]  // Pridaj všetkých používateľov, ktorí budú používať stránku
};

// Automatické načítanie a uloženie mena používateľa
function getCurrentUser() {
    let username = localStorage.getItem('currentUser');
    
    if (!username) {
        // Ak ešte nebol nastavený, požiada o výber
        const userList = CONFIG.users.join('\n');
        username = prompt(`Vyber svoje Windows meno:\n\n${userList}`, CONFIG.users[0]);
        
        if (username && CONFIG.users.includes(username)) {
            localStorage.setItem('currentUser', username);
        } else {
            alert('Neplatné meno používateľa!');
            return null;
        }
    }
    
    return username;
}

// Getter pre aktuálneho používateľa
Object.defineProperty(CONFIG, 'username', {
    get: function() {
        return getCurrentUser();
    }
});
