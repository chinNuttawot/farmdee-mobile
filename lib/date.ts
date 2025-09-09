export const todayISO = () => new Date().toISOString().slice(0, 10);
export function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
export function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}
export function inRange(d: Date, start: Date, end: Date) {
    const x = startOfDay(d).getTime();
    return x >= startOfDay(start).getTime() && x <= startOfDay(end).getTime();
}
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
export function formatLocalYYYYMMDD(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function daysInMonth(year: number, month0: number) {
    return new Date(year, month0 + 1, 0).getDate();
}
export function monthMatrix(year: number, month0: number) {
    const first = new Date(year, month0, 1);
    const firstWeekday = first.getDay();
    const prevDays = daysInMonth(year, month0 - 1);
    const totalDays = daysInMonth(year, month0);

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = firstWeekday - 1; i >= 0; i--) {
        const d = new Date(year, month0 - 1, prevDays - i);
        cells.push({ date: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
        cells.push({ date: new Date(year, month0, d), isCurrentMonth: true });
    }
    while (cells.length < 42) {
        const last = cells[cells.length - 1].date;
        const next = new Date(last);
        next.setDate(last.getDate() + 1);
        cells.push({ date: next, isCurrentMonth: next.getMonth() === month0 });
    }
    return cells;
}
