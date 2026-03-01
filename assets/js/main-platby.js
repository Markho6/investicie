/**
 * Payment data from xlsx.
 * Amounts and names are static, dates are computed dynamically.
 *
 * dayRule:
 *   'next' → =DATE(YEAR(H2), IF(DAY(H2)<10, MONTH(H2), MONTH(H2)+1), day)
 *            These are early-month payments (1st, 4th, 6th) that move to
 *            the next month when tomorrow's day >= 10.
 *   'curr' → =DATE(YEAR(H2), MONTH(H2), day)
 *            These payments always use the current month of tomorrow.
 */
const payments = [
    { amount: 30,    name: 'Šimek - nájom kancelárie',       info: 'trvalý príkaz', dayRule: 'next', day: 1  },
    // { amount: 0,     name: 'Orange faktúra Katka',           info: 'inkaso',         dayRule: 'next', day: 4  },
    { amount: 12,    name: 'Orange faktúra Marek',           info: 'inkaso',         dayRule: 'next', day: 6  },
    { amount: 27,    name: 'Vodárenská spoločnosť',          info: 'trvalý príkaz', dayRule: 'curr', day: 12 },
    { amount: 100,   name: 'EIC - Marek',                    info: 'trvalý príkaz', dayRule: 'curr', day: 12 },
    { amount: 50,    name: 'EIC - deti',                     info: 'trvalý príkaz', dayRule: 'curr', day: 12 },
    { amount: 50,    name: 'IAD Marek',                      info: 'trvalý príkaz', dayRule: 'curr', day: 12 },
    { amount: 20,    name: 'Raiffeisen sporenie na rezervu', info: 'trvalý príkaz', dayRule: 'curr', day: 14 },
    // { amount: 0,     name: 'Skylink',                        info: '–',              dayRule: 'curr', day: 15 },
    { amount: 32,    name: 'Allianz Marek',                  info: 'trvalý príkaz', dayRule: 'curr', day: 25 },
    { amount: 69.26, name: 'Greenlogy',                      info: 'trvalý príkaz', dayRule: 'curr', day: 25 },
    { amount: 20,    name: 'NN Katka',                       info: 'trvalý príkaz', dayRule: 'curr', day: 29 },
    { amount: 28.26, name: 'NN Marek',                       info: 'trvalý príkaz', dayRule: 'curr', day: 29 }
];

// ===== Date calculation (mirrors xlsx formulas) =====

/** H2 = TODAY()+1 */
function getTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Calculates the NEXT upcoming payment date for a row.
 * If the payment day has already passed this month, it moves to next month.
 * This ensures we always show future dates, never past ones.
 */
function getPaymentDate(payment, today) {
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based

    // Start with current month
    let candidate = new Date(year, month, payment.day);

    // If this date is before today, move to next month
    if (candidate < today) {
        candidate = new Date(year, month + 1, payment.day);
    }

    return candidate;
}

/**
 * H3 (výplata) = DATE(YEAR(H2), IF(DAY(H2)<10, MONTH(H2), MONTH(H2)+1), 10)
 */
function getPayday(tomorrow) {
    const year = tomorrow.getFullYear();
    const month = tomorrow.getMonth();
    const dayOfTomorrow = tomorrow.getDate();
    const targetMonth = dayOfTomorrow < 10 ? month : month + 1;
    return new Date(year, targetMonth, 10);
}

// ===== Formatting =====

function formatDate(date) {
    return date.getDate().toString().padStart(2, '0') + '.' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '.' +
            date.getFullYear();
}

function formatAmount(amount) {
    return new Intl.NumberFormat('sk-SK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + ' €';
}

function getBadgeClass(info) {
    if (info === 'inkaso') return 'badge badge-inkaso';
    if (info === '–' || info === '-') return 'badge badge-other';
    return 'badge';
}

// ===== Count-up animation =====

function animateValue(element, endValue, duration) {
    const start = performance.now();
    function step(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        element.textContent = formatAmount(endValue * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ===== Main render =====

function render() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payday = getPayday(today);

    // Info cards
    document.getElementById('todayDate').textContent = formatDate(today);
    document.getElementById('paydayDate').textContent = formatDate(payday);

    // Compute payment dates
    const rows = payments.map(p => ({
        ...p,
        date: getPaymentDate(p, today)
    }));

    // Sum of payments between today and payday (inclusive)
    const todayMs = today.getTime();
    const paydayMs = payday.getTime();

    let sumBetween = 0;
    rows.forEach(r => {
        const t = r.date.getTime();
        if (t >= todayMs && t <= paydayMs) {
            sumBetween += r.amount;
        }
    });

    animateValue(document.getElementById('sumToPayday'), sumBetween, 800);

    // Total
    const total = payments.reduce((s, p) => s + p.amount, 0);
    animateValue(document.getElementById('totalAmount'), total, 1000);

    // Sort: upcoming payments first (>= today, ascending by date),
    // then past payments (< today, ascending by date)
    const sorted = [...rows].sort((a, b) => {
        const aMs = a.date.getTime();
        const bMs = b.date.getTime();
        const aUpcoming = aMs >= todayMs;
        const bUpcoming = bMs >= todayMs;

        // Upcoming before past
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;

        // Within same group, sort by date ascending
        return aMs - bMs;
    });

    // Build table
    const tbody = document.getElementById('paymentsBody');
    let html = '';

    sorted.forEach((r, i) => {
        const t = r.date.getTime();
        const hl = t >= todayMs && t <= paydayMs && r.amount > 0;
        html += `<tr${hl ? ' class="highlight"' : ''}>
            <td>${formatDate(r.date)}</td>
            <td>${formatAmount(r.amount)}</td>
            <td>${r.name}</td>
            <td><span class="${getBadgeClass(r.info)}">${r.info}</span></td>
        </tr>`;
    });


    tbody.innerHTML = html;

    // Last update timestamp
    const now = new Date();
    document.getElementById('lastUpdate').textContent =
        formatDate(now) + ' ' +
        now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0');
}

window.addEventListener('load', render);