// Leaderboard functionality
class LeaderboardManager {
    constructor() {
        this.dataStore = new DataStore();
        this.currentFilter = 'revenue';
        this.currentTimeFilter = 'month';
    }

    initialize() {
        this.updateLeaderboard();
        this.updateStats();
    }

    updateStats() {
        const totalStores = this.dataStore.stores.length;
        const totalRevenue = this.dataStore.stores.reduce((sum, store) => {
            const storeRevenue = this.dataStore.transactions
                .filter(tx => tx.storeId === store.id)
                .reduce((txSum, tx) => txSum + tx.amount, 0);
            return sum + storeRevenue;
        }, 0);
        
        document.getElementById('totalStores').textContent = totalStores.toLocaleString();
        document.getElementById('totalRevenue').textContent = this.formatCurrency(totalRevenue);
    }

    updateLeaderboard() {
        const sortedStores = this.getSortedStores();
        this.updatePodium(sortedStores);
        this.updateTable(sortedStores);
    }

    getSortedStores() {
        let storesWithStats = this.dataStore.stores.map(store => {
            const storeTransactions = this.dataStore.transactions.filter(tx => tx.storeId === store.id);
            const revenue = storeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            const orders = storeTransactions.length;
            const daysActive = Math.max(1, Math.floor((new Date() - new Date(store.createdAt)) / (1000 * 60 * 60 * 24)));
            const growth = revenue / daysActive; // Daily revenue as a proxy for growth
            return { ...store, revenue, orders, growth };
        });
        
        // Sort by current filter
        switch (this.currentFilter) {
            case 'revenue':
                storesWithStats.sort((a, b) => b.revenue - a.revenue);
                break;
            case 'orders':
                storesWithStats.sort((a, b) => b.orders - a.orders);
                break;
            case 'growth':
                storesWithStats.sort((a, b) => b.growth - a.growth);
                break;
        }
        
        return storesWithStats;
    }

    updatePodium(stores) {
        const podiumPlaces = ['firstPlace', 'secondPlace', 'thirdPlace'];
        
        podiumPlaces.forEach((placeId, index) => {
            const placeContainer = document.getElementById(placeId);
            if (!placeContainer) return;

            const info = placeContainer.querySelector('.podium-info');
            const store = stores[index];
            
            if (store) {
                info.querySelector('h3').textContent = store.name;
                
                switch (this.currentFilter) {
                    case 'revenue':
                        info.querySelector('p').textContent = this.formatCurrency(store.revenue);
                        break;
                    case 'orders':
                        info.querySelector('p').textContent = `${store.orders} orders`;
                        break;
                    case 'growth':
                        info.querySelector('p').textContent = `${this.formatCurrency(store.growth)}/day`;
                        break;
                }
            } else {
                info.querySelector('h3').textContent = '-';
                info.querySelector('p').textContent = '$0';
            }
        });
    }

    updateTable(stores) {
        const tableContent = document.getElementById('leaderboardContent');
        
        tableContent.innerHTML = stores.slice(3).map((store, index) => {
            const rank = index + 4;
            // For demo, generate random growth percentage for visual flair
            const growthPercent = (Math.random() * 40) - 15;
            
            return `
                <div class="leaderboard-row">
                    <div class="col-rank">
                        <div class="rank-badge">${rank}</div>
                    </div>
                    <div class="col-store">
                        <div class="store-info">
                            <div class="store-name">${store.name}</div>
                            <div class="store-url">${this.formatUrl(store.url)}</div>
                        </div>
                    </div>
                    <div class="col-revenue">
                        <div class="revenue-amount">${this.formatCurrency(store.revenue)}</div>
                    </div>
                    <div class="col-orders">
                        <div>${store.orders}</div>
                    </div>
                    <div class="col-growth">
                        <div class="growth-badge ${growthPercent >= 0 ? 'growth-positive' : 'growth-negative'}">
                            ${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatUrl(url) {
        if (!url) return '';
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Data Storage (re-use from app.js if it were a module system, but defined here for standalone page)
// A lightweight version of the DataStore from app.js, ensuring this page can run independently.
if (typeof DataStore === 'undefined') {
    class DataStore {
        constructor() {
            this.stores = JSON.parse(localStorage.getItem('ecomLeaderStores') || '[]');
            this.transactions = JSON.parse(localStorage.getItem('ecomLeaderTransactions') || '[]');
        }
    }
}

// This variable will be initialized once the DOM is ready.
// Using 'let' allows it to be declared without an initializer.
let leaderboardManager;

// Global functions for HTML event handlers
function filterLeaderboard(event, type) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update leaderboard
    leaderboardManager.currentFilter = type;
    leaderboardManager.updateLeaderboard();
}

function updateTimeFilter() {
    const timeFilter = document.getElementById('timeFilter').value;
    leaderboardManager.currentTimeFilter = timeFilter;
    leaderboardManager.updateLeaderboard();
}

// Initialize leaderboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create the leaderboard manager instance here
    leaderboardManager = new LeaderboardManager();
    leaderboardManager.initialize();
});