// Count-up animácia pre sumy
function animateValue(element, endValue, duration) {
    const start = performance.now();
    function step(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = endValue * eased;
        element.textContent = formatAmount(current) + ' €';
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// Načítanie dát z HTML
function loadData() {
    const marekEl = document.getElementById('marekAmount');
    const detiEl = document.getElementById('detiAmount');
    const katkaEl = document.getElementById('katkaAmount');
    const totalEl = document.getElementById('totalAmount');

    const marekAmount = parseFloat(marekEl.getAttribute('data-value'));
    const detiAmount = parseFloat(detiEl.getAttribute('data-value'));
    const katkaAmount = parseFloat(katkaEl.getAttribute('data-value'));

    const data = [
        { name: 'Marek EIC', amount: marekAmount },
        { name: 'Katka Amundi', amount: katkaAmount },
        { name: 'Deti EIC', amount: detiAmount }
    ];

    // Výpočet celkovej sumy
    const totalAmount = marekAmount + detiAmount + katkaAmount;

    // Animované zobrazenie súm
    animateValue(marekEl, marekAmount, 600);
    animateValue(detiEl, detiAmount, 750);
    animateValue(katkaEl, katkaAmount, 900);
    animateValue(totalEl, totalAmount, 1000);

    // Vytvorenie grafu
    createChart(data);
}

function createChart(data) {
    const ctx = document.getElementById('investmentChart').getContext('2d');
    const labels = data.map(item => item.name);
    const amounts = data.map(item => item.amount);
    const cs = getComputedStyle(document.documentElement);
    const colors = [
        cs.getPropertyValue('--color-amount-1').trim(),
        cs.getPropertyValue('--color-amount-2').trim(),
        cs.getPropertyValue('--color-amount-3').trim()
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: cs.getPropertyValue('--chart-border').trim(),
                hoverBorderColor: cs.getPropertyValue('--bg-card-hover-border').trim(),
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        color: cs.getPropertyValue('--legend-color').trim(),
                        font: {
                            size: 13,
                            family: "'Inter', 'Segoe UI', sans-serif"
                        },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const ds = chart.data.datasets[0];
                            const total = ds.data.reduce((a, b) => a + b, 0);
                            const legendColor = getComputedStyle(document.documentElement).getPropertyValue('--legend-color').trim();
                            return chart.data.labels.map((label, i) => ({
                                text: label + ' (' + ((ds.data[i] / total) * 100).toFixed(1) + '%)',
                                fillStyle: ds.backgroundColor[i],
                                fontColor: legendColor,
                                strokeStyle: 'transparent',
                                hidden: !chart.getDataVisibility(i),
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: cs.getPropertyValue('--tooltip-bg').trim(),
                    titleColor: cs.getPropertyValue('--tooltip-title').trim(),
                    bodyColor: cs.getPropertyValue('--tooltip-body').trim(),
                    borderColor: cs.getPropertyValue('--tooltip-border').trim(),
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12,
                    bodyFont: { family: "'Inter', sans-serif" },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatAmount(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return ` ${label}: ${value} € (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function formatAmount(amount) {
    return new Intl.NumberFormat('sk-SK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Automatické načítanie po načítaní stránky
window.addEventListener('load', loadData);